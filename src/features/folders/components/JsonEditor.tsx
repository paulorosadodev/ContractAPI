import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Check, Copy } from "lucide-react";
import type { ObjectNode } from "../model/folderTypes";
import { objectToJson, highlightJson } from "../utils/codeUtils";

interface JsonEditorProps {
    value: string;
    onChange: (v: string) => void;
    onBlur: () => void;
    disabled?: boolean;
    objects?: ObjectNode[];
}

/**
 * Componente para edição de JSON estilo Swagger com autocomplete de objetos
 * Pressione "/" para abrir o menu de inserção de objetos
 */
export function JsonEditor({ value, onChange, onBlur, disabled, objects = [] }: JsonEditorProps) {
    const [error, setError] = useState<string | null>(null);
    const [showObjectMenu, setShowObjectMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [copied, setCopied] = useState(false);
    const [slashPosition, setSlashPosition] = useState<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
    const menuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const isInsertingRef = useRef(false);

    // Apenas interfaces devem aparecer no menu (não enums)
    const interfaceObjects = useMemo(() => objects.filter((obj) => obj.kind !== "enum"), [objects]);

    // Fecha menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowObjectMenu(false);
            }
        };
        if (showObjectMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showObjectMenu]);

    const validateJson = (text: string): boolean => {
        if (!text.trim()) return true;
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    };

    const formatJson = () => {
        if (!value.trim()) return;
        try {
            const parsed = JSON.parse(value);
            const formatted = JSON.stringify(parsed, null, 2);
            onChange(formatted);
            setError(null);
        } catch {
            setError("JSON inválido");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Se menu está aberto, navegar com setas e Enter
        if (showObjectMenu) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMenuIndex((prev) => {
                    const next = prev < interfaceObjects.length - 1 ? prev + 1 : 0;
                    menuItemRefs.current[next]?.scrollIntoView({ block: "nearest" });
                    return next;
                });
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMenuIndex((prev) => {
                    const next = prev > 0 ? prev - 1 : interfaceObjects.length - 1;
                    menuItemRefs.current[next]?.scrollIntoView({ block: "nearest" });
                    return next;
                });
                return;
            }
            if (e.key === "Enter" && selectedMenuIndex >= 0 && selectedMenuIndex < interfaceObjects.length) {
                e.preventDefault();
                insertObject(interfaceObjects[selectedMenuIndex]);
                return;
            }
        }

        // Detecta tecla "/" para abrir menu
        if (e.key === "/") {
            // Salva a posição onde a / será inserida (após digitar a /)
            const textarea = textareaRef.current;
            if (textarea) {
                const cursorPos = textarea.selectionStart;
                // A / será inserida na posição atual, então salvamos cursorPos
                setSlashPosition(cursorPos);
                const rect = textarea.getBoundingClientRect();
                // Calcula posição garantindo que o menu fique visível na tela
                const menuWidth = 224; // w-56 = 14rem = 224px
                const menuHeight = 200; // altura aproximada do menu
                let x = rect.left + 20;
                let y = rect.top + 40;

                // Ajusta se sair pela direita
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 16;
                }
                // Ajusta se sair por baixo
                if (y + menuHeight > window.innerHeight) {
                    y = rect.top - menuHeight - 10;
                }
                // Garante mínimo
                x = Math.max(16, x);
                y = Math.max(16, y);

                setMenuPosition({ x, y });
            }
            isInsertingRef.current = true;
            setSelectedMenuIndex(0); // Começa com primeiro item selecionado
            setShowObjectMenu(true);
        }
        // Fecha menu com Escape
        if (e.key === "Escape") {
            setShowObjectMenu(false);
            setSlashPosition(null);
            setSelectedMenuIndex(-1);
            isInsertingRef.current = false;
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        // Não faz nada se estiver inserindo objeto
        if (isInsertingRef.current) return;

        setIsFocused(false);

        // Mostra aviso se JSON inválido
        if (value.trim() && !validateJson(value)) {
            setError("JSON inválido");
        } else {
            setError(null);
        }
        onBlur();
    };

    const handleChange = (text: string) => {
        setError(null);
        onChange(text);
    };

    const handleCopy = async () => {
        if (!value.trim()) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // falha silenciosa
        }
    };

    const insertObject = (obj: ObjectNode) => {
        const json = objectToJson(obj, objects);
        const formatted = JSON.stringify(json, null, 2);

        // Pega o valor atual do textarea diretamente
        const currentValue = textareaRef.current?.value || value;

        // Substitui a "/" na posição onde foi digitada
        let newValue: string;
        if (slashPosition !== null) {
            const beforeSlash = currentValue.slice(0, slashPosition);
            const afterSlash = currentValue.slice(slashPosition + 1);
            newValue = beforeSlash + formatted + afterSlash;
        } else {
            newValue = currentValue + formatted;
        }

        // Propaga imediatamente
        onChange(newValue);

        // Fecha menu
        setShowObjectMenu(false);
        setSlashPosition(null);

        // Reset inserting flag e foca no textarea
        setTimeout(() => {
            isInsertingRef.current = false;
            textareaRef.current?.focus();
        }, 50);
    };

    const lineCount = Math.max(value.split("\n").length, 1);

    return (
        <div className={`rounded-lg border overflow-hidden relative ${error ? "border-red-500" : "border-(--app-border)"}`}>
            {/* Header estilo Swagger */}
            <div className="flex items-center justify-between px-3 py-2 bg-(--app-surface-2) border-b border-(--app-border)">
                <span className="text-xs font-medium text-(--app-muted)">application/json</span>
                <div className="flex items-center gap-2">
                    {error && <span className="text-xs text-red-500">{error}</span>}
                    <button type="button" onClick={handleCopy} disabled={disabled || !value.trim()} className="text-xs px-2 py-1 rounded bg-(--app-surface) border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-bg) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copiado!" : "Copiar"}
                    </button>
                    <button type="button" onClick={formatJson} disabled={disabled || !value.trim()} className="text-xs px-2 py-1 rounded bg-(--app-surface) border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-bg) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        Formatar
                    </button>
                </div>
            </div>

            {/* Editor com números de linha */}
            <div className="flex bg-(--code-bg) relative">
                {/* Números de linha */}
                <div className="flex flex-col py-3 px-2 text-right select-none border-r border-(--app-border) bg-(--app-surface)">
                    {Array.from({ length: lineCount }, (_, i) => (
                        <span key={i} className="text-xs font-mono text-(--app-muted) leading-5 h-5">
                            {i + 1}
                        </span>
                    ))}
                </div>

                {/* Área de código - mostra syntax highlight quando não focado */}
                {isFocused ? (
                    <textarea ref={textareaRef} value={value} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleFocus} onBlur={handleBlur} disabled={disabled} spellCheck={false} placeholder='Digite "/" para inserir um objeto' className="flex-1 p-3 text-sm font-mono leading-5 bg-transparent text-(--app-fg) resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-40 placeholder:text-(--app-muted)" />
                ) : (
                    <div
                        onClick={() => {
                            if (disabled) return;
                            setIsFocused(true);
                            // Foca no textarea após ele aparecer e move cursor para o final
                            setTimeout(() => {
                                const textarea = textareaRef.current;
                                if (textarea) {
                                    textarea.focus();
                                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                                }
                            }, 0);
                        }}
                        className={`flex-1 p-3 text-sm font-mono leading-5 min-h-40 cursor-text whitespace-pre-wrap overflow-auto ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {value.trim() ? <code dangerouslySetInnerHTML={{ __html: highlightJson(value) }} /> : <span className="text-(--app-muted)">Digite "/" para inserir um objeto</span>}
                    </div>
                )}
            </div>

            {/* Menu de autocomplete de objetos - Portal para evitar corte */}
            {showObjectMenu &&
                createPortal(
                    <AnimatePresence>
                        <motion.div ref={menuRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "fixed", left: menuPosition.x, top: menuPosition.y }} className="z-9999 bg-(--app-surface) border border-(--app-border) rounded-lg shadow-xl overflow-hidden w-64">
                            <div className="px-3 py-2 border-b border-(--app-border) bg-(--app-surface-2)">
                                <span className="text-xs font-medium text-(--app-muted)">Inserir objeto como JSON</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                {interfaceObjects.length > 0 ? (
                                    interfaceObjects.map((obj, idx) => (
                                        <button
                                            key={obj.id}
                                            ref={(el) => {
                                                menuItemRefs.current[idx] = el;
                                            }}
                                            type="button"
                                            onClick={() => insertObject(obj)}
                                            className={`w-full px-3 py-2 text-left text-sm cursor-pointer flex items-center gap-2 text-(--app-fg) transition-colors ${selectedMenuIndex === idx ? "bg-(--app-bg)" : "hover:bg-(--app-bg)"}`}
                                        >
                                            <Box className="w-4 h-4 text-(--app-muted)" />
                                            <span className="truncate">{obj.name}</span>
                                            <span className="text-xs text-(--app-muted) ml-auto shrink-0">{obj.kind}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-sm text-(--app-muted)">Nenhuma interface criada</div>
                                )}
                            </div>
                            <div className="px-3 py-1.5 border-t border-(--app-border) flex items-center gap-3 text-[10px] text-(--app-muted)">
                                <span>↑↓ navegar</span>
                                <span>Enter selecionar</span>
                                <button type="button" onClick={() => setShowObjectMenu(false)} className="ml-auto hover:text-(--app-fg) cursor-pointer">
                                    Esc cancelar
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}

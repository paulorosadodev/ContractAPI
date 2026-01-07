import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
    id: string;
    label: string;
    icon?: ReactNode;
    description?: string;
    section?: string;
    disabled?: boolean;
}

export interface DropdownSection {
    id: string;
    label: string;
}

interface DropdownProps {
    items: DropdownItem[];
    sections?: DropdownSection[];
    showSections?: boolean;
    value?: string;
    onSelect: (item: DropdownItem) => void;
    onClose?: () => void;
    trigger?: ReactNode;
    triggerClassName?: string;
    placeholder?: string;
    disabled?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
    emptyMessage?: string;
    className?: string;
    menuClassName?: string;
    itemClassName?: string;
    selectedItemClassName?: string;
    maxHeight?: string;
    minWidth?: number;
    fullWidth?: boolean;
    showArrow?: boolean;
    // Para uso como menu controlado externamente (sem trigger interno)
    isOpen?: boolean;
    anchorPosition?: { x: number; y: number };
}

export function Dropdown({ items, sections, showSections = false, value, onSelect, onClose, trigger, triggerClassName, placeholder = "Selecione...", disabled = false, header, footer, emptyMessage = "Nenhum item disponível", className = "", menuClassName = "", itemClassName = "", selectedItemClassName = "bg-purple-600 text-white", maxHeight = "max-h-52", minWidth, fullWidth = false, showArrow = true, isOpen: controlledIsOpen, anchorPosition }: DropdownProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Determina se é controlado externamente
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const setIsOpen = useCallback(
        (open: boolean) => {
            if (!isControlled) {
                setInternalIsOpen(open);
            }
            if (!open && onClose) {
                onClose();
            }
        },
        [isControlled, onClose],
    );

    // Agrupa items por seção se showSections for true
    const groupedItems =
        showSections && sections
            ? sections
                  .map((section) => ({
                      section,
                      items: items.filter((item) => item.section === section.id),
                  }))
                  .filter((group) => group.items.length > 0)
            : null;

    // Lista plana de items para navegação
    const flatItems = items.filter((item) => !item.disabled);

    // Calcula posição do menu
    useEffect(() => {
        if (isOpen) {
            if (anchorPosition) {
                // Menu controlado com posição fixa
                const menuWidth = minWidth || 224;
                const menuHeight = 250;
                let x = anchorPosition.x;
                let y = anchorPosition.y;

                // Ajusta se sair pela direita
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 16;
                }
                // Ajusta se sair por baixo
                if (y + menuHeight > window.innerHeight) {
                    y = anchorPosition.y - menuHeight - 10;
                }
                // Garante mínimo
                x = Math.max(16, x);
                y = Math.max(16, y);

                setPosition({ top: y, left: x, width: menuWidth });
            } else if (triggerRef.current) {
                // Menu com trigger - posiciona abaixo do trigger
                const rect = triggerRef.current.getBoundingClientRect();
                const menuWidth = minWidth || rect.width;
                const menuHeight = 250; // altura aproximada do menu

                let x = rect.left;
                let y = rect.bottom + 4;

                // Ajusta se sair pela direita
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 16;
                }
                // Ajusta se sair por baixo - abre pra cima
                if (y + menuHeight > window.innerHeight) {
                    y = rect.top - menuHeight - 4;
                }
                // Garante mínimo
                x = Math.max(16, x);
                y = Math.max(16, y);

                setPosition({
                    top: y,
                    left: x,
                    width: menuWidth,
                });
            }
        } else {
            setPosition(null);
            setSelectedIndex(-1);
        }
    }, [isOpen, anchorPosition, minWidth]);

    // Click outside para fechar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, setIsOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const next = prev < flatItems.length - 1 ? prev + 1 : 0;
                        itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
                        return next;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const next = prev > 0 ? prev - 1 : flatItems.length - 1;
                        itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
                        return next;
                    });
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
                        onSelect(flatItems[selectedIndex]);
                        setIsOpen(false);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    setIsOpen(false);
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, selectedIndex, flatItems, onSelect, setIsOpen]);

    const handleSelect = (item: DropdownItem) => {
        if (item.disabled) return;
        onSelect(item);
        setIsOpen(false);
    };

    const renderItem = (item: DropdownItem, globalIndex: number) => {
        const isSelected = value === item.id;
        const isHighlighted = selectedIndex === globalIndex;

        return (
            <button
                key={item.id}
                ref={(el) => {
                    itemRefs.current[globalIndex] = el;
                }}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSelected ? selectedItemClassName : isHighlighted ? "bg-(--app-bg)" : "text-(--app-fg) hover:bg-(--app-bg)"} ${itemClassName}`}
            >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate flex-1 text-left">{item.label}</span>
                {item.description && <span className="text-xs text-(--app-muted) ml-auto shrink-0">{item.description}</span>}
            </button>
        );
    };

    const selectedItem = items.find((item) => item.id === value);

    // Renderiza o menu
    const menu = isOpen && position && (
        <AnimatePresence>
            <motion.div ref={menuRef} initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.15 }} className={`fixed z-9999 rounded-lg border border-(--app-border) bg-(--app-surface) shadow-xl overflow-hidden ${menuClassName}`} style={{ top: position.top, left: position.left, minWidth: position.width }}>
                {header && <div className="px-3 py-2 border-b border-(--app-border) bg-(--app-surface-2)">{header}</div>}

                <div className={`${maxHeight} overflow-y-auto`}>
                    {flatItems.length > 0 ? (
                        groupedItems ? (
                            // Renderiza com seções
                            groupedItems.map((group) => (
                                <div key={group.section.id}>
                                    <div className="px-2 py-1.5 text-[10px] font-semibold text-(--app-muted) uppercase tracking-wider bg-(--app-surface-2)">{group.section.label}</div>
                                    {group.items.map((item) => {
                                        // Encontra o índice global do item
                                        const globalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                                        return renderItem(item, globalIndex);
                                    })}
                                </div>
                            ))
                        ) : (
                            // Renderiza lista simples
                            flatItems.map((item, idx) => renderItem(item, idx))
                        )
                    ) : (
                        <div className="px-3 py-4 text-center text-sm text-(--app-muted)">{emptyMessage}</div>
                    )}
                </div>

                {footer && <div className="px-3 py-2 border-t border-(--app-border)">{footer}</div>}
            </motion.div>
        </AnimatePresence>
    );

    return (
        <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
            {/* Trigger (se não for controlado externamente) */}
            {!isControlled &&
                (trigger ? (
                    <button ref={triggerRef} type="button" onClick={() => setIsOpen(!isOpen)} disabled={disabled} className={`flex items-center justify-between gap-2 ${fullWidth ? "w-full" : ""} ${triggerClassName}`}>
                        {trigger}
                        {showArrow && <ChevronDown className={`size-3.5 text-(--app-muted) transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />}
                    </button>
                ) : (
                    <button ref={triggerRef} type="button" onClick={() => setIsOpen(!isOpen)} disabled={disabled} className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) focus:outline-none focus:ring-2 focus:ring-(--app-accent) cursor-pointer min-w-28 disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${triggerClassName}`}>
                        <span className="truncate">{selectedItem ? selectedItem.label : placeholder}</span>
                        {showArrow && <ChevronDown className={`size-3.5 text-(--app-muted) transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                    </button>
                ))}

            {/* Menu via Portal */}
            {createPortal(menu, document.body)}
        </div>
    );
}

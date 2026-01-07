import { useState } from "react";
import { Box, Check, Copy, List, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Field, ObjectNode } from "../model/folderTypes";
import { TypeDropdown, canBeArray } from "./FolderExplorer";
import { FieldNameInput } from "./FieldNameInput";
import { EnumValueInput } from "./EnumValueInput";
import { generateTypeScriptCode, generateTypeScriptCodeHighlighted, objectToJson, highlightJson } from "../utils/codeUtils";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

interface ObjectDetailViewProps {
    object: ObjectNode;
    objects: ObjectNode[];
    isConnected: boolean;
    onBack: () => void;
    onUpdate: (updates: Partial<ObjectNode>) => void;
    onDelete: () => void;
    onSelectObject: (id: string) => void;
}

export function ObjectDetailView({ object, objects, isConnected, onBack, onUpdate, onDelete, onSelectObject }: ObjectDetailViewProps) {
    const [copied, setCopied] = useState(false);
    const [jsonCopied, setJsonCopied] = useState(false);
    const [previewTab, setPreviewTab] = useState<"ts" | "json">("ts");
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameInputValue, setRenameInputValue] = useState("");

    const handleCopyCode = async () => {
        const code = generateTypeScriptCode(object);
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpdateField = (fieldIndex: number, updates: Partial<Field>) => {
        const newFields = [...object.fields];
        newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
        onUpdate({ fields: newFields });
    };

    const handleDeleteField = (fieldIndex: number) => {
        const newFields = object.fields.filter((_, i) => i !== fieldIndex);
        onUpdate({ fields: newFields });
    };

    const handleAddField = () => {
        const newField: Field = { id: crypto.randomUUID(), name: "", type: "string", required: false };
        onUpdate({ fields: [...object.fields, newField] });
    };

    // Handlers para enum values
    const handleUpdateEnumValue = (index: number, newValue: string) => {
        if (object.kind !== "enum") return;
        const newEnumValues = [...(object.enumValues || [])];
        newEnumValues[index] = newValue.toUpperCase().replace(/[^A-Z0-9_]/g, "");
        onUpdate({ enumValues: newEnumValues });
    };

    const handleDeleteEnumValue = (index: number) => {
        if (object.kind !== "enum") return;
        const newEnumValues = (object.enumValues || []).filter((_, i) => i !== index);
        onUpdate({ enumValues: newEnumValues });
    };

    const handleAddEnumValue = () => {
        if (object.kind !== "enum") return;
        const newEnumValues = [...(object.enumValues || []), ""];
        onUpdate({ enumValues: newEnumValues });
    };

    const openRenameModal = () => {
        setRenameInputValue(object.name);
        setRenameModalOpen(true);
    };

    const handleRenameModalConfirm = () => {
        if (!renameInputValue.trim()) return;
        onUpdate({ name: renameInputValue.trim() });
        setRenameModalOpen(false);
        setRenameInputValue("");
    };

    const handleRenameModalClose = () => {
        setRenameModalOpen(false);
        setRenameInputValue("");
    };

    return (
        <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
            {/* Header com nome e botões de ação */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <button type="button" onClick={onBack} className="lg:hidden flex items-center justify-center size-8 rounded-md text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface) cursor-pointer" title="Voltar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    {object.kind === "enum" ? <List className="size-6 text-purple-500 shrink-0" /> : <Box className="size-6 text-(--app-accent) shrink-0" />}
                    <h2 className="text-lg md:text-2xl font-semibold text-(--app-fg) truncate">{object.name}</h2>
                    <span className="text-xs text-(--app-muted) bg-(--app-surface) px-2 py-0.5 rounded-md shrink-0">{object.kind}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={openRenameModal} disabled={!isConnected} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md border border-(--app-border) text-(--app-muted) hover:bg-(--app-surface-2) hover:text-(--app-fg) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Renomear objeto">
                        <Pencil className="size-4" />
                        <span className="hidden sm:inline">Renomear</span>
                    </button>
                    <button type="button" onClick={onDelete} disabled={!isConnected} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md border border-(--app-border) text-(--app-danger) hover:bg-(--app-danger) hover:text-white hover:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Deletar objeto">
                        <Trash2 className="size-4" />
                        <span className="hidden sm:inline">Deletar</span>
                    </button>
                </div>
            </div>

            {/* Preview com tabs TS e JSON */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-(--app-surface) rounded-lg p-0.5 border border-(--app-border)">
                        <button type="button" onClick={() => setPreviewTab("ts")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${previewTab === "ts" ? "bg-(--app-accent) text-white" : "text-(--app-muted) hover:text-(--app-fg)"}`}>
                            TypeScript
                        </button>
                        <button type="button" onClick={() => setPreviewTab("json")} className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${previewTab === "json" ? "bg-(--app-accent) text-white" : "text-(--app-muted) hover:text-(--app-fg)"}`}>
                            JSON
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (previewTab === "ts") {
                                handleCopyCode();
                            } else {
                                const jsonPreview = JSON.stringify(objectToJson(object, objects), null, 2);
                                navigator.clipboard.writeText(jsonPreview);
                                setJsonCopied(true);
                                setTimeout(() => setJsonCopied(false), 2000);
                            }
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md cursor-pointer transition-colors ${(previewTab === "ts" ? copied : jsonCopied) ? "bg-green-600 text-white" : "text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface)"}`}
                        title={(previewTab === "ts" ? copied : jsonCopied) ? "Copiado!" : "Copiar código"}
                    >
                        {(previewTab === "ts" ? copied : jsonCopied) ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {(previewTab === "ts" ? copied : jsonCopied) ? "Copiado!" : "Copiar"}
                    </button>
                </div>
                <div className="rounded-lg border border-(--app-border) overflow-hidden">
                    <pre
                        className="p-4 text-sm font-mono overflow-x-auto bg-(--code-bg)"
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.classList.contains("object-type-link")) {
                                const objectName = target.dataset.objectName;
                                const obj = objects.find((o) => o.name === objectName);
                                if (obj) onSelectObject(obj.id);
                            }
                        }}
                    >
                        {previewTab === "ts" ? <code dangerouslySetInnerHTML={{ __html: generateTypeScriptCodeHighlighted(object, objects) }} /> : <code dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(objectToJson(object, objects), null, 2)) }} />}
                    </pre>
                </div>
            </div>

            {/* Editor de campos (interface) ou valores (enum) */}
            {object.kind === "enum" ? (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Valores</h3>
                        <button type="button" onClick={handleAddEnumValue} disabled={!isConnected} className="flex items-center gap-1 px-2 py-1 text-sm rounded-md text-(--app-accent) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <Plus className="size-4" />
                            Adicionar valor
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {(object.enumValues || []).map((value, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 md:p-3 rounded-md border border-(--app-border) bg-(--app-surface)">
                                <EnumValueInput value={value} onChange={(v) => handleUpdateEnumValue(index, v)} disabled={!isConnected} />
                                <button type="button" onClick={() => handleDeleteEnumValue(index)} disabled={!isConnected || (object.enumValues || []).length <= 1} className="p-1.5 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface-2) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ))}
                        {(object.enumValues || []).length === 0 && <p className="text-sm text-(--app-muted) italic">Nenhum valor adicionado</p>}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Campos</h3>
                        <button type="button" onClick={handleAddField} disabled={!isConnected} className="flex items-center gap-1 px-2 py-1 text-sm rounded-md text-(--app-accent) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <Plus className="size-4" />
                            Adicionar campo
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {object.fields.map((field, index) => (
                            <div key={field.id} className="flex flex-wrap items-center gap-2 p-2 md:p-3 rounded-md border border-(--app-border) bg-(--app-surface)">
                                <div className="flex-1 min-w-30">
                                    <FieldNameInput value={field.name} onChange={(name) => handleUpdateField(index, { name })} disabled={!isConnected} />
                                </div>

                                <TypeDropdown value={field.type} onChange={(newType) => handleUpdateField(index, { type: newType })} objects={objects} />

                                <label className={`flex items-center gap-1.5 text-sm text-(--app-fg) ${canBeArray(field.type) ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`} title={canBeArray(field.type) ? "Array" : "Este tipo não pode ser array"}>
                                    <input
                                        type="checkbox"
                                        checked={field.type.endsWith("[]")}
                                        disabled={!canBeArray(field.type) || !isConnected}
                                        onChange={(e) => {
                                            const baseType = field.type.replace("[]", "");
                                            handleUpdateField(index, { type: e.target.checked ? `${baseType}[]` : baseType });
                                        }}
                                        className="cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className="text-xs font-mono">[]</span>
                                </label>

                                <label className="flex items-center gap-2 text-sm text-(--app-fg) cursor-pointer">
                                    <input type="checkbox" checked={field.required} disabled={!isConnected} onChange={(e) => handleUpdateField(index, { required: e.target.checked })} className="cursor-pointer disabled:cursor-not-allowed" />
                                    <span className="text-xs">Required</span>
                                </label>

                                <button type="button" onClick={() => handleDeleteField(index)} disabled={!isConnected} className="p-1.5 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface-2) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ))}
                        {object.fields.length === 0 && <p className="text-sm text-(--app-muted) italic">Nenhum campo adicionado</p>}
                    </div>
                </div>
            )}

            {/* Modal para renomear objeto */}
            <Modal isOpen={renameModalOpen} onClose={handleRenameModalClose} title="Renomear Objeto">
                <div className="flex flex-col gap-4">
                    <Input label="Nome do objeto" value={renameInputValue} onChange={(e) => setRenameInputValue(e.target.value)} placeholder="Digite o nome" autoFocus onKeyDown={(e) => e.key === "Enter" && handleRenameModalConfirm()} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleRenameModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleRenameModalConfirm} disabled={!renameInputValue.trim()}>
                            Renomear
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

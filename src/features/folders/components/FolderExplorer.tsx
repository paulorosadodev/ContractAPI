import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Folder, FolderOpen, FolderPlus, Pencil, Plus, Trash2, Box, X, Globe, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FolderId, FolderNode, ObjectNode, Role, EndpointNode, HttpMethod } from "../model/folderTypes";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import RolesSection from "./RolesSection";
import { Dropdown, type DropdownItem, type DropdownSection } from "../../../shared/components/Dropdown";

export const FIELD_TYPES = ["string", "number", "boolean", "object", "Date", "any", "unknown", "null", "undefined", "void", "never"] as const;
export const NON_ARRAY_TYPES = ["null", "undefined", "void", "never"] as const;
export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-orange-500",
    PATCH: "bg-yellow-600",
    DELETE: "bg-red-600",
};

function normalizeName(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

export function canBeArray(type: string): boolean {
    const baseType = type.replace("[]", "");
    return !NON_ARRAY_TYPES.includes(baseType as (typeof NON_ARRAY_TYPES)[number]);
}

export function TypeDropdown({ value, onChange, objects }: { value: string; onChange: (value: string) => void; objects: ObjectNode[] }) {
    const baseValue = value.replace("[]", "");

    // Separa interfaces e enums
    const interfaces = useMemo(() => objects.filter((obj) => obj.kind !== "enum"), [objects]);
    const enums = useMemo(() => objects.filter((obj) => obj.kind === "enum"), [objects]);

    // Cria itens com seções
    const items: DropdownItem[] = useMemo(() => {
        const primitiveItems: DropdownItem[] = FIELD_TYPES.map((type) => ({
            id: type,
            label: type,
            section: "primitives",
        }));

        const interfaceItems: DropdownItem[] = interfaces.map((obj) => ({
            id: obj.name,
            label: obj.name,
            section: "interfaces",
        }));

        const enumItems: DropdownItem[] = enums.map((obj) => ({
            id: obj.name,
            label: obj.name,
            section: "enums",
        }));

        return [...primitiveItems, ...interfaceItems, ...enumItems];
    }, [interfaces, enums]);

    const sections: DropdownSection[] = useMemo(() => {
        const result: DropdownSection[] = [{ id: "primitives", label: "Primitivos" }];
        if (interfaces.length > 0) {
            result.push({ id: "interfaces", label: "Interfaces" });
        }
        if (enums.length > 0) {
            result.push({ id: "enums", label: "Enums" });
        }
        return result;
    }, [interfaces, enums]);

    const handleSelect = (item: DropdownItem) => {
        const type = item.id;
        // Se o tipo nao pode ser array, remove o []
        if (!canBeArray(type)) {
            onChange(type);
        } else {
            const isArray = value.endsWith("[]");
            onChange(type + (isArray ? "[]" : ""));
        }
    };

    return <Dropdown items={items} sections={sections} showSections={true} value={baseValue} onSelect={handleSelect} placeholder={baseValue} selectedItemClassName="bg-purple-600 text-white" minWidth={112} />;
}

function AddMenu({ triggerRef, isOpen, onClose, onCreateObject, onCreateEndpoint, isConnected, onMouseEnter }: { triggerRef: React.RefObject<HTMLButtonElement | null>; isOpen: boolean; onClose: () => void; onCreateObject: () => void; onCreateEndpoint: () => void; isConnected: boolean; onMouseEnter: () => void }) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom, left: rect.left });
        }
    }, [isOpen, triggerRef]);

    if (!isOpen) return null;

    return createPortal(
        <div ref={menuRef} className="fixed z-9999" style={{ top: position.top, left: position.left }} onMouseEnter={onMouseEnter} onMouseLeave={onClose}>
            <div className="pt-1">
                <div className="rounded-md border border-(--app-border) bg-(--app-surface) py-1 shadow-lg min-w-35 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => {
                            onCreateObject();
                            onClose();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-(--app-fg) bg-(--app-surface) hover:bg-(--app-surface-2) cursor-pointer disabled:opacity-50"
                        disabled={!isConnected}
                    >
                        <Box className="size-4" />
                        Criar objeto
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onCreateEndpoint();
                            onClose();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-(--app-fg) bg-(--app-surface) hover:bg-(--app-surface-2) cursor-pointer disabled:opacity-50"
                        disabled={!isConnected}
                    >
                        <Globe className="size-4" />
                        Criar endpoint
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

type ModalState = { type: "create"; parentId: FolderId | null } | { type: "rename"; id: FolderId; currentName: string } | { type: "delete"; id: FolderId } | { type: "createObject"; collectionId: string } | { type: "renameObject"; id: string; currentName: string } | { type: "createEndpoint"; collectionId: string } | { type: "renameEndpoint"; id: string; currentName: string } | null;

interface FolderExplorerProps {
    tree: FolderNode[];
    objects: ObjectNode[];
    endpoints: EndpointNode[];
    roles: Role[];
    isConnected: boolean;
    isLoading: boolean;
    selectedCollectionId: string | null;
    selectedObjectId: string | null;
    selectedEndpointId: string | null;
    onSelectCollection: (id: string) => void;
    onSelectObject: (id: string) => void;
    onSelectEndpoint: (id: string) => void;
    onDeselect: () => void;
    onCreate: (parentId: FolderId | null, name: string) => void;
    onRename: (id: FolderId, name: string) => void;
    onDelete: (id: FolderId) => void;
    onMoveCollection: (id: FolderId, newParentId: FolderId | null) => void;
    onDeleteObject: (id: string) => void;
    onRenameObject: (id: string, name: string) => void;
    onMoveObject: (id: string, newCollectionId: string) => void;
    onCreateObject: (collectionId: string, name: string, kind: "interface" | "type" | "enum", fields: Array<{ name: string; type: string; required: boolean }>, enumValues?: string[]) => void;
    onCreateEndpoint: (collectionId: string, name: string, path: string, method: HttpMethod, minRole?: string, queryParams?: Array<{ name: string; type: string; required: boolean; description?: string }>, requestBody?: string, responseBody?: string, description?: string) => void;
    onDeleteEndpoint: (id: string) => void;
    onRenameEndpoint: (id: string, name: string) => void;
    onMoveEndpoint: (id: string, newCollectionId: string) => void;
    onCreateRole: (name: string) => void;
    onRenameRole: (id: string, name: string) => void;
    onDeleteRole: (id: string) => void;
    onReorderRoles: (orderedIds: string[]) => void;
}

type DragItem = { type: "collection"; id: string } | { type: "object"; id: string } | { type: "endpoint"; id: string } | null;

export default function FolderExplorer({ tree, objects, endpoints, roles, isConnected, isLoading, selectedCollectionId, selectedObjectId, selectedEndpointId, onSelectCollection, onSelectObject, onSelectEndpoint, onDeselect, onCreate, onRename, onDelete, onMoveCollection, onDeleteObject, onRenameObject, onMoveObject, onCreateObject, onCreateEndpoint, onDeleteEndpoint, onRenameEndpoint, onMoveEndpoint, onCreateRole, onRenameRole, onDeleteRole, onReorderRoles }: FolderExplorerProps) {
    const [expanded, setExpanded] = useState<Set<FolderId>>(() => new Set(["root-1"]));
    const [modalState, setModalState] = useState<ModalState>(null);
    const [inputValue, setInputValue] = useState("");
    const [objectFields, setObjectFields] = useState<Array<{ name: string; type: string; required: boolean }>>([{ name: "id", type: "string", required: true }]);
    const [objectKind, setObjectKind] = useState<"interface" | "enum">("interface");
    const [enumValues, setEnumValues] = useState<string[]>(["VALUE_1"]);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerAddButtonRef = useRef<HTMLButtonElement>(null);
    const pendingObjectRef = useRef<{ name: string; collectionId: string } | null>(null);
    const pendingEndpointRef = useRef<{ name: string; collectionId: string } | null>(null);
    const [dragItem, setDragItem] = useState<DragItem>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Estado do formulário de endpoint
    const [endpointPath, setEndpointPath] = useState("/");
    const [endpointMethod, setEndpointMethod] = useState<HttpMethod>("GET");
    const [endpointMinRole, setEndpointMinRole] = useState("");
    const [endpointQueryParams, setEndpointQueryParams] = useState<Array<{ name: string; type: string; required: boolean; description: string }>>([]);
    const [endpointRequestBody, setEndpointRequestBody] = useState("");
    const [endpointResponseBody, setEndpointResponseBody] = useState("");
    const [endpointDescription, setEndpointDescription] = useState("");

    // Efeito para selecionar objeto recém-criado
    useEffect(() => {
        if (pendingObjectRef.current) {
            const { name, collectionId } = pendingObjectRef.current;
            const newObject = objects.find((o) => o.name === name && o.collectionId === collectionId);
            if (newObject) {
                onSelectObject(newObject.id);
                pendingObjectRef.current = null;
            }
        }
    }, [objects, onSelectObject]);

    // Efeito para selecionar endpoint recém-criado
    useEffect(() => {
        if (pendingEndpointRef.current) {
            const { name, collectionId } = pendingEndpointRef.current;
            const newEndpoint = endpoints.find((e) => e.name === name && e.collectionId === collectionId);
            if (newEndpoint) {
                onSelectEndpoint(newEndpoint.id);
                pendingEndpointRef.current = null;
            }
        }
    }, [endpoints, onSelectEndpoint]);

    const allIds = useMemo(() => {
        const ids: FolderId[] = [];
        const walk = (nodes: FolderNode[]) => {
            for (const n of nodes) {
                ids.push(n.id);
                walk(n.children);
            }
        };
        walk(tree);
        return ids;
    }, [tree]);

    const onToggle = (id: FolderId) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateRoot = () => {
        if (!isConnected) return;
        setInputValue("");
        setModalState({ type: "create", parentId: null });
    };

    const handleCreateChild = (parentId: FolderId) => {
        if (!isConnected) return;
        setInputValue("");
        setModalState({ type: "create", parentId });
    };

    const handleRename = (id: FolderId, currentName: string) => {
        if (!isConnected) return;
        setInputValue(currentName);
        setModalState({ type: "rename", id, currentName });
    };

    const handleDelete = (id: FolderId) => {
        if (!isConnected) return;
        setModalState({ type: "delete", id });
    };

    const handleCreateObject = (collectionId: string) => {
        if (!isConnected) return;
        setInputValue("");
        setModalState({ type: "createObject", collectionId });
    };

    const handleRenameObject = (id: string, currentName: string) => {
        if (!isConnected) return;
        setInputValue(currentName);
        setModalState({ type: "renameObject", id, currentName });
    };

    const handleCreateEndpoint = (collectionId: string) => {
        if (!isConnected) return;
        setInputValue("");
        setEndpointPath("/");
        setEndpointMethod("GET");
        setEndpointMinRole("");
        setEndpointQueryParams([]);
        setEndpointRequestBody("");
        setEndpointResponseBody("");
        setEndpointDescription("");
        setModalState({ type: "createEndpoint", collectionId });
    };

    const handleRenameEndpoint = (id: string, currentName: string) => {
        if (!isConnected) return;
        setInputValue(currentName);
        setModalState({ type: "renameEndpoint", id, currentName });
    };

    const resetEndpointForm = () => {
        setEndpointPath("/");
        setEndpointMethod("GET");
        setEndpointMinRole("");
        setEndpointQueryParams([]);
        setEndpointRequestBody("");
        setEndpointResponseBody("");
        setEndpointDescription("");
    };

    const handleModalConfirm = () => {
        if (!modalState) return;

        const name = normalizeName(inputValue);
        if (modalState.type === "create") {
            if (!name) return;
            if (modalState.parentId) {
                setExpanded((prev) => new Set(prev).add(modalState.parentId!));
            }
            onCreate(modalState.parentId, name);
        } else if (modalState.type === "rename") {
            if (!name || name === modalState.currentName) return;
            onRename(modalState.id, name);
        } else if (modalState.type === "createObject") {
            if (!name) return;
            if (objectKind === "interface" && (objectFields.length === 0 || objectFields.some((f) => !f.name.trim()))) return;
            if (objectKind === "enum" && (enumValues.length === 0 || enumValues.some((v) => !v.trim()))) return;
            // Guardar referência para selecionar o objeto após criação
            pendingObjectRef.current = { name, collectionId: modalState.collectionId };
            // Expandir a coleção pai se existir
            if (modalState.collectionId) {
                setExpanded((prev) => new Set(prev).add(modalState.collectionId));
            }
            onCreateObject(modalState.collectionId, name, objectKind, objectKind === "interface" ? objectFields : [], objectKind === "enum" ? enumValues : undefined);
        } else if (modalState.type === "renameObject") {
            if (!name || name === modalState.currentName) return;
            onRenameObject(modalState.id, name);
        } else if (modalState.type === "createEndpoint") {
            if (!name) return;
            // Guardar referência para selecionar o endpoint após criação
            pendingEndpointRef.current = { name, collectionId: modalState.collectionId };
            // Expandir a coleção pai se existir
            if (modalState.collectionId) {
                setExpanded((prev) => new Set(prev).add(modalState.collectionId));
            }
            onCreateEndpoint(modalState.collectionId, name, endpointPath, endpointMethod, endpointMinRole || undefined, endpointQueryParams.length > 0 ? endpointQueryParams : undefined, endpointRequestBody || undefined, endpointResponseBody || undefined, endpointDescription || undefined);
            resetEndpointForm();
        } else if (modalState.type === "renameEndpoint") {
            if (!name || name === modalState.currentName) return;
            onRenameEndpoint(modalState.id, name);
        } else if (modalState.type === "delete") {
            setExpanded((prev) => {
                const next = new Set(prev);
                next.delete(modalState.id);
                return next;
            });
            onDelete(modalState.id);
        }

        setModalState(null);
        setInputValue("");
        setObjectFields([{ name: "id", type: "string", required: true }]);
        setObjectKind("interface");
        setEnumValues(["VALUE_1"]);
    };

    const handleModalClose = () => {
        setModalState(null);
        setInputValue("");
        setObjectFields([{ name: "id", type: "string", required: true }]);
        setObjectKind("interface");
        setEnumValues(["VALUE_1"]);
        resetEndpointForm();
    };

    const collapseAll = () => setExpanded(new Set());
    const expandAll = () => setExpanded(new Set(allIds));

    // Drag and drop handlers
    const handleDragStart = (item: DragItem) => {
        if (!isConnected) return;
        setDragItem(item);
    };

    const handleDragEnd = () => {
        setDragItem(null);
        setDropTargetId(null);
    };

    const handleDragOver = (targetId: string | null) => {
        if (!dragItem) return;
        // Não pode dropar em si mesmo
        if (dragItem.type === "collection" && dragItem.id === targetId) return;
        setDropTargetId(targetId);
    };

    const handleDrop = (targetId: string | null) => {
        if (!dragItem || !isConnected) return;

        // root-bottom é tratado como raiz (null)
        const actualTargetId = targetId === "root-bottom" ? null : targetId;

        if (dragItem.type === "collection") {
            // Não pode dropar coleção em si mesma
            if (dragItem.id === actualTargetId) return;
            onMoveCollection(dragItem.id, actualTargetId);
        } else if (dragItem.type === "object") {
            onMoveObject(dragItem.id, actualTargetId || "");
        } else if (dragItem.type === "endpoint") {
            onMoveEndpoint(dragItem.id, actualTargetId || "");
        }

        setDragItem(null);
        setDropTargetId(null);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-(--app-border) px-3 py-2">
                <div className="text-[11px] font-semibold tracking-widest text-(--app-muted)">EXPLORER</div>

                <div className="flex items-center gap-1">
                    <div onMouseEnter={() => setIsHeaderMenuOpen(true)} onMouseLeave={() => setIsHeaderMenuOpen(false)}>
                        <button ref={headerAddButtonRef} type="button" className="inline-flex size-8 items-center justify-center rounded-md border border-transparent text-(--app-muted) hover:border-(--app-border) hover:bg-(--app-surface-2) hover:text-(--app-fg) disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" disabled={!isConnected} title="Novo objeto">
                            <Plus className="size-4" />
                        </button>
                    </div>
                    <AddMenu triggerRef={headerAddButtonRef} isOpen={isHeaderMenuOpen} onClose={() => setIsHeaderMenuOpen(false)} onMouseEnter={() => setIsHeaderMenuOpen(true)} onCreateObject={() => handleCreateObject("")} onCreateEndpoint={() => handleCreateEndpoint("")} isConnected={isConnected} />
                    <button type="button" className="inline-flex size-8 items-center justify-center rounded-md border border-transparent text-(--app-muted) hover:border-(--app-border) hover:bg-(--app-surface-2) hover:text-(--app-fg) disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" onClick={handleCreateRoot} aria-label="Criar coleção na raiz" title="Nova coleção" disabled={!isConnected}>
                        <FolderPlus className="size-4" />
                    </button>
                </div>
            </div>

            <div
                className={`flex items-center justify-between px-3 py-2 transition-colors ${dragItem ? "border-b-2 border-dashed" : ""} ${dropTargetId === "root" ? "border-(--app-accent) bg-(--app-accent)/10" : dragItem ? "border-(--app-border)" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver("root");
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(null);
                }}
            >
                <div className="text-xs font-medium text-(--app-fg)">{dropTargetId === "root" && dragItem ? "Soltar na raiz" : "Coleções"}</div>
                <div className="flex items-center gap-1 text-(--app-muted)">
                    <button type="button" className="inline-flex size-6 items-center justify-center rounded-md hover:bg-(--app-surface-2) hover:text-(--app-fg) cursor-pointer" onClick={expandAll} title="Expandir tudo">
                        <ChevronsUpDown className="size-3.5" />
                    </button>
                    <button type="button" className="inline-flex size-6 items-center justify-center rounded-md hover:bg-(--app-surface-2) hover:text-(--app-fg) cursor-pointer" onClick={collapseAll} title="Recolher tudo">
                        <ChevronsDownUp className="size-3.5" />
                    </button>
                </div>
            </div>

            <div
                className="flex-1 overflow-auto px-1 pb-3"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onDeselect();
                }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-sm text-(--app-muted)">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--app-muted) border-t-transparent"></div>
                            <span>Carregando...</span>
                        </div>
                    </div>
                ) : tree.length === 0 && objects.filter((o) => !o.collectionId).length === 0 && endpoints.filter((e) => !e.collectionId).length === 0 ? (
                    <div className="py-8 text-center text-sm text-(--app-muted)">Nenhuma coleção ainda</div>
                ) : (
                    <>
                        {/* Objetos na raiz (sem coleção) */}
                        {objects.filter((o) => !o.collectionId).length > 0 && (
                            <ul className="select-none mb-1">
                                {objects
                                    .filter((o) => !o.collectionId)
                                    .map((obj) => (
                                        <TreeItemObject key={obj.id} object={obj} level={0} isSelected={selectedObjectId === obj.id} onSelect={() => onSelectObject(obj.id)} onDelete={() => onDeleteObject(obj.id)} onRename={() => handleRenameObject(obj.id, obj.name)} isConnected={isConnected} onDragStart={() => handleDragStart({ type: "object", id: obj.id })} onDragEnd={handleDragEnd} isDragging={dragItem?.type === "object" && dragItem.id === obj.id} />
                                    ))}
                            </ul>
                        )}
                        {/* Endpoints na raiz (sem coleção) */}
                        {endpoints.filter((e) => !e.collectionId).length > 0 && (
                            <ul className="select-none mb-1">
                                {endpoints
                                    .filter((e) => !e.collectionId)
                                    .map((ep) => (
                                        <TreeItemEndpoint key={ep.id} endpoint={ep} level={0} isSelected={selectedEndpointId === ep.id} onSelect={() => onSelectEndpoint(ep.id)} onDelete={() => onDeleteEndpoint(ep.id)} onRename={() => handleRenameEndpoint(ep.id, ep.name)} isConnected={isConnected} onDragStart={() => handleDragStart({ type: "endpoint", id: ep.id })} onDragEnd={handleDragEnd} isDragging={dragItem?.type === "endpoint" && dragItem.id === ep.id} />
                                    ))}
                            </ul>
                        )}
                        {/* Árvore de coleções */}
                        {tree.length > 0 && <Tree nodes={tree} objects={objects} endpoints={endpoints} level={0} expanded={expanded} selectedId={selectedCollectionId} selectedObjectId={selectedObjectId} selectedEndpointId={selectedEndpointId} onToggle={onToggle} onSelect={onSelectCollection} onSelectObject={onSelectObject} onSelectEndpoint={onSelectEndpoint} onCreateChild={handleCreateChild} onRename={handleRename} onDelete={handleDelete} onDeleteObject={onDeleteObject} onRenameObject={handleRenameObject} onCreateObject={handleCreateObject} onDeleteEndpoint={onDeleteEndpoint} onRenameEndpoint={handleRenameEndpoint} onCreateEndpoint={handleCreateEndpoint} isConnected={isConnected} dragItem={dragItem} dropTargetId={dropTargetId} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={handleDrop} />}

                        {/* Drop zone inferior para raiz */}
                        {dragItem && (
                            <div
                                className={`mx-2 mt-2 py-3 rounded-md border-2 border-dashed text-center text-xs transition-colors ${dropTargetId === "root-bottom" ? "border-(--app-accent) bg-(--app-accent)/10 text-(--app-accent)" : "border-(--app-border) text-(--app-muted)"}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    handleDragOver("root-bottom");
                                }}
                                onDragLeave={() => setDropTargetId(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop(null);
                                }}
                            >
                                Soltar na raiz
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Seção de Roles */}
            <div className="border-t border-(--app-border)">
                <RolesSection roles={roles} isConnected={isConnected} onCreateRole={onCreateRole} onRenameRole={onRenameRole} onDeleteRole={onDeleteRole} onReorderRoles={onReorderRoles} />
            </div>

            {/* Footer com créditos */}
            <div className="border-t border-(--app-border) px-3 py-2">
                <div className="flex items-center justify-center text-[10px] text-(--app-muted)">
                    <span>Developed by</span>
                    <a href="https://github.com/paulorosadodev" target="_blank" rel="noopener noreferrer" className="ml-1 font-medium text-(--app-accent) hover:underline cursor-pointer">
                        Paulo Rosado
                    </a>
                </div>
            </div>

            {/* Modal para criar/renomear */}
            <Modal isOpen={modalState?.type === "create" || modalState?.type === "rename"} onClose={handleModalClose} title={modalState?.type === "create" ? "Nova Coleção" : "Renomear Coleção"}>
                <div className="flex flex-col gap-4">
                    <Input label="Nome da coleção" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Digite o nome" autoFocus onKeyDown={(e) => e.key === "Enter" && handleModalConfirm()} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleModalConfirm} disabled={!normalizeName(inputValue)}>
                            {modalState?.type === "create" ? "Criar" : "Renomear"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para criar objeto */}
            <Modal isOpen={modalState?.type === "createObject"} onClose={handleModalClose} title="Criar Objeto" size="lg">
                <div className="flex flex-col gap-4">
                    <Input label="Nome do objeto" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Digite o nome" autoFocus />

                    {/* Seletor de tipo: Interface ou Enum */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-(--app-fg)">Tipo</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setObjectKind("interface")} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-all ${objectKind === "interface" ? "bg-(--app-accent) text-white" : "bg-(--app-surface-2) text-(--app-muted) hover:bg-(--app-surface)"}`}>
                                Interface
                            </button>
                            <button type="button" onClick={() => setObjectKind("enum")} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-all ${objectKind === "enum" ? "bg-(--app-accent) text-white" : "bg-(--app-surface-2) text-(--app-muted) hover:bg-(--app-surface)"}`}>
                                Enum
                            </button>
                        </div>
                    </div>

                    {/* Campos para Interface */}
                    {objectKind === "interface" && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-(--app-fg)">Campos</label>
                                <Button variant="ghost" onClick={() => setObjectFields([...objectFields, { name: "", type: "string", required: false }])} size="sm">
                                    <Plus className="size-4 mr-1" />
                                    Adicionar campo
                                </Button>
                            </div>

                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                {objectFields.map((field, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 rounded-md border border-(--app-border) bg-(--app-surface)">
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => {
                                                const newFields = [...objectFields];
                                                newFields[index].name = e.target.value;
                                                setObjectFields(newFields);
                                            }}
                                            placeholder="Nome do campo"
                                            className="flex-1 px-3 py-1.5 text-sm bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent)"
                                        />

                                        <TypeDropdown
                                            value={field.type}
                                            onChange={(newType) => {
                                                const newFields = [...objectFields];
                                                newFields[index].type = newType;
                                                setObjectFields(newFields);
                                            }}
                                            objects={objects}
                                        />

                                        <label className={`flex items-center gap-1.5 text-sm text-(--app-fg) ${canBeArray(field.type) ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`} title={canBeArray(field.type) ? "Array" : "Este tipo não pode ser array"}>
                                            <input
                                                type="checkbox"
                                                checked={field.type.endsWith("[]")}
                                                disabled={!canBeArray(field.type)}
                                                onChange={(e) => {
                                                    const newFields = [...objectFields];
                                                    const baseType = newFields[index].type.replace("[]", "");
                                                    newFields[index].type = e.target.checked ? `${baseType}[]` : baseType;
                                                    setObjectFields(newFields);
                                                }}
                                                className="cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            <span className="text-xs font-mono">[]</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-sm text-(--app-fg) cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => {
                                                    const newFields = [...objectFields];
                                                    newFields[index].required = e.target.checked;
                                                    setObjectFields(newFields);
                                                }}
                                                className="cursor-pointer"
                                            />
                                            <span className="text-xs">Required</span>
                                        </label>

                                        <button type="button" onClick={() => setObjectFields(objectFields.filter((_, i) => i !== index))} className="p-1.5 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface-2) cursor-pointer">
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Valores para Enum */}
                    {objectKind === "enum" && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-(--app-fg)">Valores</label>
                                <Button variant="ghost" onClick={() => setEnumValues([...enumValues, ""])} size="sm">
                                    <Plus className="size-4 mr-1" />
                                    Adicionar valor
                                </Button>
                            </div>

                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                {enumValues.map((value, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 rounded-md border border-(--app-border) bg-(--app-surface)">
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => {
                                                const newValues = [...enumValues];
                                                newValues[index] = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                                                setEnumValues(newValues);
                                            }}
                                            placeholder="VALOR_DO_ENUM"
                                            className="flex-1 px-3 py-1.5 text-sm font-mono bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent)"
                                        />
                                        <button type="button" onClick={() => setEnumValues(enumValues.filter((_, i) => i !== index))} disabled={enumValues.length <= 1} className="p-1.5 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface-2) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-(--app-muted)">Os valores serão convertidos para MAIÚSCULAS com apenas letras, números e underscore.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleModalConfirm} disabled={!normalizeName(inputValue) || (objectKind === "interface" && (objectFields.length === 0 || objectFields.some((f) => !f.name.trim()))) || (objectKind === "enum" && (enumValues.length === 0 || enumValues.some((v) => !v.trim())))}>
                            Criar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para deletar */}
            <Modal isOpen={modalState?.type === "delete"} onClose={handleModalClose} title="Deletar Coleção" size="sm">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-(--app-muted)">Tem certeza que deseja deletar esta coleção e todas as suas subcoleções? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleModalConfirm}>
                            Deletar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para renomear objeto */}
            <Modal isOpen={modalState?.type === "renameObject"} onClose={handleModalClose} title="Renomear Objeto">
                <div className="flex flex-col gap-4">
                    <Input label="Nome do objeto" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Digite o nome" autoFocus onKeyDown={(e) => e.key === "Enter" && handleModalConfirm()} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleModalConfirm} disabled={!normalizeName(inputValue)}>
                            Renomear
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para criar endpoint */}
            <Modal isOpen={modalState?.type === "createEndpoint"} onClose={handleModalClose} title="Criar Endpoint">
                <div className="flex flex-col gap-4">
                    <Input label="Nome do endpoint" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ex: Buscar usuários" autoFocus />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-(--app-fg)">URL</label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-(--app-muted) bg-(--app-surface-2) px-3 py-1.5 rounded-md border border-(--app-border)">baseUrl</span>
                            <input type="text" value={endpointPath} onChange={(e) => setEndpointPath(e.target.value)} placeholder="/users/:id" className="flex-1 px-3 py-1.5 text-sm bg-(--app-bg) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent)" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-(--app-fg)">Método HTTP</label>
                        <div className="flex gap-2 flex-wrap">
                            {HTTP_METHODS.map((method) => (
                                <button key={method} type="button" onClick={() => setEndpointMethod(method)} className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all ${endpointMethod === method ? `${METHOD_COLORS[method]} text-white ring-2 ring-offset-2 ring-offset-(--app-bg)` : "bg-(--app-surface-2) text-(--app-muted) hover:bg-(--app-surface)"}`}>
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-(--app-muted) italic">Você pode configurar query params, body, role e descrição depois de criar o endpoint.</p>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleModalConfirm} disabled={!normalizeName(inputValue)}>
                            Criar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para renomear endpoint */}
            <Modal isOpen={modalState?.type === "renameEndpoint"} onClose={handleModalClose} title="Renomear Endpoint">
                <div className="flex flex-col gap-4">
                    <Input label="Nome do endpoint" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Digite o nome" autoFocus onKeyDown={(e) => e.key === "Enter" && handleModalConfirm()} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleModalClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleModalConfirm} disabled={!normalizeName(inputValue)}>
                            Renomear
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function Tree({ nodes, objects, endpoints, level, expanded, selectedId, selectedObjectId, selectedEndpointId, onToggle, onSelect, onSelectObject, onSelectEndpoint, onCreateChild, onRename, onDelete, onDeleteObject, onRenameObject, onCreateObject, onDeleteEndpoint, onRenameEndpoint, onCreateEndpoint, isConnected, dragItem, dropTargetId, onDragStart, onDragEnd, onDragOver, onDrop }: { nodes: FolderNode[]; objects: ObjectNode[]; endpoints: EndpointNode[]; level: number; expanded: Set<FolderId>; selectedId: string | null; selectedObjectId: string | null; selectedEndpointId: string | null; onToggle: (id: FolderId) => void; onSelect: (id: string) => void; onSelectObject: (id: string) => void; onSelectEndpoint: (id: string) => void; onCreateChild: (id: FolderId) => void; onRename: (id: FolderId, currentName: string) => void; onDelete: (id: FolderId) => void; onDeleteObject: (id: string) => void; onRenameObject: (id: string, currentName: string) => void; onCreateObject: (id: string) => void; onDeleteEndpoint: (id: string) => void; onRenameEndpoint: (id: string, currentName: string) => void; onCreateEndpoint: (id: string) => void; isConnected: boolean; dragItem: DragItem; dropTargetId: string | null; onDragStart: (item: DragItem) => void; onDragEnd: () => void; onDragOver: (targetId: string | null) => void; onDrop: (targetId: string | null) => void }) {
    return (
        <ul className="select-none">
            <AnimatePresence>
                {nodes.map((node) => (
                    <TreeItem key={node.id} node={node} objects={objects} endpoints={endpoints} level={level} expanded={expanded} selectedId={selectedId} selectedObjectId={selectedObjectId} selectedEndpointId={selectedEndpointId} onToggle={onToggle} onSelect={onSelect} onSelectObject={onSelectObject} onSelectEndpoint={onSelectEndpoint} onCreateChild={onCreateChild} onRename={onRename} onDelete={onDelete} onDeleteObject={onDeleteObject} onRenameObject={onRenameObject} onCreateObject={onCreateObject} onDeleteEndpoint={onDeleteEndpoint} onRenameEndpoint={onRenameEndpoint} onCreateEndpoint={onCreateEndpoint} isConnected={isConnected} dragItem={dragItem} dropTargetId={dropTargetId} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} />
                ))}
            </AnimatePresence>
        </ul>
    );
}

function TreeItem({ node, objects, endpoints, level, expanded, selectedId, selectedObjectId, selectedEndpointId, onToggle, onSelect, onSelectObject, onSelectEndpoint, onCreateChild, onRename, onDelete, onDeleteObject, onRenameObject, onCreateObject, onDeleteEndpoint, onRenameEndpoint, onCreateEndpoint, isConnected, dragItem, dropTargetId, onDragStart, onDragEnd, onDragOver, onDrop }: { node: FolderNode; objects: ObjectNode[]; endpoints: EndpointNode[]; level: number; expanded: Set<FolderId>; selectedId: string | null; selectedObjectId: string | null; selectedEndpointId: string | null; onToggle: (id: FolderId) => void; onSelect: (id: string) => void; onSelectObject: (id: string) => void; onSelectEndpoint: (id: string) => void; onCreateChild: (id: FolderId) => void; onRename: (id: FolderId, currentName: string) => void; onDelete: (id: FolderId) => void; onDeleteObject: (id: string) => void; onRenameObject: (id: string, currentName: string) => void; onCreateObject: (id: string) => void; onDeleteEndpoint: (id: string) => void; onRenameEndpoint: (id: string, currentName: string) => void; onCreateEndpoint: (id: string) => void; isConnected: boolean; dragItem: DragItem; dropTargetId: string | null; onDragStart: (item: DragItem) => void; onDragEnd: () => void; onDragOver: (targetId: string | null) => void; onDrop: (targetId: string | null) => void }) {
    const collectionObjects = objects.filter((obj) => obj.collectionId === node.id);
    const collectionEndpoints = endpoints.filter((ep) => ep.collectionId === node.id);
    const hasChildren = node.children.length > 0 || collectionObjects.length > 0 || collectionEndpoints.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isDragging = dragItem?.type === "collection" && dragItem.id === node.id;
    const isDropTarget = dropTargetId === node.id;

    return (
        <motion.li layout="position" initial={{ opacity: 0, x: -10 }} animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div
                className={`group flex h-7 items-center gap-1 rounded-md px-2 text-sm text-(--app-fg) hover:bg-(--app-surface-2) cursor-grab active:cursor-grabbing ${isSelected ? "bg-(--app-surface-2)" : ""} ${isDropTarget ? "ring-2 ring-(--app-accent) bg-(--app-accent)/10" : ""}`}
                style={{ paddingLeft: 8 + level * 14 }}
                draggable={isConnected}
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    onDragStart({ type: "collection", id: node.id });
                }}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Não pode dropar em si mesmo ou em descendente
                    if (dragItem?.type === "collection" && dragItem.id === node.id) return;
                    onDragOver(node.id);
                }}
                onDragLeave={(e) => {
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragItem?.type === "collection" && dragItem.id === node.id) return;
                    onDrop(node.id);
                }}
                onClick={() => {
                    onSelect(node.id);
                    onToggle(node.id);
                }}
            >
                <div className="inline-flex size-6 items-center justify-center rounded-md text-(--app-muted)" aria-label={hasChildren ? (isExpanded ? "Recolher" : "Expandir") : "Sem filhos"}>
                    {hasChildren ? (
                        <motion.div initial={false} animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="size-4" />
                        </motion.div>
                    ) : (
                        <span className="size-4" />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {hasChildren && isExpanded ? <FolderOpen className="size-4 text-(--app-accent)" /> : <Folder className="size-4 text-(--app-accent)" />}
                    <span className="min-w-0 truncate" title={node.name}>
                        {node.name}
                    </span>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`items-center gap-1 ${isMenuOpen ? "flex" : "hidden group-hover:flex"}`} onClick={(e) => e.stopPropagation()}>
                    <div onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
                        <button ref={addButtonRef} type="button" className="inline-flex size-7 items-center justify-center rounded-md border border-transparent text-(--app-muted) hover:border-(--app-border) hover:bg-(--app-surface) hover:text-(--app-fg) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isConnected}>
                            <Plus className="size-4" />
                        </button>
                    </div>
                    <AddMenu triggerRef={addButtonRef} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onMouseEnter={() => setIsMenuOpen(true)} onCreateObject={() => onCreateObject(node.id)} onCreateEndpoint={() => onCreateEndpoint(node.id)} isConnected={isConnected} />
                    <IconActionButton label="Nova subcoleção" onClick={() => onCreateChild(node.id)} icon={<FolderPlus className="size-4" />} disabled={!isConnected} />
                    <IconActionButton label="Renomear" onClick={() => onRename(node.id, node.name)} icon={<Pencil className="size-4" />} disabled={!isConnected} />
                    <IconActionButton label="Deletar" onClick={() => onDelete(node.id)} icon={<Trash2 className="size-4" />} danger disabled={!isConnected} />
                </motion.div>
            </div>

            <AnimatePresence>
                {hasChildren && isExpanded ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                        {/* Renderizar objetos da coleção */}
                        {collectionObjects.length > 0 && (
                            <ul className="select-none">
                                {collectionObjects.map((obj) => (
                                    <TreeItemObject key={obj.id} object={obj} level={level + 1} isSelected={selectedObjectId === obj.id} onSelect={() => onSelectObject(obj.id)} onDelete={() => onDeleteObject(obj.id)} onRename={() => onRenameObject(obj.id, obj.name)} isConnected={isConnected} onDragStart={() => onDragStart({ type: "object", id: obj.id })} onDragEnd={onDragEnd} isDragging={dragItem?.type === "object" && dragItem.id === obj.id} />
                                ))}
                            </ul>
                        )}

                        {/* Renderizar endpoints da coleção */}
                        {collectionEndpoints.length > 0 && (
                            <ul className="select-none">
                                {collectionEndpoints.map((ep) => (
                                    <TreeItemEndpoint key={ep.id} endpoint={ep} level={level + 1} isSelected={selectedEndpointId === ep.id} onSelect={() => onSelectEndpoint(ep.id)} onDelete={() => onDeleteEndpoint(ep.id)} onRename={() => onRenameEndpoint(ep.id, ep.name)} isConnected={isConnected} onDragStart={() => onDragStart({ type: "endpoint", id: ep.id })} onDragEnd={onDragEnd} isDragging={dragItem?.type === "endpoint" && dragItem.id === ep.id} />
                                ))}
                            </ul>
                        )}

                        {/* Renderizar subcoleções */}
                        {node.children.length > 0 && <Tree nodes={node.children} objects={objects} endpoints={endpoints} level={level + 1} expanded={expanded} selectedId={selectedId} selectedObjectId={selectedObjectId} selectedEndpointId={selectedEndpointId} onToggle={onToggle} onSelect={onSelect} onSelectObject={onSelectObject} onSelectEndpoint={onSelectEndpoint} onCreateChild={onCreateChild} onRename={onRename} onDelete={onDelete} onDeleteObject={onDeleteObject} onRenameObject={onRenameObject} onCreateObject={onCreateObject} onDeleteEndpoint={onDeleteEndpoint} onRenameEndpoint={onRenameEndpoint} onCreateEndpoint={onCreateEndpoint} isConnected={isConnected} dragItem={dragItem} dropTargetId={dropTargetId} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} />}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.li>
    );
}

function TreeItemObject({ object, level, isSelected, onSelect, onDelete, onRename, isConnected, onDragStart, onDragEnd, isDragging }: { object: ObjectNode; level: number; isSelected: boolean; onSelect: () => void; onDelete: () => void; onRename: () => void; isConnected: boolean; onDragStart: () => void; onDragEnd: () => void; isDragging: boolean }) {
    return (
        <motion.li layout="position" initial={{ opacity: 0, x: -10 }} animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div
                className={`group flex h-7 items-center gap-1 rounded-md px-2 text-sm text-(--app-fg) hover:bg-(--app-surface-2) cursor-grab active:cursor-grabbing ${isSelected ? "bg-(--app-surface-2)" : ""}`}
                style={{ paddingLeft: 8 + level * 14 }}
                draggable={isConnected}
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    onDragStart();
                }}
                onDragEnd={onDragEnd}
                onClick={onSelect}
            >
                <span className="size-6" /> {/* Espaço para alinhar com itens que têm chevron */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {object.kind === "enum" ? <List className="size-4 text-purple-500" /> : <Box className="size-4 text-(--app-comment)" />}
                    <span className="min-w-0 truncate" title={object.name}>
                        {object.name}
                    </span>
                    <span className="text-xs text-(--app-muted)">({object.kind})</span>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden items-center gap-1 group-hover:flex" onClick={(e) => e.stopPropagation()}>
                    <IconActionButton label="Renomear" onClick={onRename} icon={<Pencil className="size-4" />} disabled={!isConnected} />
                    <IconActionButton label="Deletar" onClick={onDelete} icon={<Trash2 className="size-4" />} danger disabled={!isConnected} />
                </motion.div>
            </div>
        </motion.li>
    );
}

function TreeItemEndpoint({ endpoint, level, isSelected, onSelect, onDelete, onRename, isConnected, onDragStart, onDragEnd, isDragging }: { endpoint: EndpointNode; level: number; isSelected: boolean; onSelect: () => void; onDelete: () => void; onRename: () => void; isConnected: boolean; onDragStart: () => void; onDragEnd: () => void; isDragging: boolean }) {
    return (
        <motion.li layout="position" initial={{ opacity: 0, x: -10 }} animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div
                className={`group flex h-7 items-center gap-1 rounded-md px-2 text-sm text-(--app-fg) hover:bg-(--app-surface-2) cursor-grab active:cursor-grabbing ${isSelected ? "bg-(--app-surface-2)" : ""}`}
                style={{ paddingLeft: 8 + level * 14 }}
                draggable={isConnected}
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    onDragStart();
                }}
                onDragEnd={onDragEnd}
                onClick={onSelect}
            >
                <span className="size-6" /> {/* Espaço para alinhar com itens que têm chevron */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Globe className="size-4 text-(--app-accent)" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[endpoint.method]} text-white`}>{endpoint.method}</span>
                    <span className="min-w-0 truncate" title={endpoint.name}>
                        {endpoint.name}
                    </span>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden items-center gap-1 group-hover:flex" onClick={(e) => e.stopPropagation()}>
                    <IconActionButton label="Renomear" onClick={onRename} icon={<Pencil className="size-4" />} disabled={!isConnected} />
                    <IconActionButton label="Deletar" onClick={onDelete} icon={<Trash2 className="size-4" />} danger disabled={!isConnected} />
                </motion.div>
            </div>
        </motion.li>
    );
}

function IconActionButton({ label, onClick, icon, danger, disabled }: { label: string; onClick: () => void; icon: React.ReactNode; danger?: boolean; disabled?: boolean }) {
    return (
        <button type="button" className={"inline-flex size-7 items-center justify-center rounded-md border border-transparent text-(--app-muted) hover:border-(--app-border) hover:bg-(--app-surface) cursor-pointer " + (danger ? "hover:text-(--app-danger)" : "hover:text-(--app-fg)") + " disabled:opacity-50 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:cursor-not-allowed"} onClick={onClick} aria-label={label} title={label} disabled={disabled}>
            {icon}
        </button>
    );
}

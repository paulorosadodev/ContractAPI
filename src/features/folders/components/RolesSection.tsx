import { useState, useRef, useEffect } from "react";
import { ChevronDown, GripVertical, Pencil, Plus, Trash2, Check, X, Users } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import type { Role } from "../model/folderTypes";

interface RolesSectionProps {
    roles: Role[];
    isConnected: boolean;
    onCreateRole: (name: string) => void;
    onRenameRole: (id: string, name: string) => void;
    onDeleteRole: (id: string) => void;
    onReorderRoles: (orderedIds: string[]) => void;
}

export default function RolesSection({ roles, isConnected, onCreateRole, onRenameRole, onDeleteRole, onReorderRoles }: RolesSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Ordena roles por order para exibição
    const sortedRoles = [...roles].sort((a, b) => a.order - b.order);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const handleCreateSubmit = () => {
        const name = newRoleName.trim();
        if (name) {
            onCreateRole(name);
        }
        setNewRoleName("");
        setIsCreating(false);
    };

    const handleCreateCancel = () => {
        setNewRoleName("");
        setIsCreating(false);
    };

    const handleEditStart = (role: Role) => {
        setEditingId(role.id);
        setEditingName(role.name);
    };

    const handleEditSubmit = () => {
        if (editingId && editingName.trim()) {
            onRenameRole(editingId, editingName.trim());
        }
        setEditingId(null);
        setEditingName("");
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleReorder = (newOrder: Role[]) => {
        const orderedIds = newOrder.map((r) => r.id);
        onReorderRoles(orderedIds);
    };

    return (
        <div className="flex flex-col">
            {/* Header colapsável */}
            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between px-3 py-2 hover:bg-(--app-surface-2) cursor-pointer">
                <div className="flex items-center gap-2">
                    <motion.div initial={false} animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.15 }}>
                        <ChevronDown className="size-4 text-(--app-muted)" />
                    </motion.div>
                    <Users className="size-4 text-(--app-accent)" />
                    <span className="text-xs font-medium text-(--app-fg)">Roles</span>
                    <span className="text-[10px] text-(--app-muted)">({roles.length})</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCreating(true);
                        setIsExpanded(true);
                    }}
                    disabled={!isConnected}
                    className="inline-flex size-6 items-center justify-center rounded-md text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Adicionar role"
                >
                    <Plus className="size-3.5" />
                </button>
            </button>

            {/* Lista de roles */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="px-1 pb-2">
                            {/* Input para criar nova role */}
                            {isCreating && (
                                <div className="flex items-center gap-1 px-2 py-1 mb-1">
                                    <span className="size-6" /> {/* Espaçador para alinhar com drag handle */}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCreateSubmit();
                                            if (e.key === "Escape") handleCreateCancel();
                                        }}
                                        placeholder="Nome da role"
                                        className="flex-1 px-2 py-1 text-sm bg-(--app-bg) border border-(--app-accent) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none"
                                    />
                                    <button type="button" onClick={handleCreateSubmit} className="p-1 rounded-md text-(--app-accent) hover:bg-(--app-surface-2) cursor-pointer">
                                        <Check className="size-4" />
                                    </button>
                                    <button type="button" onClick={handleCreateCancel} className="p-1 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface-2) cursor-pointer">
                                        <X className="size-4" />
                                    </button>
                                </div>
                            )}

                            {/* Lista reordenável */}
                            {sortedRoles.length > 0 ? (
                                <Reorder.Group axis="y" values={sortedRoles} onReorder={handleReorder} className="flex flex-col gap-0.5">
                                    {sortedRoles.map((role, index) => (
                                        <Reorder.Item key={role.id} value={role} dragListener={isConnected && editingId !== role.id} className="select-none">
                                            <RoleItem role={role} index={index} totalRoles={sortedRoles.length} isEditing={editingId === role.id} editingName={editingName} isConnected={isConnected} onEditStart={() => handleEditStart(role)} onEditChange={setEditingName} onEditSubmit={handleEditSubmit} onEditCancel={handleEditCancel} onDelete={() => onDeleteRole(role.id)} />
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            ) : (
                                !isCreating && <p className="px-3 py-2 text-xs text-(--app-muted) italic">Nenhuma role</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface RoleItemProps {
    role: Role;
    index: number;
    totalRoles: number;
    isEditing: boolean;
    editingName: string;
    isConnected: boolean;
    onEditStart: () => void;
    onEditChange: (name: string) => void;
    onEditSubmit: () => void;
    onEditCancel: () => void;
    onDelete: () => void;
}

function RoleItem({ role, index, totalRoles, isEditing, editingName, isConnected, onEditStart, onEditChange, onEditSubmit, onEditCancel, onDelete }: RoleItemProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Determina o tooltip de privilégio
    const getPrivilegeTooltip = () => {
        if (totalRoles === 1) return "Único privilégio";
        if (index === 0) return "Maior privilégio";
        if (index === totalRoles - 1) return "Menor privilégio";
        return undefined;
    };
    const privilegeTooltip = getPrivilegeTooltip();

    return (
        <div className={`group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-(--app-surface-2) ${isConnected && !isEditing ? "cursor-grab active:cursor-grabbing" : ""}`} title={privilegeTooltip}>
            {/* Drag handle */}
            <div className={`inline-flex size-6 items-center justify-center text-(--app-muted) ${!isConnected || isEditing ? "cursor-not-allowed opacity-30" : ""}`}>
                <GripVertical className="size-3.5" />
            </div>

            {/* Badge de ordem */}
            <div className="flex items-center justify-center size-5 rounded-full bg-(--app-accent) text-white text-[10px] font-bold shrink-0">{index + 1}</div>

            {/* Nome ou input de edição */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onEditSubmit();
                        if (e.key === "Escape") onEditCancel();
                    }}
                    onBlur={onEditSubmit}
                    className="flex-1 px-2 py-0.5 text-sm bg-(--app-bg) border border-(--app-accent) rounded-md text-(--app-fg) focus:outline-none"
                />
            ) : (
                <span className="flex-1 text-sm text-(--app-fg) truncate">{role.name}</span>
            )}

            {/* Ações */}
            {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-0.5">
                    <button type="button" onClick={onEditStart} disabled={!isConnected} className="p-1 rounded-md text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Renomear">
                        <Pencil className="size-3.5" />
                    </button>
                    <button type="button" onClick={onDelete} disabled={!isConnected} className="p-1 rounded-md text-(--app-muted) hover:text-(--app-danger) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Deletar">
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

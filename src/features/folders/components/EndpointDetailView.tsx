import { useState, useEffect } from "react";
import { Check, Copy, Globe, Pencil, Plus, Trash2, X } from "lucide-react";
import type { EndpointNode, ObjectNode, Role } from "../model/folderTypes";
import { MethodDropdown } from "./MethodDropdown";
import { RoleDropdown } from "./RoleDropdown";
import { JsonEditor } from "./JsonEditor";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const QUERY_PARAM_TYPES = ["string", "number", "boolean", "date"] as const;

interface EndpointDetailViewProps {
    endpoint: EndpointNode;
    objects: ObjectNode[];
    roles: Role[];
    isConnected: boolean;
    onBack: () => void;
    onUpdate: (updates: Partial<EndpointNode>) => void;
    onDelete: () => void;
}

export function EndpointDetailView({ endpoint, objects, roles, isConnected, onBack, onUpdate, onDelete }: EndpointDetailViewProps) {
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameInputValue, setRenameInputValue] = useState("");
    const [urlCopied, setUrlCopied] = useState(false);

    // Estados locais para inputs com blur update
    const [localPath, setLocalPath] = useState(endpoint.path);
    const [localDescription, setLocalDescription] = useState(endpoint.description || "");
    const [localQueryParams, setLocalQueryParams] = useState(endpoint.queryParams || []);
    const [localRequestBody, setLocalRequestBody] = useState(endpoint.requestBody || "");
    const [localResponseBody, setLocalResponseBody] = useState(endpoint.responseBody || "");

    // Sincroniza estado local quando o endpoint muda
    useEffect(() => {
        setLocalPath(endpoint.path);
        setLocalDescription(endpoint.description || "");
        setLocalQueryParams(endpoint.queryParams || []);
        setLocalRequestBody(endpoint.requestBody || "");
        setLocalResponseBody(endpoint.responseBody || "");
    }, [endpoint.id, endpoint.path, endpoint.description, endpoint.queryParams, endpoint.requestBody, endpoint.responseBody]);

    const selectedRole = roles.find((r) => r.id === endpoint.minRole);

    // Gera a URL para copiar (sem baseUrl)
    const getFullUrl = () => {
        let url = localPath || "/path";
        const params = localQueryParams.filter((p) => p.name);
        if (params.length > 0) {
            url += "?" + params.map((p) => `${p.name}={${p.type}}`).join("&");
        }
        return url;
    };

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(getFullUrl());
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
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
                    <Globe className="size-5 text-(--app-accent)" />
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getMethodColor(endpoint.method)} text-white`}>{endpoint.method}</span>
                    <h2 className="text-lg md:text-2xl font-semibold text-(--app-fg) truncate">{endpoint.name}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            setRenameInputValue(endpoint.name);
                            setRenameModalOpen(true);
                        }}
                        disabled={!isConnected}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md border border-(--app-border) text-(--app-muted) hover:bg-(--app-surface-2) hover:text-(--app-fg) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Renomear endpoint"
                    >
                        <Pencil className="size-4" />
                        <span className="hidden sm:inline">Renomear</span>
                    </button>
                    <button type="button" onClick={onDelete} disabled={!isConnected} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md border border-(--app-border) text-(--app-danger) hover:bg-(--app-danger) hover:text-white hover:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Deletar endpoint">
                        <Trash2 className="size-4" />
                        <span className="hidden sm:inline">Deletar</span>
                    </button>
                </div>
            </div>

            {/* URL com Método HTTP */}
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">URL</h3>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-(--app-border) bg-(--app-surface) font-mono text-sm">
                    <MethodDropdown value={endpoint.method} onChange={(method) => onUpdate({ method })} disabled={!isConnected} />
                    <span className="text-(--app-muted)">baseUrl</span>
                    <input
                        type="text"
                        value={localPath}
                        onChange={(e) => setLocalPath(e.target.value)}
                        onBlur={() => {
                            if (localPath !== endpoint.path) onUpdate({ path: localPath });
                        }}
                        disabled={!isConnected}
                        className="flex-1 bg-transparent text-(--app-fg) focus:outline-none disabled:opacity-50"
                        placeholder="/path/:param"
                    />
                </div>
            </div>

            {/* Role Mínima */}
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Role Mínima</h3>
                <RoleDropdown value={endpoint.minRole} onChange={(roleId) => onUpdate({ minRole: roleId })} roles={roles} disabled={!isConnected} />
                {selectedRole && <p className="text-xs text-(--app-muted)">Apenas usuários com role "{selectedRole.name}" ou superior terão acesso.</p>}
            </div>

            {/* Query Params */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Query Parameters</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const newParams = [...localQueryParams, { id: crypto.randomUUID(), name: "", type: "string", required: false }];
                            setLocalQueryParams(newParams);
                            onUpdate({ queryParams: newParams });
                        }}
                        disabled={!isConnected}
                        className="flex items-center gap-1 px-2 py-1 text-sm rounded-md text-(--app-accent) hover:bg-(--app-surface) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="size-4" />
                        Adicionar
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {localQueryParams.map((param, index) => (
                        <div key={param.id} className="flex items-center gap-2 p-2 rounded-md border border-(--app-border) bg-(--app-surface)">
                            <input
                                type="text"
                                value={param.name}
                                onChange={(e) => {
                                    const newParams = [...localQueryParams];
                                    newParams[index] = { ...newParams[index], name: e.target.value };
                                    setLocalQueryParams(newParams);
                                }}
                                onBlur={() => onUpdate({ queryParams: localQueryParams })}
                                placeholder="Nome do parâmetro"
                                disabled={!isConnected}
                                className="flex-1 px-2 py-1 text-sm bg-(--app-bg) border border-(--app-border) rounded text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-1 focus:ring-(--app-accent) disabled:opacity-50"
                            />
                            <select
                                value={param.type}
                                onChange={(e) => {
                                    const newParams = [...localQueryParams];
                                    newParams[index] = { ...newParams[index], type: e.target.value };
                                    setLocalQueryParams(newParams);
                                    onUpdate({ queryParams: newParams });
                                }}
                                disabled={!isConnected}
                                className="px-2 py-1 text-sm bg-(--app-bg) border border-(--app-border) rounded text-(--app-fg) focus:outline-none focus:ring-1 focus:ring-(--app-accent) cursor-pointer disabled:opacity-50"
                            >
                                {QUERY_PARAM_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={param.required}
                                    onChange={(e) => {
                                        const newParams = [...localQueryParams];
                                        newParams[index] = { ...newParams[index], required: e.target.checked };
                                        setLocalQueryParams(newParams);
                                        onUpdate({ queryParams: newParams });
                                    }}
                                    disabled={!isConnected}
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span className="text-xs text-(--app-muted)">Required</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    const newParams = localQueryParams.filter((_, i) => i !== index);
                                    setLocalQueryParams(newParams);
                                    onUpdate({ queryParams: newParams });
                                }}
                                disabled={!isConnected}
                                className="p-1 rounded text-(--app-muted) hover:text-(--app-danger) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                    {localQueryParams.length === 0 && <p className="text-sm text-(--app-muted) italic">Nenhum parâmetro de query</p>}
                </div>

                {/* URL Preview com query params */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg border border-(--app-border) bg-(--code-bg) font-mono text-sm overflow-x-auto">
                        <span className="text-(--app-muted)">baseUrl</span>
                        <span className="text-(--app-accent)">{localPath || "/path"}</span>
                        {localQueryParams.filter((p) => p.name).length > 0 && (
                            <span className="text-(--app-muted)">
                                ?
                                {localQueryParams
                                    .filter((p) => p.name)
                                    .map((p, i) => (
                                        <span key={p.id}>
                                            {i > 0 && "&"}
                                            <span className="text-(--app-fg)">{p.name}</span>
                                            <span className="text-(--app-muted)">=</span>
                                            <span className="text-green-400">{`{${p.type}}`}</span>
                                        </span>
                                    ))}
                            </span>
                        )}
                    </div>
                    <button type="button" onClick={handleCopyUrl} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${urlCopied ? "bg-green-600 text-white" : "bg-(--app-surface) border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface-2)"}`} title="Copiar URL">
                        {urlCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {urlCopied ? "Copiado!" : "Copiar"}
                    </button>
                </div>
            </div>

            {/* Request Body (para POST, PUT, PATCH) */}
            {(endpoint.method === "POST" || endpoint.method === "PUT" || endpoint.method === "PATCH") && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Request Body (JSON)</h3>
                    <JsonEditor
                        value={localRequestBody}
                        onChange={setLocalRequestBody}
                        onBlur={() => {
                            if (localRequestBody !== (endpoint.requestBody || "")) onUpdate({ requestBody: localRequestBody });
                        }}
                        disabled={!isConnected}
                        objects={objects}
                    />
                </div>
            )}

            {/* Response Body (para GET) */}
            {endpoint.method === "GET" && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Response Body (JSON)</h3>
                    <JsonEditor
                        value={localResponseBody}
                        onChange={setLocalResponseBody}
                        onBlur={() => {
                            if (localResponseBody !== (endpoint.responseBody || "")) onUpdate({ responseBody: localResponseBody });
                        }}
                        disabled={!isConnected}
                        objects={objects}
                    />
                </div>
            )}

            {/* Descrição */}
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider">Descrição</h3>
                <textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={() => {
                        if (localDescription !== (endpoint.description || "")) onUpdate({ description: localDescription });
                    }}
                    placeholder="Descrição do endpoint"
                    rows={3}
                    disabled={!isConnected}
                    className="px-3 py-2 text-sm bg-(--app-surface) border border-(--app-border) rounded-md text-(--app-fg) placeholder:text-(--app-muted) focus:outline-none focus:ring-2 focus:ring-(--app-accent) resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Modal para renomear */}
            <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Renomear Endpoint">
                <div className="flex flex-col gap-4">
                    <Input
                        label="Nome do endpoint"
                        value={renameInputValue}
                        onChange={(e) => setRenameInputValue(e.target.value)}
                        placeholder="Digite o nome"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && renameInputValue.trim()) {
                                onUpdate({ name: renameInputValue.trim() });
                                setRenameModalOpen(false);
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setRenameModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (renameInputValue.trim()) {
                                    onUpdate({ name: renameInputValue.trim() });
                                    setRenameModalOpen(false);
                                }
                            }}
                            disabled={!renameInputValue.trim()}
                        >
                            Renomear
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Helper para obter a cor do método HTTP
function getMethodColor(method: string): string {
    const colors: Record<string, string> = {
        GET: "bg-green-600",
        POST: "bg-blue-600",
        PUT: "bg-orange-500",
        PATCH: "bg-yellow-600",
        DELETE: "bg-red-600",
    };
    return colors[method] || "bg-gray-600";
}

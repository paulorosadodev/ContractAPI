import { Box, Folder, Globe } from "lucide-react";
import type { ObjectNode, EndpointNode, Role } from "../model/folderTypes";
import { generateTypeScriptCodeHighlighted, highlightJson } from "../utils/codeUtils";

// Cores para métodos HTTP
const METHOD_COLORS: Record<string, string> = {
    GET: "bg-green-600",
    POST: "bg-blue-600",
    PUT: "bg-orange-500",
    PATCH: "bg-yellow-600",
    DELETE: "bg-red-600",
};

interface CollectionObject extends ObjectNode {
    collectionPath: string[];
    isDirectChild: boolean;
}

interface CollectionEndpoint extends EndpointNode {
    collectionPath: string[];
    isDirectChild: boolean;
}

interface CollectionDetailViewProps {
    collectionName: string;
    objects: CollectionObject[];
    endpoints: CollectionEndpoint[];
    allObjects: ObjectNode[];
    roles: Role[];
    onBack: () => void;
    onSelectObject: (id: string) => void;
    onSelectEndpoint: (id: string) => void;
}

export function CollectionDetailView({ collectionName, objects, endpoints, allObjects, roles, onBack, onSelectObject, onSelectEndpoint }: CollectionDetailViewProps) {
    return (
        <div className="p-4 md:p-6 flex flex-col gap-6">
            {/* Header da coleção */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <button type="button" onClick={onBack} className="lg:hidden flex items-center justify-center size-8 rounded-md text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface) cursor-pointer" title="Voltar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <Folder className="size-5 text-(--app-accent)" />
                    <h2 className="text-lg md:text-xl font-semibold text-(--app-fg)">{collectionName}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-(--app-muted)">
                    <span>
                        {objects.length} {objects.length === 1 ? "objeto" : "objetos"}
                    </span>
                    <span>•</span>
                    <span>
                        {endpoints.length} {endpoints.length === 1 ? "endpoint" : "endpoints"}
                    </span>
                </div>
            </div>

            {/* Seção Objetos */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider flex items-center gap-2">
                    <Box className="size-4" />
                    Objetos
                </h3>
                {objects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {objects.map((obj) => (
                            <button key={obj.id} type="button" onClick={() => onSelectObject(obj.id)} className="flex flex-col rounded-lg border border-(--app-border) overflow-hidden hover:border-(--app-accent) transition-colors cursor-pointer text-left bg-(--code-bg)">
                                {/* Header do card com caminho da pasta */}
                                <div className="flex flex-col px-3 py-2 border-b border-(--app-border) bg-(--app-surface-2)">
                                    <div className="flex items-center gap-2">
                                        <Box className="size-4 text-(--app-accent) shrink-0" />
                                        <span className="text-sm font-medium text-(--app-fg) truncate">{obj.name}</span>
                                        <span className="text-xs text-(--app-muted)">({obj.kind})</span>
                                    </div>
                                    {/* Mostrar caminho apenas se objeto não é filho direto da coleção selecionada */}
                                    {!obj.isDirectChild && obj.collectionPath.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-(--app-muted)">
                                            <Folder className="size-3 shrink-0" />
                                            <span className="truncate">{obj.collectionPath.join(" / ")}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Preview do código */}
                                <div className="h-32 overflow-hidden">
                                    <pre className="p-3 text-xs font-mono leading-relaxed h-full">
                                        <code dangerouslySetInnerHTML={{ __html: generateTypeScriptCodeHighlighted(obj, allObjects) }} />
                                    </pre>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-(--app-muted) border border-dashed border-(--app-border) rounded-lg">
                        <p className="text-sm">Nenhum objeto nesta coleção</p>
                    </div>
                )}
            </div>

            {/* Seção Endpoints */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-(--app-muted) uppercase tracking-wider flex items-center gap-2">
                    <Globe className="size-4" />
                    Endpoints
                </h3>
                {endpoints.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {endpoints.map((ep) => (
                            <button key={ep.id} type="button" onClick={() => onSelectEndpoint(ep.id)} className="flex flex-col rounded-lg border border-(--app-border) overflow-hidden hover:border-(--app-accent) transition-colors cursor-pointer text-left bg-(--app-surface)">
                                {/* Header do card */}
                                <div className="flex flex-col px-3 py-2 border-b border-(--app-border) bg-(--app-surface-2)">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]} text-white`}>{ep.method}</span>
                                        <span className="text-sm font-medium text-(--app-fg) truncate flex-1">{ep.name}</span>
                                        {ep.minRole && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--app-surface) border border-(--app-border) text-(--app-muted)" title="Role mínima">
                                                {roles.find((r) => r.id === ep.minRole)?.name || "Role"}
                                            </span>
                                        )}
                                    </div>
                                    {!ep.isDirectChild && ep.collectionPath.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-(--app-muted)">
                                            <Folder className="size-3 shrink-0" />
                                            <span className="truncate">{ep.collectionPath.join(" / ")}</span>
                                        </div>
                                    )}
                                </div>
                                {/* URL Preview */}
                                <div className="px-3 pt-2 font-mono text-xs text-(--app-muted)">
                                    <span className="text-(--app-fg)">baseUrl</span>
                                    <span className="text-(--app-accent)">{ep.path}</span>
                                    {(ep.queryParams || []).length > 0 && (
                                        <span className="text-(--app-muted)">
                                            ?
                                            {ep
                                                .queryParams!.map((p) => p.name)
                                                .filter(Boolean)
                                                .join("&")}
                                        </span>
                                    )}
                                </div>
                                {/* Body JSON Preview */}
                                {(ep.requestBody?.trim() || ep.responseBody?.trim()) && (
                                    <div className="h-24 overflow-hidden border-t border-(--app-border) mt-2">
                                        <pre className="p-2 text-xs font-mono leading-relaxed h-full bg-(--code-bg)">
                                            <code dangerouslySetInnerHTML={{ __html: highlightJson(ep.requestBody?.trim() || ep.responseBody || "") }} />
                                        </pre>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-(--app-muted) border border-dashed border-(--app-border) rounded-lg">
                        <p className="text-sm">Nenhum endpoint nesta coleção</p>
                    </div>
                )}
            </div>
        </div>
    );
}

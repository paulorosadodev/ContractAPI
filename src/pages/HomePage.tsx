import { useMemo } from "react";
import FolderExplorer from "../features/folders/components/FolderExplorer";
import { ObjectDetailView } from "../features/folders/components/ObjectDetailView";
import { EndpointDetailView } from "../features/folders/components/EndpointDetailView";
import { CollectionDetailView } from "../features/folders/components/CollectionDetailView";
import Navbar from "../shared/components/Navbar";
import { useSession } from "../features/folders/context/SessionContext";
import { useSidebarResize } from "../features/folders/hooks/useSidebarResize";
import { collectAllCollectionIds, getCollectionName, getCollectionPath } from "../features/folders/utils/collectionUtils";

interface HomePageProps {
    onBackToLanding?: () => void;
}

export default function HomePage({ onBackToLanding }: HomePageProps) {
    // Contexto de sessão
    const { mode, sessionId, startCollaborativeSession, leaveSession, getShareableLink, data } = useSession();

    // Dados do hook apropriado (local ou colaborativo)
    const { tree, objects, endpoints, roles, selectedCollectionId, selectedObjectId, selectedEndpointId, setSelectedCollectionId, setSelectedObjectId, setSelectedEndpointId, isConnected, isLoading, clientCount, createCollection, renameCollection, deleteCollection, moveCollection, createObject, updateObject, deleteObject, moveObject, importData, exportData, createRole, renameRole, deleteRole, reorderRoles, createEndpoint, updateEndpoint, deleteEndpoint, moveEndpoint } = data;

    // Hook de resize da sidebar
    const { sidebarWidth, isResizing, sidebarRef, handleMouseDown } = useSidebarResize();

    // Dados computados
    const selectedObject = selectedObjectId ? objects.find((obj) => obj.id === selectedObjectId) : null;
    const selectedEndpoint = selectedEndpointId ? endpoints.find((ep) => ep.id === selectedEndpointId) : null;

    // Objetos da coleção selecionada e suas subcoleções
    const selectedCollectionObjects = useMemo(() => {
        if (!selectedCollectionId || selectedObjectId || selectedEndpointId) return [];
        const allIds = collectAllCollectionIds(tree, selectedCollectionId);
        return objects
            .filter((obj) => allIds.includes(obj.collectionId))
            .map((obj) => ({
                ...obj,
                collectionPath: getCollectionPath(tree, obj.collectionId),
                isDirectChild: obj.collectionId === selectedCollectionId,
            }));
    }, [objects, selectedCollectionId, selectedObjectId, selectedEndpointId, tree]);

    // Endpoints da coleção selecionada e suas subcoleções
    const selectedCollectionEndpoints = useMemo(() => {
        if (!selectedCollectionId || selectedObjectId || selectedEndpointId) return [];
        const allIds = collectAllCollectionIds(tree, selectedCollectionId);
        return endpoints
            .filter((ep) => allIds.includes(ep.collectionId))
            .map((ep) => ({
                ...ep,
                collectionPath: getCollectionPath(tree, ep.collectionId),
                isDirectChild: ep.collectionId === selectedCollectionId,
            }));
    }, [endpoints, selectedCollectionId, selectedObjectId, selectedEndpointId, tree]);

    // Nome da coleção selecionada
    const selectedCollectionName = useMemo(() => {
        if (!selectedCollectionId) return "";
        return getCollectionName(tree, selectedCollectionId);
    }, [tree, selectedCollectionId]);

    // Handlers de seleção
    const handleSelectCollection = (id: string) => {
        setSelectedCollectionId(id);
        setSelectedObjectId(null);
        setSelectedEndpointId(null);
    };

    const handleDeselect = () => {
        setSelectedCollectionId(null);
        setSelectedObjectId(null);
        setSelectedEndpointId(null);
    };

    const handleRenameObject = (id: string, name: string) => {
        updateObject(id, { name });
    };

    // Determina qual conteúdo está selecionado
    const hasSelection = selectedObject || selectedEndpoint || selectedCollectionId;

    return (
        <div className="flex h-full flex-col">
            <Navbar isConnected={isConnected} clientCount={clientCount} onImport={importData} onExport={exportData} onBackToLanding={onBackToLanding} sessionMode={mode} sessionId={sessionId} onStartSession={startCollaborativeSession} onLeaveSession={leaveSession} getShareableLink={getShareableLink} />

            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                {/* Sidebar com FolderExplorer */}
                <aside ref={sidebarRef} style={{ width: window.innerWidth >= 1024 ? sidebarWidth : undefined }} className={`${hasSelection ? "hidden lg:flex" : "flex"} h-full w-full lg:w-auto shrink-0 flex-col border-r border-(--app-border) bg-(--app-surface) relative`}>
                    <FolderExplorer
                        tree={tree}
                        objects={objects}
                        endpoints={endpoints}
                        roles={roles}
                        isConnected={isConnected}
                        isLoading={isLoading}
                        selectedCollectionId={selectedCollectionId}
                        selectedObjectId={selectedObjectId}
                        selectedEndpointId={selectedEndpointId}
                        onSelectCollection={handleSelectCollection}
                        onSelectObject={(id) => {
                            setSelectedObjectId(id);
                            setSelectedEndpointId(null);
                        }}
                        onSelectEndpoint={(id) => {
                            setSelectedEndpointId(id);
                            setSelectedObjectId(null);
                        }}
                        onDeselect={handleDeselect}
                        onCreate={createCollection}
                        onRename={renameCollection}
                        onDelete={deleteCollection}
                        onMoveCollection={moveCollection}
                        onDeleteObject={deleteObject}
                        onRenameObject={handleRenameObject}
                        onMoveObject={moveObject}
                        onCreateObject={createObject}
                        onCreateEndpoint={createEndpoint}
                        onDeleteEndpoint={deleteEndpoint}
                        onRenameEndpoint={(id, name) => updateEndpoint(id, { name })}
                        onMoveEndpoint={moveEndpoint}
                        onCreateRole={createRole}
                        onRenameRole={renameRole}
                        onDeleteRole={deleteRole}
                        onReorderRoles={reorderRoles}
                    />

                    {/* Resize handle */}
                    <div onMouseDown={handleMouseDown} className="hidden lg:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-(--app-accent) transition-colors z-10" style={{ backgroundColor: isResizing ? "var(--app-accent)" : undefined }} />
                </aside>

                {/* Área de conteúdo principal */}
                <section className={`${hasSelection ? "flex" : "hidden lg:flex"} flex-1 bg-(--app-bg) overflow-auto flex-col`}>
                    {selectedEndpoint ? (
                        <EndpointDetailView
                            endpoint={selectedEndpoint}
                            objects={objects}
                            roles={roles}
                            isConnected={isConnected}
                            onBack={() => setSelectedEndpointId(null)}
                            onUpdate={(updates) => updateEndpoint(selectedEndpoint.id, updates)}
                            onDelete={() => {
                                deleteEndpoint(selectedEndpoint.id);
                                setSelectedEndpointId(null);
                            }}
                        />
                    ) : selectedObject ? (
                        <ObjectDetailView
                            object={selectedObject}
                            objects={objects}
                            isConnected={isConnected}
                            onBack={() => setSelectedObjectId(null)}
                            onUpdate={(updates) => updateObject(selectedObject.id, updates)}
                            onDelete={() => {
                                deleteObject(selectedObject.id);
                                setSelectedObjectId(null);
                            }}
                            onSelectObject={setSelectedObjectId}
                        />
                    ) : selectedCollectionId ? (
                        <CollectionDetailView collectionName={selectedCollectionName} objects={selectedCollectionObjects} endpoints={selectedCollectionEndpoints} allObjects={objects} roles={roles} onBack={() => setSelectedCollectionId(null)} onSelectObject={setSelectedObjectId} onSelectEndpoint={setSelectedEndpointId} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-(--app-muted)">Selecione um objeto, endpoint ou coleção para visualizar</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

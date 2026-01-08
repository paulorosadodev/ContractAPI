import { useCallback, useEffect, useState } from "react";
import type { FolderId, CollectionNode, ObjectNode, DataStore, Role, EndpointNode, HttpMethod } from "../model/folderTypes";

const STORAGE_KEY = "contract-api-local-data";

// Helper para verificar se uma coleção existe na árvore (incluindo subcoleções)
function collectionExistsInTree(collections: CollectionNode[], id: string): boolean {
    for (const collection of collections) {
        if (collection.id === id) return true;
        if (collectionExistsInTree(collection.children, id)) return true;
    }
    return false;
}

// Helper para gerar IDs únicos
function generateId(): string {
    return crypto.randomUUID();
}

// Funções auxiliares para manipular a árvore
function addCollectionToTree(tree: CollectionNode[], parentId: FolderId | null, newCollection: CollectionNode): CollectionNode[] {
    if (parentId === null) {
        return [...tree, newCollection];
    }
    return tree.map((node) => {
        if (node.id === parentId) {
            return { ...node, children: [...node.children, newCollection] };
        }
        return { ...node, children: addCollectionToTree(node.children, parentId, newCollection) };
    });
}

function renameCollectionInTree(tree: CollectionNode[], id: FolderId, name: string): CollectionNode[] {
    return tree.map((node) => {
        if (node.id === id) {
            return { ...node, name };
        }
        return { ...node, children: renameCollectionInTree(node.children, id, name) };
    });
}

function deleteCollectionFromTree(tree: CollectionNode[], id: FolderId): CollectionNode[] {
    return tree.filter((node) => node.id !== id).map((node) => ({ ...node, children: deleteCollectionFromTree(node.children, id) }));
}

function getCollectionIdsRecursive(collection: CollectionNode): string[] {
    return [collection.id, ...collection.children.flatMap(getCollectionIdsRecursive)];
}

function findCollectionById(tree: CollectionNode[], id: FolderId): CollectionNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        const found = findCollectionById(node.children, id);
        if (found) return found;
    }
    return null;
}

function removeCollectionFromTree(tree: CollectionNode[], id: FolderId): { tree: CollectionNode[]; removed: CollectionNode | null } {
    let removed: CollectionNode | null = null;
    const newTree = tree.filter((node) => {
        if (node.id === id) {
            removed = node;
            return false;
        }
        return true;
    });
    if (removed) return { tree: newTree, removed };
    return {
        tree: newTree.map((node) => {
            const result = removeCollectionFromTree(node.children, id);
            if (result.removed) removed = result.removed;
            return { ...node, children: result.tree };
        }),
        removed,
    };
}

function moveCollectionInTree(tree: CollectionNode[], id: FolderId, newParentId: FolderId | null): CollectionNode[] {
    const { tree: treeWithoutCollection, removed } = removeCollectionFromTree(tree, id);
    if (!removed) return tree;
    return addCollectionToTree(treeWithoutCollection, newParentId, removed);
}

export function useLocalData() {
    const [tree, setTree] = useState<CollectionNode[]>([]);
    const [objects, setObjects] = useState<ObjectNode[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [endpoints, setEndpoints] = useState<EndpointNode[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Carrega dados do localStorage na inicialização
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored) as DataStore;
                setTree(data.collections || []);
                setObjects(data.objects || []);
                setRoles(data.roles || []);
                setEndpoints(data.endpoints || []);
            }
        } catch {
            // Se houver erro, usa dados padrão
        }
        setIsLoading(false);
    }, []);

    // Salva dados no localStorage sempre que mudam
    useEffect(() => {
        if (isLoading) return;
        const data: DataStore = { collections: tree, objects, roles, endpoints };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [tree, objects, roles, endpoints, isLoading]);

    // Limpa a seleção se a coleção ou objeto selecionado não existe mais
    useEffect(() => {
        if (selectedCollectionId && !collectionExistsInTree(tree, selectedCollectionId)) {
            setSelectedCollectionId(null);
        }
    }, [tree, selectedCollectionId]);

    useEffect(() => {
        if (selectedObjectId && !objects.some((o) => o.id === selectedObjectId)) {
            setSelectedObjectId(null);
        }
    }, [objects, selectedObjectId]);

    useEffect(() => {
        if (selectedEndpointId && !endpoints.some((e) => e.id === selectedEndpointId)) {
            setSelectedEndpointId(null);
        }
    }, [endpoints, selectedEndpointId]);

    // Collections
    const createCollection = useCallback((parentId: FolderId | null, name: string) => {
        const newCollection: CollectionNode = {
            id: generateId(),
            name,
            children: [],
        };
        setTree((prev) => addCollectionToTree(prev, parentId, newCollection));
    }, []);

    const renameCollection = useCallback((id: FolderId, name: string) => {
        setTree((prev) => renameCollectionInTree(prev, id, name));
    }, []);

    const deleteCollection = useCallback(
        (id: FolderId) => {
            // Encontra a coleção e todas as subcoleções
            const collection = findCollectionById(tree, id);
            if (!collection) return;

            const allIds = getCollectionIdsRecursive(collection);

            // Remove a coleção da árvore
            setTree((prev) => deleteCollectionFromTree(prev, id));

            // Remove objetos das coleções deletadas
            setObjects((prev) => prev.filter((obj) => !allIds.includes(obj.collectionId)));

            // Remove endpoints das coleções deletadas
            setEndpoints((prev) => prev.filter((ep) => !allIds.includes(ep.collectionId)));
        },
        [tree],
    );

    const moveCollection = useCallback((id: FolderId, newParentId: FolderId | null) => {
        setTree((prev) => moveCollectionInTree(prev, id, newParentId));
    }, []);

    // Objects
    const createObject = useCallback((collectionId: string, name: string, kind: "interface" | "type" | "enum" = "interface", fields: Array<{ name: string; type: string; required: boolean }> = [], enumValues?: string[]) => {
        const newObject: ObjectNode = {
            id: generateId(),
            name,
            collectionId,
            kind,
            fields: fields.map((f) => ({ ...f, id: generateId() })),
            enumValues,
        };
        setObjects((prev) => [...prev, newObject]);
    }, []);

    const updateObject = useCallback((id: string, updates: Partial<ObjectNode>) => {
        setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)));
    }, []);

    const deleteObject = useCallback((id: string) => {
        setObjects((prev) => prev.filter((obj) => obj.id !== id));
    }, []);

    const moveObject = useCallback((id: string, newCollectionId: string) => {
        setObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, collectionId: newCollectionId } : obj)));
    }, []);

    // Import/Export
    const importData = useCallback((data: DataStore) => {
        setTree(data.collections || []);
        setObjects(data.objects || []);
        setRoles(data.roles || []);
        setEndpoints(data.endpoints || []);
    }, []);

    const exportData = useCallback((): DataStore => {
        return { collections: tree, objects, roles, endpoints };
    }, [tree, objects, roles, endpoints]);

    // Roles
    const createRole = useCallback((name: string) => {
        setRoles((prev) => {
            const maxOrder = prev.reduce((max, r) => Math.max(max, r.order), 0);
            return [...prev, { id: generateId(), name, order: maxOrder + 1 }];
        });
    }, []);

    const renameRole = useCallback((id: string, name: string) => {
        setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
    }, []);

    const deleteRole = useCallback((id: string) => {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        // Remove referências ao role deletado nos endpoints
        setEndpoints((prev) => prev.map((ep) => (ep.minRole === id ? { ...ep, minRole: undefined } : ep)));
    }, []);

    const reorderRoles = useCallback((orderedIds: string[]) => {
        setRoles((prev) =>
            prev.map((r) => {
                const newOrder = orderedIds.indexOf(r.id);
                return newOrder >= 0 ? { ...r, order: newOrder } : r;
            }),
        );
    }, []);

    // Endpoints
    const createEndpoint = useCallback((collectionId: string, name: string, path: string, method: HttpMethod = "GET", minRole?: string, queryParams?: Array<{ name: string; type: string; required: boolean; description?: string }>, requestBody?: string, responseBody?: string, description?: string) => {
        const newEndpoint: EndpointNode = {
            id: generateId(),
            name,
            collectionId,
            path,
            method,
            minRole,
            queryParams: (queryParams || []).map((qp) => ({ ...qp, id: generateId() })),
            requestBody,
            responseBody,
            description,
        };
        setEndpoints((prev) => [...prev, newEndpoint]);
    }, []);

    const updateEndpoint = useCallback((id: string, updates: Partial<EndpointNode>) => {
        setEndpoints((prev) => prev.map((ep) => (ep.id === id ? { ...ep, ...updates } : ep)));
    }, []);

    const deleteEndpoint = useCallback((id: string) => {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    }, []);

    const moveEndpoint = useCallback((id: string, newCollectionId: string) => {
        setEndpoints((prev) => prev.map((ep) => (ep.id === id ? { ...ep, collectionId: newCollectionId } : ep)));
    }, []);

    return {
        tree,
        objects,
        roles,
        endpoints,
        selectedCollectionId,
        selectedObjectId,
        selectedEndpointId,
        setSelectedCollectionId,
        setSelectedObjectId,
        setSelectedEndpointId,
        isConnected: true, // Modo local sempre está "conectado" (permite ações)
        isLoading,
        clientCount: 1, // Apenas o usuário local
        createCollection,
        renameCollection,
        deleteCollection,
        moveCollection,
        createObject,
        updateObject,
        deleteObject,
        moveObject,
        importData,
        exportData,
        createRole,
        renameRole,
        deleteRole,
        reorderRoles,
        createEndpoint,
        updateEndpoint,
        deleteEndpoint,
        moveEndpoint,
    };
}

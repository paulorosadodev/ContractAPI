import { useCallback, useEffect, useRef, useState } from "react";
import type { FolderId, CollectionNode, ObjectNode, DataStore, Role, EndpointNode, HttpMethod } from "../model/folderTypes";

type ServerMessage = { type: "INIT"; data: DataStore } | { type: "DATA_UPDATE"; data: DataStore } | { type: "CLIENT_COUNT"; count: number };

type ClientMessage = { type: "CREATE_COLLECTION"; parentId: FolderId | null; name: string } | { type: "RENAME_COLLECTION"; id: FolderId; name: string } | { type: "DELETE_COLLECTION"; id: FolderId } | { type: "MOVE_COLLECTION"; id: FolderId; newParentId: FolderId | null } | { type: "CREATE_OBJECT"; collectionId: string; name: string; kind: "interface" | "type" | "enum"; fields: Array<{ name: string; type: string; required: boolean }>; enumValues?: string[] } | { type: "UPDATE_OBJECT"; id: string; updates: Partial<ObjectNode> } | { type: "DELETE_OBJECT"; id: string } | { type: "MOVE_OBJECT"; id: string; newCollectionId: string } | { type: "IMPORT_DATA"; data: DataStore } | { type: "CREATE_ROLE"; name: string } | { type: "RENAME_ROLE"; id: string; name: string } | { type: "DELETE_ROLE"; id: string } | { type: "REORDER_ROLES"; orderedIds: string[] } | { type: "CREATE_ENDPOINT"; collectionId: string; name: string; path: string; method: HttpMethod; minRole?: string; queryParams?: Array<{ name: string; type: string; required: boolean; description?: string }>; requestBody?: string; responseBody?: string; description?: string } | { type: "UPDATE_ENDPOINT"; id: string; updates: Partial<EndpointNode> } | { type: "DELETE_ENDPOINT"; id: string } | { type: "MOVE_ENDPOINT"; id: string; newCollectionId: string };

// Helper para verificar se uma coleção existe na árvore (incluindo subcoleções)
function collectionExistsInTree(collections: CollectionNode[], id: string): boolean {
    for (const collection of collections) {
        if (collection.id === id) return true;
        if (collectionExistsInTree(collection.children, id)) return true;
    }
    return false;
}

function getWsUrl() {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws`;
}

export function useFoldersWs() {
    const [tree, setTree] = useState<CollectionNode[]>([]);
    const [objects, setObjects] = useState<ObjectNode[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [endpoints, setEndpoints] = useState<EndpointNode[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [clientCount, setClientCount] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);

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

    useEffect(() => {
        const ws = new WebSocket(getWsUrl());
        wsRef.current = ws;

        ws.onopen = () => setIsConnected(true);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as ServerMessage;
                if (data.type === "INIT" || data.type === "DATA_UPDATE") {
                    setTree(data.data.collections);
                    setObjects(data.data.objects);
                    setRoles(data.data.roles || []);
                    setEndpoints(data.data.endpoints || []);
                    setIsLoading(false);
                } else if (data.type === "CLIENT_COUNT") {
                    setClientCount(data.count);
                }
            } catch {
                // ignore malformed messages
            }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => setIsConnected(false);

        return () => {
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, []);

    const send = useCallback((msg: ClientMessage) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify(msg));
    }, []);

    const createCollection = useCallback(
        (parentId: FolderId | null, name: string) => {
            send({ type: "CREATE_COLLECTION", parentId, name });
        },
        [send],
    );

    const renameCollection = useCallback(
        (id: FolderId, name: string) => {
            send({ type: "RENAME_COLLECTION", id, name });
        },
        [send],
    );

    const deleteCollection = useCallback(
        (id: FolderId) => {
            send({ type: "DELETE_COLLECTION", id });
        },
        [send],
    );

    const moveCollection = useCallback(
        (id: FolderId, newParentId: FolderId | null) => {
            send({ type: "MOVE_COLLECTION", id, newParentId });
        },
        [send],
    );

    const createObject = useCallback(
        (collectionId: string, name: string, kind: "interface" | "type" | "enum" = "interface", fields: Array<{ name: string; type: string; required: boolean }> = [], enumValues?: string[]) => {
            send({ type: "CREATE_OBJECT", collectionId, name, kind, fields, enumValues });
        },
        [send],
    );

    const updateObject = useCallback(
        (id: string, updates: Partial<ObjectNode>) => {
            send({ type: "UPDATE_OBJECT", id, updates });
        },
        [send],
    );

    const deleteObject = useCallback(
        (id: string) => {
            send({ type: "DELETE_OBJECT", id });
        },
        [send],
    );

    const moveObject = useCallback(
        (id: string, newCollectionId: string) => {
            send({ type: "MOVE_OBJECT", id, newCollectionId });
        },
        [send],
    );

    const importData = useCallback(
        (data: DataStore) => {
            send({ type: "IMPORT_DATA", data });
        },
        [send],
    );

    const exportData = useCallback((): DataStore => {
        return { collections: tree, objects, roles, endpoints };
    }, [tree, objects, roles, endpoints]);

    const createRole = useCallback(
        (name: string) => {
            send({ type: "CREATE_ROLE", name });
        },
        [send],
    );

    const renameRole = useCallback(
        (id: string, name: string) => {
            send({ type: "RENAME_ROLE", id, name });
        },
        [send],
    );

    const deleteRole = useCallback(
        (id: string) => {
            send({ type: "DELETE_ROLE", id });
        },
        [send],
    );

    const reorderRoles = useCallback(
        (orderedIds: string[]) => {
            send({ type: "REORDER_ROLES", orderedIds });
        },
        [send],
    );

    const createEndpoint = useCallback(
        (collectionId: string, name: string, path: string, method: HttpMethod = "GET", minRole?: string, queryParams?: Array<{ name: string; type: string; required: boolean; description?: string }>, requestBody?: string, responseBody?: string, description?: string) => {
            send({ type: "CREATE_ENDPOINT", collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description });
        },
        [send],
    );

    const updateEndpoint = useCallback(
        (id: string, updates: Partial<EndpointNode>) => {
            send({ type: "UPDATE_ENDPOINT", id, updates });
        },
        [send],
    );

    const deleteEndpoint = useCallback(
        (id: string) => {
            send({ type: "DELETE_ENDPOINT", id });
        },
        [send],
    );

    const moveEndpoint = useCallback(
        (id: string, newCollectionId: string) => {
            send({ type: "MOVE_ENDPOINT", id, newCollectionId });
        },
        [send],
    );

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
        isConnected,
        isLoading,
        clientCount,
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

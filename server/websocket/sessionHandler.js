import { randomUUID } from "node:crypto";
import { getSessionData, setSessionData, broadcastToSession } from "../services/sessionService.js";
import { normalizeName } from "../utils/string.js";

/**
 * @typedef {import('../types/data.js').DataStore} DataStore
 * @typedef {import('../types/data.js').CollectionNode} CollectionNode
 */

// ============================================
// FUNÇÕES AUXILIARES (copiadas/adaptadas de dataService.js)
// ============================================

function addChildRecursive(nodes, parentId, newNode) {
    return nodes.map((node) => {
        if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
        }
        return { ...node, children: addChildRecursive(node.children, parentId, newNode) };
    });
}

function renameRecursive(nodes, id, name) {
    return nodes.map((node) => {
        if (node.id === id) {
            return { ...node, name };
        }
        return { ...node, children: renameRecursive(node.children, id, name) };
    });
}

function deleteRecursive(nodes, id) {
    return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: deleteRecursive(n.children, id) }));
}

function getCollectionIdsRecursive(ids, nodes) {
    let result = [...ids];
    for (const node of nodes) {
        if (ids.includes(node.id)) {
            result = [...result, ...getAllChildIds(node)];
        } else {
            result = [...result, ...getCollectionIdsRecursive(ids, node.children)];
        }
    }
    return result;
}

function getAllChildIds(node) {
    return [node.id, ...node.children.flatMap(getAllChildIds)];
}

// ============================================
// OPERAÇÕES DE SESSÃO
// ============================================

/**
 * Cria uma coleção em uma sessão
 */
function createCollection(sessionId, parentId, name) {
    const data = getSessionData(sessionId);
    const normalizedName = normalizeName(name);
    const newNode = {
        id: randomUUID(),
        name: normalizedName,
        children: [],
    };

    if (!parentId) {
        data.collections = [...data.collections, newNode];
    } else {
        data.collections = addChildRecursive(data.collections, parentId, newNode);
    }

    return setSessionData(sessionId, data);
}

/**
 * Renomeia uma coleção em uma sessão
 */
function renameCollection(sessionId, id, name) {
    const data = getSessionData(sessionId);
    const normalizedName = normalizeName(name);
    data.collections = renameRecursive(data.collections, id, normalizedName);
    return setSessionData(sessionId, data);
}

/**
 * Deleta uma coleção em uma sessão
 */
function deleteCollection(sessionId, id) {
    const data = getSessionData(sessionId);
    const collectionIds = getCollectionIdsRecursive([id], data.collections);
    data.objects = data.objects.filter((obj) => !collectionIds.includes(obj.collectionId));
    if (data.endpoints) {
        data.endpoints = data.endpoints.filter((ep) => !collectionIds.includes(ep.collectionId));
    }
    data.collections = deleteRecursive(data.collections, id);
    return setSessionData(sessionId, data);
}

/**
 * Move uma coleção em uma sessão
 */
function moveCollection(sessionId, id, newParentId) {
    const data = getSessionData(sessionId);

    if (id === newParentId) {
        throw new Error("Não é possível mover uma coleção para si mesma");
    }

    let movedNode = null;
    const findAndRemove = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                movedNode = nodes[i];
                return [...nodes.slice(0, i), ...nodes.slice(i + 1)];
            }
            if (nodes[i].children.length > 0) {
                const newChildren = findAndRemove(nodes[i].children);
                if (movedNode) {
                    return nodes.map((n, idx) => (idx === i ? { ...n, children: newChildren } : n));
                }
            }
        }
        return nodes;
    };

    data.collections = findAndRemove(data.collections);

    if (!movedNode) {
        throw new Error("Coleção não encontrada");
    }

    if (!newParentId) {
        data.collections = [...data.collections, movedNode];
    } else {
        data.collections = addChildRecursive(data.collections, newParentId, movedNode);
    }

    return setSessionData(sessionId, data);
}

/**
 * Cria um objeto em uma sessão
 */
function createObject(sessionId, collectionId, name, kind = "interface", fields = [], enumValues = []) {
    const data = getSessionData(sessionId);
    const normalizedName = normalizeName(name);
    const newObject = {
        id: randomUUID(),
        name: normalizedName,
        collectionId,
        fields: fields.map((f) => ({
            id: randomUUID(),
            name: normalizeName(f.name),
            type: f.type,
            required: f.required,
        })),
        kind,
        enumValues: kind === "enum" ? enumValues : undefined,
    };
    data.objects = [...data.objects, newObject];
    return setSessionData(sessionId, data);
}

/**
 * Atualiza um objeto em uma sessão
 */
function updateObject(sessionId, id, updates) {
    const data = getSessionData(sessionId);
    data.objects = data.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj));
    return setSessionData(sessionId, data);
}

/**
 * Deleta um objeto em uma sessão
 */
function deleteObject(sessionId, id) {
    const data = getSessionData(sessionId);
    data.objects = data.objects.filter((obj) => obj.id !== id);
    return setSessionData(sessionId, data);
}

/**
 * Move um objeto em uma sessão
 */
function moveObject(sessionId, id, newCollectionId) {
    const data = getSessionData(sessionId);
    data.objects = data.objects.map((obj) => (obj.id === id ? { ...obj, collectionId: newCollectionId } : obj));
    return setSessionData(sessionId, data);
}

/**
 * Importa dados em uma sessão
 */
function importData(sessionId, importedData) {
    if (!importedData || !Array.isArray(importedData.collections) || !Array.isArray(importedData.objects)) {
        throw new Error("Dados inválidos para importação");
    }
    return setSessionData(sessionId, importedData);
}

/**
 * Cria uma role em uma sessão
 */
function createRole(sessionId, name) {
    const data = getSessionData(sessionId);
    if (!data.roles) data.roles = [];
    const maxOrder = data.roles.reduce((max, r) => Math.max(max, r.order || 0), 0);
    data.roles = [...data.roles, { id: randomUUID(), name, order: maxOrder + 1 }];
    return setSessionData(sessionId, data);
}

/**
 * Renomeia uma role em uma sessão
 */
function renameRole(sessionId, id, name) {
    const data = getSessionData(sessionId);
    if (!data.roles) data.roles = [];
    data.roles = data.roles.map((r) => (r.id === id ? { ...r, name } : r));
    return setSessionData(sessionId, data);
}

/**
 * Deleta uma role em uma sessão
 */
function deleteRole(sessionId, id) {
    const data = getSessionData(sessionId);
    if (!data.roles) data.roles = [];
    data.roles = data.roles.filter((r) => r.id !== id);
    if (data.endpoints) {
        data.endpoints = data.endpoints.map((ep) => (ep.minRole === id ? { ...ep, minRole: undefined } : ep));
    }
    return setSessionData(sessionId, data);
}

/**
 * Reordena roles em uma sessão
 */
function reorderRoles(sessionId, orderedIds) {
    const data = getSessionData(sessionId);
    if (!data.roles) data.roles = [];
    data.roles = data.roles.map((r) => {
        const newOrder = orderedIds.indexOf(r.id);
        return newOrder >= 0 ? { ...r, order: newOrder } : r;
    });
    return setSessionData(sessionId, data);
}

/**
 * Cria um endpoint em uma sessão
 */
function createEndpoint(sessionId, collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description) {
    const data = getSessionData(sessionId);
    if (!data.endpoints) data.endpoints = [];
    const newEndpoint = {
        id: randomUUID(),
        name,
        collectionId,
        path,
        method: method || "GET",
        minRole,
        queryParams: (queryParams || []).map((qp) => ({ ...qp, id: randomUUID() })),
        requestBody,
        responseBody,
        description,
    };
    data.endpoints = [...data.endpoints, newEndpoint];
    return setSessionData(sessionId, data);
}

/**
 * Atualiza um endpoint em uma sessão
 */
function updateEndpoint(sessionId, id, updates) {
    const data = getSessionData(sessionId);
    if (!data.endpoints) data.endpoints = [];
    data.endpoints = data.endpoints.map((ep) => (ep.id === id ? { ...ep, ...updates } : ep));
    return setSessionData(sessionId, data);
}

/**
 * Deleta um endpoint em uma sessão
 */
function deleteEndpoint(sessionId, id) {
    const data = getSessionData(sessionId);
    if (!data.endpoints) data.endpoints = [];
    data.endpoints = data.endpoints.filter((ep) => ep.id !== id);
    return setSessionData(sessionId, data);
}

/**
 * Move um endpoint em uma sessão
 */
function moveEndpoint(sessionId, id, newCollectionId) {
    const data = getSessionData(sessionId);
    if (!data.endpoints) data.endpoints = [];
    data.endpoints = data.endpoints.map((ep) => (ep.id === id ? { ...ep, collectionId: newCollectionId } : ep));
    return setSessionData(sessionId, data);
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

/**
 * Configura os handlers do WebSocket para sessões
 * @param {import('ws').WebSocket} ws
 * @param {string} sessionId
 */
export function setupSessionDataHandlers(ws, sessionId) {
    const broadcast = (data) => broadcastToSession(sessionId, data);

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case "CREATE_COLLECTION": {
                    const parentId = data.parentId ? String(data.parentId) : null;
                    const store = createCollection(sessionId, parentId, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "RENAME_COLLECTION": {
                    const id = String(data.id ?? "");
                    const store = renameCollection(sessionId, id, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_COLLECTION": {
                    const id = String(data.id ?? "");
                    const store = deleteCollection(sessionId, id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_COLLECTION": {
                    const { id, newParentId } = data;
                    const store = moveCollection(sessionId, id, newParentId);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "CREATE_OBJECT": {
                    const { collectionId, name, kind, fields, enumValues } = data;
                    const store = createObject(sessionId, collectionId, name, kind, fields, enumValues);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "UPDATE_OBJECT": {
                    const { id, updates } = data;
                    const store = updateObject(sessionId, id, updates);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_OBJECT": {
                    const { id } = data;
                    const store = deleteObject(sessionId, id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_OBJECT": {
                    const { id, newCollectionId } = data;
                    const store = moveObject(sessionId, id, newCollectionId);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "IMPORT_DATA": {
                    const store = importData(sessionId, data.data);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "CREATE_ROLE": {
                    const store = createRole(sessionId, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "RENAME_ROLE": {
                    const store = renameRole(sessionId, data.id, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_ROLE": {
                    const store = deleteRole(sessionId, data.id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "REORDER_ROLES": {
                    const store = reorderRoles(sessionId, data.orderedIds);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "CREATE_ENDPOINT": {
                    const { collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description } = data;
                    const store = createEndpoint(sessionId, collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "UPDATE_ENDPOINT": {
                    const { id, updates } = data;
                    const store = updateEndpoint(sessionId, id, updates);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_ENDPOINT": {
                    const { id } = data;
                    const store = deleteEndpoint(sessionId, id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_ENDPOINT": {
                    const { id, newCollectionId } = data;
                    const store = moveEndpoint(sessionId, id, newCollectionId);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                default:
                    console.log("Tipo de mensagem desconhecido:", data.type);
            }
        } catch (error) {
            console.error("Erro ao processar mensagem:", error);
            ws.send(
                JSON.stringify({
                    type: "ERROR",
                    error: error.message || "Erro desconhecido",
                }),
            );
        }
    });
}

/**
 * Envia o estado inicial de uma sessão para um cliente
 * @param {import('ws').WebSocket} ws
 * @param {string} sessionId
 */
export function sendSessionInitialState(ws, sessionId) {
    try {
        ws.send(
            JSON.stringify({
                type: "INIT",
                data: getSessionData(sessionId),
            }),
        );
    } catch (error) {
        console.error("Erro ao enviar estado inicial da sessão:", error);
    }
}

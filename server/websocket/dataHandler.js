import { createCollection, renameCollection, deleteCollection, moveCollection, createObject, updateObject, deleteObject, moveObject, getDataStore, importData, createRole, renameRole, deleteRole, reorderRoles, createEndpoint, updateEndpoint, deleteEndpoint, moveEndpoint } from "../services/dataService.js";

/**
 * Configura os handlers do WebSocket
 * @param {import('ws').WebSocket} ws
 * @param {(data: any) => void} broadcast
 */
export function setupDataHandlers(ws, broadcast) {
    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                // OPERAÇÕES DE COLEÇÕES
                case "CREATE_COLLECTION": {
                    const parentId = data.parentId ? String(data.parentId) : null;
                    const store = createCollection(parentId, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "RENAME_COLLECTION": {
                    const id = String(data.id ?? "");
                    const store = renameCollection(id, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_COLLECTION": {
                    const id = String(data.id ?? "");
                    const store = deleteCollection(id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_COLLECTION": {
                    const { id, newParentId } = data;
                    const store = moveCollection(id, newParentId);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                // OPERAÇÕES DE OBJETOS
                case "CREATE_OBJECT": {
                    const { collectionId, name, kind, fields, enumValues } = data;
                    const store = createObject(collectionId, name, kind, fields, enumValues);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "UPDATE_OBJECT": {
                    const { id, updates } = data;
                    const store = updateObject(id, updates);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_OBJECT": {
                    const { id } = data;
                    const store = deleteObject(id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_OBJECT": {
                    const { id, newCollectionId } = data;
                    const store = moveObject(id, newCollectionId);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "IMPORT_DATA": {
                    const store = importData(data.data);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                // OPERAÇÕES DE ROLES
                case "CREATE_ROLE": {
                    const store = createRole(data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "RENAME_ROLE": {
                    const store = renameRole(data.id, data.name);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_ROLE": {
                    const store = deleteRole(data.id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "REORDER_ROLES": {
                    const store = reorderRoles(data.orderedIds);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                // OPERAÇÕES DE ENDPOINTS
                case "CREATE_ENDPOINT": {
                    const { collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description } = data;
                    const store = createEndpoint(collectionId, name, path, method, minRole, queryParams, requestBody, responseBody, description);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "UPDATE_ENDPOINT": {
                    const { id, updates } = data;
                    const store = updateEndpoint(id, updates);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "DELETE_ENDPOINT": {
                    const { id } = data;
                    const store = deleteEndpoint(id);
                    broadcast({ type: "DATA_UPDATE", data: store });
                    break;
                }

                case "MOVE_ENDPOINT": {
                    const { id, newCollectionId } = data;
                    const store = moveEndpoint(id, newCollectionId);
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
 * Envia o estado inicial para um cliente
 * @param {import('ws').WebSocket} ws
 */
export function sendInitialState(ws) {
    try {
        ws.send(
            JSON.stringify({
                type: "INIT",
                data: getDataStore(),
            }),
        );
    } catch (error) {
        console.error("Erro ao enviar estado inicial:", error);
    }
}

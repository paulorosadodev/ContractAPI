import { createFolder, updateFolderName, removeFolder, getFolderTree } from "../services/folderService.js";

/**
 * Configura os handlers do WebSocket para mensagens relacionadas a coleções
 * @param {import('ws').WebSocket} ws
 * @param {(data: any) => void} broadcast
 */
export function setupFolderHandlers(ws, broadcast) {
    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case "CREATE_COLLECTION": {
                    const parentId = data.parentId ? String(data.parentId) : null;
                    const tree = createFolder(parentId, data.name);
                    broadcast({ type: "TREE_UPDATE", tree });
                    break;
                }

                case "RENAME_COLLECTION": {
                    const id = String(data.id ?? "");
                    const tree = updateFolderName(id, data.name);
                    broadcast({ type: "TREE_UPDATE", tree });
                    break;
                }

                case "DELETE_COLLECTION": {
                    const id = String(data.id ?? "");
                    const tree = removeFolder(id);
                    broadcast({ type: "TREE_UPDATE", tree });
                    break;
                }

                default:
                    console.log("Tipo de mensagem desconhecido:", data.type);
            }
        } catch (error) {
            console.error("Erro ao processar mensagem:", error);
            // Opcionalmente, enviar erro de volta ao cliente
            ws.send(
                JSON.stringify({
                    type: "ERROR",
                    message: error.message,
                }),
            );
        }
    });
}

/**
 * Envia o estado inicial para um novo cliente
 * @param {import('ws').WebSocket} ws
 */
export function sendInitialState(ws) {
    ws.send(
        JSON.stringify({
            type: "INIT",
            tree: getFolderTree(),
        }),
    );
}

import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDataService } from "./services/dataService.js";
import { setupDataHandlers, sendInitialState } from "./websocket/dataHandler.js";
import { setupSessionDataHandlers, sendSessionInitialState } from "./websocket/sessionHandler.js";
import { joinSession, leaveSession, broadcastSessionClientCount } from "./services/sessionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do build (produção)
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

// Broadcast para todos os clientes conectados
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(JSON.stringify(data));
        }
    });
}

// Broadcast client count to all connected clients (para conexões sem sessão)
function broadcastClientCount() {
    const count = Array.from(wss.clients).filter((c) => !c.sessionId).length;
    wss.clients.forEach((client) => {
        if (client.readyState === 1 && !client.sessionId) {
            client.send(JSON.stringify({ type: "CLIENT_COUNT", count }));
        }
    });
}

// Extrai sessionId da URL
function getSessionIdFromUrl(request) {
    try {
        const url = new URL(request.url, `http://${request.headers.host}`);
        return url.searchParams.get("session");
    } catch {
        return null;
    }
}

// WebSocket connection
wss.on("connection", (ws, request) => {
    const sessionId = getSessionIdFromUrl(request);

    if (sessionId) {
        // Conexão de sessão colaborativa
        console.log(`Cliente conectado à sessão: ${sessionId}`);
        ws.sessionId = sessionId;

        // Adiciona cliente à sessão
        joinSession(sessionId, ws);

        // Envia o estado inicial da sessão
        sendSessionInitialState(ws, sessionId);

        // Broadcast contagem de clientes para a sessão
        broadcastSessionClientCount(sessionId);

        // Configura os handlers de mensagens para sessão
        setupSessionDataHandlers(ws, sessionId);

        ws.on("close", () => {
            console.log(`Cliente desconectado da sessão: ${sessionId}`);
            leaveSession(sessionId, ws);
            broadcastSessionClientCount(sessionId);
        });
    } else {
        // Conexão sem sessão (modo legado/compatibilidade)
        console.log("Novo cliente conectado (sem sessão)");

        // Envia o estado inicial
        sendInitialState(ws);

        // Broadcast updated client count
        broadcastClientCount();

        // Configura os handlers de mensagens
        setupDataHandlers(ws, broadcast);

        ws.on("close", () => {
            console.log("Cliente desconectado (sem sessão)");
            broadcastClientCount();
        });
    }

    ws.on("error", (error) => {
        console.error("Erro no WebSocket:", error);
    });
});

// Rota catch-all para SPA (retorna index.html para todas as rotas)
app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;

// Inicializa o serviço de dados e inicia o servidor
await initializeDataService();
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`WebSocket disponível em ws://0.0.0.0:${PORT}/ws`);
    console.log(`Acesse de outros dispositivos usando o IP da sua máquina na rede local`);
});

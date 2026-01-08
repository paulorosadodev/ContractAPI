import { randomUUID } from "node:crypto";
import { DEFAULT_DATA } from "../types/data.js";

/**
 * @typedef {import('../types/data.js').DataStore} DataStore
 */

/**
 * @typedef {Object} Session
 * @property {string} id - ID da sessão
 * @property {DataStore} data - Dados da sessão
 * @property {Set<import('ws').WebSocket>} clients - Clientes conectados
 * @property {number} createdAt - Timestamp de criação
 */

/**
 * Mapa de sessões ativas
 * @type {Map<string, Session>}
 */
const sessions = new Map();

// Tempo de expiração de sessões inativas (30 minutos)
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Cria ou obtém uma sessão
 * @param {string} sessionId
 * @returns {Session}
 */
export function getOrCreateSession(sessionId) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            id: sessionId,
            data: structuredClone(DEFAULT_DATA),
            clients: new Set(),
            createdAt: Date.now(),
        });
    }
    return sessions.get(sessionId);
}

/**
 * Obtém uma sessão existente
 * @param {string} sessionId
 * @returns {Session | undefined}
 */
export function getSession(sessionId) {
    return sessions.get(sessionId);
}

/**
 * Adiciona um cliente a uma sessão
 * @param {string} sessionId
 * @param {import('ws').WebSocket} ws
 * @returns {Session}
 */
export function joinSession(sessionId, ws) {
    const session = getOrCreateSession(sessionId);
    session.clients.add(ws);
    return session;
}

/**
 * Remove um cliente de uma sessão
 * @param {string} sessionId
 * @param {import('ws').WebSocket} ws
 */
export function leaveSession(sessionId, ws) {
    const session = sessions.get(sessionId);
    if (session) {
        session.clients.delete(ws);
        // Se não houver mais clientes, agenda a expiração da sessão
        if (session.clients.size === 0) {
            scheduleSessionCleanup(sessionId);
        }
    }
}

/**
 * Agenda limpeza de sessão inativa
 * @param {string} sessionId
 */
function scheduleSessionCleanup(sessionId) {
    setTimeout(() => {
        const session = sessions.get(sessionId);
        if (session && session.clients.size === 0) {
            sessions.delete(sessionId);
            console.log(`Sessão ${sessionId} expirada e removida`);
        }
    }, SESSION_EXPIRY_MS);
}

/**
 * Retorna o número de clientes em uma sessão
 * @param {string} sessionId
 * @returns {number}
 */
export function getSessionClientCount(sessionId) {
    const session = sessions.get(sessionId);
    return session ? session.clients.size : 0;
}

/**
 * Broadcast para todos os clientes de uma sessão
 * @param {string} sessionId
 * @param {any} data
 */
export function broadcastToSession(sessionId, data) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const message = JSON.stringify(data);
    session.clients.forEach((client) => {
        if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(message);
        }
    });
}

/**
 * Broadcast client count para uma sessão
 * @param {string} sessionId
 */
export function broadcastSessionClientCount(sessionId) {
    const count = getSessionClientCount(sessionId);
    broadcastToSession(sessionId, { type: "CLIENT_COUNT", count });
}

/**
 * Obtém os dados de uma sessão
 * @param {string} sessionId
 * @returns {DataStore}
 */
export function getSessionData(sessionId) {
    const session = getOrCreateSession(sessionId);
    return session.data;
}

/**
 * Atualiza os dados de uma sessão
 * @param {string} sessionId
 * @param {DataStore} data
 * @returns {DataStore}
 */
export function setSessionData(sessionId, data) {
    const session = getOrCreateSession(sessionId);
    session.data = data;
    return session.data;
}

/**
 * Lista todas as sessões ativas (para debug)
 * @returns {Array<{id: string, clientCount: number, createdAt: number}>}
 */
export function listSessions() {
    return Array.from(sessions.values()).map((s) => ({
        id: s.id,
        clientCount: s.clients.size,
        createdAt: s.createdAt,
    }));
}

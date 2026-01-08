import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocalData } from "../hooks/useLocalData";
import { useFoldersWs } from "../hooks/useFoldersWs";

type SessionMode = "local" | "collaborative";

interface SessionContextValue {
    mode: SessionMode;
    sessionId: string | null;
    isSessionHost: boolean;
    startCollaborativeSession: () => string;
    joinSession: (sessionId: string) => void;
    leaveSession: () => void;
    getShareableLink: () => string | null;
    // Dados e operações (delegados para o hook apropriado)
    data: ReturnType<typeof useLocalData>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Gera um ID de sessão curto e amigável
function generateSessionId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Extrai sessionId da URL
function getSessionIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("session");
}

interface SessionProviderProps {
    children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    const [mode, setMode] = useState<SessionMode>("local");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSessionHost, setIsSessionHost] = useState(false);

    // Hooks de dados
    const localData = useLocalData();
    const wsData = useFoldersWs(sessionId); // Passa sessionId para o WebSocket

    // Verifica se há uma sessão na URL ao carregar
    useEffect(() => {
        const urlSessionId = getSessionIdFromUrl();
        if (urlSessionId) {
            setSessionId(urlSessionId);
            setMode("collaborative");
            setIsSessionHost(false);
        }
    }, []);

    // Inicia uma nova sessão colaborativa
    const startCollaborativeSession = useCallback(() => {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        setMode("collaborative");
        setIsSessionHost(true);

        // Atualiza a URL com o sessionId
        const url = new URL(window.location.href);
        url.searchParams.set("session", newSessionId);
        window.history.pushState({}, "", url.toString());

        return newSessionId;
    }, []);

    // Entra em uma sessão existente
    const joinSession = useCallback((id: string) => {
        setSessionId(id);
        setMode("collaborative");
        setIsSessionHost(false);

        // Atualiza a URL com o sessionId
        const url = new URL(window.location.href);
        url.searchParams.set("session", id);
        window.history.pushState({}, "", url.toString());
    }, []);

    // Sai da sessão colaborativa e volta para modo local
    const leaveSession = useCallback(() => {
        setSessionId(null);
        setMode("local");
        setIsSessionHost(false);

        // Remove sessionId da URL
        const url = new URL(window.location.href);
        url.searchParams.delete("session");
        window.history.pushState({}, "", url.toString());
    }, []);

    // Retorna o link compartilhável
    const getShareableLink = useCallback(() => {
        if (!sessionId) return null;
        const url = new URL(window.location.href);
        url.searchParams.set("session", sessionId);
        return url.toString();
    }, [sessionId]);

    // Retorna os dados apropriados baseado no modo
    const data = mode === "collaborative" ? wsData : localData;

    const value: SessionContextValue = {
        mode,
        sessionId,
        isSessionHost,
        startCollaborativeSession,
        joinSession,
        leaveSession,
        getShareableLink,
        data,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}

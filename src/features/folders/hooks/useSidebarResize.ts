import { useState, useEffect, useRef, type RefObject } from "react";

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;
const STORAGE_KEY = "sidebar-width";

interface UseSidebarResizeReturn {
    sidebarWidth: number;
    isResizing: boolean;
    sidebarRef: RefObject<HTMLElement | null>;
    handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Hook para gerenciar o resize da sidebar com persistência no localStorage
 */
export function useSidebarResize(): UseSidebarResizeReturn {
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    });
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);
    const resizeWidthRef = useRef(sidebarWidth);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        resizeWidthRef.current = sidebarWidth;
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;
            const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
            resizeWidthRef.current = newWidth;
            // Atualiza diretamente o DOM para evitar re-renders
            sidebarRef.current.style.width = `${newWidth}px`;
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                setSidebarWidth(resizeWidthRef.current);
                localStorage.setItem(STORAGE_KEY, String(resizeWidthRef.current));
            }
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing]);

    return {
        sidebarWidth,
        isResizing,
        sidebarRef,
        handleMouseDown,
    };
}

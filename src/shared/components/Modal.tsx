import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: "sm" | "md" | "lg";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen, onClose]);

    const sizeStyles = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} className={`pointer-events-auto relative w-full ${sizeStyles[size]} max-h-[85vh] flex flex-col rounded-lg border border-(--app-border) bg-(--app-surface) shadow-2xl`}>
                            <div className="flex items-center justify-between border-b border-(--app-border) px-6 py-4 shrink-0">
                                <h2 className="text-lg font-semibold text-(--app-fg)">{title}</h2>
                                <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-(--app-muted) transition-colors hover:bg-(--app-surface-2) hover:text-(--app-fg) cursor-pointer">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">{children}</div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

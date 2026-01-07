import type { ComponentProps } from "react";
import { motion } from "framer-motion";

interface InputProps extends Omit<ComponentProps<typeof motion.input>, "initial" | "animate"> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
    return (
        <div className="flex w-full flex-col gap-1.5">
            {label && <label className="text-sm font-medium text-(--app-fg)">{label}</label>}
            <motion.input initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`flex h-10 w-full rounded-md border border-(--app-border) bg-(--app-surface-2) px-3 py-2 text-sm text-(--app-fg) placeholder:text-(--app-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-accent) focus-visible:ring-offset-1 focus-visible:ring-offset-(--app-bg) disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
            {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-red-400">
                    {error}
                </motion.p>
            )}
        </div>
    );
}

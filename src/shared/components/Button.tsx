import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
}

export default function Button({ children, variant = "primary", size = "md", className = "", disabled, ...props }: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-accent) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantStyles = {
        primary: "bg-(--app-accent) text-(--app-bg) hover:bg-(--app-accent)/90",
        secondary: "border border-(--app-border) bg-(--app-surface-2) text-(--app-fg) hover:bg-(--app-surface-2)/80",
        danger: "bg-red-500 text-white hover:bg-red-600",
        ghost: "text-(--app-fg) hover:bg-(--app-surface-2)",
    };

    const sizeStyles = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
    };

    return (
        <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} cursor-pointer ${className}`} disabled={disabled} {...props}>
            {children}
        </button>
    );
}

import type { ReactNode } from "react";

interface AppLayoutProps {
    children: ReactNode;
    onBackToLanding?: () => void;
}

export default function AppLayout({ children, onBackToLanding }: AppLayoutProps) {
    return (
        <div className="flex h-full flex-col bg-(--app-bg) text-(--app-fg)" data-back-to-landing={onBackToLanding ? "true" : "false"}>
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    );
}

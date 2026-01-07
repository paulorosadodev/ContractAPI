import { useRef } from "react";
import { Download, Upload, Users, Moon, Sun, Code2 } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface NavbarProps {
    isConnected?: boolean;
    clientCount?: number;
    onImport?: (data: any) => void;
    onExport?: () => any;
    onBackToLanding?: () => void;
}

export default function Navbar({ isConnected, clientCount, onImport, onExport, onBackToLanding }: NavbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { theme, toggleTheme } = useTheme();

    const handleExport = () => {
        if (!onExport) return;
        const data = onExport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contractapi-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onImport) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                onImport(data);
            } catch {
                alert("Erro ao importar: arquivo JSON inválido");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    return (
        <header className="h-(--app-navbar-h) border-b border-(--app-border) bg-(--app-surface)/70 backdrop-blur supports-backdrop-filter:bg-(--app-surface)/60" role="banner">
            <div className="mx-auto flex h-full w-full items-center justify-between px-2 md:px-4">
                <button type="button" onClick={onBackToLanding} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold tracking-wide text-(--app-fg) hover:opacity-80 transition-opacity cursor-pointer" title="Voltar para página inicial">
                    <span className="inline-flex size-7 md:size-8 items-center justify-center rounded-md border border-(--app-border) bg-(--app-surface-2)">
                        <Code2 className="size-3.5 md:size-4 text-(--app-accent)" />
                    </span>
                    <span>ContractAPI</span>
                </button>

                {/* Botões de Import/Export */}
                {(onImport || onExport) && (
                    <div className="flex items-center gap-1 ml-2">
                        {onImport && (
                            <>
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface-2) cursor-pointer transition-colors" title="Importar JSON">
                                    <Upload className="size-3.5" />
                                    <span className="hidden sm:inline">Importar</span>
                                </button>
                            </>
                        )}
                        {onExport && (
                            <button type="button" onClick={handleExport} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface-2) cursor-pointer transition-colors" title="Exportar JSON">
                                <Download className="size-3.5" />
                                <span className="hidden sm:inline">Exportar</span>
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs">
                    {/* Theme Toggle */}
                    <button type="button" onClick={toggleTheme} className="flex items-center justify-center size-8 rounded-md border border-(--app-border) text-(--app-muted) hover:text-(--app-fg) hover:bg-(--app-surface-2) cursor-pointer transition-colors" title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}>
                        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </button>

                    {clientCount !== undefined && clientCount > 0 && (
                        <div className="flex items-center gap-1 md:gap-1.5 rounded-full bg-(--app-surface-2) px-1.5 md:px-2.5 py-0.5 md:py-1 text-(--app-muted)">
                            <Users className="size-3 md:size-3.5" />
                            <span className="font-medium">{clientCount}</span>
                            <span className="hidden sm:inline">online</span>
                        </div>
                    )}

                    {isConnected !== undefined && (
                        <div className={`flex items-center gap-1 md:gap-1.5 rounded-full px-1.5 md:px-2.5 py-0.5 md:py-1 ${isConnected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            <div className={`h-1 md:h-1.5 w-1 md:w-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400 animate-pulse"}`}></div>
                            <span className="hidden sm:inline font-medium">{isConnected ? "Conectado" : "Desconectado"}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

import { useState } from "react";
import { ThemeProvider } from "./shared/hooks/useTheme";
import { SessionProvider } from "./features/folders/context/SessionContext";
import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";

// Extrai sessionId da URL
function getSessionIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("session");
}

function App() {
    const [showApp, setShowApp] = useState(() => {
        // Se há uma sessão na URL, vai direto para o app
        if (getSessionIdFromUrl()) {
            return true;
        }
        // Verifica se o usuário já acessou o app antes
        return localStorage.getItem("contract-api-entered") === "true";
    });

    const handleEnterApp = () => {
        localStorage.setItem("contract-api-entered", "true");
        setShowApp(true);
    };

    const handleBackToLanding = () => {
        localStorage.removeItem("contract-api-entered");
        setShowApp(false);
    };

    if (!showApp) {
        return (
            <ThemeProvider>
                <LandingPage onEnterApp={handleEnterApp} />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <SessionProvider>
                <AppLayout>
                    <HomePage onBackToLanding={handleBackToLanding} />
                </AppLayout>
            </SessionProvider>
        </ThemeProvider>
    );
}

export default App;

import { useState } from "react";
import { ThemeProvider } from "./shared/hooks/useTheme";
import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";

function App() {
    const [showApp, setShowApp] = useState(() => {
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
            <AppLayout>
                <HomePage onBackToLanding={handleBackToLanding} />
            </AppLayout>
        </ThemeProvider>
    );
}

export default App;

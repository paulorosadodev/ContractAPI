import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: "0.0.0.0", // Garante que o servidor ouça conexões externas
        allowedHosts: true,
        proxy: {
            "/ws": {
                target: "http://localhost:3001",
                ws: true,
                changeOrigin: true,
            },
        },
    },
});

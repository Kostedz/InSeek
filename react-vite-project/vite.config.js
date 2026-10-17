import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 3000, // Specify the development server port
        fs: {
            // Allow serving files from node_modules or specific packages
            allow: ['..', 'node_modules/pdfjs-dist']
        }
    },
});
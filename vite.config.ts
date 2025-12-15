import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (do arquivo .env local ou do sistema/Vercel)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    // Define variáveis globais para o código do navegador
    define: {
      // Isso permite usar 'process.env.API_KEY' no código do frontend
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});
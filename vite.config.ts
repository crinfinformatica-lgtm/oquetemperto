
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'O Que Tem Perto?',
          short_name: 'O Que Tem Perto?',
          description: 'Eletricista, diarista, fotógrafo, carreto... Contrate todo tipo de serviço aqui!',
          theme_color: '#0047AB',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    root: '.',
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000
    },
    define: {
      // Expose generic env vars if they exist in the environment (e.g. Vercel) but aren't prefixed with VITE_
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || ''),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || ''),
      'process.env.FIREBASE_DATABASE_URL': JSON.stringify(env.FIREBASE_DATABASE_URL || ''),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || ''),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || ''),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || ''),
    }
  };
});

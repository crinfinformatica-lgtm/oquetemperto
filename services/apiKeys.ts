
// Este arquivo lê as chaves das Variáveis de Ambiente do Vite/Vercel
// As chaves reais devem ser configuradas no arquivo .env (local) ou no painel da Vercel (produção)

const getEnv = (key: string, viteKey: string): string => {
  // 1. Tenta pegar do Vite (import.meta.env) se disponível
  try {
    // Cast para any para evitar erros de TS se types não estiverem configurados
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[viteKey]) {
      return meta.env[viteKey];
    }
  } catch (e) {
    // Ignora erro se import.meta não existir
  }

  // 2. Tenta pegar do process.env (Node/CRA/Webpack/Vercel Serverless)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Prioriza a chave VITE_ se existir no process.env
      if (process.env[viteKey]) return process.env[viteKey] || '';
      if (process.env[key]) return process.env[key] || '';
    }
  } catch (e) {
    // Ignora erro
  }

  return "";
};

// Chave da API do Gemini (Google Generative AI)
export const GEMINI_API_KEY = getEnv('GEMINI_API_KEY', 'VITE_GEMINI_API_KEY');

// Chaves do Firebase
export const FIREBASE_KEYS = {
  apiKey: getEnv('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('FIREBASE_DATABASE_URL', 'VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID')
};

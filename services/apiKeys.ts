// Helper para ler do LocalStorage (Configuração Manual via UI)
const getLocal = (key: string): string => {
  try {
    if (typeof window === 'undefined') return "";
    return (window.localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
};

const clean = (val: any): string => {
  if (typeof val !== 'string') return "";
  const t = val.trim();
  // Filtra valores inválidos injetados por builders
  if (t === "undefined" || t === "null" || t === "" || t === "NULL" || t === "[object Object]") return "";
  return t;
};

// Objeto de ambiente do Vite/Process
const viteEnv = (import.meta as any).env || {};

/**
 * FIREBASE_KEYS: 
 * Prioriza Variáveis de Ambiente para Produção.
 * LocalStorage serve apenas para recuperação de emergência via painel de login.
 */
export const FIREBASE_KEYS = {
  apiKey: clean(getLocal('FIREBASE_API_KEY')) || clean(viteEnv.VITE_FIREBASE_API_KEY) || clean(process.env.FIREBASE_API_KEY),
  authDomain: clean(getLocal('FIREBASE_AUTH_DOMAIN')) || clean(viteEnv.VITE_FIREBASE_AUTH_DOMAIN) || clean(process.env.FIREBASE_AUTH_DOMAIN),
  databaseURL: clean(getLocal('FIREBASE_DATABASE_URL')) || clean(viteEnv.VITE_FIREBASE_DATABASE_URL) || clean(process.env.FIREBASE_DATABASE_URL),
  projectId: clean(getLocal('FIREBASE_PROJECT_ID')) || clean(viteEnv.VITE_FIREBASE_PROJECT_ID) || clean(process.env.FIREBASE_PROJECT_ID),
  storageBucket: clean(getLocal('FIREBASE_STORAGE_BUCKET')) || clean(viteEnv.VITE_FIREBASE_STORAGE_BUCKET) || clean(process.env.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(getLocal('FIREBASE_MESSAGING_SENDER_ID')) || clean(viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || clean(process.env.FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(getLocal('FIREBASE_APP_ID')) || clean(viteEnv.VITE_FIREBASE_APP_ID) || clean(process.env.FIREBASE_APP_ID)
};
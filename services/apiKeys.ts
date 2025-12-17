
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
 * Prioriza LocalStorage (emergência), depois Variáveis de Ambiente, 
 * e por fim usa as chaves fixas do projeto fornecidas pelo usuário.
 */
export const FIREBASE_KEYS = {
  apiKey: clean(getLocal('FIREBASE_API_KEY')) || clean(viteEnv.VITE_FIREBASE_API_KEY) || clean(process.env.FIREBASE_API_KEY) || "AIzaSyAxzB5f3Vk1oa0NqCgRn-5G4kEUrGblvwk",
  authDomain: clean(getLocal('FIREBASE_AUTH_DOMAIN')) || clean(viteEnv.VITE_FIREBASE_AUTH_DOMAIN) || clean(process.env.FIREBASE_AUTH_DOMAIN) || "oquetempertocl.firebaseapp.com",
  databaseURL: clean(getLocal('FIREBASE_DATABASE_URL')) || clean(viteEnv.VITE_FIREBASE_DATABASE_URL) || clean(process.env.FIREBASE_DATABASE_URL) || "https://oquetempertocl-default-rtdb.firebaseio.com",
  projectId: clean(getLocal('FIREBASE_PROJECT_ID')) || clean(viteEnv.VITE_FIREBASE_PROJECT_ID) || clean(process.env.FIREBASE_PROJECT_ID) || "oquetempertocl",
  storageBucket: clean(getLocal('FIREBASE_STORAGE_BUCKET')) || clean(viteEnv.VITE_FIREBASE_STORAGE_BUCKET) || clean(process.env.FIREBASE_STORAGE_BUCKET) || "oquetempertocl.firebasestorage.app",
  messagingSenderId: clean(getLocal('FIREBASE_MESSAGING_SENDER_ID')) || clean(viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || clean(process.env.FIREBASE_MESSAGING_SENDER_ID) || "1029721075176",
  appId: clean(getLocal('FIREBASE_APP_ID')) || clean(viteEnv.VITE_FIREBASE_APP_ID) || clean(process.env.FIREBASE_APP_ID) || "1:1029721075176:web:e08ad0c8a5b6090dc0085d"
};

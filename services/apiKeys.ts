
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
  // Evita strings literais que alguns builders injetam quando a variável está vazia ou mal configurada
  if (t === "undefined" || t === "null" || t === "" || t === "NULL" || t === "[object Object]") return "";
  return t;
};

// Objeto de ambiente do Vite
const viteEnv = (import.meta as any).env || {};

/**
 * FIREBASE_KEYS: 
 * 1. Tenta LocalStorage (para correções rápidas via UI)
 * 2. Tenta Variáveis de Ambiente (Vite ou Process)
 * 3. Fallback para as chaves reais do projeto fornecidas pelo usuário
 */
export const FIREBASE_KEYS = {
  apiKey: clean(getLocal('FIREBASE_API_KEY')) || clean(viteEnv.VITE_FIREBASE_API_KEY) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_API_KEY : '') || "AIzaSyAxzB5f3Vk1oa0NqCgRn-5G4kEUrGblvwk",
  authDomain: clean(getLocal('FIREBASE_AUTH_DOMAIN')) || clean(viteEnv.VITE_FIREBASE_AUTH_DOMAIN) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_AUTH_DOMAIN : '') || "oquetempertocl.firebaseapp.com",
  databaseURL: clean(getLocal('FIREBASE_DATABASE_URL')) || clean(viteEnv.VITE_FIREBASE_DATABASE_URL) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_DATABASE_URL : '') || "https://oquetempertocl-default-rtdb.firebaseio.com",
  projectId: clean(getLocal('FIREBASE_PROJECT_ID')) || clean(viteEnv.VITE_FIREBASE_PROJECT_ID) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_PROJECT_ID : '') || "oquetempertocl",
  storageBucket: clean(getLocal('FIREBASE_STORAGE_BUCKET')) || clean(viteEnv.VITE_FIREBASE_STORAGE_BUCKET) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_STORAGE_BUCKET : '') || "oquetempertocl.firebasestorage.app",
  messagingSenderId: clean(getLocal('FIREBASE_MESSAGING_SENDER_ID')) || clean(viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_MESSAGING_SENDER_ID : '') || "1029721075176",
  appId: clean(getLocal('FIREBASE_APP_ID')) || clean(viteEnv.VITE_FIREBASE_APP_ID) || clean(typeof process !== 'undefined' ? process.env.FIREBASE_APP_ID : '') || "1:1029721075176:web:e08ad0c8a5b6090dc0085d"
};

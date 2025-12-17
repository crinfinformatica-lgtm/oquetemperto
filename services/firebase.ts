
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { FIREBASE_KEYS } from "./apiKeys";

// --- CONFIGURAÇÃO DO FIREBASE ---
// As chaves agora são carregadas de services/apiKeys.ts (que lê do .env ou Vercel)
// Isso remove o aviso de segurança de "Chave Exposta" do código fonte.
export const firebaseConfig = FIREBASE_KEYS;

let app;
let auth: Auth;
let db: Database;
let googleProvider: GoogleAuthProvider;

// Verificação para garantir que a configuração mínima necessária existe
// O databaseURL é obrigatório para evitar o erro fatal "Cannot parse Firebase url"
const hasValidConfig = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.databaseURL && 
  firebaseConfig.databaseURL.startsWith('https');

if (!hasValidConfig) {
  // Modo de segurança para o app não travar totalmente se as chaves estiverem vazias
  console.warn("⚠️ AVISO: Configuração do Firebase incompleta (falta .env ou configuração na Vercel).");
  
  // Mock objects (simulação) para a interface carregar e exibir o aviso
  auth = {
     currentUser: null,
     // @ts-ignore
     _isMock: true
  } as unknown as Auth;
  
  // Objeto vazio sinaliza para o App.tsx que não há conexão real
  db = {} as unknown as Database;
  
} else {
  try {
     // Inicializa Firebase (Singleton)
     app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
     
     auth = getAuth(app);
     auth.languageCode = 'pt-BR'; 
     
     db = getDatabase(app);
     googleProvider = new GoogleAuthProvider();
  } catch (error) {
     console.error("❌ Erro fatal ao inicializar Firebase:", error);
     console.warn("Verifique se todas as chaves (projectId, databaseURL) estão corretas nas variáveis de ambiente.");
     // Fallback para evitar crash
     db = {} as unknown as Database;
     auth = { currentUser: null, _isMock: true } as unknown as Auth;
  }
}

// Função de Login
export const signInWithGoogle = () => {
    if (!hasValidConfig || !auth || (auth as any)._isMock) {
        alert("Erro: Configure as chaves do Firebase (incluindo databaseURL) no arquivo .env para fazer login.");
        return Promise.reject("Firebase keys missing");
    }
    return signInWithPopup(auth, googleProvider);
};

export { app, auth, db, googleProvider };

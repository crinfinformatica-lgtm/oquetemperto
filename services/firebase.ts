
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

// --- CONFIGURAÇÃO DO FIREBASE (MANUAL) ---
// Cole as chaves do seu projeto Firebase abaixo, dentro das aspas.
export const firebaseConfig = {
  apiKey: "AIzaSyAxzB5f3Vk1oa0NqCgRn-5G4kEUrGblvwk",
  authDomain: "oquetempertocl.firebaseapp.com",
  databaseURL: "https://oquetempertocl-default-rtdb.firebaseio.com",
  projectId: "oquetempertocl",
  storageBucket: "oquetempertocl.firebasestorage.app",
  messagingSenderId: "1029721075176",
  appId: "1:1029721075176:web:e08ad0c8a5b6090dc0085d"
};

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
  console.warn("⚠️ AVISO: Configuração do Firebase incompleta em services/firebase.ts (databaseURL obrigatória).");
  
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
     console.warn("Verifique se todas as chaves (projectId, databaseURL) estão corretas em services/firebase.ts");
     // Fallback para evitar crash
     db = {} as unknown as Database;
     auth = { currentUser: null, _isMock: true } as unknown as Auth;
  }
}

// Função de Login
export const signInWithGoogle = () => {
    if (!hasValidConfig || !auth || (auth as any)._isMock) {
        alert("Erro: Configure as chaves do Firebase (incluindo databaseURL) no arquivo services/firebase.ts para fazer login.");
        return Promise.reject("Firebase keys missing");
    }
    return signInWithPopup(auth, googleProvider);
};

export { app, auth, db, googleProvider };

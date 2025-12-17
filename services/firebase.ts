import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { FIREBASE_KEYS } from "./apiKeys";

export const firebaseConfig = FIREBASE_KEYS;

const isValidStr = (s: any) => typeof s === 'string' && s.trim().length > 5;

// Validação dos campos mínimos obrigatórios
const hasValidConfig = !!(
  isValidStr(firebaseConfig.apiKey) && 
  isValidStr(firebaseConfig.authDomain) &&
  isValidStr(firebaseConfig.projectId)
);

let app: FirebaseApp | undefined;
let auth: Auth;
let db: Database;
let googleProvider: GoogleAuthProvider;

if (!hasValidConfig) {
  console.group("🔧 Firebase Setup Missing");
  console.warn("Chaves obrigatórias ausentes na configuração.");
  console.table({
    apiKey: isValidStr(firebaseConfig.apiKey) ? "✅" : "❌",
    authDomain: isValidStr(firebaseConfig.authDomain) ? "✅" : "❌",
    projectId: isValidStr(firebaseConfig.projectId) ? "✅" : "❌"
  });
  console.groupEnd();
  
  // Mocks seguros
  auth = { currentUser: null, _isMock: true } as any;
  db = {} as any;
  googleProvider = new GoogleAuthProvider();
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    auth.languageCode = 'pt-BR'; 
    db = getDatabase(app);
    googleProvider = new GoogleAuthProvider();
    console.log("🚀 Firebase ativo e configurado.");
  } catch (error) {
    console.error("❌ Erro fatal Firebase:", error);
    auth = { currentUser: null, _isMock: true } as any;
    db = {} as any;
    googleProvider = new GoogleAuthProvider();
  }
}

export const signInWithGoogle = () => {
  if (!hasValidConfig || (auth as any)?._isMock) {
    return Promise.reject("Firebase keys missing");
  }
  return signInWithPopup(auth, googleProvider);
};

// Exportações centralizadas para evitar erro TS2459
export { auth, db, googleProvider, hasValidConfig };
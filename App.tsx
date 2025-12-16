
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RequestForm from './components/RequestForm';
import ResultsList from './components/ResultsList';
import ProfessionalDetails from './components/ProfessionalDetails';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import AppLogo from './components/AppLogo';
import PublicUtilities from './components/PublicUtilities';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeModal from './components/WelcomeModal';
import InstallBanner from './components/InstallBanner'; 
import InstallTutorial from './components/InstallTutorial'; // Importado
import { identifyServiceCategory } from './services/geminiService';
import { AppView, ServiceRequest, Professional, User, AppConfig, Review } from './types';
import { 
  Search, Loader2, Briefcase, Store, ArrowLeft, User as UserIcon, 
  Eye, EyeOff, MapPin, Star, X, Map, Share2, Moon, Sun, Copy, ShieldAlert, Mail, AlertTriangle, CheckCircle, Info, Download 
} from 'lucide-react';
import { ALLOWED_NEIGHBORHOODS } from './constants';

// Firebase Imports
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, onValue, update, remove, get, set, query, orderByChild, equalTo, limitToFirst, startAfter, orderByKey } from 'firebase/database';

const INITIAL_CONFIG: AppConfig = {
  appName: 'O Que Tem Perto?',
  headerSubtitle: 'Águas Claras e Região',
  primaryColor: '#0047AB', // Campo Largo Blue
  accentColor: '#DC143C',   // Campo Largo Red
  tertiaryColor: '#166534',  // Dark Green (Verde Escuro)
  pixKey: 'crinf.negocios@gmail.com',
  supportEmail: 'crinf.app@gmail.com'
};

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false); 
  const [showWelcome, setShowWelcome] = useState(false); 
  const [showInstallTutorial, setShowInstallTutorial] = useState(false); // Novo Estado
  const [darkMode, setDarkMode] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // New Search State
  const [searchTab, setSearchTab] = useState<'pro' | 'business'>('pro');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNeighborhood, setSearchNeighborhood] = useState('');
  const [searchHighRated, setSearchHighRated] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  // Pagination State
  const [lastLoadedKey, setLastLoadedKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);


  const [isMatching, setIsMatching] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Admin / User State
  const [users, setUsers] = useState<User[]>([]); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);

  // Admin Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAdminResetPass, setShowAdminResetPass] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState(false);

  // --- PWA INSTALL LISTENER ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
       // Se não houver prompt automático (iOS ou já instalado/bloqueado), abre o tutorial
       setShowInstallTutorial(true);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
  };


  // --- FIREBASE INTEGRATION ---

  // 1. Listen for Auth Changes & Load User Profile
  useEffect(() => {
    if (!auth || (auth as any)._isMock) {
      console.warn("Auth is disabled or not configured. Skipping auth listener.");
      setLoadingAuth(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          
          if (firebaseUser.email === 'crinf.app@gmail.com') {
             (async () => {
               try {
                 const snap = await get(userRef);
                 if (!snap.exists()) {
                     await set(userRef, {
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Admin Master',
                        email: firebaseUser.email,
                        role: 'master',
                        status: 'active',
                        createdAt: new Date().toISOString()
                     });
                 } else if (snap.val().role !== 'master') {
                     await update(userRef, { role: 'master' });
                 }
  
                 const configRef = ref(db, 'config');
                 const configSnap = await get(configRef);
                 if (!configSnap.exists()) {
                     await set(configRef, INITIAL_CONFIG);
                 }
               } catch (err) {
                 console.error("Auto-promotion error:", err);
               }
             })();
          }
  
          onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              setCurrentUser({ 
                ...data, 
                id: firebaseUser.uid,
                favorites: data.favorites || [] 
              });
            } else {
              setCurrentUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Usuário',
                email: firebaseUser.email || '',
                role: 'client',
                status: 'active',
                failedLoginAttempts: 0,
                favorites: []
              });
            }
            setLoadingAuth(false);
          });
        } else {
          setCurrentUser(null);
          setLoadingAuth(false);
        }
      });
  
      return () => unsubscribe();
    } catch (e) {
      console.error("Error setting up auth listener:", e);
      setLoadingAuth(false);
    }
  }, []);

  // 3. Listen for Config Changes
  useEffect(() => {
    if (!db || Object.keys(db).length === 0) {
      setDbConnectionError("Abra o arquivo services/firebase.ts e cole suas chaves.");
      return;
    }

    try {
      const configRef = ref(db, 'config');
      const unsubscribe = onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAppConfig(data);
        }
      }, (error) => {
        setDbConnectionError(error.message);
      });
      return () => unsubscribe();
    } catch (e: any) {
      setDbConnectionError(e.message || "Erro desconhecido");
    }
  }, []);

  // 4. Check for First Time User (Welcome Modal)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  // Handle Dynamic Styles
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', appConfig.primaryColor);
    root.style.setProperty('--color-accent', appConfig.accentColor);
    root.style.setProperty('--color-tertiary', appConfig.tertiaryColor);
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [appConfig, darkMode]);

  const getUserLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
       if (!navigator.geolocation) {
         reject("Geolocation not supported");
       } else {
         navigator.geolocation.getCurrentPosition(
           (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
           (err) => reject(err)
         );
       }
    });
  };

  // --- NEW: SCALABLE SEARCH FUNCTION WITH PAGINATION ---
  const performSearch = async (request: ServiceRequest, isNewSearch: boolean = true) => {
     if (!db || Object.keys(db).length === 0) {
        alert("Erro: Banco de dados não conectado. Configure services/firebase.ts");
        return;
     }

     if (isNewSearch) {
        setProfessionals([]);
        setLastLoadedKey(null);
        setHasMore(true);
        setCurrentRequest(request);
     }

     const PAGE_SIZE = 20;
     const usersRef = ref(db, 'users');
     let dbQuery;

     if (request.neighborhood) {
        if (isNewSearch) {
           dbQuery = query(usersRef, orderByChild('neighborhood'), equalTo(request.neighborhood), limitToFirst(PAGE_SIZE));
        } else if (lastLoadedKey) {
           dbQuery = query(usersRef, orderByChild('neighborhood'), equalTo(request.neighborhood), startAfter(null, lastLoadedKey), limitToFirst(PAGE_SIZE));
        }
     } 
     else if (request.detectedCategory && request.detectedCategory !== 'Destaques Próximos' && request.detectedCategory !== 'Destaques') {
         const targetCat = request.detectedCategory; 
         
         if (isNewSearch) {
            dbQuery = query(usersRef, orderByChild('category'), equalTo(targetCat), limitToFirst(PAGE_SIZE));
         } else if (lastLoadedKey) {
            dbQuery = query(usersRef, orderByChild('category'), equalTo(targetCat), startAfter(null, lastLoadedKey), limitToFirst(PAGE_SIZE));
         }
     }
     else {
        if (request.searchType === 'mixed') {
           if (isNewSearch) {
              dbQuery = query(usersRef, orderByKey(), limitToFirst(PAGE_SIZE));
           } else if (lastLoadedKey) {
              dbQuery = query(usersRef, orderByKey(), startAfter(lastLoadedKey), limitToFirst(PAGE_SIZE));
           }
        } else {
           const targetRole = request.searchType || 'pro';
           if (isNewSearch) {
              dbQuery = query(usersRef, orderByChild('role'), equalTo(targetRole), limitToFirst(PAGE_SIZE));
           } else if (lastLoadedKey) {
              dbQuery = query(usersRef, orderByChild('role'), equalTo(targetRole), startAfter(null, lastLoadedKey), limitToFirst(PAGE_SIZE));
           }
        }
     }

     try {
        if (!dbQuery) throw new Error("Invalid query construction");

        let snapshot;
        
        try {
           snapshot = await get(dbQuery);
        } catch (queryErr: any) {
           if (queryErr.message && queryErr.message.includes("Index not defined")) {
              console.warn("⚠️ Índice ausente no Firebase. Ativando modo de compatibilidade (Client-side filtering).");
              const fallbackQuery = query(usersRef, orderByKey()); 
              snapshot = await get(fallbackQuery);
           } else {
              throw queryErr;
           }
        }
        
        if (snapshot.exists()) {
           const data = snapshot.val();
           const entries = Object.entries(data);
           
           const newPros: Professional[] = entries.map(([key, u]: [string, any]) => ({
              id: key,
              name: u.name || 'Sem Nome',
              title: u.category || (u.role === 'business' ? 'Comércio Local' : 'Prestador'),
              rating: 5.0, 
              reviewCount: u.reviews ? Object.keys(u.reviews).length : 0,
              bio: u.businessDescription || `Serviços de ${u.category || 'qualidade'} em Campo Largo.`,
              avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`,
              distance: u.neighborhood || 'Campo Largo',
              neighborhood: u.neighborhood || 'Campo Largo',
              tags: u.category ? [u.category] : [],
              reviews: u.reviews ? Object.values(u.reviews) : [],
              isHighlighted: u.highlightExpiresAt ? new Date(u.highlightExpiresAt) > new Date() : false,
              role: u.role,
              category: u.category 
           }));

           const filteredPros = newPros.filter(p => {
              const r = (p as any).role;
              if (r === 'admin' || r === 'master' || r === 'client') return false;

              if (request.searchType === 'pro' && r !== 'pro') return false;
              if (request.searchType === 'business' && r !== 'business') return false;
              
              if (request.neighborhood && p.neighborhood !== request.neighborhood) return false;

              if (request.detectedCategory && request.detectedCategory !== 'Destaques Próximos' && request.detectedCategory !== 'Destaques') {
                 const cat = (p as any).category || '';
                 const tags = p.tags || [];
                 if (cat !== request.detectedCategory && !tags.includes(request.detectedCategory)) return false;
              }

              return true;
           });

           const uniquePros = isNewSearch ? filteredPros : filteredPros.filter(p => !professionals.find(ex => ex.id === p.id));
           
           if (uniquePros.length > 0) {
              setProfessionals(prev => isNewSearch ? uniquePros : [...prev, ...uniquePros]);
              setLastLoadedKey(entries[entries.length - 1][0]);
           } else {
              if (entries.length > 0) {
                  setLastLoadedKey(entries[entries.length - 1][0]);
              } else {
                  setHasMore(false);
              }
           }
           
           if (entries.length < PAGE_SIZE) {
              setHasMore(false); 
           }

        } else {
           if (isNewSearch) setProfessionals([]);
           setHasMore(false);
        }
     } catch (err) {
        console.error("Search Error:", err);
        setHasMore(false);
     } finally {
        setIsLoadingMore(false);
        setIsMatching(false);
     }
  };

  const handleHeroSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    setLocationStatus('');
    
    let coordinates = undefined;
    let finalQuery = searchQuery;

    if (!searchQuery.trim()) {
       setLocationStatus('Obtendo sua localização para busca local...');
       try {
          const coords = await getUserLocation();
          coordinates = coords;
          finalQuery = 'Destaques Próximos'; 
          setLocationStatus('Localização encontrada! Buscando...');
       } catch (err) {
          setLocationStatus('GPS indisponível. Mostrando destaques da região.');
          finalQuery = 'Destaques';
       }
    }
    
    let categoryId = 'outros';
    let detectedCategory = '';

    if (finalQuery !== 'Destaques Próximos' && finalQuery !== 'Destaques') {
       const result = await identifyServiceCategory(finalQuery);
       categoryId = result.categoryId;
       detectedCategory = result.subCategory; 
    }
    
    const request: ServiceRequest = {
       categoryId,
       subCategory: finalQuery, 
       description: `Busca ${coordinates ? 'por GPS' : 'textual'} em ${searchNeighborhood || 'Águas Claras'}`,
       location: "Campo Largo",
       urgency: "N/A",
       searchType: searchTab, 
       neighborhood: searchNeighborhood,
       onlyHighRated: searchHighRated,
       coordinates,
       detectedCategory
    };

    setSelectedSubCategory(finalQuery === 'Destaques Próximos' ? 'Destaques Perto de Você' : finalQuery); 
    
    await performSearch(request, true);
    
    setView('results');
  };

  const handleRequestSubmit = async (request: ServiceRequest) => {
    setIsMatching(true);
    if (!request.detectedCategory) {
       request.detectedCategory = request.subCategory;
    }
    
    setSelectedSubCategory(request.subCategory); 
    await performSearch(request, true);
    setView('results');
  };

  const handleLoadMoreResults = async () => {
     if (currentRequest && !isLoadingMore && hasMore) {
        setIsLoadingMore(true);
        await performSearch(currentRequest, false);
     }
  };

  const handleSelectProfessional = (pro: Professional) => {
    setSelectedProfessional(pro);
    setView('details');
  };

  const handleAddReview = (proId: string, review: Review) => {
    setProfessionals(prevPros => prevPros.map(pro => {
      if (pro.id === proId) {
        const updatedReviews = [...pro.reviews, review];
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = totalRating / updatedReviews.length;
        
        const updatedPro = {
          ...pro,
          reviews: updatedReviews,
          rating: newRating,
          reviewCount: updatedReviews.length
        };
        
        if (selectedProfessional && selectedProfessional.id === proId) {
          setSelectedProfessional(updatedPro);
        }
        return updatedPro;
      }
      return pro;
    }));
  };

  const handleToggleFavorite = (proId: string) => {
    if (!currentUser) {
      alert("Você precisa estar logado para favoritar!");
      setView('login'); 
      return;
    }

    const currentFavs = currentUser.favorites || [];
    const isFav = currentFavs.includes(proId);
    let newFavorites;
    
    if (isFav) {
      newFavorites = currentFavs.filter(id => id !== proId);
    } else {
      newFavorites = [...currentFavs, proId];
    }
    update(ref(db, `users/${currentUser.id}`), { favorites: newFavorites });
  };

  const resetApp = () => {
    setView('home');
    setSearchQuery('');
    setProfessionals([]);
    setSelectedProfessional(null);
    setShowAbout(false);
  };

  const handleBack = () => {
    if (view === 'home') return;
    switch (view) {
      case 'details': setView('results'); break;
      case 'results': setView('home'); break;
      case 'request-form': setView('home'); break;
      case 'register-client':
      case 'register-pro':
      case 'register-business': setView('register-selection'); break;
      case 'register-selection': setView('home'); break;
      case 'login': setView('home'); break;
      case 'user-profile': setView('home'); break;
      case 'admin-login': setView('home'); break;
      case 'admin-panel': setView('home'); break;
      default: setView('home');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: appConfig.appName,
      text: `Eletricista, diarista, fotógrafo, comércios locais... Encontre todo tipo de serviço e comércio na região de Águas Claras no app ${appConfig.appName}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (err) {
      console.warn("Share failed, falling back to clipboard", err);
      try {
        await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
        alert("Link copiado para a área de transferência! Compartilhe onde quiser.");
      } catch (clipboardErr) {
        alert("Não foi possível compartilhar automaticamente. Por favor, copie o link do navegador.");
      }
    }
  };

  const handleCopyPix = () => {
     const pixKey = appConfig.pixKey || "crinf.negocios@gmail.com";
     navigator.clipboard.writeText(pixKey);
     alert("Chave Pix copiada: " + pixKey);
  };

  const handleInstagram = () => {
    window.open("https://instagram.com/crinfinformatica", "_blank");
  };

  const handleUserLogin = async (email: string, pass: string) => {
    if (!auth || (auth as any)._isMock) {
       alert("Erro: Sistema de login indisponível (Falta de configuração).");
       return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setView('home');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') throw new Error('E-mail ou senha incorretos.');
      else if (error.code === 'auth/user-not-found') throw new Error('Usuário não encontrado.');
      else throw new Error('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleGuestLogin = () => {
     setView('home');
     alert("Você entrou como Convidado. Algumas funções como Favoritar e Contato serão limitadas.");
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser) {
      setLoginError("Por favor, digite o e-mail.");
      return;
    }
    setLoginError('');
    setAdminResetSuccess(false);
    
    if (!auth || (auth as any)._isMock) {
        setLoginError("Sistema de recuperação indisponível (Configuração ausente).");
        return;
    }

    try {
      await sendPasswordResetEmail(auth, loginUser);
      setAdminResetSuccess(true);
    } catch (error: any) {
      console.error("Reset error", error);
      if (error.code === 'auth/user-not-found') setLoginError("E-mail não encontrado no sistema.");
      else if (error.code === 'auth/invalid-email') setLoginError("E-mail inválido.");
      else setLoginError("Erro ao enviar e-mail: " + error.message);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!auth || (auth as any)._isMock) {
        setLoginError("Login admin indisponível (Falta de configuração).");
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginUser, loginPass);
      const uid = userCredential.user.uid;
      
      if (userCredential.user.email === 'crinf.app@gmail.com') {
         setCurrentUser({
            id: uid,
            name: 'Admin Master',
            email: userCredential.user.email || '',
            role: 'master',
            status: 'active',
            failedLoginAttempts: 0,
            favorites: []
         });
         setView('admin-panel');
         return; 
      }

      setTimeout(async () => {
         const userRef = ref(db, `users/${uid}`);
         const snap = await get(userRef);
         if (snap.exists()) {
             const userData = snap.val();
             if (userData.role === 'admin' || userData.role === 'master') {
                 setView('admin-panel');
             } else {
                 setLoginError('Acesso negado: Você não tem permissão de administrador.');
                 signOut(auth);
             }
         } else {
             setLoginError('Usuário não encontrado no banco de dados. Entre em contato com o suporte.');
         }
      }, 1000);
    } catch (error: any) {
      if ((error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && loginUser === 'crinf.app@gmail.com') {
        try {
          const newUserCred = await createUserWithEmailAndPassword(auth, loginUser, loginPass);
           setCurrentUser({
            id: newUserCred.user.uid,
            name: 'Admin Master',
            email: loginUser,
            role: 'master',
            status: 'active',
            failedLoginAttempts: 0,
            favorites: []
         });
         setView('admin-panel');
         return;
        } catch (createErr: any) {
          setLoginError(`Erro ao criar conta mestre: ${createErr.message}`);
        }
      } else {
        setLoginError('Erro de autenticação: Verifique e-mail e senha.');
      }
    }
  };

  const handleRegisterSuccess = (newUser: User) => {
    setView('home');
    alert(`Bem-vindo, ${newUser.name}! Sua conta foi criada.`);
  };

  const handleUpdateConfig = (newConfig: AppConfig) => update(ref(db, 'config'), newConfig);
  const handleUpdateUser = (updatedUser: User) => {
    const { id, ...data } = updatedUser;
    update(ref(db, `users/${id}`), data);
  };
  const handleDeleteUser = (userId: string) => remove(ref(db, `users/${userId}`));
  const handleLogout = () => {
    if (auth && !(auth as any)._isMock) {
        signOut(auth);
    }
    setView('home');
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300" style={{ '--primary-custom': appConfig.primaryColor } as React.CSSProperties}>
      <style>{`
        .text-primary { color: ${appConfig.primaryColor} !important; }
        .bg-primary { background-color: ${appConfig.primaryColor} !important; }
        .bg-primary-dark { filter: brightness(0.9); background-color: ${appConfig.primaryColor} !important; }
        .text-accent { color: ${appConfig.accentColor} !important; }
        .bg-accent { background-color: ${appConfig.accentColor} !important; }
        .bg-accent-dark { filter: brightness(0.9); background-color: ${appConfig.accentColor} !important; }
        .hover\\:bg-accent-dark:hover { filter: brightness(0.9); background-color: ${appConfig.accentColor} !important; }
        .text-tertiary { color: ${appConfig.tertiaryColor} !important; }
        .bg-tertiary { background-color: ${appConfig.tertiaryColor} !important; }
        .hover\\:bg-tertiary-dark:hover { filter: brightness(0.8); background-color: ${appConfig.tertiaryColor} !important; }
        .border-tertiary { border-color: ${appConfig.tertiaryColor} !important; }
      `}</style>

      {dbConnectionError && (
        <div className="bg-red-600 text-white p-3 text-center text-sm font-bold flex items-center justify-center gap-2">
           <AlertTriangle size={18} />
           {dbConnectionError} (Verifique o Console F12)
        </div>
      )}

      {/* BANNER PWA */}
      {showInstallBanner && deferredPrompt && (
        <InstallBanner 
          onInstall={handleInstallApp} 
          onDismiss={handleDismissInstall} 
          onHelp={() => setShowInstallTutorial(true)}
        />
      )}
      
      {/* TUTORIAL MODAL */}
      {showInstallTutorial && (
        <InstallTutorial onClose={() => setShowInstallTutorial(false)} />
      )}

      {view !== 'admin-panel' && view !== 'admin-login' && view !== 'user-profile' && view !== 'login' && (
        <Header onLogoClick={resetApp} config={appConfig} onShareClick={handleShare} />
      )}

      <main className="flex-grow flex flex-col relative pb-4"> 
        {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
        {showPrivacy && <PrivacyPolicy appName={appConfig.appName} onClose={() => setShowPrivacy(false)} />}
        
        {showAbout && (
           <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 animate-in fade-in duration-200" onClick={() => setShowAbout(false)}>
              <div 
                 className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto"
                 onClick={e => e.stopPropagation()}
              >
                 <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                 <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-primary mb-1">Sobre o App</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Versão 1.1.0</p>
                 </div>
                 <div className="space-y-4">
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                       <div className="flex items-center gap-3">
                          {darkMode ? <Moon className="text-purple-400" size={20} /> : <Sun className="text-orange-400" size={20} />}
                          <span className="font-medium text-gray-700 dark:text-gray-200">Modo Tela Escura</span>
                       </div>
                    </button>
                    <button onClick={handleShare} className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                       <Share2 className="text-blue-500" size={20} />
                       <span className="font-medium text-gray-700 dark:text-gray-200">Compartilhar App</span>
                    </button>
                    
                    {/* BOTÃO PARA ABRIR O TUTORIAL MANUALMENTE */}
                    <button onClick={() => { setShowAbout(false); setShowInstallTutorial(true); }} className="w-full flex items-center gap-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-xl hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                       <Download className="text-primary" size={20} />
                       <span className="font-medium text-primary">Instalar Aplicativo (Tutorial)</span>
                    </button>

                    {/* CONTATO DE SUPORTE */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                             <Mail size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Suporte Técnico</p>
                             <p className="text-xs text-blue-600 dark:text-blue-300 font-mono">{appConfig.supportEmail || 'crinf.app@gmail.com'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 bg-tertiary/10 dark:bg-green-900/30 rounded-xl border border-tertiary/20 dark:border-green-800">
                       <h3 className="text-sm font-bold text-tertiary dark:text-green-400 mb-2 flex items-center gap-2">Apoie o Projeto (Pix)</h3>
                       <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                          <code className="text-xs flex-grow truncate font-mono select-all dark:text-gray-300">
                             {appConfig.pixKey || 'crinf.negocios@gmail.com'}
                          </code>
                          <button onClick={handleCopyPix} className="p-1.5 bg-tertiary text-white rounded hover:bg-tertiary-dark"><Copy size={16} /></button>
                       </div>
                    </div>
                    
                    {/* AVISO DE TOLERÂNCIA ZERO */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 mt-2">
                       <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                          <ShieldAlert size={16} /> Tolerância Zero
                       </h3>
                       <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          O banimento é imediato e permanente para crimes de racismo, homofobia, machismo ou qualquer forma de discriminação.
                       </p>
                    </div>

                    {/* AVISO DE ISENÇÃO DE RESPONSABILIDADE */}
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 mt-2">
                       <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                          <Info size={16} /> Isenção de Responsabilidade
                       </h3>
                       <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          Somos apenas um serviço de busca gratuito. Não nos responsabilizamos por dados de usuários, conteúdo dos anúncios ou pela execução dos serviços contratados.
                       </p>
                    </div>

                    <button onClick={() => { setShowAbout(false); setShowPrivacy(true); }} className="w-full text-center text-xs text-gray-500 underline py-2 hover:text-gray-800 dark:hover:text-gray-300">Política de Privacidade e Termos de Uso</button>
                 </div>
              </div>
           </div>
        )}

        {view === 'home' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
             <div className="mb-8 animate-in fade-in zoom-in duration-500">
                <div className="p-4 bg-white rounded-full shadow-2xl border-4 border-gray-50">
                   <AppLogo className="w-28 h-28 md:w-36 md:h-36" />
                </div>
             </div>
             <div className="w-full max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-2 md:p-6 border border-gray-100 dark:border-gray-700">
                   <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-6">
                      <button onClick={() => { setSearchTab('pro'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'pro' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                         <Briefcase size={20} /> <span className="text-sm md:text-base">Serviços</span>
                      </button>
                      <button onClick={() => { setSearchTab('business'); setSearchQuery(''); }} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'business' ? 'bg-white dark:bg-gray-700 text-tertiary shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                         <Store size={20} /> <span className="text-sm md:text-base">Comércio</span>
                      </button>
                   </div>
                   <form onSubmit={handleHeroSearch} className="px-1">
                      <div className="space-y-4">
                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={24} /></div>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchTab === 'pro' ? "O que você precisa? (Deixe vazio p/ GPS)" : "O que deseja comprar? (Deixe vazio p/ GPS)"} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-primary/30 rounded-2xl outline-none text-lg text-gray-800 dark:text-white shadow-inner transition-all" />
                         </div>
                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="text-gray-400 group-focus-within:text-primary transition-colors" size={24} /></div>
                            <select value={searchNeighborhood} onChange={(e) => setSearchNeighborhood(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-primary/30 rounded-2xl outline-none text-gray-800 dark:text-white shadow-inner appearance-none transition-all cursor-pointer">
                               <option value="">Em toda a região</option>
                               {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
                         <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <input type="checkbox" className="hidden" checked={searchHighRated} onChange={(e) => setSearchHighRated(e.target.checked)} />
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${searchHighRated ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>{searchHighRated && <Star size={12} className="text-white fill-current" />}</div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Melhores Avaliados</span>
                         </label>
                         <button type="submit" disabled={isMatching} className="w-full md:w-auto bg-accent hover:bg-accent-dark text-white font-bold py-4 px-10 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none">
                           {isMatching ? <Loader2 className="animate-spin" size={24} /> : (!searchQuery ? <MapPin size={24} /> : <Search size={24} />)}
                           {isMatching ? 'Processando...' : (!searchQuery ? 'Buscar Próximos' : 'Buscar Agora')}
                         </button>
                      </div>
                      {locationStatus && <p className="text-center text-sm text-primary font-semibold mt-4 animate-pulse">{locationStatus}</p>}
                   </form>
                </div>
             </div>
             <PublicUtilities />
          </div>
        )}

        {view === 'login' && <LoginForm onBack={() => setView('home')} onLogin={handleUserLogin} onRegisterClick={() => setView('register-selection')} onAdminClick={() => setView('admin-login')} onGuestClick={handleGuestLogin} />}
        {view === 'request-form' && <RequestForm initialCategoryId={selectedCategoryId} initialSubCategory={selectedSubCategory} onSubmit={handleRequestSubmit} onCancel={() => setView('home')} isProcessing={isMatching} searchType="mixed" />}
        {view === 'results' && 
            <ResultsList 
               professionals={professionals} 
               subCategory={selectedSubCategory} 
               onBack={() => setView('home')} 
               onSelectProfessional={handleSelectProfessional} 
               currentUser={currentUser} 
               onToggleFavorite={handleToggleFavorite}
               onLoadMore={handleLoadMoreResults}
               hasMore={hasMore}
               isLoadingMore={isLoadingMore}
            />
        }
        {view === 'details' && selectedProfessional && <ProfessionalDetails professional={selectedProfessional} currentUser={currentUser} onBack={() => setView('results')} onAddReview={handleAddReview} onToggleFavorite={handleToggleFavorite} />}
        {view === 'register-selection' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold mb-8 text-center dark:text-white">O que você deseja cadastrar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div onClick={() => setView('register-pro')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-accent text-center group h-full flex flex-col items-center justify-center">
                <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Briefcase className="w-8 h-8 text-accent-dark" /></div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">Prestador de Serviço</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Eletricista, encanador, diarista...</p>
              </div>
              <div onClick={() => setView('register-business')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-tertiary text-center group h-full flex flex-col items-center justify-center">
                <div className="bg-tertiary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Store className="w-8 h-8 text-tertiary" /></div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">Comércio / Loja</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Mercado, farmácia, restaurante...</p>
              </div>
              <div onClick={() => setView('register-client')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-primary text-center group h-full flex flex-col items-center justify-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><UserIcon className="w-8 h-8 text-primary" /></div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">Sou Cliente</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Quero buscar serviços e avaliar.</p>
              </div>
            </div>
            <button onClick={() => setView('home')} className="mt-8 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">Cancelar e voltar</button>
          </div>
        )}
        {view === 'register-client' && <RegisterForm type="client" onBack={() => setView('home')} onRegisterSuccess={handleRegisterSuccess} />}
        {view === 'register-pro' && <RegisterForm type="pro" onBack={() => setView('home')} onRegisterSuccess={handleRegisterSuccess} />}
        {view === 'register-business' && <RegisterForm type="business" onBack={() => setView('home')} onRegisterSuccess={handleRegisterSuccess} />}
        {view === 'user-profile' && currentUser && <UserProfile user={currentUser} onUpdate={handleUpdateUser} onLogout={handleLogout} onBack={() => setView('home')} />}
        
        {view === 'admin-login' && (
           <div className="flex-grow flex items-center justify-center p-4 bg-gray-900">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
                 <button onClick={() => { setView('home'); setShowAdminResetPass(false); setAdminResetSuccess(false); setLoginError(''); }} className="text-gray-500 mb-6 flex items-center gap-2 text-sm hover:text-gray-800"><ArrowLeft size={16} /> Voltar para o Site</button>
                 
                 {showAdminResetPass ? (
                    <>
                        <div className="text-center mb-8">
                           <h2 className="text-2xl font-bold text-gray-800">Recuperar Senha</h2>
                           <p className="text-gray-500 text-sm">Digite o e-mail do administrador</p>
                        </div>
                        
                        {adminResetSuccess ? (
                           <div className="text-center space-y-6">
                              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center gap-2">
                                 <CheckCircle className="text-green-600" size={32} />
                                 <p className="text-green-800 font-bold text-sm">
                                    Link enviado para:<br/>{loginUser}
                                 </p>
                              </div>
                              <p className="text-xs text-gray-500">Verifique sua caixa de entrada e spam.</p>
                              <button onClick={() => { setShowAdminResetPass(false); setAdminResetSuccess(false); }} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Voltar ao Login</button>
                           </div>
                        ) : (
                           <form onSubmit={handleAdminResetPassword} className="space-y-4">
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                  <input 
                                    type="email" 
                                    value={loginUser} 
                                    onChange={(e) => setLoginUser(e.target.value)} 
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="admin@email.com" 
                                    required
                                  />
                               </div>
                               {loginError && (
                                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                     <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                     <span>{loginError}</span>
                                  </div>
                               )}
                               <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Enviar Link</button>
                               <button type="button" onClick={() => { setShowAdminResetPass(false); setLoginError(''); }} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                           </form>
                        )}
                    </>
                 ) : (
                    <>
                        <div className="text-center mb-8">
                           <h2 className="text-2xl font-bold text-gray-800">Área Administrativa</h2>
                           <p className="text-gray-500 text-sm">Acesso restrito a equipe Crinf</p>
                        </div>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Usuário / Email</label>
                               <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                <div className="relative">
                                   <input type={showLoginPassword ? "text" : "password"} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" />
                                   <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => { setShowAdminResetPass(true); setLoginError(''); setAdminResetSuccess(false); }} className="text-sm text-blue-600 hover:underline">Esqueceu a senha?</button>
                            </div>
                            {loginError && (
                               <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                  <span>{loginError}</span>
                               </div>
                            )}
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Acessar Painel</button>
                        </form>
                    </>
                 )}
              </div>
           </div>
        )}

        {view === 'admin-panel' && !currentUser && <div className="flex flex-col items-center justify-center h-screen bg-gray-100"><Loader2 className="animate-spin text-primary mb-2" size={40} /><p className="text-gray-600 font-medium">Carregando dados do administrador...</p></div>}
        {view === 'admin-panel' && currentUser && <AdminPanel currentUser={currentUser} users={users} appConfig={appConfig} onUpdateConfig={handleUpdateConfig} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onLogout={handleLogout} onShareApp={handleShare} />}
      </main>

      {view !== 'admin-panel' && view !== 'admin-login' && view !== 'user-profile' && view !== 'login' && (
         <Footer onHomeClick={resetApp} onInstagramClick={handleInstagram} onLoginClick={() => setView('login')} onRegisterClick={() => setView('register-selection')} onProfileClick={() => setView('user-profile')} onAboutClick={() => setShowAbout(true)} onBackClick={handleBack} currentUser={currentUser} currentView={view} />
      )}
    </div>
  );
}

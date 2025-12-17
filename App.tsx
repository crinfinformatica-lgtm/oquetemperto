import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RequestForm from './components/RequestForm';
import ResultsList from './components/ResultsList';
import ProfessionalDetails from './components/ProfessionalDetails';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import PainelAdministrativo from './components/PainelAdministrativo';
import UserProfile from './components/UserProfile';
import AppLogo from './components/AppLogo';
import PublicUtilities from './components/PublicUtilities';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeModal from './components/WelcomeModal';
import InstallBanner from './components/InstallBanner'; 
import InstallTutorial from './components/InstallTutorial';
import { identifyServiceCategory } from './services/geminiService';
import { AppView, ServiceRequest, Professional, User, AppConfig, Review } from './types';
import { 
  Search, Loader2, Briefcase, Store, ArrowLeft, Eye, EyeOff, MapPin, Star, X, Map, Share2, Moon, Sun, Copy, ShieldAlert, Mail, AlertTriangle, CheckCircle, Info, Download, Smartphone,
  Shield, Key, ShieldCheck, Settings, ExternalLink
} from 'lucide-react';
import { ALLOWED_NEIGHBORHOODS } from './constants';

// Firebase Imports
import { auth, db, hasValidConfig } from './services/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, onValue, update, remove, get, set, query, limitToFirst, startAfter, orderByKey } from 'firebase/database';

const INITIAL_CONFIG: AppConfig = {
  appName: 'O Que Tem Perto?',
  headerSubtitle: 'Águas Claras e Região',
  primaryColor: '#0047AB',
  accentColor: '#DC143C',
  tertiaryColor: '#166534',
  pixKey: 'crinf.negocios@gmail.com',
  supportEmail: 'crinf.app@gmail.com'
};

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); 
  const [showInstallTutorial, setShowInstallTutorial] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Search State
  const [searchTab, setSearchTab] = useState<'pro' | 'business'>('pro');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNeighborhood, setSearchNeighborhood] = useState('');
  const [searchHighRated, setSearchHighRated] = useState(false);

  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  // Pagination State
  const [lastLoadedKey, setLastLoadedKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);

  const [isMatching, setIsMatching] = useState(false);

  // Admin / User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Admin Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [errorType, setErrorType] = useState<'generic' | 'config'>('generic');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
         setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('resize', checkStandalone);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', checkStandalone);
    };
  }, [isStandalone]);

  useEffect(() => {
    if (!auth || (auth as any)._isMock) {
      setLoadingAuth(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          
          // REFORÇO MASTER: Se for o email da Crinf, garante que o role seja 'master' no banco
          if (firebaseUser.email === 'crinf.app@gmail.com') {
             const snap = await get(userRef);
             const userData = snap.val();
             if (!snap.exists() || (userData && userData.role !== 'master')) {
                await update(userRef, {
                   id: firebaseUser.uid,
                   name: userData?.name || 'Admin Master',
                   email: firebaseUser.email,
                   role: 'master',
                   status: 'active',
                   createdAt: userData?.createdAt || new Date().toISOString()
                });
             }
          }
  
          onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              if (data.status === 'banned') {
                signOut(auth);
                alert("Sua conta foi suspensa por violação dos termos.");
                return;
              }
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
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    if (!hasValidConfig || !db || Object.keys(db).length === 0) {
      return;
    }

    const configRef = ref(db, 'config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setAppConfig(data);
    }, (error) => {
      console.error("Erro ao ler configurações do banco.");
    });
    return () => unsubscribe();
  }, []);

  const performSearch = async (request: ServiceRequest, isNewSearch: boolean = true) => {
     if (!hasValidConfig || !db || Object.keys(db).length === 0) return;

     if (isNewSearch) {
        setProfessionals([]);
        setLastLoadedKey(null);
        setHasMore(true);
        setCurrentRequest(request);
     }

     const PAGE_SIZE = 20;
     const usersRef = ref(db, 'users');
     let dbQuery;

     dbQuery = query(usersRef, orderByKey(), limitToFirst(PAGE_SIZE));
     if (!isNewSearch && lastLoadedKey) {
        dbQuery = query(usersRef, orderByKey(), startAfter(lastLoadedKey), limitToFirst(PAGE_SIZE));
     }

     try {
        const snapshot = await get(dbQuery);
        if (snapshot.exists()) {
           const data = snapshot.val();
           const entries = Object.entries(data);
           const results: Professional[] = [];

           entries.forEach(([key, u]: [string, any]) => {
              if (u.role === 'admin' || u.role === 'master' || u.status === 'banned') return;
              
              results.push({
                 id: key,
                 name: u.name || 'Sem Nome',
                 title: u.category || 'Prestador',
                 rating: 5.0, 
                 reviewCount: u.reviews ? Object.keys(u.reviews).length : 0,
                 bio: u.businessDescription || '',
                 avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || 'U'}&background=random`,
                 distance: u.neighborhood || 'Campo Largo',
                 neighborhood: u.neighborhood || 'Campo Largo',
                 tags: u.category ? [u.category] : [],
                 reviews: u.reviews ? Object.values(u.reviews) : [],
                 isHighlighted: u.highlightExpiresAt ? new Date(u.highlightExpiresAt) > new Date() : false
              });
           });

           setProfessionals(prev => isNewSearch ? results : [...prev, ...results]);
           setLastLoadedKey(entries[entries.length - 1][0]);
           if (entries.length < PAGE_SIZE) setHasMore(false);
        } else {
           setHasMore(false);
        }
     } catch (err) {
        setHasMore(false);
     } finally {
        setIsLoadingMore(false);
        setIsMatching(false);
     }
  };

  const handleHeroSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    let finalQuery = searchQuery || (searchTab === 'pro' ? 'Destaques de Serviços' : 'Destaques de Comércio');
    const result = await identifyServiceCategory(finalQuery);
    
    const request: ServiceRequest = {
       categoryId: result.categoryId,
       subCategory: finalQuery, 
       description: '',
       location: "Campo Largo",
       urgency: "N/A",
       searchType: searchTab, 
       neighborhood: searchNeighborhood,
       onlyHighRated: searchHighRated,
       detectedCategory: result.subCategory
    };

    setSelectedSubCategory(finalQuery); 
    await performSearch(request, true);
    setView('results');
  };

  const handleToggleFavorite = (proId: string) => {
    if (!currentUser) {
      setView('login'); 
      return;
    }
    const currentFavs = currentUser.favorites || [];
    const isFav = currentFavs.includes(proId);
    const newFavorites = isFav ? currentFavs.filter(id => id !== proId) : [...currentFavs, proId];
    update(ref(db, `users/${currentUser.id}`), { favorites: newFavorites });
  };

  const handleUserLogin = async (email: string, pass: string) => {
    if (!auth || (auth as any)._isMock) throw new Error("Firebase não configurado.");
    await signInWithEmailAndPassword(auth, email, pass);
    setView('home');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setErrorType('generic');
    setIsAdminLoggingIn(true);

    try {
      if (!auth || (auth as any)._isMock) {
         throw new Error("CONFIG_MISSING");
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginUser, loginPass);
      
      // Verificação de segurança MASTER: Prioridade absoluta por e-mail
      if (userCredential.user.email === 'crinf.app@gmail.com') {
          setView('admin-panel');
          setIsAdminLoggingIn(false);
          return;
      }

      const snap = await get(ref(db, `users/${userCredential.user.uid}`));
      const userData = snap.val();
      
      if (userData && (userData.role === 'admin' || userData.role === 'master')) {
          setView('admin-panel');
      } else {
          setLoginError('Acesso negado: Este usuário não possui permissões administrativas.');
          signOut(auth);
      }
    } catch (error: any) {
      console.error("Admin Login Error:", error.code || error.message);
      
      if (error.message === 'CONFIG_MISSING' || error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed') {
        setLoginError('O Firebase não está configurado. Use o ícone de engrenagem acima para inserir as chaves de conexão do seu projeto.');
        setErrorType('config');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setLoginError('E-mail ou senha administrativos incorretos.');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setLoginError('Erro ao autenticar: ' + (error.message || 'Falha desconhecida.'));
      }
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleAdminPasswordReset = async () => {
    if (!loginUser) {
      alert("Digite seu e-mail no campo acima primeiro.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginUser);
      alert("E-mail de redefinição enviado com sucesso.");
    } catch (err: any) {
      alert("Erro ao solicitar redefinição: " + err.message);
    }
  };

  const handleLogout = () => {
    if (auth && !(auth as any)._isMock) signOut(auth);
    setView('home');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <style>{`
        .text-primary { color: ${appConfig.primaryColor} !important; }
        .bg-primary { background-color: ${appConfig.primaryColor} !important; }
        .text-accent { color: ${appConfig.accentColor} !important; }
        .bg-accent { background-color: ${appConfig.accentColor} !important; }
        .bg-tertiary { background-color: ${appConfig.tertiaryColor} !important; }
      `}</style>

      {view !== 'admin-panel' && view !== 'admin-login' && view !== 'user-profile' && view !== 'login' && (
        <Header onLogoClick={() => setView('home')} config={appConfig} onShareClick={() => {}} />
      )}

      <main className="flex-grow flex flex-col relative pb-4"> 
        {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
        {showInstallBanner && <InstallBanner onInstall={handleInstall} onDismiss={() => setShowInstallBanner(false)} onHelp={() => setShowInstallTutorial(true)} />}
        {showInstallTutorial && <InstallTutorial onClose={() => setShowInstallTutorial(false)} />}
        
        {view === 'home' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
             <div className="mb-8 p-4 bg-white rounded-full shadow-2xl border-4 border-gray-50">
                <AppLogo className="w-28 h-28 md:w-36 md:h-36" />
             </div>
             <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-4 md:p-6">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-6">
                   <button onClick={() => setSearchTab('pro')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'pro' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-md' : 'text-gray-400'}`}>Serviços</button>
                   <button onClick={() => setSearchTab('business')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'business' ? 'bg-white dark:bg-gray-700 text-tertiary shadow-md' : 'text-gray-400'}`}>Comércio</button>
                </div>
                <form onSubmit={handleHeroSearch} className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="O que você procura?" className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" />
                   </div>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <select value={searchNeighborhood} onChange={(e) => setSearchNeighborhood(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all appearance-none">
                         <option value="">Em toda a região</option>
                         {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <button type="submit" disabled={isMatching} className="w-full bg-accent hover:bg-accent-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50">
                     {isMatching ? <Loader2 className="animate-spin" /> : <Search />}
                     Buscar Agora
                   </button>
                </form>
             </div>
             <PublicUtilities />
          </div>
        )}

        {view === 'login' && <LoginForm onBack={() => setView('home')} onLogin={handleUserLogin} onRegisterClick={() => setView('register-selection')} onAdminClick={() => setView('admin-login')} onGuestClick={() => setView('home')} />}
        {view === 'results' && <ResultsList professionals={professionals} subCategory={selectedSubCategory} onBack={() => setView('home')} onSelectProfessional={setSelectedProfessional} currentUser={currentUser} onToggleFavorite={handleToggleFavorite} onLoadMore={() => performSearch(currentRequest!, false)} hasMore={hasMore} isLoadingMore={isLoadingMore} />}
        {view === 'details' && selectedProfessional && <ProfessionalDetails professional={selectedProfessional} currentUser={currentUser} onBack={() => setView('results')} onAddReview={() => {}} onToggleFavorite={handleToggleFavorite} />}
        {view === 'register-selection' && (
           <div className="p-8 text-center max-w-md mx-auto">
              <h2 className="text-2xl font-black mb-6">Como você quer entrar?</h2>
              <div className="grid gap-4">
                <button onClick={() => setView('register-pro' as any)} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-primary hover:bg-primary/5 flex items-center gap-4 text-left">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl"><Briefcase size={32}/></div>
                  <div><p className="font-bold">Sou Prestador</p><p className="text-xs text-gray-500">Ofereço serviços</p></div>
                </button>
                <button onClick={() => setView('register-business' as any)} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-tertiary hover:bg-tertiary/5 flex items-center gap-4 text-left">
                  <div className="p-3 bg-tertiary/10 text-tertiary rounded-xl"><Store size={32}/></div>
                  <div><p className="font-bold">Sou Comércio</p><p className="text-xs text-gray-500">Tenho uma loja física</p></div>
                </button>
                <button onClick={() => setView('register-client' as any)} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 flex items-center gap-4 text-left">
                  <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><Smartphone size={32}/></div>
                  <div><p className="font-bold">Sou Cliente</p><p className="text-xs text-gray-500">Quero apenas procurar</p></div>
                </button>
              </div>
           </div>
        )}
        
        {view.toString().startsWith('register-') && view !== 'register-selection' && (
          <RegisterForm type={view.toString().replace('register-', '') as any} onBack={() => setView('register-selection')} onRegisterSuccess={() => setView('home')} />
        )}

        {view === 'user-profile' && currentUser && <UserProfile user={currentUser} onUpdate={(u) => update(ref(db, `users/${u.id}`), u)} onLogout={handleLogout} onBack={() => setView('home')} />}
        
        {view === 'admin-login' && (
           <div className="flex-grow flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-2xl">
                 <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2"><Shield className="text-primary"/> Acesso Admin</h2>
                    <div className="flex gap-2">
                       <button onClick={() => setView('login')} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-primary rounded-xl transition-all" title="Configurar Firebase"><Settings size={20}/></button>
                       <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 p-2"><X size={20}/></button>
                    </div>
                 </div>
                 
                 {currentUser?.email === 'crinf.app@gmail.com' ? (
                   <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                      <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                         <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} />
                         </div>
                         <p className="text-sm text-green-800 font-bold mb-1">Olá Master!</p>
                         <p className="text-xs text-green-600">Sua sessão já está ativa.</p>
                      </div>
                      <button 
                        onClick={() => setView('admin-panel')}
                        className="w-full bg-primary text-white p-4 rounded-xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
                      >
                         <Shield size={20} /> Acessar Painel Master
                      </button>
                   </div>
                 ) : (
                   <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                         <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">E-mail Administrativo</label>
                         <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="email" required value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="admin@crinf.com" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 pl-11 pr-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Senha de Acesso</label>
                         <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 pl-11 pr-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all" />
                         </div>
                      </div>
                      
                      <div className="flex justify-end">
                         <button type="button" onClick={handleAdminPasswordReset} className="text-[11px] text-primary hover:underline font-bold">Esqueceu a senha?</button>
                      </div>

                      {loginError && (
                         <div className={`p-4 rounded-xl text-xs font-bold flex flex-col gap-3 border animate-in slide-in-from-top-2 ${errorType === 'config' ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            <div className="flex items-start gap-3">
                               <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                               <span className="flex-1 leading-tight">{loginError}</span>
                            </div>
                            {errorType === 'config' && (
                               <button 
                                 type="button" 
                                 onClick={() => setView('login')} 
                                 className="w-full bg-orange-600 text-white p-3 rounded-lg font-black flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
                               >
                                  <Settings size={16} /> Abrir Configurações
                               </button>
                            )}
                         </div>
                      )}
                      
                      <button type="submit" disabled={isAdminLoggingIn} className="w-full bg-primary hover:bg-primary-dark text-white p-4 rounded-xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                         {isAdminLoggingIn ? <Loader2 className="animate-spin" size={20} /> : <><Shield size={20} /> Entrar no Painel</>}
                      </button>
                      
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 mt-6">
                         <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                            Área restrita. Se o Firebase não estiver configurado, use a engrenagem no topo para inserir as chaves.
                         </p>
                      </div>
                   </form>
                 )}
              </div>
           </div>
        )}

        {view === 'admin-panel' && currentUser && (
          <PainelAdministrativo 
            currentUser={currentUser} 
            users={[]} 
            appConfig={appConfig} 
            onUpdateConfig={(c) => update(ref(db, 'config'), c)} 
            onUpdateUser={(u) => update(ref(db, `users/${u.id}`), u)} 
            onDeleteUser={(id) => remove(ref(db, `users/${id}`))} 
            onLogout={handleLogout} 
            onShareApp={() => {}} 
          />
        )}
      </main>

      {view !== 'admin-panel' && view !== 'admin-login' && view !== 'user-profile' && view !== 'login' && (
         <Footer onHomeClick={() => setView('home')} onInstagramClick={() => {}} onLoginClick={() => setView('login')} onRegisterClick={() => setView('register-selection')} onProfileClick={() => setView('user-profile')} onAboutClick={() => setShowAbout(true)} onBackClick={() => setView('home')} currentUser={currentUser} currentView={view} />
      )}
    </div>
  );
}
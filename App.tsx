
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RequestForm from './components/RequestForm';
import ResultsList from './components/ResultsList';
import ProfessionalDetails from './components/ProfessionalDetails';
import RegisterForm from './components/RegisterForm';
import RegisterSelection from './components/RegisterSelection';
import LoginForm from './components/LoginForm';
import PainelAdministrativo from './components/PainelAdministrativo';
import UserProfile from './components/UserProfile';
import AppLogo from './components/AppLogo';
import PublicUtilities from './components/PublicUtilities';
import PrivacyPolicy from './components/PrivacyPolicy';
import WelcomeModal from './components/WelcomeModal';
import InstallBanner from './components/InstallBanner'; 
import InstallTutorial from './components/InstallTutorial';
import DonationView from './components/DonationView';
import { identifyServiceCategory } from './services/geminiService';
import { AppView, ServiceRequest, Professional, User, AppConfig, Review } from './types';
import { 
  Search, Loader2, Briefcase, Store, ArrowLeft, MapPin, Star, X, Share2, Download, Smartphone, Info, HelpCircle, Shield, Megaphone, ExternalLink, Navigation
} from 'lucide-react';
import { ALLOWED_NEIGHBORHOODS } from './constants';

// Firebase Imports
import { auth, db, hasValidConfig } from './services/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onValue, update, remove, get, query, limitToFirst, startAfter, orderByKey } from 'firebase/database';

const INITIAL_CONFIG: AppConfig = {
  appName: 'O Que Tem Perto?',
  headerSubtitle: 'Águas Claras e Região',
  primaryColor: '#0047AB',
  accentColor: '#DC143C',
  tertiaryColor: '#166534',
  fontFamily: 'Inter',
  pixKey: 'crinf.negocios@gmail.com',
  supportEmail: 'crinf.app@gmail.com',
  instagramUrl: 'https://www.instagram.com/crinfinformatica/',
  shareUrl: 'https://oquetempertocl.web.app',
  apkUrl: '',
  footerText: 'Desenvolvido pela',
  footerSubtext: 'Todos os direitos reservados',
  utilityOrder: ['emergencia', 'utilidade', 'saude', 'bus', 'social', 'prefeitura'],
  busLines: [
    { id: 'b1', name: 'Águas Claras', url: 'https://www.campolargo.pr.gov.br/servicos/transporte-coletivo' },
    { id: 'b2', name: 'Francisco Gorski', url: 'https://www.campolargo.pr.gov.br/servicos/transporte-coletivo' },
    { id: 'b3', name: 'Moradias Bom Jesus', url: 'https://www.campolargo.pr.gov.br/servicos/transporte-coletivo' },
    { id: 'b4', name: 'Três Rios', url: 'https://www.campolargo.pr.gov.br/servicos/transporte-coletivo' },
    { id: 'b5', name: 'Consultar outras linhas', url: 'https://www.campolargo.pr.gov.br/servicos/transporte-coletivo' }
  ],
  utilityCategories: [
    {
      id: 'emergencia',
      title: '🚨 Emergência',
      items: [
        { id: 'e1', name: 'SAMU', number: '192', description: 'Urgência e Emergência' },
        { id: 'e2', name: 'Bombeiros', number: '193', description: 'Combate a incêndio' },
        { id: 'e3', name: 'Polícia Militar', number: '190', description: 'Ocorrências' },
        { id: 'e4', name: 'Guarda Municipal', number: '153', description: 'Segurança Local' },
        { id: 'e5', name: 'Delegacia Civil', number: '(41) 3291-6100', description: 'Plantão Policial' },
        { id: 'e6', name: 'Defesa Civil', number: '199', description: 'Desastres e Alagamentos' }
      ]
    },
    {
      id: 'utilidade',
      title: '💡 Água e Luz',
      items: [
        { id: 'u1', name: 'Cocel (Energia)', number: '0800 7272 120', description: 'Falta de Luz / Serviços' },
        { id: 'u2', name: 'Sanepar (Água)', number: '0800 200 0115', description: 'Falta de Água / Esgoto' }
      ]
    },
    {
      id: 'saude',
      title: '🏥 Saúde e Hospitais',
      items: [
        { id: 's1', name: 'UPA 24h', number: '(41) 3391-5000', description: 'Urgência e Emergência' },
        { id: 's2', name: 'Hosp. do Rocio', number: '(41) 3136-2000', description: 'Hospital Geral' },
        { id: 's3', name: 'Hosp. São Lucas', number: '(41) 3291-2300', description: 'Partic. e Convênios' },
        { id: 's4', name: 'Hosp. Infantil', number: '(41) 3391-8100', description: 'Waldemar Monastier' },
        { id: 's5', name: 'UBS Águas Claras', number: '(41) 3391-5121', description: 'Posto de Saúde' },
        { id: 's6', name: 'UBS Três Rios', number: '(41) 3391-5126', description: 'Posto de Saúde' },
        { id: 's7', name: 'Sec. de Saúde', number: '(41) 3391-5000', description: 'Secretaria Municipal' }
      ]
    },
    {
      id: 'social',
      title: '🤝 Social e Apoio',
      items: [
        { id: 'so1', name: 'Conselho Tutelar', number: '(41) 3391-5095', description: 'Proteção à criança' },
        { id: 'so2', name: 'CRAS Meliane', number: '(41) 3391-5037', description: 'Atendimento Social' },
        { id: 'so3', name: 'Assistência Social', number: '(41) 3391-5000', description: 'Secretaria Municipal' },
        { id: 'so4', name: 'Narcodenúncia', number: '181', description: 'Anônimo e Sigiloso' }
      ]
    },
    {
      id: 'prefeitura',
      title: '🏢 Prefeitura & Órgãos',
      items: [
        { id: 'p1', name: 'Prefeitura', number: '(41) 3391-5000', description: 'Atendimento Geral' },
        { id: 'p2', name: 'Ag. do Trabalhador', number: '(41) 3292-1262', description: 'Vagas de Emprego' },
        { id: 'p3', name: 'Fórum', number: '(41) 3391-4750', description: 'Justiça Estadual' },
        { id: 'p4', name: 'Cartório Eleitoral', number: '(41) 3292-2300', description: 'Zona 009 / Título' },
        { id: 'p5', name: 'Detran / Ciretran', number: '(41) 3361-1212', description: 'CNH e Veículos' },
        { id: 'p6', name: 'Sec. de Obras', number: '(41) 3391-5151', description: 'Viação e Obras' },
        { id: 'p7', name: 'Meio Ambiente', number: '(41) 3391-5151', description: 'Denúncias e Coleta' },
        { id: 'p8', name: 'Sala do Empreendedor', number: '(41) 3391-5150', description: 'Apoio ao MEI' }
      ]
    }
  ],
  campaign: {
    active: false,
    title: '',
    description: '',
    imageUrl: ''
  },
  socialProject: {
    active: true,
    name: 'Projeto Gotinhas de Amor',
    description: 'Capelania hospitalar dentro do hospital infantil de Campo Largo/PR. Contribua com este trabalho social!',
    pixKey: 'crinf.projetosocial@gmail.com',
    instagram: 'gotinhasdeamorcapelania'
  }
};

const MASTER_EMAIL = 'crinf.app@gmail.com';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); 
  const [showInstallTutorial, setShowInstallTutorial] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [searchTab, setSearchTab] = useState<'pro' | 'business'>('pro');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNeighborhood, setSearchNeighborhood] = useState('');
  const [searchHighRated, setSearchHighRated] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const [lastLoadedKey, setLastLoadedKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);

  const [isMatching, setIsMatching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (view === 'admin-login' && currentUser && (currentUser.role === 'master' || currentUser.role === 'admin')) {
      setView('admin-panel');
    }
  }, [view, currentUser]);

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
          
          if (firebaseUser.email === MASTER_EMAIL) {
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
                alert("Sua conta foi suspensa.");
                return;
              }
              const loggedUser = { 
                ...data, 
                id: firebaseUser.uid,
                favorites: data.favorites || [] 
              };
              setCurrentUser(loggedUser);
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
    if (!hasValidConfig || !db || Object.keys(db).length === 0) return;
    const configRef = ref(db, 'config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAppConfig({
          ...INITIAL_CONFIG,
          ...data,
          utilityCategories: data.utilityCategories || INITIAL_CONFIG.utilityCategories,
          busLines: data.busLines || INITIAL_CONFIG.busLines,
          socialProject: data.socialProject || INITIAL_CONFIG.socialProject,
          utilityOrder: data.utilityOrder || INITIAL_CONFIG.utilityOrder
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStandardLogin = async (e: string, p: string) => {
    if (!auth || (auth as any)._isMock) return;
    try {
      await signInWithEmailAndPassword(auth, e, p);
      if (view === 'login') {
         setView('home');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleManualLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        alert("Localização obtida com sucesso! A busca priorizará o que estiver mais próximo de você.");
        setIsLocating(false);
      },
      (error) => {
        const errorMessage = error.message || "Erro desconhecido ao acessar GPS.";
        console.error("Geo error:", errorMessage);
        alert(`Não foi possível obter sua localização: ${errorMessage}. Verifique as permissões do seu navegador ou celular.`);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const performSearch = async (request: ServiceRequest, isNewSearch: boolean = true) => {
     if (!hasValidConfig || !db || Object.keys(db).length === 0) return;
     if (isNewSearch) {
        setProfessionals([]);
        setLastLoadedKey(null);
        setHasMore(true);
        setCurrentRequest(request);
     }
     const PAGE_SIZE = 50; 
     const usersRef = ref(db, 'users');
     let dbQuery = query(usersRef, orderByKey(), limitToFirst(PAGE_SIZE));
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
              if (!u.role || u.role === 'admin' || u.role === 'master' || u.role === 'client' || u.status === 'banned') return;
              if (request.searchType === 'pro' && u.role !== 'pro') return;
              if (request.searchType === 'business' && u.role !== 'business') return;
              if (request.neighborhood && u.neighborhood !== request.neighborhood) return;
              
              const searchTerm = (searchQuery || '').toLowerCase().trim();
              if (searchTerm !== '') {
                 const nameLower = (u.name || '').toLowerCase();
                 const catLower = (u.category || '').toLowerCase();
                 const matches = nameLower.includes(searchTerm) || catLower.includes(searchTerm);
                 if (!matches) return;
              }

              const isHighlighted = u.highlightExpiresAt ? new Date(u.highlightExpiresAt) > new Date() : false;

              results.push({
                 id: key,
                 name: u.name || 'Sem Nome',
                 title: u.category || 'Prestador',
                 rating: 5.0, 
                 reviewCount: u.reviews ? Object.keys(u.reviews).length : 0,
                 bio: u.businessDescription || '',
                 avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || 'U'}`,
                 distance: u.neighborhood || 'Campo Largo',
                 neighborhood: u.neighborhood || 'Campo Largo',
                 tags: u.category ? [u.category] : [],
                 reviews: u.reviews ? Object.values(u.reviews) : [],
                 isHighlighted: isHighlighted,
                 address: u.address,
                 phone: u.phone,
                 socials: u.socials
              });
           });

           const sortedResults = [...results].sort((a, b) => {
              if (a.isHighlighted && !b.isHighlighted) return -1;
              if (!a.isHighlighted && b.isHighlighted) return 1;
              return 0;
           });

           setProfessionals(prev => isNewSearch ? sortedResults : [...prev, ...sortedResults]);
           setLastLoadedKey(entries[entries.length - 1][0]);
           if (entries.length < PAGE_SIZE) setHasMore(false);
        } else {
           setHasMore(false);
        }
     } catch (err) { setHasMore(false); } finally { setIsLoadingMore(false); setIsMatching(false); }
  };

  const handleHeroSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    let finalQuery = searchQuery || (searchTab === 'pro' ? 'Serviços Gerais' : 'Lojas e Comércio');
    
    const result = await identifyServiceCategory(finalQuery);
    const request: ServiceRequest = {
       categoryId: result.categoryId,
       subCategory: searchQuery || (searchTab === 'pro' ? 'Todos os Serviços' : 'Todo o Comércio'), 
       description: '',
       location: "Campo Largo",
       urgency: "N/A",
       searchType: searchTab, 
       neighborhood: searchNeighborhood,
       onlyHighRated: searchHighRated,
       detectedCategory: result.subCategory
    };
    setSelectedSubCategory(request.subCategory); 
    await performSearch(request, true);
    setView('results');
  };

  const handleSelectProfessional = (pro: Professional) => {
    setSelectedProfessional(pro);
    setView('details');
  };

  const handleToggleFavorite = (proId: string) => {
    if (!currentUser) { setView('login'); return; }
    const currentFavs = currentUser.favorites || [];
    const isFav = currentFavs.includes(proId);
    const newFavorites = isFav ? currentFavs.filter(id => id !== proId) : [...currentFavs, proId];
    update(ref(db, `users/${currentUser.id}`), { favorites: newFavorites });
  };

  const handleLogout = () => { if (auth && !(auth as any)._isMock) signOut(auth); setCurrentUser(null); setView('home'); };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
       setShowInstallTutorial(true);
    }
  };

  const handleDownloadApk = () => {
    if (appConfig.apkUrl) {
      window.open(appConfig.apkUrl, '_blank');
      setShowInstallTutorial(true);
    }
  };

  const handleAddReview = async (proId: string, review: Review) => {
    if (!db) return;
    const proReviewsRef = ref(db, `users/${proId}/reviews/${review.id}`);
    await update(proReviewsRef, review);
    if (selectedProfessional && selectedProfessional.id === proId) {
      const updatedReviews = [...(selectedProfessional.reviews || []), review];
      setSelectedProfessional({ ...selectedProfessional, reviews: updatedReviews, reviewCount: updatedReviews.length });
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <style>{`
        body { font-family: ${appConfig.fontFamily || 'Inter'}, sans-serif !important; }
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
        {showAbout && <PrivacyPolicy onClose={() => setShowAbout(false)} appName={appConfig.appName} />}
        
        {view === 'home' && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
             <div className="mb-8 p-4 bg-white rounded-full shadow-2xl border-4 border-gray-50">
                {appConfig.logoUrl ? (
                   <img src={appConfig.logoUrl} className="w-28 h-28 md:w-36 md:h-36 object-contain" alt="Logo" />
                ) : (
                   <AppLogo className="w-28 h-28 md:w-36 md:h-36" />
                )}
             </div>

             {appConfig.campaign?.active && (
                <div className="w-full max-w-2xl bg-gradient-to-br from-purple-600 to-primary rounded-[2.5rem] shadow-2xl overflow-hidden mb-10 text-white relative group animate-in slide-in-from-top-4 duration-500">
                   <div className="flex flex-col md:flex-row h-full">
                      {appConfig.campaign.imageUrl && (
                         <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                            <img src={appConfig.campaign.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:hidden"></div>
                         </div>
                      )}
                      <div className="flex-1 p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-3">
                            <Megaphone size={16} className="text-purple-200 animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-100">Campanha em Destaque</span>
                         </div>
                         <h3 className="text-2xl font-black mb-3 leading-tight">{appConfig.campaign.title}</h3>
                         <p className="text-sm text-purple-50/80 mb-6 line-clamp-3 leading-relaxed">{appConfig.campaign.description}</p>
                         
                         {appConfig.campaign.link && (
                            <a href={appConfig.campaign.link} target="_blank" className="inline-flex items-center gap-2 bg-white text-primary font-black px-6 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-xs w-fit">
                               {appConfig.campaign.label || 'Ver Mais'}
                               <ExternalLink size={14} />
                            </a>
                         )}
                      </div>
                   </div>
                </div>
             )}

             <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-4 md:p-6 mb-8">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-6">
                   <button onClick={() => setSearchTab('pro')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'pro' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-md' : 'text-gray-400'}`}>Serviços</button>
                   <button onClick={() => setSearchTab('business')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${searchTab === 'business' ? 'bg-white dark:bg-gray-700 text-tertiary shadow-md' : 'text-gray-400'}`}>Comércio</button>
                </div>
                <form onSubmit={handleHeroSearch} className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchTab === 'pro' ? "O que você precisa?" : "Qual loja procura?"} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all" />
                   </div>
                   
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select value={searchNeighborhood} onChange={(e) => setSearchNeighborhood(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all appearance-none">
                          <option value="">Em toda a região</option>
                          {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <button 
                        type="button"
                        onClick={handleManualLocation}
                        disabled={isLocating}
                        className={`p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all ${isLocating ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-50 dark:bg-gray-900 hover:text-primary shadow-sm active:scale-95'}`}
                        title="Usar minha localização atual (Ligar GPS)"
                      >
                         {isLocating ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
                      </button>
                   </div>

                   <button type="submit" disabled={isMatching} className="w-full bg-accent hover:bg-accent-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50">
                     {isMatching ? <Loader2 className="animate-spin" /> : <Search />}
                     Buscar Agora
                   </button>
                </form>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <button onClick={handleInstall} className="w-full bg-blue-50 text-blue-700 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-100 transition-all active:scale-95 shadow-sm">
                      <Smartphone size={20} /> Instalar no Celular
                   </button>
                   {appConfig.apkUrl && (
                      <button onClick={handleDownloadApk} className="w-full bg-green-50 text-green-700 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-100 transition-all active:scale-95 shadow-sm">
                        <Download size={20} /> Baixar APK Android
                      </button>
                   )}
                </div>
             </div>
             
             <PublicUtilities config={appConfig} />
          </div>
        )}

        {view === 'login' && <LoginForm onBack={() => setView('home')} onLogin={handleStandardLogin} onRegisterClick={() => setView('register-selection')} onAdminClick={() => setView('admin-login')} onGuestClick={() => setView('home')} />}
        
        {/* NOVAS ROTAS DE CADASTRO */}
        {view === 'register-selection' && (
          <RegisterSelection 
            onSelect={(type) => setView(`register-${type}` as AppView)} 
            onBack={() => setView('home')} 
          />
        )}
        {view === 'register-client' && <RegisterForm appName={appConfig.appName} type="client" onBack={() => setView('register-selection')} onRegisterSuccess={() => setView('home')} />}
        {view === 'register-pro' && <RegisterForm appName={appConfig.appName} type="pro" onBack={() => setView('register-selection')} onRegisterSuccess={() => setView('home')} />}
        {view === 'register-business' && <RegisterForm appName={appConfig.appName} type="business" onBack={() => setView('register-selection')} onRegisterSuccess={() => setView('home')} />}

        {view === 'results' && <ResultsList professionals={professionals} subCategory={selectedSubCategory} onBack={() => setView('home')} onSelectProfessional={handleSelectProfessional} currentUser={currentUser} onToggleFavorite={handleToggleFavorite} onLoadMore={() => performSearch(currentRequest!, false)} hasMore={hasMore} isLoadingMore={isLoadingMore} />}
        {view === 'details' && selectedProfessional && <ProfessionalDetails professional={selectedProfessional} currentUser={currentUser} onBack={() => setView('results')} onAddReview={handleAddReview} onToggleFavorite={handleToggleFavorite} />}
        {view === 'user-profile' && currentUser && <UserProfile user={currentUser} onUpdate={(u) => update(ref(db, `users/${u.id}`), u)} onLogout={handleLogout} onBack={() => setView('home')} onOpenAdmin={() => setView('admin-panel')} />}
        {view === 'donation' && <DonationView config={appConfig} onBack={() => setView('home')} />}
        {view === 'admin-login' && <LoginForm onBack={() => setView('home')} onLogin={handleStandardLogin} onRegisterClick={() => {}} onAdminClick={() => {}} onGuestClick={() => {}} />}
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

      <Footer 
        onHomeClick={() => setView('home')} 
        onInstagramClick={() => window.open(appConfig.instagramUrl || 'https://www.instagram.com/crinfinformatica/', '_blank')} 
        onLoginClick={() => setView('login')} 
        onRegisterClick={() => setView('register-selection')} 
        onProfileClick={() => setView('user-profile')} 
        onDonationClick={() => setView('donation')}
        onAboutClick={() => setShowAbout(true)} 
        onBackClick={() => setView('home')} 
        currentUser={currentUser} 
        currentView={view} 
        config={appConfig}
      />
    </div>
  );
}

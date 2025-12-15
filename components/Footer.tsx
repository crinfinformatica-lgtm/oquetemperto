
import React from 'react';
import { 
  Home, 
  UserCircle, 
  PlusCircle, 
  Instagram, 
  Info,
  ArrowLeft
} from 'lucide-react';
import { User, AppView } from '../types';

interface FooterProps {
  onHomeClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onProfileClick: () => void;
  onAboutClick: () => void;
  onInstagramClick: () => void;
  onBackClick: () => void;
  currentUser: User | null;
  currentView: AppView;
}

const Footer: React.FC<FooterProps> = ({ 
  onHomeClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onAboutClick,
  onInstagramClick,
  onBackClick,
  currentUser,
  currentView
}) => {
  
  // Helper for conditional styling
  const navItemClass = "flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary transition-colors gap-1 dark:text-gray-400 dark:hover:text-primary";
  const isHome = currentView === 'home';

  return (
    <>
      {/* Spacer to prevent content being hidden behind fixed footer */}
      <div className="h-28"></div>

      {/* Main Bottom Navigation Container */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex flex-col">
        
        {/* Icons Row */}
        <div className="container mx-auto px-2 flex justify-between items-center max-w-lg h-16 md:h-16 relative z-10">
          
          {/* Slot 1: Back (if deep) or Home (if home) */}
          {isHome ? (
             <button onClick={onHomeClick} className={`${navItemClass} text-primary`}>
               <Home size={24} />
               <span className="text-[10px]">Início</span>
             </button>
          ) : (
            <button onClick={onBackClick} className={navItemClass}>
              <ArrowLeft size={24} />
              <span className="text-[10px]">Voltar</span>
            </button>
          )}

          {/* Slot 2: Instagram */}
          <button onClick={onInstagramClick} className={navItemClass}>
            <Instagram size={24} />
            <span className="text-[10px]">@crinf</span>
          </button>

          {/* Slot 3: Register (Center Action) - ENLARGED SUPER SIZE & Lowered Position */}
          <div className="relative -top-4 md:-top-6 pointer-events-none">
             <button 
                onClick={onRegisterClick}
                className="pointer-events-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-[6px] border-gray-50 dark:border-gray-800 hover:bg-accent-dark"
                title="Criar Conta / Anunciar"
             >
                <PlusCircle size={48} strokeWidth={2.5} />
             </button>
          </div>

          {/* Slot 4: Sobre (About) */}
          <button onClick={onAboutClick} className={navItemClass}>
            <Info size={24} />
            <span className="text-[10px]">Sobre</span>
          </button>

          {/* Slot 5: Profile/Login */}
          <button onClick={currentUser ? onProfileClick : onLoginClick} className={`${navItemClass} ${currentView === 'user-profile' || currentView === 'login' ? 'text-primary' : ''}`}>
            {currentUser && currentUser.avatarUrl ? (
               <img src={currentUser.avatarUrl} className="w-6 h-6 rounded-full border border-gray-300" alt="Avatar" />
            ) : (
               <UserCircle size={24} />
            )}
            <span className="text-[10px]">{currentUser ? 'Perfil' : 'Entrar'}</span>
          </button>
        </div>

        {/* Development Credits Bar */}
        <div className="bg-gray-100 dark:bg-black w-full py-1 text-center border-t border-gray-200 dark:border-gray-800">
           <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Desenvolvido pela <span className="font-bold text-primary">Crinf Informática</span>
           </p>
        </div>
      </nav>
    </>
  );
};

export default Footer;

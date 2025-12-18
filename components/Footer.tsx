
import React from 'react';
import { 
  Home, 
  UserCircle, 
  PlusCircle, 
  Instagram, 
  Heart,
  ArrowLeft
} from 'lucide-react';
import { User, AppView, AppConfig } from '../types';

interface FooterProps {
  onHomeClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onProfileClick: () => void;
  onDonationClick: () => void;
  onAboutClick: () => void;
  onInstagramClick: () => void;
  onBackClick: () => void;
  currentUser: User | null;
  currentView: AppView;
  config?: AppConfig; 
}

const Footer: React.FC<FooterProps> = ({ 
  onHomeClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onDonationClick,
  onAboutClick,
  onInstagramClick,
  onBackClick,
  currentUser,
  currentView,
  config
}) => {
  
  const navItemClass = "flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary transition-colors gap-1 dark:text-gray-400 dark:hover:text-primary";
  const isHome = currentView === 'home';

  return (
    <>
      <div className="h-28"></div>
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex flex-col">
        <div className="container mx-auto px-2 flex justify-between items-center max-w-lg h-16 md:h-16 relative z-10">
          
          {isHome ? (
             <button onClick={onHomeClick} className={`${navItemClass} ${currentView === 'home' ? 'text-primary' : ''}`}>
               <Home size={24} />
               <span className="text-[10px]">Início</span>
             </button>
          ) : (
            <button onClick={onBackClick} className={navItemClass}>
              <ArrowLeft size={24} />
              <span className="text-[10px]">Voltar</span>
            </button>
          )}

          <button onClick={onInstagramClick} className={navItemClass}>
            <Instagram size={24} />
            <span className="text-[10px]">Instagram</span>
          </button>

          <div className="relative -top-4 md:-top-6 pointer-events-none">
             <button 
                onClick={onRegisterClick}
                className="pointer-events-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-[6px] border-gray-50 dark:border-gray-800 hover:bg-accent-dark"
                title="Criar Conta / Anunciar"
             >
                <PlusCircle size={48} strokeWidth={2.5} />
             </button>
          </div>

          <button onClick={onDonationClick} className={`${navItemClass} ${currentView === 'donation' ? 'text-red-500' : ''}`}>
            <Heart size={24} className={currentView === 'donation' ? 'fill-current' : ''} />
            <span className="text-[10px]">Doar</span>
          </button>

          <button onClick={currentUser ? onProfileClick : onLoginClick} className={`${navItemClass} ${currentView === 'user-profile' || currentView === 'login' ? 'text-primary' : ''}`}>
            {currentUser && currentUser.avatarUrl ? (
               <img src={currentUser.avatarUrl} className="w-6 h-6 rounded-full border border-gray-300" alt="Avatar" />
            ) : (
               <UserCircle size={24} />
            )}
            <span className="text-[10px]">{currentUser ? 'Perfil' : 'Entrar'}</span>
          </button>
        </div>

        <div className="bg-gray-100 dark:bg-black w-full py-1 text-center border-t border-gray-200 dark:border-gray-800 flex flex-col justify-center items-center gap-1">
           <div className="flex justify-center items-center gap-4">
              <button onClick={onAboutClick} className="text-[10px] text-gray-500 hover:text-primary font-bold uppercase">Sobre</button>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium border-l border-gray-300 pl-4">
                 {config?.footerText || 'Desenvolvido pela'} <span className="font-bold text-primary">Crinf Informática</span>
              </p>
           </div>
           {config?.footerSubtext && (
             <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{config.footerSubtext}</p>
           )}
        </div>
      </nav>
    </>
  );
};

export default Footer;

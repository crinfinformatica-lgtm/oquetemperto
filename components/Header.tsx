
import React from 'react';
import AppLogo from './AppLogo';
import { AppConfig } from '../types';
import { Share2 } from 'lucide-react';

interface HeaderProps {
  onLogoClick: () => void;
  config: AppConfig;
  onShareClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  config,
  onShareClick
}) => {
  return (
    // Header with Blue Background (primary) and Red Border (accent)
    <header className="bg-primary shadow-lg sticky top-0 z-50 border-b-4 border-accent relative transition-colors duration-300">
      
      <div className="container mx-auto px-2 md:px-4 h-16 flex items-center justify-center relative">
        {/* Logo & Text Centered */}
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer group max-w-[75%] md:max-w-none" 
          onClick={onLogoClick}
          title="Início"
        >
          {config.logoUrl ? (
             <img src={config.logoUrl} alt="Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain bg-white rounded-full p-1 flex-shrink-0" />
          ) : (
             <div className="bg-white rounded-full p-1 shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
               <AppLogo className="w-8 h-8 md:w-10 md:h-10" />
             </div>
          )}
          
          <div className="flex flex-col items-center md:items-start leading-none">
            <span className="text-sm md:text-lg font-bold text-white leading-tight drop-shadow-sm text-center md:text-left line-clamp-2 md:line-clamp-1">
              {config.appName}
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wide text-blue-100/80">
              Águas Claras e Região
            </span>
          </div>
        </div>

        {/* Share Button - Improved Visibility and Aesthetics */}
        {onShareClick && (
          <button 
            onClick={onShareClick}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-20 flex items-center justify-center"
            title="Compartilhar"
            aria-label="Compartilhar Aplicativo"
          >
            <Share2 size={24} strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

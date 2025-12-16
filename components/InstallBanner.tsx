
import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-primary/20 z-[100] animate-in slide-in-from-bottom-10 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
           <Smartphone size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Instalar Aplicativo</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">Acesso rápido e funciona offline.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onDismiss}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>
        <button 
          onClick={onInstall}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Download size={14} /> Instalar
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;

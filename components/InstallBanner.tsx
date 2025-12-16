
import React from 'react';
import { Download, X, Smartphone, HelpCircle } from 'lucide-react';

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
  onHelp: () => void; // Nova prop para abrir tutorial
}

const InstallBanner: React.FC<InstallBannerProps> = ({ onInstall, onDismiss, onHelp }) => {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-primary/20 z-[100] animate-in slide-in-from-bottom-10 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
             <Smartphone size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Instalar Aplicativo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">Acesso rápido e funciona offline.</p>
          </div>
        </div>
        <button 
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="Fechar"
          >
            <X size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-2 w-full">
        <button 
          onClick={onHelp}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <HelpCircle size={14} /> Como instalar?
        </button>
        <button 
          onClick={onInstall}
          className="flex-1 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Download size={14} /> Instalar Agora
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;


import React from 'react';
import { Search, MapPin, Briefcase, X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-300 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        <div className="bg-primary p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 transform rotate-45 scale-150"></div>
          <h2 className="text-2xl font-bold relative z-10">Bem-vindo a Águas Claras!</h2>
          <p className="text-blue-100 relative z-10 text-sm mt-1">Seu guia de serviços e comércios locais.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
             <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300">
                <Search size={24} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Encontre Tudo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">De encanadores a pizzarias. Digite o que precisa e nossa IA encontra para você.</p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full text-green-600 dark:text-green-300">
                <MapPin size={24} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Bem Perto de Você</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Focado na região de Águas Claras, Campo Largo. Apoie o comércio local!</p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full text-yellow-600 dark:text-yellow-300">
                <Briefcase size={24} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Divulgue Grátis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">É prestador ou tem um negócio? Cadastre-se e apareça nas buscas.</p>
             </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
          <button 
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Começar a Usar
          </button>
        </div>

      </div>
    </div>
  );
};

export default WelcomeModal;


import React, { useState } from 'react';
import { X, Share, MoreVertical, PlusSquare, Smartphone, CheckCircle, FileDown, Settings, AlertTriangle } from 'lucide-react';

interface InstallTutorialProps {
  onClose: () => void;
}

const InstallTutorial: React.FC<InstallTutorialProps> = ({ onClose }) => {
  // Detecta se é iOS para mostrar a aba correta por padrão
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'apk'>(isIOS ? 'ios' : 'android');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone className="text-primary" size={20} />
            Como Instalar o App
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'android' ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            PWA (Chrome)
          </button>
          <button 
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'apk' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50 dark:bg-green-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            APK (Android)
          </button>
          <button 
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'ios' ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            iPhone (iOS)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'android' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                  <MoreVertical size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Toque no ícone de <strong className="text-gray-900 dark:text-white">3 pontinhos</strong> no canto superior direito do navegador.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                   <Smartphone size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Selecione <strong className="text-gray-900 dark:text-white">"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600">
                   <CheckCircle size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Confirme a instalação. O ícone aparecerá junto com seus outros apps!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3 items-start mb-2">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-yellow-800 leading-tight">
                     O Android bloqueia instalações fora da loja por segurança. Você precisará autorizar manualmente.
                  </p>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-green-600">
                   <FileDown size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 1</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300">Clique em <strong>"Baixar APK Android"</strong> na tela inicial. Quando o download terminar, toque em <strong>Abrir</strong>.</p>
                 </div>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600">
                   <Settings size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 2 (Segurança)</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Se aparecer: <em>"O smartphone não tem permissão para instalar apps desconhecidos dessa fonte"</em>:
                   </p>
                   <ol className="list-decimal pl-4 text-xs text-gray-500 space-y-1">
                      <li>Toque em <strong>Configurações</strong> no aviso.</li>
                      <li>Ative a chave <strong>"Permitir desta fonte"</strong>.</li>
                      <li>Volte para a tela anterior.</li>
                   </ol>
                 </div>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600">
                   <Smartphone size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 3</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300">Toque em <strong>Instalar</strong>. Pronto! O app já pode ser usado.</p>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-blue-500">
                  <Share size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 1</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Toque no botão <strong className="text-blue-600">Compartilhar</strong> na barra inferior do Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                  <PlusSquare size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Role o menu para cima e toque em <strong className="text-gray-900 dark:text-white">"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-xs">Adic.</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Passo 3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Toque em "Adicionar" no canto superior direito.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center flex-shrink-0">
           <button onClick={onClose} className="text-sm font-bold text-primary hover:underline">
              Entendi, vou tentar agora
           </button>
        </div>
      </div>
    </div>
  );
};

export default InstallTutorial;

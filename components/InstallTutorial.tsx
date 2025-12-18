
import React, { useState } from 'react';
import { X, Share, MoreVertical, PlusSquare, Smartphone, CheckCircle, FileDown, Settings, AlertTriangle, HelpCircle } from 'lucide-react';

interface InstallTutorialProps {
  onClose: () => void;
}

const InstallTutorial: React.FC<InstallTutorialProps> = ({ onClose }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'apk'>(isIOS ? 'ios' : 'android');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[90vh] flex flex-col">
        
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-primary" size={20} />
            Como Instalar no seu Celular
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'apk' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50 dark:bg-green-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            Passo a Passo Android
          </button>
          <button 
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'android' ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            Fixar Web App
          </button>
          <button 
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeTab === 'ios' ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            iPhone (iOS)
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'apk' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex gap-3 items-start mb-2">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-yellow-800 leading-tight">
                     Se o seu celular avisar sobre "Fontes Desconhecidas", não se preocupe! Siga os passos abaixo:
                  </p>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-green-600">
                   <FileDown size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">1. Baixe o Arquivo</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300">Clique no botão verde de baixar APK na tela inicial. Quando o download terminar, abra-o.</p>
                 </div>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600">
                   <Settings size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">2. Autorizar no Celular</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Se aparecer uma mensagem de bloqueio, clique em <strong className="text-gray-900 dark:text-white">"Configurações"</strong> no aviso.
                   </p>
                   <div className="bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-800 font-medium">
                      Ative a chavinha que diz <strong className="uppercase">"Permitir desta fonte"</strong>. Esse passo é necessário porque o app não está na Play Store ainda.
                   </div>
                 </div>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600">
                   <Smartphone size={20} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white text-sm">3. Clique em Instalar</p>
                   <p className="text-sm text-gray-600 dark:text-gray-300">Agora é só voltar e clicar em <strong>Instalar</strong>. O ícone aparecerá junto com seus outros aplicativos!</p>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                 Este método cria um atalho direto para o site, sem ocupar memória do celular.
              </p>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                  <MoreVertical size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">1. Abra o Menu do Chrome</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Toque nos <strong className="text-gray-900 dark:text-white">3 pontinhos</strong> lá no alto à direita.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                   <Smartphone size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">2. Adicionar à Tela</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Procure e clique na opção <strong className="text-gray-900 dark:text-white">"Adicionar à tela inicial"</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600">
                   <CheckCircle size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">3. Pronto!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Confirme o nome e o ícone surgirá na sua tela principal como mágica.</p>
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
                  <p className="font-bold text-gray-800 dark:text-white text-sm">1. Toque em Compartilhar</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">No navegador Safari, toque no ícone do quadradinho com uma seta pra cima.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-300">
                  <PlusSquare size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">2. Adicionar à Tela de Início</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Role a lista pra cima e escolha <strong className="text-gray-900 dark:text-white">"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-green-600">
                   <CheckCircle size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">3. Finalizar</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Toque em "Adicionar" lá no alto. O app está pronto para usar!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center flex-shrink-0">
           <button onClick={onClose} className="bg-primary text-white w-full py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all">
              Entendi, obrigado!
           </button>
        </div>
      </div>
    </div>
  );
};

export default InstallTutorial;

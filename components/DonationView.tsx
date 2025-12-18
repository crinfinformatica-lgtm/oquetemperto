
import React from 'react';
import { Heart, Instagram, Copy, Share2, ArrowLeft, Info, ExternalLink } from 'lucide-react';
import { AppConfig } from '../types';

interface DonationViewProps {
  config: AppConfig;
  onBack: () => void;
}

const DonationView: React.FC<DonationViewProps> = ({ config, onBack }) => {
  const project = config.socialProject;
  if (!project) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(project.pixKey);
    alert("Chave Pix copiada com sucesso!");
  };

  const handleShare = () => {
    const text = `Contribua com o ${project.name}! ${project.description}. Pix: ${project.pixKey}. Siga no Instagram: @${project.instagram}`;
    if (navigator.share) {
      navigator.share({ title: project.name, text, url: window.location.href });
    } else {
      handleCopyPix();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-primary mb-6 font-bold transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-red-50">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-10 text-center text-white relative">
             <Heart className="mx-auto mb-4 animate-bounce fill-white" size={64} />
             <h2 className="text-3xl font-black uppercase tracking-tight">{project.name}</h2>
             <p className="opacity-90 mt-2 text-sm font-medium italic">"Fazendo a diferença na vida de quem mais precisa"</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4 items-start">
               <Info className="text-red-500 shrink-0 mt-1" size={24} />
               <p className="text-sm text-red-900 leading-relaxed font-medium">
                  {project.description}
               </p>
            </div>

            <div className="flex flex-col items-center gap-6">
               <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Doação via Pix</h3>
               
               <div className="w-56 h-56 bg-white border-8 border-gray-50 rounded-[2rem] p-4 flex items-center justify-center shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(project.pixKey)}`} 
                    alt="QR Code Pix" 
                    className="w-full h-full object-contain"
                  />
               </div>

               <div className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="overflow-hidden">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chave Pix (E-mail)</p>
                     <code className="text-sm font-bold text-gray-800 truncate block">{project.pixKey}</code>
                  </div>
                  <button 
                    onClick={handleCopyPix}
                    className="p-3 bg-white text-primary rounded-xl shadow-sm hover:scale-110 active:scale-90 transition-all border border-gray-100"
                    title="Copiar Chave"
                  >
                     <Copy size={20} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <a 
                 href={`https://www.instagram.com/${project.instagram}`} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:scale-105 transition-all text-xs uppercase"
               >
                  <Instagram size={20} /> Seguir Projeto
               </a>
               <button 
                 onClick={handleShare}
                 className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:scale-105 transition-all text-xs uppercase"
               >
                  <Share2 size={20} /> Compartilhar
               </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
               O Que Tem Perto apoia iniciativas sociais locais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationView;

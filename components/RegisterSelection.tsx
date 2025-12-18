
import React from 'react';
import { User, Briefcase, Store, ArrowLeft } from 'lucide-react';

interface RegisterSelectionProps {
  onSelect: (type: 'client' | 'pro' | 'business') => void;
  onBack: () => void;
}

const RegisterSelection: React.FC<RegisterSelectionProps> = ({ onSelect, onBack }) => {
  const options = [
    {
      id: 'client' as const,
      title: 'Cliente / Usuário',
      description: 'Quero encontrar serviços, comércios e favoritar meus preferidos.',
      icon: <User size={40} />,
      color: 'bg-primary',
      hover: 'hover:border-primary'
    },
    {
      id: 'pro' as const,
      title: 'Prestador de Serviço',
      description: 'Sou eletricista, diarista, pedreiro... Quero divulgar meu trabalho.',
      icon: <Briefcase size={40} />,
      color: 'bg-accent',
      hover: 'hover:border-accent'
    },
    {
      id: 'business' as const,
      title: 'Comércio / Loja',
      description: 'Tenho uma loja física ou delivery e quero aparecer no guia.',
      icon: <Store size={40} />,
      color: 'bg-tertiary',
      hover: 'hover:border-tertiary'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-primary mb-8 font-bold transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Criar Conta</h2>
          <p className="text-gray-500 mt-2">Escolha como você deseja utilizar o aplicativo.</p>
        </div>

        <div className="space-y-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`w-full bg-white p-6 rounded-[2rem] border-2 border-transparent ${opt.hover} shadow-sm hover:shadow-xl transition-all flex items-center gap-6 text-left group active:scale-[0.98]`}
            >
              <div className={`${opt.color} text-white p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110`}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-800 leading-tight">{opt.title}</h3>
                <p className="text-sm text-gray-500 leading-tight mt-1">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-12">
          O cadastro é gratuito para todos os usuários.
        </p>
      </div>
    </div>
  );
};

export default RegisterSelection;

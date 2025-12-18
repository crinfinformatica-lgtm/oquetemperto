
import React from 'react';
import { 
  Phone, 
  Building2, 
  Bus,
  ExternalLink,
  Info,
  AlertCircle,
  ShieldAlert,
  Stethoscope,
  Users,
  HandHelping,
  Zap,
  Flame,
  Shield,
  Heart,
  Droplets,
  Siren,
  Activity
} from 'lucide-react';
import { AppConfig, UtilityCategory } from '../types';

interface PublicUtilitiesProps {
  config: AppConfig;
}

const PublicUtilities: React.FC<PublicUtilitiesProps> = ({ config }) => {
  
  const busLines = config.busLines || [];
  const utilities = config.utilityCategories || [];
  const utilityOrder = config.utilityOrder || ['emergencia', 'utilidade', 'saude', 'bus', 'social', 'prefeitura'];

  const getOrderedItems = () => {
    const items: { type: 'util' | 'bus', data: any, id: string }[] = [];

    utilityOrder.forEach(id => {
      if (id === 'bus') {
        if (busLines.length > 0) items.push({ type: 'bus', data: busLines, id: 'bus' });
      } else {
        const cat = utilities.find(u => u.id === id);
        if (cat) items.push({ type: 'util', data: cat, id: cat.id });
      }
    });

    // Adiciona categorias que não estejam explicitamente na ordem
    utilities.forEach(cat => {
      if (!utilityOrder.includes(cat.id)) {
        items.push({ type: 'util', data: cat, id: cat.id });
      }
    });

    return items;
  };

  const getEmergencyIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('samu')) return <Heart className="text-red-500" size={24} />;
    if (n.includes('bombeiro')) return <Flame className="text-orange-500" size={24} />;
    if (n.includes('militar')) return <Shield className="text-blue-600" size={24} />;
    if (n.includes('guarda')) return <Shield className="text-blue-900" size={24} />;
    if (n.includes('civil')) return <Siren className="text-gray-600" size={24} />;
    if (n.includes('defesa')) return <AlertCircle className="text-orange-600" size={24} />;
    return <ShieldAlert className="text-red-500" size={24} />;
  };

  const getUtilityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cocel') || n.includes('luz') || n.includes('energia')) return <Zap className="text-yellow-500" size={20} />;
    if (n.includes('sanepar') || n.includes('água')) return <Droplets className="text-blue-500" size={20} />;
    return <Zap size={20} />;
  };

  const getHealthIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('upa')) return <Siren className="text-teal-500" size={18} />;
    if (n.includes('hosp')) return <Building2 className="text-teal-600" size={18} />;
    if (n.includes('ubs') || n.includes('posto')) return <Heart className="text-teal-400" size={18} />;
    return <Activity className="text-teal-500" size={18} />;
  };

  const orderedItems = getOrderedItems();
  if (orderedItems.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 mb-16 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {orderedItems.map((item) => {
          if (item.type === 'bus') {
            return (
              <div key="bus" className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col h-full hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-6 border-b border-orange-50 pb-3">
                   <Bus className="text-orange-600" size={20} />
                   <h3 className="text-sm font-black text-orange-700 uppercase tracking-wider">Horário de Ônibus</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {item.data.map((line: any) => (
                    <a key={line.id} href={line.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-orange-50/30 rounded-2xl border border-transparent hover:border-orange-200 transition-all group">
                      <span className="text-sm font-bold text-gray-700">{line.name}</span>
                      <ExternalLink size={16} className="text-orange-400 group-hover:text-orange-600" />
                    </a>
                  ))}
                </div>
              </div>
            );
          }

          const cat = item.data as UtilityCategory;

          if (cat.id === 'emergencia') {
            return (
              <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-red-50 pb-3">
                   <Siren className="text-red-600" size={20} />
                   <h3 className="text-sm font-black text-red-600 uppercase tracking-wider">EMERGÊNCIA</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {cat.items.map((it) => (
                    <a key={it.id} href={`tel:${it.number.replace(/[^0-9]/g, '')}`} className="flex flex-col items-center justify-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:shadow-md transition-all hover:bg-white text-center group">
                       <div className="mb-2 group-hover:scale-110 transition-transform">
                          {getEmergencyIcon(it.name)}
                       </div>
                       <p className="text-[11px] font-black text-gray-800 leading-tight uppercase">{it.name}</p>
                       <p className="text-sm font-black text-gray-900 mt-0.5">{it.number}</p>
                    </a>
                  ))}
                </div>
              </div>
            );
          }

          if (cat.id === 'utilidade') {
            return (
              <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-blue-50 pb-3">
                   <Zap className="text-blue-600" size={20} />
                   <h3 className="text-sm font-black text-blue-700 uppercase tracking-wider">ÁGUA E LUZ</h3>
                </div>
                <div className="space-y-4">
                  {cat.items.map((it) => {
                    const isCocel = it.name.toLowerCase().includes('cocel');
                    return (
                      <div key={it.id} className={`p-5 rounded-2xl border flex items-center justify-between ${isCocel ? 'bg-yellow-50/50 border-yellow-100' : 'bg-blue-50/50 border-blue-100'}`}>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                               {getUtilityIcon(it.name)}
                            </div>
                            <div>
                               <p className="text-sm font-black text-gray-800 leading-tight">{it.name}</p>
                               <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{it.description}</p>
                            </div>
                         </div>
                         <a href={`tel:${it.number.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-black text-gray-700 shadow-sm hover:shadow-md active:scale-95 transition-all">
                            <Phone size={14} /> Ligar
                         </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (cat.id === 'saude') {
            return (
              <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-teal-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-teal-50 pb-3">
                   <Heart className="text-teal-600" size={20} />
                   <h3 className="text-sm font-black text-teal-700 uppercase tracking-wider">SAÚDE E HOSPITAIS</h3>
                </div>
                <div className="space-y-4">
                  {cat.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                             {getHealthIcon(it.name)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-800 leading-tight">{it.name}</p>
                             <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{it.description}</p>
                          </div>
                       </div>
                       <a href={`tel:${it.number.replace(/[^0-9]/g, '')}`} className="bg-white border border-gray-100 px-3 py-1.5 rounded-full text-[11px] font-black text-gray-600 shadow-sm hover:border-teal-300 hover:text-teal-700 transition-all active:scale-95">
                          Ligar
                       </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-3">
                 <Building2 className="text-gray-400" size={20} />
                 <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">{cat.title}</h3>
              </div>
              <div className="space-y-4">
                {cat.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group">
                     <div className="flex-1">
                        <p className="text-xs font-black text-gray-800 leading-tight group-hover:text-primary">{it.name}</p>
                        {it.description && <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5">{it.description}</p>}
                     </div>
                     <a href={`tel:${it.number.replace(/[^0-9]/g, '')}`} className="bg-primary/5 text-primary p-2 rounded-xl hover:bg-primary hover:text-white transition-all">
                        <Phone size={14} />
                     </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center">
         <div className="inline-flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-full border border-gray-100">
            <AlertCircle size={12} className="text-gray-400" />
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              Informações oficiais para Campo Largo e Região
            </p>
         </div>
      </div>
    </div>
  );
};

export default PublicUtilities;

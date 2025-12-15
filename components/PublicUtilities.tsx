
import React from 'react';
import { 
  Phone, 
  Shield, 
  Flame, 
  HeartPulse, 
  Truck, 
  Building2, 
  TreePine, 
  Users, 
  AlertTriangle, 
  Megaphone,
  Briefcase,
  Bus,
  Siren,
  ExternalLink,
  Zap,
  Droplets,
  Gavel,
  FileCheck,
  HardHat,
  Car
} from 'lucide-react';

const PublicUtilities: React.FC = () => {
  
  const emergencyServices = [
    { name: 'SAMU', number: '192', icon: HeartPulse, color: 'text-red-500' },
    { name: 'Bombeiros', number: '193', icon: Flame, color: 'text-orange-500' },
    { name: 'Polícia Militar', number: '190', icon: Shield, color: 'text-blue-700' },
    { name: 'Guarda Municipal', number: '153', icon: Shield, color: 'text-blue-900' },
    { name: 'Delegacia Civil', number: '(41) 3291-6100', icon: Siren, color: 'text-gray-700' },
    { name: 'Defesa Civil', number: '199', icon: AlertTriangle, color: 'text-orange-600' },
  ];

  const essentialServices = [
    { name: 'Cocel (Energia)', number: '0800-726-2121', icon: Zap, description: 'Falta de Luz / Serviços', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    { name: 'Sanepar (Água)', number: '0800-200-0115', icon: Droplets, description: 'Falta de Água / Esgoto', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  ];

  const healthServices = [
    { name: 'UPA 24h', number: '(41) 3291-5200', icon: Siren, description: 'Urgência e Emergência' },
    { name: 'Hosp. do Rocio', number: '(41) 3136-2000', icon: Building2, description: 'Hospital Geral' },
    { name: 'Hosp. São Lucas', number: '(41) 3292-2323', icon: Building2, description: 'Partic. e Convênios' },
    { name: 'Hosp. Infantil', number: '(41) 3391-8100', icon: Users, description: 'Waldemar Monastier' },
    { name: 'UBS Águas Claras', number: '(41) 3291-5364', icon: HeartPulse, description: 'Posto de Saúde' },
    { name: 'UBS Três Rios', number: '(41) 3291-5374', icon: HeartPulse, description: 'Posto de Saúde' },
    { name: 'Sec. de Saúde', number: '(41) 3291-5103', icon: Briefcase, description: 'Secretaria Municipal' },
  ];

  const socialServices = [
    { name: 'Conselho Tutelar', number: '(41) 3291-5016', icon: Users, description: 'Proteção à criança' },
    { name: 'CRAS Meliane', number: '(41) 3292-8056', icon: Users, description: 'Atendimento Social' },
    { name: 'Assistência Social', number: '(41) 3291-5000', icon: Users, description: 'Secretaria Municipal' },
    { name: 'Narcodenúncia', number: '181', icon: Megaphone, description: 'Anônimo e Sigiloso' },
  ];

  const cityServices = [
    { name: 'Prefeitura', number: '(41) 3291-5000', icon: Building2, description: 'Atendimento Geral' },
    { name: 'Ag. do Trabalhador', number: '(41) 3291-5125', icon: Briefcase, description: 'Vagas de Emprego' },
    { name: 'Fórum', number: '(41) 3291-6600', icon: Gavel, description: 'Justiça Estadual' },
    { name: 'Cartório Eleitoral', number: '(41) 3292-1413', icon: FileCheck, description: 'Zona 009 / Título' },
    { name: 'Detran / Ciretran', number: '(41) 3292-2266', icon: Car, description: 'CNH e Veículos' },
    { name: 'Sec. de Obras', number: '(41) 3291-5136', icon: HardHat, description: 'Viação e Obras' },
    { name: 'Meio Ambiente', number: '(41) 3291-5139', icon: TreePine, description: 'Denúncias e Coleta' },
    { name: 'Sala do Empreendedor', number: '(41) 3291-5000', icon: Briefcase, description: 'Apoio ao MEI' },
  ];

  // Configuração das linhas específicas solicitadas
  const highlightedBusLines = [
    { 
      name: "Águas Claras", 
      url: "https://transpiedade.com.br/linhas/5/aguas-claras/" 
    },
    {
      name: "Francisco Gorski",
      url: "https://transpiedade.com.br/linhas/16/francisco-gorski/#dias-uteis"
    },
    { 
      name: "Moradias Bom Jesus", 
      url: "https://transpiedade.com.br/linhas/4/moradias-bom-jesus/#dias-uteis" 
    },
    { 
      name: "Três Rios", 
      url: "https://transpiedade.com.br/linhas/9/campina/" 
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Building2 className="text-primary" />
          Utilidade Pública - Campo Largo
        </h2>
        <p className="text-sm text-gray-500">Toque nos cartões para ligar diretamente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Emergência */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100">
          <h3 className="text-sm font-bold text-red-600 uppercase mb-4 border-b border-red-100 pb-2 flex items-center gap-2">
            <Siren size={16} /> Emergência
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {emergencyServices.map((service, idx) => (
              <a 
                key={idx}
                href={`tel:${service.number.replace(/[^0-9]/g, '')}`}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 group cursor-pointer"
                title="Toque para ligar"
              >
                <service.icon size={24} className={`mb-2 ${service.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-bold text-gray-700 text-center">{service.name}</span>
                <span className="text-sm font-black text-gray-900">{service.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Água e Luz (Cocel/Sanepar) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
           <h3 className="text-sm font-bold text-blue-800 uppercase mb-4 border-b border-blue-100 pb-2 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500 fill-current" /> Água e Luz
          </h3>
          <div className="space-y-3">
             {essentialServices.map((service, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${service.border} ${service.bg} bg-opacity-30`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-white shadow-sm ${service.color}`}>
                         <service.icon size={20} fill="currentColor" className="opacity-80" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-800">{service.name}</p>
                         <p className="text-[10px] text-gray-600">{service.description}</p>
                      </div>
                   </div>
                   <a 
                     href={`tel:${service.number.replace(/[^0-9]/g, '')}`}
                     className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1"
                   >
                     <Phone size={12} /> Ligar
                   </a>
                </div>
             ))}
          </div>
        </div>

        {/* Saúde e Hospitais */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-teal-100">
          <h3 className="text-sm font-bold text-teal-600 uppercase mb-4 border-b border-teal-100 pb-2 flex items-center gap-2">
            <HeartPulse size={16} /> Saúde e Hospitais
          </h3>
          <div className="space-y-3">
            {healthServices.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="bg-teal-100 p-2 rounded-full text-teal-600">
                       <service.icon size={16} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">{service.name}</p>
                       <p className="text-[10px] text-gray-500">{service.description}</p>
                    </div>
                 </div>
                 <a 
                   href={`tel:${service.number.replace(/[^0-9]/g, '')}`}
                   className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-teal-700 hover:bg-teal-600 hover:text-white transition-colors shadow-sm"
                 >
                   Ligar
                 </a>
              </div>
            ))}
          </div>
        </div>

        {/* Social e Apoio */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-sm font-bold text-blue-600 uppercase mb-4 border-b border-blue-100 pb-2 flex items-center gap-2">
            <Users size={16} /> Social e Apoio
          </h3>
          <div className="space-y-3">
            {socialServices.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                       <service.icon size={16} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">{service.name}</p>
                       <p className="text-[10px] text-gray-500">{service.description}</p>
                    </div>
                 </div>
                 <a 
                   href={`tel:${service.number.replace(/[^0-9]/g, '')}`}
                   className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors shadow-sm"
                 >
                   Ligar
                 </a>
              </div>
            ))}
          </div>
        </div>

        {/* Prefeitura e Órgãos */}
        <div className="space-y-6">
           {/* Prefeitura e Órgãos Públicos */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100">
              <h3 className="text-sm font-bold text-green-700 uppercase mb-4 border-b border-green-100 pb-2 flex items-center gap-2">
                <Building2 size={16} /> Prefeitura & Órgãos
              </h3>
              <div className="space-y-3">
                {cityServices.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-700">
                          <service.icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{service.name}</p>
                          <p className="text-[10px] text-gray-500">{service.description}</p>
                        </div>
                    </div>
                    <a 
                      href={`tel:${service.number.replace(/[^0-9]/g, '')}`}
                      className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-green-700 hover:bg-green-600 hover:text-white transition-colors shadow-sm"
                    >
                      Ligar
                    </a>
                  </div>
                ))}
              </div>
           </div>

           {/* Transporte */}
           <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200">
              <h3 className="text-sm font-bold text-yellow-800 uppercase mb-3 flex items-center gap-2">
                <Bus size={16} /> Linhas da Região
              </h3>
              <p className="text-xs text-yellow-700 mb-3 leading-tight">
                Toque no bairro para consultar o horário:
              </p>
              
              {/* Lista Vertical de Linhas Específicas */}
              <div className="flex flex-col gap-2 mb-4">
                 {highlightedBusLines.map((line) => (
                    <a 
                      key={line.name}
                      href={line.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100 hover:border-yellow-400 hover:shadow-md transition-all group cursor-pointer"
                      title={`Ver horários para ${line.name}`}
                    >
                       <span className="text-sm font-bold text-gray-700 group-hover:text-yellow-800">
                         {line.name}
                       </span>
                       <div className="w-2 h-2 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform flex-shrink-0"></div>
                    </a>
                 ))}
              </div>

              <a 
                href="https://www.transpiedade.com.br/horarios/urbanos-campo-largo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-sm"
              >
                 <ExternalLink size={16} />
                 Consultar outras linhas
              </a>
           </div>
        </div>

      </div>
      
      <div className="mt-8 text-center">
         <p className="text-[10px] text-gray-400">
           * Os números e informações acima são de utilidade pública e podem sofrer alterações sem aviso prévio.
           Em caso de emergência médica grave, ligue sempre 192 ou 193.
         </p>
      </div>
    </div>
  );
};

export default PublicUtilities;

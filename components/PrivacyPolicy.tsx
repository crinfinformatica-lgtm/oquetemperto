
import React from 'react';
import { X, Shield, Lock, Eye, AlertTriangle, Mail } from 'lucide-react';
import { AppConfig } from '../types';

interface PrivacyPolicyProps {
  onClose: () => void;
  appName: string;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose, appName }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <Shield className="text-green-600" size={20} />
            Política de Privacidade e Termos
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed">
          <p className="font-bold text-gray-900 dark:text-white">Última atualização: {new Date().toLocaleDateString()}</p>
          
          <p>
            O aplicativo <strong>{appName}</strong> valoriza sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações.
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4 flex items-center gap-2"><Eye size={16}/> 1. Coleta de Dados</h3>
          <p>
            Coletamos informações que você fornece diretamente ao criar uma conta, como nome, e-mail, número de telefone (WhatsApp) e, para prestadores de serviço, dados de localização e categoria profissional.
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4 flex items-center gap-2"><Lock size={16}/> 2. Uso das Informações</h3>
          <p>
            Utilizamos seus dados para:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Conectar clientes a prestadores de serviço e comércios locais.</li>
              <li>Permitir funcionalidades de contato via WhatsApp.</li>
              <li>Melhorar a precisão da busca por geolocalização (quando autorizado).</li>
            </ul>
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">3. Compartilhamento</h3>
          <p>
            Seus dados públicos (nome do negócio, telefone, avaliações) são visíveis para outros usuários do aplicativo para facilitar a contratação de serviços. Não vendemos seus dados para terceiros.
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">4. Exclusão de Dados</h3>
          <p>
            Você tem o direito de solicitar a exclusão completa de sua conta e dados a qualquer momento através da opção "Excluir Conta" dentro do seu Perfil de Usuário ou entrando em contato com o suporte.
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">5. Termos de Uso e Responsabilidade</h3>
          <p>
            O aplicativo é uma plataforma <strong>gratuita de busca</strong> e catálogo digital. Atuamos apenas como intermediários de informação e guia local.
          </p>
          <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
             <p className="font-bold text-gray-800 dark:text-white mb-1">Isenção de Responsabilidade:</p>
             <p>
               Nós <strong>não nos responsabilizamos</strong> por:
             </p>
             <ul className="list-disc pl-5 mt-1 space-y-1">
               <li>Veracidade dos dados postados pelos usuários (prestadores ou clientes).</li>
               <li>Qualidade, garantia ou execução dos serviços contratados.</li>
               <li>Negociações financeiras, pagamentos ou conflitos entre cliente e prestador.</li>
               <li>Conteúdo de anúncios ou links externos.</li>
             </ul>
             <p className="mt-2 text-xs">
                O usuário é o único responsável pelo conteúdo que publica e pelas contratações que decide realizar através das informações obtidas na plataforma.
             </p>
          </div>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4 flex items-center gap-2">
             <AlertTriangle size={16} className="text-red-500" /> 6. Conduta e Banimento (Tolerância Zero)
          </h3>
          <p>
             Mantemos uma política de <strong>tolerância zero</strong> contra qualquer forma de discriminação, incluindo, mas não se limitando a: racismo, homofobia, transfobia, machismo, xenofobia e intolerância religiosa.
          </p>
          <p className="mt-2">
             <strong>Consequências:</strong> Usuários que violarem esta regra terão suas contas <strong>banidas permanentemente</strong> e imediatamente, sem direito a recurso. O aplicativo reserva-se o direito de encaminhar dados às autoridades competentes em casos de crimes previstos em lei.
          </p>

          <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4 flex items-center gap-2">
             <Mail size={16} className="text-primary" /> 7. Suporte e Contato
          </h3>
          <p>
            Para qualquer dúvida, sugestão ou suporte técnico, você pode entrar em contato com nossa equipe através do e-mail: <a href="mailto:crinf.app@gmail.com" className="text-primary font-bold hover:underline">crinf.app@gmail.com</a>.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Entendi e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

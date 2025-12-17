import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Shield, Chrome, AlertTriangle, User, Mail, CheckCircle, Info, Settings, Save, X, ExternalLink, Copy, ShieldCheck, Globe } from 'lucide-react';
import { signInWithGoogle, auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import AppLogo from './AppLogo';

interface LoginFormProps {
  onBack: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegisterClick: () => void;
  onAdminClick: () => void;
  onGuestClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onBack, onLogin, onRegisterClick, onAdminClick, onGuestClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'generic' | 'domain' | 'config' | 'not-allowed' | 'redirect'>('generic');
  const [showConfig, setShowConfig] = useState(false);

  const [configKeys, setConfigKeys] = useState<Record<string, string>>({
    apiKey: localStorage.getItem('FIREBASE_API_KEY') || '',
    authDomain: localStorage.getItem('FIREBASE_AUTH_DOMAIN') || '',
    databaseURL: localStorage.getItem('FIREBASE_DATABASE_URL') || '',
    projectId: localStorage.getItem('FIREBASE_PROJECT_ID') || '',
    storageBucket: localStorage.getItem('FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: localStorage.getItem('FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: localStorage.getItem('FIREBASE_APP_ID') || ''
  });

  const handleGoogleLogin = async () => {
    setError('');
    setErrorType('generic');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Login Detailed Error:", err);
      
      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      if (err === "Firebase keys missing") {
        setError('Configuração do Firebase não encontrada.');
        setErrorType('config');
      } else if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
        setError(`Domínio não autorizado.`);
        setErrorType('domain');
      } else if (errorMessage.includes('redirect_uri_mismatch') || errorMessage.includes('400')) {
        setError('Erro de Redirecionamento (Google OAuth)');
        setErrorType('redirect');
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('Login Google desativado no Firebase.');
        setErrorType('not-allowed');
      } else {
        setError(errorMessage || 'Erro ao entrar com Google.');
        setErrorType('generic');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado com sucesso!");
  };

  const handleSaveConfig = () => {
    const keyMapping: Record<string, string> = {
      apiKey: 'FIREBASE_API_KEY',
      authDomain: 'FIREBASE_AUTH_DOMAIN',
      databaseURL: 'FIREBASE_DATABASE_URL',
      projectId: 'FIREBASE_PROJECT_ID',
      storageBucket: 'FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
      appId: 'FIREBASE_APP_ID'
    };

    Object.entries(configKeys).forEach(([key, val]) => {
      const storageKey = keyMapping[key];
      if (storageKey) {
        localStorage.setItem(storageKey, (String(val || '')).trim());
      }
    });
    alert("Configurações salvas! Reiniciando o aplicativo...");
    window.location.reload();
  };

  if (showConfig) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 my-auto border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Settings className="text-primary" /> Configurar Firebase
            </h2>
            <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl mb-6 flex gap-3">
            <Info size={20} className="text-blue-600 shrink-0 mt-1" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-bold mb-1">Onde encontrar estas chaves?</p>
              <p>1. No Console do Firebase, vá em <strong>Configurações do Projeto</strong>.</p>
              <p>2. No final da página "Geral", procure por <strong>SDK Setup and Configuration</strong>.</p>
              <p>3. Escolha "Config" e copie os valores para os campos abaixo.</p>
              <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline mt-2">Abrir Console Firebase <ExternalLink size={12}/></a>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Web API Key (apiKey)</label>
              <input type="text" value={configKeys.apiKey} onChange={e => setConfigKeys({...configKeys, apiKey: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary outline-none" placeholder="AIzaSy..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Auth Domain</label>
                <input type="text" value={configKeys.authDomain} onChange={e => setConfigKeys({...configKeys, authDomain: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary outline-none" placeholder="app-id.firebaseapp.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project ID</label>
                <input type="text" value={configKeys.projectId} onChange={e => setConfigKeys({...configKeys, projectId: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary outline-none" placeholder="meu-app-123" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={handleSaveConfig} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Salvar e Reiniciar
            </button>
            <button onClick={() => setShowConfig(false)} className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-200">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="flex items-center text-gray-500 hover:text-primary font-bold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </button>
          <button onClick={() => setShowConfig(true)} className="p-3 bg-white dark:bg-gray-800 text-gray-400 hover:text-primary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Configurar Firebase">
            <Settings size={20} />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-50 dark:border-gray-800 p-4">
              <AppLogo className="w-full h-full" />
            </div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white">Entrar</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Acesse sua conta para continuar</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-black py-4 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Chrome className="text-blue-600" size={24} />}
              Entrar com Google
            </button>

            <button onClick={onGuestClick} className="w-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3">
              <User size={20} /> Entrar como Convidado
            </button>
          </div>

          {error && (
            <div className={`mt-8 p-4 rounded-2xl border flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 ${errorType === 'domain' || errorType === 'not-allowed' || errorType === 'redirect' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'}`}>
              <div className="flex gap-3">
                <AlertTriangle size={20} className="shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold leading-tight">{error}</span>
                  {errorType === 'domain' && (
                    <p className="text-[10px] leading-snug opacity-80 mt-1">
                      Autorize o endereço abaixo no Firebase Console em: <strong>Authentication &gt; Settings &gt; Authorized Domains</strong>.
                    </p>
                  )}
                  {errorType === 'redirect' && (
                    <p className="text-[10px] leading-snug opacity-80 mt-1">
                      O Google barrou o login. Você precisa adicionar a URI de retorno no <strong>Google Cloud Console</strong>.
                    </p>
                  )}
                  {errorType === 'not-allowed' && (
                    <p className="text-[10px] leading-snug opacity-80 mt-1">
                      Ative o provedor <strong>Google</strong> em <strong>Authentication &gt; Sign-in method</strong>.
                    </p>
                  )}
                </div>
              </div>

              {errorType === 'domain' && (
                <div className="space-y-3">
                  <div className="bg-white/70 border border-orange-200 p-3 rounded-lg flex items-center justify-between shadow-inner">
                    <code className="text-xs font-mono font-bold text-orange-900">{window.location.hostname}</code>
                    <button onClick={() => copyToClipboard(window.location.hostname)} className="p-2 bg-orange-100 hover:bg-orange-200 rounded-full transition-colors text-orange-700" title="Copiar Domínio">
                      <Copy size={16} />
                    </button>
                  </div>
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-black text-sm hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                  >
                    Configurar no Firebase <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {errorType === 'redirect' && (
                <div className="space-y-3">
                  <div className="bg-white/70 border border-orange-200 p-3 rounded-lg flex flex-col gap-2 shadow-inner">
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Adicione esta URI no Google Cloud:</span>
                    <div className="flex items-center justify-between gap-2">
                       <code className="text-[10px] font-mono font-bold text-orange-900 break-all leading-tight">
                         https://oquetempertocl.firebaseapp.com/__/auth/handler
                       </code>
                       <button onClick={() => copyToClipboard('https://oquetempertocl.firebaseapp.com/__/auth/handler')} className="p-2 bg-orange-100 hover:bg-orange-200 rounded-full text-orange-700 shrink-0">
                         <Copy size={14} />
                       </button>
                    </div>
                  </div>
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-black text-sm hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                  >
                    Abrir Google Cloud Console <ExternalLink size={14} />
                  </a>
                </div>
              )}

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2 text-[10px] font-bold text-orange-600 hover:underline uppercase tracking-widest text-center"
              >
                Já corrigi, tentar novamente
              </button>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não possui uma conta?{' '}
              <button onClick={onRegisterClick} className="text-primary font-black hover:underline">Cadastre-se</button>
            </p>
            <button onClick={onAdminClick} className="mt-8 text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-500 uppercase tracking-widest font-black transition-colors">Acesso Administrativo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
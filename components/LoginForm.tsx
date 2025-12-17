
import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, Shield, Chrome, AlertTriangle, User, Mail, CheckCircle, Info, Settings, Save, X } from 'lucide-react';
import { signInWithGoogle, auth } from '../services/firebase'; // Import auth
import { sendPasswordResetEmail } from 'firebase/auth'; // Import reset function
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New State for Reset Password Mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // New State for Config Keys Mode
  const [showConfig, setShowConfig] = useState(false);
  const [configKeys, setConfigKeys] = useState({
     apiKey: localStorage.getItem('FIREBASE_API_KEY') || '',
     authDomain: localStorage.getItem('FIREBASE_AUTH_DOMAIN') || '',
     databaseURL: localStorage.getItem('FIREBASE_DATABASE_URL') || '',
     projectId: localStorage.getItem('FIREBASE_PROJECT_ID') || '',
     storageBucket: localStorage.getItem('FIREBASE_STORAGE_BUCKET') || '',
     messagingSenderId: localStorage.getItem('FIREBASE_MESSAGING_SENDER_ID') || '',
     appId: localStorage.getItem('FIREBASE_APP_ID') || '',
     geminiKey: localStorage.getItem('API_KEY') || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // App.tsx handles the auth state change redirect
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err === "Firebase keys missing") {
        setError('Chaves do Firebase não encontradas.');
        setShowConfig(true); // Open config automatically
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Domínio "${currentDomain}" não autorizado. Adicione-o no Firebase Console > Authentication > Settings > Domínios Autorizados.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('A janela de login foi fechada. Tente novamente.');
      } else {
        setError(`Erro ao entrar com Google (${err.code || 'Desconhecido'}). Tente E-mail/Senha.`);
      }
      setIsLoading(false);
    }
  };

  // --- PASSWORD RESET LOGIC ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Firebase standard reset
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      console.error("Reset Error:", err);
      // Modern Firebase security often suppresses 'user-not-found' to prevent email enumeration,
      // but if it does return, we handle it.
      if (err.code === 'auth/user-not-found') {
        setError("Este e-mail não está cadastrado.");
      } else if (err.code === 'auth/invalid-email') {
        setError("E-mail inválido.");
      } else {
        // Even if it fails, sometimes it's safer to show success to prevent hacking, 
        // but for UX we will show the error if it's a technical one.
        setError("Erro ao enviar. Verifique o e-mail digitado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = () => {
     localStorage.setItem('FIREBASE_API_KEY', configKeys.apiKey);
     localStorage.setItem('FIREBASE_AUTH_DOMAIN', configKeys.authDomain);
     localStorage.setItem('FIREBASE_DATABASE_URL', configKeys.databaseURL);
     localStorage.setItem('FIREBASE_PROJECT_ID', configKeys.projectId);
     localStorage.setItem('FIREBASE_STORAGE_BUCKET', configKeys.storageBucket);
     localStorage.setItem('FIREBASE_MESSAGING_SENDER_ID', configKeys.messagingSenderId);
     localStorage.setItem('FIREBASE_APP_ID', configKeys.appId);
     localStorage.setItem('API_KEY', configKeys.geminiKey);
     
     alert("Chaves salvas! A página será recarregada.");
     window.location.reload();
  };

  if (showConfig) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="text-primary" /> Configuração Manual
                 </h2>
                 <button onClick={() => setShowConfig(false)} className="text-gray-500 hover:text-gray-800">
                    <X size={24} />
                 </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-sm text-yellow-800">
                 <p className="font-bold flex items-center gap-2"><AlertTriangle size={16}/> Atenção</p>
                 <p className="mt-1">
                    Parece que as variáveis de ambiente não foram carregadas corretamente ou você está em um ambiente de pré-visualização sem arquivo .env. 
                 </p>
                 <p className="mt-2">
                    Cole suas chaves do Firebase abaixo para usar o app. Elas serão salvas no seu navegador (LocalStorage).
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Key *</label>
                    <input type="text" value={configKeys.apiKey} onChange={e => setConfigKeys({...configKeys, apiKey: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="AIzaSy..." />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Auth Domain *</label>
                    <input type="text" value={configKeys.authDomain} onChange={e => setConfigKeys({...configKeys, authDomain: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="project.firebaseapp.com" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Database URL *</label>
                    <input type="text" value={configKeys.databaseURL} onChange={e => setConfigKeys({...configKeys, databaseURL: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="https://project.firebaseio.com" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project ID *</label>
                    <input type="text" value={configKeys.projectId} onChange={e => setConfigKeys({...configKeys, projectId: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Storage Bucket</label>
                    <input type="text" value={configKeys.storageBucket} onChange={e => setConfigKeys({...configKeys, storageBucket: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Messaging Sender ID</label>
                    <input type="text" value={configKeys.messagingSenderId} onChange={e => setConfigKeys({...configKeys, messagingSenderId: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">App ID</label>
                    <input type="text" value={configKeys.appId} onChange={e => setConfigKeys({...configKeys, appId: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" />
                 </div>
                 <div className="md:col-span-2 border-t pt-4 mt-2">
                    <label className="block text-xs font-bold text-purple-600 uppercase mb-1">Gemini API Key (Opcional - IA)</label>
                    <input type="text" value={configKeys.geminiKey} onChange={e => setConfigKeys({...configKeys, geminiKey: e.target.value})} className="w-full p-2 border border-purple-200 bg-purple-50 rounded font-mono text-sm" placeholder="AIzaSy..." />
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button onClick={handleSaveConfig} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                    <Save size={18} /> Salvar e Recarregar
                 </button>
                 <button onClick={() => setShowConfig(false)} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg">
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // --- RENDER: RESET PASSWORD MODE ---
  if (isResetMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <button 
            onClick={() => { setIsResetMode(false); setResetSent(false); setError(''); }}
            className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-medium transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar para Login
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Recuperar Senha</h2>
              <p className="text-gray-500 text-sm mt-1">
                {resetSent 
                  ? "Solicitação enviada!" 
                  : "Digite seu e-mail para receber o link de redefinição."}
              </p>
            </div>

            {resetSent ? (
              <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center gap-2">
                  <CheckCircle className="text-green-600" size={32} />
                  <p className="text-green-800 font-bold text-sm">
                    Link enviado para:<br/>{email}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg text-left text-xs text-blue-800 space-y-2">
                   <p className="font-bold flex items-center gap-1"><Info size={14}/> Importante:</p>
                   <ul className="list-disc pl-4 space-y-1">
                      <li>Verifique sua caixa de <strong>Spam / Lixo Eletrônico</strong>.</li>
                      <li>Se você criou a conta usando o botão <strong>"Entrar com Google"</strong>, você não receberá o e-mail (pois não possui senha no sistema).</li>
                      <li>O e-mail pode levar alguns minutos para chegar.</li>
                   </ul>
                </div>

                <button 
                  onClick={() => setIsResetMode(false)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-md transition-all"
                >
                  Voltar para Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: NORMAL LOGIN MODE ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </button>
          {/* Debug Config Button */}
          <button onClick={() => setShowConfig(true)} className="p-2 text-gray-300 hover:text-gray-600" title="Configurar API">
             <Settings size={18} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 p-2">
              <AppLogo className="w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bem-vindo de volta!</h2>
            <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar.</p>
          </div>

          <div className="mb-6 space-y-3">
             <button 
               type="button"
               onClick={handleGoogleLogin}
               disabled={isLoading}
               className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Chrome className="text-blue-600" size={20} />}
               Entrar com Google
             </button>

             {/* Guest Button */}
             <button 
               type="button"
               onClick={onGuestClick}
               className="w-full bg-gray-100 border border-transparent text-gray-600 font-bold py-3 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
             >
               <User className="text-gray-500" size={20} />
               Entrar como Convidado
             </button>

             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Ou via E-mail</span>
                <div className="flex-grow border-t border-gray-200"></div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <button 
                  type="button" 
                  onClick={() => setIsResetMode(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
                {error.includes("Chaves do Firebase") && (
                   <button type="button" onClick={() => setShowConfig(true)} className="ml-auto underline text-xs">Configurar</button>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-6">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{' '}
              <button onClick={onRegisterClick} className="text-primary font-bold hover:underline">
                Cadastre-se grátis
              </button>
            </p>

            {/* Discreet Admin Link */}
            <button 
              onClick={onAdminClick}
              className="inline-flex items-center gap-1 text-[10px] text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest font-semibold"
            >
              <Shield size={10} /> Área Restrita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

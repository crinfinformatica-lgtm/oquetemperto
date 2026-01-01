
import React, { useState } from 'react';
import { ArrowLeft, User, Briefcase, Store, CheckCircle, Camera, MapPin, Loader2, AlertCircle, Eye, EyeOff, Globe, Facebook, Instagram, Image as ImageIcon, Shield, Chrome, X, FileText, AlignLeft } from 'lucide-react';
import { User as UserType } from '../types';
import { ALLOWED_NEIGHBORHOODS, CATEGORIES } from '../constants';
import AppLogo from './AppLogo';
import PrivacyPolicy from './PrivacyPolicy';
import emailjs from '@emailjs/browser';

// Firebase Imports
import { auth, db, signInWithGoogle } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

type RegisterType = 'client' | 'pro' | 'business';

interface RegisterFormProps {
  type: RegisterType;
  appName: string;
  onBack: () => void;
  onRegisterSuccess?: (newUser: UserType) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ type, appName, onBack, onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    cpf: '', 
    rg: '', 
    cnpj: '', 
    
    // Address
    cep: '00000-000',
    address: '',
    number: '',
    neighborhood: '',

    // Business/Pro Specific
    category: '',
    customCategory: '',
    businessDescription: '',
    servedNeighborhoods: [] as string[],

    // Pro Privacy
    privacySettings: {
      showPhone: true,
      showAddress: false
    },

    socials: {
      instagram: '',
      facebook: '',
      website: '',
      googleMyBusiness: ''
    },

    avatarUrl: '',
    coverUrl: ''
  });

  const [documentInput, setDocumentInput] = useState('');

  const getConfig = () => {
    switch(type) {
      case 'client':
        return {
          title: 'Criar conta Cliente',
          subtitle: 'Cadastre-se para solicitar orçamentos.',
          icon: <User className="w-12 h-12 text-primary" />,
          color: 'bg-primary'
        };
      case 'pro':
        return {
          title: 'Sou Prestador',
          subtitle: 'Divulgue seu trabalho e receba pedidos.',
          icon: <Briefcase className="w-12 h-12 text-accent" />,
          color: 'bg-accent'
        };
      case 'business':
        return {
          title: 'Cadastrar Comércio',
          subtitle: 'Sua loja no mapa de Águas Claras.',
          icon: <Store className="w-12 h-12 text-tertiary" />,
          color: 'bg-tertiary'
        };
    }
  };

  const config = getConfig();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'coverUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma foto menor que 4MB.");
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
      } catch (err) {
        console.error("Image error", err);
        alert("Erro ao processar imagem.");
      }
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const toggleServedNeighborhood = (bairro: string) => {
    setFormData(prev => {
      const current = prev.servedNeighborhoods;
      const isSelected = current.includes(bairro);
      const newSelection = isSelected 
        ? current.filter(b => b !== bairro) 
        : [...current, bairro];
      
      // Se for o primeiro bairro selecionado, define também como o bairro principal do perfil
      return { 
        ...prev, 
        servedNeighborhoods: newSelection,
        neighborhood: newSelection.length > 0 ? newSelection[0] : ''
      };
    });
  };

  const handleGoogleRegister = async () => {
    if (!acceptedTerms) {
      setError("Você precisa aceitar os termos de uso antes de continuar.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        const newUser: UserType = {
          id: user.uid,
          name: user.displayName || 'Usuário Google',
          email: user.email || '',
          role: type,
          status: 'active',
          failedLoginAttempts: 0,
          avatarUrl: user.photoURL || '',
          favorites: [],
          phone: '', 
          zipCode: '00000-000',
          address: '',
          neighborhood: ''
        };
        await set(userRef, newUser);
        notifyAdmin(newUser);
        if (onRegisterSuccess) onRegisterSuccess(newUser);
      }
    } catch (err: any) {
      setError("Erro ao conectar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const notifyAdmin = async (newUser: any) => {
     try {
        const notifRef = ref(db, `admin_notifications/${Date.now()}`);
        await set(notifRef, {
           type: 'NEW_USER',
           message: `Novo cadastro: ${newUser.name} (${newUser.role})`,
           details: newUser,
           read: false,
           timestamp: new Date().toISOString()
        });
     } catch (err) { console.error(err); }

     const SERVICE_ID = "service_dqxdi2a"; 
     const TEMPLATE_ID = "template_8cthxoh";
     const PUBLIC_KEY = "NJZigwymrvB_gdLNP";
     const templateParams = {
        to_email: 'crinf.app@gmail.com',
        from_name: 'App O Que Tem Perto',
        to_name: 'Admin Crinf',
        message: `NOVO USUÁRIO: ${newUser.name} | Tipo: ${newUser.role.toUpperCase()} | Bairros: ${newUser.servedNeighborhoods?.join(', ') || 'N/A'}`,
        reply_to: newUser.email
     };
     try { await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError("Você precisa aceitar os termos de uso.");
      return;
    }

    if (type !== 'client' && formData.servedNeighborhoods.length === 0) {
      setError("Selecione pelo menos um bairro de atendimento da lista.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    let finalCategory = formData.category;
    if (finalCategory === 'outros' && formData.customCategory) {
      finalCategory = formData.customCategory;
    } else if (type === 'pro' && formData.customCategory) {
       finalCategory = `${finalCategory} - ${formData.customCategory}`;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.name });

      const newUser: any = {
        id: user.uid,
        name: formData.name,
        email: formData.email,
        role: type,
        status: 'active',
        failedLoginAttempts: 0,
        phone: formData.whatsapp,
        cpf: formData.cpf,
        rg: formData.rg,
        cnpj: formData.cnpj,
        zipCode: '00000-000',
        address: formData.address + (formData.number ? `, ${formData.number}` : ''),
        neighborhood: formData.neighborhood,
        avatarUrl: formData.avatarUrl,
        coverUrl: formData.coverUrl,
        category: finalCategory,
        businessDescription: formData.businessDescription,
        favorites: [],
        socials: formData.socials,
        servedNeighborhoods: formData.servedNeighborhoods,
        privacySettings: formData.privacySettings
      };

      await set(ref(db, 'users/' + user.uid), newUser);
      await notifyAdmin(newUser);

      setTimeout(() => {
        setLoading(false);
        if (onRegisterSuccess) onRegisterSuccess(newUser as UserType);
      }, 500);

    } catch (error: any) {
      setLoading(false);
      setError(error.message);
    }
  };

  // Verifica se o cadastro pode ser finalizado
  const canSubmit = acceptedTerms && (type === 'client' ? (formData.name && formData.email && formData.neighborhood) : (formData.name && formData.email && formData.servedNeighborhoods.length > 0));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`${config.color} p-6 text-center text-white relative`}>
            {type === 'business' && formData.coverUrl && (
              <div className="absolute inset-0 z-0">
                <img src={formData.coverUrl} className="w-full h-full object-cover opacity-30" alt="Capa" />
              </div>
            )}
            <div className="relative z-10">
              <div className="relative mx-auto w-24 h-24 mb-4 group">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm border-2 border-white/30 p-2">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="bg-white rounded-full p-2 w-full h-full flex items-center justify-center">
                       <AppLogo className="w-full h-full" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white text-gray-700 p-2 rounded-full cursor-pointer hover:bg-gray-100 shadow-md">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl')} />
                </label>
              </div>
              <h2 className="text-2xl font-bold">{config.title}</h2>
              <p className="opacity-90 mt-1 text-sm">{config.subtitle}</p>
            </div>
          </div>

          <div className="p-8">
            {type === 'client' && (
              <div className="mb-6">
                 <button type="button" onClick={handleGoogleRegister} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                   <Chrome className="text-blue-600" size={20} /> Entrar com Google
                 </button>
                 <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Ou use e-mail</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                 </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'business' ? 'Nome da Loja / Negócio *' : 'Nome Completo *'}
                  </label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>

                {(type === 'business' || type === 'pro') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white" required>
                      <option value="">Selecione...</option>
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      <option value="outros">Outro...</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                  <input type="tel" required placeholder="(41) 9..." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>

                {/* Seção de Bairros OBRIGATÓRIA para Pro/Business */}
                {(type === 'business' || type === 'pro') ? (
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <label className="block text-sm font-black text-blue-800 mb-3 flex items-center gap-2">
                       <MapPin size={18} /> Quais bairros você atende? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALLOWED_NEIGHBORHOODS.map(bairro => (
                           <label key={bairro} className={`flex items-center space-x-2 text-sm cursor-pointer p-3 rounded-xl transition-all border ${formData.servedNeighborhoods.includes(bairro) ? 'bg-white border-primary shadow-md' : 'bg-white/50 border-transparent hover:bg-white'}`}>
                              <input
                                type="checkbox"
                                checked={formData.servedNeighborhoods.includes(bairro)}
                                onChange={() => toggleServedNeighborhood(bairro)}
                                className="rounded text-primary focus:ring-primary w-5 h-5"
                              />
                              <span className={formData.servedNeighborhoods.includes(bairro) ? 'font-bold text-primary' : 'text-gray-600'}>{bairro}</span>
                           </label>
                        ))}
                    </div>
                    <p className="text-[10px] text-blue-600 font-bold mt-3 uppercase tracking-wider">
                       {formData.servedNeighborhoods.length === 0 ? '⚠️ Selecione pelo menos um bairro para habilitar o cadastro' : `✅ ${formData.servedNeighborhoods.length} bairros selecionados`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seu Bairro *</label>
                    <select value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white" required>
                       <option value="">Selecione...</option>
                       {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha *</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} required minLength={6} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mt-6 flex items-start gap-3">
                <input type="checkbox" id="acceptTerms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary border-gray-300 cursor-pointer" required />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600 cursor-pointer">
                  Aceito os <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary font-bold hover:underline">Termos de Uso</button> de Águas Claras e Região.
                </label>
              </div>

              {error && (
                 <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mt-4 flex items-start gap-2 border border-red-100">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="font-bold">{error}</span>
                 </div>
              )}

              <button 
                type="submit"
                disabled={loading || !canSubmit}
                className={`w-full text-white font-black py-4 rounded-2xl mt-4 shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm
                  ${config.color} hover:brightness-110 active:scale-95
                  ${(!canSubmit || loading) ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {showTermsModal && <PrivacyPolicy appName={appName} onClose={() => setShowTermsModal(false)} />}
    </div>
  );
};

export default RegisterForm;

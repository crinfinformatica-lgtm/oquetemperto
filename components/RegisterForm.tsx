
import React, { useState } from 'react';
import { ArrowLeft, User, Briefcase, Store, CheckCircle, Camera, MapPin, Loader2, AlertCircle, Eye, EyeOff, Globe, Facebook, Instagram, Image as ImageIcon, Shield, Chrome, X, FileText, AlignLeft, HelpCircle, Plus, Sparkles, Search, SearchCode, Hash, Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { User as UserType } from '../types';
import { ALLOWED_NEIGHBORHOODS, CATEGORIES } from '../constants';
import AppLogo from './AppLogo';
import PrivacyPolicy from './PrivacyPolicy';
import { fetchAddressByCep } from '../services/cepService';

// Firebase Imports
import { auth, db, signInWithGoogle } from '../services/firebase';
import { onAuthStateChanged, signOut, updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';
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
  const [searchingCep, setSearchingCep] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [customNeighborhood, setCustomNeighborhood] = useState('');

  // Filter out "Outros Serviços" as requested
  const filteredCategories = CATEGORIES.filter(cat => cat.id !== 'outros');

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
    cep: '',
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

  const handleGoogleRegister = async () => {
    if (type !== 'client') return;
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);
      
      if (snap.exists()) {
        const existingData = snap.val();
        if (onRegisterSuccess) onRegisterSuccess(existingData as UserType);
        return;
      }

      const newUser: any = {
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        role: 'client',
        status: 'active',
        failedLoginAttempts: 0,
        avatarUrl: user.photoURL || '',
        favorites: [],
        createdAt: new Date().toISOString()
      };

      await set(userRef, newUser);
      if (onRegisterSuccess) onRegisterSuccess(newUser as UserType);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCepLookup = async () => {
    if (formData.cep.replace(/\D/g, '').length !== 8) {
      alert("Digite um CEP válido com 8 dígitos.");
      return;
    }

    setSearchingCep(true);
    try {
      const data = await fetchAddressByCep(formData.cep);
      setFormData(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood
      }));
    } catch (err: any) {
      alert(err.message || "Erro ao buscar CEP.");
    } finally {
      setSearchingCep(false);
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
      
      return { 
        ...prev, 
        servedNeighborhoods: newSelection,
        neighborhood: newSelection.length > 0 && !prev.neighborhood ? newSelection[0] : prev.neighborhood
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError("Você precisa aceitar os termos de uso.");
      return;
    }

    // Capture final neighborhood value
    let finalNeighborhood = formData.neighborhood;
    
    // Logic for Clients (Dropdown remains)
    if (type === 'client') {
      if (finalNeighborhood === 'OUTRO') {
        if (!customNeighborhood.trim()) {
          setError("Por favor, informe o nome do seu bairro.");
          return;
        }
        finalNeighborhood = customNeighborhood;
      }
    } else {
      // Logic for Pros/Business (Dropdown removed, use served neighborhoods)
      if (formData.servedNeighborhoods.length === 0) {
        setError("Selecione pelo menos um bairro de atendimento da lista.");
        return;
      }
      finalNeighborhood = formData.servedNeighborhoods[0];
    }

    // Document Validation
    if (type === 'business' && !formData.cnpj) {
      setError("O CNPJ é obrigatório para o cadastro de comércio.");
      return;
    }
    if (type === 'pro' && !formData.cpf && !formData.rg && !formData.cnpj) {
      setError("É obrigatório informar ao menos um documento (CPF, RG ou CNPJ).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const docsToVerify = [formData.cpf, formData.cnpj, formData.rg].filter(Boolean);
    try {
      for (const doc of docsToVerify) {
        const cleanDoc = doc?.replace(/\D/g, '');
        if (cleanDoc) {
          const blacklistSnap = await get(ref(db, `blacklist/${cleanDoc}`));
          if (blacklistSnap.exists()) {
            setLoading(false);
            setError("Um dos documentos informados foi banido por violação dos termos.");
            return;
          }
        }
      }

      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) {
        const allUsers = Object.values(usersSnap.val()) as any[];
        const isDuplicate = allUsers.some(u => 
          (u.email === formData.email) ||
          (formData.cpf && u.cpf && u.cpf.replace(/\D/g, '') === formData.cpf.replace(/\D/g, '')) ||
          (formData.cnpj && u.cnpj && u.cnpj.replace(/\D/g, '') === formData.cnpj.replace(/\D/g, ''))
        );
        
        if (isDuplicate) {
          setLoading(false);
          setError("Já existe um cadastro com este E-mail ou Documento.");
          return;
        }
      }
    } catch (err) {
      console.error("Validation error", err);
    }

    let finalCategory = formData.category;
    if (finalCategory === 'CRIAR_NOVA') {
      if (!formData.customCategory) {
        setLoading(false);
        setError("Por favor, informe o nome da nova categoria.");
        return;
      }
      finalCategory = formData.customCategory;
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
        zipCode: formData.cep,
        address: formData.address ? (formData.address + (formData.number ? `, ${formData.number}` : '')) : '',
        neighborhood: finalNeighborhood,
        avatarUrl: formData.avatarUrl,
        coverUrl: formData.coverUrl,
        category: finalCategory,
        businessDescription: formData.businessDescription,
        favorites: [],
        socials: formData.socials,
        servedNeighborhoods: formData.servedNeighborhoods,
        privacySettings: formData.privacySettings,
        createdAt: new Date().toISOString()
      };

      await set(ref(db, 'users/' + user.uid), newUser);
      
      setLoading(false);
      if (onRegisterSuccess) onRegisterSuccess(newUser as UserType);

    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está sendo utilizado.");
      } else {
        setError(error.message);
      }
    }
  };

  const isFormValid = acceptedTerms && formData.name && formData.email && 
    (type === 'client' || formData.servedNeighborhoods.length > 0) && 
    (type === 'client' || (type === 'pro' ? (formData.cpf || formData.rg || formData.cnpj) : formData.cnpj));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`${config.color} p-8 text-center text-white relative`}>
            <div className="relative z-10">
              <div className="relative mx-auto w-32 h-32 mb-6 group">
                <div className="w-32 h-32 rounded-full bg-white/20 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md border-4 border-white/40 p-1 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="bg-white rounded-full p-2 w-full h-full flex flex-col items-center justify-center text-gray-400">
                       <AppLogo className="w-16 h-16 mb-1" />
                       <div className="flex flex-col items-center gap-0.5">
                         <span className="text-[10px] font-black uppercase text-center leading-none">Foto / Logo</span>
                       </div>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-white text-gray-800 p-3 rounded-full cursor-pointer hover:bg-gray-100 shadow-2xl border-4 border-white transition-all active:scale-90 z-20">
                  <Camera size={24} className="text-primary" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl')} />
                </label>
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl -z-10 animate-pulse"></div>
              </div>

              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{config.title}</h2>
              <p className="opacity-90 text-xs font-medium max-w-xs mx-auto leading-tight">{config.subtitle}</p>
            </div>
          </div>

          <div className="p-8">
            {(type === 'pro' || type === 'business') && (
               <div className="bg-blue-50 border-2 border-primary/20 p-6 rounded-3xl mb-8 shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-primary text-white p-2 rounded-xl shrink-0">
                     <Sparkles size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-primary font-black text-sm uppercase tracking-tight mb-1">
                       📸 A FOTO É ESSENCIAL PARA O SEU SUCESSO!
                    </h3>
                    <p className="text-gray-700 text-xs font-medium leading-relaxed">
                      Perfil com foto ou logo transmite muito mais confiança e recebe até <strong>10x mais contatos</strong>.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-primary/10 shadow-sm">
                       <Camera size={14} className="text-primary" />
                       <span className="text-[10px] font-black text-primary uppercase">Clique no ícone da câmera para enviar</span>
                    </div>
                  </div>
               </div>
            )}

            {type === 'client' && (
              <div className="mb-10 space-y-6">
                <button 
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  className="w-full bg-white border border-gray-200 text-gray-700 font-black py-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Chrome className="text-blue-600" size={24} />}
                  Entrar com Google
                </button>
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Ou use e-mail</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Informações Básicas</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        {type === 'business' ? 'Nome da Loja / Negócio *' : 'Nome Completo *'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800 transition-all" placeholder="Como o cliente deve ver seu nome?" />
                      </div>
                    </div>

                    {(type === 'business' || type === 'pro') && (
                      <>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Especialidade / Categoria *</label>
                          <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})} 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800 transition-all bg-white" 
                            required
                          >
                            <option value="">Selecione sua área...</option>
                            {filteredCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            <option value="CRIAR_NOVA" className="font-bold text-primary">➕ Outra Categoria (Adicionar Manualmente)</option>
                          </select>
                        </div>

                        {formData.category === 'CRIAR_NOVA' && (
                           <div className="animate-in slide-in-from-top-2">
                              <label className="block text-[10px] font-black text-primary uppercase mb-1 flex items-center gap-1 ml-1">
                                 <Plus size={14} /> Descreva sua especialidade *
                              </label>
                              <input 
                                type="text" 
                                required 
                                placeholder="Ex: Piscineiro, Tradutor, Dog Walker..."
                                value={formData.customCategory} 
                                onChange={e => setFormData({...formData, customCategory: e.target.value})} 
                                className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-primary/5 font-bold" 
                              />
                           </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Contato e Documentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail *</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="exemplo@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">WhatsApp *</label>
                      <input type="tel" required placeholder="(41) 9...." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" />
                    </div>
                  </div>
                  
                  {(type === 'pro' || type === 'business') && (
                    <div className="mt-6 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-primary uppercase mb-4 flex items-center gap-2">
                        <Shield size={16} /> Identificação {type === 'business' ? 'da Empresa' : 'Profissional'} 
                        {type === 'business' ? ' *' : ' (Pelo menos um) *'}
                      </p>
                      <div className="space-y-3">
                        {type === 'business' ? (
                          <>
                            <input 
                              type="text" 
                              required 
                              value={formData.cnpj} 
                              onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" 
                              placeholder="CNPJ da Empresa *" 
                            />
                            <input 
                              type="text" 
                              value={formData.cpf} 
                              onChange={e => setFormData({...formData, cpf: e.target.value})} 
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm" 
                              placeholder="CPF do Responsável (Opcional)" 
                            />
                          </>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm" placeholder="CPF" />
                            <input type="text" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm" placeholder="RG" />
                            <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm" placeholder="CNPJ" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Localização</h3>
                  <div className="space-y-4">
                    <div className={`grid grid-cols-1 ${type === 'client' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                       <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">CEP (Busca Automática)</label>
                          <div className="flex gap-2">
                            <input type="text" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="00000-000" />
                            <button 
                              type="button" 
                              onClick={handleCepLookup} 
                              disabled={searchingCep}
                              className="bg-primary text-white px-4 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center min-w-[50px] shadow-lg shadow-primary/20"
                              title="Buscar CEP"
                            >
                              {searchingCep ? <Loader2 size={18} className="animate-spin" /> : <SearchCode size={20} />}
                            </button>
                          </div>
                       </div>
                       {type === 'client' && (
                         <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Seu Bairro (Opcional)</label>
                            <select 
                              value={formData.neighborhood} 
                              onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white font-bold text-gray-800" 
                            >
                               <option value="">Selecione seu bairro (Opcional)</option>
                               {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                               <option value="OUTRO" className="font-bold text-primary">➕ Adicionar novo bairro</option>
                            </select>
                         </div>
                       )}
                    </div>

                    {type === 'client' && formData.neighborhood === 'OUTRO' && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="block text-[10px] font-black text-primary uppercase mb-1 ml-1 flex items-center gap-1">
                          <MapPin size={14} /> Digite o nome do bairro *
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Jardim Social, Centro..."
                          value={customNeighborhood} 
                          onChange={e => setCustomNeighborhood(e.target.value)} 
                          className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-primary/5 font-bold" 
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rua / Logradouro (Opcional)</label>
                        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="Rua, Avenida..." />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nº (Opcional)</label>
                        <input type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="123" />
                      </div>
                    </div>
                  </div>
                </div>

                {(type === 'business' || type === 'pro') && (
                  <>
                    <div className="mb-4">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Atendimento e Canais Digitais</h3>
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                          <label className="block text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <MapPin size={18} className="text-primary" /> Bairros que você atende *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {ALLOWED_NEIGHBORHOODS.map(bairro => (
                                 <label key={bairro} className={`flex items-center space-x-3 text-sm cursor-pointer p-4 rounded-2xl transition-all border ${formData.servedNeighborhoods.includes(bairro) ? 'bg-white border-primary shadow-md scale-[1.02]' : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200'}`}>
                                    <input
                                      type="checkbox"
                                      checked={formData.servedNeighborhoods.includes(bairro)}
                                      onChange={() => toggleServedNeighborhood(bairro)}
                                      className="rounded text-primary focus:ring-primary w-5 h-5 border-gray-300"
                                    />
                                    <span className={formData.servedNeighborhoods.includes(bairro) ? 'font-black text-primary' : 'text-gray-600 font-bold'}>{bairro}</span>
                                 </label>
                              ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Links Digitais (Opcional)</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={18} />
                              <input type="text" value={formData.socials.instagram} onChange={e => setFormData({...formData, socials: {...formData.socials, instagram: e.target.value}})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="Instagram (@usuário)" />
                            </div>
                            <div className="relative">
                              <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                              <input type="text" value={formData.socials.facebook} onChange={e => setFormData({...formData, socials: {...formData.socials, facebook: e.target.value}})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="Facebook Link" />
                            </div>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                              <input type="text" value={formData.socials.website} onChange={e => setFormData({...formData, socials: {...formData.socials, website: e.target.value}})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="Site ou Linktree" />
                            </div>
                            <div className="relative">
                              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                              <input type="text" value={formData.socials.googleMyBusiness} onChange={e => setFormData({...formData, socials: {...formData.socials, googleMyBusiness: e.target.value}})} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800" placeholder="Google Meu Negócio" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descrição do seu Negócio</label>
                          <textarea 
                            rows={3}
                            value={formData.businessDescription}
                            onChange={e => setFormData({...formData, businessDescription: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-gray-800 transition-all resize-none"
                            placeholder="Descreva o que você oferece aos clientes..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b-2 border-gray-100 pb-2">Segurança</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary font-bold text-gray-800" placeholder="Senha" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} required minLength={6} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary font-bold text-gray-800" placeholder="Confirmação" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 flex items-start gap-4">
                <input type="checkbox" id="acceptTerms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1.5 w-6 h-6 text-primary rounded-lg focus:ring-primary border-gray-300 cursor-pointer" required />
                <label htmlFor="acceptTerms" className="text-xs font-medium text-gray-600 cursor-pointer leading-relaxed">
                  Aceito os <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary font-black hover:underline">Termos de Uso</button> de Águas Claras e Região.
                </label>
              </div>

              {error && (
                 <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 border border-red-100 animate-shake">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="font-black uppercase tracking-tight">{error}</span>
                 </div>
              )}

              <button 
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full text-white font-black py-5 rounded-[2rem] mt-4 shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.1em] text-sm
                  ${config.color} hover:brightness-110 active:scale-[0.98]
                  ${(!isFormValid || loading) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1'}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-12 pb-8">
           Ambiente seguro e monitorado 24h
        </p>
      </div>
      
      {showTermsModal && <PrivacyPolicy appName={appName} onClose={() => setShowTermsModal(false)} />}
    </div>
  );
};

export default RegisterForm;

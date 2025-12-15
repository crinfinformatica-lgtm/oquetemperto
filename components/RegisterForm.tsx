
import React, { useState } from 'react';
import { ArrowLeft, User, Briefcase, Store, CheckCircle, Camera, MapPin, Loader2, AlertCircle, Eye, EyeOff, Globe, Facebook, Instagram, Image as ImageIcon, Shield, Chrome, X, FileText, AlignLeft } from 'lucide-react';
import { fetchAddressByCep } from '../services/cepService';
import { User as UserType } from '../types';
import { ALLOWED_NEIGHBORHOODS, CATEGORIES } from '../constants';
import AppLogo from './AppLogo';
import emailjs from '@emailjs/browser';

// Firebase Imports
import { auth, db, signInWithGoogle } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

type RegisterType = 'client' | 'pro' | 'business';

interface RegisterFormProps {
  type: RegisterType;
  onBack: () => void;
  onRegisterSuccess?: (newUser: UserType) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ type, onBack, onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', // Nome da Loja ou Pessoa
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
    customCategory: '', // Se escolher "Outro" ou especialidade
    businessDescription: '', // Description added
    servedNeighborhoods: [] as string[], // New field for service area

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

  // State for the generic document input
  const [documentInput, setDocumentInput] = useState('');

  const [cepLoading, setCepLoading] = useState(false);
  const [cepVerified, setCepVerified] = useState(false);
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

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

  const handleCepBlur = async () => {
    if (formData.cep.length < 8) return;
    
    setCepLoading(true);
    setError('');
    setCepVerified(false);

    try {
      const data = await fetchAddressByCep(formData.cep);
      
      // Validação estrita de cidade
      if (data.localidade !== 'Campo Largo') {
        throw new Error(`Cadastro restrito. Atendemos apenas Campo Largo/PR.`);
      }

      setFormData(prev => ({
        ...prev,
        address: data.logradouro,
      }));
      setCepVerified(true);
    } catch (err: any) {
      setError(err.message);
      setCepVerified(false);
    } finally {
      setCepLoading(false);
    }
  };

  // --- IMAGE COMPRESSION LOGIC ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'coverUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Size Check (Max 4MB initial check)
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
          const maxWidth = 800; // Limit width to 800px to prevent DB crash
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to JPEG with 0.7 quality
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
      if (current.includes(bairro)) {
        return { ...prev, servedNeighborhoods: current.filter(b => b !== bairro) };
      } else {
        return { ...prev, servedNeighborhoods: [...current, bairro] };
      }
    });
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      // Check if user already exists in DB
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        // User exists, just log them in (handled by onAuthStateChanged in App.tsx)
      } else {
        // New User - Create basic profile
        const newUser: UserType = {
          id: user.uid,
          name: user.displayName || 'Usuário Google',
          email: user.email || '',
          role: type, // Uses the current form type (client, pro, etc)
          status: 'active',
          failedLoginAttempts: 0,
          avatarUrl: user.photoURL || '',
          favorites: [],
          phone: '', 
          zipCode: '',
          address: '',
          neighborhood: ''
        };
        
        await set(userRef, newUser);
        notifyAdmin(newUser); // Notify admin of Google registration
        if (onRegisterSuccess) onRegisterSuccess(newUser);
      }
    } catch (err: any) {
      console.error("Google Auth Error", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Erro: Domínio não autorizado. Adicione este domínio no Firebase Console ou use cadastro via E-mail.");
      } else {
        setError("Erro ao conectar com Google. Tente novamente ou use E-mail.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- NOTIFICATION SYSTEM ---
  const notifyAdmin = async (newUser: any) => {
     // 1. Salvar no Banco de Dados (Garantia de Registro)
     try {
        const notifRef = ref(db, `admin_notifications/${Date.now()}`);
        await set(notifRef, {
           type: 'NEW_USER',
           message: `Novo cadastro: ${newUser.name} (${newUser.role})`,
           details: newUser,
           read: false,
           timestamp: new Date().toISOString()
        });
        console.log("Notificação salva no banco de dados.");
     } catch (err) {
        console.error("Erro ao salvar notificação no banco", err);
     }

     // 2. Enviar E-mail via EmailJS
     const SERVICE_ID = "service_dqxdi2a"; 
     const TEMPLATE_ID = "template_8cthxoh";
     const PUBLIC_KEY = "NJZigwymrvB_gdLNP";

     const templateParams = {
        to_email: 'crinf.app@gmail.com', // Destinatário fixo
        from_name: 'App O Que Tem Perto',
        to_name: 'Admin Crinf',
        message: `
           NOVO USUÁRIO CADASTRADO:
           
           Nome: ${newUser.name}
           Tipo: ${newUser.role.toUpperCase()}
           Email: ${newUser.email}
           WhatsApp: ${newUser.phone || 'Não informado'}
           Categoria: ${newUser.category || 'N/A'}
           Bairro: ${newUser.neighborhood || 'N/A'}
        `,
        reply_to: newUser.email
     };

     try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log("📧 E-mail de notificação enviado para crinf.app@gmail.com");
     } catch (err) {
        console.error("❌ Erro ao enviar e-mail via EmailJS:", err);
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de CEP apenas para Prestadores e Comércios
    if (type !== 'client' && !cepVerified) {
      setError("Por favor, valide um CEP de Campo Largo antes de continuar.");
      return;
    }

    if (!formData.neighborhood) {
      setError("Selecione ou digite o bairro de sua residência.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if ((type === 'business' || type === 'pro') && !formData.category) {
      setError("Selecione uma categoria para seu perfil.");
      return;
    }
    
    if ((type === 'business' || type === 'pro') && formData.category === 'outros' && !formData.customCategory) {
      setError("Digite o nome da sua categoria/especialidade.");
      return;
    }

    setLoading(true);

    // Final Category Logic
    let finalCategory = formData.category;
    if (finalCategory === 'outros' && formData.customCategory) {
      finalCategory = formData.customCategory;
    } else if (type === 'pro' && formData.customCategory) {
       // Append speciality to category for Pros
       finalCategory = `${finalCategory} - ${formData.customCategory}`;
    }

    // Adjust address based on user type logic
    let finalAddress = formData.address;
    if (type === 'client') {
       // For clients, simple concatenation of street/number is enough as they enter it manually
       if (formData.number) finalAddress += `, ${formData.number}`;
    } else {
       // For pros/business (CEP based), formData.address is just the street from API
       finalAddress = `${formData.address}, ${formData.number}`;
    }

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Auth Profile (Display Name)
      await updateProfile(user, { displayName: formData.name });

      // 3. Create User Data Object for Realtime Database
      // Important: Avoid undefined values in the object passed to set()
      const newUserBase = {
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

        zipCode: type === 'client' ? '00000-000' : formData.cep, // Dummy CEP for manual clients
        address: finalAddress,
        neighborhood: formData.neighborhood,
        avatarUrl: formData.avatarUrl,
        coverUrl: formData.coverUrl,
        category: finalCategory,
        businessDescription: formData.businessDescription,
        favorites: [],
      };

      // Cast to any to allow dynamic property addition for this step
      let newUser: any = { ...newUserBase };

      // Conditionally add fields to avoid 'undefined' errors in Firebase
      if (type === 'business' || type === 'pro') {
         newUser.socials = formData.socials;
         newUser.servedNeighborhoods = formData.servedNeighborhoods;
      }

      if (type === 'pro') {
         newUser.privacySettings = formData.privacySettings;
      }

      // 4. Save to Realtime Database
      await set(ref(db, 'users/' + user.uid), newUser);

      // 5. NOTIFY ADMIN (New Feature)
      await notifyAdmin(newUser);

      // Force UI update slightly delayed to ensure state consistency
      setTimeout(() => {
        setLoading(false);
        if (onRegisterSuccess) {
          onRegisterSuccess(newUser as UserType);
        }
      }, 500);

    } catch (error: any) {
      setLoading(false);
      console.error("Erro no cadastro:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`${config.color} p-6 text-center text-white relative`}>
             {/* Cover Photo Simualtion for Business */}
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
              
              {type === 'business' && (
                <label className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs cursor-pointer mb-2 transition-colors">
                  <ImageIcon size={12} />
                  {formData.coverUrl ? 'Alterar Capa' : 'Adicionar Foto de Capa'}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'coverUrl')} />
                </label>
              )}

              <h2 className="text-2xl font-bold">{config.title}</h2>
              <p className="opacity-90 mt-1 text-sm">{config.subtitle}</p>
            </div>
          </div>

          <div className="p-8">
            {/* GOOGLE SIGN IN BUTTON - ONLY FOR CLIENTS */}
            {type === 'client' && (
              <div className="mb-6">
                 <button 
                   type="button"
                   onClick={handleGoogleRegister}
                   className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                 >
                   <Chrome className="text-blue-600" size={20} />
                   Entrar com Google
                 </button>
                 <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Ou preencha o formulário</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                 </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'business' ? 'Nome da Loja / Negócio *' : type === 'pro' ? 'Nome Completo ou Nome Fantasia *' : 'Nome Completo *'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder={type === 'business' ? "Ex: Pizzaria Bella Napoli" : "Seu nome"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>

                {/* Category Selection for Business AND Pro */}
                {(type === 'business' || type === 'pro') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                       {type === 'pro' ? 'Área de Atuação *' : 'Categoria do Negócio *'}
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                      required
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="outros">Outro (Criar Nova Categoria)</option>
                    </select>

                    {/* Sub-category / Specialty */}
                    {formData.category === 'outros' && (
                       <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-xs font-bold text-blue-600 mb-1">Crie sua categoria personalizada *</label>
                          <input 
                            type="text"
                            placeholder="Ex: Pet Shop, Jardinagem, Psicologia..."
                            value={formData.customCategory}
                            onChange={e => setFormData({...formData, customCategory: e.target.value})}
                            className="w-full px-4 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            required
                          />
                       </div>
                    )}
                    
                    {formData.category !== 'outros' && type === 'pro' && (
                        <input 
                          type="text"
                          placeholder="Especialidade (Ex: Residencial, Pediatria...)"
                          value={formData.customCategory}
                          onChange={e => setFormData({...formData, customCategory: e.target.value})}
                          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    )}
                  </div>
                )}
                
                {/* Description / Bio */}
                {(type === 'business' || type === 'pro') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                       <AlignLeft size={16} /> Pequena Descrição (Bio)
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Conte um pouco sobre seu trabalho ou loja... O que você faz de melhor?"
                      value={formData.businessDescription}
                      onChange={e => setFormData({...formData, businessDescription: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login) *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="(41) 9..."
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div>
                    {/* Dynamic Document Label - Updated to include RG and Validation concept */}
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {type === 'business' ? 'CNPJ' : 'CPF, RG ou CNPJ'} (Opcional)
                    </label>
                    <div className="flex gap-1">
                      <FileText className="text-gray-400 mt-2.5" size={16} />
                      <input 
                        type="text" 
                        placeholder={type === 'business' ? "CNPJ" : "Digite o número"}
                        value={documentInput}
                        onChange={e => {
                          const val = e.target.value;
                          setDocumentInput(val);
                          
                          // Smart Auto-detection logic based on length of numbers
                          const nums = val.replace(/\D/g, '');
                          
                          if (nums.length > 11) {
                             // Assume CNPJ if longer than 11 digits
                             setFormData({...formData, cnpj: val, cpf: '', rg: ''});
                          } else if (nums.length === 11) {
                             // Assume CPF
                             setFormData({...formData, cpf: val, cnpj: '', rg: ''});
                          } else {
                             // Assume RG or Generic
                             setFormData({...formData, rg: val, cpf: '', cnpj: ''});
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Served Neighborhoods for Pro/Business */}
                {(type === 'business' || type === 'pro') && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                       {type === 'pro' ? 'Quais bairros você atende?' : 'Área de Entrega / Atendimento'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {ALLOWED_NEIGHBORHOODS.map(bairro => (
                           <label key={bairro} className={`flex items-center space-x-2 text-sm cursor-pointer p-2 rounded transition-colors border ${formData.servedNeighborhoods.includes(bairro) ? 'bg-white border-primary shadow-sm' : 'hover:bg-gray-100 border-transparent'}`}>
                              <input
                                type="checkbox"
                                checked={formData.servedNeighborhoods.includes(bairro)}
                                onChange={() => toggleServedNeighborhood(bairro)}
                                className="rounded text-primary focus:ring-primary w-4 h-4"
                              />
                              <span className={formData.servedNeighborhoods.includes(bairro) ? 'font-semibold text-primary' : 'text-gray-700'}>{bairro}</span>
                           </label>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Selecione todos que se aplicam.</p>
                  </div>
                )}

                {/* Privacy Settings for Pros */}
                {type === 'pro' && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                     <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                        <Shield size={16} /> Privacidade do Perfil
                     </h3>
                     <p className="text-xs text-yellow-700 mb-3">Escolha quais dados serão exibidos publicamente nos resultados de busca.</p>
                     
                     <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={formData.privacySettings.showPhone}
                              onChange={e => setFormData({...formData, privacySettings: {...formData.privacySettings, showPhone: e.target.checked}})}
                              className="rounded text-primary focus:ring-primary"
                           />
                           Exibir meu WhatsApp publicamente
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                           <input 
                              type="checkbox" 
                              checked={formData.privacySettings.showAddress}
                              onChange={e => setFormData({...formData, privacySettings: {...formData.privacySettings, showAddress: e.target.checked}})}
                              className="rounded text-primary focus:ring-primary"
                           />
                           Exibir meu endereço completo no perfil
                        </label>
                     </div>
                  </div>
                )}

                {/* Social Media for Business AND Pro */}
                {(type === 'business' || type === 'pro') && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Globe size={16} /> Redes Sociais e Contato
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                       <div className="relative">
                         <div className="absolute left-3 top-2.5 text-pink-600"><Instagram size={16} /></div>
                         <input 
                           type="text" 
                           placeholder="Instagram (Link ou @usuario)"
                           value={formData.socials.instagram}
                           onChange={e => setFormData({...formData, socials: {...formData.socials, instagram: e.target.value}})}
                           className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                         />
                       </div>
                       <div className="relative">
                         <div className="absolute left-3 top-2.5 text-blue-600"><Facebook size={16} /></div>
                         <input 
                           type="text" 
                           placeholder="Link do Facebook"
                           value={formData.socials.facebook}
                           onChange={e => setFormData({...formData, socials: {...formData.socials, facebook: e.target.value}})}
                           className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                         />
                       </div>
                       <div className="relative">
                         <div className="absolute left-3 top-2.5 text-green-600"><Globe size={16} /></div>
                         <input 
                           type="text" 
                           placeholder="Site / Portfólio"
                           value={formData.socials.website}
                           onChange={e => setFormData({...formData, socials: {...formData.socials, website: e.target.value}})}
                           className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                         />
                       </div>
                       <div className="relative">
                         <div className="absolute left-3 top-2.5 text-red-500"><MapPin size={16} /></div>
                         <input 
                           type="text" 
                           placeholder="Link Google Meu Negócio"
                           value={formData.socials.googleMyBusiness}
                           onChange={e => setFormData({...formData, socials: {...formData.socials, googleMyBusiness: e.target.value}})}
                           className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                         />
                       </div>
                    </div>
                  </div>
                )}

                {/* Location Lock */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
                    <MapPin size={16} className="mr-1"/> Localização
                  </label>

                  {type === 'client' ? (
                     <div className="space-y-3">
                        {/* Fixed City */}
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Cidade / Estado</label>
                           <input
                              type="text"
                              value="Campo Largo - PR"
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed"
                           />
                        </div>

                        {/* Free Text Neighborhood */}
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Bairro *</label>
                           <input
                              type="text"
                              required
                              placeholder="Digite o nome do seu bairro"
                              value={formData.neighborhood}
                              onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                           />
                        </div>

                        {/* Address Manual Input */}
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Endereço (Rua e Número)</label>
                           <input
                              type="text"
                              required
                              placeholder="Ex: Rua XV de Novembro, 100"
                              value={formData.address}
                              onChange={e => setFormData({...formData, address: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                           />
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className="flex gap-2 mb-2">
                           <input 
                              type="text" 
                              placeholder="CEP (ex: 83601-000)"
                              value={formData.cep}
                              onChange={e => setFormData({...formData, cep: e.target.value})}
                              onBlur={handleCepBlur}
                              maxLength={9}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                           />
                           {cepLoading && <div className="flex items-center text-gray-500"><Loader2 className="animate-spin"/></div>}
                        </div>
                        
                        {error && <p className="text-xs text-red-600 font-bold mb-2 flex items-center"><AlertCircle size={12} className="mr-1"/> {error}</p>}
                        
                        {cepVerified && (
                           <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                              <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                                 <p className="font-bold text-green-700 text-xs flex items-center mb-1"><CheckCircle size={12} className="mr-1"/> Localização: Campo Largo</p>
                                 <p className="text-xs">{formData.address}</p>
                              </div>
                              
                              <div>
                                 <label className="block text-xs font-bold text-gray-600 mb-1">Selecione o bairro de sua residência *</label>
                                 {!isCustomNeighborhood ? (
                                 <select 
                                       value={ALLOWED_NEIGHBORHOODS.includes(formData.neighborhood) ? formData.neighborhood : ''}
                                       onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === 'custom') {
                                             setIsCustomNeighborhood(true);
                                             setFormData({...formData, neighborhood: ''});
                                          } else {
                                             setFormData({...formData, neighborhood: val});
                                          }
                                       }}
                                       className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                                       required
                                 >
                                    <option value="">Selecione na lista...</option>
                                    {ALLOWED_NEIGHBORHOODS.map(bairro => (
                                       <option key={bairro} value={bairro}>{bairro}</option>
                                    ))}
                                    <option value="custom" className="font-bold text-blue-600">+ Outro (Digitar nome do bairro)</option>
                                 </select>
                                 ) : (
                                 <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                       <input 
                                          type="text" 
                                          placeholder="Digite o nome do seu bairro" 
                                          value={formData.neighborhood}
                                          onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                                          autoFocus
                                       />
                                       <button 
                                          type="button" 
                                          onClick={() => { setIsCustomNeighborhood(false); setFormData({...formData, neighborhood: ''}); }}
                                          className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded"
                                          title="Voltar para lista"
                                       >
                                          <X size={20} />
                                       </button>
                                 </div>
                                 )}
                                 {!isCustomNeighborhood && (
                                 <p className="text-left text-[10px] text-gray-500 mt-1">
                                    * Se não encontrar na lista, selecione "Outro" no final.
                                 </p>
                                 )}
                              </div>

                              <div>
                                 <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                                 <input 
                                 type="text" 
                                 required
                                 value={formData.number}
                                 onChange={e => setFormData({...formData, number: e.target.value})}
                                 className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none text-sm" 
                                 />
                              </div>
                           </div>
                        )}
                     </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10" 
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirme a Senha *</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                 <div className="bg-red-50 text-red-600 p-3 rounded text-sm mt-4 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                 </div>
              )}

              <button 
                type="submit"
                disabled={loading || (type !== 'client' && !cepVerified)}
                className={`w-full text-white font-bold py-3 rounded-lg mt-4 shadow-md transition-all flex items-center justify-center gap-2
                  ${config.color === 'bg-accent' ? 'bg-accent hover:bg-yellow-500 text-gray-900' : config.color === 'bg-tertiary' ? 'bg-tertiary hover:brightness-90' : config.color + ' hover:brightness-90'}
                  ${(loading || (type !== 'client' && !cepVerified)) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </form>
            
            <p className="text-center text-xs text-gray-500 mt-6">
              Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
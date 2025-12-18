
import React, { useState } from 'react';
import { User } from '../types';
// Added ArrowLeft to the lucide-react imports
import { Camera, Save, LogOut, Lock, MapPin, Phone, User as UserIcon, FileText, Globe, Instagram, Facebook, Trash2, AlertTriangle, AlignLeft, Shield, ArrowLeft } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { ref, remove } from 'firebase/database';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void;
  onBack: () => void;
  onOpenAdmin?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onLogout, onBack, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name,
    whatsapp: user.phone || '',
    cpf: user.cpf || '',
    rg: user.rg || '',
    cnpj: user.cnpj || '',
    category: user.category || '',
    businessDescription: user.businessDescription || '',
    avatarUrl: user.avatarUrl || '',
    coverUrl: user.coverUrl || '',
    socials: {
       instagram: user.socials?.instagram || '',
       facebook: user.socials?.facebook || '',
       website: user.socials?.website || '',
       googleMyBusiness: user.socials?.googleMyBusiness || ''
    }
  });

  const isAdmin = user.role === 'admin' || user.role === 'master';

  const handlePasswordResetRequest = async () => {
    if (!user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Um e-mail para redefinição de senha foi enviado para: ${user.email}`);
    } catch (error: any) {
      alert("Erro ao enviar e-mail: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ATENÇÃO: Essa ação é irreversível. Todos os seus dados, anúncios e favoritos serão apagados permanentemente. Deseja continuar?")) {
        return;
    }

    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await remove(ref(db, `users/${user.id}`));
            await deleteUser(currentUser);
            alert("Sua conta foi excluída com sucesso.");
            onLogout();
        }
    } catch (error: any) {
        console.error("Delete Error", error);
        alert("Erro ao excluir conta. Por razões de segurança, faça logout e login novamente antes de tentar excluir.");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...user,
      name: formData.name,
      phone: formData.whatsapp,
      cpf: formData.cpf,
      rg: formData.rg,
      cnpj: formData.cnpj,
      category: formData.category,
      businessDescription: formData.businessDescription,
      avatarUrl: formData.avatarUrl,
      coverUrl: formData.coverUrl,
      socials: formData.socials
    });
    setIsEditing(false);
    alert('Dados atualizados com sucesso!');
  };

  if (showDeleteConfirm) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
           <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
              <AlertTriangle className="mx-auto text-red-600 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Conta?</h3>
              <p className="text-gray-600 text-sm mb-6">
                 Você perderá seu perfil, avaliações e histórico. Essa ação não pode ser desfeita.
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleDeleteAccount} className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700">
                    Sim, excluir tudo
                 </button>
                 <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300">
                    Cancelar
                 </button>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex gap-2">
             {isAdmin && onOpenAdmin && (
                <button 
                  onClick={onOpenAdmin}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                   <Shield size={16} /> PAINEL DO GESTOR
                </button>
             )}
             <button onClick={onLogout} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
               <LogOut size={16} /> Sair
             </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
          <div className="h-32 bg-gray-200 relative">
             {formData.coverUrl && (
                <img src={formData.coverUrl} className="w-full h-full object-cover" alt="Capa" />
             )}
             {isEditing && (user.role === 'business') && (
                <label className="absolute top-2 right-2 bg-black/50 text-white p-1 px-2 rounded cursor-pointer text-[10px] font-bold uppercase hover:bg-black/70">
                   Alterar Capa
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'coverUrl')} />
                </label>
             )}
             {!formData.coverUrl && !isEditing && <div className="w-full h-full bg-gradient-to-r from-primary to-blue-600" />}
          </div>
          
          <div className="px-8 pb-8 relative">
            <div className="relative -mt-16 mb-6 flex justify-between items-end">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md flex items-center justify-center">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} className="text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark shadow-sm border-2 border-white">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl')} />
                  </label>
                )}
              </div>
              
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Editar Dados
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
                     {user.role === 'business' ? 'Dados da Empresa' : 'Dados Pessoais'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                         {user.role === 'business' ? 'Nome Fantasia' : 'Nome Completo'}
                      </label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0 disabled:text-lg disabled:font-bold disabled:text-gray-900"
                      />
                    </div>
                    
                    {user.role === 'business' ? (
                       <>
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CNPJ</label>
                           <input 
                              type="text" 
                              disabled={!isEditing}
                              value={formData.cnpj}
                              onChange={e => setFormData({...formData, cnpj: e.target.value})}
                              placeholder="Não informado"
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Categoria</label>
                           <input 
                              type="text" 
                              disabled={!isEditing}
                              value={formData.category}
                              onChange={e => setFormData({...formData, category: e.target.value})}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                           />
                        </div>
                       </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">CPF</label>
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" />
                            <input 
                              type="text" 
                              disabled={!isEditing}
                              value={formData.cpf}
                              onChange={e => setFormData({...formData, cpf: e.target.value})}
                              placeholder="Não informado"
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">RG</label>
                          <input 
                            type="text" 
                            disabled={!isEditing}
                            value={formData.rg}
                            onChange={e => setFormData({...formData, rg: e.target.value})}
                            placeholder="Não informado"
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {(user.role === 'pro' || user.role === 'business') && (
                  <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                         <AlignLeft size={14} /> Pequena Descrição (Bio)
                      </label>
                      <textarea 
                        disabled={!isEditing}
                        rows={3}
                        value={formData.businessDescription}
                        onChange={e => setFormData({...formData, businessDescription: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none disabled:bg-transparent disabled:border-none disabled:p-0 disabled:text-gray-600"
                        placeholder="Conte um pouco sobre seu serviço..."
                      />
                  </div>
                )}

                {user.role === 'business' && (
                  <div className="md:col-span-2">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2 mt-4">Redes Sociais</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                           <Instagram size={16} className="text-pink-600" />
                           <input 
                              type="text"
                              disabled={!isEditing}
                              placeholder="Instagram"
                              value={formData.socials.instagram}
                              onChange={e => setFormData({...formData, socials: {...formData.socials, instagram: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                           />
                        </div>
                        <div className="flex items-center gap-2">
                           <Facebook size={16} className="text-blue-600" />
                           <input 
                              type="text"
                              disabled={!isEditing}
                              placeholder="Facebook"
                              value={formData.socials.facebook}
                              onChange={e => setFormData({...formData, socials: {...formData.socials, facebook: e.target.value}})}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                           />
                        </div>
                     </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2 mt-4">Contato e Localização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Email (Login)</label>
                      <div className="text-gray-700 font-bold p-1">{user.email}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">WhatsApp</label>
                      <div className="flex items-center gap-2">
                         <Phone size={16} className="text-green-600" />
                         <input 
                          type="tel" 
                          disabled={!isEditing}
                          value={formData.whatsapp}
                          onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none disabled:bg-transparent disabled:border-none disabled:p-0"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Endereço Registrado</label>
                       <div className="flex items-start gap-2 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <MapPin size={18} className="text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-bold">{user.address || 'Endereço não cadastrado'}</p>
                            {user.neighborhood && <p className="text-sm font-medium text-gray-500">{user.neighborhood}</p>}
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">CEP: {user.zipCode}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-gray-50 p-6 rounded-3xl mt-4 border border-gray-100">
                  <h3 className="text-xs font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Lock size={16} /> Segurança da Conta
                  </h3>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-6 mb-6">
                    <p className="text-xs text-gray-500">
                      Deseja trocar sua senha? Enviaremos um link de recuperação.
                    </p>
                    <button 
                      type="button"
                      onClick={handlePasswordResetRequest}
                      className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 whitespace-nowrap w-full md:w-auto shadow-sm"
                    >
                      Redefinir Senha
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-left w-full">
                       <p className="text-sm font-black text-red-600 uppercase">Apagar Conta</p>
                       <p className="text-xs text-gray-500">
                          Todos os seus dados e anúncios serão removidos imediatamente.
                       </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-50 border border-red-100 text-red-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 whitespace-nowrap flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                      <Trash2 size={16} /> Excluir Agora
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="md:col-span-2 flex gap-3 mt-6 pt-6 border-t border-gray-100">
                    <button type="submit" className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-600/20 hover:bg-green-700 flex items-center justify-center gap-2">
                      <Save size={18} /> Salvar Alterações
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)} 
                      className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

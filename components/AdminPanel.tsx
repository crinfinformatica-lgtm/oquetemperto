
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, AppConfig } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Edit, Ban, CheckCircle, Palette, Image as ImageIcon, 
  Type, Download, Share2, LogOut, Save, Eye, EyeOff, Zap, X, Calendar, Clock, Copy, RefreshCw, Upload, Menu, Database, FileUp, AlertTriangle, FileText, Code, Camera, UserPlus, ChevronDown, AlignLeft
} from 'lucide-react';
import { db, firebaseConfig, auth } from '../services/firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { initializeApp as initializeFireApp, deleteApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword, signOut as signOutSecondary, sendPasswordResetEmail } from 'firebase/auth';
import AppLogo from './AppLogo';
import { CATEGORIES } from '../constants';

interface AdminPanelProps {
  currentUser: User;
  users: User[]; // This will be incomplete in production (public only). Admin fetches its own full list.
  appConfig: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
  onShareApp: () => void;
}

type AdminTab = 'dashboard' | 'clients' | 'pros' | 'businesses' | 'admins' | 'customization' | 'tools' | 'profile';

// Helper Logic for Highlights
const isHighlighted = (user: User) => {
  if (!user.highlightExpiresAt) return false;
  return new Date(user.highlightExpiresAt) > new Date();
};

const getRemainingDays = (user: User) => {
  if (!user.highlightExpiresAt) return 0;
  const diff = new Date(user.highlightExpiresAt).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

// --- SUB-COMPONENT: USER TABLE ---
const UserTable = ({ 
  role, 
  title, 
  icon: Icon, 
  users, 
  currentUser, 
  onUpdateUser, 
  onDeleteUser, 
  setHighlightModalUser,
  setEditingUser, 
  canDelete,
  isLoading
}: { 
  role?: UserRole, 
  title: string, 
  icon: any, 
  users: User[],
  currentUser: User,
  onUpdateUser: (u: User) => void,
  onDeleteUser: (id: string) => void,
  setHighlightModalUser: (u: User) => void,
  setEditingUser: (u: User) => void,
  canDelete: (u: User) => boolean,
  isLoading: boolean
}) => {
    // Robust Filtering
    const filteredUsers = role 
      ? users.filter(u => u.role === role) 
      : users.filter(u => u.role === 'admin' || u.role === 'master');
    
    // Handlers
    const handleUnlock = (user: User) => {
      onUpdateUser({ ...user, status: 'active', failedLoginAttempts: 0 });
      alert(`Usuário ${user.name} desbloqueado com sucesso.`);
    };

    const handleBan = (user: User) => {
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      if (confirm(`Tem certeza que deseja ${newStatus === 'banned' ? 'banir' : 'desbanir'} ${user.name}?`)) {
         onUpdateUser({ ...user, status: newStatus });
      }
    };

    const handleChangeRole = (user: User, newRole: UserRole) => {
      // Regras de segurança:
      // 1. Apenas Master pode criar/editar Admins ou outros Masters.
      // 2. Admins podem alterar papéis de Clients, Pros e Businesses.
      
      const isSensitiveRole = (r: string) => r === 'admin' || r === 'master';
      
      if (currentUser.role !== 'master' && (isSensitiveRole(user.role) || isSensitiveRole(newRole))) {
         alert("Você não tem permissão para alterar níveis administrativos (Admin/Master).");
         return;
      }

      const roleLabels: Record<string, string> = {
         client: 'Cliente',
         pro: 'Prestador de Serviço',
         business: 'Comércio Local',
         admin: 'Administrador'
      };

      if (confirm(`CORRIGIR CADASTRO:\n\nAlterar o tipo de conta de "${user.name}" para ${roleLabels[newRole].toUpperCase()}?\n\nIsso mudará as permissões e a exibição no aplicativo.`)) {
         onUpdateUser({ ...user, role: newRole });
      }
    };

    const getRoleLabel = (r: string) => {
       switch(r) {
          case 'client': return 'Cliente';
          case 'pro': return 'Prestador';
          case 'business': return 'Comércio';
          case 'admin': return 'Admin';
          case 'master': return 'Master';
          default: return r;
       }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Icon size={20} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            {filteredUsers.length} encontrados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Nome/Email</th>
                <th className="p-4">Status</th>
                {(role === 'pro' || role === 'business') && <th className="p-4">Destaque</th>}
                <th className="p-4">Tipo de Conta</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                       <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                       Carregando dados...
                    </td>
                 </tr>
              ) : filteredUsers.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                       Nenhum usuário encontrado nesta categoria.
                    </td>
                 </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${isHighlighted(user) ? 'bg-yellow-50/50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-xs font-bold">{user.name.charAt(0)}</span>}
                         </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{user.name} {user.role === 'master' && '(Master)'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        {isHighlighted(user) && <Zap size={14} className="text-yellow-500 fill-current" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 
                        user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {user.status === 'active' ? 'Ativo' : user.status === 'banned' ? 'Banido' : 'Bloqueado'}
                      </span>
                    </td>
                    {(role === 'pro' || role === 'business') && (
                      <td className="p-4">
                        {isHighlighted(user) ? (
                           <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                             <Clock size={12} /> {getRemainingDays(user)} dias
                           </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="p-4">
                       {/* Lógica: Master pode mudar tudo. Admin pode mudar tudo EXCETO Master e outros Admins */}
                       {(currentUser.role === 'master' || (currentUser.role === 'admin' && user.role !== 'master' && user.role !== 'admin')) ? (
                          <div className="relative group/role">
                             <button 
                                className="text-[10px] font-bold uppercase bg-white border border-gray-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-50 hover:border-blue-400 transition-colors shadow-sm"
                                title="Clique para corrigir o tipo de cadastro"
                             >
                               {getRoleLabel(user.role)} <ChevronDown size={10} />
                             </button>
                             <div className="absolute left-0 top-full mt-1 bg-white border shadow-xl rounded-lg z-50 hidden group-hover/role:block min-w-[150px]">
                                <div className="p-1">
                                    <p className="text-[9px] text-gray-400 px-2 py-1 uppercase font-bold tracking-wider">Alterar para:</p>
                                    <button onClick={() => handleChangeRole(user, 'client')} className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"><Users size={12} className="text-blue-500"/> Cliente</button>
                                    <button onClick={() => handleChangeRole(user, 'pro')} className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"><Briefcase size={12} className="text-green-600"/> Prestador</button>
                                    <button onClick={() => handleChangeRole(user, 'business')} className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"><Store size={12} className="text-purple-600"/> Comércio</button>
                                    {currentUser.role === 'master' && (
                                        <>
                                            <div className="border-t my-1"></div>
                                            <button onClick={() => handleChangeRole(user, 'admin')} className="block w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded flex items-center gap-2"><Shield size={12}/> Admin</button>
                                        </>
                                    )}
                                </div>
                             </div>
                          </div>
                       ) : (
                          <span className="text-[10px] font-bold uppercase text-gray-500">{getRoleLabel(user.role)}</span>
                       )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 relative z-10">
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingUser(user); }} 
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" 
                          title="Editar Usuário Completo"
                        >
                          <Edit size={16} />
                        </button>
                        
                        {/* BUTTON: HIGHLIGHT (ZAP/LIGHTNING) */}
                        {(role === 'pro' || role === 'business') && (
                           <button 
                             type="button"
                             onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                setHighlightModalUser(user); 
                             }} 
                             className={`p-1.5 rounded hover:bg-yellow-100 transition-colors cursor-pointer relative z-20 ${isHighlighted(user) ? 'text-yellow-600' : 'text-gray-300 hover:text-yellow-600'}`}
                             title="Gerenciar Destaque (Topo da Lista)"
                           >
                              <Zap size={16} fill={isHighlighted(user) ? "currentColor" : "none"} />
                           </button>
                        )}

                        {user.status === 'locked' && (
                          <button type="button" onClick={() => handleUnlock(user)} className="text-green-600 hover:bg-green-50 p-1.5 rounded" title="Desbloquear">
                            <Unlock size={16} />
                          </button>
                        )}
                        {user.role !== 'master' && (
                          <button 
                            type="button"
                            onClick={() => handleBan(user)} 
                            className={`${user.status === 'banned' ? 'text-green-600' : 'text-red-500'} hover:bg-gray-100 p-1.5 rounded`}
                            title={user.status === 'banned' ? "Desbanir" : "Banir"}
                          >
                            {user.status === 'banned' ? <CheckCircle size={16} /> : <Ban size={16} />}
                          </button>
                        )}
                        {canDelete(user) && (
                          <button type="button" onClick={() => { if(confirm('Excluir este usuário permanentemente?')) onDeleteUser(user.id) }} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
};

// --- SUB-COMPONENT: EDIT USER MODAL ---
const EditUserModal = ({ 
   user, 
   onClose, 
   onSave, 
   compressImage 
}: { 
   user: User, 
   onClose: () => void, 
   onSave: (u: User) => void,
   compressImage: (f: File) => Promise<string>
}) => {
   const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      cpf: user.cpf || '',
      rg: user.rg || '',
      cnpj: user.cnpj || '',
      category: user.category || '',
      businessDescription: user.businessDescription || '',
      avatarUrl: user.avatarUrl || '',
      coverUrl: user.coverUrl || '',
      role: user.role,
      status: user.status
   });
   
   const [customCategory, setCustomCategory] = useState('');
   const isProOrBusiness = formData.role === 'pro' || formData.role === 'business';

   const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'coverUrl') => {
      if (e.target.files && e.target.files[0]) {
         try {
            const base64 = await compressImage(e.target.files[0]);
            setFormData(prev => ({ ...prev, [field]: base64 }));
         } catch (err) {
            alert("Erro ao processar imagem");
         }
      }
   };

   const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      let finalCat = formData.category;
      if (finalCat === 'outros') finalCat = customCategory;

      onSave({
         ...user,
         ...formData,
         category: finalCat
      });
   };

   return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
               <h3 className="font-bold flex items-center gap-2"><Edit size={20}/> Editar Usuário: {user.name}</h3>
               <button onClick={onClose}><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
               <form onSubmit={handleSave} className="space-y-6">
                  
                  {/* Photos Section */}
                  <div className="flex gap-4 items-center">
                     <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-100 shadow-sm">
                           {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover"/> : <Users size={30} className="m-auto mt-8 opacity-50"/>}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                           <Camera size={20}/>
                           <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'avatarUrl')}/>
                        </label>
                     </div>
                     
                     <div className="relative group flex-1 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 border-dashed">
                        {formData.coverUrl ? <img src={formData.coverUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-xs text-gray-500 font-bold">Capa do Perfil (Opcional)</div>}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity font-bold">
                           <ImageIcon size={20} className="mr-2"/> Alterar Capa
                           <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'coverUrl')}/>
                        </label>
                     </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo / Fantasia</label>
                         <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Apenas visualização)</label>
                        <input type="text" value={formData.email} disabled className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed"/>
                     </div>
                  </div>

                  {/* Documents Section */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FileText size={12} /> Documentos</h4>
                     <div className="grid grid-cols-3 gap-3">
                        <div>
                           <label className="block text-[10px] font-bold text-gray-400 uppercase">CPF</label>
                           <input type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-gray-400 uppercase">RG</label>
                           <input type="text" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-gray-400 uppercase">CNPJ</label>
                           <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                        </div>
                     </div>
                  </div>

                  {/* Role & Category */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Conta</label>
                         <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full border p-2 rounded bg-white">
                            <option value="client">Cliente</option>
                            <option value="pro">Prestador</option>
                            <option value="business">Comércio</option>
                            <option value="admin">Admin</option>
                         </select>
                     </div>
                     
                     {isProOrBusiness && (
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                           <select 
                              value={CATEGORIES.find(c => c.name === formData.category) ? formData.category : 'outros'} 
                              onChange={e => setFormData({...formData, category: e.target.value})} 
                              className="w-full border p-2 rounded bg-white"
                           >
                              {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              <option value="outros">Outra / Personalizada</option>
                           </select>
                           {(formData.category === 'outros' || !CATEGORIES.find(c => c.name === formData.category)) && (
                              <input 
                                 type="text" 
                                 placeholder="Digite a categoria..."
                                 value={customCategory || (CATEGORIES.find(c => c.name === formData.category) ? '' : formData.category)}
                                 onChange={e => setCustomCategory(e.target.value)}
                                 className="w-full border p-2 rounded mt-2 bg-blue-50 border-blue-200"
                              />
                           )}
                        </div>
                     )}
                  </div>

                  {/* Description */}
                  {isProOrBusiness && (
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Descrição</label>
                        <textarea 
                           rows={3}
                           value={formData.businessDescription}
                           onChange={e => setFormData({...formData, businessDescription: e.target.value})}
                           className="w-full border p-2 rounded"
                           placeholder="Descrição que aparece no cartão do usuário..."
                        />
                     </div>
                  )}

                  <div className="pt-4 border-t flex justify-end gap-3">
                     <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold">Cancelar</button>
                     <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-sm flex items-center gap-2">
                        <Save size={18} /> Salvar Alterações
                     </button>
                  </div>

               </form>
            </div>
         </div>
      </div>
   );
}


const AdminPanel: React.FC<AdminPanelProps> = ({ 
  currentUser, 
  users: initialUsers, 
  appConfig, 
  onUpdateConfig, 
  onUpdateUser, 
  onDeleteUser,
  onLogout,
  onShareApp
}) => {
  // Local state for FULL user list (including hidden clients)
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers || []);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Reset Password State
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingConfig, setEditingConfig] = useState<AppConfig>(appConfig);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [canvasText, setCanvasText] = useState("Oferta Especial!");
  const [canvasBgColor, setCanvasBgColor] = useState(appConfig.primaryColor);
  const [canvasTextColor, setCanvasTextColor] = useState("#ffffff");
  const [canvasFontSize, setCanvasFontSize] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [marketingCopy, setMarketingCopy] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    name: currentUser.name, 
    email: currentUser.email, 
    password: '',
    avatarUrl: currentUser.avatarUrl || ''
  });
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  
  // Highlight Modal State
  const [highlightModalUser, setHighlightModalUser] = useState<User | null>(null);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
     name: '',
     email: '',
     password: '',
     role: 'client' as UserRole,
     category: '',
     customCategory: '',
     description: '',
     avatarUrl: ''
  });

  // --- ADMIN PRIVILEGED FETCH ---
  // Since the main App.tsx hides clients, the Admin Panel must fetch them independently.
  useEffect(() => {
     console.log("Admin Panel mounted: Fetching FULL database...");
     const usersRef = ref(db, 'users');
     
     // Listen for updates in real-time
     const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
           const fullList: User[] = Object.keys(data).map(key => ({
              ...data[key], 
              id: key,
              role: data[key].role || 'client' // Fallback role if missing
           }));
           setAllUsers(fullList);
        } else {
           setAllUsers([]);
        }
        setIsLoadingUsers(false);
     }, (error) => {
        console.error("Firebase Read Error:", error);
        setIsLoadingUsers(false);
     });

     return () => unsubscribe();
  }, []);

  const handleForceReload = async () => {
     setIsLoadingUsers(true);
     try {
       const snapshot = await get(ref(db, 'users'));
       if (snapshot.exists()) {
          const data = snapshot.val();
          const fullList: User[] = Object.keys(data).map(key => ({
             ...data[key], 
             id: key,
             role: data[key].role || 'client'
          }));
          setAllUsers(fullList);
          alert("Dados recarregados com sucesso!");
       } else {
          setAllUsers([]);
       }
     } catch (err) {
       console.error(err);
       alert("Erro ao recarregar dados.");
     } finally {
       setIsLoadingUsers(false);
     }
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canDelete = (targetUser: User) => {
    if (targetUser.role === 'master') return false; 
    if (currentUser.role === 'master') return true; 
    if (currentUser.role === 'admin' && targetUser.role === 'admin') return false; 
    return true; 
  };
  
  const handleBackup = () => {
    const usersMap = allUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);

    const backupData = {
      users: usersMap,
      config: appConfig,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.email,
        version: "1.0",
        type: "full_backup"
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bkp-oquetemperto-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleGenerateManual = () => {
    const manualContent = `
# MANUAL TÉCNICO E BACKUP - ${appConfig.appName}
Gerado em: ${new Date().toLocaleString()} por ${currentUser.email}
... (conteúdo do manual) ...
`;
    const blob = new Blob([manualContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INSTRUCOES_RESTORE_${appConfig.appName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreClick = () => {
    if (restoreInputRef.current) {
      restoreInputRef.current.click();
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmMessage = "⚠️ ATENÇÃO CRÍTICA ⚠️\n\nEssa ação irá SUBSTITUIR TODOS os dados atuais do banco de dados (usuários, lojas, configurações) pelos dados do arquivo selecionado.\n\nEssa ação não pode ser desfeita.\n\nDeseja realmente continuar?";
    if (!window.confirm(confirmMessage)) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);
        if (!parsedData.users && !parsedData.config) {
          throw new Error("Arquivo de backup inválido ou formato desconhecido.");
        }
        if (parsedData.users) {
          await set(ref(db, 'users'), parsedData.users);
        }
        if (parsedData.config) {
          await set(ref(db, 'config'), parsedData.config);
        }
        alert("✅ Restauração concluída com sucesso! O aplicativo foi atualizado.");
        window.location.reload();
      } catch (err: any) {
        console.error("Restore Error:", err);
        alert(`❌ Erro ao restaurar: ${err.message}`);
      } finally {
         if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreatingUser(true);
      let secondaryApp: any = null;
      let finalCategory = newUserForm.category;
      if (finalCategory === 'outros') finalCategory = newUserForm.customCategory;
      try {
          secondaryApp = initializeFireApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getSecondaryAuth(secondaryApp);
          const userCred = await createUserWithEmailAndPassword(secondaryAuth, newUserForm.email, newUserForm.password);
          const uid = userCred.user.uid;
          const newUser: User = {
             id: uid,
             name: newUserForm.name,
             email: newUserForm.email,
             role: newUserForm.role,
             status: 'active',
             failedLoginAttempts: 0,
             category: (newUserForm.role === 'pro' || newUserForm.role === 'business') ? finalCategory : undefined,
             businessDescription: newUserForm.description,
             avatarUrl: newUserForm.avatarUrl || '',
             favorites: []
          };
          await set(ref(db, `users/${uid}`), newUser);
          await signOutSecondary(secondaryAuth);
          alert(`Usuário ${newUserForm.name} (${newUserForm.role}) criado com sucesso!`);
          setShowCreateUser(false);
          setNewUserForm({ name: '', email: '', password: '', role: 'client', category: '', customCategory: '', description: '', avatarUrl: '' });
      } catch (error: any) {
         console.error("Create User Error:", error);
         alert("Erro ao criar usuário: " + error.message);
      } finally {
         if (secondaryApp) {
            await deleteApp(secondaryApp);
         }
         setIsCreatingUser(false);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma foto menor que 4MB.");
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        setProfileForm(prev => ({ ...prev, avatarUrl: compressedBase64 }));
      } catch (err) {
        console.error("Image error", err);
        alert("Erro ao processar imagem.");
      }
    }
  };

  const handleNewUserAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressedBase64 = await compressImage(e.target.files[0]);
        setNewUserForm(prev => ({ ...prev, avatarUrl: compressedBase64 }));
      } catch (err) { alert("Erro na imagem."); }
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.password && currentUser.role === 'master') {
       const confirmed = window.confirm(`Confirmação enviada para ${profileForm.email}. Deseja alterar a senha?`);
       if (!confirmed) return;
    }
    onUpdateUser({ 
      ...currentUser, 
      name: profileForm.name, 
      email: profileForm.email,
      avatarUrl: profileForm.avatarUrl
    });
    setIsEditingProfile(false);
    alert("Dados atualizados com sucesso!");
  };

  const applyHighlight = (days: number) => {
    if (!highlightModalUser) return;
    const date = new Date();
    date.setDate(date.getDate() + days);
    onUpdateUser({ 
      ...highlightModalUser, 
      highlightExpiresAt: date.toISOString() 
    });
    setHighlightModalUser(null);
    alert(`Destaque aplicado com sucesso por ${days} dias! O usuário aparecerá no topo.`);
  };

  const removeHighlight = () => {
    if (!highlightModalUser) return;
    onUpdateUser({ 
      ...highlightModalUser, 
      highlightExpiresAt: undefined 
    });
    setHighlightModalUser(null);
    alert("Destaque removido.");
  };

  useEffect(() => {
    if (activeTab === 'tools') {
      setTimeout(drawCanvas, 100);
    }
  }, [canvasText, canvasBgColor, canvasTextColor, canvasFontSize, activeTab, appConfig.appName]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasTextColor;
    ctx.font = `bold ${canvasFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(canvasText, canvas.width / 2, canvas.height / 2);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(appConfig.appName, canvas.width / 2, canvas.height - 25);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `post-${appConfig.appName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyText = () => {
    if (!marketingCopy) return;
    navigator.clipboard.writeText(marketingCopy)
      .then(() => alert("Texto copiado para a área de transferência!"))
      .catch(() => alert("Erro ao copiar texto."));
  };

  const downloadLogo = () => {
     const canvas = document.createElement('canvas');
     canvas.width = 500;
     canvas.height = 500;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     ctx.fillStyle = editingConfig.primaryColor;
     ctx.beginPath();
     ctx.arc(250, 250, 240, 0, Math.PI * 2);
     ctx.fill();
     ctx.fillStyle = "#ffffff";
     ctx.font = "bold 40px Arial";
     ctx.textAlign = "center";
     ctx.textBaseline = "middle";
     ctx.fillText(editingConfig.appName, 250, 250);
     const link = document.createElement('a');
     link.download = 'logo-generated.png';
     link.href = canvas.toDataURL('image/png');
     link.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setEditingConfig(prev => ({ ...prev, logoUrl: url }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
      <input 
        type="file" 
        ref={restoreInputRef} 
        onChange={handleRestoreFile} 
        accept=".json" 
        className="hidden" 
      />
      
      {/* --- HIGHLIGHT MODAL (Added to fix the lightning bolt issue) --- */}
      {highlightModalUser && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
               <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                  <Zap size={24} fill="currentColor" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-1">Destacar {highlightModalUser.name}</h3>
               <p className="text-sm text-gray-500 mb-6">
                  Usuários destacados aparecem no topo das listas e na tela inicial do app.
               </p>
               
               <div className="space-y-3">
                  <button onClick={() => applyHighlight(7)} className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg transition-colors">
                     Destacar por 7 Dias
                  </button>
                  <button onClick={() => applyHighlight(15)} className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors">
                     Destacar por 15 Dias
                  </button>
                  <button onClick={() => applyHighlight(30)} className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors">
                     Destacar por 30 Dias
                  </button>
                  
                  {isHighlighted(highlightModalUser) && (
                     <button onClick={removeHighlight} className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 mt-4">
                        Remover Destaque Atual
                     </button>
                  )}
                  
                  <button onClick={() => setHighlightModalUser(null)} className="w-full py-2 text-gray-400 font-medium text-sm mt-2 hover:text-gray-600">
                     Cancelar
                  </button>
               </div>
            </div>
         </div>
      )}

      {editingUser && (
         <EditUserModal 
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(updatedUser) => {
               onUpdateUser(updatedUser);
               setEditingUser(null);
               alert("Usuário atualizado com sucesso!");
            }}
            compressImage={compressImage}
         />
      )}
      {showCreateUser && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2">
                     <UserPlus size={20} /> Criar Novo Usuário
                  </h3>
                  <button onClick={() => setShowCreateUser(false)} className="hover:bg-blue-700 p-1 rounded">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                     <div className="flex justify-center mb-4">
                        <div className="relative group">
                           <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-dashed border-gray-400">
                              {newUserForm.avatarUrl ? (
                                 <img src={newUserForm.avatarUrl} className="w-full h-full object-cover" />
                              ) : (
                                 <div className="flex items-center justify-center h-full text-xs text-gray-400">Foto</div>
                              )}
                           </div>
                           <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full">
                              <Camera size={20}/>
                              <input type="file" className="hidden" accept="image/*" onChange={handleNewUserAvatar}/>
                           </label>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Conta</label>
                        <select 
                           className="w-full border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                           value={newUserForm.role}
                           onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                        >
                           <option value="client">Cliente</option>
                           <option value="pro">Prestador de Serviço</option>
                           <option value="business">Comércio / Loja</option>
                           <option value="admin">Administrador</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo / Fantasia</label>
                        <input 
                           type="text" 
                           required 
                           className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           value={newUserForm.name}
                           onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email (Login)</label>
                        <input 
                           type="email" 
                           required 
                           className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           value={newUserForm.email}
                           onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Senha Provisória</label>
                        <input 
                           type="password" 
                           required 
                           minLength={6}
                           placeholder="Mínimo 6 caracteres"
                           className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           value={newUserForm.password}
                           onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                        />
                     </div>
                     {(newUserForm.role === 'pro' || newUserForm.role === 'business') && (
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                           <select 
                              className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newUserForm.category}
                              onChange={(e) => setNewUserForm({...newUserForm, category: e.target.value})}
                              required
                           >
                              <option value="">Selecione...</option>
                              {CATEGORIES.map(cat => (
                                 <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                              <option value="outros">Outra (Personalizada)</option>
                           </select>
                           {newUserForm.category === 'outros' && (
                              <input 
                                 type="text" 
                                 placeholder="Digite a categoria..."
                                 value={newUserForm.customCategory}
                                 onChange={e => setNewUserForm({...newUserForm, customCategory: e.target.value})}
                                 className="w-full border p-2 rounded-lg mt-2 bg-blue-50 border-blue-200"
                                 required
                              />
                           )}
                        </div>
                     )}
                     {(newUserForm.role === 'pro' || newUserForm.role === 'business') && (
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-1">Descrição Curta</label>
                           <textarea
                              rows={2} 
                              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                              value={newUserForm.description}
                              onChange={(e) => setNewUserForm({...newUserForm, description: e.target.value})}
                           />
                        </div>
                     )}
                     <div className="pt-4">
                        <button 
                           type="submit" 
                           disabled={isCreatingUser}
                           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {isCreatingUser ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                           Criar Usuário
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      )}

      {showDebug && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/70 p-4">
           <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                    <Code /> Debug de Dados (Apenas para Master)
                 </h3>
                 <button onClick={() => setShowDebug(false)}><X /></button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded font-mono text-xs">
                 <p className="text-gray-400 mb-2">// Total de Usuários Carregados pelo Admin: {allUsers.length}</p>
                 <pre>{JSON.stringify(allUsers.length > 0 ? allUsers[0] : { error: "No users found" }, null, 2)}</pre>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar with Mobile Toggle */}
      <aside className={`bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col md:h-screen sticky top-0 z-50 transition-all duration-300 ${mobileMenuOpen ? 'h-auto' : 'h-auto'}`}>
        
        {/* Header (Visible always) */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="flex flex-col">
             <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-blue-400" /> 
                <span className="hidden md:inline">Painel Admin</span>
                <span className="md:hidden">Admin</span>
             </h2>
             <div className="md:hidden mt-1 text-xs text-gray-400">{currentUser.name.split(' ')[0]}</div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center gap-3 mt-4">
             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold overflow-hidden">
               {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  currentUser.name.charAt(0)
               )}
             </div>
             <div>
               <p className="text-sm font-semibold">{currentUser.name}</p>
               <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
             </div>
          </div>
        </div>

        {/* Navigation (Collapsible on Mobile) */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block flex-1 p-4 space-y-2 overflow-y-auto`}>
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Users size={18} /> Visão Geral
          </button>
          
          <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-4">Usuários</div>
          <button onClick={() => handleTabChange('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'clients' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Users size={18} /> Clientes
          </button>
          <button onClick={() => handleTabChange('businesses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'businesses' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Store size={18} /> Comércios
          </button>
          <button onClick={() => handleTabChange('pros')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'pros' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Briefcase size={18} /> Prestadores
          </button>
          
          {currentUser.role === 'master' && (
             <>
               <button onClick={() => handleTabChange('admins')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                  <Shield size={18} className="text-purple-400" /> Admins
               </button>
               <div className="pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-4">Sistema</div>
               <button onClick={() => handleTabChange('customization')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customization' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                  <Palette size={18} /> Aparência
               </button>
             </>
          )}

          <button onClick={() => handleTabChange('tools')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Share2 size={18} /> Marketing e Backup
          </button>

          <button onClick={() => handleTabChange('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <AlignLeft size={18} /> Meu Perfil
          </button>
        </div>

        {/* Footer */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block p-4 border-t border-gray-800`}>
          <button 
            onClick={() => setShowCreateUser(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 mb-3"
          >
            <UserPlus size={18} /> Novo Usuário
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* LOADING STATE */}
        {isLoadingUsers && (
           <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
              <RefreshCw className="animate-spin" />
              Sincronizando banco de dados completo...
           </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Visão Geral</h1>
              <p className="text-gray-500">Bem-vindo ao painel de controle do {appConfig.appName}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Total Usuários</p>
                  <p className="text-2xl font-bold text-gray-800">{allUsers.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg text-green-600"><Briefcase size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Prestadores</p>
                  <p className="text-2xl font-bold text-gray-800">{allUsers.filter(u => u.role === 'pro').length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Store size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Comércios</p>
                  <p className="text-2xl font-bold text-gray-800">{allUsers.filter(u => u.role === 'business').length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600"><Zap size={24} /></div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Destaques Ativos</p>
                  <p className="text-2xl font-bold text-gray-800">{allUsers.filter(u => isHighlighted(u)).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
               <div className="relative z-10 max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">Aumente o engajamento!</h2>
                  <p className="mb-6 text-blue-100">Crie banners personalizados para compartilhar nas redes sociais e atrair mais usuários e profissionais para a plataforma.</p>
                  <button onClick={() => setActiveTab('tools')} className="bg-white text-blue-800 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-md">
                     Criar Materiais de Marketing
                  </button>
               </div>
               <Share2 size={200} className="absolute -right-10 -bottom-10 text-white opacity-10" />
            </div>
            
            {/* Quick Actions for Debugging */}
            {currentUser.role === 'master' && (
               <div className="text-right">
                  <button onClick={handleForceReload} className="text-xs text-gray-400 hover:text-gray-600 underline mr-4">Forçar Recarregamento</button>
                  <button onClick={() => setShowDebug(true)} className="text-xs text-red-300 hover:text-red-500 underline">Debug Mode</button>
               </div>
            )}
          </div>
        )}

        {/* --- USERS TABS --- */}
        {activeTab === 'clients' && <UserTable role="client" title="Gerenciar Clientes" icon={Users} users={allUsers} currentUser={currentUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} setHighlightModalUser={setHighlightModalUser} setEditingUser={setEditingUser} canDelete={canDelete} isLoading={isLoadingUsers} />}
        {activeTab === 'pros' && <UserTable role="pro" title="Gerenciar Prestadores" icon={Briefcase} users={allUsers} currentUser={currentUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} setHighlightModalUser={setHighlightModalUser} setEditingUser={setEditingUser} canDelete={canDelete} isLoading={isLoadingUsers} />}
        {activeTab === 'businesses' && <UserTable role="business" title="Gerenciar Comércios" icon={Store} users={allUsers} currentUser={currentUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} setHighlightModalUser={setHighlightModalUser} setEditingUser={setEditingUser} canDelete={canDelete} isLoading={isLoadingUsers} />}
        {activeTab === 'admins' && <UserTable role="admin" title="Gerenciar Administradores" icon={Shield} users={allUsers} currentUser={currentUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} setHighlightModalUser={setHighlightModalUser} setEditingUser={setEditingUser} canDelete={canDelete} isLoading={isLoadingUsers} />}

        {/* --- CUSTOMIZATION TAB --- */}
        {activeTab === 'customization' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Palette className="text-purple-500"/> Identidade Visual e Configurações</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Aplicativo</label>
                         <input type="text" value={editingConfig.appName} onChange={(e) => setEditingConfig({...editingConfig, appName: e.target.value})} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                      </div>

                      {/* New Field */}
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Subtítulo do Cabeçalho</label>
                         <input type="text" value={editingConfig.headerSubtitle || ''} onChange={(e) => setEditingConfig({...editingConfig, headerSubtitle: e.target.value})} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Águas Claras e Região" />
                      </div>
                      
                      {/* NOVOS CAMPOS DE SUPORTE E PIX */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                         <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Contatos e Pagamentos</h3>
                         <div className="space-y-3">
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">Chave Pix (Contribuição)</label>
                               <input 
                                 type="text" 
                                 value={editingConfig.pixKey || ''} 
                                 onChange={(e) => setEditingConfig({...editingConfig, pixKey: e.target.value})} 
                                 className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                 placeholder="Ex: email@pix.com"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">Email de Suporte (App)</label>
                               <input 
                                 type="text" 
                                 value={editingConfig.supportEmail || ''} 
                                 onChange={(e) => setEditingConfig({...editingConfig, supportEmail: e.target.value})} 
                                 className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                 placeholder="Ex: suporte@app.com"
                               />
                            </div>
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Cor Primária (Principal)</label>
                         <div className="flex gap-2">
                            <input type="color" value={editingConfig.primaryColor} onChange={(e) => setEditingConfig({...editingConfig, primaryColor: e.target.value})} className="h-10 w-20 rounded cursor-pointer" />
                            <input type="text" value={editingConfig.primaryColor} onChange={(e) => setEditingConfig({...editingConfig, primaryColor: e.target.value})} className="flex-1 border p-2 rounded-lg uppercase" />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Cor Secundária (Destaque/Botões)</label>
                         <div className="flex gap-2">
                            <input type="color" value={editingConfig.accentColor} onChange={(e) => setEditingConfig({...editingConfig, accentColor: e.target.value})} className="h-10 w-20 rounded cursor-pointer" />
                            <input type="text" value={editingConfig.accentColor} onChange={(e) => setEditingConfig({...editingConfig, accentColor: e.target.value})} className="flex-1 border p-2 rounded-lg uppercase" />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Cor Terciária (Comércio/WhatsApp)</label>
                         <div className="flex gap-2">
                            <input type="color" value={editingConfig.tertiaryColor} onChange={(e) => setEditingConfig({...editingConfig, tertiaryColor: e.target.value})} className="h-10 w-20 rounded cursor-pointer" />
                            <input type="text" value={editingConfig.tertiaryColor} onChange={(e) => setEditingConfig({...editingConfig, tertiaryColor: e.target.value})} className="flex-1 border p-2 rounded-lg uppercase" />
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 h-fit">
                      <p className="text-sm font-bold text-gray-500 mb-4">Logo do Aplicativo</p>
                      <div className="w-32 h-32 bg-white rounded-full shadow-md flex items-center justify-center mb-4 overflow-hidden relative group">
                         {editingConfig.logoUrl ? <img src={editingConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2"/> : <AppLogo className="w-20 h-20"/>}
                      </div>
                      <div className="flex gap-2">
                        <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 cursor-pointer shadow-sm">
                           <Upload size={16} className="inline mr-2"/> Carregar Logo
                           <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                        </label>
                        <button onClick={downloadLogo} className="text-blue-600 hover:underline text-xs">Gerar Logo Padrão</button>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end">
                   <button onClick={() => onUpdateConfig(editingConfig)} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold shadow-md flex items-center gap-2">
                      <Save size={20} /> Salvar e Aplicar
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- TOOLS TAB (Marketing & Backup) --- */}
        {activeTab === 'tools' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Share2 className="text-blue-500"/> Gerador de Post para Redes Sociais</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Texto Principal</label>
                         <input type="text" value={canvasText} onChange={(e) => setCanvasText(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Cor de Fundo</label>
                            <input type="color" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0" />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Cor do Texto</label>
                            <input type="color" value={canvasTextColor} onChange={(e) => setCanvasTextColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border-0" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho da Fonte: {canvasFontSize}px</label>
                         <input type="range" min="20" max="80" value={canvasFontSize} onChange={(e) => setCanvasFontSize(parseInt(e.target.value))} className="w-full" />
                      </div>
                      <button onClick={downloadCanvas} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                         <Download size={20} /> Baixar Imagem (PNG)
                      </button>
                   </div>
                   <div className="flex items-center justify-center bg-gray-100 rounded-xl p-4">
                      <canvas ref={canvasRef} width={400} height={400} className="rounded-lg shadow-lg max-w-full h-auto" />
                   </div>
                </div>
             </div>
             
             {/* Copywriting Generator */}
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Type className="text-green-600"/> Gerador de Legenda</h2>
               <div className="flex gap-2 mb-4">
                  <button onClick={() => setMarketingCopy(`🚀 Procurando os melhores serviços em ${appConfig.appName.split(' ')[0]}? Baixe agora o nosso app e encontre tudo o que precisa perto de você! #Serviços #${appConfig.appName.replace(/\s/g, '')}`)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold">Opção 1 (Geral)</button>
                  <button onClick={() => setMarketingCopy(`🍔 Bateu aquela fome? Ou precisando de um reparo urgente? 🔧 O ${appConfig.appName} conecta você aos melhores profissionais da região! Baixe grátis.`)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold">Opção 2 (Promo)</button>
               </div>
               <textarea value={marketingCopy} onChange={(e) => setMarketingCopy(e.target.value)} className="w-full border p-3 rounded-lg h-24 mb-2" placeholder="Selecione uma opção acima ou escreva seu texto..."></textarea>
               <button onClick={handleCopyText} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"><Copy size={14}/> Copiar Texto</button>
             </div>

             {/* Backup Section */}
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Database className="text-orange-500"/> Backup e Segurança</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                     <h3 className="font-bold text-orange-800 mb-2">Exportar Dados</h3>
                     <p className="text-sm text-orange-700 mb-4">Baixe uma cópia completa de segurança do banco de dados (JSON).</p>
                     <button onClick={handleBackup} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold text-sm w-full flex items-center justify-center gap-2"><Download size={16}/> Fazer Backup Agora</button>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                     <h3 className="font-bold text-red-800 mb-2">Restaurar Backup</h3>
                     <p className="text-sm text-red-700 mb-4">⚠️ Substitui todos os dados atuais por um arquivo de backup.</p>
                     <button onClick={handleRestoreClick} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm w-full flex items-center justify-center gap-2"><FileUp size={16}/> Carregar Arquivo de Backup</button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t text-center">
                   <button onClick={handleGenerateManual} className="text-gray-500 hover:text-gray-800 text-sm underline">Baixar Manual Técnico PDF/TXT</button>
                </div>
             </div>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
           <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 animate-in fade-in">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Meu Perfil de Administrador</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                       <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-50 shadow-md">
                          {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-400">{profileForm.name.charAt(0)}</div>}
                       </div>
                       {isEditingProfile && (
                          <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera size={30} />
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if(e.target.files && e.target.files[0]) compressImage(e.target.files[0]).then(url => setProfileForm({...profileForm, avatarUrl: url}));
                             }} />
                          </label>
                       )}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                    <input type="text" disabled={!isEditingProfile} value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full border p-3 rounded-lg disabled:bg-gray-50" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input type="email" disabled={!isEditingProfile} value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full border p-3 rounded-lg disabled:bg-gray-50" />
                 </div>
                 {isEditingProfile && currentUser.role === 'master' && (
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Nova Senha (Opcional)</label>
                       <div className="relative">
                          <input type={showProfilePassword ? "text" : "password"} value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} className="w-full border p-3 rounded-lg pr-10" placeholder="Deixe em branco para manter a atual" />
                          <button type="button" onClick={() => setShowProfilePassword(!showProfilePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                             {showProfilePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                       <p className="text-xs text-gray-500 mt-1">Ao alterar a senha, um email de confirmação será enviado.</p>
                    </div>
                 )}

                 <div className="pt-4 border-t flex justify-end gap-4">
                    {isEditingProfile ? (
                       <>
                          <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-bold">Cancelar</button>
                          <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">Salvar Alterações</button>
                       </>
                    ) : (
                       <button type="button" onClick={() => setIsEditingProfile(true)} className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-bold flex items-center gap-2">
                          <Edit size={18} /> Editar Perfil
                       </button>
                    )}
                 </div>
              </form>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;

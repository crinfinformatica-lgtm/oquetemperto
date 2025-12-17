import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Palette, Image as ImageIcon, Save, LogOut, Zap, Smartphone, Menu, Hammer, ExternalLink, Siren, FileDown, Settings, CheckCircle, FileText, Globe, MapPin, Phone, Instagram, Facebook, ShieldAlert, Mail, AlertTriangle, Info, Clock, Calendar, X, RefreshCw, Upload, Download, Copy, Code, Link as LinkIcon
} from 'lucide-react';
import { db } from '../services/firebase';
import { ref, update, onValue, remove } from 'firebase/database';

interface PainelAdministrativoProps {
  currentUser: User;
  users: User[];
  appConfig: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
  onShareApp: () => void;
}

type AdminTab = 'dashboard' | 'clients' | 'pros' | 'businesses' | 'admins' | 'config' | 'tools';

const PainelAdministrativo: React.FC<PainelAdministrativoProps> = ({ 
  currentUser, 
  appConfig, 
  onUpdateConfig, 
  onUpdateUser, 
  onDeleteUser, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [configForm, setConfigForm] = useState<AppConfig>(appConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as User[];
        setLocalUsers(userList);
      } else {
        setLocalUsers([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setConfigForm(appConfig);
  }, [appConfig]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await onUpdateConfig(configForm);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'master': return <Shield className="text-purple-600" />;
      case 'admin': return <Shield className="text-blue-600" />;
      case 'business': return <Store className="text-green-600" />;
      case 'pro': return <Briefcase className="text-orange-600" />;
      default: return <Users className="text-gray-600" />;
    }
  };

  const filteredUsers = (role: string) => {
    if (role === 'admin') return localUsers.filter(u => u.role === 'admin' || u.role === 'master');
    return localUsers.filter(u => u.role === role);
  };

  const renderUserList = (role: UserRole | 'admin') => {
    const list = filteredUsers(role);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            {getRoleIcon(role as UserRole)}
            Gerenciar {role === 'pro' ? 'Prestadores' : role === 'business' ? 'Comércios' : role === 'client' ? 'Clientes' : 'Administradores'}
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{list.length}</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="p-3">Nome / Email</th>
                <th className="p-3">Detalhes</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(user => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</div>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-xs text-gray-600">
                      {user.category || 'N/A'} {user.neighborhood ? `• ${user.neighborhood}` : ''}
                    </p>
                    {user.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Smartphone size={10}/> {user.phone}</p>}
                  </td>
                  <td className="p-3">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                     </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                         onClick={() => {
                            if(window.confirm(`Deseja ${user.status === 'active' ? 'bloquear' : 'desbloquear'} este usuário?`)) {
                               onUpdateUser({...user, status: user.status === 'active' ? 'banned' : 'active'});
                            }
                         }}
                         className={`p-1.5 rounded hover:bg-gray-200 ${user.status === 'active' ? 'text-orange-500' : 'text-green-500'}`} 
                         title={user.status === 'active' ? "Bloquear" : "Ativar"}
                      >
                         {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button 
                        onClick={() => {
                           if(window.confirm('Tem certeza que deseja EXCLUIR este usuário? Essa ação é irreversível.')) {
                              onDeleteUser(user.id);
                           }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto z-10">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-xl font-bold text-primary flex items-center gap-2">
             <Shield className="fill-primary text-white" /> Painel
           </h2>
           <p className="text-xs text-gray-500 mt-1">Admin O Que Tem Perto?</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Zap size={18} /> Visão Geral
          </button>
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase px-4">Usuários</div>
          <button onClick={() => setActiveTab('pros')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'pros' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Briefcase size={18} /> Prestadores
          </button>
          <button onClick={() => setActiveTab('businesses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'businesses' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Store size={18} /> Comércios
          </button>
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'clients' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Users size={18} /> Clientes
          </button>
          <button onClick={() => setActiveTab('admins')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'admins' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Shield size={18} /> Admins
          </button>
          
          <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase px-4">Sistema</div>
          <button onClick={() => setActiveTab('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'config' ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Palette size={18} /> Aparência e Config
          </button>
          <button onClick={() => setActiveTab('tools')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'tools' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Hammer size={18} /> Ferramentas
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
           <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">
              <LogOut size={18} /> Sair do Painel
           </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 z-20">
         <span className="font-bold text-lg text-primary">Painel Admin</span>
         <button onClick={() => {}} className="p-2 text-gray-600"><Menu /></button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 capitalize">
          {activeTab === 'dashboard' ? 'Visão Geral' : 
           activeTab === 'pros' ? 'Gerenciar Prestadores' :
           activeTab === 'businesses' ? 'Gerenciar Comércios' :
           activeTab === 'config' ? 'Configurações do App' :
           activeTab === 'tools' ? 'Ferramentas' :
           activeTab}
        </h1>

        {isLoading ? (
           <div className="flex items-center justify-center h-64 text-gray-500">
              Carregando dados...
           </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-gray-500 text-xs font-bold uppercase">Prestadores</p>
                           <h3 className="text-3xl font-bold text-orange-600 mt-1">{filteredUsers('pro').length}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Briefcase size={24} /></div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-gray-500 text-xs font-bold uppercase">Comércios</p>
                           <h3 className="text-3xl font-bold text-green-600 mt-1">{filteredUsers('business').length}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg text-green-600"><Store size={24} /></div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-gray-500 text-xs font-bold uppercase">Clientes</p>
                           <h3 className="text-3xl font-bold text-blue-600 mt-1">{filteredUsers('client').length}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users size={24} /></div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'pros' && renderUserList('pro')}
            {activeTab === 'businesses' && renderUserList('business')}
            {activeTab === 'clients' && renderUserList('client')}
            {activeTab === 'admins' && renderUserList('admin')}

            {activeTab === 'config' && (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
                  <div className="p-6 border-b border-gray-100">
                     <h3 className="font-bold text-gray-800">Personalização do Aplicativo</h3>
                     <p className="text-sm text-gray-500">Altere cores, textos e links globais.</p>
                  </div>
                  <div className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Nome do App</label>
                           <input type="text" value={configForm.appName} onChange={e => setConfigForm({...configForm, appName: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo do Header</label>
                           <input type="text" value={configForm.headerSubtitle} onChange={e => setConfigForm({...configForm, headerSubtitle: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Cor Primária</label>
                           <div className="flex gap-2">
                              <input type="color" value={configForm.primaryColor} onChange={e => setConfigForm({...configForm, primaryColor: e.target.value})} className="h-10 w-10 cursor-pointer border rounded" />
                              <input type="text" value={configForm.primaryColor} onChange={e => setConfigForm({...configForm, primaryColor: e.target.value})} className="flex-1 p-2 border rounded uppercase" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Cor de Destaque</label>
                           <div className="flex gap-2">
                              <input type="color" value={configForm.accentColor} onChange={e => setConfigForm({...configForm, accentColor: e.target.value})} className="h-10 w-10 cursor-pointer border rounded" />
                              <input type="text" value={configForm.accentColor} onChange={e => setConfigForm({...configForm, accentColor: e.target.value})} className="flex-1 p-2 border rounded uppercase" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Chave Pix (Doação)</label>
                           <input type="text" value={configForm.pixKey} onChange={e => setConfigForm({...configForm, pixKey: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Email de Suporte</label>
                           <input type="text" value={configForm.supportEmail} onChange={e => setConfigForm({...configForm, supportEmail: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-sm font-bold text-gray-700 mb-2">URL do Arquivo APK</label>
                           <input type="text" placeholder="https://..." value={configForm.apkUrl || ''} onChange={e => setConfigForm({...configForm, apkUrl: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                     </div>
                     <div className="flex justify-end pt-4 border-t border-gray-50">
                        <button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                           {isSavingConfig ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'tools' && (
              <div className="max-w-4xl space-y-8">
                 <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-teal-900 mb-2 flex items-center gap-2">
                       <Smartphone size={24} /> Instruções para APK/TWA
                    </h2>
                    <p className="text-teal-800 mb-4 text-sm">
                       Para criar o arquivo instalador do Android sem a barra do navegador:
                    </p>
                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm text-sm">
                          <p className="font-bold mb-1">1. Gere o SHA-256 no PWABuilder</p>
                          <p>Acesse <a href="https://www.pwabuilder.com" target="_blank" className="text-blue-600 underline">PWABuilder.com</a> e use a URL do seu site.</p>
                       </div>
                       <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm text-sm font-mono">
                          <p className="font-bold mb-1 font-sans">2. Edite o Asset Links</p>
                          <p className="mb-2 font-sans">Atualize o arquivo <code>public/.well-known/assetlinks.json</code> com seu SHA-256.</p>
                          <pre className="bg-gray-100 p-2 rounded text-[10px] overflow-x-auto">
{`[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.oquetempertocl.app",
    "sha256_cert_fingerprints": ["SEU_SHA256_AQUI"]
  }
}]`}
                          </pre>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PainelAdministrativo;
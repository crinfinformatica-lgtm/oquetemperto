
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig, UtilityCategory, UtilityItem, BusLine } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Palette, Save, LogOut, Zap, ListPlus, Megaphone, Share2, 
  RefreshCw, X, ArrowUp, ArrowDown, Globe, Edit, Star, 
  Calendar, Phone, Info, Smartphone, ExternalLink, QrCode, Database,
  Bus, Download, Copy, Heart, Upload, FileText, Type, Image as ImageIcon
} from 'lucide-react';
import { db, hasValidConfig } from '../services/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { ALLOWED_NEIGHBORHOODS, CATEGORIES } from '../constants';
import AppLogo from './AppLogo';

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

const PainelAdministrativo: React.FC<PainelAdministrativoProps> = ({ 
  currentUser, 
  appConfig, 
  onUpdateConfig, 
  onUpdateUser, 
  onDeleteUser, 
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'util' | 'identity' | 'marketing' | 'campaign' | 'tools'>('dashboard');
  const [userFilter, setUserFilter] = useState<'all' | 'pro' | 'business' | 'client'>('all');
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [configForm, setConfigForm] = useState<AppConfig>(appConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [highlightMenuUser, setHighlightMenuUser] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidConfig || !db || Object.keys(db).length === 0) {
      setIsLoading(false);
      return;
    }
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setLocalUsers(Object.values(data) as User[]);
      else setLocalUsers([]);
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
      alert('✅ Configurações salvas com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar as configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // --- IMAGENS: PROCESSAMENTO E UPLOAD ---
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 1200;
          let w = img.width;
          let h = img.height;
          if (w > max) { h = (max / w) * h; w = max; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
      };
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const b64 = await processImage(e.target.files[0]);
        if (target === 'logo') setConfigForm({ ...configForm, logoUrl: b64 });
        if (target === 'campaign') setConfigForm({ ...configForm, campaign: { ...configForm.campaign!, imageUrl: b64 } });
      } catch (err) {
        alert("Erro ao processar imagem.");
      }
    }
  };

  // --- FERRAMENTAS: BACKUP E RESTAURAÇÃO ---
  const handleBackupDB = async () => {
    try {
      const snap = await get(ref(db, '/'));
      const data = snap.val();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_app_oquetemperto_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert("Erro ao gerar backup.");
    }
  };

  const handleRestoreDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("⚠️ ATENÇÃO CRÍTICA: Isso irá apagar todo o seu banco de dados atual e substituir pelo backup. Tem certeza?")) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await set(ref(db, '/'), json);
        alert("✅ Banco de dados restaurado! O aplicativo será recarregado.");
        window.location.reload();
      } catch (err) {
        alert("❌ Erro ao ler arquivo. Verifique se é um JSON válido.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportPrompt = () => {
    const prompt = `INSTRUÇÕES DE RECONSTRUÇÃO DO APP:
Nome: ${configForm.appName}
Cores: Primária(${configForm.primaryColor}), Accent(${configForm.accentColor}), Sucesso(${configForm.tertiaryColor})
Total Usuários Atuais: ${localUsers.length}
Configurações Fixas: Guia de serviços e comércios regional.
Firebase Config Atual: ${JSON.stringify(configForm, null, 2)}`;
    
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_reconstrucao_${configForm.appName}.txt`;
    a.click();
  };

  // --- MARKETING E CAMPANHAS ---
  const handleShareCampaign = () => {
    const text = `Apoie o ${configForm.socialProject?.name}! 
Pix: ${configForm.socialProject?.pixKey}
Instagram: @${configForm.socialProject?.instagram}
Saiba mais no App O Que Tem Perto!`;
    if (navigator.share) {
      navigator.share({ title: 'Apoie nosso projeto', text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Dados copiados para a área de transferência!");
    }
  };

  const handleDownloadLogo = () => {
    if (!configForm.logoUrl) {
       alert("Não há logo configurada para download.");
       return;
    }
    const a = document.createElement('a');
    a.href = configForm.logoUrl;
    a.download = 'logo_app_transparente.png';
    a.click();
  };

  // --- UTILIDADES: GERENCIAMENTO ---
  const moveSection = (id: string, direction: 'up' | 'down') => {
    const order = configForm.utilityOrder || ['emergencia', 'utilidade', 'saude', 'bus', 'social', 'prefeitura'];
    const index = order.indexOf(id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setConfigForm({ ...configForm, utilityOrder: newOrder });
  };

  const editUtilityItem = (catId: string, itemId: string, field: keyof UtilityItem, value: string) => {
    const categories = (configForm.utilityCategories || []).map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        };
      }
      return cat;
    });
    setConfigForm({ ...configForm, utilityCategories: categories });
  };

  const addUtilityItem = (catId: string) => {
     const newItem: UtilityItem = { id: `u-${Date.now()}`, name: 'Novo Item', number: '0000', description: 'Descrição' };
     const categories = (configForm.utilityCategories || []).map(cat => {
        if (cat.id === catId) return { ...cat, items: [...cat.items, newItem] };
        return cat;
     });
     setConfigForm({ ...configForm, utilityCategories: categories });
  };

  const removeUtilityItem = (catId: string, itemId: string) => {
    const categories = (configForm.utilityCategories || []).map(cat => {
      if (cat.id === catId) return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
      return cat;
    });
    setConfigForm({ ...configForm, utilityCategories: categories });
  };

  const editBusLine = (id: string, field: keyof BusLine, value: string) => {
    const lines = (configForm.busLines || []).map(line => line.id === id ? { ...line, [field]: value } : line);
    setConfigForm({ ...configForm, busLines: lines });
  };

  const addBusLine = () => {
    const newLine: BusLine = { id: `b-${Date.now()}`, name: 'Nova Linha', url: 'https://...' };
    setConfigForm({ ...configForm, busLines: [...(configForm.busLines || []), newLine] });
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
    alert('✅ Cadastro do usuário atualizado!');
  };

  const filteredUsers = localUsers.filter(u => userFilter === 'all' ? true : u.role === userFilter);

  // Fallback para ordem das utilidades se estiver vazia
  const utilityOrder = configForm.utilityOrder && configForm.utilityOrder.length > 0 
    ? configForm.utilityOrder 
    : ['emergencia', 'utilidade', 'saude', 'bus', 'social', 'prefeitura'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Edit size={20} /> Editar Cadastro
               </h3>
               <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2">
                    <label className="block text-[10px] font-black text-blue-400 uppercase mb-1">Função no App (Role)</label>
                    <select 
                      value={editingUser.role} 
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                      className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm font-black text-primary"
                    >
                       <option value="client">Cliente Comum</option>
                       <option value="pro">Prestador de Serviço</option>
                       <option value="business">Comércio / Loja</option>
                       <option value="admin">Administrador</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nome Completo / Fantasia</label>
                    <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-sm font-bold" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Categoria</label>
                    <select value={editingUser.category || ''} onChange={e => setEditingUser({...editingUser, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-sm font-bold">
                       <option value="">Nenhuma</option>
                       {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bairro</label>
                    <select value={editingUser.neighborhood || ''} onChange={e => setEditingUser({...editingUser, neighborhood: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-sm font-bold">
                       <option value="">Selecione...</option>
                       {ALLOWED_NEIGHBORHOODS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">WhatsApp</label>
                    <input type="tel" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-sm font-bold" />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Endereço Completo</label>
                    <input type="text" value={editingUser.address || ''} onChange={e => setEditingUser({...editingUser, address: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-sm font-bold" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">SALVAR ALTERAÇÕES</button>
                 <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-gray-900 h-screen fixed left-0 top-0 overflow-y-auto z-20 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col items-center">
           <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-4 shadow-xl flex items-center justify-center overflow-hidden">
              {configForm.logoUrl ? <img src={configForm.logoUrl} className="w-full h-full object-contain" /> : <AppLogo className="w-8 h-8" />}
           </div>
           <h2 className="text-lg font-black text-white uppercase tracking-widest">{configForm.appName}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: <Zap size={20}/>, label: 'Geral' },
            { id: 'users', icon: <Users size={20}/>, label: 'Usuários' },
            { id: 'util', icon: <ListPlus size={20}/>, label: 'Utilidades' },
            { id: 'identity', icon: <Palette size={20}/>, label: 'Identidade' },
            { id: 'marketing', icon: <Share2 size={20}/>, label: 'Divulgação' },
            { id: 'campaign', icon: <Megaphone size={20}/>, label: 'Campanhas' },
            { id: 'tools', icon: <Database size={20}/>, label: 'Ferramentas' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors"><LogOut size={18}/> Sair</button></div>
      </aside>

      {/* Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 pb-32">
        <header className="mb-10 flex justify-between items-center">
           <div><h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Painel Administrativo</h1><p className="text-gray-500 font-medium">Controle Total do Sistema</p></div>
           <button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
             {isSavingConfig ? <RefreshCw className="animate-spin" /> : <Save />} SALVAR ALTERAÇÕES
           </button>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
              {[
                { label: 'Prestadores', count: localUsers.filter(u => u.role === 'pro').length, color: 'text-orange-500', bg: 'bg-orange-50', icon: <Briefcase /> },
                { label: 'Comércios', count: localUsers.filter(u => u.role === 'business').length, color: 'text-green-500', bg: 'bg-green-50', icon: <Store /> },
                { label: 'Clientes', count: localUsers.filter(u => u.role === 'client').length, color: 'text-blue-500', bg: 'bg-blue-50', icon: <Users /> },
                { label: 'Administradores', count: localUsers.filter(u => u.role === 'admin' || u.role === 'master').length, color: 'text-purple-500', bg: 'bg-purple-50', icon: <Shield /> },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                   <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p><h3 className={`text-3xl font-black ${stat.color} mt-1`}>{stat.count}</h3></div>
                   <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>{stat.icon}</div>
                </div>
              ))}
           </div>
        )}

        {/* IDENTITY TAB */}
        {activeTab === 'identity' && (
           <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm max-w-3xl animate-in fade-in space-y-10">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><Palette size={24} className="text-primary"/> Identidade Visual e Textos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Logo do Aplicativo (PNG Transparente)</label>
                       <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                          <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border">
                             {configForm.logoUrl ? <img src={configForm.logoUrl} className="w-full h-full object-contain" /> : <AppLogo className="w-10 h-10" />}
                          </div>
                          <div className="flex-1 space-y-2">
                             <label className="cursor-pointer block bg-primary text-white text-[10px] font-black uppercase text-center py-2 rounded-lg hover:bg-primary-dark">
                                Upload Logo
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                             </label>
                             <button onClick={handleDownloadLogo} className="w-full bg-white border text-gray-600 text-[10px] font-black uppercase py-2 rounded-lg hover:bg-gray-100">Baixar Atual</button>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                       <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Primária</label><input type="color" value={configForm.primaryColor} onChange={e => setConfigForm({...configForm, primaryColor: e.target.value})} className="h-10 w-full cursor-pointer bg-transparent" /></div>
                       <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Accent</label><input type="color" value={configForm.accentColor} onChange={e => setConfigForm({...configForm, accentColor: e.target.value})} className="h-10 w-full cursor-pointer bg-transparent" /></div>
                       <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Sucesso</label><input type="color" value={configForm.tertiaryColor} onChange={e => setConfigForm({...configForm, tertiaryColor: e.target.value})} className="h-10 w-full cursor-pointer bg-transparent" /></div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Textos da Interface</h4>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Título do Cabeçalho (Header)</label><input type="text" value={configForm.appName} onChange={e => setConfigForm({...configForm, appName: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Subtítulo do Cabeçalho</label><input type="text" value={configForm.headerSubtitle || ''} onChange={e => setConfigForm({...configForm, headerSubtitle: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Texto Principal do Rodapé (Footer)</label><input type="text" value={configForm.footerText || ''} onChange={e => setConfigForm({...configForm, footerText: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Subtexto do Rodapé</label><input type="text" value={configForm.footerSubtext || ''} onChange={e => setConfigForm({...configForm, footerSubtext: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" /></div>
                 </div>
              </div>
           </div>
        )}

        {/* UTIL TAB */}
        {activeTab === 'util' && (
          <div className="space-y-10 animate-in fade-in">
             {utilityOrder.map((sectionId) => {
                if (sectionId === 'bus') {
                   return (
                      <div key="bus" className="bg-white rounded-[2rem] p-8 border border-orange-100 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-orange-700 flex items-center gap-2 uppercase tracking-tight"><Bus size={24}/> Horários de Ônibus</h3>
                            <div className="flex gap-2"><button onClick={() => moveSection('bus', 'up')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowUp size={18}/></button><button onClick={() => moveSection('bus', 'down')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowDown size={18}/></button></div>
                         </div>
                         <div className="space-y-4">
                            {(configForm.busLines || []).map(line => (
                               <div key={line.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-2xl">
                                  <input type="text" value={line.name} onChange={e => editBusLine(line.id, 'name', e.target.value)} className="p-3 bg-white border border-orange-100 rounded-xl text-sm font-bold outline-none" placeholder="Nome da Linha" />
                                  <input type="text" value={line.url} onChange={e => editBusLine(line.id, 'url', e.target.value)} className="p-3 bg-white border border-orange-100 rounded-xl text-sm outline-none" placeholder="Link (URL)" />
                               </div>
                            ))}
                            <button onClick={addBusLine} className="w-full py-4 border-2 border-dashed border-orange-200 text-orange-400 rounded-2xl font-black text-xs uppercase hover:bg-orange-50 transition-all">+ Adicionar Linha</button>
                         </div>
                      </div>
                   );
                }
                const cat = (configForm.utilityCategories || []).find(c => c.id === sectionId);
                if (!cat) return null;
                return (
                   <div key={cat.id} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">{cat.title}</h3>
                         <div className="flex gap-2"><button onClick={() => moveSection(cat.id, 'up')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowUp size={18}/></button><button onClick={() => moveSection(cat.id, 'down')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowDown size={18}/></button></div>
                      </div>
                      <div className="space-y-4">
                         {cat.items.map(item => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                               <input type="text" value={item.name} onChange={e => editUtilityItem(cat.id, item.id, 'name', e.target.value)} className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-black outline-none" placeholder="Nome" />
                               <input type="text" value={item.number} onChange={e => editUtilityItem(cat.id, item.id, 'number', e.target.value)} className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-primary outline-none" placeholder="Telefone" />
                               <input type="text" value={item.description} onChange={e => editUtilityItem(cat.id, item.id, 'description', e.target.value)} className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-500 outline-none md:col-span-1" placeholder="Descrição Curta" />
                               <button onClick={() => removeUtilityItem(cat.id, item.id)} className="bg-red-50 text-red-400 p-3 rounded-xl hover:bg-red-100"><Trash2 size={16} className="mx-auto"/></button>
                            </div>
                         ))}
                         <button onClick={() => addUtilityItem(cat.id)} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl font-black text-xs uppercase hover:bg-gray-50 transition-all">+ Adicionar Item em {cat.title}</button>
                      </div>
                   </div>
                );
             })}
          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab === 'marketing' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-8 flex items-center justify-center gap-2"><QrCode size={24} className="text-primary"/> QR Code do App</h3>
                 <div className="w-48 h-48 mx-auto bg-gray-50 border-8 border-gray-50 rounded-[2.5rem] p-4 flex items-center justify-center mb-6">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(configForm.shareUrl || window.location.href)}`} alt="QR Code" className="w-full h-full object-contain" />
                 </div>
                 <p className="text-sm text-gray-500 font-medium mb-8">Aponte a câmera do celular para abrir o aplicativo instantaneamente.</p>
                 <button onClick={() => window.print()} className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"><Download size={18}/> Baixar para Impressão</button>
              </div>
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-8 flex items-center gap-2"><Share2 size={24} className="text-primary"/> Links de Divulgação</h3>
                 <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">URL de Compartilhamento</p><div className="flex items-center justify-between gap-3"><code className="text-sm font-bold text-gray-800 truncate">{configForm.shareUrl || window.location.href}</code><button onClick={() => { navigator.clipboard.writeText(configForm.shareUrl || window.location.href); alert('Copiado!'); }} className="p-3 bg-white text-primary rounded-xl shadow-sm border border-gray-100 hover:scale-110 active:scale-90 transition-all"><Copy size={16}/></button></div></div>
                    <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100"><p className="text-[10px] font-black text-pink-400 uppercase mb-1">Instagram Principal</p><div className="flex items-center justify-between gap-3"><code className="text-sm font-bold text-pink-800 truncate">{configForm.instagramUrl || '@crinfinformatica'}</code><button onClick={() => window.open(configForm.instagramUrl || 'https://instagram.com/crinfinformatica', '_blank')} className="p-3 bg-white text-pink-600 rounded-xl shadow-sm border border-pink-100 hover:scale-110 active:scale-90 transition-all"><ExternalLink size={16}/></button></div></div>
                 </div>
              </div>
           </div>
        )}

        {/* CAMPAIGN TAB */}
        {activeTab === 'campaign' && (
           <div className="space-y-8 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 border border-red-50 shadow-sm max-w-2xl">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-red-600 uppercase tracking-tight flex items-center gap-2"><Heart size={24} fill="currentColor"/> Projeto Social</h3>
                    <button onClick={handleShareCampaign} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"><Share2 size={20}/></button>
                 </div>
                 <div className="space-y-4">
                    <label className="flex items-center gap-2 font-black text-gray-700 uppercase text-xs mb-4"><input type="checkbox" checked={configForm.socialProject?.active} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, active: e.target.checked}})} className="w-5 h-5 rounded border-gray-300 text-red-500" /> PROJETO ATIVO NA HOME</label>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Chave Pix (E-mail)</label><input type="text" value={configForm.socialProject?.pixKey} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, pixKey: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Instagram (sem @)</label><input type="text" value={configForm.socialProject?.instagram} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, instagram: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Descrição do Projeto</label><textarea rows={3} value={configForm.socialProject?.description} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, description: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-sm outline-none resize-none" /></div>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-blue-50 shadow-sm max-w-2xl">
                 <h3 className="text-xl font-black text-blue-600 uppercase tracking-tight mb-8 flex items-center gap-2"><Megaphone size={24}/> Campanha Banner (Home)</h3>
                 <div className="space-y-6">
                    <label className="flex items-center gap-2 font-black text-gray-700 uppercase text-xs mb-4"><input type="checkbox" checked={configForm.campaign?.active} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, active: e.target.checked}})} className="w-5 h-5 rounded border-gray-300 text-blue-500" /> EXIBIR BANNER NA HOME</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex flex-col gap-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Imagem da Campanha</label>
                          <div className="w-full h-32 bg-gray-100 rounded-2xl overflow-hidden border flex items-center justify-center">
                             {configForm.campaign?.imageUrl ? <img src={configForm.campaign.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-gray-300"/>}
                          </div>
                          <label className="cursor-pointer bg-blue-50 text-blue-600 text-[10px] font-black uppercase text-center py-3 rounded-xl hover:bg-blue-100 mt-2">
                             Selecionar Imagem
                             <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'campaign')} />
                          </label>
                       </div>
                       <div className="space-y-4">
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Título do Banner</label><input type="text" value={configForm.campaign?.title} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, title: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" /></div>
                          <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Texto Informativo Breve</label><input type="text" value={configForm.campaign?.description} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, description: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium outline-none" /></div>
                       </div>
                    </div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Link de Destino ou URL da Imagem Externa</label><input type="text" value={configForm.campaign?.imageUrl} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, imageUrl: e.target.value}})} placeholder="https://..." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-[10px] outline-none" /></div>
                 </div>
              </div>
           </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === 'tools' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><Database size={24} className="text-primary"/> Backup e Restauração</h3>
                 <div className="space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">Baixe uma cópia completa de todos os usuários e configurações do aplicativo em formato JSON para segurança.</p>
                    <button onClick={handleBackupDB} className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                       <Download size={18} /> Exportar Banco de Dados
                    </button>
                    <div className="relative pt-4">
                       <p className="text-[10px] font-black text-red-500 uppercase mb-2">Restaurar Banco de Dados</p>
                       <label className="w-full cursor-pointer bg-red-50 text-red-600 font-black py-4 rounded-2xl border-2 border-dashed border-red-200 flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
                          <Upload size={18} /> Selecionar Arquivo JSON
                          <input type="file" className="hidden" accept=".json" onChange={handleRestoreDB} />
                       </label>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><FileText size={24} className="text-blue-500"/> Reconstrução e APK</h3>
                 <div className="space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">Exporte o "Prompt" completo para recriar o aplicativo identicamente em qualquer ambiente de desenvolvimento ou IA.</p>
                    <button onClick={handleExportPrompt} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                       <FileText size={18} /> Baixar Prompt do Sistema
                    </button>
                    <div className="pt-6 border-t mt-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Link do APK Android (Download na Home)</p>
                       <input type="text" value={configForm.apkUrl || ''} onChange={e => setConfigForm({...configForm, apkUrl: e.target.value})} placeholder="https://link-direto-do-arquivo.apk" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-[10px] outline-none" />
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              {['all', 'pro', 'business', 'client'].map(f => (
                <button key={f} onClick={() => setUserFilter(f as any)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${userFilter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {f === 'all' ? 'Todos' : f === 'pro' ? 'Prestadores' : f === 'business' ? 'Lojas' : 'Clientes'}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr><th className="p-5">Nome / Email</th><th className="p-5">Papel</th><th className="p-5">Destaque</th><th className="p-5 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => {
                    const isVIP = user.highlightExpiresAt ? new Date(user.highlightExpiresAt) > new Date() : false;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5"><div><p className="font-bold text-gray-800">{user.name}</p><p className="text-[10px] text-gray-400">{user.email}</p></div></td>
                        <td className="p-5 text-xs font-bold uppercase text-gray-500">{user.role}</td>
                        <td className="p-5">
                            {user.role !== 'client' && (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${isVIP ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {isVIP ? 'VIP ATIVO' : 'NORMAL'}
                                </span>
                            )}
                        </td>
                        <td className="p-5 text-right flex justify-end gap-2">
                           <button onClick={() => setEditingUser(user)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-primary rounded-xl transition-all"><Edit size={16}/></button>
                           <button onClick={() => { if(confirm('Excluir?')) onDeleteUser(user.id); }} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PainelAdministrativo;

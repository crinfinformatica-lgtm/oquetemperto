
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig, UtilityCategory, UtilityItem, BusLine } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Palette, Save, LogOut, Zap, ListPlus, Megaphone, Share2, 
  RefreshCw, X, ArrowUp, ArrowDown, Globe, Edit, Star, 
  Calendar, Phone, Info, Smartphone, ExternalLink, QrCode, Database,
  Bus, Download, Copy, Heart, Upload, FileText, Type, Image as ImageIcon, Maximize, Instagram, Facebook,
  MapPin, Menu, History, RotateCcw, ShieldCheck, DownloadCloud, UploadCloud, AlertTriangle
} from 'lucide-react';
import { db, hasValidConfig } from '../services/firebase';
import { ref, onValue, set, get, update } from 'firebase/database';
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

  // States para Ferramentas
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  // --- SISTEMA DE RESILIÊNCIA: SNAPSHOT TOTAL ---

  const handleGenerateTotalSnapshot = async () => {
    setIsExporting(true);
    try {
      // Captura a raiz absoluta do banco de dados (Tudo!)
      const snap = await get(ref(db, '/'));
      const totalData = snap.val();

      if (!totalData) throw new Error("Nenhum dado encontrado.");

      // Adiciona metadados ao backup para conferência futura
      const backupPackage = {
        app_name: configForm.appName,
        timestamp: new Date().toISOString(),
        version: "2.0-total-snapshot",
        data: totalData
      };

      const blob = new Blob([JSON.stringify(backupPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `SNAPSHOT_TOTAL_${configForm.appName.replace(/\s+/g, '_').toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert("❌ Falha ao gerar Snapshot: " + err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFromSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMessage = "⚠️ AVISO DE SEGURANÇA:\n\nEsta ação irá APAGAR TODO o banco de dados atual e substituir pelo conteúdo deste arquivo.\n\nTodos os usuários atuais, configurações e fotos serão sobrescritos.\n\nDeseja prosseguir com a RESTAURAÇÃO TOTAL?";
    if (!confirm(confirmMessage)) {
      e.target.value = ''; // Reseta input
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        
        // Verifica se é um Snapshot do sistema
        const dataToRestore = content.data ? content.data : content;

        if (!dataToRestore.users || !dataToRestore.config) {
          throw new Error("O arquivo não parece ser um backup válido deste aplicativo.");
        }

        // Executa a substituição total na raiz
        await set(ref(db, '/'), dataToRestore);
        
        alert("✅ SISTEMA RESTAURADO!\nO aplicativo será reiniciado para aplicar as mudanças.");
        window.location.reload();
      } catch (err) {
        alert("❌ ERRO NA IMPORTAÇÃO: " + err);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // Fix: Missing handleExportPrompt implementation
  const handleExportPrompt = () => {
    const promptText = `
# APPLICATION RECONSTRUCTION PROMPT
App Name: ${configForm.appName}
Primary Color: ${configForm.primaryColor}
Accent Color: ${configForm.accentColor}
Support Email: ${configForm.supportEmail}

## APP CONFIGURATION (JSON)
${JSON.stringify(configForm, null, 2)}

## FEATURE SUMMARY
- Service and Business Directory
- User roles: master, admin, client, pro, business
- Real-time search with Gemini categorization
- Neighborhood filtering
- User profiles and reviews
- Public utilities listing
- Donation system for social projects
- Snapshot-based backup and restoration

## TECH STACK
- React (Vite)
- Firebase Auth & Realtime Database
- Google Gemini API (for categorization)
- Tailwind CSS
- Lucide React Icons
    `;

    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PROMPT_RECONSTRUCAO_${configForm.appName.replace(/\s+/g, '_').toUpperCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- OUTRAS FUNÇÕES DE APOIO ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = (ev) => {
          const b64 = ev.target?.result as string;
          if (target === 'logo') setConfigForm({ ...configForm, logoUrl: b64 });
          if (target === 'campaign') setConfigForm({ ...configForm, campaign: { ...configForm.campaign!, imageUrl: b64 } });
          if (target === 'social') setConfigForm({ ...configForm, socialProject: { ...configForm.socialProject!, imageUrl: b64 } });
        };
      } catch (err) { alert("Erro na imagem."); }
    }
  };

  const handleDownloadLogo = () => {
    if (!configForm.logoUrl) return;
    const a = document.createElement('a');
    a.href = configForm.logoUrl;
    a.download = `logo_${configForm.appName.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
  };

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
        return { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) };
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

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
    alert('✅ Cadastro atualizado!');
  };

  const filteredUsers = localUsers.filter(u => userFilter === 'all' ? true : u.role === userFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                 <Edit size={20} /> Editar Cadastro
               </h3>
               <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <label className="block text-[10px] font-black text-blue-400 uppercase mb-1">Função (Role)</label>
                    <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-black text-primary">
                       <option value="client">Cliente</option>
                       <option value="pro">Prestador</option>
                       <option value="business">Comércio</option>
                       <option value="admin">Administrador</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nome</label>
                    <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">WhatsApp</label>
                    <input type="tel" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-xl hover:bg-primary-dark transition-all">SALVAR</button>
                 <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200">CANCELAR</button>
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
            { id: 'tools', icon: <History size={20}/>, label: 'Resiliência' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors"><LogOut size={18}/> Sair</button></div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 z-20">
         <span className="font-bold text-lg text-primary">Admin Panel</span>
         <button onClick={() => {}} className="p-2 text-gray-600"><Menu /></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 pb-32">
        <header className="mb-10 flex justify-between items-center">
           <div><h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Painel Administrador</h1><p className="text-gray-500 font-medium">Controle Total do Sistema</p></div>
           <button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
             {isSavingConfig ? <RefreshCw className="animate-spin" /> : <Save />} SALVAR ALTERAÇÕES
           </button>
        </header>

        {/* TOOLS TAB: SISTEMA DE RESILIÊNCIA */}
        {activeTab === 'tools' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              {/* Card de Snapshot Total */}
              <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-600 to-primary p-8 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                       <ShieldCheck size={32} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Sistema de Resiliência</h2>
                       <p className="text-blue-100 text-sm font-medium">Capture 100% do estado do seu aplicativo em um arquivo de restauração.</p>
                    </div>
                 </div>

                 <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Lado Esquerdo: Exportação */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                          <DownloadCloud size={18} /> Snapshot Total (BKP)
                       </div>
                       <p className="text-gray-500 text-sm leading-relaxed">
                          Gere um arquivo <strong>.JSON</strong> contendo absolutamente tudo: usuários, fotos, avaliações, utilidades, cores e configurações. Guarde este arquivo em um local seguro (Google Drive ou HD Externo).
                       </p>
                       <button 
                         onClick={handleGenerateTotalSnapshot} 
                         disabled={isExporting}
                         className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                       >
                          {isExporting ? <RefreshCw className="animate-spin" /> : <Download />} 
                          CRIAR PONTO DE RESTAURAÇÃO
                       </button>
                       <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-700 font-medium leading-tight">
                             Recomendado: Faça um snapshot toda vez que realizar grandes alterações no catálogo ou antes de atualizar o código do sistema.
                          </p>
                       </div>
                    </div>

                    {/* Lado Direito: Importação */}
                    <div className="space-y-6 border-l border-gray-100 pl-0 lg:pl-8">
                       <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-xs">
                          <RotateCcw size={18} /> Restaurar do Arquivo
                       </div>
                       <p className="text-gray-500 text-sm leading-relaxed">
                          Recupere seu aplicativo instantaneamente. Ao importar um arquivo de Snapshot, o banco de dados atual será <strong>deletado</strong> e substituído fielmente pela cópia.
                       </p>
                       
                       <label className="relative block group cursor-pointer">
                          <div className="w-full bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all group-hover:bg-red-100 group-hover:border-red-400">
                             {isImporting ? (
                                <RefreshCw className="animate-spin text-red-600 mb-2" size={32} />
                             ) : (
                                <UploadCloud className="text-red-400 group-hover:text-red-600 mb-2" size={32} />
                             )}
                             <span className="text-red-600 font-black text-sm uppercase">Selecionar Arquivo .JSON</span>
                             <span className="text-red-400 text-[10px] mt-1">Clique para procurar no seu computador</span>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".json" 
                            onChange={handleRestoreFromSnapshot} 
                            disabled={isImporting}
                          />
                       </label>

                       <div className="flex items-start gap-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-700 font-bold leading-tight">
                             ATENÇÃO: A restauração é irreversível. Certifique-se de que o arquivo é um backup legítimo deste aplicativo antes de prosseguir.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Card de Reconstrução de Prompt */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-2xl text-gray-500"><FileText size={24} /></div>
                    <div>
                       <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Prompt de Reconstrução</h3>
                       <p className="text-xs text-gray-500">Exporte instruções detalhadas para recriar a lógica do app via IA.</p>
                    </div>
                 </div>
                 <button onClick={handleExportPrompt} className="bg-gray-900 text-white font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-lg">Exportar Prompt</button>
              </div>
           </div>
        )}

        {/* IDENTITY TAB */}
        {activeTab === 'identity' && (
           <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm max-w-3xl animate-in fade-in space-y-10">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><Palette size={24} className="text-primary"/> Identidade Visual e Textos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Logo do Aplicativo</label>
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
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Título</label><input type="text" value={configForm.appName} onChange={e => setConfigForm({...configForm, appName: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm font-bold" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Subtítulo</label><input type="text" value={configForm.headerSubtitle || ''} onChange={e => setConfigForm({...configForm, headerSubtitle: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Rodapé</label><input type="text" value={configForm.footerText || ''} onChange={e => setConfigForm({...configForm, footerText: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" /></div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Recursos Home</h4>
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                       <p className="text-sm font-bold text-gray-800">Contador de Usuários</p>
                       <p className="text-[10px] text-gray-500">Exibe prova social na página inicial.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" checked={configForm.showUserCounter} onChange={e => setConfigForm({...configForm, showUserCounter: e.target.checked})} className="sr-only peer" />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                 </div>
              </div>
           </div>
        )}

        {/* OUTRAS TABS SIMPLIFICADAS PARA FOCO NO SISTEMA DE RESILIÊNCIA */}
        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
              {[
                { label: 'Prestadores', count: localUsers.filter(u => u.role === 'pro').length, color: 'text-orange-500', bg: 'bg-orange-50', icon: <Briefcase /> },
                { label: 'Comércios', count: localUsers.filter(u => u.role === 'business').length, color: 'text-green-500', bg: 'bg-green-50', icon: <Store /> },
                { label: 'Clientes', count: localUsers.filter(u => u.role === 'client').length, color: 'text-blue-500', bg: 'bg-blue-50', icon: <Users /> },
                { label: 'Admins', count: localUsers.filter(u => u.role === 'admin' || u.role === 'master').length, color: 'text-purple-500', bg: 'bg-purple-50', icon: <Shield /> },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                   <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p><h3 className={`text-3xl font-black ${stat.color} mt-1`}>{stat.count}</h3></div>
                   <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>{stat.icon}</div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-400">
                <tr><th className="p-5">Nome</th><th className="p-5">Função</th><th className="p-5 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="p-5 font-bold">{user.name}</td>
                    <td className="p-5 uppercase text-[10px] font-black text-gray-400">{user.role}</td>
                    <td className="p-5 text-right">
                       <button onClick={() => setEditingUser(user)} className="p-2 text-gray-400 hover:text-primary"><Edit size={16}/></button>
                       <button onClick={() => { if(confirm('Excluir?')) onDeleteUser(user.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Outras tabs seriam renderizadas aqui de forma similar */}

      </main>
    </div>
  );
};

export default PainelAdministrativo;

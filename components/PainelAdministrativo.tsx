
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig, UtilityCategory, UtilityItem, BusLine } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Palette, Save, LogOut, Zap, ListPlus, Megaphone, Share2, 
  RefreshCw, X, ArrowUp, ArrowDown, Globe, Edit, Star, 
  Calendar, Phone, Info, Smartphone, ExternalLink, QrCode, Database,
  Bus, Download, Copy, Heart, Upload, FileText, Type, Image as ImageIcon, Maximize, Instagram, Facebook,
  MapPin, Menu, History, RotateCcw, ShieldCheck, DownloadCloud, UploadCloud, AlertTriangle, Code, Settings,
  ToggleLeft, ToggleRight, Layout, CheckCircle2, Plus, PlusCircle, Link as LinkIcon, Search, MoreHorizontal, Clock, Terminal
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // --- FUNÇÕES DE USUÁRIOS ---
  const handleSetHighlight = (user: User, days: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    onUpdateUser({ ...user, highlightExpiresAt: expiresAt.toISOString() });
    alert(`✅ ${user.name} destacado por ${days} dias!`);
  };

  const handleRemoveHighlight = (user: User) => {
    onUpdateUser({ ...user, highlightExpiresAt: undefined });
    alert(`✅ Destaque removido de ${user.name}`);
  };

  const isHighlighted = (user: User) => {
    if (!user.highlightExpiresAt) return false;
    return new Date(user.highlightExpiresAt) > new Date();
  };

  const getRemainingDays = (dateStr: string) => {
    const remaining = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  };

  // --- FUNÇÕES DE UTILIDADES ---
  const handleAddUtilityItem = (categoryId: string) => {
    const newCats = [...(configForm.utilityCategories || [])];
    const categoryIndex = newCats.findIndex(c => c.id === categoryId);
    if (categoryIndex > -1) {
      const newItem: UtilityItem = {
        id: `it-${Date.now()}`,
        name: '',
        number: '',
        description: ''
      };
      newCats[categoryIndex].items = [...newCats[categoryIndex].items, newItem];
      setConfigForm({ ...configForm, utilityCategories: newCats });
    }
  };

  const handleRemoveUtilityItem = (categoryId: string, itemId: string) => {
    const newCats = [...(configForm.utilityCategories || [])];
    const categoryIndex = newCats.findIndex(c => c.id === categoryId);
    if (categoryIndex > -1) {
      newCats[categoryIndex].items = newCats[categoryIndex].items.filter(i => i.id !== itemId);
      setConfigForm({ ...configForm, utilityCategories: newCats });
    }
  };

  const handleUpdateUtilityItem = (categoryId: string, itemId: string, field: keyof UtilityItem, value: string) => {
    const newCats = [...(configForm.utilityCategories || [])];
    const categoryIndex = newCats.findIndex(c => c.id === categoryId);
    if (categoryIndex > -1) {
      const itemIndex = newCats[categoryIndex].items.findIndex(i => i.id === itemId);
      if (itemIndex > -1) {
        newCats[categoryIndex].items[itemIndex] = { ...newCats[categoryIndex].items[itemIndex], [field]: value };
        setConfigForm({ ...configForm, utilityCategories: newCats });
      }
    }
  };

  const handleMoveUtilityCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...(configForm.utilityCategories || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      setConfigForm({ ...configForm, utilityCategories: newCategories });
    }
  };

  const handleMoveUtilityItem = (categoryId: string, itemIndex: number, direction: 'up' | 'down') => {
    const newCategories = [...(configForm.utilityCategories || [])];
    const catIndex = newCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
      const items = [...newCategories[catIndex].items];
      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex >= 0 && targetIndex < items.length) {
        [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
        newCategories[catIndex].items = items;
        setConfigForm({ ...configForm, utilityCategories: newCategories });
      }
    }
  };

  const handleAddBusLine = () => {
    const newLine: BusLine = { id: `bus-${Date.now()}`, name: '', url: '' };
    setConfigForm({ ...configForm, busLines: [...(configForm.busLines || []), newLine] });
  };

  const handleRemoveBusLine = (id: string) => {
    setConfigForm({ ...configForm, busLines: (configForm.busLines || []).filter(b => b.id !== id) });
  };

  const handleUpdateBusLine = (id: string, field: keyof BusLine, value: string) => {
    const newLines = (configForm.busLines || []).map(b => b.id === id ? { ...b, [field]: value } : b);
    setConfigForm({ ...configForm, busLines: newLines });
  };

  const handleMoveBusLine = (index: number, direction: 'up' | 'down') => {
    const newLines = [...(configForm.busLines || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newLines.length) {
      [newLines[index], newLines[targetIndex]] = [newLines[targetIndex], newLines[index]];
      setConfigForm({ ...configForm, busLines: newLines });
    }
  };

  // --- FUNÇÕES DE DIVULGAÇÃO ---
  const handleDownloadQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(configForm.shareUrl || window.location.origin)}`;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qrcode_${configForm.appName.replace(/\s+/g, '_').toLowerCase()}.png`;
    window.open(qrUrl, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado com sucesso!");
  };

  // --- FUNÇÕES DE BACKUP E PROMPTS ---
  const handleExportConfigOnly = () => {
    const backupPackage = { app_name: configForm.appName, timestamp: new Date().toISOString(), type: "config-only", config: configForm };
    const blob = new Blob([JSON.stringify(backupPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `PREFERENCIAS_PAINEL_${configForm.appName.replace(/\s+/g, '_').toUpperCase()}.json`;
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPrompt = (type: 'system' | 'admin') => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const systemPrompt = `PROMPT DE RECONSTRUÇÃO TOTAL: ${configForm.appName.toUpperCase()}
Data de Geração: ${timestamp}

Objetivo: Recriar identicamente o aplicativo "${configForm.appName}" (Águas Claras e Região).

Estrutura Técnica:
- Framework: React 18+ com TypeScript
- Estilização: Tailwind CSS (Mobile First)
- Backend: Firebase (Auth e Realtime Database)
- IA: Google Gemini API para categorização de buscas

Funcionalidades Principais:
1. Guia de Prestadores e Comércios com filtros por bairro e categoria.
2. Sistema de busca inteligente via IA.
3. Cadastro multinível (Cliente, Prestador, Comércio).
4. Página de Utilidade Pública (Emergência, Saúde, Ônibus).
5. Seção de Doação/Social personalizável.
6. Painel Administrativo para controle de usuários e destaques.

Identidade Atual:
- Cor Primária: ${configForm.primaryColor}
- Cor de Destaque: ${configForm.accentColor}
- Chave Pix Social: ${configForm.socialProject?.pixKey}

Configuração JSON do Sistema:
${JSON.stringify(configForm, null, 2)}

Instrução de Desenvolvimento:
Use as configurações acima para gerar os arquivos App.tsx e componentes baseados no design de cartões arredondados (2.5rem), sombras suaves e tipografia Inter.`;

    const adminPrompt = `PROMPT DE RECONSTRUÇÃO DO PAINEL ADMINISTRATIVO
Data de Geração: ${timestamp}

Objetivo: Recriar o Painel Administrativo de Controle Total do Sistema.

Requisitos de UI/UX:
- Layout: Dashboard com Sidebar fixa (Gray-900).
- Estética: Botões com cantos ultra-arredondados (3xl), sombras XL, animações fade-in.
- Abas Obrigatórias: Geral, Usuários (Gerenciar Destaques de 2/7/15/30 dias), Utilidades, Identidade, Divulgação, Campanhas e Resiliência.

Funcionalidades de Gestão:
1. Controle de Status (Ativo/Banido).
2. Edição de dados cadastrais via modal.
3. Gerenciamento de destaque temporal (Destaque Pro/Business).
4. Editor de Utilidades com reordenação (Up/Down).
5. Backup/Snapshot total via JSON.
6. Editor de Identidade Visual (Cores e Logos em tempo real).

JSON de Referência de Configuração:
${JSON.stringify(configForm, null, 2)}`;

    const content = type === 'system' ? systemPrompt : adminPrompt;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROMPT_${type === 'system' ? 'SISTEMA_COMPLETO' : 'PAINEL_ADMIN'}_${configForm.appName.replace(/\s+/g, '_').toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreConfigOnly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("⚠️ RESTAURAR PREFERÊNCIAS?\nIsso irá substituir cores, logos, utilitários e links. OS USUÁRIOS NÃO SERÃO AFETADOS.")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const configToRestore = content.config ? content.config : content;
        await set(ref(db, 'config'), configToRestore);
        alert("✅ CONFIGURAÇÕES RESTAURADAS!");
        window.location.reload();
      } catch (err) { alert("❌ ERRO NA RESTAURAÇÃO: " + err); }
    };
    reader.readAsText(file);
  };

  const handleGenerateTotalSnapshot = async () => {
    setIsExporting(true);
    try {
      const snap = await get(ref(db, '/'));
      const totalData = snap.val();
      const backupPackage = { app_name: configForm.appName, timestamp: new Date().toISOString(), version: "2.0-total-snapshot", data: totalData };
      const blob = new Blob([JSON.stringify(backupPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `SNAPSHOT_TOTAL_${configForm.appName.replace(/\s+/g, '_').toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    } catch (err) { alert("❌ Falha ao gerar Snapshot: " + err); } finally { setIsExporting(false); }
  };

  const handleRestoreFromSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("⚠️ AVISO DE SEGURANÇA MÁXIMA: Esta ação irá APAGAR TODO o banco de dados. Prosseguir?")) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const dataToRestore = content.data ? content.data : content;
        await set(ref(db, '/'), dataToRestore);
        alert("✅ SISTEMA TOTALMENTE RESTAURADO!");
        window.location.reload();
      } catch (err) { alert("❌ ERRO NA IMPORTAÇÃO: " + err); } finally { setIsImporting(false); }
    };
    reader.readAsText(file);
  };

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

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
    alert('✅ Cadastro atualizado!');
  };

  const filteredUsers = localUsers.filter(u => {
    const matchesFilter = userFilter === 'all' ? true : 
                         userFilter === 'pro' ? u.role === 'pro' :
                         userFilter === 'business' ? u.role === 'business' :
                         userFilter === 'client' ? u.role === 'client' : true;
    
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors">
            <LogOut size={18}/> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 pb-32">
        <header className="mb-10 flex justify-between items-center">
           <div>
             <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">
               {activeTab === 'users' ? 'Controle Total do Sistema' : 'Painel Administrativo'}
             </h1>
             <p className="text-gray-500 font-medium">
               {activeTab === 'users' ? 'Gerenciamento de Usuários e Destaques' : 'Gestão de Conteúdo e Serviços'}
             </p>
           </div>
           <button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
             {isSavingConfig ? <RefreshCw className="animate-spin" /> : <Save />} SALVAR ALTERAÇÕES
           </button>
        </header>

        {activeTab === 'users' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <div className="flex bg-gray-50 p-1 rounded-2xl w-full md:w-auto">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'pro', label: 'Prestadores' },
                      { id: 'business', label: 'Lojas' },
                      { id: 'client', label: 'Clientes' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setUserFilter(tab.id as any)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${userFilter === tab.id ? 'bg-white text-primary shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                 </div>
                 <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar usuário..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                    />
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Email</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Papel</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destaque</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {filteredUsers.map(user => (
                             <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                         {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 font-black"><Users size={20}/></div>}
                                      </div>
                                      <div className="overflow-hidden">
                                         <p className="font-black text-gray-800 text-sm truncate">{user.name}</p>
                                         <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                      user.role === 'pro' ? 'bg-orange-100 text-orange-600' :
                                      user.role === 'business' ? 'bg-green-100 text-green-600' :
                                      user.role === 'client' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                   }`}>
                                      {user.role === 'pro' ? 'Prestador' : user.role === 'business' ? 'Loja' : user.role === 'client' ? 'Cliente' : 'Admin'}
                                   </span>
                                </td>
                                <td className="px-8 py-5">
                                   {isHighlighted(user) ? (
                                      <div className="flex items-center gap-3">
                                         <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Star size={10} fill="currentColor" /> DESTAQUE ({getRemainingDays(user.highlightExpiresAt!)}d)
                                         </span>
                                         <button onClick={() => handleRemoveHighlight(user)} className="text-red-400 hover:text-red-600 p-1" title="Remover Destaque"><X size={14}/></button>
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-2 group relative">
                                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">NORMAL</span>
                                         {(user.role === 'pro' || user.role === 'business') && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                               {[2, 7, 15, 30].map(d => (
                                                  <button 
                                                     key={d}
                                                     onClick={() => handleSetHighlight(user, d)}
                                                     className="bg-white border border-gray-200 hover:border-primary hover:text-primary text-[8px] font-black px-2 py-0.5 rounded transition-all shadow-sm"
                                                  >
                                                     {d}D
                                                  </button>
                                               ))}
                                            </div>
                                         )}
                                      </div>
                                   )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingUser(user)} className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 rounded-xl" title="Editar"><Edit size={18}/></button>
                                      <button 
                                         onClick={() => {
                                            if(window.confirm(`Deseja ${user.status === 'active' ? 'bloquear' : 'desbloquear'} este usuário?`)) {
                                               onUpdateUser({...user, status: user.status === 'active' ? 'banned' : 'active'});
                                            }
                                         }}
                                         className={`p-2 rounded-xl transition-colors ${user.status === 'active' ? 'text-gray-400 hover:text-orange-500' : 'text-green-500 hover:bg-green-50'}`}
                                         title={user.status === 'active' ? "Bloquear" : "Ativar"}
                                      >
                                         {user.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                                      </button>
                                      <button 
                                         onClick={() => { if(confirm('Excluir permanentemente?')) onDeleteUser(user.id); }}
                                         className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-xl"
                                         title="Excluir"
                                      >
                                         <Trash2 size={18}/>
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'util' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <Info size={20} className="text-blue-500" />
                <p className="text-xs font-bold text-blue-800 uppercase">Gerencie aqui os números de emergência, utilidades públicas e horários de ônibus do app.</p>
              </div>

              {/* Categorias de Utilidades */}
              {configForm.utilityCategories?.map((cat, catIndex) => (
                <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                   <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                           <button onClick={() => handleMoveUtilityCategory(catIndex, 'up')} disabled={catIndex === 0} className="text-gray-400 hover:text-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                           <button onClick={() => handleMoveUtilityCategory(catIndex, 'down')} disabled={catIndex === (configForm.utilityCategories?.length || 0) - 1} className="text-gray-400 hover:text-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                          <ListPlus size={20} className="text-primary" /> {cat.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{cat.items.length} itens</span>
                   </div>
                   <div className="p-6 space-y-4">
                      {cat.items.map((it, itIndex) => (
                        <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group relative items-end">
                           <div className="md:col-span-1 flex flex-col items-center gap-1">
                              <button onClick={() => handleMoveUtilityItem(cat.id, itIndex, 'up')} disabled={itIndex === 0} className="p-1 text-gray-400 hover:text-primary disabled:opacity-20"><ArrowUp size={14} /></button>
                              <button onClick={() => handleMoveUtilityItem(cat.id, itIndex, 'down')} disabled={itIndex === cat.items.length - 1} className="p-1 text-gray-400 hover:text-primary disabled:opacity-20"><ArrowDown size={14} /></button>
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Nome</label>
                              <input type="text" value={it.name} onChange={e => handleUpdateUtilityItem(cat.id, it.id, 'name', e.target.value)} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold" />
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Número/Link</label>
                              <input type="text" value={it.number} onChange={e => handleUpdateUtilityItem(cat.id, it.id, 'number', e.target.value)} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold" />
                           </div>
                           <div className="md:col-span-6">
                              <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Descrição Breve</label>
                              <input type="text" value={it.description} onChange={e => handleUpdateUtilityItem(cat.id, it.id, 'description', e.target.value)} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold" />
                           </div>
                           <div className="md:col-span-1 flex justify-center">
                              <button onClick={() => handleRemoveUtilityItem(cat.id, it.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                           </div>
                        </div>
                      ))}
                      <button onClick={() => handleAddUtilityItem(cat.id)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-xs uppercase hover:bg-gray-50 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                        <PlusCircle size={16} /> Adicionar Item em {cat.title}
                      </button>
                   </div>
                </div>
              ))}

              {/* Horários de Ônibus */}
              <div className="bg-white rounded-[2rem] border border-orange-100 shadow-xl overflow-hidden">
                <div className="p-6 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-orange-800 uppercase tracking-tight flex items-center gap-2">
                      <Bus size={20} className="text-orange-600" /> Horários de Ônibus
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    {configForm.busLines?.map((bus, busIndex) => (
                      <div key={bus.id} className="flex gap-3 p-4 bg-orange-50/30 rounded-2xl border border-orange-100 items-end">
                          <div className="flex flex-col gap-1 pr-2 border-r border-orange-100">
                             <button onClick={() => handleMoveBusLine(busIndex, 'up')} disabled={busIndex === 0} className="p-1 text-orange-300 hover:text-orange-600 disabled:opacity-20"><ArrowUp size={14} /></button>
                             <button onClick={() => handleMoveBusLine(busIndex, 'down')} disabled={busIndex === (configForm.busLines?.length || 0) - 1} className="p-1 text-orange-300 hover:text-orange-600 disabled:opacity-20"><ArrowDown size={14} /></button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[8px] font-black text-orange-400 uppercase mb-1">Nome da Linha</label>
                            <input type="text" value={bus.name} onChange={e => handleUpdateBusLine(bus.id, 'name', e.target.value)} className="w-full p-2 bg-white rounded-lg border border-orange-200 text-xs font-bold" />
                          </div>
                          <div className="flex-[2] flex gap-2">
                             <div className="flex-1">
                                <label className="block text-[8px] font-black text-orange-400 uppercase mb-1">URL (Link do Horário)</label>
                                <input type="text" value={bus.url} onChange={e => handleUpdateBusLine(bus.id, 'url', e.target.value)} className="w-full p-2 bg-white rounded-lg border border-orange-200 text-xs font-mono" />
                             </div>
                             <button onClick={() => handleRemoveBusLine(bus.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                          </div>
                      </div>
                    ))}
                    <button onClick={handleAddBusLine} className="w-full py-4 border-2 border-dashed border-orange-200 rounded-2xl text-orange-400 font-black text-xs uppercase hover:bg-gray-50 hover:border-orange-400 hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                        <PlusCircle size={16} /> Adicionar Linha
                    </button>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'identity' && (
           <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Palette size={32} /></div>
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Identidade Visual e Textos</h2>
                      <p className="text-blue-100 text-sm font-medium">Personalize as cores, logos e textos de interface do aplicativo.</p>
                   </div>
                </div>

                <div className="p-8 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-gray-100">
                      <div className="space-y-3">
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo do Aplicativo (PNG Transparente)</label>
                         <div className="relative group aspect-square w-40 h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden mx-auto md:mx-0">
                            {configForm.logoUrl ? <img src={configForm.logoUrl} className="w-full h-full object-contain p-4" /> : <AppLogo className="w-20 h-20 opacity-30" />}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer">
                               <Upload className="text-white mb-2" />
                               <span className="text-white font-black text-[10px] uppercase">Upload Logo</span>
                               <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                            </label>
                         </div>
                         <button onClick={() => configForm.logoUrl && window.open(configForm.logoUrl, '_blank')} className="w-full md:w-40 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-[10px] uppercase hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                            <Download size={14} /> Baixar Atual
                         </button>
                      </div>

                      <div className="md:col-span-2 space-y-6">
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cores do Tema</label>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                               <p className="text-xs font-bold text-gray-600">Primária</p>
                               <div className="flex gap-2">
                                  <input type="color" value={configForm.primaryColor} onChange={e => setConfigForm({...configForm, primaryColor: e.target.value})} className="h-12 w-12 cursor-pointer border-none rounded-xl" />
                                  <input type="text" value={configForm.primaryColor} onChange={e => setConfigForm({...configForm, primaryColor: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-mono font-bold uppercase" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <p className="text-xs font-bold text-gray-600">Accent</p>
                               <div className="flex gap-2">
                                  <input type="color" value={configForm.accentColor} onChange={e => setConfigForm({...configForm, accentColor: e.target.value})} className="h-12 w-12 cursor-pointer border-none rounded-xl" />
                                  <input type="text" value={configForm.accentColor} onChange={e => setConfigForm({...configForm, accentColor: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-mono font-bold uppercase" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <p className="text-xs font-bold text-gray-600">Sucesso</p>
                               <div className="flex gap-2">
                                  <input type="color" value={configForm.tertiaryColor} onChange={e => setConfigForm({...configForm, tertiaryColor: e.target.value})} className="h-12 w-12 cursor-pointer border-none rounded-xl" />
                                  <input type="text" value={configForm.tertiaryColor} onChange={e => setConfigForm({...configForm, tertiaryColor: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-mono font-bold uppercase" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Textos da Interface</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">Título do Cabeçalho (Header)</label>
                            <input type="text" value={configForm.headerTitle || ''} onChange={e => setConfigForm({...configForm, headerTitle: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="O Que Tem Perto?" />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">Subtítulo do Cabeçalho</label>
                            <input type="text" value={configForm.headerSubtitle || ''} onChange={e => setConfigForm({...configForm, headerSubtitle: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Águas Claras e Região" />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">Texto Principal do Rodapé (Footer)</label>
                            <input type="text" value={configForm.footerText || ''} onChange={e => setConfigForm({...configForm, footerText: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Desenvolvido pela" />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700">Subtexto do Rodapé</label>
                            <input type="text" value={configForm.footerSubtext || ''} onChange={e => setConfigForm({...configForm, footerSubtext: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Todos os direitos reservados" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-green-100 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Users size={32} /></div>
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Recursos Sociais</h2>
                      <p className="text-emerald-100 text-sm font-medium">Configure elementos de prova social e engajamento da comunidade.</p>
                   </div>
                </div>

                <div className="p-8">
                   <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                      <div className="flex gap-4">
                         <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm"><CheckCircle2 size={24} /></div>
                         <div>
                            <h3 className="font-black text-emerald-900 uppercase tracking-tight text-sm">Contador de Usuários na Home</h3>
                            <p className="text-emerald-700 text-xs font-medium">Exibe "+X pessoas já fazem parte" para novos visitantes.</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setConfigForm({...configForm, showUserCounter: !configForm.showUserCounter})}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${configForm.showUserCounter ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-600'}`}
                      >
                         {configForm.showUserCounter ? <ToggleRight /> : <ToggleLeft />}
                         {configForm.showUserCounter ? 'ATIVADO' : 'DESATIVADO'}
                      </button>
                   </div>
                </div>
             </div>
           </div>
        )}

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

        {activeTab === 'marketing' && (
           <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><QrCode size={32} /></div>
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">QR Code do App</h2>
                      <p className="text-blue-100 text-sm font-medium">Divulgue seu aplicativo em materiais impressos.</p>
                   </div>
                </div>
                <div className="p-10 flex flex-col md:flex-row items-center gap-12">
                   <div className="w-64 h-64 bg-gray-50 rounded-[2.5rem] p-6 border-8 border-gray-100 shadow-inner flex items-center justify-center">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(configForm.shareUrl || window.location.origin)}`} alt="QR Code" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1 space-y-6">
                      <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">QR Code</h3>
                      <p className="text-gray-500 font-medium mt-1">Aponte a câmera do celular para abrir o aplicativo instantaneamente.</p>
                      <button onClick={handleDownloadQRCode} className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-2xl shadow-xl flex items-center gap-3 transition-all active:scale-95">
                         <Download size={20} /> Baixar para Impressão
                      </button>
                   </div>
                </div>
             </div>
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 bg-gray-50 border-b border-gray-100">
                   <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><Globe size={24} className="text-primary" /> Links de Divulgação</h3>
                </div>
                <div className="p-8 space-y-8">
                   <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL de Compartilhamento</label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" value={configForm.shareUrl || ''} onChange={e => setConfigForm({...configForm, shareUrl: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
                         </div>
                         <button onClick={() => copyToClipboard(configForm.shareUrl || '')} className="p-4 bg-gray-100 text-gray-400 hover:text-primary rounded-2xl transition-all"><Copy size={20} /></button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Instagram Principal</label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" value={configForm.instagramUrl || ''} onChange={e => setConfigForm({...configForm, instagramUrl: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
                         </div>
                         <button onClick={() => copyToClipboard(configForm.instagramUrl || '')} className="p-4 bg-gray-100 text-gray-400 hover:text-primary rounded-2xl transition-all"><Copy size={20} /></button>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'campaign' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* PROJETO SOCIAL (DOAÇÃO) */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
               <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Heart size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Projeto Social (Doação)</h2>
                       <p className="text-red-100 text-sm font-medium">Gerencie a causa social que aparece no aplicativo.</p>
                    </div>
                  </div>
                  <button onClick={() => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, active: !configForm.socialProject?.active}})} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${configForm.socialProject?.active ? 'bg-white text-red-600 shadow-lg' : 'bg-red-800/50 text-red-200'}`}>
                    {configForm.socialProject?.active ? <ToggleRight /> : <ToggleLeft />} {configForm.socialProject?.active ? 'PROJETO ATIVO NA HOME' : 'PROJETO INATIVO'}
                  </button>
               </div>
               <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Imagem do Projeto</label>
                       <div className="relative group aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                          {configForm.socialProject?.imageUrl ? <img src={configForm.socialProject.imageUrl} className="w-full h-full object-contain p-4" /> : <ImageIcon size={48} className="text-gray-300" />}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer">
                             <Upload className="text-white mb-2" /><span className="text-white font-black text-[10px] uppercase">Mudar Foto</span>
                             <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'social')} />
                          </label>
                       </div>
                       <div className="space-y-4 pt-2">
                          <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Tamanho da Foto</label>
                            <select value={configForm.socialProject?.imageScale || 'md'} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, imageScale: e.target.value as any}})} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-gray-100">
                               <option value="sm">Pequeno</option><option value="md">Médio</option><option value="lg">Grande</option><option value="xl">Extra Grande</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, transparentBg: !configForm.socialProject?.transparentBg}})} className={`flex-1 p-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${configForm.socialProject?.transparentBg ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}>Fundo Transp.</button>
                             <div className="flex-1">
                                <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Cor Cabeçalho</label>
                                <input type="color" value={configForm.socialProject?.headerColor || '#ef4444'} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, headerColor: e.target.value}})} className="w-full h-10 rounded-xl cursor-pointer" />
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase">Nome do Projeto</label>
                             <input type="text" value={configForm.socialProject?.name || ''} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, name: e.target.value}})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Projeto Gotinhas de Amor" />
                          </div>
                          <div className="space-y-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase">Instagram (sem @)</label>
                             <div className="relative">
                                <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={configForm.socialProject?.instagram || ''} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, instagram: e.target.value}})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="gotinhasdeamorcapelania" />
                             </div>
                          </div>
                          <div className="md:col-span-2 space-y-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase">Chave Pix (E-mail)</label>
                             <div className="relative">
                                <QrCode size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={configForm.socialProject?.pixKey || ''} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, pixKey: e.target.value}})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-mono text-sm" placeholder="gracachurchcl@gmail.com" />
                             </div>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase">Descrição do Projeto</label>
                          <textarea rows={4} value={configForm.socialProject?.description || ''} onChange={e => setConfigForm({...configForm, socialProject: {...configForm.socialProject!, description: e.target.value}})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary font-medium text-sm leading-relaxed" placeholder="Descreva aqui o trabalho social..." />
                       </div>
                    </div>
                  </div>
               </div>
            </div>
            {/* CAMPANHA BANNER (HOME) */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Megaphone size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Campanha Banner (Home)</h2>
                       <p className="text-blue-100 text-sm font-medium">Banner principal de destaque no topo da página inicial.</p>
                    </div>
                  </div>
                  <button onClick={() => setConfigForm({...configForm, campaign: {...configForm.campaign!, active: !configForm.campaign?.active}})} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${configForm.campaign?.active ? 'bg-white text-blue-600 shadow-lg' : 'bg-blue-800/50 text-red-200'}`}>
                    {configForm.campaign?.active ? <ToggleRight /> : <ToggleLeft />} {configForm.campaign?.active ? 'EXIBIR BANNER NA HOME' : 'BANNER OCULTO'}
                  </button>
               </div>
               <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Imagem da Campanha</label>
                        <div className="relative aspect-[16/9] md:aspect-auto md:h-64 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                           {configForm.campaign?.imageUrl ? <img src={configForm.campaign.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-gray-300" />}
                           <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                              <span className="text-white font-black text-[10px] uppercase">Selecionar Imagem</span>
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'campaign')} />
                           </label>
                        </div>
                     </div>
                     <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                           <label className="block text-[10px] font-black text-gray-400 uppercase">Título do Banner</label>
                           <input type="text" value={configForm.campaign?.title || ''} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, title: e.target.value}})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg" placeholder="Ofertas de Verão ou Nova Categoria" />
                        </div>
                        <div className="space-y-2">
                           <label className="block text-[10px] font-black text-gray-400 uppercase">Texto Informativo Breve</label>
                           <input type="text" value={configForm.campaign?.description || ''} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, description: e.target.value}})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Confira as novidades do comércio local..." />
                        </div>
                        <div className="space-y-2">
                           <label className="block text-[10px] font-black text-gray-400 uppercase">Link de Destino ou URL da Imagem Externa</label>
                           <div className="relative">
                              <ExternalLink size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" value={configForm.campaign?.link || ''} onChange={e => setConfigForm({...configForm, campaign: {...configForm.campaign!, link: e.target.value}})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs" placeholder="https://..." />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-[2.5rem] border border-purple-100 shadow-xl overflow-hidden">
                 <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Settings size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Configurações do Painel</h2>
                       <p className="text-purple-100 text-sm font-medium">Salve ou restaure apenas a identidade visual e links.</p>
                    </div>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={handleExportConfigOnly} className="bg-indigo-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95"><Download size={20} /> EXPORTAR PREFERÊNCIAS</button>
                    <label className="cursor-pointer bg-purple-50 border-2 border-dashed border-purple-200 rounded-3xl p-5 flex flex-col items-center justify-center hover:bg-purple-100">
                       <UploadCloud className="text-purple-600 mb-1" />
                       <span className="text-purple-600 font-bold text-xs uppercase">Importar Preferências</span>
                       <input type="file" className="hidden" accept=".json" onChange={handleRestoreConfigOnly} />
                    </label>
                 </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-600 to-primary p-8 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Database size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Backup Total do Sistema</h2>
                       <p className="text-blue-100 text-sm font-medium">Snapshot completo: Usuários, Avaliações, Fotos e Configurações.</p>
                    </div>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={handleGenerateTotalSnapshot} className="bg-primary text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95"><DownloadCloud size={20} /> EXPORTAR SNAPSHOT TOTAL</button>
                    <label className="cursor-pointer bg-red-50 border-2 border-dashed border-red-200 rounded-3xl p-5 flex flex-col items-center justify-center hover:bg-red-100">
                       <RotateCcw className="text-red-600 mb-1" />
                       <span className="text-red-600 font-bold text-xs uppercase">Restauração de Emergência</span>
                       <input type="file" className="hidden" accept=".json" onChange={handleRestoreFromSnapshot} />
                    </label>
                 </div>
              </div>

              {/* NOVAS SEÇÕES DE RECONSTRUÇÃO */}
              <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl overflow-hidden">
                 <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Code size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Reconstrução e APK</h2>
                       <p className="text-emerald-100 text-sm font-medium">Exporte o "Prompt" completo para recriar o aplicativo identicamente.</p>
                    </div>
                 </div>
                 <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                       <div className="flex-1">
                          <p className="text-sm text-emerald-800 leading-relaxed">
                             Este prompt contém todas as regras de negócio, estrutura de pastas, tecnologias e variáveis necessárias para recriar o app do zero em qualquer IA de codificação.
                          </p>
                       </div>
                       <button 
                         onClick={() => handleDownloadPrompt('system')}
                         className="bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all w-full md:w-auto whitespace-nowrap"
                       >
                          <FileText size={20} /> Baixar Prompt do Sistema
                       </button>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-xl overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Terminal size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Reconstrução do Painel Administrativo</h2>
                       <p className="text-indigo-100 text-sm font-medium">Exporte o "Prompt" completo para recriar o painel administrativo.</p>
                    </div>
                 </div>
                 <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                       <div className="flex-1">
                          <p className="text-sm text-indigo-800 leading-relaxed">
                             Prompt técnico detalhando as abas de gestão, lógica de destaques, backups, regras de segurança do Firebase e fluxos de administração.
                          </p>
                       </div>
                       <button 
                         onClick={() => handleDownloadPrompt('admin')}
                         className="bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all w-full md:w-auto whitespace-nowrap"
                       >
                          <FileText size={20} /> Baixar Prompt do Painel Administrativo
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default PainelAdministrativo;

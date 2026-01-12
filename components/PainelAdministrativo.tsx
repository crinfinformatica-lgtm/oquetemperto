
import React, { useState, useEffect, useRef } from 'react';
import { User, AppConfig, UtilityCategory, UtilityItem, BusLine, Campaign, SocialProject } from '../types';
import { 
  Users, Shield, Store, Briefcase, Lock, Unlock, Trash2, 
  Palette, Save, LogOut, Zap, ListPlus, Megaphone, Share2, 
  RefreshCw, X, ArrowUp, ArrowDown, Globe, Edit, Star, 
  Phone, Info, Smartphone, ExternalLink, QrCode, Database,
  Bus, Download, Copy, Heart, Upload, FileText, Type as TypeIcon, Image as ImageIcon, Maximize, Instagram, Facebook,
  MapPin, Menu, History, RotateCcw, ShieldCheck, DownloadCloud, UploadCloud, AlertTriangle, Code, Settings,
  ToggleLeft, ToggleRight, Layout, CheckCircle2, Plus, PlusCircle, Link as LinkIcon, Search, MoreHorizontal, Clock, Terminal, CheckSquare, Square, Gavel, Loader2, Check, AlertCircle, Sparkles, Camera, Layers, Siren, Flame, Activity, Building2, Droplets, FileDown, ShieldAlert, Wand2, HelpCircle
} from 'lucide-react';
import { db, hasValidConfig } from '../services/firebase';
import { ref, onValue, set, get, update, remove } from 'firebase/database';
import { ALLOWED_NEIGHBORHOODS, CATEGORIES } from '../constants';
import AppLogo from './AppLogo';
import { GoogleGenAI } from "@google/genai";

/** 
 * MECANISMO DE SEGURANÇA MODULAR
 */

// --- UTILS ---
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
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const downloadJSON = (content: any, filename: string) => {
  const a = document.createElement('a');
  const file = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

// --- MÓDULO: IDENTIDADE VISUAL E TEXTOS ---
const IdentityTab = ({ config, setConfig }: { config: AppConfig, setConfig: (c: AppConfig) => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const base64 = await compressImage(e.target.files[0]);
      setConfig({ ...config, logoUrl: base64 });
    }
  };

  const handleRemoveBackground = async () => {
    if (!config.logoUrl) return alert("Selecione uma imagem primeiro!");
    
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = config.logoUrl.split(',')[1];
      const mimeType = config.logoUrl.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: 'Remova o fundo desta imagem, tornando-o completamente transparente. Retorne apenas a imagem processada.' },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
          setConfig({ ...config, logoUrl: resultBase64 });
          alert("✅ Fundo removido com sucesso!");
          break;
        }
      }
    } catch (error) {
      console.error("Erro ao remover fundo:", error);
      alert("❌ Falha ao processar imagem. Verifique sua conexão.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadLogo = () => {
    if (!config.logoUrl) return;
    const link = document.createElement('a');
    link.href = config.logoUrl;
    link.download = 'app-logo-atual.png';
    link.click();
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4">
      <div className="p-8 border-b border-gray-50">
        <h2 className="text-xl font-black text-gray-800 uppercase">Identidade Visual e Textos</h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personalize as cores, logos e textos de interface do aplicativo.</p>
      </div>
      <div className="p-8 space-y-10">
        {/* Logo Section */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo do Aplicativo (PNG Transparente)</label>
          <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden p-2 relative group">
              {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-contain" /> : <AppLogo className="w-16 h-16 opacity-20" />}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={32} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <label className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <Upload size={14} /> Upload Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
              
              <button 
                onClick={handleRemoveBackground}
                disabled={!config.logoUrl || isProcessing}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale shadow-lg shadow-purple-200"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
                Remover Fundo (IA)
              </button>

              {config.logoUrl && (
                <button onClick={handleDownloadLogo} className="bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <Download size={14} /> Baixar Atual
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4 pt-4 border-t border-gray-50">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cores do Tema</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[ 
              {l: 'Primária', k: 'primaryColor', val: '#0047AB'}, 
              {l: 'Accent', k: 'accentColor', val: '#DC143C'}, 
              {l: 'Sucesso', k: 'tertiaryColor', val: '#166534'} 
            ].map(c => (
              <div key={c.k} className="space-y-2">
                <p className="text-xs font-bold text-gray-700">{c.l}</p>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <input type="color" value={(config as any)[c.k]} onChange={e => setConfig({...config, [c.k]: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono font-black uppercase block">{(config as any)[c.k]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Texts Section */}
        <div className="space-y-6 pt-4 border-t border-gray-50">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Textos da Interface</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Título do Cabeçalho (Header)</label>
              <input value={config.headerTitle} onChange={e => setConfig({...config, headerTitle: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="O Que Tem Perto?" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Subtítulo do Cabeçalho</label>
              <input value={config.headerSubtitle} onChange={e => setConfig({...config, headerSubtitle: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Águas Claras e Região" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Texto Principal do Rodapé (Footer)</label>
              <input value={config.footerText} onChange={e => setConfig({...config, footerText: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Desenvolvido pela" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Subtexto do Rodapé</label>
              <input value={config.footerSubtext} onChange={e => setConfig({...config, footerSubtext: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Todos os direitos reservados" />
            </div>
          </div>
        </div>

        {/* Social Features */}
        <div className="pt-8 border-t border-gray-50">
           <div className="mb-4">
              <h3 className="text-sm font-black text-gray-800 uppercase">Recursos Sociais</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Configure elementos de prova social e engajamento da comunidade.</p>
           </div>
           <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <div>
              <p className="font-black text-gray-800 text-sm uppercase">Contador de Usuários na Home</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Exibe "+X pessoas já fazem parte" para novos visitantes.</p>
            </div>
            <button onClick={() => setConfig({...config, showUserCounter: !config.showUserCounter})} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.showUserCounter ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}>
              {config.showUserCounter ? 'ATIVADO' : 'DESATIVADO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MÓDULO: UTILIDADES ---
const UtilityTab = ({ config, setConfig }: { config: AppConfig, setConfig: (c: AppConfig) => void }) => {
  const addUtilityItem = (catId: string) => {
    const newCats = config.utilityCategories?.map(cat => cat.id === catId ? { ...cat, items: [...cat.items, { id: `item-${Date.now()}`, name: '', number: '', description: '' }] } : cat);
    setConfig({ ...config, utilityCategories: newCats });
  };
  const removeUtilityItem = (catId: string, itemId: string) => {
    const newCats = config.utilityCategories?.map(cat => cat.id === catId ? { ...cat, items: cat.items.filter(i => i.id !== itemId) } : cat);
    setConfig({ ...config, utilityCategories: newCats });
  };
  const updateUtilityItem = (catId: string, itemId: string, field: keyof UtilityItem, value: string) => {
    const newCats = config.utilityCategories?.map(cat => cat.id === catId ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) } : cat);
    setConfig({ ...config, utilityCategories: newCats });
  };
  const addBusLine = () => setConfig({ ...config, busLines: [...(config.busLines || []), { id: `bus-${Date.now()}`, name: '', url: '' }] });

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-12 animate-in slide-in-from-right-4">
      {config.utilityCategories?.map(cat => (
        <div key={cat.id} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="text-2xl">{cat.title.split(' ')[0]}</span>
            <h3 className="text-lg font-black text-gray-800 uppercase">{cat.title.substring(cat.title.indexOf(' ') + 1)}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cat.items.map(item => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 p-5 rounded-[2rem] relative group hover:bg-white transition-all">
                <button onClick={() => removeUtilityItem(cat.id, item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                <div className="space-y-3">
                  <input value={item.name} placeholder="Nome" onChange={e => updateUtilityItem(cat.id, item.id, 'name', e.target.value)} className="w-full bg-white px-3 py-2 rounded-xl text-xs font-bold border border-gray-100 outline-none" />
                  <input value={item.number} placeholder="Número/Link" onChange={e => updateUtilityItem(cat.id, item.id, 'number', e.target.value)} className="w-full bg-white px-3 py-2 rounded-xl text-xs font-black border border-gray-100 outline-none" />
                  <input value={item.description} placeholder="Descrição Breve" onChange={e => updateUtilityItem(cat.id, item.id, 'description', e.target.value)} className="w-full bg-white px-3 py-2 rounded-xl text-[10px] border border-gray-100 outline-none" />
                </div>
              </div>
            ))}
            <button onClick={() => addUtilityItem(cat.id)} className="border-4 border-dashed border-gray-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-primary transition-all">
              <PlusCircle size={32} /> <span className="text-[10px] font-black uppercase">Adicionar Item</span>
            </button>
          </div>
        </div>
      ))}
      <div className="pt-8 border-t border-gray-100 space-y-6">
        <div className="flex items-center gap-3"><Bus className="text-primary" size={24} /><h3 className="text-xl font-black text-gray-800 uppercase">Horários de Ônibus</h3></div>
        {config.busLines?.map(line => (
          <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
            <div className="md:col-span-4"><input value={line.name} placeholder="Nome da Linha" onChange={e => setConfig({...config, busLines: config.busLines?.map(l => l.id === line.id ? {...l, name: e.target.value} : l)})} className="w-full bg-white px-4 py-3 rounded-2xl text-xs font-bold border border-gray-100" /></div>
            <div className="md:col-span-7"><input value={line.url} placeholder="URL do Horário" onChange={e => setConfig({...config, busLines: config.busLines?.map(l => l.id === line.id ? {...l, url: e.target.value} : l)})} className="w-full bg-white px-4 py-3 rounded-2xl text-xs font-mono border border-gray-100" /></div>
            <div className="md:col-span-1 flex justify-end"><button onClick={() => setConfig({...config, busLines: config.busLines?.filter(l => l.id !== line.id)})} className="text-gray-300 hover:text-red-500"><Trash2 size={20}/></button></div>
          </div>
        ))}
        <button onClick={addBusLine} className="w-full border-4 border-dashed border-gray-100 rounded-[2rem] py-6 flex items-center justify-center gap-3 text-gray-300 hover:text-primary transition-all"><Plus size={20} /><span className="text-[10px] font-black uppercase">Adicionar Linha</span></button>
      </div>
    </div>
  );
};

// --- MÓDULO: CAMPANHAS E PROJETO SOCIAL ---
const CampaignTab = ({ config, setConfig }: { config: AppConfig, setConfig: (c: AppConfig) => void }) => {
  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>, target: 'project' | 'banner') => {
    if (e.target.files?.[0]) {
      const base64 = await compressImage(e.target.files[0]);
      if (target === 'project') setConfig({...config, socialProject: { ...(config.socialProject || ({} as any)), imageUrl: base64 }});
      else setConfig({...config, campaign: { ...(config.campaign || ({} as any)), imageUrl: base64 }});
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      {/* PROJETO SOCIAL */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div><h2 className="text-xl font-black text-gray-800 uppercase">Projeto Social (Doação)</h2><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Gerencie a causa social que aparece no aplicativo.</p></div>
          <button onClick={() => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), active: !config.socialProject?.active}})} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${config.socialProject?.active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'}`}>
            {config.socialProject?.active ? <Zap size={14} fill="currentColor" /> : <X size={14} />}
            {config.socialProject?.active ? 'PROJETO ATIVO NA HOME' : 'PROJETO OCULTO'}
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 flex flex-col items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Imagem do Projeto</p>
            <div className="w-40 h-40 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group">
              {config.socialProject?.imageUrl ? <img src={config.socialProject.imageUrl} className="w-full h-full object-contain" /> : <Heart size={64} className="text-gray-100" />}
              <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera size={24} />
                <span className="text-[10px] font-black uppercase mt-1">Mudar Foto</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImg(e, 'project')} />
              </label>
            </div>
            
            <div className="w-full mt-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tamanho da Foto</label>
                <select 
                   value={config.socialProject?.imageScale || 'md'}
                   onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), imageScale: e.target.value as any}})}
                   className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="sm">Pequeno</option>
                  <option value="md">Médio</option>
                  <option value="lg">Grande</option>
                  <option value="xl">Extra Grande</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Fundo Transp.</span>
                <button 
                  onClick={() => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), transparentBg: !config.socialProject?.transparentBg}})}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${config.socialProject?.transparentBg ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${config.socialProject?.transparentBg ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cor Cabeçalho</label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <input 
                    type="color" 
                    value={config.socialProject?.headerColor || '#ef4444'} 
                    onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), headerColor: e.target.value}})}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent p-0" 
                  />
                  <span className="text-[10px] font-mono font-black uppercase text-gray-500">{config.socialProject?.headerColor || '#ef4444'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Projeto</label>
              <input value={config.socialProject?.name} placeholder="Projeto Gotinhas de Amor" onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), name: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Instagram (sem @)</label>
                <input value={config.socialProject?.instagram} placeholder="gotinhasdeamorcapelania" onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), instagram: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Chave Pix (E-mail)</label>
                <input value={config.socialProject?.pixKey} placeholder="gracachurchcl@gmail.com" onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), pixKey: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Descrição do Projeto</label>
              <textarea value={config.socialProject?.description} placeholder="Capelania hospitalar..." rows={3} onChange={e => setConfig({...config, socialProject: {...(config.socialProject || ({} as any)), description: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm resize-none outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* BANNER HOME */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-50 pb-6">
          <div><h2 className="text-xl font-black text-gray-800 uppercase">Campanha Banner (Home)</h2><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Banner principal de destaque no topo da página inicial.</p></div>
          <button onClick={() => setConfig({...config, campaign: {...(config.campaign || ({} as any)), active: !config.campaign?.active}})} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${config.campaign?.active ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
            {config.campaign?.active ? 'BANNER ATIVO' : 'BANNER OCULTO'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imagem da Campanha</p>
            <div className="aspect-video bg-gray-50 rounded-3xl border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group">
              {config.campaign?.imageUrl ? <img src={config.campaign.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-gray-100" />}
              <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload size={24} /> <span className="text-[10px] font-black uppercase mt-1">Selecionar Imagem</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImg(e, 'banner')} />
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Título do Banner</label>
              <input value={config.campaign?.title} placeholder="Ofertas de Verão ou Nova Categoria" onChange={e => setConfig({...config, campaign: {...(config.campaign || ({} as any)), title: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Texto Informativo Breve</label>
              <input value={config.campaign?.description} placeholder="Confira as novidades do comércio local..." onChange={e => setConfig({...config, campaign: {...(config.campaign || ({} as any)), description: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Link de Destino ou URL Externa</label>
              <input value={config.campaign?.link} placeholder="https://..." onChange={e => setConfig({...config, campaign: {...(config.campaign || ({} as any)), link: e.target.value}})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MÓDULO: DIVULGAÇÃO (QR CODE E LINKS) ---
const MarketingTab = ({ config, setConfig }: { config: AppConfig, setConfig: (c: AppConfig) => void }) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(config.shareUrl || window.location.origin)}`;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      {/* QR CODE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h2 className="text-xl font-black text-gray-800 uppercase">QR Code do App</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Divulgue seu aplicativo em materiais impressos.</p>
        </div>
        <div className="p-10 flex flex-col items-center">
          <div className="mb-4 w-full text-center">
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">QR Code</h3>
          </div>
          <div className="w-64 h-64 bg-white border-8 border-gray-50 rounded-[2.5rem] p-6 flex items-center justify-center shadow-inner mb-6 transition-all hover:scale-105">
            <img 
              src={qrCodeUrl} 
              className="w-full h-full object-contain" 
              alt="QR Code do App"
              key={config.shareUrl} 
            />
          </div>
          <p className="text-sm font-bold text-gray-600 text-center max-w-xs mb-8">
            Aponte a câmera do celular para abrir o aplicativo instantaneamente.
          </p>
          <button 
            onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(config.shareUrl || window.location.origin)}&download=1`, '_blank')} 
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-black"
          >
            <Download size={18} /> Baixar para Impressão
          </button>
        </div>
      </div>

      {/* LINKS DE DIVULGAÇÃO */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 space-y-6">
        <h2 className="text-xl font-black text-gray-800 uppercase border-b border-gray-50 pb-4">Links de Divulgação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL de Compartilhamento</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={config.shareUrl || ''} 
                onChange={e => setConfig({...config, shareUrl: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="https://oquetempertocl.web.app"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Instagram Principal</label>
            <div className="relative">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={config.instagramUrl || ''} 
                onChange={e => setConfig({...config, instagramUrl: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="https://www.instagram.com/crinfinformatica/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MÓDULO: FERRAMENTAS E RESILIÊNCIA ---
const ToolsTab = ({ config, setConfig, users }: { config: AppConfig, setConfig: (c: AppConfig) => void, users: User[] }) => {
  const exportPrefs = () => downloadJSON({ config, timestamp: new Date().toISOString() }, 'preferencias.json');
  const exportSnap = () => downloadJSON({ config, users, timestamp: new Date().toISOString() }, 'snapshot-total.json');
  
  const genPrompt = (type: 'system' | 'admin') => {
    const content = type === 'system' 
      ? `PROMPT RECONSTRUÇÃO APP CLIENTE\nConfig: ${JSON.stringify(config)}`
      : `PROMPT RECONSTRUÇÃO PAINEL ADMIN\nConfig: ${JSON.stringify(config)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 space-y-12 animate-in slide-in-from-right-4">
      <div>
        <h2 className="text-xl font-black text-gray-800 uppercase mb-2">Configurações do Painel</h2>
        <p className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-wider">Salve ou restaure preferências de identidade e links.</p>
        <div className="flex flex-wrap gap-4">
          <button onClick={exportPrefs} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
            <DownloadCloud size={18} /> EXPORTAR PREFERÊNCIAS
          </button>
          <label className="bg-gray-100 text-gray-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 cursor-pointer border border-gray-200 hover:bg-gray-200 transition-all">
            <UploadCloud size={18} /> Importar Preferências 
            <input type="file" className="hidden" accept=".json" onChange={async e => {
              if (e.target.files?.[0]) {
                const text = await e.target.files[0].text();
                const data = JSON.parse(text);
                setConfig({ ...config, ...(data.config || data) });
                alert('Preferências carregadas. Salve para aplicar.');
              }
            }} />
          </label>
        </div>
      </div>
      <div className="pt-10 border-t border-gray-50">
        <h2 className="text-xl font-black text-gray-800 uppercase mb-2">Backup Total do Sistema</h2>
        <p className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-wider">Snapshot completo: Usuários, Avaliações, Fotos e Configurações.</p>
        <button onClick={exportSnap} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all">
          <Database size={18} /> EXPORTAR SNAPSHOT TOTAL
        </button>
      </div>
      <div className="pt-10 border-t border-gray-50">
        <h2 className="text-xl font-black text-gray-800 uppercase mb-2">Reconstrução e APK</h2>
        <p className="text-sm font-medium text-gray-600 mb-6">Exporte o "Prompt" completo para recriar o aplicativo identicamente.</p>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => genPrompt('system')} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"><FileText size={18} /> Baixar Prompt do Sistema</button>
          <button onClick={() => genPrompt('admin')} className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"><Code size={18} /> Baixar Prompt do Painel Administrativo</button>
        </div>
      </div>
    </div>
  );
};

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

// --- COMPONENTE PRINCIPAL: ORQUESTRADOR ---
const PainelAdministrativo: React.FC<PainelAdministrativoProps> = ({ 
  currentUser, appConfig, onUpdateConfig, onDeleteUser, onLogout, onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'util' | 'identity' | 'marketing' | 'campaign' | 'tools' | 'blacklist'>('dashboard');
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<AppConfig>(appConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeletionHelper, setShowDeletionHelper] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidConfig || !db || Object.keys(db).length === 0) return setIsLoading(false);
    const unsubscribe = onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      setLocalUsers(data ? Object.entries(data).map(([k, v]: any) => ({ ...v, id: k })) : []);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { setConfigForm(appConfig); }, [appConfig]);

  const handleSave = async () => {
    setIsSavingConfig(true);
    try { await onUpdateConfig(configForm); alert('✅ Alterações salvas!'); }
    catch { alert('❌ Erro ao salvar.'); }
    finally { setIsSavingConfig(false); }
  };

  const setHighlight = (user: User, days: number) => {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    onUpdateUser({ ...user, highlightExpiresAt: expiresAt });
    alert(`✅ Destaque de ${days} dias aplicado com sucesso!`);
  };

  const removeHighlight = (user: User) => {
    onUpdateUser({ ...user, highlightExpiresAt: undefined });
    alert(`✅ Destaque removido.`);
  };

  const handleDeleteUserFlow = async (userId: string, email: string) => {
     if(window.confirm(`ATENÇÃO: Deseja apagar os DADOS de ${email}? \n\nNota: Isso apaga o perfil do app, mas para apagar o e-mail de login permanentemente você deve seguir o passo extra no Console do Firebase.`)) {
        try {
           await onDeleteUser(userId);
           setShowDeletionHelper(email);
        } catch (e) {
           // Erro já tratado no App.tsx
        }
     }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`flex flex-col w-72 bg-[#0F172A] h-screen fixed left-0 top-0 overflow-y-auto z-[60] shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 flex flex-col items-center relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-6 right-6 text-gray-400 p-2 hover:bg-white/5 rounded-xl transition-colors">
             <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-4 shadow-xl flex items-center justify-center overflow-hidden">
            {configForm.logoUrl ? <img src={configForm.logoUrl} className="w-full h-full object-contain" /> : <AppLogo className="w-8 h-8" />}
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-widest text-center">{configForm.appName}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase">Gestão</div>
          {[
            {id: 'dashboard', l: 'Início', i: <Layout size={20}/>},
            {id: 'users', l: 'Usuários', i: <Users size={20}/>},
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>
              {item.i} {item.l}
            </button>
          ))}
          <div className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase">Configuração</div>
          {[
            {id: 'util', l: 'Utilidades', i: <ListPlus size={20}/>},
            {id: 'identity', l: 'Identidade', i: <Palette size={20}/>},
            {id: 'marketing', l: 'Divulgação', i: <Share2 size={20}/>},
            {id: 'campaign', l: 'Campanhas', i: <Megaphone size={20}/>},
            {id: 'tools', l: 'Resiliência', i: <History size={20}/>},
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>
              {item.i} {item.l}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-2xl text-xs font-black uppercase transition-all">
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-10 pb-32">
        {/* Modal de Ajuda na Exclusão */}
        {showDeletionHelper && (
           <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <ShieldCheck size={32} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 text-center uppercase mb-4">Dados Apagados!</h3>
                 <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                    O perfil de <strong className="text-gray-900">{showDeletionHelper}</strong> não aparece mais no app.
                 </p>
                 <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 mb-8">
                    <p className="text-[10px] font-black text-orange-700 uppercase mb-2 flex items-center gap-2">
                       <HelpCircle size={14} /> Passo Final (Obrigatório)
                    </p>
                    <p className="text-xs text-orange-900 leading-tight">
                       Para apagar o **login de acesso** do Google:
                       <br/><br/>
                       1. Vá no Console do Firebase.<br/>
                       2. Menu <strong>Authentication</strong> {'->'} <strong>Users</strong>.<br/>
                       3. Apague o e-mail {showDeletionHelper}.
                    </p>
                 </div>
                 <button onClick={() => setShowDeletionHelper(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    Entendi, Concluir
                 </button>
              </div>
           </div>
        )}

        <div className="md:hidden sticky top-0 z-50 flex justify-between items-center mb-6 bg-white/90 backdrop-blur-md p-4 -mx-4 border-b border-gray-100 shadow-sm">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                 <ShieldCheck size={20} />
              </div>
              <h1 className="font-black text-gray-800 uppercase text-xs tracking-wider">Gestão Administrativa</h1>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl text-gray-700 active:scale-95 transition-all shadow-sm">
              <Menu size={24} />
           </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
           <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase leading-none mb-2">Painel Administrativo</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestão de Conteúdo e Serviços</p>
           </div>
           <button onClick={handleSave} disabled={isSavingConfig} className="bg-primary text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 w-full md:w-auto">
              {isSavingConfig ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SALVAR ALTERAÇÕES
           </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-orange-200 transition-all">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prestadores</p>
                      <button onClick={() => setActiveTab('users')} className="text-[10px] text-orange-500 font-bold hover:underline">exibir relatório</button>
                   </div>
                   <Briefcase size={24} className="text-orange-100 group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-6xl font-black text-orange-600 mt-6 tracking-tighter">{localUsers.filter(u => u.role === 'pro').length}</h3>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-green-200 transition-all">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comércios</p>
                   <Store size={24} className="text-green-100 group-hover:text-green-500 transition-colors" />
                </div>
                <h3 className="text-6xl font-black text-green-600 mt-6 tracking-tighter">{localUsers.filter(u => u.role === 'business').length}</h3>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes</p>
                   <Users size={24} className="text-blue-100 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-6xl font-black text-blue-600 mt-6 tracking-tighter">{localUsers.filter(u => u.role === 'client').length}</h3>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-purple-200 transition-all">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admins</p>
                   <Shield size={24} className="text-purple-100 group-hover:text-purple-500 transition-colors" />
                </div>
                <h3 className="text-6xl font-black text-purple-600 mt-6 tracking-tighter">{localUsers.filter(u => u.role === 'admin' || u.role === 'master').length}</h3>
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4">
             <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-black text-gray-800 uppercase">Gestão de Usuários</h2>
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input type="text" placeholder="Buscar por nome ou email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-100 p-3 pl-12 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary w-full md:w-64" />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr><th className="px-8 py-4">Usuário</th><th className="px-8 py-4">Papel</th><th className="px-8 py-4">Destaque (Duração)</th><th className="px-8 py-4 text-right">Ações</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {localUsers.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                         <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center font-black text-primary">
                                     {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                                  </div>
                                  <div><p className="text-sm font-black text-gray-800">{user.name}</p><p className="text-[10px] font-bold text-gray-400">{user.email}</p></div>
                               </div>
                            </td>
                            <td className="px-8 py-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-md border bg-blue-50 text-blue-600 border-blue-100">{user.role}</span></td>
                            <td className="px-8 py-4">
                               <div className="flex flex-wrap gap-1">
                                  {user.highlightExpiresAt && new Date(user.highlightExpiresAt) > new Date() ? (
                                    <div className="flex items-center gap-2">
                                       <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                          <Zap size={10} fill="currentColor" /> Ativo
                                       </span>
                                       <button onClick={() => removeHighlight(user)} className="text-red-400 hover:text-red-600 p-1" title="Remover Destaque"><X size={12}/></button>
                                    </div>
                                  ) : (
                                    <>
                                       {[2, 7, 15, 30].map(d => (
                                          <button 
                                            key={d} 
                                            onClick={() => setHighlight(user, d)}
                                            className="bg-gray-100 hover:bg-yellow-400 hover:text-white text-gray-500 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                                          >
                                            {d}D
                                          </button>
                                       ))}
                                    </>
                                  )}
                               </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => onUpdateUser({...user, status: user.status === 'active' ? 'banned' : 'active'})}
                                    className={`p-2 rounded-xl transition-all ${user.status === 'active' ? 'text-gray-300 hover:text-orange-500' : 'bg-orange-50 text-orange-600'}`}
                                    title={user.status === 'active' ? "Suspender Login" : "Reativar Login"}
                                  >
                                    {user.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUserFlow(user.id, user.email)} 
                                    className="p-2 text-gray-300 hover:text-red-500"
                                    title="Excluir Perfil"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* CHAMADA DOS MÓDULOS SEGUROS E ISOLADOS */}
        {activeTab === 'identity' && <IdentityTab config={configForm} setConfig={setConfigForm} />}
        {activeTab === 'util' && <UtilityTab config={configForm} setConfig={setConfigForm} />}
        {activeTab === 'campaign' && <CampaignTab config={configForm} setConfig={setConfigForm} />}
        {activeTab === 'marketing' && <MarketingTab config={configForm} setConfig={setConfigForm} />}
        {activeTab === 'tools' && <ToolsTab config={configForm} setConfig={setConfigForm} users={localUsers} />}

      </main>

      {isMobileMenuOpen && (
         <div className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};

export default PainelAdministrativo;

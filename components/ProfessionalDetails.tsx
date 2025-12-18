
import React, { useState } from 'react';
import { Professional, Review, User } from '../types';
import { 
  Star, MapPin, CheckCircle2, MessageCircle, ArrowLeft, 
  User as UserIcon, Send, Lock, Heart, Instagram, 
  Facebook, Globe, ExternalLink, Phone, ShieldAlert
} from 'lucide-react';

interface ProfessionalDetailsProps {
  professional: Professional;
  currentUser: User | null;
  onBack: () => void;
  onAddReview: (proId: string, review: Review) => void;
  onToggleFavorite: (proId: string) => void;
}

const ProfessionalDetails: React.FC<ProfessionalDetailsProps> = ({ 
  professional, 
  currentUser, 
  onBack, 
  onAddReview,
  onToggleFavorite
}) => {
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  
  const isGuest = !currentUser;
  const isFavorite = (currentUser?.favorites || []).includes(professional.id);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      alert("Apenas usuários logados podem avaliar. Cadastre-se gratuitamente!");
      return;
    }
    if (!newComment.trim()) return;

    const review: Review = {
      id: `review-${Date.now()}`,
      userId: currentUser!.id,
      userName: currentUser!.name,
      rating: newRating,
      comment: newComment,
      date: new Date().toLocaleDateString('pt-BR')
    };

    onAddReview(professional.id, review);
    setNewComment('');
    setNewRating(5);
    alert("Avaliação enviada com sucesso!");
  };

  const handleGuestAction = (action: string) => {
     alert(`Para ${action}, você precisa estar logado no aplicativo.`);
  };

  // Helper to normalize social links
  const getSocialLink = (val: string | undefined) => {
    if (!val) return null;
    if (val.startsWith('http')) return val;
    if (val.startsWith('@')) return `https://instagram.com/${val.substring(1)}`;
    return `https://instagram.com/${val}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar para resultados
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8 border border-gray-100">
          <div className="h-32 bg-gradient-to-r from-primary to-blue-600 opacity-10"></div>
          
          <div className="px-8 pb-8 relative">
             <div className="flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 mb-8 gap-4">
                <div className="relative group">
                  <img 
                    src={professional.avatarUrl} 
                    alt={professional.name} 
                    className="w-32 h-32 rounded-full border-4 border-white bg-white object-cover shadow-xl transition-transform group-hover:scale-105"
                  />
                  {professional.isHighlighted && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <Star size={16} fill="currentColor" />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                   <button 
                    onClick={() => isGuest ? handleGuestAction('favoritar') : onToggleFavorite(professional.id)}
                    className={`flex-1 md:flex-none p-4 rounded-2xl shadow-sm border transition-all flex items-center justify-center gap-2 ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'}`}
                   >
                     <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                     <span className="md:hidden font-bold">Favoritar</span>
                   </button>
                   
                   <button 
                      onClick={() => window.open(`https://wa.me/55${(professional.phone || professional.id).replace(/\D/g, '')}?text=Olá! Encontrei você no App O Que Tem Perto.`, '_blank')}
                      className="flex-[2] md:flex-none bg-tertiary hover:bg-tertiary-dark text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-tertiary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                   >
                      <MessageCircle size={20} />
                      WhatsApp
                   </button>
                </div>
             </div>

             <div className="text-center md:text-left mb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2 mb-2">
                  {professional.name}
                  <CheckCircle2 size={24} className="text-blue-500" />
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                   <p className="text-primary font-black text-lg uppercase tracking-tight">{professional.title}</p>
                   {professional.neighborhood && (
                      <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                         <MapPin size={12} /> {professional.neighborhood}
                      </span>
                   )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center text-yellow-500 font-black bg-yellow-50 px-3 py-1 rounded-xl border border-yellow-100">
                    <Star size={16} fill="currentColor" className="mr-1" />
                    {professional.rating.toFixed(1)}
                  </div>
                  <span className="font-medium">({professional.reviewCount} avaliações)</span>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
                  <p className="text-gray-700 leading-relaxed text-base italic">
                    "{professional.bio || 'Este prestador ainda não adicionou uma descrição.'}"
                  </p>
                </div>

                {/* BLOCO DE DADOS RESTRITOS */}
                {!isGuest ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                    {/* Localização e Endereço */}
                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} className="text-primary" /> Localização
                       </h3>
                       <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <p className="text-sm font-bold text-gray-800">
                             {professional.address || 'Endereço não informado'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{professional.neighborhood} • Campo Largo - PR</p>
                       </div>
                    </div>

                    {/* Redes Sociais */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe size={14} className="text-primary" /> Redes Sociais e Site
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {professional.socials?.instagram && (
                            <a href={getSocialLink(professional.socials.instagram)!} target="_blank" className="p-3 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-600 hover:text-white transition-all shadow-sm">
                               <Instagram size={20} />
                            </a>
                         )}
                         {professional.socials?.facebook && (
                            <a href={professional.socials.facebook} target="_blank" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                               <Facebook size={20} />
                            </a>
                         )}
                         {professional.socials?.website && (
                            <a href={professional.socials.website} target="_blank" className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-600 hover:text-white transition-all shadow-sm">
                               <Globe size={20} />
                            </a>
                         )}
                         {professional.socials?.googleMyBusiness && (
                            <a href={professional.socials.googleMyBusiness} target="_blank" className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                               <MapPin size={20} />
                            </a>
                         )}
                         {!professional.socials?.instagram && !professional.socials?.facebook && !professional.socials?.website && (
                            <p className="text-xs text-gray-400 italic">Nenhuma rede social vinculada.</p>
                         )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center">
                     <Lock className="mx-auto text-gray-300 mb-3" size={32} />
                     <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Informações Privadas</p>
                     <p className="text-gray-600 text-sm font-bold">
                        Endereço e Redes Sociais são visíveis apenas para <strong>usuários logados</strong>.
                     </p>
                  </div>
                )}
             </div>

             {isGuest && (
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex items-start gap-4">
                   <ShieldAlert className="text-blue-500 mt-1 flex-shrink-0" size={24} />
                   <div>
                      <p className="text-blue-900 font-black text-sm uppercase tracking-tight">Acesso Limitado (Visitante)</p>
                      <p className="text-blue-700 text-xs mt-1 leading-tight">
                         Como convidado, você pode apenas ver a bio e entrar em contato via WhatsApp. Cadastre-se grátis para desbloquear o perfil completo.
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
             <Star className="text-yellow-500" fill="currentColor" size={24} />
             Avaliações e Comentários
          </h3>

          <div className="mb-10 bg-gray-50 p-6 rounded-3xl border border-gray-100">
             {!isGuest ? (
               <form onSubmit={handleSubmitReview}>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sua experiência conta muito!</label>
                  <div className="flex gap-2 mb-5">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`text-3xl transition-all hover:scale-125 ${star <= newRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                           ★
                        </button>
                     ))}
                  </div>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva aqui seu comentário sobre o serviço..."
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none mb-4 resize-none h-28 text-sm"
                    required
                  />
                  <div className="flex justify-end">
                     <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-black py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95">
                        <Send size={18} /> Publicar Avaliação
                     </button>
                  </div>
               </form>
             ) : (
                <div className="text-center py-10 border-4 border-dashed border-gray-200 rounded-[2rem] bg-white/50">
                   <Lock className="mx-auto text-gray-300 mb-4" size={48} />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Acesso Restrito</p>
                   <p className="text-gray-800 font-black px-4">Faça login para compartilhar sua experiência com a comunidade.</p>
                </div>
             )}
          </div>

          <div className="space-y-8">
             {professional.reviews && professional.reviews.length > 0 ? (
                professional.reviews.slice().reverse().map((review) => (
                   <div key={review.id} className="border-b border-gray-50 last:border-0 pb-8 last:pb-0 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                               <UserIcon size={20} className="text-gray-400" />
                            </div>
                            <div>
                               <p className="font-black text-gray-900 text-sm">{review.userName}</p>
                               <div className="flex text-yellow-400 text-[10px]">
                                  {[...Array(5)].map((_, i) => (
                                     <span key={i} className="text-sm">{i < review.rating ? '★' : '☆'}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <span className="text-[10px] font-black text-gray-300 uppercase">{review.date}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed ml-12 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         {review.comment}
                      </p>
                   </div>
                ))
             ) : (
                <div className="text-center py-10">
                   <p className="text-gray-400 font-medium italic">Nenhuma avaliação ainda. Seja o primeiro!</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetails;

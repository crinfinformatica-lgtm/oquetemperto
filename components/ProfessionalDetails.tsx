
import React, { useState } from 'react';
import { Professional, Review, User } from '../types';
import { Star, MapPin, CheckCircle2, MessageCircle, ArrowLeft, User as UserIcon, Send, Lock } from 'lucide-react';

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
  
  // SAFEGUARD: Ensure favorites is an array before calling includes
  const isFavorite = (currentUser?.favorites || []).includes(professional.id);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return; // Guard clause
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
  };

  const handleGuestFavorite = () => {
     alert("Faça login para adicionar aos favoritos.");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar para resultados
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header Image/Banner Area */}
          <div className="h-24 bg-primary/10"></div>
          
          <div className="px-8 pb-8 relative">
             <div className="flex justify-between items-end -mt-12 mb-6">
                <img 
                  src={professional.avatarUrl} 
                  alt={professional.name} 
                  className="w-32 h-32 rounded-full border-4 border-white bg-white object-cover shadow-md"
                />
                <div className="flex gap-2">
                   <button 
                    onClick={() => isGuest ? handleGuestFavorite() : onToggleFavorite(professional.id)}
                    className={`p-3 rounded-full shadow-sm border transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'}`}
                    title={isGuest ? "Faça login para favoritar" : (isFavorite ? "Remover dos favoritos" : "Favoritar")}
                   >
                     <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" height="20" 
                      viewBox="0 0 24 24" 
                      fill={isFavorite ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                     </svg>
                   </button>
                   
                   {/* WhatsApp Button - OPEN FOR EVERYONE */}
                   <button 
                      onClick={() => window.open(`https://wa.me/55${professional.id}?text=Ol%C3%A1%2C%20te%20encontrei%20no%20app%20O%20Que%20Tem%20Perto!`, '_blank')}
                      className="bg-tertiary hover:bg-tertiary-dark text-white font-bold py-2 px-6 rounded-full shadow-md flex items-center gap-2 transition-colors"
                   >
                      <MessageCircle size={18} />
                      WhatsApp
                   </button>
                </div>
             </div>

             <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  {professional.name}
                  <CheckCircle2 size={24} className="text-blue-500" />
                </h1>
                
                {/* Highlighted Neighborhood Location Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                   <p className="text-primary font-medium text-lg">{professional.title}</p>
                   {professional.neighborhood && (
                      <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                         <MapPin size={14} /> {professional.neighborhood}
                      </span>
                   )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center text-yellow-500 font-bold bg-yellow-50 px-2 py-1 rounded">
                    <Star size={16} fill="currentColor" className="mr-1" />
                    {professional.rating.toFixed(1)}
                  </div>
                  <span>({professional.reviewCount} avaliações)</span>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4 text-base">
                  {professional.bio}
                </p>

                <div className="flex flex-wrap gap-2">
                   {professional.tags.map(tag => (
                     <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                       #{tag}
                     </span>
                   ))}
                </div>
             </div>

             {/* Guest Warning Banner - Updated Text */}
             {isGuest && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                   <Lock className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                   <div>
                      <p className="text-blue-800 font-bold text-sm">Modo Convidado</p>
                      <p className="text-blue-600 text-xs">
                         Você pode visualizar e contatar livremente. Para <strong>avaliar</strong> e <strong>favoritar</strong>, faça login gratuitamente.
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
             <Star className="text-yellow-500" fill="currentColor" />
             Avaliações e Comentários
          </h3>

          {/* Comment Form */}
          <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
             {currentUser ? (
               <form onSubmit={handleSubmitReview}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deixe sua avaliação</label>
                  <div className="flex gap-1 mb-4">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`text-2xl transition-colors ${star <= newRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                           ★
                        </button>
                     ))}
                  </div>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Conte como foi sua experiência..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mb-3 resize-none h-24"
                    required
                  />
                  <div className="flex justify-end">
                     <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2">
                        <Send size={16} /> Enviar
                     </button>
                  </div>
               </form>
             ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                   <Lock className="mx-auto text-gray-300 mb-2" size={32} />
                   <p className="text-gray-500 mb-2">Você precisa estar logado para avaliar.</p>
                   <p className="text-sm font-bold text-primary">Faça login ou cadastre-se para compartilhar sua experiência.</p>
                </div>
             )}
          </div>

          {/* Comments List */}
          <div className="space-y-6">
             {professional.reviews && professional.reviews.length > 0 ? (
                professional.reviews.slice().reverse().map((review) => (
                   <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                               <UserIcon size={16} className="text-gray-500" />
                            </div>
                            <div>
                               <p className="font-bold text-gray-800 text-sm">{review.userName}</p>
                               <div className="flex text-yellow-400 text-xs">
                                  {[...Array(5)].map((_, i) => (
                                     <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <span className="text-xs text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-gray-600 text-sm ml-10">{review.comment}</p>
                   </div>
                ))
             ) : (
                <p className="text-gray-400 text-center italic py-4">Nenhuma avaliação ainda. Seja o primeiro a comentar!</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetails;

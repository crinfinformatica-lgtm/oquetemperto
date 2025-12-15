
import React, { useState } from 'react';
import { Professional, User } from '../types';
import { Star, MapPin, CheckCircle2, MessageCircle, Heart, LayoutGrid, List, Zap, ChevronDown, Lock, Loader2 } from 'lucide-react';

interface ResultsListProps {
  professionals: Professional[];
  subCategory: string;
  onBack: () => void;
  onSelectProfessional: (pro: Professional) => void;
  onToggleFavorite: (proId: string) => void;
  currentUser: User | null;
  onLoadMore: () => void; // New prop for server-side pagination
  hasMore: boolean;       // New prop to know if there's more data
  isLoadingMore: boolean; // New prop for loading state
}

const ResultsList: React.FC<ResultsListProps> = ({ 
  professionals, 
  subCategory, 
  onBack,
  onSelectProfessional,
  onToggleFavorite,
  currentUser,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const isGuest = !currentUser;

  const handleGuestFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Faça login para adicionar aos favoritos.");
  };

  const handleContact = (e: React.MouseEvent, pro: Professional) => {
    e.stopPropagation();
    window.open(`https://wa.me/55${pro.id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header with Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
               {subCategory === 'Destaques Próximos' ? 'Destaques Perto de Você' : `Resultados para ${subCategory}`}
            </h2>
            <p className="text-sm text-gray-600">
              Exibindo {professionals.length} resultados encontrados
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {/* View Toggle */}
             <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Lista"
                >
                   <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grade"
                >
                   <LayoutGrid size={20} />
                </button>
             </div>

             <button 
               onClick={onBack}
               className="text-primary text-sm font-medium hover:underline bg-white px-3 py-2 rounded-lg border border-transparent hover:border-blue-100 shadow-sm"
             >
               Nova busca
             </button>
          </div>
        </div>

        {professionals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">😕</div>
            <h3 className="text-xl font-bold text-gray-800">Nada encontrado por aqui</h3>
            <p className="text-gray-500 mt-2">Nenhum resultado encontrado para sua busca na região.</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "grid gap-4"}>
              {professionals.map((pro) => {
                 // SAFEGUARD: Ensure favorites is an array
                 const isFavorite = (currentUser?.favorites || []).includes(pro.id);
                 
                 if (viewMode === 'grid') {
                    // GRID VIEW CARD
                    return (
                      <div 
                        key={pro.id} 
                        className={`bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative group flex flex-col h-full ${pro.isHighlighted ? 'border-2 border-yellow-400 ring-2 ring-yellow-100' : 'border border-gray-100'}`} 
                        onClick={() => onSelectProfessional(pro)}
                      >
                         {pro.isHighlighted && (
                            <div className="absolute top-0 left-0 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg rounded-tl-lg shadow-sm z-10 flex items-center gap-1">
                               <Zap size={10} fill="currentColor" /> DESTAQUE
                            </div>
                         )}

                         <button 
                           onClick={(e) => { e.stopPropagation(); isGuest ? handleGuestFavorite(e) : onToggleFavorite(pro.id); }}
                           className={`absolute top-3 right-3 p-2 rounded-full transition-colors z-10 ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-gray-50'}`}
                         >
                           <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                         </button>

                         <div className="flex flex-col items-center text-center mb-4 mt-2 relative">
                            <img 
                              src={pro.avatarUrl} 
                              alt={pro.name} 
                              className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 mb-3 shadow-sm"
                            />
                            
                            {/* Neighborhood Badge for Grid View */}
                            {pro.neighborhood && (
                               <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-2 flex items-center gap-1">
                                  <MapPin size={10} /> {pro.neighborhood}
                               </div>
                            )}

                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-primary transition-colors">
                               {pro.name}
                            </h3>
                            <p className="text-xs text-primary font-bold uppercase tracking-wide mb-2">{pro.title}</p>
                            <div className="flex items-center text-yellow-500 font-bold text-sm bg-yellow-50 px-2 py-0.5 rounded-full">
                               <Star size={12} fill="currentColor" className="mr-1" />
                               {pro.rating.toFixed(1)} <span className="text-gray-400 font-normal ml-1 text-xs">({pro.reviewCount})</span>
                            </div>
                         </div>

                         <p className="text-gray-500 text-xs line-clamp-3 mb-4 flex-grow text-center">
                            {pro.bio}
                         </p>

                         <div className="mt-auto pt-4 border-t border-gray-50">
                            <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-lg text-sm transition-colors">
                               Ver Detalhes
                            </button>
                         </div>
                      </div>
                    );
                 }

                 // LIST VIEW CARD
                 return (
                  <div 
                    key={pro.id} 
                    className={`bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow relative group ${pro.isHighlighted ? 'border-2 border-yellow-400' : 'border border-gray-100'}`}
                  >
                    {pro.isHighlighted && (
                       <div className="absolute top-0 left-0 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg rounded-tl-lg shadow-sm z-10 flex items-center gap-1">
                          <Zap size={10} fill="currentColor" /> SUPER INDICADO
                       </div>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); isGuest ? handleGuestFavorite(e) : onToggleFavorite(pro.id); }}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-gray-50'}`}
                    >
                      <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                    </button>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 cursor-pointer" onClick={() => onSelectProfessional(pro)}>
                      {/* Avatar & Basic Info */}
                      <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:gap-1 md:w-24 mt-2 md:mt-0">
                        <img 
                          src={pro.avatarUrl} 
                          alt={pro.name} 
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                        />
                        <div className="md:text-center">
                           <div className="flex items-center md:justify-center text-yellow-500 font-bold text-sm">
                             <Star size={14} fill="currentColor" className="mr-1" />
                             {pro.rating.toFixed(1)}
                           </div>
                           <span className="text-[10px] text-gray-400 block md:mt-1">({pro.reviewCount} avaliações)</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 pr-8">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 group-hover:text-primary transition-colors">
                            {pro.name}
                            <CheckCircle2 size={16} className="text-blue-500" />
                          </h3>
                          {pro.hourlyRate && (
                            <span className="hidden md:block bg-blue-50 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                              {pro.hourlyRate}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                           <p className="text-primary font-medium text-xs md:text-sm">{pro.title}</p>
                           {/* Highlighted Neighborhood in List View */}
                           {pro.neighborhood && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                 <MapPin size={10} /> {pro.neighborhood}
                              </span>
                           )}
                        </div>
                        
                        <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2">
                          {pro.bio}
                        </p>

                        <div className="flex gap-2">
                          <button 
                            className="flex-1 bg-tertiary hover:bg-tertiary-dark text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 z-10"
                            onClick={(e) => handleContact(e, pro)}
                          >
                            <MessageCircle size={16} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                          <button 
                            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-3 rounded-lg text-sm transition-colors z-10"
                            onClick={(e) => { e.stopPropagation(); onSelectProfessional(pro); }}
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Button */}
            {hasMore && (
               <div className="mt-8 text-center">
                  <button 
                     onClick={onLoadMore}
                     disabled={isLoadingMore}
                     className="bg-white hover:bg-gray-50 text-primary border border-primary/20 font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                  >
                     {isLoadingMore ? <Loader2 className="animate-spin" size={20} /> : <ChevronDown size={20} />}
                     {isLoadingMore ? "Carregando..." : "Ver Mais Resultados"}
                  </button>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsList;

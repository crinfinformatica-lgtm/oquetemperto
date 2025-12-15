
import React, { useState } from 'react';
import { ServiceRequest } from '../types';
import { ALLOWED_NEIGHBORHOODS } from '../constants';
import { Loader2, ArrowLeft, MapPin, Search, AlignLeft, Star } from 'lucide-react';

interface RequestFormProps {
  initialCategoryId: string;
  initialSubCategory: string;
  onSubmit: (request: ServiceRequest) => void;
  onCancel: () => void;
  isProcessing: boolean;
  searchType?: 'pro' | 'business' | 'mixed';
}

const RequestForm: React.FC<RequestFormProps> = ({ 
  initialCategoryId, 
  initialSubCategory, 
  onSubmit, 
  onCancel,
  isProcessing,
  searchType = 'mixed'
}) => {
  const [subCategory, setSubCategory] = useState(initialSubCategory || '');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [onlyHighRated, setOnlyHighRated] = useState(false);
  
  // Base location
  const location = "Campo Largo, PR";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      categoryId: initialCategoryId,
      subCategory,
      description,
      location,
      urgency: 'N/A',
      searchType,
      neighborhood,
      onlyHighRated
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-primary mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <h2 className="text-2xl font-bold">
               {searchType === 'pro' ? 'Encontrar Prestador' : searchType === 'business' ? 'Encontrar Comércio' : 'Encontrar em Águas Claras'}
            </h2>
            <p className="opacity-90 mt-1">
              Preencha os filtros para uma busca mais precisa.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Category/Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Search size={16} className="mr-2 text-primary" />
                {searchType === 'pro' ? 'Qual serviço você precisa?' : searchType === 'business' ? 'Qual tipo de comércio?' : 'O que você procura?'}
              </label>
              <input 
                type="text" 
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder={searchType === 'pro' ? "Ex: Eletricista, Manicure..." : "Ex: Pizzaria, Farmácia..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Neighborhood Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <MapPin size={16} className="mr-2 text-primary" />
                Filtrar por Bairro
              </label>
              <select 
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
              >
                 <option value="">Todos da região</option>
                 {ALLOWED_NEIGHBORHOODS.map(b => (
                   <option key={b} value={b}>{b}</option>
                 ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
               <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={onlyHighRated}
                    onChange={(e) => setOnlyHighRated(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300"
                  />
                  <div className="ml-3">
                     <span className="block text-sm font-bold text-gray-800 flex items-center gap-1">
                        <Star size={14} fill="currentColor" className="text-yellow-500"/> 
                        Boa Avaliação
                     </span>
                     <span className="block text-xs text-gray-600">Exibir apenas com 4.5 estrelas ou mais</span>
                  </div>
               </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <AlignLeft size={16} className="mr-2 text-primary" />
                Detalhes Adicionais (Opcional)
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Preciso para hoje, ou procuro local com estacionamento."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24 resize-none"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-accent hover:bg-accent-dark text-gray-900 font-bold py-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Buscando...
                  </>
                ) : (
                  'Buscar Agora'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;

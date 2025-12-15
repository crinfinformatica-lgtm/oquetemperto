import React from 'react';
import { CATEGORIES, getIconComponent } from '../constants';
import { Category } from '../types';

interface CategoryGridProps {
  onCategorySelect: (categoryId: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategorySelect }) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-12">
          Encontre profissionais por categoria
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat: Category) => (
            <div 
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className="flex flex-col items-center p-6 border border-gray-100 rounded-xl hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group bg-gray-50 hover:bg-white"
            >
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                {getIconComponent(cat.icon)}
              </div>
              <h3 className="font-semibold text-gray-800 text-center mb-2">{cat.name}</h3>
              <p className="text-xs text-gray-500 text-center hidden md:block">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
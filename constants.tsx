
import React from 'react';
import { Category } from './types';
import { 
  Hammer, 
  Home, 
  Smartphone, 
  Monitor, 
  PartyPopper, 
  Scissors, 
  HeartPulse, 
  BookOpen, 
  Briefcase, 
  Car,
  Utensils,
  Store,
  ShoppingBag
} from 'lucide-react';

export const CATEGORIES: Category[] = [
  {
    id: 'alimentacao',
    name: 'Alimentação',
    icon: 'Utensils',
    description: 'Lanchonetes, restaurantes, delivery...',
  },
  {
    id: 'comercio',
    name: 'Comércio Local',
    icon: 'Store',
    description: 'Mercadinhos, farmácias, lojas...',
  },
  {
    id: 'reformas',
    name: 'Reformas e Reparos',
    icon: 'Hammer',
    description: 'Eletricistas, pedreiros, arquitetos...',
  },
  {
    id: 'domesticos',
    name: 'Serviços Domésticos',
    icon: 'Home',
    description: 'Diaristas, babás, cozinheiras...',
  },
  {
    id: 'assistencia',
    name: 'Assistência Técnica',
    icon: 'Smartphone',
    description: 'Celulares, eletrodomésticos, notebooks...',
  },
  {
    id: 'eventos',
    name: 'Eventos',
    icon: 'PartyPopper',
    description: 'Fotógrafos, buffet, decoração...',
  },
  {
    id: 'moda',
    name: 'Moda e Beleza',
    icon: 'Scissors',
    description: 'Cabeleireiros, maquiadores...',
  },
  {
    id: 'autos',
    name: 'Automóveis',
    icon: 'Car',
    description: 'Mecânicos, auto elétrica, guincho...',
  },
  {
    id: 'aulas',
    name: 'Aulas',
    icon: 'BookOpen',
    description: 'Idiomas, música, reforço escolar...',
  },
  {
    id: 'outros',
    name: 'Outros Serviços',
    icon: 'ShoppingBag',
    description: 'Diversos serviços e produtos...',
  },
];

export const ALLOWED_NEIGHBORHOODS = [
  "Águas Claras",
  "Francisco Gorski",
  "Jardim Bieda",
  "Jardim Esmeralda",
  "Jardim Tropical",
  "Moradias Bom Jesus",
  "São Marcos",
  "São Vicente",
  "Três Rios"
].sort();

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Hammer': return <Hammer className="w-8 h-8" />;
    case 'Home': return <Home className="w-8 h-8" />;
    case 'Smartphone': return <Smartphone className="w-8 h-8" />;
    case 'Monitor': return <Monitor className="w-8 h-8" />;
    case 'PartyPopper': return <PartyPopper className="w-8 h-8" />;
    case 'Scissors': return <Scissors className="w-8 h-8" />;
    case 'HeartPulse': return <HeartPulse className="w-8 h-8" />;
    case 'BookOpen': return <BookOpen className="w-8 h-8" />;
    case 'Briefcase': return <Briefcase className="w-8 h-8" />;
    case 'Car': return <Car className="w-8 h-8" />;
    case 'Utensils': return <Utensils className="w-8 h-8" />;
    case 'Store': return <Store className="w-8 h-8" />;
    case 'ShoppingBag': return <ShoppingBag className="w-8 h-8" />;
    default: return <Hammer className="w-8 h-8" />;
  }
};

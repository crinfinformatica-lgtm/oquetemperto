
export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ServiceRequest {
  categoryId: string;
  subCategory: string; // e.g., "Eletricista"
  description: string;
  location: string;
  urgency: string;
  // New Search Filters
  searchType?: 'pro' | 'business' | 'mixed';
  neighborhood?: string;
  onlyHighRated?: boolean;
  coordinates?: { lat: number; lng: number }; // GPS Support
  detectedCategory?: string; // AI Detected Category for better matching
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Professional {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  bio: string;
  hourlyRate?: string;
  estimatedQuote?: string;
  tags: string[];
  avatarUrl: string;
  distance: string;
  neighborhood?: string; // Added Neighborhood explicitly
  reviews: Review[]; // New field for storing comments
  isHighlighted?: boolean; // VISUAL HIGHLIGHT
}

export type UserRole = 'master' | 'admin' | 'client' | 'pro' | 'business';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'banned' | 'locked';
  avatarUrl?: string;
  coverUrl?: string; // Capa para loja
  failedLoginAttempts: number;
  
  // Professional / Business Specific
  category?: string; // "Pizzaria", "Eletricista", ou personalizado
  businessDescription?: string;
  cnpj?: string;
  servedNeighborhoods?: string[]; // Bairros que atende/entrega
  
  // Highlight / Destaque System
  highlightExpiresAt?: string; // ISO String date when highlight ends
  
  // Professional Privacy Settings
  privacySettings?: {
    showPhone: boolean;
    showAddress: boolean;
  };

  // Social Media
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    googleMyBusiness?: string;
  };

  // Personal / Contact
  cpf?: string;
  rg?: string; // Added RG
  phone?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string; // Bairro validado
  favorites: string[]; // List of Professional IDs
}

export interface AppConfig {
  appName: string;
  primaryColor: string;
  accentColor: string;
  tertiaryColor: string; // New Dark Green Color
  logoUrl?: string; // Custom uploaded logo
  pixKey?: string; // Chave Pix para contribuição
  supportEmail?: string; // Email de suporte visível no app
}

export type AppView = 
  | 'home' 
  | 'login' // New dedicated login view
  | 'request-form' 
  | 'results' 
  | 'details' 
  | 'register-selection' 
  | 'register-client' 
  | 'register-pro' 
  | 'register-business'
  | 'admin-login'
  | 'admin-panel'
  | 'user-profile';

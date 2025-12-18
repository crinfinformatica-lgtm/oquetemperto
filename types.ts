
export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ServiceRequest {
  categoryId: string;
  subCategory: string;
  description: string;
  location: string;
  urgency: string;
  searchType?: 'pro' | 'business' | 'mixed';
  neighborhood?: string;
  onlyHighRated?: boolean;
  coordinates?: { lat: number; lng: number };
  detectedCategory?: string;
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
  neighborhood?: string;
  reviews: Review[];
  isHighlighted?: boolean;
  address?: string;
  phone?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    googleMyBusiness?: string;
  };
}

export type UserRole = 'master' | 'admin' | 'client' | 'pro' | 'business';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'banned' | 'locked';
  avatarUrl?: string;
  coverUrl?: string;
  failedLoginAttempts: number;
  category?: string;
  businessDescription?: string;
  cnpj?: string;
  servedNeighborhoods?: string[];
  highlightExpiresAt?: string;
  privacySettings?: {
    showPhone: boolean;
    showAddress: boolean;
  };
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    googleMyBusiness?: string;
  };
  cpf?: string;
  rg?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string;
  favorites: string[];
}

export interface BusLine {
  id: string;
  name: string;
  url: string;
}

export interface UtilityItem {
  id: string;
  name: string;
  number: string;
  description: string;
}

export interface UtilityCategory {
  id: string;
  title: string;
  items: UtilityItem[];
}

export interface Campaign {
  active: boolean;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  label?: string;
}

export interface SocialProject {
  active: boolean;
  name: string;
  description: string;
  pixKey: string;
  instagram: string;
  imageUrl?: string;
  transparentBg?: boolean;
  headerColor?: string;
  imageScale?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface AppConfig {
  appName: string;
  headerSubtitle?: string;
  primaryColor: string;
  accentColor: string;
  tertiaryColor: string;
  fontFamily?: string;
  logoUrl?: string;
  pixKey?: string;
  supportEmail?: string;
  apkUrl?: string;
  instagramUrl?: string;
  shareUrl?: string;
  busLines?: BusLine[];
  utilityCategories?: UtilityCategory[];
  utilityOrder?: string[];
  campaign?: Campaign;
  socialProject?: SocialProject;
  footerText?: string;
  footerSubtext?: string;
  headerTitle?: string;
}

export type AppView = 
  | 'home' 
  | 'login' 
  | 'request-form' 
  | 'results' 
  | 'details' 
  | 'register-selection' 
  | 'register-client' 
  | 'register-pro' 
  | 'register-business'
  | 'admin-login'
  | 'admin-panel'
  | 'user-profile'
  | 'donation';

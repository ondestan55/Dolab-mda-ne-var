export type CategoryType =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'activewear'
  | 'other';

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  top: 'Üst Giyim',
  bottom: 'Alt Giyim',
  outerwear: 'Dış Giyim',
  dress: 'Elbise & Tulum',
  shoes: 'Ayakkabı',
  bag: 'Çanta',
  accessory: 'Aksesuar',
  activewear: 'Spor Giyim',
  other: 'Diğer',
};

export type SeasonType = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış' | 'Dört Mevsim';

export const SEASONS: SeasonType[] = [
  'İlkbahar',
  'Yaz',
  'Sonbahar',
  'Kış',
  'Dört Mevsim',
];

export type StyleType =
  | 'Günlük'
  | 'Casual'
  | 'Smart Casual'
  | 'Klasik'
  | 'Spor'
  | 'Sokak Modası'
  | 'Minimalist'
  | 'Şık';

export const STYLES: StyleType[] = [
  'Günlük',
  'Casual',
  'Smart Casual',
  'Klasik',
  'Spor',
  'Sokak Modası',
  'Minimalist',
  'Şık',
];

export type OccasionType =
  | 'İş'
  | 'Günlük Hayat'
  | 'Sosyal Etkinlik'
  | 'Spor'
  | 'Özel Gün'
  | 'Seyahat';

export const OCCASIONS: OccasionType[] = [
  'İş',
  'Günlük Hayat',
  'Sosyal Etkinlik',
  'Spor',
  'Özel Gün',
  'Seyahat',
];

export type LayeringPreferenceType = 'minimal' | 'balanced' | 'rich';

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  category: CategoryType;
  subcategory: string;
  primaryColor: string;
  secondaryColor?: string;
  pattern: string;
  season: SeasonType;
  style: StyleType;
  occasion: OccasionType;
  wearCount: number;
  status: 'active' | 'laundry' | 'archived';
  notes?: string;
  isFavorite: boolean;
  isDemoItem?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: number;
  style: string;
  occasion: string;
  season: string;
  description: string;
  colorHarmonyReasoning?: string;
  weatherSuitability?: string;
  stylingTips?: string;
  isFavorite: boolean;
  wearCount: number;
  rating?: number;
  isDemoOutfit?: boolean;
}

export interface OutfitPlan {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId: string;
  occasion?: string;
  weatherNote?: string;
  isWorn?: boolean;
  notes?: string;
}

export interface WearLog {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId?: string;
  clothingItemIds: string[];
  occasion?: string;
  rating?: number;
  createdAt: number;
}

export interface UserPreferences {
  preferredStyles: StyleType[];
  preferredColors: string[];
  city: string;
  allowMultipleOutfitsPerDay: boolean;
  theme: 'light';
  genderPreference: 'unisex' | 'female' | 'male';
  layeringPreference?: LayeringPreferenceType;
}

export interface ClothingAnalysisResult {
  name: string;
  category: CategoryType;
  subcategory: string;
  primaryColor: string;
  secondaryColor?: string;
  pattern: string;
  style: StyleType;
  season: SeasonType;
  occasion: OccasionType;
  pairingSuggestions?: string;
  confidence: number;
}

export interface WeatherInfo {
  city: string;
  temperature: number;
  apparentTemperature: number;
  condition: string;
  conditionCategory: 'Sıcak' | 'Ilık' | 'Serin' | 'Soğuk' | 'Yağmurlu';
  windSpeed: number;
  isEstimated?: boolean;
  isAutoDetected?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: number;
}

export interface AdminVerificationItem {
  email: string;
  name: string;
  code: string;
  expiresAt: number;
  minutesLeft: number;
}

export interface AdminSmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  isConfigured: boolean;
  from: string;
}

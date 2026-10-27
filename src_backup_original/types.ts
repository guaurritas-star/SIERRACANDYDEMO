export interface SizeStock {
  size: string;
  sku: string;
  status: 'in_stock' | 'on_demand' | 'out';
  quantity: number;
  lowStock?: boolean;
}

export interface ProductFinish {
  id: string;
  name: string;
  colorHex: string;
  subtext: string;
}

export interface GalleryImage {
  id: string;
  label: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  catalogCategory?: string;
  price: number;
  comparePrice?: number;
  status: 'published' | 'hidden' | 'soldout';
  badge?: string;
  badgeType?: 'primary' | 'secondary' | 'neutral';
  madeIn?: string;
  heroImage: string;
  galleryImages: GalleryImage[];
  craftDetails?: string[];
  finishes: ProductFinish[];
  availableSizes: string[];
  sizeMatrix: SizeStock[];
  consultationsCount?: number;
  lastConsultation?: string;
  waTemplate: string;
  tags: string[];
}

export interface BusinessTheme {
  industry: string;
  brandName: string;
  tagline: string;
  tone: string;
  targetAudience: string;
  location: string;
  valuePropositions: string[];
  onboardingCompleted: boolean;
}

export interface CustomerNeed {
  id: string;
  need: string;
  frequency: number;
  resolvedRule: string;
}

export interface GeminiEngineConfig {
  activeRules: string[];
  customerNeedsDetected: CustomerNeed[];
  learnedResponsesCount: number;
  accuracyScore: number;
  lastTrainedDate: string;
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  storeUrl: string;
  whatsappPhone: string;
  showroomCity: string;
  announcement: string;
  autoSync: boolean;
  currency?: string;
  theme?: BusinessTheme;
  geminiEngine?: GeminiEngineConfig;
}

export interface WhatsAppLead {
  id: string;
  clientName: string;
  phone: string;
  productName: string;
  sku: string;
  finish: string;
  size: string;
  date: string;
  status: 'nueva' | 'en_conversacion' | 'esperando_pago' | 'despachado' | 'cerrado';
}

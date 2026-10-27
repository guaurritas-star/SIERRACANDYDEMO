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
  originalUrl?: string;
  backgroundMode?: 'original' | 'white' | 'transparent' | 'cream';
}

export interface GraphicColorSwatch {
  name: string;
  hex: string;
  usage: string;
  psychology: string;
}

export interface GraphicDesignMarketingKit {
  designResearch: {
    visualTrendSummary: string;
    colorPalette: GraphicColorSwatch[];
    typographySystem: {
      headlineFont: string;
      bodyFont: string;
      accentFont: string;
      pairingRationale: string;
    };
    artDirection: {
      photographyStyle: string;
      lightingAndProps: string;
      compositionRules: string;
      packagingAndLabelIdeas: string;
    };
    aiImagePrompts: string[];
  };
  marketingKit: {
    campaignHook: string;
    headlines: string[];
    instagramPost: {
      caption: string;
      hashtags: string[];
      visualBrief: string;
      cta: string;
    };
    reelOrTikTokScript: {
      hook0to3s: string;
      body3to12s: string;
      cta12to15s: string;
      audioVibe: string;
    };
    whatsappBroadcast: string;
    promoBadges: string[];
  };
  searchSources?: { title: string; uri: string }[];
  sourceModel?: string;
}

export interface ProductOriginMetadata {
  fileName: string;
  pageNumber?: number;
  sourceType: 'pdf_crop' | 'pdf_embedded' | 'uploaded_photo' | 'zip_photo' | 'manual';
  qualityWarning?: string;
  isLowResolution?: boolean;
  missingFields?: string[];
}

export interface Product {
  id: string;
  tenantId?: string;
  ownerId?: string;
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
  originMeta?: ProductOriginMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export type CatalogLayoutStyle = 'editorial-luxury' | 'minimal-gallery' | 'technical-spec';
export type CatalogFontPairing = 'editorial-serif' | 'modern-sans' | 'technical-mono';

export interface BusinessTheme {
  industry: string;
  brandName: string;
  tagline: string;
  tone: string;
  targetAudience: string;
  location: string;
  valuePropositions: string[];
  onboardingCompleted: boolean;
  productTypes?: string;
  catalogGoal?: string;
  suggestedCategories?: string[];
  layoutStyle?: CatalogLayoutStyle;
  fontPairing?: CatalogFontPairing;
  primaryActionWord?: string;
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
  ownerId?: string;
  name: string;
  storeUrl: string;
  whatsappPhone: string;
  showroomCity: string;
  announcement: string;
  autoSync: boolean;
  currency?: string;
  logoUrl?: string;
  accentColor?: string;
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

import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { Product, TenantConfig, WhatsAppLead } from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_TENANT_CONFIG,
  INITIAL_LEADS,
} from './initialData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { PdfExportModal } from './components/PdfExportModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { MerchantLoginModal } from './components/MerchantLoginModal';

import { PublicCatalogView } from './views/PublicCatalogView';
import { PublicProductView } from './views/PublicProductView';
import { MerchantCatalogView } from './views/MerchantCatalogView';
import { MerchantProductFormView } from './views/MerchantProductFormView';
import { MerchantAiParserView } from './views/MerchantAiParserView';
import { MerchantAiTrainer } from './views/MerchantAiTrainer';
import { MerchantOrdersView } from './views/MerchantOrdersView';
import { MerchantSettingsView } from './views/MerchantSettingsView';
import { MerchantOverviewView } from './views/MerchantOverviewView';
import { MerchantGraphicStudioView } from './views/MerchantGraphicStudioView';
import { BusinessThemeModal } from './components/BusinessThemeModal';
import { PricingPlansModal } from './components/PricingPlansModal';
import { OnboardingWizardView } from './views/OnboardingWizardView';
import { CandyStudioGateway } from './views/CandyStudioGateway';
import { BrandDiscoveryView } from './views/BrandDiscoveryView';
import { sanitizeProductCollection } from './utils/catalogExtractor';

const STORAGE_KEYS = {
  PRODUCTS: 'sierra_products_v2',
  TENANT: 'sierra_tenant_config_v2',
  LEADS: 'sierra_leads_v2',
};

export default function App() {
  // Persistent State (LocalStorage + Cloud Firestore Synchronization)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { validProducts } = sanitizeProductCollection(parsed);
          if (validProducts.length > 0) return validProducts;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TENANT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TENANT_CONFIG;
  });

  const [leads, setLeads] = useState<WhatsAppLead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LEADS;
  });

  // Auth & Firestore State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDemoMerchantUnlocked, setIsDemoMerchantUnlocked] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

  // Navigation State
  const [viewMode, setViewMode] = useState<'public' | 'merchant'>('public');
  const [publicTab, setPublicTab] = useState<'catalog' | 'product'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || INITIAL_PRODUCTS[0].id
  );
  const [merchantTab, setMerchantTab] = useState<string>('catalog');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modals & UI State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState<boolean>(true);
  const [entryFlow, setEntryFlow] = useState<'gateway' | 'catalog' | 'brand'>('gateway');

  const selectedProduct = useMemo(() => {
    return (
      products.find((p) => p.id === selectedProductId) ||
      products[0] ||
      INITIAL_PRODUCTS[0]
    );
  }, [products, selectedProductId]);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3400);
  };

  // Sync state to LocalStorage for instant offline/reload persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenantConfig));
    } catch {
      // ignore
    }
  }, [tenantConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    } catch {
      // ignore
    }
  }, [leads]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Derive active tenantId for Firestore isolation
  const activeTenantId = useMemo(() => {
    if (currentUser?.uid) {
      return `tenant-${currentUser.uid.slice(0, 20)}`;
    }
    return tenantConfig.tenantId || 'sierra-footwear';
  }, [currentUser?.uid, tenantConfig.tenantId]);

  // When authenticated user signs in, bootstrap or subscribe to their Firestore tenant & products
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const tenantPath = `tenants/${activeTenantId}`;
    const productsPath = `tenants/${activeTenantId}/products`;
    let unsubscribeProducts: (() => void) | undefined;

    const syncMerchantTenant = async () => {
      setIsSyncingFirestore(true);
      try {
        const tenantRef = doc(db, 'tenants', activeTenantId);
        const snap = await getDoc(tenantRef);

        if (!snap.exists()) {
          // Bootstrap initial tenant document and current products into Firestore for this merchant
          await setDoc(tenantRef, {
            tenantId: activeTenantId,
            ownerId: currentUser.uid,
            name: tenantConfig.name || 'SIERRA',
            storeUrl: tenantConfig.storeUrl || 'sierra.candycatalog.store',
            whatsappPhone: tenantConfig.whatsappPhone || '+52 477 123 4567',
            showroomCity: tenantConfig.showroomCity || 'León, Guanajuato · México',
            announcement: tenantConfig.announcement || '',
            autoSync: true,
            currency: tenantConfig.currency || 'MXN',
            logoUrl: tenantConfig.logoUrl || '',
            accentColor: tenantConfig.accentColor || '#8C3A1B',
            brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA',
            industry:
              tenantConfig.theme?.industry || 'Calzado Artesanal & Marroquinería',
            tagline: tenantConfig.theme?.tagline || '',
            tone: tenantConfig.theme?.tone || 'Editorial Contemporáneo',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          for (const prod of products) {
            const prodRef = doc(db, 'tenants', activeTenantId, 'products', prod.id);
            await setDoc(prodRef, {
              id: prod.id,
              tenantId: activeTenantId,
              ownerId: currentUser.uid,
              sku: prod.sku,
              name: prod.name,
              subtitle: prod.subtitle || '',
              description: prod.description,
              category: prod.category,
              catalogCategory: prod.catalogCategory || prod.category.toLowerCase(),
              price: prod.price,
              ...(prod.comparePrice ? { comparePrice: prod.comparePrice } : {}),
              status: prod.status,
              badge: prod.badge || '',
              badgeType: prod.badgeType || 'secondary',
              madeIn: prod.madeIn || tenantConfig.showroomCity || '',
              heroImage: prod.heroImage,
              waTemplate: prod.waTemplate,
              availableSizes: prod.availableSizes.slice(0, 24),
              tags: prod.tags.slice(0, 20),
              finishes: prod.finishes.slice(0, 20),
              galleryImages: prod.galleryImages.slice(0, 12),
              sizeMatrix: prod.sizeMatrix.slice(0, 24),
              craftDetails: (prod.craftDetails || []).slice(0, 15),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          const data = snap.data();
          setTenantConfig((prev) => ({
            ...prev,
            tenantId: data.tenantId,
            ownerId: data.ownerId,
            name: data.name,
            storeUrl: data.storeUrl,
            whatsappPhone: data.whatsappPhone,
            showroomCity: data.showroomCity,
            announcement: data.announcement,
            logoUrl: data.logoUrl || prev.logoUrl,
            accentColor: data.accentColor || prev.accentColor,
            theme: {
              ...(prev.theme || INITIAL_TENANT_CONFIG.theme!),
              brandName: data.brandName || data.name,
              industry: data.industry || prev.theme?.industry || '',
              tagline: data.tagline || prev.theme?.tagline || '',
              location: data.showroomCity || prev.showroomCity,
            },
          }));
        }

        // Subscribe to real-time products for this tenant
        unsubscribeProducts = onSnapshot(
          collection(db, 'tenants', activeTenantId, 'products'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Product[] = snapshot.docs.map((d) => {
                const raw = d.data();
                return {
                  id: raw.id,
                  tenantId: raw.tenantId,
                  ownerId: raw.ownerId,
                  sku: raw.sku,
                  name: raw.name,
                  subtitle: raw.subtitle,
                  description: raw.description,
                  category: raw.category,
                  catalogCategory: raw.catalogCategory,
                  price: raw.price,
                  comparePrice: raw.comparePrice,
                  status: raw.status,
                  badge: raw.badge,
                  badgeType: raw.badgeType,
                  madeIn: raw.madeIn,
                  heroImage: raw.heroImage,
                  galleryImages: raw.galleryImages || [],
                  craftDetails: raw.craftDetails || [],
                  finishes: raw.finishes || [],
                  availableSizes: raw.availableSizes || [],
                  sizeMatrix: raw.sizeMatrix || [],
                  waTemplate: raw.waTemplate,
                  tags: raw.tags || [],
                  originMeta: raw.originMeta || undefined,
                };
              });

              const { validProducts, removedIds, updatedProducts } =
                sanitizeProductCollection(loaded);

              setProducts(validProducts.length > 0 ? validProducts : INITIAL_PRODUCTS);

              // Automatically clean up non-product cover/index documents from Firestore
              if (removedIds.length > 0) {
                removedIds.forEach((badId) => {
                  const badRef = doc(db, 'tenants', activeTenantId, 'products', badId);
                  deleteDoc(badRef).catch(() => {});
                });
              }

              // Automatically persist healed product names and de-hyphenated descriptions to Firestore
              if (updatedProducts.length > 0) {
                updatedProducts.forEach((fixedProd) => {
                  const fixedRef = doc(
                    db,
                    'tenants',
                    activeTenantId,
                    'products',
                    fixedProd.id
                  );
                  setDoc(
                    fixedRef,
                    {
                      name: fixedProd.name.slice(0, 160),
                      subtitle: (fixedProd.subtitle || '').slice(0, 400),
                      description: (fixedProd.description || '').slice(0, 4000),
                      category: (fixedProd.category || 'Conjuntos').slice(0, 80),
                      catalogCategory: (
                        fixedProd.catalogCategory || 'conjuntos'
                      ).slice(0, 80),
                      waTemplate: (fixedProd.waTemplate || '').slice(0, 600),
                      updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                  ).catch(() => {});
                });
              }
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, productsPath);
          }
        );
      } catch (err) {
        console.error('Firestore sync info:', err);
      } finally {
        setIsSyncingFirestore(false);
      }
    };

    syncMerchantTenant();

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [isAuthReady, currentUser?.uid, activeTenantId]);

  // Persist a single product to Firestore when merchant is signed in
  const persistProductToFirestore = async (
    product: Product,
    isNew: boolean
  ): Promise<boolean> => {
    if (!currentUser) return false;
    const path = `tenants/${activeTenantId}/products/${product.id}`;
    try {
      // Ensure parent tenant document exists first (required by firestore.rules Master Gate)
      const tenantRef = doc(db, 'tenants', activeTenantId);
      const tenantSnap = await getDoc(tenantRef);
      if (!tenantSnap.exists()) {
        await setDoc(tenantRef, {
          tenantId: activeTenantId,
          ownerId: currentUser.uid,
          name: (tenantConfig.name || 'SIERRA').slice(0, 120),
          storeUrl: (tenantConfig.storeUrl || 'sierra.candycatalog.store').slice(0, 160),
          whatsappPhone: (tenantConfig.whatsappPhone || '+52 477 123 4567').slice(0, 40),
          showroomCity: (tenantConfig.showroomCity || 'León, Guanajuato · México').slice(
            0,
            120
          ),
          announcement: (tenantConfig.announcement || '').slice(0, 300),
          autoSync: true,
          currency: (tenantConfig.currency || 'MXN').slice(0, 10),
          logoUrl: (tenantConfig.logoUrl || '').slice(0, 500000),
          accentColor: (tenantConfig.accentColor || '#8C3A1B').slice(0, 20),
          brandName: (
            tenantConfig.theme?.brandName ||
            tenantConfig.name ||
            'SIERRA'
          ).slice(0, 120),
          industry: (
            tenantConfig.theme?.industry || 'Calzado Artesanal & Marroquinería'
          ).slice(0, 120),
          tagline: (tenantConfig.theme?.tagline || '').slice(0, 300),
          tone: (tenantConfig.theme?.tone || 'Editorial Contemporáneo').slice(0, 120),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const prodRef = doc(db, 'tenants', activeTenantId, 'products', product.id);
      const existingSnap = await getDoc(prodRef);
      const safeSku = (
        product.sku && product.sku.trim().length > 0
          ? product.sku.trim()
          : `SKU-${product.id.slice(-6).toUpperCase()}`
      ).slice(0, 64);
      const safeName = (
        product.name && product.name.trim().length > 0
          ? product.name.trim()
          : 'Producto Importado'
      ).slice(0, 160);
      const safeCategory = (
        product.category && product.category.trim().length > 0
          ? product.category.trim()
          : 'Colección General'
      ).slice(0, 80);

      const payload: Record<string, any> = {
        id: product.id,
        tenantId: activeTenantId,
        ownerId: currentUser.uid,
        sku: safeSku,
        name: safeName,
        subtitle: (product.subtitle || '').slice(0, 400),
        description: (product.description || '').slice(0, 4000),
        category: safeCategory,
        catalogCategory: (
          product.catalogCategory || safeCategory.toLowerCase()
        ).slice(0, 80),
        price:
          typeof product.price === 'number' && !isNaN(product.price) && product.price >= 0
            ? Math.min(product.price, 10000000)
            : 0,
        status: ['published', 'hidden', 'soldout'].includes(product.status)
          ? product.status
          : 'hidden',
        badge: (product.badge || '').slice(0, 80),
        badgeType: ['primary', 'secondary', 'neutral'].includes(
          product.badgeType as any
        )
          ? product.badgeType
          : 'secondary',
        madeIn: (product.madeIn || '').slice(0, 120),
        heroImage: (product.heroImage || '').slice(0, 600000),
        waTemplate: (product.waTemplate || '').slice(0, 600),
        availableSizes: (product.availableSizes || []).map(String).slice(0, 24),
        tags: (product.tags || []).map(String).slice(0, 20),
        finishes: (product.finishes || []).slice(0, 20),
        galleryImages: (product.galleryImages || []).slice(0, 12),
        sizeMatrix: (product.sizeMatrix || []).slice(0, 24),
        craftDetails: (product.craftDetails || []).map(String).slice(0, 15),
        createdAt: existingSnap.exists()
          ? existingSnap.data().createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (product.comparePrice !== undefined) {
        payload.comparePrice = product.comparePrice;
      }
      if (product.originMeta) {
        const cleanMeta: Record<string, any> = {
          fileName: String(product.originMeta.fileName || 'documento.pdf').slice(0, 160),
          sourceType: product.originMeta.sourceType || 'pdf_crop',
        };
        if (typeof product.originMeta.pageNumber === 'number') {
          cleanMeta.pageNumber = product.originMeta.pageNumber;
        }
        if (product.originMeta.qualityWarning) {
          cleanMeta.qualityWarning = String(product.originMeta.qualityWarning).slice(
            0,
            300
          );
        }
        if (typeof product.originMeta.isLowResolution === 'boolean') {
          cleanMeta.isLowResolution = product.originMeta.isLowResolution;
        }
        if (Array.isArray(product.originMeta.missingFields)) {
          cleanMeta.missingFields = product.originMeta.missingFields
            .map(String)
            .slice(0, 10);
        }
        payload.originMeta = cleanMeta;
      }
      await setDoc(prodRef, payload);
      return true;
    } catch (error) {
      handleFirestoreError(
        error,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        path
      );
    }
  };

  // Switch between Public & Merchant Console (with Auth Gate)
  const handleSwitchViewMode = (mode: 'public' | 'merchant') => {
    if (mode === 'merchant' && !currentUser && !isDemoMerchantUnlocked) {
      setIsLoginModalOpen(true);
      return;
    }
    setViewMode(mode);
    if (mode === 'merchant') {
      setMerchantTab('catalog');
    } else {
      setPublicTab('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePublic = (tab: 'catalog' | 'product', sectionId?: string) => {
    setViewMode('public');
    setPublicTab(tab);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setPublicTab('product');
    setViewMode('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update Product Status
  const handleToggleProductStatus = async (
    productId: string,
    explicitStatus?: Product['status']
  ) => {
    let updatedItem: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextStatus =
            explicitStatus || (p.status === 'published' ? 'hidden' : 'published');
          updatedItem = { ...p, status: nextStatus };
          showToast(
            nextStatus === 'published'
              ? `«${p.name}» publicado en el aparador`
              : nextStatus === 'soldout'
              ? `«${p.name}» marcado como agotado`
              : `«${p.name}» ocultado del catálogo público`
          );
          return updatedItem;
        }
        return p;
      })
    );

    if (updatedItem && currentUser) {
      await persistProductToFirestore(updatedItem, false);
    }
  };

  // Save or Create Product
  const handleSaveProduct = async (updatedProduct: Product) => {
    const isExisting = products.some((p) => p.id === updatedProduct.id);
    setProducts((prev) => {
      if (isExisting) {
        return prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      }
      return [updatedProduct, ...prev];
    });
    setSelectedProductId(updatedProduct.id);
    setEditingProduct(null);
    setMerchantTab('catalog');

    if (currentUser) {
      await persistProductToFirestore(updatedProduct, !isExisting);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setEditingProduct(null);
    setMerchantTab('catalog');
    showToast(
      target ? `«${target.name}» eliminado del catálogo` : 'Producto eliminado'
    );

    if (currentUser) {
      const path = `tenants/${activeTenantId}/products/${productId}`;
      try {
        await deleteDoc(doc(db, 'tenants', activeTenantId, 'products', productId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  // Save Tenant Config
  const handleSaveTenantConfig = async (updated: TenantConfig) => {
    setTenantConfig(updated);
    if (currentUser) {
      const path = `tenants/${activeTenantId}`;
      try {
        const tenantRef = doc(db, 'tenants', activeTenantId);
        const existingSnap = await getDoc(tenantRef);
        await setDoc(tenantRef, {
          tenantId: activeTenantId,
          ownerId: currentUser.uid,
          name: updated.name.slice(0, 120),
          storeUrl: updated.storeUrl.slice(0, 160),
          whatsappPhone: updated.whatsappPhone.slice(0, 40),
          showroomCity: updated.showroomCity.slice(0, 120),
          announcement: updated.announcement.slice(0, 300),
          autoSync: updated.autoSync,
          currency: (updated.currency || 'MXN').slice(0, 10),
          logoUrl: (updated.logoUrl || '').slice(0, 500000),
          accentColor: (updated.accentColor || '#8C3A1B').slice(0, 20),
          brandName: (updated.theme?.brandName || updated.name).slice(0, 120),
          industry: (updated.theme?.industry || '').slice(0, 120),
          tagline: (updated.theme?.tagline || '').slice(0, 300),
          tone: (updated.theme?.tone || '').slice(0, 120),
          createdAt: existingSnap.exists()
            ? existingSnap.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  // Add Item to Bag
  const handleAddToCart = (product: Product, size: string, finish: string) => {
    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      product,
      size,
      finish,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast('Pieza removida de tu selección');
  };

  const handleUpdateLeadStatus = (
    leadId: string,
    status: WhatsAppLead['status']
  ) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsDemoMerchantUnlocked(false);
    setViewMode('public');
    showToast('Sesión de comerciante cerrada');
  };

  if (showOnboardingWizard && entryFlow === 'gateway') {
    return (
      <CandyStudioGateway
        onCatalog={() => setEntryFlow('catalog')}
        onBrand={() => setEntryFlow('brand')}
        onDemo={() => {
          setTenantConfig(INITIAL_TENANT_CONFIG);
          setProducts(INITIAL_PRODUCTS);
          setSelectedProductId(INITIAL_PRODUCTS[0].id);
          setShowOnboardingWizard(false);
          setViewMode('public');
          setPublicTab('catalog');
          showToast('Explorando catálogo de demostración SIERRA Footwear');
        }}
        onMerchant={() => {
          setShowOnboardingWizard(false);
          handleSwitchViewMode('merchant');
        }}
      />
    );
  }

  if (showOnboardingWizard && entryFlow === 'brand') {
    return (
      <>
        <BrandDiscoveryView
          tenantConfig={tenantConfig}
          onBack={() => setEntryFlow('gateway')}
          onSave={async (updatedConfig, openCatalog) => {
            await handleSaveTenantConfig(updatedConfig);
            showToast(currentUser
              ? 'ADN de marca guardado en tu negocio.'
              : 'ADN de marca guardado en este navegador. Inicia sesión para sincronizarlo.');
            if (openCatalog) setEntryFlow('catalog');
          }}
        />
        <Toast message={toastMessage} isVisible={isToastVisible} />
      </>
    );
  }

  if (showOnboardingWizard) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] text-[#1A1C1C]">
        <OnboardingWizardView
          tenantConfig={tenantConfig}
          onReturnToGateway={() => setEntryFlow('gateway')}
          onComplete={async (updatedConfig, generatedProducts, destination) => {
            await handleSaveTenantConfig(updatedConfig);
            if (generatedProducts && generatedProducts.length > 0) {
              setProducts(generatedProducts);
              setSelectedProductId(generatedProducts[0].id);
              if (currentUser) {
                for (const prod of generatedProducts) {
                  await persistProductToFirestore(prod, true);
                }
              }
            }
            setShowOnboardingWizard(false);
            if (destination === 'merchant-new-product') {
              setIsDemoMerchantUnlocked(true);
              setEditingProduct(null);
              setViewMode('merchant');
              setMerchantTab('product-form');
            } else if (destination === 'merchant-catalog') {
              setIsDemoMerchantUnlocked(true);
              setViewMode('merchant');
              setMerchantTab('catalog');
            } else {
              setViewMode('public');
              setPublicTab('catalog');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreDemoSierra={() => {
            setTenantConfig(INITIAL_TENANT_CONFIG);
            setProducts(INITIAL_PRODUCTS);
            setSelectedProductId(INITIAL_PRODUCTS[0].id);
            setShowOnboardingWizard(false);
            setViewMode('public');
            setPublicTab('catalog');
            showToast('Explorando catálogo de demostración SIERRA Footwear');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenMerchantConsole={() => {
            setShowOnboardingWizard(false);
            handleSwitchViewMode('merchant');
          }}
          onShowToast={showToast}
        />
        <Toast message={toastMessage} isVisible={isToastVisible} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#1A1C1C] flex flex-col">
      {/* Global 2-Tier Stitch Header */}
      <Header
        viewMode={viewMode}
        currentPublicTab={publicTab}
        currentMerchantTab={merchantTab}
        onNavigatePublic={handleNavigatePublic}
        onSwitchViewMode={handleSwitchViewMode}
        onNavigateMerchant={(tab) => {
          if (tab === 'product-form') {
            setEditingProduct(null);
          }
          setViewMode('merchant');
          setMerchantTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        tenantConfig={tenantConfig}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onRestartOnboarding={() => {
          setEntryFlow('gateway');
          setShowOnboardingWizard(true);
        }}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Router */}
      <div className="pt-24 flex-1">
        {viewMode === 'public' ? (
          publicTab === 'catalog' ? (
            <PublicCatalogView
              products={products}
              tenantConfig={tenantConfig}
              onSelectProduct={handleSelectProduct}
              onShowToast={showToast}
            />
          ) : (
            <PublicProductView
              product={selectedProduct}
              tenantConfig={tenantConfig}
              onBackToCatalog={() => {
                setPublicTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddToCart={handleAddToCart}
              onShowToast={showToast}
            />
          )
        ) : merchantTab === 'catalog' ? (
          <MerchantCatalogView
            products={products}
            tenantConfig={tenantConfig}
            onToggleProductStatus={handleToggleProductStatus}
            onDeleteProduct={handleDeleteProduct}
            onOpenCreateProduct={() => {
              setEditingProduct(null);
              setMerchantTab('product-form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditProduct={(prod) => {
              setEditingProduct(prod);
              setMerchantTab('product-form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPreviewProduct={(prod) => {
              setSelectedProductId(prod.id);
              setViewMode('public');
              setPublicTab('product');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
            onViewLiveCatalog={() => {
              setViewMode('public');
              setPublicTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
            onNavigateMerchantTab={(tab) => {
              if (tab === 'product-form') setEditingProduct(null);
              setMerchantTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentTab={merchantTab}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onSignOut={handleSignOut}
            isSyncingFirestore={isSyncingFirestore}
          />
        ) : merchantTab === 'product-form' ? (
          <MerchantProductFormView
            initialProduct={editingProduct}
            tenantConfig={tenantConfig}
            existingCategories={existingCategories}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onCancel={() => setMerchantTab('catalog')}
            onPreviewInCatalog={(prod) => {
              handleSaveProduct(prod);
              setSelectedProductId(prod.id);
              setViewMode('public');
              setPublicTab('product');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        ) : merchantTab === 'ai-parser' ? (
          <MerchantAiParserView
            tenantConfig={tenantConfig}
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onSyncAllParsed={async (newProds, navigateAfter = true) => {
              let firestoreSavedCount = 0;
              if (newProds.length > 0) {
                setProducts((prev) => {
                  const newIds = new Set(newProds.map((p) => p.id));
                  return [...newProds, ...prev.filter((p) => !newIds.has(p.id))];
                });
                if (currentUser) {
                  for (const prod of newProds) {
                    const ok = await persistProductToFirestore(prod, true);
                    if (ok) firestoreSavedCount++;
                  }
                }
              }
              if (navigateAfter) {
                setMerchantTab('catalog');
              }
              return {
                firestoreSavedCount,
                tenantId: activeTenantId,
                isAuthenticated: Boolean(currentUser),
              };
            }}
            onPreviewProduct={(prod) => {
              setSelectedProductId(prod.id);
              setViewMode('public');
              setPublicTab('product');
            }}
            onShowToast={showToast}
            onBackToInventory={() => setMerchantTab('catalog')}
          />
        ) : merchantTab === 'ai-trainer' ? (
          <MerchantAiTrainer
            tenantConfig={tenantConfig}
            onUpdateTenantConfig={handleSaveTenantConfig}
            onShowToast={showToast}
            onBackToInventory={() => setMerchantTab('catalog')}
          />
        ) : merchantTab === 'graphic-studio' ? (
          <MerchantGraphicStudioView
            products={products}
            tenantConfig={tenantConfig}
            onUpdateProduct={handleSaveProduct}
            onUpdateTenantConfig={handleSaveTenantConfig}
            onShowToast={showToast}
            onBackToInventory={() => setMerchantTab('catalog')}
          />
        ) : merchantTab === 'orders' ? (
          <MerchantOrdersView
            leads={leads}
            tenantConfig={tenantConfig}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onShowToast={showToast}
            onBackToInventory={() => setMerchantTab('catalog')}
          />
        ) : merchantTab === 'settings' ? (
          <MerchantSettingsView
            tenantConfig={tenantConfig}
            onSaveConfig={handleSaveTenantConfig}
            onShowToast={showToast}
            onBackToInventory={() => setMerchantTab('catalog')}
          />
        ) : (
          <MerchantOverviewView
            products={products}
            leads={leads}
            tenantConfig={tenantConfig}
            onNavigateMerchantTab={setMerchantTab}
            onViewLiveCatalog={() => {
              setViewMode('public');
              setPublicTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      {/* Global Editorial Footer */}
      {viewMode === 'public' && (
        <Footer
          tenantConfig={tenantConfig}
          onNavigatePublic={handleNavigatePublic}
          onOpenMerchant={() => handleSwitchViewMode('merchant')}
        />
      )}

      {/* Merchant Authentication Modal */}
      <MerchantLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthenticated={() => {
          setIsLoginModalOpen(false);
          setViewMode('merchant');
          setMerchantTab('catalog');
          showToast('Sesión iniciada correctamente con Google');
        }}
        onContinueDemo={() => {
          setIsDemoMerchantUnlocked(true);
          setIsLoginModalOpen(false);
          setViewMode('merchant');
          setMerchantTab('catalog');
          showToast('Consola abierta en modo vista previa');
        }}
        brandName={tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA'}
      />

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
      />

      {/* Cart / Selection Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveCartItem}
        tenantConfig={tenantConfig}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        products={products}
        tenantConfig={tenantConfig}
        onDownload={() => {
          showToast(
            `Exportando catálogo de ${
              tenantConfig.theme?.brandName || tenantConfig.name
            }...`
          );
        }}
      />

      {/* Business Theme Modal */}
      <BusinessThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        tenantConfig={tenantConfig}
        onSaveTheme={handleSaveTenantConfig}
        onShowToast={showToast}
      />

      {/* Pricing Plans Modal */}
      <PricingPlansModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        tenantConfig={tenantConfig}
        onShowToast={showToast}
      />

      {/* Notification Toast */}
      <Toast message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
}

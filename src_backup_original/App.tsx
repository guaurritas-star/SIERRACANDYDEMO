import { useState, useEffect } from 'react';
import { Product, TenantConfig, WhatsAppLead } from './types';
import { INITIAL_PRODUCTS, INITIAL_TENANT_CONFIG, INITIAL_LEADS } from './initialData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { PdfExportModal } from './components/PdfExportModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { CartDrawer, CartItem } from './components/CartDrawer';

import { PublicCatalogView } from './views/PublicCatalogView';
import { PublicProductView } from './views/PublicProductView';
import { MerchantCatalogView } from './views/MerchantCatalogView';
import { MerchantProductFormView } from './views/MerchantProductFormView';
import { MerchantAiParserView } from './views/MerchantAiParserView';
import { MerchantAiTrainer } from './views/MerchantAiTrainer';
import { MerchantOrdersView } from './views/MerchantOrdersView';
import { MerchantSettingsView } from './views/MerchantSettingsView';
import { MerchantOverviewView } from './views/MerchantOverviewView';
import { BusinessThemeModal } from './components/BusinessThemeModal';
import { PricingPlansModal } from './components/PricingPlansModal';
import { OnboardingWizardView } from './views/OnboardingWizardView';

export default function App() {
  // Application State with LocalStorage
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('sierra_products_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(() => {
    try {
      const saved = localStorage.getItem('sierra_tenant_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TENANT_CONFIG;
  });

  const [leads, setLeads] = useState<WhatsAppLead[]>(() => {
    try {
      const saved = localStorage.getItem('sierra_leads_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_LEADS;
  });

  // Navigation State
  const [viewMode, setViewMode] = useState<'public' | 'merchant'>('public');
  const [publicTab, setPublicTab] = useState<'catalog' | 'product'>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || INITIAL_PRODUCTS[0]);
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
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState<boolean>(() => {
    try {
      const hasCompleted = localStorage.getItem('candy_onboarding_completed_v1');
      return !hasCompleted; // Defaults to true on fresh start
    } catch {
      return false;
    }
  });

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sierra_products_v1', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('sierra_tenant_config_v1', JSON.stringify(tenantConfig));
    } catch {
      // ignore
    }
  }, [tenantConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('sierra_leads_v1', JSON.stringify(leads));
    } catch {
      // ignore
    }
  }, [leads]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3200);
  };

  // Product Selection Handlers
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setPublicTab('product');
    setViewMode('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Product Status (Published <-> Hidden)
  const handleToggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStatus = p.status === 'published' ? 'hidden' : 'published';
          showToast(
            newStatus === 'published'
              ? `[${p.sku}] Publicado en vivo en ${tenantConfig.storeUrl}`
              : `[${p.sku}] Ocultado temporalmente del catálogo público`
          );
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Save or Create Product
  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      }
      return [updatedProduct, ...prev];
    });
    setEditingProduct(null);
    setMerchantTab('catalog');
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
    showToast('Modelo removido de la bolsa');
  };

  // Update WhatsApp Lead status
  const handleUpdateLeadStatus = (leadId: string, status: WhatsAppLead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  // If Onboarding Wizard is active, render full-screen onboarding experience
  if (showOnboardingWizard) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] text-[#1a1c1c] font-['Inter']">
        <OnboardingWizardView
          tenantConfig={tenantConfig}
          onComplete={(updatedConfig, generatedProducts) => {
            setTenantConfig(updatedConfig);
            if (generatedProducts && generatedProducts.length > 0) {
              setProducts(generatedProducts);
              setSelectedProduct(generatedProducts[0]);
            }
            try {
              localStorage.setItem('candy_onboarding_completed_v1', 'true');
            } catch {
              // ignore
            }
            setShowOnboardingWizard(false);
            setViewMode('public');
            setPublicTab('catalog');
            showToast(`¡Catálogo de ${updatedConfig.theme?.brandName || updatedConfig.name} publicado con éxito!`);
          }}
          onCancelToCurrentCatalog={() => setShowOnboardingWizard(false)}
          onShowToast={showToast}
        />
        <Toast message={toastMessage} isVisible={isToastVisible} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#1a1c1c] flex flex-col font-['Inter']">
      {/* Top Global Header */}
      <Header
        viewMode={viewMode}
        currentPublicTab={publicTab}
        currentMerchantTab={merchantTab}
        onNavigatePublic={(tab) => {
          setViewMode('public');
          setPublicTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSwitchViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'merchant') {
            setMerchantTab('catalog');
          } else {
            setPublicTab('catalog');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateMerchant={(tab) => {
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
        onRestartOnboarding={() => setShowOnboardingWizard(true)}
        trialDaysLeft={trialDaysLeft}
      />

      {/* Main View Router */}
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
        ) : (
          /* Merchant Console Mode */
          merchantTab === 'catalog' ? (
            <MerchantCatalogView
              products={products}
              tenantConfig={tenantConfig}
              onToggleProductStatus={handleToggleProductStatus}
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
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
              onViewLiveCatalog={() => {
                setViewMode('public');
                setPublicTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShowToast={showToast}
              onNavigateMerchantTab={setMerchantTab}
              currentTab={merchantTab}
            />
          ) : merchantTab === 'product-form' ? (
            <MerchantProductFormView
              initialProduct={editingProduct}
              tenantConfig={tenantConfig}
              onSaveProduct={handleSaveProduct}
              onCancel={() => setMerchantTab('catalog')}
              onPreviewInCatalog={(prod) => {
                setSelectedProduct(prod);
                setViewMode('public');
                setPublicTab('product');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShowToast={showToast}
            />
          ) : merchantTab === 'ai-parser' ? (
            <MerchantAiParserView
              tenantConfig={tenantConfig}
              onSyncAllParsed={(newProds) => {
                if (newProds.length > 0) {
                  setProducts((prev) => [...newProds, ...prev]);
                }
                setMerchantTab('catalog');
              }}
              onPreviewProduct={(prod) => {
                setSelectedProduct(prod);
                setViewMode('public');
                setPublicTab('product');
              }}
              onShowToast={showToast}
              onBackToInventory={() => setMerchantTab('catalog')}
            />
          ) : merchantTab === 'ai-trainer' ? (
            <MerchantAiTrainer
              tenantConfig={tenantConfig}
              onUpdateTenantConfig={(updated) => setTenantConfig(updated)}
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
              onSaveConfig={(updated) => {
                setTenantConfig(updated);
              }}
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
          )
        )}
      </div>

      {/* Global Footer (shown in public view) */}
      {viewMode === 'public' && (
        <Footer
          tenantConfig={tenantConfig}
          onNavigatePublic={(tab) => {
            setPublicTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
      />

      {/* Cart Drawer */}
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
          showToast('Generando y descargando sierra-catalogo-2025.pdf...');
        }}
      />

      {/* Business Theme & Continuous Gemini Training Modal */}
      <BusinessThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        tenantConfig={tenantConfig}
        onSaveTheme={(updated) => {
          setTenantConfig(updated);
          showToast(`Tema actualizado: ${updated.theme?.brandName || updated.name} (${updated.theme?.industry || 'Personalizado'})`);
        }}
        onShowToast={showToast}
      />

      {/* Pricing Plans & Demo Status Modal */}
      <PricingPlansModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        tenantConfig={tenantConfig}
        onShowToast={showToast}
        trialDaysLeft={trialDaysLeft}
      />

      {/* Real-time Notification Toast */}
      <Toast message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
}

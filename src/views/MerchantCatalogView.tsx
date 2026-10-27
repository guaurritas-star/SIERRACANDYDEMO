import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import { buildProductWhatsAppUrl } from '../utils/whatsapp';

interface MerchantCatalogViewProps {
  products: Product[];
  tenantConfig: TenantConfig;
  onToggleProductStatus: (id: string, nextStatus?: Product['status']) => void;
  onDeleteProduct: (id: string) => void;
  onOpenCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onPreviewProduct: (product: Product) => void;
  onOpenPdfModal: () => void;
  onViewLiveCatalog: () => void;
  onShowToast: (msg: string) => void;
  onNavigateMerchantTab: (tab: string) => void;
  currentTab: string;
  currentUser?: User | null;
  onOpenLoginModal?: () => void;
  onSignOut?: () => void;
  isSyncingFirestore?: boolean;
}

export const MerchantCatalogView: React.FC<MerchantCatalogViewProps> = ({
  products,
  tenantConfig,
  onToggleProductStatus,
  onDeleteProduct,
  onOpenCreateProduct,
  onEditProduct,
  onPreviewProduct,
  onOpenPdfModal,
  onViewLiveCatalog,
  onShowToast,
  onNavigateMerchantTab,
  currentTab,
  currentUser,
  onOpenLoginModal,
  onSignOut,
  isSyncingFirestore = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'hidden' | 'soldout'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<
    'recent' | 'price-desc' | 'price-asc' | 'name'
  >('recent');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const brandName =
    tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const currency = tenantConfig.currency || 'MXN';

  const publishedCount = products.filter(
    (p) => p.status === 'published'
  ).length;
  const hiddenCount = products.filter((p) => p.status === 'hidden').length;
  const soldoutCount = products.filter((p) => p.status === 'soldout').length;
  const totalCount = products.length;

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (
          categoryFilter !== 'all' &&
          p.category.toLowerCase() !== categoryFilter.toLowerCase()
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, statusFilter, categoryFilter, searchQuery, sortBy]);

  const handleCopyWhatsAppLink = (product: Product) => {
    const url = buildProductWhatsAppUrl({
      product,
      tenantConfig,
    });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast(`Enlace directo de WhatsApp copiado (${product.name})`);
    }
  };

  return (
    <div className="flex w-full bg-[#F9F9F8] text-[#1A1C1C]">
      {/* Fixed Left Sidebar (Merchant Console) */}
      <aside className="hidden lg:flex fixed left-0 top-24 bottom-0 w-64 bg-white z-40 flex-col justify-between py-6 border-r border-[#E5E5E2] font-['Inter'] text-xs">
        <div className="space-y-6">
          <div className="px-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-bold">
              MERCHANT CONSOLE
            </h2>
            <p className="text-xs text-[#5F5E5E] mt-0.5 truncate">
              Tenant: {brandName} ({tenantConfig.tenantId})
            </p>
          </div>

          <nav className="space-y-0.5 px-3">
            <button
              type="button"
              onClick={() => onNavigateMerchantTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'overview'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                dashboard
              </span>
              <span>Panel Principal</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('catalog')}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'catalog'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-[18px]">
                  inventory_2
                </span>
                <span>Catálogo &amp; Stock</span>
              </div>
              <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateProduct}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'product-form'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                add_box
              </span>
              <span>Nuevo Producto</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('ai-parser')}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'ai-parser'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-[18px] text-[#A23E18]">
                  auto_awesome
                </span>
                <span>Importador IA</span>
              </div>
              <span className="font-mono text-xs bg-[#FFDBCE] text-[#A23E18] px-1.5 py-0.5 font-bold">
                GEMINI
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('graphic-studio')}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'graphic-studio'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#A23E18] hover:bg-[#F3F3F2] hover:text-black font-semibold'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-[18px] text-[#A23E18]">
                  palette
                </span>
                <span>Diseño &amp; Marketing IA</span>
              </div>
              <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.5">
                STUDIO
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('ai-trainer')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'ai-trainer'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                psychology
              </span>
              <span>Entrenador AI &amp; Voz</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'orders'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-[18px]">
                  chat
                </span>
                <span>Pedidos WhatsApp</span>
              </div>
              <span className="font-mono text-xs bg-[#DCFCE7] text-[#15803D] px-1.5 py-0.5 font-bold">
                ACTIVO
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateMerchantTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 transition-all cursor-pointer text-left ${
                currentTab === 'settings'
                  ? 'bg-[#F3F3F2] text-black font-semibold border-l-2 border-black'
                  : 'text-[#5F5E5E] hover:bg-[#F3F3F2] hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                settings
              </span>
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        {/* Store Status & Auth Card */}
        <div className="px-4 space-y-3">
          <div className="p-3.5 bg-[#F9F9F8] border border-[#E5E5E2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-[#5F5E5E]">
                ESTADO DE TIENDA
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-[#15803D] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                ONLINE
              </span>
            </div>
            <div className="font-mono text-xs text-black truncate">
              {tenantConfig.storeUrl}
            </div>
            {currentUser ? (
              <div className="pt-1 border-t border-[#E5E5E2] flex items-center justify-between text-[11px]">
                <span className="text-[#15803D] font-mono truncate">
                  {isSyncingFirestore ? 'Sync...' : 'Firestore Conectado'}
                </span>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="font-mono text-[#A23E18] underline cursor-pointer"
                  >
                    Salir
                  </button>
                )}
              </div>
            ) : (
              onOpenLoginModal && (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="w-full py-1.5 px-2 bg-black text-white font-mono text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Conectar Google Cloud
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onViewLiveCatalog}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-black bg-white hover:bg-black hover:text-white text-black font-semibold uppercase tracking-wider text-xs transition-colors cursor-pointer"
          >
            <span>Ver Catálogo Público</span>
            <span className="material-symbols-outlined text-[14px]">
              open_in_new
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="w-full lg:pl-64 pt-6 min-h-screen bg-[#F9F9F8] px-4 sm:px-6 lg:px-10 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header & Actions */}
          <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E2] pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-semibold">
                  ADMINISTRACIÓN DE INVENTARIO &amp; CONVERSIÓN
                </span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold tracking-tight text-black uppercase">
                Catálogo Editorial ({brandName})
              </h1>
              <p className="text-xs text-[#5F5E5E]">
                Administra visibilidad en tiempo real, stock por talla, estudio de fondo blanco y enlaces directos de WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigateMerchantTab('graphic-studio')}
                className="px-4 py-2.5 bg-[#FFDBCE]/40 hover:bg-[#A23E18] hover:text-white text-[#A23E18] text-xs font-mono font-bold uppercase tracking-wider border border-[#A23E18]/30 transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  palette
                </span>
                <span>Estudio de Marketing IA</span>
              </button>
              <button
                type="button"
                onClick={onOpenPdfModal}
                className="px-4 py-2.5 bg-white hover:bg-[#F3F3F2] text-black text-xs font-semibold uppercase tracking-wider border border-[#E5E5E2] transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  picture_as_pdf
                </span>
                <span>Exportar PDF</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateProduct}
                className="px-5 py-2.5 bg-black hover:bg-[#A23E18] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  add
                </span>
                <span>Nuevo Producto</span>
              </button>
            </div>
          </section>

          {/* Top Metrics Bento Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 border border-[#E5E5E2] flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs uppercase tracking-widest text-[#5F5E5E]">
                  MODELOS EN CATÁLOGO
                </span>
                <span className="font-mono text-xs text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 font-bold">
                  {publishedCount} PUBLICADOS
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] tracking-tight text-black">
                  {totalCount} Referencias
                </div>
                <div className="text-xs text-[#5F5E5E] mt-0.5 font-mono">
                  {hiddenCount} OCULTOS · {soldoutCount} AGOTADOS
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 border border-[#E5E5E2] flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs uppercase tracking-widest text-[#5F5E5E]">
                  CLICS A WHATSAPP (7D)
                </span>
                <span className="font-mono text-xs text-[#15803D] font-bold">
                  +24.8% ↑
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] tracking-tight text-black">
                    184
                  </div>
                  <div className="text-xs text-[#5F5E5E] mt-0.5 font-mono">
                    INTENCIONES DE COMPRA
                  </div>
                </div>
                <div className="flex items-end space-x-1 h-10">
                  <div className="w-1.5 bg-[#E5E5E2] h-4" />
                  <div className="w-1.5 bg-[#E5E5E2] h-6" />
                  <div className="w-1.5 bg-[#E5E5E2] h-5" />
                  <div className="w-1.5 bg-[#E5E5E2] h-8" />
                  <div className="w-1.5 bg-[#25D366] h-10" />
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 border border-[#E5E5E2] flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs uppercase tracking-widest text-[#5F5E5E]">
                  TASA DE CONVERSIÓN WA
                </span>
                <span className="material-symbols-outlined text-[#A23E18] text-[18px]">
                  bolt
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Plus_Jakarta_Sans'] tracking-tight text-black">
                  16.4%
                </div>
                <div className="text-xs text-[#5F5E5E] mt-0.5 font-mono">
                  PROMEDIO SECTOR: 3.2%
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 border border-[#E5E5E2] flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs uppercase tracking-widest text-[#5F5E5E]">
                  LÍNEA CONECTADA
                </span>
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
              </div>
              <div>
                <div className="text-lg font-bold font-mono tracking-tight text-black">
                  {tenantConfig.whatsappPhone}
                </div>
                <div className="text-xs text-[#15803D] mt-1 font-mono uppercase font-semibold">
                  PLANTILLAS DINÁMICAS ACTIVAS
                </div>
              </div>
            </div>
          </section>

          {/* Inventory Filter & Search Bar */}
          <section className="bg-white border border-[#E5E5E2] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E2] pb-3">
              <div className="flex items-center space-x-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5F5E5E] hover:text-black bg-[#F9F9F8]'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('published')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    statusFilter === 'published'
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5F5E5E] hover:text-black bg-[#F9F9F8]'
                  }`}
                >
                  Publicados ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('hidden')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    statusFilter === 'hidden'
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5F5E5E] hover:text-black bg-[#F9F9F8]'
                  }`}
                >
                  Ocultos ({hiddenCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('soldout')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    statusFilter === 'soldout'
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5F5E5E] hover:text-black bg-[#F9F9F8]'
                  }`}
                >
                  Agotados ({soldoutCount})
                </button>
              </div>
              <div className="font-mono text-xs text-[#5F5E5E] uppercase">
                SINCRONIZACIÓN EN TIEMPO REAL CON CATÁLOGO PÚBLICO
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#5F5E5E]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por nombre, SKU o categoría..."
                  type="text"
                  className="w-full bg-[#F9F9F8] pl-9 pr-3 py-2 text-xs text-black placeholder:text-[#5F5E5E] focus:bg-white focus:outline-none border border-[#E5E5E2] focus:border-black transition-all"
                />
              </div>
              <div className="md:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#F9F9F8] px-3 py-2 text-xs font-mono uppercase text-black border border-[#E5E5E2] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="all">CATEGORÍA: TODAS</option>
                  {distinctCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#F9F9F8] px-3 py-2 text-xs font-mono uppercase text-black border border-[#E5E5E2] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="recent">ORDENAR: RECIENTES</option>
                  <option value="name">NOMBRE: A - Z</option>
                  <option value="price-desc">PRECIO: MAYOR A MENOR</option>
                  <option value="price-asc">PRECIO: MENOR A MAYOR</option>
                </select>
              </div>
            </div>
          </section>

          {/* Product Inventory Table */}
          <section className="bg-white border border-[#E5E5E2] overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="font-mono text-xs uppercase text-[#5F5E5E]">
                  No hay productos que coincidan con el filtro seleccionado.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateProduct}
                  className="px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  + Crear Nuevo Producto
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3F3F2] border-b border-[#E5E5E2]">
                      <th className="py-3.5 px-4 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold">
                        PRODUCTO / SKU
                      </th>
                      <th className="py-3.5 px-3 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold">
                        CATEGORÍA
                      </th>
                      <th className="py-3.5 px-3 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold">
                        ACABADOS &amp; TALLAS
                      </th>
                      <th className="py-3.5 px-3 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold text-right">
                        PRECIO ({currency})
                      </th>
                      <th className="py-3.5 px-3 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold text-center">
                        VISIBLE EN CATÁLOGO
                      </th>
                      <th className="py-3.5 px-4 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-semibold text-right">
                        ACCIONES RÁPIDAS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E2] text-xs">
                    {filteredProducts.map((product) => {
                      const isPublished = product.status === 'published';
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-[#F9F9F8] transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-12 h-15 bg-[#F3F3F2] shrink-0 overflow-hidden border border-[#E5E5E2]">
                                <SmartProductImage
                                  alt={product.name}
                                  src={product.heroImage}
                                  productName={product.name}
                                  fallbackCategory={product.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-black font-['Plus_Jakarta_Sans'] uppercase tracking-tight">
                                  {product.name}
                                </div>
                                <div className="font-mono text-xs text-[#5F5E5E] mt-0.5">
                                  SKU: {product.sku}
                                </div>
                                {product.badge && (
                                  <span className="inline-block mt-1 font-mono text-[10px] uppercase bg-[#F3F3F2] px-1.5 py-0.5 text-[#A23E18] font-medium">
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs uppercase px-2 py-1 bg-[#F3F3F2] text-black">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1 mb-1">
                              {product.finishes.map((f) => (
                                <span
                                  key={f.id}
                                  className="w-3 h-3 rounded-full border border-black/20"
                                  style={{ backgroundColor: f.colorHex }}
                                  title={f.name}
                                />
                              ))}
                              <span className="font-mono text-xs text-[#5F5E5E] ml-1">
                                ({product.finishes.length} pieles)
                              </span>
                            </div>
                            <div className="font-mono text-xs text-[#1A1C1C]">
                              Tallas: {product.availableSizes.join(', ')}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-black">
                            {product.price > 0
                              ? `$${product.price.toLocaleString()}.00`
                              : 'Por completar'}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleProductStatus(product.id)}
                              className="inline-flex items-center gap-2 cursor-pointer"
                              title="Alternar visibilidad en el catálogo público"
                            >
                              <div
                                className={`w-9 h-5 rounded-full relative transition-colors p-0.5 ${
                                  isPublished ? 'bg-[#25D366]' : 'bg-[#D4D4D0]'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                                    isPublished
                                      ? 'translate-x-4'
                                      : 'translate-x-0'
                                  }`}
                                />
                              </div>
                              <span
                                className={`font-mono text-xs uppercase font-bold ${
                                  isPublished
                                    ? 'text-[#15803D]'
                                    : 'text-[#5F5E5E]'
                                }`}
                              >
                                {isPublished
                                  ? 'PUBLICADO'
                                  : product.status === 'soldout'
                                  ? 'AGOTADO'
                                  : 'OCULTO'}
                              </span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onPreviewProduct(product)}
                                className="p-1.5 text-[#5F5E5E] hover:text-black hover:bg-[#F3F3F2] transition-colors cursor-pointer"
                                title="Ver Ficha Pública"
                              >
                                <span className="material-symbols-outlined text-[17px] block">
                                  visibility
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditProduct(product)}
                                className="p-1.5 text-[#5F5E5E] hover:text-black hover:bg-[#F3F3F2] transition-colors cursor-pointer"
                                title="Editar Producto"
                              >
                                <span className="material-symbols-outlined text-[17px] block">
                                  edit
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyWhatsAppLink(product)}
                                className="p-1.5 text-[#5F5E5E] hover:text-[#15803D] hover:bg-[#DCFCE7]/50 transition-colors cursor-pointer"
                                title="Copiar Link Directo de WhatsApp"
                              >
                                <span className="material-symbols-outlined text-[17px] block">
                                  share
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductToDelete(product)}
                                className="p-1.5 text-[#5F5E5E] hover:text-[#991B1B] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                title="Eliminar Producto"
                              >
                                <span className="material-symbols-outlined text-[17px] block">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-[#E5E5E2] bg-[#F9F9F8] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-[#5F5E5E]">
              <span>
                MOSTRANDO {filteredProducts.length} DE {totalCount} PRODUCTOS EN CATÁLOGO
              </span>
              <span>
                WHATSAPP CONCIERGE CONECTADO A {tenantConfig.whatsappPhone}
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-white max-w-md w-full p-6 border border-[#E5E5E2] shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#991B1B] font-bold">
                CONFIRMAR ELIMINACIÓN
              </span>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="text-[#5F5E5E] hover:text-black cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold uppercase text-black">
              ¿Eliminar {productToDelete.name}?
            </h3>
            <p className="text-xs text-[#5F5E5E] leading-relaxed">
              Estás por eliminar permanentemente{' '}
              <strong>{productToDelete.name}</strong> (SKU:{' '}
              <span className="font-mono">{productToDelete.sku}</span>). Si solo deseas retirarlo temporalmente del catálogo público, te recomendamos cambiar su estado a Oculto.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E2]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 font-mono text-xs uppercase text-[#5F5E5E] hover:text-black cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleProductStatus(productToDelete.id, 'hidden');
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-[#F9F9F8] border border-[#E5E5E2] font-mono text-xs font-bold uppercase text-black cursor-pointer"
              >
                Solo Ocultar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-[#991B1B] hover:bg-black text-white font-mono text-xs font-bold uppercase cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

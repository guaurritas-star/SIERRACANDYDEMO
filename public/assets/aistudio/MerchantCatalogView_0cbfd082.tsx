import React, { useState, useMemo } from 'react';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';

interface MerchantCatalogViewProps {
  products: Product[];
  tenantConfig: TenantConfig;
  onToggleProductStatus: (id: string) => void;
  onOpenCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenPdfModal: () => void;
  onViewLiveCatalog: () => void;
  onShowToast: (msg: string) => void;
  onNavigateMerchantTab: (tab: string) => void;
  currentTab: string;
}

export const MerchantCatalogView: React.FC<MerchantCatalogViewProps> = ({
  products,
  tenantConfig,
  onToggleProductStatus,
  onOpenCreateProduct,
  onEditProduct,
  onOpenPdfModal,
  onViewLiveCatalog,
  onShowToast,
  onNavigateMerchantTab,
  currentTab,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'soldout'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('consulted');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Counts for tabs
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const hiddenCount = products.filter((p) => p.status === 'hidden').length;
  const soldoutCount = products.filter((p) => p.status === 'soldout').length;
  const totalCount = products.length;

  const totalWhatsAppClicks = useMemo(() => {
    return products.reduce((acc, curr) => acc + (curr.consultationsCount || 0), 0);
  }, [products]);

  const mostConsultedProduct = useMemo(() => {
    return [...products].sort((a, b) => (b.consultationsCount || 0) - (a.consultationsCount || 0))[0] || products[0];
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
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
        if (sortBy === 'consulted') return (b.consultationsCount || 0) - (a.consultationsCount || 0);
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        return a.id.localeCompare(b.id);
      });
  }, [products, statusFilter, categoryFilter, searchQuery, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const handleCopyWhatsAppLink = (product: Product) => {
    const text = `Hola SIERRA, me interesa consultar disponibilidad de ${product.name} (${product.sku})`;
    const url = `https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    onShowToast(`Enlace comercial WhatsApp copiado para ${product.name}`);
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-6rem)]">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-24 bottom-0 w-64 bg-[#FFFFFF] shadow-[1px_0_0_rgba(0,0,0,0.04)] z-40 flex-col justify-between py-4 border-r border-[#E5E5E2]">
        <div className="space-y-4">
          <div className="px-6">
            <p className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
              Navegación Admin
            </p>
          </div>

          <nav className="px-3 space-y-1 font-mono text-xs uppercase">
            <button
              onClick={() => onNavigateMerchantTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'overview'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Panel Principal</span>
            </button>

            <button
              onClick={() => onNavigateMerchantTab('catalog')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'catalog'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>Gestión Catálogo</span>
            </button>

            <button
              onClick={() => onNavigateMerchantTab('ai-parser')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'ai-parser'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-[#a23e18]">auto_awesome</span>
              <span>Importador IA</span>
            </button>

            <button
              onClick={() => onNavigateMerchantTab('ai-trainer')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'ai-trainer'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-[#25D366]">psychology</span>
              <span>Entrenar Gemini (IA)</span>
            </button>

            <button
              onClick={() => onNavigateMerchantTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'orders'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Pedidos WhatsApp</span>
            </button>

            <button
              onClick={() => onNavigateMerchantTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer text-left ${
                currentTab === 'settings'
                  ? 'bg-[#000000] text-white font-semibold'
                  : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Configuración Multi-Tenant</span>
            </button>
          </nav>
        </div>

        <div className="px-4 space-y-3">
          <div className="p-3 bg-[#f3f4f3] font-mono text-xs space-y-1 text-[#6E6E6A] border border-[#E5E5E2]">
            <div className="text-[#1a1c1c] font-bold uppercase">Catálogo Live</div>
            <div>URL: {tenantConfig.storeUrl}</div>
            <div>SKUs: {totalCount} referencias</div>
          </div>

          <button
            onClick={onViewLiveCatalog}
            className="w-full flex items-center gap-2 px-2 py-2 text-[#444748] hover:text-[#ba1a1a] transition-colors font-mono text-xs uppercase cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Ver Catálogo Público</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full lg:pl-64 pt-6 px-4 lg:px-8 bg-[#f9f9f8] pb-16">
        <div className="flex flex-col w-full space-y-6 max-w-7xl mx-auto">
          {/* Top Context Header & Brand Status Bar */}
          <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                  PANEL DE COMERCIO
                </span>
                <span className="text-[#6E6E6A]">/</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#eeeeed] font-mono text-xs text-[#1a1c1c] border border-[#E5E5E2]">
                  <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                  <span>{tenantConfig.theme?.brandName || tenantConfig.name} Storefront · En vivo ({tenantConfig.storeUrl})</span>
                </span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] tracking-tight">
                Gestión de Catálogo
              </h1>
              <p className="text-sm text-[#6E6E6A]">
                Control de referencias, sincronización en tiempo real y flujo de conversión vía WhatsApp.
              </p>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onViewLiveCatalog}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] font-mono text-xs uppercase transition-colors shadow-xs border border-[#E5E5E2] cursor-pointer"
              >
                <span>Ver catálogo en vivo</span>
                <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
              </button>

              <button
                onClick={onOpenPdfModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] font-mono text-xs uppercase transition-colors shadow-xs border border-[#E5E5E2] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#a23e18]">picture_as_pdf</span>
                <span>Exportar Catálogo PDF</span>
              </button>

              <button
                onClick={() => onNavigateMerchantTab('ai-parser')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] font-mono text-xs uppercase transition-colors shadow-xs border border-[#E5E5E2] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#a23e18]">auto_awesome</span>
                <span>Auto-Parse Lookbook</span>
              </button>

              <button
                onClick={() => onNavigateMerchantTab('ai-trainer')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1c1c] font-mono text-xs uppercase transition-colors shadow-xs border border-[#25D366]/40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#25D366]">psychology</span>
                <span>Entrenar Gemini IA</span>
              </button>

              <button
                onClick={onOpenCreateProduct}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#000000] text-[#ffffff] hover:bg-[#333333] transition-colors font-mono text-xs uppercase font-semibold shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Nuevo Producto</span>
              </button>
            </div>
          </section>

          {/* Metric / Operational KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-5 bg-[#FFFFFF] shadow-sm flex flex-col justify-between space-y-3 border border-[#E5E5E2]">
              <div className="flex items-center justify-between text-[#6E6E6A]">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Total Productos Activos
                </span>
                <span className="material-symbols-outlined text-[18px]">inventory</span>
              </div>
              <div>
                <div className="font-['Plus_Jakarta_Sans'] text-3xl text-[#1a1c1c] font-bold leading-none">
                  {totalCount}
                </div>
                <p className="mt-1 font-mono text-xs text-[#6E6E6A]">
                  {publishedCount} publicados · {hiddenCount + soldoutCount} borradores/agotados
                </p>
              </div>
              <div className="h-1.5 w-full bg-[#eeeeed] overflow-hidden">
                <div
                  className="bg-[#000000] h-full transition-all"
                  style={{ width: `${Math.round((publishedCount / (totalCount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-5 bg-[#FFFFFF] shadow-sm flex flex-col justify-between space-y-3 border border-[#E5E5E2]">
              <div className="flex items-center justify-between text-[#6E6E6A]">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Visitas Catálogo (30 días)
                </span>
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#1a1c1c] font-bold leading-none">
                    4,820
                  </span>
                  <span className="font-mono text-xs text-[#25D366] font-bold">+14%</span>
                </div>
                <p className="mt-1 font-mono text-xs text-[#6E6E6A]">
                  Tráfico orgánico & enlaces directos
                </p>
              </div>
              <div className="flex items-end gap-1 h-6 pt-1">
                <span className="bg-[#e2e2e2] w-full h-[35%]"></span>
                <span className="bg-[#e2e2e2] w-full h-[55%]"></span>
                <span className="bg-[#e2e2e2] w-full h-[40%]"></span>
                <span className="bg-[#e2e2e2] w-full h-[70%]"></span>
                <span className="bg-[#e2e2e2] w-full h-[60%]"></span>
                <span className="bg-[#e2e2e2] w-full h-[85%]"></span>
                <span className="bg-[#000000] w-full h-[100%]"></span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-5 bg-[#FFFFFF] shadow-sm flex flex-col justify-between space-y-3 border border-[#E5E5E2]">
              <div className="flex items-center justify-between text-[#6E6E6A]">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Clics a WhatsApp
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#1a1c1c] font-bold leading-none">
                    {totalWhatsAppClicks}
                  </span>
                  <span className="font-mono text-xs text-[#a23e18] font-bold">Conv. 7.2%</span>
                </div>
                <p className="mt-1 font-mono text-xs text-[#6E6E6A]">
                  Conversaciones comerciales iniciadas
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[#25D366] font-mono text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                <span>+42 nuevas esta semana</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-5 bg-[#FFFFFF] shadow-sm flex flex-col justify-between space-y-3 border border-[#E5E5E2]">
              <div className="flex items-center justify-between text-[#6E6E6A]">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Más Consultado
                </span>
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
              <div>
                <div className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c] truncate">
                  {mostConsultedProduct?.name || 'Botín Chelsea Nómada'}
                </div>
                <p className="mt-1 font-mono text-xs text-[#6E6E6A]">
                  SKU: {mostConsultedProduct?.sku} · {mostConsultedProduct?.consultationsCount || 94} clics directos
                </p>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-[#6E6E6A]">
                <span>27.0% DEL TOTAL</span>
                <span className="text-[#1a1c1c] font-bold">
                  ${mostConsultedProduct?.price.toLocaleString()} MXN
                </span>
              </div>
            </div>
          </section>

          {/* Inventory Control & Filter Bar */}
          <section className="bg-[#FFFFFF] shadow-sm p-4 space-y-4 border border-[#E5E5E2]">
            {/* Status Segment Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 font-mono text-xs uppercase">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#000000] text-white font-semibold'
                      : 'bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c]'
                  }`}
                >
                  Todos los productos ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('published')}
                  className={`px-3 py-2 tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'published'
                      ? 'bg-[#000000] text-white font-semibold'
                      : 'bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c]'
                  }`}
                >
                  Publicados ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('hidden')}
                  className={`px-3 py-2 tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'hidden'
                      ? 'bg-[#000000] text-white font-semibold'
                      : 'bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c]'
                  }`}
                >
                  Ocultos / Despublicados ({hiddenCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('soldout')}
                  className={`px-3 py-2 tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'soldout'
                      ? 'bg-[#000000] text-white font-semibold'
                      : 'bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c]'
                  }`}
                >
                  Agotados ({soldoutCount})
                </button>
              </div>

              {/* Live Sync Feedback Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f3f4f3] font-mono text-xs text-[#6E6E6A] border border-[#E5E5E2]">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                <span>Sincronización instantánea activa</span>
              </div>
            </div>

            {/* Search & Secondary Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Search Input */}
              <div className="md:col-span-6 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6E6A]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o categoría..."
                  type="text"
                  className="w-full bg-[#f3f4f3] pl-10 pr-3 py-2 text-sm text-[#1a1c1c] placeholder:text-[#6E6E6A] focus:bg-[#FFFFFF] focus:outline-none transition-colors border border-[#E5E5E2]"
                />
              </div>

              {/* Category Filter */}
              <div className="md:col-span-3">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full appearance-none bg-[#f3f4f3] px-3 py-2 font-mono text-xs uppercase text-[#1a1c1c] focus:outline-none cursor-pointer border border-[#E5E5E2]"
                  >
                    <option value="all">Todas las Categorías</option>
                    <option value="Calzado">Calzado</option>
                    <option value="Sandalias">Sandalias</option>
                    <option value="Accesorios/Mulas">Accesorios / Mulas</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#6E6E6A] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="md:col-span-3">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#f3f4f3] px-3 py-2 font-mono text-xs uppercase text-[#1a1c1c] focus:outline-none cursor-pointer border border-[#E5E5E2]"
                  >
                    <option value="consulted">Más consultados en WhatsApp</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="price-asc">Menor precio</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#6E6E6A] pointer-events-none">
                    sort
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Product Management Table Section */}
          <section className="bg-[#FFFFFF] shadow-sm overflow-hidden border border-[#E5E5E2]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f3] font-mono text-xs uppercase text-[#6E6E6A] tracking-wider border-b border-[#E5E5E2]">
                  <tr>
                    <th className="py-3 px-4 lg:px-6">Producto / Referencia</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3">Variantes Activas</th>
                    <th className="py-3 px-3 text-right">Precio Base</th>
                    <th className="py-3 px-3 text-center">Estado Catálogo</th>
                    <th className="py-3 px-3 text-right">Consultas WhatsApp</th>
                    <th className="py-3 px-4 lg:px-6 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#eeeeed] text-sm">
                  {paginatedProducts.map((product) => {
                    const isPublished = product.status === 'published';
                    const isSoldOut = product.status === 'soldout';

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-[#f9f9f8] transition-colors ${
                          !isPublished ? 'bg-[#f3f4f3]/40' : ''
                        }`}
                      >
                        {/* Name & SKU */}
                        <td className="py-3 px-4 lg:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-[#eeeeed] flex-shrink-0 overflow-hidden border border-[#E5E5E2]">
                              <SmartProductImage
                                alt={product.name}
                                src={product.heroImage}
                                productName={product.name}
                                fallbackCategory={product.category}
                                className={`w-full h-full object-cover ${
                                  !isPublished ? 'opacity-75' : ''
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c] truncate">
                                {product.name}
                              </div>
                              <div className="font-mono text-xs text-[#6E6E6A] flex items-center gap-1.5 mt-0.5">
                                <span>SKU: {product.sku}</span>
                                <span>·</span>
                                {isPublished ? (
                                  <span className="text-[#25D366] flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">
                                      link
                                    </span>
                                    <span>Link WA listo</span>
                                  </span>
                                ) : isSoldOut ? (
                                  <span className="text-[#a23e18] font-medium">
                                    Agotado temporalmente
                                  </span>
                                ) : (
                                  <span className="text-[#6E6E6A] flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">
                                      visibility_off
                                    </span>
                                    <span>No visible en web</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-[#eeeeed] font-mono text-xs uppercase text-[#1a1c1c] border border-[#E5E5E2]">
                            {product.category}
                          </span>
                        </td>

                        {/* Variants */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-xs text-[#1a1c1c]">
                            {product.finishes.length}{' '}
                            {product.finishes.length === 1 ? 'color' : 'colores'} /{' '}
                            {product.availableSizes.length} tallas
                          </div>
                          <div className="text-xs text-[#6E6E6A]">
                            {product.availableSizes[0]} a{' '}
                            {product.availableSizes[product.availableSizes.length - 1]} MX
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-[#1a1c1c]">
                          ${product.price.toLocaleString()} MXN
                        </td>

                        {/* Status Toggle Switch */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isPublished}
                              onClick={() => onToggleProductStatus(product.id)}
                              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none ${
                                isPublished ? 'bg-[#25D366]' : 'bg-[#e2e2e2]'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform bg-[#FFFFFF] shadow transition duration-200 ease-in-out ${
                                  isPublished ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              ></span>
                            </button>
                            <span
                              className={`font-mono text-[10px] uppercase font-bold ${
                                isPublished
                                  ? 'text-[#25D366]'
                                  : isSoldOut
                                  ? 'text-[#a23e18]'
                                  : 'text-[#6E6E6A]'
                              }`}
                            >
                              {isPublished ? 'PUBLICADO' : isSoldOut ? 'AGOTADO' : 'OCULTO'}
                            </span>
                          </div>
                        </td>

                        {/* WhatsApp Queries */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#1a1c1c]">
                            <span className="material-symbols-outlined text-[15px] text-[#25D366]">
                              chat
                            </span>
                            <span>{product.consultationsCount || 0}</span>
                          </div>
                          <div className="text-[11px] font-mono text-[#6E6E6A]">
                            Último: {product.lastConsultation || 'reciente'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 lg:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppLink(product)}
                              className="p-1.5 text-[#6E6E6A] hover:text-[#25D366] hover:bg-[#eeeeed] transition-colors cursor-pointer"
                              title="Copiar Enlace WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[18px]">share</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditProduct(product)}
                              className="p-1.5 text-[#6E6E6A] hover:text-[#1a1c1c] hover:bg-[#eeeeed] transition-colors cursor-pointer"
                              title="Editar Producto"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Pagination / Summary Footer */}
            <div className="px-6 py-3 bg-[#f3f4f3] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-[#6E6E6A] border-t border-[#E5E5E2]">
              <div>
                Mostrando{' '}
                <span className="font-bold text-[#1a1c1c]">
                  {paginatedProducts.length} de {filteredProducts.length}
                </span>{' '}
                referencias registradas
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] transition-colors disabled:opacity-40 cursor-pointer border border-[#E5E5E2]"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2.5 py-1 font-bold cursor-pointer transition-colors ${
                      currentPage === i + 1
                        ? 'bg-[#000000] text-[#ffffff]'
                        : 'bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] border border-[#E5E5E2]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] transition-colors disabled:opacity-40 cursor-pointer border border-[#E5E5E2]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          {/* Multi-tenant Identity Anchor & Quick Guide */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 p-4 bg-[#f3f4f3] flex items-center justify-between gap-4 border border-[#E5E5E2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#000000] text-[#ffffff] flex items-center justify-center font-mono text-sm font-bold">
                  S
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase text-[#6E6E6A] tracking-wider font-semibold">
                    Tenant en Edición Activa
                  </div>
                  <div className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c]">
                    {tenantConfig.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateMerchantTab('settings')}
                className="inline-flex items-center gap-1 font-mono text-xs uppercase text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer"
              >
                <span>Ajustes de Marca</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>

            <div className="lg:col-span-4 p-4 bg-[#FFFFFF] shadow-sm flex items-center gap-3 border border-[#E5E5E2]">
              <span className="material-symbols-outlined text-[20px] text-[#25D366]">
                verified
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs text-[#1a1c1c] font-bold">
                  Catálogo 100% Enlazado a WhatsApp
                </p>
                <p className="text-xs text-[#6E6E6A] truncate">
                  Mensajes pre-formateados con SKU y talla.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

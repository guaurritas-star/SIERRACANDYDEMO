import React, { useState, useMemo } from 'react';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import {
  buildProductWhatsAppUrl,
  buildConciergeWhatsAppUrl,
} from '../utils/whatsapp';

interface PublicCatalogViewProps {
  products: Product[];
  tenantConfig: TenantConfig;
  onSelectProduct: (product: Product) => void;
  onShowToast: (msg: string) => void;
  isLoading?: boolean;
  loadError?: string | null;
}

export const PublicCatalogView: React.FC<PublicCatalogViewProps> = ({
  products,
  tenantConfig,
  onSelectProduct,
  onShowToast,
  isLoading = false,
  loadError = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [quickCardSelection, setQuickCardSelection] = useState<{
    [productId: string]: { size?: string; finish?: string };
  }>({});

  const brandName = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const industry =
    tenantConfig.theme?.industry || 'Calzado Artesanal & Marroquinería';
  const tagline =
    tenantConfig.theme?.tagline ||
    'Calzado diseñado en León, Guanajuato. Construido sobre hormas anatómicas con pieles de curtido vegetal y suelas cosidas Goodyear Welt.';
  const location =
    tenantConfig.showroomCity ||
    tenantConfig.theme?.location ||
    'LEÓN, GTO · MÉXICO';
  const currency = tenantConfig.currency || 'MXN';
  const primaryWord =
    tenantConfig.theme?.primaryActionWord || 'Colección';
  const valueProps =
    tenantConfig.theme?.valuePropositions &&
    tenantConfig.theme.valuePropositions.length > 0
      ? tenantConfig.theme.valuePropositions
      : [
          'Materiales seleccionados de origen certificado.',
          'Manufactura ética en lotes numerados.',
          'Atención directa 1 a 1 vía WhatsApp.',
          'Garantía directa con el productor.',
        ];

  const visibleProducts = useMemo(() => {
    return products.filter(
      (p) => p.status === 'published' || p.status === 'soldout'
    );
  }, [products]);

  const featuredHeroProduct = visibleProducts[0] || null;

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(visibleProducts.map((p) => p.category))).filter(
      Boolean
    );
  }, [visibleProducts]);

  const distinctSizes = useMemo(() => {
    const sSet = new Set<string>();
    visibleProducts.forEach((p) =>
      p.availableSizes?.forEach((s) => sSet.add(s))
    );
    return Array.from(sSet).slice(0, 10);
  }, [visibleProducts]);

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((p) => {
      if (selectedCategory !== 'all') {
        const matchesCat =
          p.category.toLowerCase() === selectedCategory.toLowerCase() ||
          p.catalogCategory?.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesCat) return false;
      }

      if (selectedSize) {
        const hasSize = p.availableSizes.some((s) => s === selectedSize);
        if (!hasSize) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (
          !matchesName &&
          !matchesSku &&
          !matchesDesc &&
          !matchesCategory &&
          !matchesTags
        ) {
          return false;
        }
      }

      return true;
    });
  }, [visibleProducts, selectedCategory, selectedSize, searchQuery]);

  const toggleBookmark = (
    e: React.MouseEvent,
    productId: string,
    productName: string
  ) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        onShowToast(`${productName} removido de guardados`);
        return prev.filter((id) => id !== productId);
      } else {
        onShowToast(`${productName} guardado en favoritos`);
        return [...prev, productId];
      }
    });
  };

  const handleCardFinishSelect = (
    e: React.MouseEvent,
    productId: string,
    finishName: string
  ) => {
    e.stopPropagation();
    setQuickCardSelection((prev) => {
      const current = prev[productId] || {};
      return {
        ...prev,
        [productId]: {
          ...current,
          finish: finishName,
        },
      };
    });
  };

  const handleCardWhatsAppClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const chosen = quickCardSelection[product.id];
    const chosenFinish = chosen?.finish || product.finishes[0]?.name || null;
    const chosenSize =
      chosen?.size || selectedSize || product.availableSizes[0] || null;
    const url = buildProductWhatsAppUrl({
      product,
      tenantConfig,
      selectedFinish: chosenFinish,
      selectedSize: chosenSize,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="top" className="flex flex-col w-full bg-[#F9F9F8] text-[#1A1C1C]">
      {/* Top Editorial Notice Ribbon */}
      {tenantConfig.announcement && (
        <div className="w-full bg-[#2A1A14] text-white border-b border-[#E5E5E2] px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-[#E37C58] shrink-0" />
            <span className="truncate">{tenantConfig.announcement}</span>
          </div>
          <a
            href="#tallas-guide"
            className="underline hover:text-[#FFDBCE] transition-colors shrink-0 ml-4"
          >
            Asistencia Directa →
          </a>
        </div>
      )}

      {/* 1. EDITORIAL HERO SECTION (Swiss High-Contrast Grid) */}
      <section className="w-full max-w-[1440px] mx-auto border-b border-[#E5E5E2] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Content Cell (7 Columns) */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E5E5E2]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 border border-[#E5E5E2] bg-[#F9F9F8] px-3 py-1">
                <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-medium">
                  {industry.toUpperCase()} — {brandName.toUpperCase()}
                </span>
              </div>

              <h1 className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight uppercase leading-[1.03] text-black">
                {brandName} <br />
                <span className="text-[#5F5E5E]">
                  {primaryWord} Contemporánea.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#5F5E5E] max-w-xl leading-relaxed font-normal">
                {tagline}
              </p>

              {/* Quick Conversion Callout */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#coleccion"
                  className="bg-black text-white px-6 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#A23E18] transition-colors inline-flex items-center gap-2"
                >
                  <span>Explorar Catálogo</span>
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_downward
                  </span>
                </a>
                <a
                  href={buildConciergeWhatsAppUrl(tenantConfig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-black bg-white text-black px-5 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#25D366] hover:border-[#25D366] hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>

            {/* Technical Metadata Footnote */}
            <div className="pt-12 mt-12 border-t border-[#E5E5E2] grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <span className="block font-mono text-xs uppercase text-[#5F5E5E] tracking-wider">
                  ORIGEN / SEDE
                </span>
                <span className="font-mono text-xs font-semibold text-black mt-0.5 block uppercase">
                  {location}
                </span>
              </div>
              <div>
                <span className="block font-mono text-xs uppercase text-[#5F5E5E] tracking-wider">
                  REFERENCIAS ACTIVAS
                </span>
                <span className="font-mono text-xs font-semibold text-black mt-0.5 block uppercase">
                  {visibleProducts.length} MODELOS DISPONIBLES
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block font-mono text-xs uppercase text-[#5F5E5E] tracking-wider">
                  DESPACHO DIRECTO
                </span>
                <span className="font-mono text-xs font-semibold text-[#15803D] mt-0.5 block">
                  CONVERSIÓN VÍA WHATSAPP
                </span>
              </div>
            </div>
          </div>

          {/* Right Featured Image Cell (5 Columns) */}
          <div
            onClick={() => {
              if (featuredHeroProduct) onSelectProduct(featuredHeroProduct);
            }}
            className="lg:col-span-5 relative aspect-[4/5] lg:aspect-auto bg-[#F3F3F2] overflow-hidden group cursor-pointer"
          >
            {featuredHeroProduct ? (
              <>
                <SmartProductImage
                  alt={`${featuredHeroProduct.name} Destacado`}
                  src={featuredHeroProduct.heroImage}
                  productName={featuredHeroProduct.name}
                  fallbackCategory={featuredHeroProduct.category}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest bg-[#A23E18] px-2 py-0.5 inline-block mb-2">
                      PIEZA DESTACADA
                    </span>
                    <p className="font-['Plus_Jakarta_Sans'] text-xl font-bold uppercase tracking-tight">
                      {featuredHeroProduct.name}
                    </p>
                    <p className="font-mono text-xs text-white/80">
                      SKU: {featuredHeroProduct.sku} ·{' '}
                      {featuredHeroProduct.price > 0
                        ? `$${featuredHeroProduct.price.toLocaleString()} ${currency}`
                        : 'Precio por completar'}
                    </p>
                  </div>
                  <span className="bg-white text-black p-2.5 inline-flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_outward
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-12 text-center font-mono text-xs uppercase text-[#5F5E5E]">
                Sin productos publicados en el catálogo
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. STICKY SEARCH & TAXONOMY FILTER BAR */}
      <section
        id="coleccion"
        className="sticky top-24 z-30 w-full bg-[#F9F9F8]/95 backdrop-blur-md border-b border-[#E5E5E2]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5E] text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por modelo, SKU, piel o suela..."
                type="text"
                aria-label="Buscar por modelo, SKU, piel o suela"
                className="w-full bg-white pl-10 pr-8 py-2 text-xs font-medium text-black placeholder:text-[#5F5E5E] focus:outline-none border border-[#E5E5E2] focus:border-black transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F5E5E] hover:text-black cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              )}
            </div>

            {/* Category Filter Pills (Horizontal Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-black text-white font-medium'
                    : 'bg-white border border-[#E5E5E2] text-[#5F5E5E] hover:text-black hover:border-black'
                }`}
              >
                Todos ({visibleProducts.length})
              </button>

              {distinctCategories.map((cat) => {
                const count = visibleProducts.filter(
                  (p) => p.category.toLowerCase() === cat.toLowerCase()
                ).length;
                const isActive =
                  selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-black text-white font-medium'
                        : 'bg-white border border-[#E5E5E2] text-[#5F5E5E] hover:text-black hover:border-black'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Layout Toggle */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-[#E5E5E2]">
              <span className="font-mono text-xs uppercase text-[#5F5E5E]">
                VISTA:
              </span>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1 border cursor-pointer transition-colors ${
                  viewLayout === 'grid'
                    ? 'bg-white border-black text-black'
                    : 'text-[#5F5E5E] hover:text-black border-transparent'
                }`}
                title="Cuadrícula Editorial"
              >
                <span className="material-symbols-outlined text-[18px] block">
                  grid_view
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`p-1 border cursor-pointer transition-colors ${
                  viewLayout === 'list'
                    ? 'bg-white border-black text-black'
                    : 'text-[#5F5E5E] hover:text-black border-transparent'
                }`}
                title="Vista Compacta"
              >
                <span className="material-symbols-outlined text-[18px] block">
                  view_agenda
                </span>
              </button>
            </div>
          </div>

          {/* Secondary Size Quick-Filter Bar */}
          {distinctSizes.length > 0 && (
            <div className="py-2.5 border-t border-[#E5E5E2] flex items-center justify-between gap-4 overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-[#5F5E5E] whitespace-nowrap">
                  TALLA RÁPIDA:
                </span>
                <div className="flex items-center gap-1">
                  {distinctSizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setSelectedSize((prev) => (prev === sz ? null : sz))
                      }
                      className={`px-2 py-0.5 font-mono text-xs border transition-colors cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white text-[#1A1C1C] border-[#E5E5E2] hover:border-black'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                  {selectedSize && (
                    <button
                      type="button"
                      onClick={() => setSelectedSize(null)}
                      className="ml-2 font-mono text-xs text-[#A23E18] underline uppercase cursor-pointer"
                    >
                      Limpiar talla
                    </button>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#5F5E5E]">
                <span>MOSTRANDO {filteredProducts.length} MODELOS</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. PRODUCT CATALOG GRID */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loadError ? (
          <div className="bg-white border border-[#E5E5E2] p-12 text-center space-y-3">
            <p className="font-mono text-xs uppercase text-[#991B1B] font-semibold">
              {loadError}
            </p>
            <p className="text-xs text-[#5F5E5E]">
              Mostrando el catálogo local de respaldo mientras se restablece la conexión.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E5E5E2] p-4 space-y-4 animate-pulse"
              >
                <div className="w-full aspect-[4/5] bg-[#F3F3F2]" />
                <div className="h-4 bg-[#F3F3F2] w-2/3" />
                <div className="h-3 bg-[#F3F3F2] w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E5E5E2] p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-[#5F5E5E]">
              search_off
            </span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold uppercase">
              Sin coincidencias para tu filtro actual
            </h3>
            <p className="text-xs text-[#5F5E5E] max-w-md mx-auto">
              Intenta limpiar los filtros de categoría, talla o búsqueda para explorar toda la colección.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSize(null);
              }}
              className="bg-black text-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div
            className={
              viewLayout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'grid grid-cols-1 md:grid-cols-2 gap-6'
            }
          >
            {filteredProducts.map((product) => {
              const isBookmarked = bookmarkedIds.includes(product.id);
              const isSoldOut = product.status === 'soldout';
              const cardSelection = quickCardSelection[product.id] || {};
              const activeFinish =
                cardSelection.finish || product.finishes[0]?.name;

              return (
                <article
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group bg-white border border-[#E5E5E2] hover:border-black transition-colors flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Product Image Frame (4:5 Aspect Ratio) */}
                    <div className="relative aspect-[4/5] w-full bg-[#F3F3F2] overflow-hidden border-b border-[#E5E5E2]">
                      <SmartProductImage
                        alt={product.name}
                        src={product.heroImage}
                        productName={product.name}
                        fallbackCategory={product.category}
                        className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
                          isSoldOut ? 'opacity-60 grayscale-[30%]' : ''
                        }`}
                      />

                      {/* Status Badge */}
                      {isSoldOut ? (
                        <div className="absolute top-3 left-3 bg-[#1A1C1C] text-white px-2.5 py-1">
                          <span className="font-mono text-xs uppercase tracking-wider block font-medium">
                            AGOTADO TEMPORALMENTE
                          </span>
                        </div>
                      ) : (
                        product.badge && (
                          <div
                            className={`absolute top-3 left-3 px-2.5 py-1 ${
                              product.badgeType === 'primary'
                                ? 'bg-black text-white'
                                : product.badgeType === 'secondary'
                                ? 'bg-[#A23E18] text-white'
                                : 'bg-white/95 backdrop-blur-sm border border-[#E5E5E2] text-black'
                            }`}
                          >
                            <span className="font-mono text-xs uppercase tracking-wider block font-medium">
                              {product.badge}
                            </span>
                          </div>
                        )
                      )}

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) =>
                          toggleBookmark(e, product.id, product.name)
                        }
                        aria-label={`Guardar ${product.name}`}
                        className={`absolute top-3 right-3 bg-white/90 p-2 border border-[#E5E5E2] transition-opacity cursor-pointer ${
                          isBookmarked
                            ? 'opacity-100 text-[#A23E18]'
                            : 'opacity-0 group-hover:opacity-100 text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] block">
                          {isBookmarked ? 'bookmark_added' : 'bookmark'}
                        </span>
                      </button>
                    </div>

                    {/* Product Details Header */}
                    <div className="p-5">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-mono text-xs text-[#5F5E5E] uppercase tracking-wider">
                          SKU: {product.sku} · {product.category.toUpperCase()}
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-black">
                            {product.price > 0
                              ? `$${product.price.toLocaleString()} ${currency}`
                              : 'Precio por completar'}
                          </span>
                          {product.comparePrice &&
                            product.comparePrice > product.price && (
                              <span className="block font-mono text-xs text-[#5F5E5E] line-through">
                                ${product.comparePrice.toLocaleString()}
                              </span>
                            )}
                        </div>
                      </div>

                      <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-black uppercase mb-1 group-hover:text-[#A23E18] transition-colors">
                        {product.name}
                      </h2>

                      <p className="text-xs text-[#5F5E5E] line-clamp-2 mb-4 leading-relaxed">
                        {product.subtitle || product.description}
                      </p>

                      {/* Variant Matrix Preview */}
                      <div className="space-y-2.5 pt-3 border-t border-[#E5E5E2]">
                        {product.finishes && product.finishes.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase text-[#5F5E5E]">
                              COLORES:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {product.finishes.map((f) => {
                                const isChosen = activeFinish === f.name;
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={(e) =>
                                      handleCardFinishSelect(
                                        e,
                                        product.id,
                                        f.name
                                      )
                                    }
                                    className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                                      isChosen
                                        ? 'ring-1 ring-black ring-offset-1 scale-110'
                                        : 'border-black/20 hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: f.colorHex }}
                                    title={f.name}
                                  />
                                );
                              })}
                              <span className="font-mono text-xs text-[#1A1C1C] ml-1">
                                {activeFinish || product.finishes[0]?.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {product.availableSizes &&
                          product.availableSizes.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs uppercase text-[#5F5E5E]">
                                TALLAS:
                              </span>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {product.availableSizes.slice(0, 6).map((sz) => (
                                  <span
                                    key={sz}
                                    className={`font-mono text-xs px-1.5 py-0.5 border ${
                                      selectedSize === sz
                                        ? 'bg-black text-white border-black font-bold'
                                        : 'bg-[#F9F9F8] border-[#E5E5E2] text-[#1A1C1C]'
                                    }`}
                                  >
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Conversion Bar */}
                  <div className="px-5 pb-5 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleCardWhatsAppClick(e, product)}
                      className="w-full bg-black group-hover:bg-[#25D366] text-white group-hover:text-black font-semibold text-xs uppercase tracking-widest py-3 px-4 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Ver Ficha &amp; Pedir por WhatsApp</span>
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_outward
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 4. EDITORIAL ASSISTANCE & SIZE GUIDE BANNER */}
        <section
          id="tallas-guide"
          className="mt-14 bg-white border border-[#E5E5E2] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="lg:col-span-8 space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-semibold">
              CONCIERGE DE PRODUCTO &amp; HORMA
            </span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
              ¿Dudas con tu talla, ajuste o tiempo de entrega?
            </h3>
            <p className="text-xs sm:text-sm text-[#5F5E5E] max-w-2xl leading-relaxed">
              Nuestro equipo en {location} te asesora en tiempo real vía WhatsApp para elegir la variante ideal y confirmar existencias inmediatas antes de realizar tu pago.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <a
              href={buildConciergeWhatsAppUrl(
                tenantConfig,
                `Hola equipo de ${brandName}, me gustaría recibir asesoría personalizada de su catálogo.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1FAF59] text-black font-bold text-xs uppercase tracking-widest px-6 py-4 inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Hablar con un Especialista</span>
              <span className="material-symbols-outlined text-[18px]">
                chat
              </span>
            </a>
          </div>
        </section>

        {/* 5. MANIFESTO / CRAFT STRIP */}
        <section
          id="manifiesto"
          className="mt-8 grid grid-cols-1 md:grid-cols-4 border border-[#E5E5E2] bg-white divide-y md:divide-y-0 md:divide-x divide-[#E5E5E2]"
        >
          {valueProps.slice(0, 4).map((prop, index) => (
            <div key={index} className="p-6 space-y-1.5">
              <span className="font-mono text-xs text-[#A23E18] uppercase font-semibold">
                0{index + 1} / COMPROMISO {brandName.toUpperCase()}
              </span>
              <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold uppercase">
                Garantía de Origen
              </h4>
              <p className="text-xs text-[#5F5E5E] leading-relaxed">{prop}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

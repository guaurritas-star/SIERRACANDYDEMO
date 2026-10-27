import React, { useState, useMemo } from 'react';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';

interface PublicCatalogViewProps {
  products: Product[];
  tenantConfig: TenantConfig;
  onSelectProduct: (product: Product) => void;
  onShowToast: (msg: string) => void;
}

export const PublicCatalogView: React.FC<PublicCatalogViewProps> = ({
  products,
  tenantConfig,
  onSelectProduct,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        onShowToast('Pieza removida de guardados');
      } else {
        next.add(id);
        onShowToast('Pieza guardada en tu selección');
      }
      return next;
    });
  };

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  }, [products]);

  const distinctSizes = useMemo(() => {
    const sSet = new Set<string>();
    products.forEach((p) => p.availableSizes?.forEach((s) => sSet.add(s)));
    return Array.from(sSet).slice(0, 8);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Show published products in public catalog
      if (p.status !== 'published') return false;

      // Category filter (flexible for any business)
      if (selectedCategory !== 'all') {
        const matchesCategory =
          p.category.toLowerCase() === selectedCategory.toLowerCase() ||
          p.catalogCategory?.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Size filter
      if (selectedSize) {
        const hasSize = p.availableSizes.some((s) => s.startsWith(selectedSize));
        if (!hasSize) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesSku && !matchesDesc && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedSize, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    return {
      all: published.length,
      botas: published.filter((p) => p.catalogCategory === 'botas').length,
      mocasines: published.filter((p) => p.catalogCategory === 'mocasines').length,
      derby: published.filter((p) => p.catalogCategory === 'derby').length,
      sandalias: published.filter((p) => p.catalogCategory === 'sandalias').length,
    };
  }, [products]);

  const generateWhatsAppUrl = (product: Product, size?: string) => {
    const chosenSize = size || product.availableSizes[0] || '27';
    const chosenColor = product.finishes[0]?.name || 'Negro';
    let text = product.waTemplate
      .replace('{nombre_producto}', product.name)
      .replace('{sku}', product.sku)
      .replace('{talla}', chosenSize)
      .replace('{color}', chosenColor);

    return `https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      text
    )}`;
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Editorial Notice Ribbon */}
      <div className="w-full bg-[#e8e8e7] py-2 px-4 lg:px-10 text-center border-b border-[#E5E5E2]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 font-mono text-xs text-[#1a1c1c] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a23e18]"></span>
          <span>{tenantConfig.announcement}</span>
        </div>
      </div>

      {/* Hero Editorial: High Contrast Swiss Layout */}
      <section className="w-full px-4 lg:px-10 pt-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Statement Cell */}
            <div className="lg:col-span-7 bg-[#FFFFFF] p-6 lg:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#E5E5E2]">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs text-[#6E6E6A]">
                  <span className="text-[#1a1c1c] font-semibold">[EDICIÓN 08]</span>
                  <span>/</span>
                  <span>CURADURÍA PERMANENTE</span>
                  <span>/</span>
                  <span className="text-[#a23e18] font-medium">LEÓN · MX</span>
                </div>

                <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#1a1c1c] font-bold max-w-xl leading-tight">
                  SILUETAS ESENCIALES <span className="text-[#6E6E6A] font-normal block lg:inline">/ 2025</span>
                </h1>

                <p className="text-base sm:text-lg text-[#444748] max-w-lg leading-relaxed pt-1">
                  Forma, oficio y confort diario. Calzado artesanal de corte contemporáneo, concebido en León, Guanajuato para trascender temporadas efímeras mediante pieles curtidas con extractos vegetales.
                </p>
              </div>

              <div className="pt-8 mt-6 border-t border-[#eeeeed]">
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[#6E6E6A]">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#a23e18] text-[16px]">verified</span>
                    <span>Pieles Vacunas Seleccionadas</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#25D366] text-[16px]">support_agent</span>
                    <span>Asesoría de Calce en Vivo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Featured Hero Image Cell */}
            <div
              onClick={() => {
                if (products[0]) onSelectProduct(products[0]);
              }}
              className="lg:col-span-5 bg-[#eeeeed] relative min-h-[380px] lg:min-h-full overflow-hidden group shadow-sm border border-[#E5E5E2] cursor-pointer"
            >
              <SmartProductImage
                alt={products[0]?.name || 'Colección Destacada'}
                src={products[0]?.heroImage || '/assets/mextie/page_4.png'}
                productName={products[0]?.name}
                fallbackCategory={products[0]?.category}
                showVerifiedBadge={true}
                className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between text-white">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#c9c6c5]">
                    {tenantConfig.theme?.brandName || tenantConfig.name} · DESTACADO
                  </span>
                  <p className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase">
                    {products[0]?.name || 'Colección Oficial'}
                  </p>
                </div>
                <span className="font-mono text-xs bg-[#FFFFFF] text-[#1a1c1c] px-3 py-1 font-semibold uppercase">
                  {tenantConfig.showroomCity || 'TALLER OFICIAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls, Filters & Navigation Sticky Header Strip */}
      <section className="sticky top-24 z-30 bg-[#f9f9f8]/95 backdrop-blur-md px-4 lg:px-10 py-3 shadow-[0_1px_0_rgba(0,0,0,0.06)] border-y border-[#E5E5E2]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input Minimalist */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E6A] text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar silueta, piel o modelo..."
              type="text"
              className="w-full bg-[#FFFFFF] pl-10 pr-8 py-2 text-sm text-[#1a1c1c] placeholder:text-[#6E6E6A] focus:outline-none focus:ring-1 focus:ring-black shadow-sm border border-[#E5E5E2]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E6A] hover:text-[#1a1c1c]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Dynamic Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 font-mono text-xs uppercase whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'bg-[#FFFFFF] text-[#1a1c1c] hover:bg-[#eeeeed] shadow-sm border border-[#E5E5E2]'
              }`}
            >
              Todos ({products.filter((p) => p.status === 'published').length})
            </button>

            {distinctCategories.map((cat) => {
              const count = products.filter(
                (p) => p.status === 'published' && p.category.toLowerCase() === cat.toLowerCase()
              ).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#000000] text-[#ffffff]'
                      : 'bg-[#FFFFFF] text-[#1a1c1c] hover:bg-[#eeeeed] shadow-sm border border-[#E5E5E2]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Layout View Mode & Status */}
          <div className="hidden lg:flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center bg-[#FFFFFF] p-0.5 shadow-sm border border-[#E5E5E2]">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-[#000000] text-[#ffffff]'
                    : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                }`}
                title="Vista Cuadrícula"
              >
                <span className="material-symbols-outlined text-[18px] block">grid_view</span>
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 cursor-pointer ${
                  viewLayout === 'list'
                    ? 'bg-[#000000] text-[#ffffff]'
                    : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                }`}
                title="Vista Editorial"
              >
                <span className="material-symbols-outlined text-[18px] block">view_agenda</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[#6E6E6A] font-mono text-xs uppercase">
              <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
              <span>Verano 2025 Activo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Meta Filter Bar (Sizes & Leather Tanning Options) */}
      <section className="w-full px-4 lg:px-10 py-2.5 bg-[#f3f4f3] border-b border-[#E5E5E2]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#6E6E6A] uppercase tracking-wider font-semibold">
              TALLA RÁPIDA (MX):
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {(distinctSizes.length > 0 ? distinctSizes : ['38R', '40R', '42R', 'S', 'M', 'L']).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize((prev) => (prev === sz ? null : sz))}
                  className={`px-2 py-0.5 border text-xs transition-colors cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-[#000000] text-[#ffffff] border-black'
                      : 'bg-[#FFFFFF] text-[#1a1c1c] border-[#E5E5E2] hover:bg-[#000000] hover:text-[#ffffff]'
                  }`}
                >
                  {sz}
                </button>
              ))}
              {selectedSize && (
                <button
                  onClick={() => setSelectedSize(null)}
                  className="text-xs text-[#a23e18] hover:underline ml-1 cursor-pointer"
                >
                  (Limpiar)
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[#6E6E6A]">
            <span>ORIGEN: {tenantConfig.showroomCity || 'Taller Oficial'}</span>
            <span className="text-[#D4D4D0] hidden sm:inline">|</span>
            <a
              href="#tallas-guide"
              className="text-[#1a1c1c] hover:text-[#a23e18] flex items-center gap-1 underline underline-offset-4 decoration-[#D4D4D0]"
            >
              <span className="material-symbols-outlined text-[14px]">straighten</span>
              <span>Guía de Calce y Medidas</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main className="w-full px-4 lg:px-10 py-10">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFFFF] p-8 shadow-sm border border-[#E5E5E2]">
              <span className="material-symbols-outlined text-[40px] text-[#6E6E6A] mb-2">
                search_off
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase text-[#1a1c1c]">
                No encontramos modelos con ese criterio
              </h3>
              <p className="text-sm text-[#6E6E6A] mt-1 max-w-md mx-auto">
                Intenta con otro término como "botín", "mocasín", "derby" o borra el filtro de búsqueda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSize(null);
                }}
                className="mt-4 px-4 py-2 bg-[#000000] text-[#ffffff] font-mono text-xs uppercase hover:bg-[#333333] transition-colors cursor-pointer"
              >
                Restablecer Búsqueda
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-6 transition-all duration-300 ${
                viewLayout === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={`group bg-[#FFFFFF] flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#E5E5E2] cursor-pointer hover:shadow-md transition-shadow ${
                    viewLayout === 'list' ? 'md:flex-row' : ''
                  }`}
                >
                  {/* Image Container */}
                  <div
                    className={`relative bg-[#eeeeed] overflow-hidden ${
                      viewLayout === 'list'
                        ? 'md:w-1/3 aspect-[4/5] md:aspect-auto'
                        : 'w-full aspect-[4/5]'
                    }`}
                  >
                    <SmartProductImage
                      alt={product.name}
                      src={product.heroImage}
                      productName={product.name}
                      fallbackCategory={product.category}
                      showVerifiedBadge={true}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 font-mono text-xs uppercase tracking-wider font-semibold ${
                            product.badgeType === 'secondary'
                              ? 'bg-[#a23e18] text-white'
                              : product.badgeType === 'primary'
                              ? 'bg-[#000000] text-white'
                              : 'bg-[#e8e8e7] text-[#1a1c1c]'
                          }`}
                        >
                          {product.badge}
                        </span>
                      </div>
                    )}

                    {/* Bookmark Toggle */}
                    <button
                      aria-label="Favorito"
                      onClick={(e) => toggleBookmark(e, product.id)}
                      className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-sm flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                        bookmarkedIds.has(product.id)
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#FFFFFF]/90 text-[#1a1c1c] hover:bg-[#000000] hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {bookmarkedIds.has(product.id) ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                  </div>

                  {/* Metadata Section */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4 bg-[#FFFFFF]">
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between font-mono text-xs">
                        <span className="text-[#6E6E6A]">SKU: {product.sku}</span>
                        <span className="text-[#1a1c1c] font-semibold text-base font-['Plus_Jakarta_Sans']">
                          ${product.price.toLocaleString()} MXN
                        </span>
                      </div>

                      <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase text-[#1a1c1c] group-hover:text-[#a23e18] transition-colors">
                        {product.name}
                      </h2>

                      <p className="text-xs text-[#444748] line-clamp-2 leading-relaxed">
                        {product.subtitle || product.description}
                      </p>
                    </div>

                    {/* Size Selector & Colors */}
                    <div className="space-y-3 pt-2 border-t border-[#eeeeed]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#6E6E6A] uppercase">Tallas disponibles:</span>
                        <span className="text-[#1a1c1c] font-medium">
                          {product.availableSizes.slice(0, 5).join(' · ')} MX
                        </span>
                      </div>

                      {/* Color Swatches */}
                      <div className="flex items-center gap-2">
                        {product.finishes.map((f) => (
                          <span
                            key={f.id}
                            className="w-3.5 h-3.5 rounded-full border border-[#D4D4D0] inline-block shadow-xs"
                            style={{ backgroundColor: f.colorHex }}
                            title={f.name}
                          ></span>
                        ))}
                        <span className="font-mono text-xs text-[#6E6E6A] ml-1">
                          {product.finishes.length}{' '}
                          {product.finishes.length === 1 ? 'Color' : 'Colores'}
                        </span>
                      </div>

                      {/* WhatsApp Primary Action Button */}
                      <a
                        href={generateWhatsAppUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#000000] text-[#ffffff] hover:bg-[#0e1f10] hover:text-[#25D366] transition-all font-mono text-xs uppercase tracking-wider font-semibold shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#25D366]">
                          chat
                        </span>
                        <span>Consultar disponibilidad en WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Concierge Editorial Assistance Banner (Tallas Guide) */}
      <section className="w-full px-4 lg:px-10 pb-12" id="tallas-guide">
        <div className="max-w-7xl mx-auto bg-[#FFFFFF] p-6 lg:p-10 shadow-sm border border-[#E5E5E2]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#25D366] uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                <span>COMPRA ASISTIDA Y PERSONALIZADA</span>
              </div>

              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] uppercase max-w-2xl leading-tight">
                Te asesoramos con la talla exacta en menos de 10 minutos por WhatsApp
              </h3>

              <p className="text-sm text-[#444748] max-w-xl leading-relaxed">
                En calzado artesanal cada horma posee un volumen único. Si tienes dudas sobre tu empeine o longitud en centímetros, envíanos una foto de tu pie sobre una hoja blanca o tu talla habitual en tenis y nuestro maestro cortador te indicará la talla perfecta antes de confeccionar o despachar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs text-[#6E6E6A]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a1c1c] text-[18px]">
                    cached
                  </span>
                  <span>1er Cambio de Talla sin costo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a1c1c] text-[18px]">
                    local_shipping
                  </span>
                  <span>Despacho express desde León</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a1c1c] text-[18px]">
                    verified
                  </span>
                  <span>Piel 100% mexicana</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center items-start lg:items-end gap-3 pt-4 lg:pt-0">
              <a
                href={`https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Hola SIERRA, me gustaría recibir asesoría personalizada para conocer mi talla exacta.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#000000] text-[#ffffff] hover:bg-[#0e1f10] hover:text-[#25D366] transition-all font-mono text-xs uppercase tracking-wider font-semibold shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-[#25D366]">chat</span>
                <span>Hablar con un Asesor de Horma</span>
              </a>
              <span className="font-mono text-xs text-[#6E6E6A]">
                Lunes a Sábado · 9:00 a 19:00 hrs (GMT-6)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Craft Manifesto Strip & Quality Assurance */}
      <section
        id="manifiesto"
        className="w-full bg-[#e8e8e7] px-4 lg:px-10 py-6 border-t border-[#E5E5E2]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs text-[#444748]">
          <div>
            <span className="text-[#1a1c1c] uppercase block mb-1 font-bold">TALLER PROPIO</span>
            <p className="text-[#6E6E6A]">
              Confección en pequeños lotes en San Diego de los Sauces, León, Guanajuato.
            </p>
          </div>
          <div>
            <span className="text-[#1a1c1c] uppercase block mb-1 font-bold">CURTIDURÍA VEGETAL</span>
            <p className="text-[#6E6E6A]">
              Ceros y taninos biodegradables sin sales de cromo agresivas.
            </p>
          </div>
          <div>
            <span className="text-[#1a1c1c] uppercase block mb-1 font-bold">
              RESOLABLE DE POR VIDA
            </span>
            <p className="text-[#6E6E6A]">
              Construcción tradicional que permite reponer suelas al paso de los años.
            </p>
          </div>
          <div>
            <span className="text-[#1a1c1c] uppercase block mb-1 font-bold">CATÁLOGO ABIERTO</span>
            <p className="text-[#6E6E6A]">
              Venta y confirmación directa 1 a 1 vía WhatsApp. Sin pasarelas impersonales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';

interface PublicProductViewProps {
  product: Product;
  tenantConfig: TenantConfig;
  onBackToCatalog: () => void;
  onAddToCart?: (product: Product, size: string, finish: string) => void;
  onShowToast: (msg: string) => void;
}

export const PublicProductView: React.FC<PublicProductViewProps> = ({
  product,
  tenantConfig,
  onBackToCatalog,
  onAddToCart,
  onShowToast,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedFinish, setSelectedFinish] = useState(product.finishes[0] || {
    id: 'f1',
    name: 'Negro Ónix',
    colorHex: '#161616',
    subtext: 'Piel Flor 1.8mm',
  });
  const [selectedSize, setSelectedSize] = useState<string>(
    product.availableSizes.includes('26.5') ? '26.5' : product.availableSizes[0] || '27'
  );
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    acc1: false,
    acc2: false,
    acc3: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const images = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [
        {
          id: 'main',
          label: 'PIEZA MAESTRA',
          url: product.heroImage,
          alt: product.name,
        },
      ];

  const currentImgUrl = images[activeImageIndex]?.url || product.heroImage;

  // Real-time generated WhatsApp message
  const waMessage = `Hola equipo SIERRA 👋 Me gustaría consultar la disponibilidad del ${product.name} en color ${selectedFinish.name}, talla ${selectedSize} MX (Ref: ${product.sku}). ¿Tienen entrega inmediata a mi CP?`;

  const waLink = `https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    waMessage
  )}`;

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(waMessage);
      onShowToast('Mensaje de WhatsApp copiado al portapapeles');
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Minimal Contextual Breadcrumbs Bar */}
      <div className="w-full bg-[#FFFFFF] shadow-xs border-b border-[#E5E5E2]">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 py-2.5 flex items-center justify-between font-mono text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[#6E6E6A] overflow-x-auto whitespace-nowrap">
            <button
              onClick={onBackToCatalog}
              className="hover:text-[#1a1c1c] transition-colors uppercase cursor-pointer"
            >
              Catálogo
            </button>
            <span className="text-[#D4D4D0]">/</span>
            <button
              onClick={onBackToCatalog}
              className="hover:text-[#1a1c1c] transition-colors uppercase cursor-pointer"
            >
              Calzado Artesanal
            </button>
            <span className="text-[#D4D4D0]">/</span>
            <button
              onClick={onBackToCatalog}
              className="hover:text-[#1a1c1c] transition-colors uppercase cursor-pointer"
            >
              {product.category}
            </button>
            <span className="text-[#D4D4D0]">/</span>
            <span className="text-[#1a1c1c] uppercase font-semibold">{product.name}</span>
          </nav>

          <div className="hidden sm:flex items-center gap-3 text-[#6E6E6A]">
            <span className="uppercase bg-[#eeeeed] px-2 py-0.5 text-[#1a1c1c]">
              REF: {product.sku}
            </span>
            <span>EDICIÓN CONTINUA 2024</span>
          </div>
        </div>
      </div>

      {/* Main Editorial Layout: Asymmetric 2 Columns */}
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Immersive Editorial Gallery (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            {/* Hero Primary Viewport */}
            <div className="relative w-full aspect-[4/5] bg-[#f3f4f3] shadow-sm overflow-hidden group border border-[#E5E5E2]">
              <SmartProductImage
                key={currentImgUrl}
                alt={product.name}
                src={currentImgUrl}
                productName={product.name}
                fallbackCategory={product.category}
                showVerifiedBadge={true}
                className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.02]"
              />

              <div className="absolute top-4 left-4 bg-[#FFFFFF] shadow-sm px-3 py-1 flex items-center gap-2 font-mono text-xs uppercase text-[#1a1c1c] border border-[#E5E5E2]">
                <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                <span className="font-semibold">{product.category} · [01]</span>
              </div>

              <div className="absolute bottom-4 right-4 bg-[#000000] text-[#ffffff] font-mono text-xs px-3 py-1 tracking-widest uppercase">
                {product.madeIn || tenantConfig.showroomCity || 'TALLER OFICIAL'}
              </div>
            </div>

            {/* Secondary Detail Mosaic Grid */}
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square bg-[#f3f4f3] shadow-sm overflow-hidden group cursor-pointer border transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#000000] ring-1 ring-black'
                      : 'border-[#E5E5E2] hover:opacity-90'
                  }`}
                >
                  <SmartProductImage
                    alt={img.alt || img.label}
                    src={img.url}
                    productName={product.name}
                    fallbackCategory={product.category}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <span className="absolute bottom-2 left-2 bg-[#FFFFFF]/95 font-mono text-[10px] px-1.5 py-0.5 text-[#1a1c1c] font-semibold border border-[#E5E5E2]">
                    {img.label || `0${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Workshop Dispatch Note Cell */}
            <div className="bg-[#FFFFFF] shadow-sm p-4 flex items-center justify-between border border-[#E5E5E2]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#a23e18] text-[24px]">
                  verified
                </span>
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c]">
                    Confección por Encargo y Lotes Limitados
                  </p>
                  <p className="text-xs text-[#6E6E6A]">
                    Cada par pasa por 84 procesos manuales antes de recibir el sello de cera de autenticidad SIERRA.
                  </p>
                </div>
              </div>
              <div className="hidden md:block font-mono text-xs text-[#6E6E6A] text-right uppercase">
                CALIDAD
                <br />
                GRADO I
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Decision Engine & WhatsApp Direct Order (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
            {/* Header & Pricing Block */}
            <div className="bg-[#FFFFFF] shadow-sm p-6 space-y-2 border border-[#E5E5E2]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#a23e18] font-bold">
                  COLECCIÓN PERMANENTE · HECHO EN MÉXICO
                </span>
                <span className="font-mono text-xs text-[#6E6E6A]">{product.sku}</span>
              </div>

              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#1a1c1c] uppercase tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1a1c1c]">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-[#6E6E6A] uppercase">MXN</span>
                  {product.comparePrice && (
                    <span className="font-mono text-xs text-[#6E6E6A] line-through ml-1">
                      ${product.comparePrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs bg-[#e8e8e7] px-2.5 py-1 text-[#1a1c1c] font-semibold">
                  IVA INCLUIDO
                </span>
              </div>

              {/* Availability Tag */}
              <div className="pt-2 flex items-center gap-2 text-xs text-[#6E6E6A]">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                <span>Disponible en taller · Envío inmediato en tallas seleccionadas</span>
              </div>
            </div>

            {/* Customizer: Leather Finish & Size Matrix */}
            <div className="bg-[#FFFFFF] shadow-sm p-6 space-y-5 border border-[#E5E5E2]">
              {/* Leather Finish Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                    Acabado de Piel:
                  </span>
                  <span className="font-mono text-xs text-[#a23e18] font-semibold">
                    {selectedFinish.name} ({selectedFinish.subtext})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {product.finishes.map((finish) => {
                    const isSelected = selectedFinish.id === finish.id;
                    return (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() => setSelectedFinish(finish)}
                        className={`p-2.5 text-left transition-all relative border cursor-pointer ${
                          isSelected
                            ? 'bg-[#eeeeed] border-[#000000] shadow-xs'
                            : 'bg-[#f3f4f3] border-[#E5E5E2] hover:bg-[#eeeeed]'
                        }`}
                      >
                        <div
                          className="w-full h-6 mb-2 shadow-inner border border-black/10"
                          style={{ backgroundColor: finish.colorHex }}
                        ></div>
                        <p className="font-mono text-xs font-semibold text-[#1a1c1c] truncate">
                          {finish.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#6E6E6A] truncate">
                          {finish.subtext}
                        </p>
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#000000]"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selector (Mexican Metric Standard) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                    Selecciona Talla (MX):
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenAccordions((prev) => ({ ...prev, acc2: true }))}
                    className="font-mono text-xs text-[#6E6E6A] hover:text-[#1a1c1c] underline transition-colors cursor-pointer"
                  >
                    ¿Dudas de tu calce?
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {['24', '25', '26', '26.5', '27', '27.5', '28', '29'].map((sizeVal) => {
                    const isSelected = selectedSize === sizeVal;
                    const stockItem = product.sizeMatrix.find((s) => s.size === sizeVal);
                    const isLowStock = stockItem?.lowStock || (sizeVal === '26' || sizeVal === '26.5' || sizeVal === '28');

                    return (
                      <button
                        key={sizeVal}
                        type="button"
                        onClick={() => setSelectedSize(sizeVal)}
                        className={`py-2.5 text-center font-mono text-xs font-semibold transition-colors flex items-center justify-center relative border cursor-pointer ${
                          isSelected
                            ? 'bg-[#000000] text-[#ffffff] border-black'
                            : 'bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1c1c] border-[#E5E5E2]'
                        }`}
                      >
                        <span>{sizeVal}</span>
                        {isLowStock && (
                          <span
                            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-[#ffdbcf]' : 'bg-[#a23e18]'
                            }`}
                            title="Stock bajo"
                          ></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Fit Advisor Note */}
                <div className="mt-3 p-2.5 bg-[#f3f4f3] flex items-start gap-2 text-xs text-[#6E6E6A] border border-[#E5E5E2]">
                  <span className="material-symbols-outlined text-[18px] text-[#1a1c1c] shrink-0">
                    straighten
                  </span>
                  <p>
                    Calce exacto al empeine. Si estás entre dos medidas, recomendamos seleccionar la media talla superior.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Direct Conversational Engine Block (Core Candy Catalog Component) */}
            <div className="bg-[#FFFFFF] shadow-md p-6 space-y-4 border border-[#E5E5E2]">
              <div className="flex items-center justify-between pb-1 border-b border-[#eeeeed]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-ping"></span>
                  <span className="font-mono text-xs uppercase text-[#1a1c1c] font-bold tracking-wider">
                    COMPRA DIRECTA SIN INTERMEDIARIOS
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#6E6E6A]">CONCIERGE ACTIVO</span>
              </div>

              {/* Main CTA WhatsApp Button */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#1FAF59] hover:bg-[#18964B] text-[#FFFFFF] py-3.5 px-4 flex items-center justify-center gap-2 font-mono text-xs uppercase font-bold tracking-widest shadow-md transition-all active:scale-[0.99] text-center"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>CONSULTAR Y PEDIR POR WHATSAPP</span>
              </a>

              {/* Real-Time Interactive Live Message Preview */}
              <div className="bg-[#F0FDF4] p-4 space-y-2 border border-[#bbf7d0]">
                <div className="flex items-center justify-between text-[#15803d] font-mono text-[10px] uppercase font-bold">
                  <span>Mensaje generado para tu WhatsApp</span>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                    title="Copiar texto"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>Copiar</span>
                  </button>
                </div>

                <p className="font-mono text-xs text-[#1a1c1c] leading-relaxed italic bg-[#FFFFFF] p-3 shadow-xs border border-[#dcfce7]">
                  «{waMessage}»
                </p>

                <p className="font-mono text-[11px] text-[#6E6E6A]">
                  El maestro artesano responderá con fotos de taller del lote exacto, tiempos de paquetería y opciones de liquidación segura.
                </p>
              </div>

              {/* Micro Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-[#1a1c1c]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#a23e18]">
                    handshake
                  </span>
                  <span>Atención humana</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#a23e18]">
                    sync_alt
                  </span>
                  <span>1er cambio gratis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#a23e18]">
                    verified_user
                  </span>
                  <span>1 año garantía</span>
                </div>
              </div>

              {/* Optional Add to Bag */}
              {onAddToCart && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onAddToCart(product, selectedSize, selectedFinish.name);
                      onShowToast(`Añadido a tu selección: ${product.name} (Talla ${selectedSize})`);
                    }}
                    className="w-full py-2 bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#1a1c1c] font-mono text-xs uppercase font-medium flex items-center justify-center gap-2 border border-[#E5E5E2] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                    <span>Guardar en Bolsa de Interés</span>
                  </button>
                </div>
              )}
            </div>

            {/* Minimalist Editorial Accordions */}
            <div className="bg-[#FFFFFF] shadow-sm border border-[#E5E5E2] divide-y divide-[#eeeeed]">
              {/* Accordion Item 1 */}
              <div className="p-4 bg-[#FFFFFF]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc1')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c]">
                    01 · Materiales & Artesanía
                  </span>
                  <span
                    className={`material-symbols-outlined text-[20px] text-[#6E6E6A] transition-transform duration-200 ${
                      openAccordions.acc1 ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {openAccordions.acc1 && (
                  <div className="pt-3 text-xs text-[#6E6E6A] space-y-2 leading-relaxed">
                    {product.craftDetails && product.craftDetails.length > 0 ? (
                      product.craftDetails.map((item, idx) => (
                        <p key={idx}>• {item}</p>
                      ))
                    ) : (
                      <>
                        <p>• Piel de vacuno flor entera de curtición vegetal certificada LWG, grosor estructural de 1.8mm.</p>
                        <p>• Forro interno 100% piel suave transpirable que evita la retención de humedad y olores.</p>
                        <p>• Plantilla conformada con amortiguación de látex natural y descanso anatómico de arco.</p>
                        <p>• Construcción de vira cosida Goodyear Welted artesanal con entresuela de corcho moldeable a tu pisada.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion Item 2 */}
              <div className="p-4 bg-[#FFFFFF]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc2')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c]">
                    02 · Guía de Medidas y Ajuste
                  </span>
                  <span
                    className={`material-symbols-outlined text-[20px] text-[#6E6E6A] transition-transform duration-200 ${
                      openAccordions.acc2 ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {openAccordions.acc2 && (
                  <div className="pt-3 text-xs text-[#6E6E6A] space-y-2 leading-relaxed">
                    <p>
                      Para conocer tu talla óptima, coloca tu pie descalzo sobre una hoja de papel pegada a la pared y marca la punta de tu dedo más largo. Mide en centímetros la distancia exacta.
                    </p>
                    <div className="bg-[#f3f4f3] p-3 font-mono text-[11px] text-[#1a1c1c] border border-[#E5E5E2] font-semibold">
                      24 cm = 24 MX | 25 cm = 25 MX | 26 cm = 26 MX | 26.5 cm = 26.5 MX | 27 cm = 27 MX | 28 cm = 28 MX
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion Item 3 */}
              <div className="p-4 bg-[#FFFFFF]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc3')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c]">
                    03 · Tiempos de Ensamble y Envío
                  </span>
                  <span
                    className={`material-symbols-outlined text-[20px] text-[#6E6E6A] transition-transform duration-200 ${
                      openAccordions.acc3 ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {openAccordions.acc3 && (
                  <div className="pt-3 text-xs text-[#6E6E6A] space-y-2 leading-relaxed">
                    <p>
                      • <strong>Pares en stock inmediato:</strong> Despacho el mismo día hábil vía DHL Express (24 a 48 hrs en toda la República Mexicana).
                    </p>
                    <p>
                      • <strong>Pares sobre encargo de taller:</strong> Fabricación estimada en 7 a 9 días hábiles con reporte fotográfico vía WhatsApp.
                    </p>
                    <p>
                      • Envíos asegurados y empaque de lona cruda reutilizable de algodón 100% orgánico.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Editorial Brand Anchor Footer Cell */}
      <section className="max-w-7xl mx-auto w-full px-4 lg:px-10 pb-8">
        <div className="bg-[#FFFFFF] shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#E5E5E2]">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-mono text-xs text-[#a23e18] uppercase font-bold">
              Taller Abierto SIERRA
            </span>
            <p className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
              ¿Necesitas una talla especial o personalización de grabado?
            </p>
            <p className="text-xs text-[#6E6E6A]">
              Podemos ajustar ancho de horma (ancho EE) o personalizar la plantilla con iniciales en caliente.
            </p>
          </div>
          <a
            href={`https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hola SIERRA, quisiera consultar sobre un pedido especial o talla a medida del ${product.name} (Ref: ${product.sku}).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-[#eeeeed] hover:bg-[#e8e8e7] text-[#1a1c1c] px-6 py-2.5 font-mono text-xs uppercase font-semibold transition-colors flex items-center gap-2 border border-[#E5E5E2]"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Solicitar Proyecto a Medida</span>
          </a>
        </div>
      </section>
    </div>
  );
};

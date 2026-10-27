import React, { useState, useEffect } from 'react';
import { Product, TenantConfig, ProductFinish } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import {
  buildProductWhatsAppMessage,
  buildProductWhatsAppUrl,
  buildConciergeWhatsAppUrl,
} from '../utils/whatsapp';

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
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish | null>(
    product.finishes?.[0] || null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes[0]
      : null
  );
  const [openAccordions, setOpenAccordions] = useState<{
    [key: string]: boolean;
  }>({
    acc1: true,
    acc2: false,
    acc3: false,
  });

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedFinish(product.finishes?.[0] || null);
    setSelectedSize(
      product.availableSizes && product.availableSizes.length > 0
        ? product.availableSizes[0]
        : null
    );
  }, [product.id]);

  const brandName =
    tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const currency = tenantConfig.currency || 'MXN';
  const isProductSoldOut = product.status === 'soldout';

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const images =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [
          {
            id: 'main',
            label: '01 / PERFIL PRINCIPAL',
            url: product.heroImage,
            alt: product.name,
          },
        ];

  const currentImgUrl = images[activeImageIndex]?.url || product.heroImage;

  const productSizes =
    product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes
      : product.sizeMatrix.map((s) => s.size);

  const selectedSizeStock = product.sizeMatrix.find(
    (s) => s.size === selectedSize || s.size.replace(' CM', '') === selectedSize
  );

  const waMessage = buildProductWhatsAppMessage({
    product,
    tenantConfig,
    selectedFinish: selectedFinish?.name || null,
    selectedSize,
  });

  const waUrl = buildProductWhatsAppUrl({
    product,
    tenantConfig,
    selectedFinish: selectedFinish?.name || null,
    selectedSize,
  });

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    onShowToast(`Enlace de ${product.name} copiado al portapapeles`);
  };

  return (
    <div className="flex flex-col w-full bg-[#F9F9F8] text-[#1A1C1C]">
      {/* Breadcrumbs & Back Navigation Bar */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E5E5E2] bg-[#F9F9F8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#5F5E5E]">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="hover:text-black transition-colors flex items-center gap-1 cursor-pointer font-semibold text-black"
          >
            <span className="material-symbols-outlined text-[14px]">
              arrow_back
            </span>
            <span>Catálogo</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="hover:text-black transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-black font-semibold">{product.name}</span>
        </div>
        <div className="font-mono text-xs text-[#5F5E5E] uppercase tracking-wider">
          SKU: <strong className="text-black">{product.sku}</strong> —{' '}
          {product.madeIn || tenantConfig.showroomCity || 'HECHO EN MÉXICO'}
        </div>
      </div>

      {/* Main 12-Column Editorial Product Container */}
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#E5E5E2]">
          {/* LEFT COLUMN: Editorial Gallery & Craft Details (7 Cols) */}
          <section className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#E5E5E2] bg-white">
            {/* Primary 4:5 Hero Frame */}
            <div className="relative aspect-[4/5] w-full bg-[#F3F3F2] border-b border-[#E5E5E2] overflow-hidden group">
              <SmartProductImage
                key={currentImgUrl}
                alt={product.name}
                src={currentImgUrl}
                productName={product.name}
                fallbackCategory={product.category}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />
              {isProductSoldOut ? (
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5">
                  <span className="font-mono text-xs uppercase tracking-widest font-medium">
                    AGOTADO TEMPORALMENTE
                  </span>
                </div>
              ) : (
                product.badge && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 border border-[#E5E5E2]">
                    <span className="font-mono text-xs uppercase tracking-widest text-black font-medium">
                      {product.badge}
                    </span>
                  </div>
                )
              )}
              <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 font-mono text-xs uppercase tracking-widest">
                {images[activeImageIndex]?.label || '01 / VISTA PRINCIPAL'}
              </div>
            </div>

            {/* Secondary Angle Mosaic (Interactive Selector) */}
            {images.length > 1 && (
              <div className="grid grid-cols-3 divide-x divide-[#E5E5E2] border-b border-[#E5E5E2]">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square bg-[#F3F3F2] relative overflow-hidden group cursor-pointer text-left ${
                      activeImageIndex === idx
                        ? 'ring-2 ring-inset ring-black'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <SmartProductImage
                      alt={img.alt || img.label}
                      src={img.url}
                      productName={product.name}
                      fallbackCategory={product.category}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute bottom-2 left-2 px-1.5 py-0.5 font-mono text-xs uppercase ${
                        activeImageIndex === idx
                          ? 'bg-black text-white font-semibold'
                          : 'bg-white/90 text-[#1A1C1C]'
                      }`}
                    >
                      {img.label || `0${idx + 1} / ÁNGULO`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Editorial Narrative & Craftsmanship Note Cell */}
            <div className="p-6 sm:p-10 bg-[#F9F9F8] space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-semibold">
                  NOTA DE TALLER &amp; CONSTRUCCIÓN
                </span>
                <span className="font-mono text-xs uppercase text-[#5F5E5E]">
                  ORIGEN VERIFICADO
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#1A1C1C] leading-relaxed font-normal whitespace-pre-line">
                {product.description}
              </p>
              {product.craftDetails && product.craftDetails.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {product.craftDetails.slice(0, 3).map((detail, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 border border-[#E5E5E2]"
                    >
                      <span className="font-mono text-xs text-[#5F5E5E] uppercase block mb-1">
                        ESPECIFICACIÓN 0{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-black">
                        {detail}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Sticky Decision & WhatsApp Engine (5 Cols) */}
          <section className="lg:col-span-5 bg-white">
            <div className="lg:sticky lg:top-24 divide-y divide-[#E5E5E2]">
              {/* 1. Product Identity & Pricing Header */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] bg-[#FFDBCE]/40 px-2.5 py-1 font-medium">
                    En Stock · Despacho 24h
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-[#5F5E5E] hover:text-black flex items-center gap-1 font-mono text-xs uppercase cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      share
                    </span>
                    <span>Compartir</span>
                  </button>
                </div>

                <div>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black leading-tight">
                    {product.name}
                  </h1>
                  {product.subtitle && (
                    <p className="text-xs sm:text-sm text-[#5F5E5E] mt-1">
                      {product.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-baseline justify-between border-t border-[#E5E5E2]">
                  <div>
                    <span className="font-mono text-2xl font-bold text-black">
                      {product.price > 0
                        ? `$${product.price.toLocaleString()} ${currency}`
                        : 'Precio por completar'}
                    </span>
                    {product.comparePrice &&
                      product.comparePrice > product.price && (
                        <span className="font-mono text-xs text-[#5F5E5E] line-through ml-2">
                          ${product.comparePrice.toLocaleString()} {currency}
                        </span>
                      )}
                  </div>
                  <span className="font-mono text-xs text-[#5F5E5E] uppercase">
                    IVA INCLUIDO · ENVÍO GRATIS
                  </span>
                </div>
              </div>

              {/* 2. Leather / Finish Selector */}
              {product.finishes && product.finishes.length > 0 && (
                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#5F5E5E]">
                      1. SELECCIONA ACABADO DE PIEL:
                    </span>
                    <span className="font-mono text-xs font-semibold text-black uppercase">
                      {selectedFinish?.name} ({selectedFinish?.subtext || 'PIEL'})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {product.finishes.map((finish) => {
                      const isSelected = selectedFinish?.id === finish.id;
                      return (
                        <button
                          key={finish.id}
                          type="button"
                          onClick={() => setSelectedFinish(finish)}
                          className={`p-2.5 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-black bg-[#F9F9F8]'
                              : 'border border-[#E5E5E2] hover:border-black bg-white'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: finish.colorHex }}
                          />
                          <div className="overflow-hidden">
                            <span className="block font-mono text-xs font-bold text-black uppercase truncate">
                              {finish.name}
                            </span>
                            <span className="block font-mono text-xs text-[#5F5E5E] truncate">
                              {finish.subtext || 'Disponible'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Size Selector Matrix */}
              {productSizes.length > 0 && (
                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#5F5E5E]">
                      2. SELECCIONA TALLA:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAccordions((prev) => ({ ...prev, acc2: true }))
                      }
                      className="font-mono text-xs uppercase underline text-[#A23E18] hover:text-black cursor-pointer"
                    >
                      Tabla de Equivalencias
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {productSizes.map((sizeVal) => {
                      const isSelected = selectedSize === sizeVal;
                      const matrixRow = product.sizeMatrix.find(
                        (s) =>
                          s.size === sizeVal ||
                          s.size.replace(' CM', '') === sizeVal
                      );
                      const isOut = matrixRow?.status === 'out';

                      return (
                        <button
                          key={sizeVal}
                          type="button"
                          onClick={() => setSelectedSize(sizeVal)}
                          className={`py-2.5 px-2 text-center font-mono text-xs transition-colors cursor-pointer relative ${
                            isSelected
                              ? 'border-2 border-black bg-black text-white font-bold'
                              : isOut
                              ? 'border border-[#E5E5E2] bg-[#F3F3F2] text-[#5F5E5E] line-through'
                              : 'border border-[#E5E5E2] hover:border-black text-black font-medium bg-white'
                          }`}
                        >
                          {sizeVal}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stock Status Pill for Selected Size */}
                  <div className="flex items-center justify-between pt-1 text-xs font-mono text-[#5F5E5E]">
                    <span className="flex items-center gap-1.5 text-[#15803D] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                      {selectedSizeStock
                        ? selectedSizeStock.status === 'in_stock'
                          ? `Talla ${selectedSize} lista para envío hoy (${selectedSizeStock.quantity} pzas)`
                          : selectedSizeStock.status === 'on_demand'
                          ? `Talla ${selectedSize} disponible bajo confección (7 días)`
                          : `Talla ${selectedSize} agotada temporalmente — consultar por WhatsApp`
                        : `Talla ${selectedSize || 'Única'} disponible para envío inmediato`}
                    </span>
                    <span>Horma Regular D</span>
                  </div>
                </div>
              )}

              {/* 4. WHATSAPP DIRECT CONVERSION ENGINE */}
              <div className="p-6 sm:p-8 bg-[#F9F9F8] space-y-4">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#1FAF59] hover:bg-[#18944A] text-white py-4 px-6 flex items-center justify-between transition-colors shadow-sm group"
                >
                  <div className="text-left">
                    <span className="block font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold uppercase tracking-wider">
                      Pedir ahora por WhatsApp Direct
                    </span>
                    <span className="block font-mono text-xs text-white/90">
                      Atención inmediata · Apartado de talla sin cargo
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">
                    send
                  </span>
                </a>

                {onAddToCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(
                        product,
                        selectedSize || 'Única',
                        selectedFinish?.name || 'Estándar'
                      );
                      onShowToast(
                        `${product.name} (${selectedSize || 'Única'}) agregado a tu Bolsa`
                      );
                    }}
                    className="w-full bg-white hover:bg-black hover:text-white text-black border border-black py-3 px-4 font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      shopping_bag
                    </span>
                    <span>
                      Guardar en Bolsa de Pedido ({selectedSize || 'Única'})
                    </span>
                  </button>
                )}

                {/* Live Pre-filled WhatsApp Message Preview */}
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#15803D] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                      Mensaje pre-cargado automáticamente:
                    </span>
                    <span className="font-mono text-xs text-[#15803D]">
                      LISTO PARA ENVIAR
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[#166534] leading-relaxed italic">
                    "{waMessage}"
                  </p>
                </div>

                {/* Secondary Direct Inquiry Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={buildConciergeWhatsAppUrl(
                      tenantConfig,
                      `Hola ${brandName}, ¿me pueden enviar un video real en taller del modelo ${product.name} (${selectedFinish?.name || ''})?`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#E5E5E2] bg-white hover:border-black py-2.5 px-3 text-center font-mono text-xs uppercase tracking-wider text-[#1A1C1C] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      videocam
                    </span>
                    <span>Solicitar Video Real</span>
                  </a>
                  <a
                    href={buildConciergeWhatsAppUrl(
                      tenantConfig,
                      `Hola ${brandName}, tengo duda sobre qué talla elegir en el modelo ${product.name}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#E5E5E2] bg-white hover:border-black py-2.5 px-3 text-center font-mono text-xs uppercase tracking-wider text-[#1A1C1C] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      straighten
                    </span>
                    <span>Asesoría de Talla</span>
                  </a>
                </div>
              </div>

              {/* 5. Technical Accordions */}
              <div className="divide-y divide-[#E5E5E2]">
                {/* Accordion 1 */}
                <div className="p-6 sm:px-8 py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('acc1')}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-black">
                      01 / ESPECIFICACIONES &amp; MATERIALES
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#5F5E5E]">
                      {openAccordions.acc1 ? 'remove' : 'add'}
                    </span>
                  </button>
                  {openAccordions.acc1 && (
                    <div className="pt-3 text-xs text-[#5F5E5E] space-y-1.5 font-mono">
                      {product.craftDetails &&
                      product.craftDetails.length > 0 ? (
                        product.craftDetails.map((item, idx) => (
                          <p key={idx}>• {item}</p>
                        ))
                      ) : (
                        <p>{product.description}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Accordion 2 */}
                <div className="p-6 sm:px-8 py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('acc2')}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-black">
                      02 / GUÍA DE TALLA &amp; CALCE
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#5F5E5E]">
                      {openAccordions.acc2 ? 'remove' : 'add'}
                    </span>
                  </button>
                  {openAccordions.acc2 && (
                    <div className="pt-3 text-xs text-[#5F5E5E] space-y-2 leading-relaxed">
                      <p>
                        Horma estándar fiel a la talla. Si estás entre dos medidas o tienes empeine alto, recomendamos elegir media talla arriba.
                      </p>
                      <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-[#F9F9F8] p-2.5 border border-[#E5E5E2]">
                        <div>26 MX = 8 US = 41 EU</div>
                        <div>27 MX = 9 US = 42 EU</div>
                        <div>28 MX = 10 US = 43 EU</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3 */}
                <div className="p-6 sm:px-8 py-4">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('acc3')}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-black">
                      03 / ENVÍO ASEGURADO &amp; CAMBIOS DE TALLA
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#5F5E5E]">
                      {openAccordions.acc3 ? 'remove' : 'add'}
                    </span>
                  </button>
                  {openAccordions.acc3 && (
                    <div className="pt-3 text-xs text-[#5F5E5E] space-y-1.5 leading-relaxed">
                      <p>
                        • Envío exprés sin costo a todo México vía DHL / FedEx (1 a 3 días hábiles).
                      </p>
                      <p>
                        • Tu primer cambio de talla es completamente gratuito dentro de los primeros 30 días.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

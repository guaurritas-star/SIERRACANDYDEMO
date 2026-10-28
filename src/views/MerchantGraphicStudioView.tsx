import { authenticatedApiFetch } from '../utils/authenticatedApiFetch';
import React, { useState, useEffect } from 'react';
import {
  Product,
  TenantConfig,
  GraphicDesignMarketingKit,
} from '../types';
import {
  removeProductBackgroundToStudio,
  segmentProductBackgroundWithAi,
} from '../utils/catalogExtractor';
import { renderMarketingPosterToDataUrl } from '../utils/graphicPosterGenerator';
import { SmartProductImage } from '../components/SmartProductImage';

interface MerchantGraphicStudioViewProps {
  products: Product[];
  tenantConfig: TenantConfig;
  onUpdateProduct: (product: Product) => void;
  onUpdateTenantConfig: (config: TenantConfig) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export const MerchantGraphicStudioView: React.FC<MerchantGraphicStudioViewProps> = ({
  products,
  tenantConfig,
  onUpdateProduct,
  onUpdateTenantConfig,
  onShowToast,
  onBackToInventory,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [searchTopic, setSearchTopic] = useState<string>('');
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [kit, setKit] = useState<GraphicDesignMarketingKit | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);

  // Poster Studio State
  const [posterFormat, setPosterFormat] = useState<'post_1_1' | 'story_9_16' | 'editorial_4_5'>('editorial_4_5');
  const [posterBgHex, setPosterBgHex] = useState<string>('#F5F3EA');
  const [posterAccentHex, setPosterAccentHex] = useState<string>('#FD5D5C');
  const [selectedHeadlineIdx, setSelectedHeadlineIdx] = useState<number>(0);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const handleRunStudioResearch = async (targetProd = selectedProduct) => {
    setIsResearching(true);
    try {
      const response = await authenticatedApiFetch('/api/gemini/graphic-design-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: targetProd?.name || tenantConfig.name,
          category: targetProd?.category || tenantConfig.theme?.industry || 'Catálogo',
          description: targetProd?.description || tenantConfig.theme?.tagline || '',
          price: targetProd?.price,
          currency: tenantConfig.currency || 'MXN',
          brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'Mi Marca',
          industry: tenantConfig.theme?.industry || 'Comercio Digital',
          targetAudience: tenantConfig.theme?.targetAudience || 'Compradores por WhatsApp',
          customGoal: searchTopic,
          imageDataUrl:
            targetProd?.heroImage && targetProd.heroImage.startsWith('data:image/')
              ? targetProd.heroImage
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar la IA de Diseño Gráfico y Marketing.');
      }

      const data: GraphicDesignMarketingKit = await response.json();
      setKit(data);

      const accent = data.designResearch?.colorPalette?.[2]?.hex || '#FD5D5C';
      setPosterAccentHex(accent);

      if (targetProd) {
        const rendered = await renderMarketingPosterToDataUrl({
          productName: targetProd.name,
          category: targetProd.category,
          priceText: targetProd.price
            ? `$${Number(targetProd.price).toLocaleString('es-MX')} ${tenantConfig.currency || 'MXN'}`
            : 'Consultar',
          headline: data.marketingKit?.headlines?.[0] || targetProd.name,
          badgeText: data.marketingKit?.promoBadges?.[0] || targetProd.badge || 'Disponible',
          brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'CANDY STUDIO',
          whatsappPhone: tenantConfig.whatsappPhone || '',
          productImageUrl: targetProd.heroImage,
          format: posterFormat,
          bgHex: posterBgHex,
          accentHex: accent,
          textHex: posterBgHex === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A',
        });
        setPosterDataUrl(rendered);
      }

      onShowToast('Investigación de diseño gráfico y kit de marketing listos');
    } catch (err: any) {
      onShowToast(err?.message || 'No se pudo completar la consulta.');
    } finally {
      setIsResearching(false);
    }
  };

  useEffect(() => {
    if (selectedProduct && !kit && !isResearching) {
      handleRunStudioResearch(selectedProduct);
    }
  }, [selectedProductId]);

  const handleRebuildPoster = async (
    nextFmt = posterFormat,
    nextBg = posterBgHex,
    nextAccent = posterAccentHex,
    nextHlIdx = selectedHeadlineIdx,
    overrideHeroUrl?: string
  ) => {
    if (!selectedProduct) return;
    try {
      const rendered = await renderMarketingPosterToDataUrl({
        productName: selectedProduct.name,
        category: selectedProduct.category,
        priceText: selectedProduct.price
          ? `$${Number(selectedProduct.price).toLocaleString('es-MX')} ${tenantConfig.currency || 'MXN'}`
          : 'Consultar',
        headline:
          kit?.marketingKit?.headlines?.[nextHlIdx] || selectedProduct.name,
        badgeText:
          kit?.marketingKit?.promoBadges?.[0] || selectedProduct.badge || 'Disponible',
        brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'CANDY STUDIO',
        whatsappPhone: tenantConfig.whatsappPhone || '',
        productImageUrl: overrideHeroUrl || selectedProduct.heroImage,
        format: nextFmt,
        bgHex: nextBg,
        accentHex: nextAccent,
        textHex: nextBg === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A',
      });
      setPosterDataUrl(rendered);
    } catch {
      // ignore
    }
  };

  const handleQuickProductBgChange = async (
    mode: 'white' | 'transparent' | 'cream',
    useAiVision = false
  ) => {
    if (!selectedProduct) return;
    setIsProcessingBg(true);
    try {
      const targetBg =
        mode === 'transparent'
          ? 'transparent'
          : mode === 'cream'
          ? '#F5F3EA'
          : '#FFFFFF';

      const newHeroUrl = useAiVision
        ? await segmentProductBackgroundWithAi(
            selectedProduct.heroImage,
            targetBg,
            `${selectedProduct.sku}-${mode}-ai`
          )
        : await removeProductBackgroundToStudio(
            selectedProduct.heroImage,
            targetBg,
            `${selectedProduct.sku}-${mode}`
          );

      const updatedProd: Product = {
        ...selectedProduct,
        heroImage: newHeroUrl,
        galleryImages:
          selectedProduct.galleryImages.length > 0
            ? selectedProduct.galleryImages.map((g, i) =>
                i === 0
                  ? {
                      ...g,
                      url: newHeroUrl,
                      originalUrl: g.originalUrl || g.url,
                      backgroundMode: mode,
                    }
                  : g
              )
            : [
                {
                  id: `img-${Date.now()}`,
                  label: 'Portada',
                  url: newHeroUrl,
                  originalUrl: selectedProduct.heroImage,
                  backgroundMode: mode,
                  alt: selectedProduct.name,
                },
              ],
      };

      onUpdateProduct(updatedProd);
      await handleRebuildPoster(
        posterFormat,
        posterBgHex,
        posterAccentHex,
        selectedHeadlineIdx,
        newHeroUrl
      );
      onShowToast(
        mode === 'transparent'
          ? `«${selectedProduct.name}» recortado a fondo transparente PNG`
          : mode === 'white'
          ? `«${selectedProduct.name}» recortado a fondo blanco #FFFFFF`
          : `«${selectedProduct.name}» recortado a fondo crema #F5F3EA`
      );
    } catch {
      onShowToast('No se pudo procesar el fondo de la imagen.');
    } finally {
      setIsProcessingBg(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f3ea] text-[#1a1a1a] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8d4c8] pb-6">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onBackToInventory}
              className="inline-flex items-center gap-1.5 text-xs text-[#5c5a54] hover:text-[#1a1a1a] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Volver a Mis Productos</span>
            </button>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 text-[10px] font-data uppercase bg-[#fd5d5c] text-[#ffffff]">
                candystudio® Creative AI
              </span>
              <span className="text-xs font-data text-[#5c5a54]">
                DISEÑO GRÁFICO · RECORTE DE FONDO · MARKETING KIT
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#1a1a1a]">
              Buscador IA de Diseño Gráfico y Marketing
            </h1>
          </div>

          <button
            type="button"
            disabled={isResearching}
            onClick={() => handleRunStudioResearch(selectedProduct)}
            className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#fd5d5c] text-[#ffffff] text-xs font-semibold tracking-wide transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isResearching
              ? 'Investigando Diseño y Creando Campaña...'
              : 'Investigar y Generar Kit con IA'}
          </button>
        </div>

        {/* Product Selector + Search Prompt Bar */}
        <div className="bg-[#ffffff] border border-[#d8d4c8] p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          <div className="lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-[#1a1a1a]">
              1. Selecciona el producto a impulsar:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                if (prod) handleRunStudioResearch(prod);
              }}
              className="w-full bg-[#f5f3ea] border border-[#d8d4c8] px-3.5 py-2.5 text-xs font-medium text-[#1a1a1a] outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — ${p.price.toLocaleString('es-MX')}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-[#1a1a1a]">
              2. ¿Qué necesitas buscar o crear hoy? (Diseño gráfico, temporada, anuncios...)
            </label>
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunStudioResearch(selectedProduct);
              }}
              placeholder="Ej. Ideas de empaque moderno, colores para verano, anuncios para distribuidores..."
              className="w-full bg-[#ffffff] border border-[#d8d4c8] px-3.5 py-2.5 text-xs text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="button"
              disabled={isResearching}
              onClick={() => handleRunStudioResearch(selectedProduct)}
              className="w-full py-2.5 px-4 bg-[#fd5d5c] hover:bg-[#e04847] text-[#ffffff] text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Buscar con IA
            </button>
          </div>
        </div>

        {/* Selected Product Studio Cutout + Poster Generator Row */}
        {selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product Cutout & Background Removal Tool */}
            <div className="lg:col-span-4 bg-[#ffffff] border border-[#d8d4c8] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#e4e2dc] pb-2.5">
                  <span className="text-[11px] font-data uppercase text-[#5c5a54]">
                    Recorte de Fondo del Producto
                  </span>
                  <button
                    type="button"
                    disabled={isProcessingBg}
                    onClick={() => handleQuickProductBgChange('white', true)}
                    className="text-[11px] font-semibold text-[#fd5d5c] hover:underline cursor-pointer"
                  >
                    Refinar con Gemini Vision
                  </button>
                </div>

                <div
                  className="relative aspect-[4/5] border border-[#e4e2dc] overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, #eceae2 25%, transparent 25%), linear-gradient(-45deg, #eceae2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eceae2 75%), linear-gradient(-45deg, transparent 75%, #eceae2 75%)',
                    backgroundSize: '18px 18px',
                    backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
                  }}
                >
                  <SmartProductImage
                    src={selectedProduct.heroImage}
                    alt={selectedProduct.name}
                    productName={selectedProduct.name}
                    fallbackCategory={selectedProduct.category}
                    className="w-full h-full object-contain p-3"
                  />
                  {isProcessingBg && (
                    <div className="absolute inset-0 bg-[#1a1a1a]/65 flex items-center justify-center text-xs font-data text-[#ffffff]">
                      Aislando producto...
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-medium text-[#1a1a1a] block">
                  Cambiar fondo de la foto del producto:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isProcessingBg}
                    onClick={() => handleQuickProductBgChange('white')}
                    className="py-2 px-2 bg-[#ffffff] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#ffffff] border border-[#1a1a1a] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Blanco #FFF
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingBg}
                    onClick={() => handleQuickProductBgChange('transparent')}
                    className="py-2 px-2 bg-[#ffffff] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#ffffff] border border-[#1a1a1a] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Transparente
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingBg}
                    onClick={() => handleQuickProductBgChange('cream')}
                    className="py-2 px-2 bg-[#f5f3ea] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#ffffff] border border-[#d8d4c8] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Crema #F5F3EA
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Interactive Graphic Poster Generator */}
            <div className="lg:col-span-8 bg-[#ffffff] border border-[#d8d4c8] p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 flex items-center justify-center bg-[#f5f3ea] border border-[#e4e2dc] p-4">
                {posterDataUrl ? (
                  <img
                    src={posterDataUrl}
                    alt="Póster promocional generado"
                    className="max-h-[410px] w-auto object-contain border border-[#d8d4c8] shadow-xs"
                  />
                ) : (
                  <span className="text-xs text-[#5c5a54]">
                    Generando pieza gráfica...
                  </span>
                )}
              </div>

              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                    Pieza Publicitaria Lista para Descargar
                  </span>
                  <h2 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                    Generador de Post, Historia y Ficha Editorial
                  </h2>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1a1a1a] block">
                      Formato:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'editorial_4_5', label: 'Catálogo 4:5' },
                          { id: 'post_1_1', label: 'Instagram Post 1:1' },
                          { id: 'story_9_16', label: 'Story / WhatsApp 9:16' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setPosterFormat(f.id);
                            handleRebuildPoster(
                              f.id,
                              posterBgHex,
                              posterAccentHex,
                              selectedHeadlineIdx
                            );
                          }}
                          className={`px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                            posterFormat === f.id
                              ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                              : 'bg-[#f5f3ea] text-[#1a1a1a] border-[#d8d4c8]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1a1a1a] block">
                      Color de fondo del arte:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { hex: '#F5F3EA', name: 'Crema' },
                        { hex: '#FFFFFF', name: 'Blanco' },
                        { hex: '#FCF4D2', name: 'Mantequilla' },
                        { hex: '#CEE6EF', name: 'Cielo' },
                        { hex: '#EDB2D4', name: 'Rosa' },
                        { hex: '#1A1A1A', name: 'Carbón' },
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            setPosterBgHex(c.hex);
                            handleRebuildPoster(
                              posterFormat,
                              c.hex,
                              posterAccentHex,
                              selectedHeadlineIdx
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border cursor-pointer ${
                            posterBgHex === c.hex
                              ? 'border-[#1a1a1a] font-semibold bg-[#f5f3ea]'
                              : 'border-[#d8d4c8]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {kit && kit.marketingKit.headlines.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1a1a1a] block">
                        Titular del anuncio:
                      </label>
                      <select
                        value={selectedHeadlineIdx}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          setSelectedHeadlineIdx(idx);
                          handleRebuildPoster(
                            posterFormat,
                            posterBgHex,
                            posterAccentHex,
                            idx
                          );
                        }}
                        className="w-full bg-[#f5f3ea] border border-[#d8d4c8] px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                      >
                        {kit.marketingKit.headlines.map((hl, i) => (
                          <option key={i} value={i}>
                            {hl}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {posterDataUrl && (
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-[#e4e2dc]">
                    <a
                      href={posterDataUrl}
                      download={`arte-${selectedProduct.sku.toLowerCase()}-${posterFormat}.png`}
                      className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#fd5d5c] text-[#ffffff] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Descargar Arte en PNG
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Graphic Design Research & Marketing Deliverables */}
        {kit && (
          <div className="space-y-6">
            {/* Design Research + Palette */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#ffffff] border border-[#d8d4c8] p-6 space-y-4">
                <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                  Investigación de Diseño Gráfico Aplicado
                </span>
                <h3 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                  Dirección Visual, Tipografía y Empaque
                </h3>
                <p className="text-xs text-[#1a1a1a] leading-relaxed">
                  {kit.designResearch.visualTrendSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[#f5f3ea] border border-[#d8d4c8] space-y-1">
                    <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                      Fotografía e Iluminación
                    </span>
                    <p className="text-xs text-[#1a1a1a]">
                      {kit.designResearch.artDirection.photographyStyle}
                    </p>
                    <p className="text-[11px] text-[#5c5a54]">
                      {kit.designResearch.artDirection.lightingAndProps}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f3ea] border border-[#d8d4c8] space-y-1">
                    <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                      Composición y Etiquetas
                    </span>
                    <p className="text-xs text-[#1a1a1a]">
                      {kit.designResearch.artDirection.compositionRules}
                    </p>
                    <p className="text-[11px] text-[#5c5a54]">
                      {kit.designResearch.artDirection.packagingAndLabelIdeas}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#ffffff] border border-[#d8d4c8] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                    Sistema de Color Sugerido
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const primaryAccent =
                        kit.designResearch.colorPalette[2]?.hex || '#FD5D5C';
                      onUpdateTenantConfig({
                        ...tenantConfig,
                        accentColor: primaryAccent,
                      });
                      onShowToast(
                        `Color de acento ${primaryAccent} aplicado a tu marca`
                      );
                    }}
                    className="text-xs font-semibold text-[#fd5d5c] hover:underline cursor-pointer"
                  >
                    Aplicar acento a mi marca
                  </button>
                </div>

                <div className="space-y-2.5">
                  {kit.designResearch.colorPalette.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-[#f5f3ea] border border-[#d8d4c8]"
                    >
                      <div
                        className="w-10 h-10 shrink-0 border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1a1a1a]">
                            {c.name}
                          </span>
                          <span className="font-data text-xs text-[#5c5a54]">
                            {c.hex}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5c5a54] truncate">
                          {c.usage} · {c.psychology}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3-Column Marketing Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#ffffff] border border-[#d8d4c8] p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                    Instagram / Facebook
                  </span>
                  <h4 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                    Publicación Lista
                  </h4>
                  <p className="text-xs text-[#1a1a1a] whitespace-pre-line leading-relaxed">
                    {kit.marketingKit.instagramPost.caption}
                  </p>
                  <p className="text-[11px] font-data text-[#5c5a54]">
                    {kit.marketingKit.instagramPost.hashtags.join(' ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${kit.marketingKit.instagramPost.caption}\n\n${kit.marketingKit.instagramPost.hashtags.join(' ')}`
                    );
                    onShowToast('Copy de Instagram copiado');
                  }}
                  className="w-full py-2.5 bg-[#1a1a1a] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  Copiar Post de Instagram
                </button>
              </div>

              <div className="bg-[#ffffff] border border-[#d8d4c8] p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                    Reels & TikTok
                  </span>
                  <h4 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                    Guion de Video (15s)
                  </h4>
                  <div className="space-y-2 text-xs text-[#1a1a1a]">
                    <p>
                      <strong>0–3s (Gancho):</strong>{' '}
                      {kit.marketingKit.reelOrTikTokScript.hook0to3s}
                    </p>
                    <p>
                      <strong>3–12s (Desarrollo):</strong>{' '}
                      {kit.marketingKit.reelOrTikTokScript.body3to12s}
                    </p>
                    <p>
                      <strong>12–15s (Llamado a la acción):</strong>{' '}
                      {kit.marketingKit.reelOrTikTokScript.cta12to15s}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `0-3s: ${kit.marketingKit.reelOrTikTokScript.hook0to3s}\n3-12s: ${kit.marketingKit.reelOrTikTokScript.body3to12s}\n12-15s: ${kit.marketingKit.reelOrTikTokScript.cta12to15s}`
                    );
                    onShowToast('Guion de Reel/TikTok copiado');
                  }}
                  className="w-full py-2.5 bg-[#1a1a1a] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  Copiar Guion de Video
                </button>
              </div>

              <div className="bg-[#ffffff] border border-[#d8d4c8] p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-data uppercase text-[#34c75a]">
                    WhatsApp Business
                  </span>
                  <h4 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                    Campaña de Difusión
                  </h4>
                  <p className="text-xs text-[#1a1a1a] whitespace-pre-line leading-relaxed bg-[#f5f3ea] p-3.5 border border-[#d8d4c8]">
                    {kit.marketingKit.whatsappBroadcast}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(kit.marketingKit.whatsappBroadcast);
                    onShowToast('Campaña de WhatsApp copiada');
                  }}
                  className="w-full py-2.5 bg-[#34c75a] text-[#1a1a1a] text-xs font-semibold cursor-pointer"
                >
                  Copiar Difusión WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Product,
  TenantConfig,
  SizeStock,
  ProductFinish,
  GalleryImage,
  GraphicDesignMarketingKit,
} from '../types';
import { processAndUploadImage, UploadBackgroundOption } from '../utils/imageUpload';
import {
  removeProductBackgroundToStudio,
  segmentProductBackgroundWithAi,
} from '../utils/catalogExtractor';
import { renderMarketingPosterToDataUrl } from '../utils/graphicPosterGenerator';
import { SmartProductImage } from '../components/SmartProductImage';
import { buildProductWhatsAppMessage } from '../utils/whatsapp';

interface MerchantProductFormViewProps {
  initialProduct?: Product | null;
  tenantConfig: TenantConfig;
  existingCategories?: string[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onCancel: () => void;
  onPreviewInCatalog: (product: Product) => void;
  onShowToast: (msg: string) => void;
}

export const MerchantProductFormView: React.FC<MerchantProductFormViewProps> = ({
  initialProduct,
  tenantConfig,
  existingCategories = ['Botas', 'Mocasines', 'Zapatos Derby', 'Sandalias', 'Accesorios'],
  onSaveProduct,
  onDeleteProduct,
  onCancel,
  onPreviewInCatalog,
  onShowToast,
}) => {
  const isEditing = Boolean(initialProduct);

  // Core Fields
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(
    initialProduct?.sku || `SR-${Math.floor(100 + Math.random() * 900)}`
  );
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || existingCategories[0] || 'Botas');
  const [price, setPrice] = useState<string>(
    initialProduct?.price !== undefined ? String(initialProduct.price) : ''
  );
  const [comparePrice, setComparePrice] = useState<string>(
    initialProduct?.comparePrice ? String(initialProduct.comparePrice) : ''
  );
  const [status, setStatus] = useState<Product['status']>(
    initialProduct?.status || 'published'
  );
  const [stockBadge, setStockBadge] = useState<string>(
    initialProduct?.badge || 'Entrega Inmediata'
  );
  const [madeIn, setMadeIn] = useState<string>(
    initialProduct?.madeIn || tenantConfig.showroomCity || 'León, Guanajuato'
  );
  const [waTemplate, setWaTemplate] = useState<string>(
    initialProduct?.waTemplate ||
      'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.'
  );
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || ['Artesanal']);
  const [newTagInput, setNewTagInput] = useState('');

  // Gallery State
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
    initialProduct?.galleryImages && initialProduct.galleryImages.length > 0
      ? initialProduct.galleryImages.map((g) => ({
          ...g,
          originalUrl: g.originalUrl || g.url,
          backgroundMode: g.backgroundMode || 'original',
        }))
      : initialProduct?.heroImage
      ? [
          {
            id: 'img-1',
            label: 'Portada',
            url: initialProduct.heroImage,
            originalUrl: initialProduct.heroImage,
            backgroundMode: 'original',
            alt: initialProduct.name,
          },
        ]
      : []
  );
  const [uploadBgMode, setUploadBgMode] = useState<UploadBackgroundOption>('white');
  const [processingBgIndex, setProcessingBgIndex] = useState<number | 'all' | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // AI Graphic Design & Marketing Studio State
  const [isGeneratingMarketingKit, setIsGeneratingMarketingKit] = useState(false);
  const [marketingKit, setMarketingKit] = useState<GraphicDesignMarketingKit | null>(null);
  const [customMarketingGoal, setCustomMarketingGoal] = useState('');
  const [posterFormat, setPosterFormat] = useState<'post_1_1' | 'story_9_16' | 'editorial_4_5'>('editorial_4_5');
  const [posterBgHex, setPosterBgHex] = useState('#F5F3EA');
  const [posterAccentHex, setPosterAccentHex] = useState('#FD5D5C');
  const [posterHeadlineIdx, setPosterHeadlineIdx] = useState(0);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [isRenderingPoster, setIsRenderingPoster] = useState(false);

  // Finishes State
  const [finishes, setFinishes] = useState<ProductFinish[]>(
    initialProduct?.finishes && initialProduct.finishes.length > 0
      ? initialProduct.finishes
      : [{ id: 'f-1', name: 'Negro Ónix', colorHex: '#1C1A19', subtext: 'Piel Flor' }]
  );
  const [newFinishName, setNewFinishName] = useState('');
  const [newFinishHex, setNewFinishHex] = useState('#5C3A21');
  const [newFinishSubtext, setNewFinishSubtext] = useState('');

  // Sizes State
  const [sizeMatrix, setSizeMatrix] = useState<SizeStock[]>(
    initialProduct?.sizeMatrix && initialProduct.sizeMatrix.length > 0
      ? initialProduct.sizeMatrix
      : [
          { size: '25', sku: `${sku}-25`, status: 'in_stock', quantity: 4 },
          { size: '26', sku: `${sku}-26`, status: 'in_stock', quantity: 5 },
          { size: '27', sku: `${sku}-27`, status: 'in_stock', quantity: 6 },
          { size: '28', sku: `${sku}-28`, status: 'in_stock', quantity: 4 },
        ]
  );
  const [newSizeInput, setNewSizeInput] = useState('');

  // Form Validation & Unsaved Changes Guard
  const [isDirty, setIsDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const markDirty = () => {
    setIsDirty(true);
    setFormError(null);
  };

  // Image File Upload Handler (Automatically applies selected background removal mode)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const uploadedItems: GalleryImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await processAndUploadImage(files[i], uploadBgMode);
        uploadedItems.push({
          id: `img-${Date.now()}-${i}`,
          label: `Fotografía ${galleryImages.length + i + 1}`,
          url: result.url,
          originalUrl: result.originalUrl,
          backgroundMode: result.backgroundMode,
          alt: result.fileName,
        });
      }
      setGalleryImages((prev) => [...prev, ...uploadedItems].slice(0, 10));
      markDirty();
      const modeLabel =
        uploadBgMode === 'white'
          ? 'con fondo blanco #FFFFFF'
          : uploadBgMode === 'transparent'
          ? 'con fondo transparente PNG'
          : uploadBgMode === 'cream'
          ? 'con fondo crema #F5F3EA'
          : 'originales';
      onShowToast(
        `${uploadedItems.length} ${
          uploadedItems.length === 1 ? 'fotografía procesada' : 'fotografías procesadas'
        } ${modeLabel}`
      );
    } catch (err: any) {
      setUploadError(err?.message || 'Error al cargar la fotografía.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Replace Single Image Handler
  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const result = await processAndUploadImage(file, uploadBgMode);
      setGalleryImages((prev) =>
        prev.map((img, idx) =>
          idx === replacingIndex
            ? {
                ...img,
                url: result.url,
                originalUrl: result.originalUrl,
                backgroundMode: result.backgroundMode,
                alt: result.fileName,
              }
            : img
        )
      );
      markDirty();
      onShowToast('Fotografía sustituida y procesada correctamente');
    } catch (err: any) {
      setUploadError(err?.message || 'No se pudo sustituir la imagen.');
    } finally {
      setIsUploadingImage(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Process a single gallery image background (White, Transparent, Cream, Original, or AI Refined)
  const handleApplyBackgroundToImage = async (
    index: number,
    mode: UploadBackgroundOption,
    useAiVisionRefinement = false
  ) => {
    const targetImg = galleryImages[index];
    if (!targetImg) return;

    const sourceUrl = targetImg.originalUrl || targetImg.url;
    if (mode === 'original') {
      setGalleryImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? { ...img, url: sourceUrl, backgroundMode: 'original' }
            : img
        )
      );
      markDirty();
      onShowToast('Fondo original restaurado');
      return;
    }

    setProcessingBgIndex(index);
    try {
      const targetBg =
        mode === 'transparent'
          ? 'transparent'
          : mode === 'cream'
          ? '#F5F3EA'
          : '#FFFFFF';
      const processedUrl = useAiVisionRefinement
        ? await segmentProductBackgroundWithAi(
            sourceUrl,
            targetBg,
            `${sku || 'prod'}-img${index + 1}-${mode}-ai`
          )
        : await removeProductBackgroundToStudio(
            sourceUrl,
            targetBg,
            `${sku || 'prod'}-img${index + 1}-${mode}`
          );

      setGalleryImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                ...img,
                url: processedUrl,
                originalUrl: img.originalUrl || img.url,
                backgroundMode: mode,
              }
            : img
        )
      );
      markDirty();
      onShowToast(
        mode === 'transparent'
          ? 'Fondo removido a PNG transparente'
          : mode === 'white'
          ? 'Fondo transformado a Blanco Estudio (#FFFFFF)'
          : 'Fondo transformado a Crema Editorial (#F5F3EA)'
      );
    } catch {
      onShowToast('No se pudo procesar el fondo de esta imagen.');
    } finally {
      setProcessingBgIndex(null);
    }
  };

  // Process all gallery images in batch
  const handleApplyBackgroundToAll = async (mode: UploadBackgroundOption) => {
    if (galleryImages.length === 0) return;
    setProcessingBgIndex('all');
    try {
      const updated: GalleryImage[] = [];
      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        const sourceUrl = img.originalUrl || img.url;
        if (mode === 'original') {
          updated.push({ ...img, url: sourceUrl, backgroundMode: 'original' });
        } else {
          const targetBg =
            mode === 'transparent'
              ? 'transparent'
              : mode === 'cream'
              ? '#F5F3EA'
              : '#FFFFFF';
          const newUrl = await removeProductBackgroundToStudio(
            sourceUrl,
            targetBg,
            `${sku || 'prod'}-batch-${i + 1}-${mode}`
          );
          updated.push({
            ...img,
            url: newUrl,
            originalUrl: sourceUrl,
            backgroundMode: mode,
          });
        }
      }
      setGalleryImages(updated);
      markDirty();
      onShowToast(
        mode === 'original'
          ? 'Todas las fotografías restauradas a su fondo original'
          : mode === 'transparent'
          ? `${updated.length} fotografías convertidas a fondo transparente PNG`
          : mode === 'white'
          ? `${updated.length} fotografías convertidas a fondo blanco #FFFFFF`
          : `${updated.length} fotografías convertidas a fondo crema #F5F3EA`
      );
    } catch {
      onShowToast('Error al procesar el lote de fotografías.');
    } finally {
      setProcessingBgIndex(null);
    }
  };

  const handleAddImageByUrl = async () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setUploadError('Ingresa una dirección URL válida que comience con https://');
      return;
    }

    let finalUrl = trimmed;
    if (uploadBgMode !== 'original') {
      setIsUploadingImage(true);
      try {
        const targetBg =
          uploadBgMode === 'transparent'
            ? 'transparent'
            : uploadBgMode === 'cream'
            ? '#F5F3EA'
            : '#FFFFFF';
        finalUrl = await removeProductBackgroundToStudio(
          trimmed,
          targetBg,
          `url-${Date.now()}-${uploadBgMode}`
        );
      } catch {
        finalUrl = trimmed;
      } finally {
        setIsUploadingImage(false);
      }
    }

    setGalleryImages((prev) => [
      ...prev,
      {
        id: `img-${Date.now()}`,
        label: `Fotografía ${prev.length + 1}`,
        url: finalUrl,
        originalUrl: trimmed,
        backgroundMode: uploadBgMode,
        alt: name || 'Fotografía de producto',
      },
    ]);
    setImageUrlInput('');
    setUploadError(null);
    markDirty();
    onShowToast('Fotografía agregada y procesada');
  };

  // Generate AI Graphic Design & Marketing Research Kit for this product
  const handleGenerateGraphicMarketingKit = async () => {
    setIsGeneratingMarketingKit(true);
    try {
      const heroUrl = galleryImages[0]?.url || '';
      const response = await fetch('/api/gemini/graphic-design-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name || 'Producto de Colección',
          category: category || 'Catálogo',
          description: description || subtitle || '',
          price: Number(price) || undefined,
          currency: tenantConfig.currency || 'MXN',
          brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'Mi Marca',
          industry: tenantConfig.theme?.industry || category || 'Comercio Digital',
          targetAudience: tenantConfig.theme?.targetAudience || 'Compradores por WhatsApp',
          customGoal: customMarketingGoal,
          imageDataUrl: heroUrl.startsWith('data:image/') ? heroUrl : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar el Estudio de Diseño y Marketing IA');
      }

      const kit: GraphicDesignMarketingKit = await response.json();
      setMarketingKit(kit);

      // Render an immediate poster preview using the product's hero photo & AI headline
      if (galleryImages[0]?.url) {
        const defaultAccent =
          kit.designResearch?.colorPalette?.[2]?.hex || '#FD5D5C';
        setPosterAccentHex(defaultAccent);
        const dataUrl = await renderMarketingPosterToDataUrl({
          productName: name || 'Producto Destacado',
          category: category || 'Colección',
          priceText: price
            ? `$${Number(price).toLocaleString('es-MX')} ${tenantConfig.currency || 'MXN'}`
            : 'Consultar',
          headline:
            kit.marketingKit?.headlines?.[0] || name || 'Pieza Destacada',
          badgeText:
            kit.marketingKit?.promoBadges?.[0] || stockBadge || 'Disponible',
          brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'CANDY STUDIO',
          whatsappPhone: tenantConfig.whatsappPhone || '',
          productImageUrl: galleryImages[0].url,
          format: posterFormat,
          bgHex: posterBgHex,
          accentHex: defaultAccent,
          textHex: posterBgHex === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A',
        });
        setPosterPreviewUrl(dataUrl);
      }

      onShowToast('Investigación de diseño gráfico y kit de marketing generados');
    } catch (err: any) {
      onShowToast(err?.message || 'Error al generar el kit de diseño y marketing.');
    } finally {
      setIsGeneratingMarketingKit(false);
    }
  };

  // Re-render poster preview when format, background, or headline changes
  const handleRefreshPosterPreview = async (
    nextFormat = posterFormat,
    nextBg = posterBgHex,
    nextAccent = posterAccentHex,
    nextHeadlineIdx = posterHeadlineIdx
  ) => {
    setIsRenderingPoster(true);
    try {
      const headlineText =
        marketingKit?.marketingKit?.headlines?.[nextHeadlineIdx] ||
        name ||
        'Pieza Destacada';
      const badgeText =
        marketingKit?.marketingKit?.promoBadges?.[0] ||
        stockBadge ||
        'Disponible';
      const dataUrl = await renderMarketingPosterToDataUrl({
        productName: name || 'Producto Destacado',
        category: category || 'Colección',
        priceText: price
          ? `$${Number(price).toLocaleString('es-MX')} ${tenantConfig.currency || 'MXN'}`
          : 'Consultar',
        headline: headlineText,
        badgeText,
        brandName: tenantConfig.theme?.brandName || tenantConfig.name || 'CANDY STUDIO',
        whatsappPhone: tenantConfig.whatsappPhone || '',
        productImageUrl: galleryImages[0]?.url || '',
        format: nextFormat,
        bgHex: nextBg,
        accentHex: nextAccent,
        textHex: nextBg === '#1A1A1A' ? '#FFFFFF' : '#1A1A1A',
      });
      setPosterPreviewUrl(dataUrl);
    } catch {
      onShowToast('No se pudo renderizar la vista previa del póster.');
    } finally {
      setIsRenderingPoster(false);
    }
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    markDirty();
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setGalleryImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    markDirty();
    onShowToast('Fotografía definida como portada principal');
  };

  const handleRemoveImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  // Finishes Management
  const handleAddFinish = () => {
    if (!newFinishName.trim()) return;
    const item: ProductFinish = {
      id: `f-${Date.now()}`,
      name: newFinishName.trim(),
      colorHex: newFinishHex,
      subtext: newFinishSubtext.trim() || 'Acabado de taller',
    };
    setFinishes((prev) => [...prev, item]);
    setNewFinishName('');
    setNewFinishSubtext('');
    markDirty();
  };

  const handleRemoveFinish = (id: string) => {
    if (finishes.length <= 1) {
      onShowToast('El producto debe conservar al menos un acabado o color');
      return;
    }
    setFinishes((prev) => prev.filter((f) => f.id !== id));
    markDirty();
  };

  // Sizes Management
  const handleAddSize = () => {
    const clean = newSizeInput.trim().toUpperCase();
    if (!clean) return;
    if (sizeMatrix.some((s) => s.size.toUpperCase() === clean)) {
      onShowToast(`La talla ${clean} ya existe en la matriz`);
      return;
    }
    setSizeMatrix((prev) => [
      ...prev,
      {
        size: clean,
        sku: `${sku}-${clean.replace(/[^A-Z0-9]/g, '')}`,
        status: 'in_stock',
        quantity: 3,
      },
    ]);
    setNewSizeInput('');
    markDirty();
  };

  const handleRemoveSize = (sizeVal: string) => {
    setSizeMatrix((prev) => prev.filter((s) => s.size !== sizeVal));
    markDirty();
  };

  const handleSizeChange = (
    index: number,
    field: 'status' | 'quantity',
    value: string | number
  ) => {
    setSizeMatrix((prev) => {
      const updated = [...prev];
      if (field === 'status') {
        updated[index] = {
          ...updated[index],
          status: value as 'in_stock' | 'on_demand' | 'out',
        };
      } else {
        updated[index] = {
          ...updated[index],
          quantity: Math.max(0, Number(value) || 0),
        };
      }
      return updated;
    });
    markDirty();
  };

  // Validate and Construct Product
  const validateAndBuildProduct = (overrideStatus?: Product['status']): Product | null => {
    if (!name.trim()) {
      setFormError('Ingresa el nombre del producto antes de guardar.');
      return null;
    }
    if (!sku.trim()) {
      setFormError('Ingresa un código SKU o referencia para el producto.');
      return null;
    }
    const numericPrice = Number(price);
    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Ingresa un precio válido mayor a $0.');
      return null;
    }
    if (galleryImages.length === 0) {
      setFormError('Carga al menos una fotografía del producto antes de publicar.');
      return null;
    }

    const numericCompare = comparePrice ? Number(comparePrice.replace(/[^0-9.]/g, '')) : undefined;
    const finalStatus = overrideStatus || status;

    return {
      id: initialProduct?.id || `prod-${Date.now()}`,
      tenantId: tenantConfig.tenantId,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      subtitle: subtitle.trim(),
      description:
        description.trim() ||
        subtitle.trim() ||
        `${name.trim()} — Pieza de ${tenantConfig.theme?.brandName || tenantConfig.name}.`,
      category: category.trim() || 'General',
      catalogCategory: (category.trim() || 'general').toLowerCase(),
      price: numericPrice,
      comparePrice: numericCompare && numericCompare > numericPrice ? numericCompare : undefined,
      status: finalStatus,
      badge: stockBadge.trim(),
      badgeType: finalStatus === 'published' ? 'secondary' : 'neutral',
      madeIn: madeIn.trim(),
      heroImage: galleryImages[0]?.url || '',
      galleryImages,
      craftDetails: description
        .split('\n')
        .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 6),
      finishes,
      availableSizes: sizeMatrix.map((s) => s.size.replace(' CM', '')),
      sizeMatrix,
      consultationsCount: initialProduct?.consultationsCount || 0,
      lastConsultation: initialProduct?.lastConsultation || 'Reciente',
      waTemplate: waTemplate.trim(),
      tags: tags.length > 0 ? tags : [category.trim() || 'Catálogo'],
    };
  };

  const handleSaveWithStatus = (targetStatus: Product['status']) => {
    const built = validateAndBuildProduct(targetStatus);
    if (!built) return;
    onSaveProduct(built);
    onShowToast(
      targetStatus === 'published'
        ? `«${built.name}» publicado en el catálogo`
        : `«${built.name}» guardado como borrador oculto`
    );
  };

  // Sample preview product for live WhatsApp message preview
  const samplePreviewMessage = buildProductWhatsAppMessage({
    product: {
      id: 'preview',
      sku: sku || 'SKU-01',
      name: name || 'Nombre del Producto',
      description: '',
      category,
      price: Number(price) || 0,
      status,
      heroImage: '',
      galleryImages: [],
      finishes,
      availableSizes: sizeMatrix.map((s) => s.size),
      sizeMatrix,
      waTemplate,
      tags,
    },
    tenantConfig,
    selectedFinish: finishes[0]?.name || 'Negro',
    selectedSize: sizeMatrix[0]?.size || '27',
  });

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-[#f7f6f2] pb-28">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
        {/* Top Breadcrumb & Step Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e4e2dc] pb-6">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                if (isDirty) setShowCancelConfirm(true);
                else onCancel();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#73716b] hover:text-[#141413] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Volver a Mis Productos</span>
            </button>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#141413]">
              {isEditing ? `Editar: ${initialProduct?.name}` : 'Nuevo Producto'}
            </h1>
            <p className="text-xs text-[#73716b]">
              Paso 1: Cargar fotografías · Paso 2: Completar datos · Paso 3: Variantes y Publicar
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveWithStatus('hidden')}
              className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#efede8] text-[#141413] text-xs font-medium border border-[#cfccc4] transition-colors cursor-pointer"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              onClick={() => handleSaveWithStatus('published')}
              className="px-5 py-2.5 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium transition-colors cursor-pointer"
            >
              Publicar Ahora
            </button>
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            className="p-4 bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] font-medium flex items-center justify-between"
          >
            <span>{formError}</span>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="underline cursor-pointer ml-4"
            >
              Entendido
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* PASO 1: CARGAR Y REORDENAR FOTOGRAFÍAS */}
        {/* ================================================================= */}
        <section className="bg-[#ffffff] border border-[#e4e2dc] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e4e2dc] pb-4">
            <div>
              <span className="text-xs text-[#8c3a1b] font-semibold">Paso 1 de 3</span>
              <h2 className="font-editorial text-2xl font-semibold text-[#141413]">
                Fotografías del Producto
              </h2>
            </div>
            <span className="font-data text-xs text-[#73716b]">
              {galleryImages.length} {galleryImages.length === 1 ? 'imagen' : 'imágenes'} (Formatos JPG, PNG, WebP · Máx. 5 MB)
            </span>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleReplaceFileSelected}
            className="hidden"
          />

          {/* Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <button
              type="button"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-7 border border-dashed border-[#cfccc4] bg-[#f7f6f2] hover:bg-[#efede8] p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[26px] text-[#141413]">
                upload_file
              </span>
              <span className="text-sm font-medium text-[#141413]">
                {isUploadingImage
                  ? 'Procesando y optimizando fotografías...'
                  : 'Subir fotografías desde tu dispositivo'}
              </span>
              <span className="text-xs text-[#73716b]">
                Haz clic para elegir archivos JPG, PNG o WebP (optimización automática)
              </span>
            </button>

            <div className="md:col-span-5 bg-[#f7f6f2] border border-[#e4e2dc] p-4 flex flex-col justify-between space-y-3">
              <label className="text-xs font-medium text-[#141413]">
                O agregar fotografía mediante enlace URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#ffffff] border border-[#cfccc4] px-3 py-2 text-xs text-[#141413] outline-none focus:border-[#141413]"
                />
                <button
                  type="button"
                  onClick={handleAddImageByUrl}
                  className="px-3 py-2 bg-[#141413] text-[#ffffff] text-xs font-medium cursor-pointer shrink-0"
                >
                  Añadir
                </button>
              </div>
              <p className="text-[11px] text-[#73716b]">
                La primera imagen de la lista será la portada en el catálogo.
              </p>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b]">
              {uploadError}
            </div>
          )}

          {/* Gallery Grid with Reorder, Replace, Cover & Delete */}
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {galleryImages.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`border bg-[#f7f6f2] flex flex-col justify-between ${
                    idx === 0 ? 'border-[#141413] ring-1 ring-[#141413]' : 'border-[#e4e2dc]'
                  }`}
                >
                  <div className="relative aspect-[4/5] bg-[#efede8] overflow-hidden">
                    <SmartProductImage
                      alt={img.alt}
                      src={img.url}
                      productName={name}
                      fallbackCategory={category}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 ? (
                      <span className="absolute top-2 left-2 bg-[#141413] text-[#ffffff] text-[10px] font-medium px-2 py-0.5">
                        Portada Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(idx)}
                        className="absolute top-2 left-2 bg-[#ffffff]/95 hover:bg-[#141413] text-[#141413] hover:text-[#ffffff] text-[10px] font-medium px-2 py-0.5 border border-[#e4e2dc] transition-colors cursor-pointer"
                      >
                        Fijar Portada
                      </button>
                    )}
                  </div>

                  {/* Image Controls: Reorder, Replace, Delete */}
                  <div className="p-2 bg-[#ffffff] border-t border-[#e4e2dc] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, -1)}
                        aria-label="Mover imagen a la izquierda"
                        className="p-1 text-[#4a4945] hover:text-[#141413] disabled:opacity-30 cursor-pointer"
                        title="Mover antes"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          arrow_back
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === galleryImages.length - 1}
                        onClick={() => handleMoveImage(idx, 1)}
                        aria-label="Mover imagen a la derecha"
                        className="p-1 text-[#4a4945] hover:text-[#141413] disabled:opacity-30 cursor-pointer"
                        title="Mover después"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          arrow_forward
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingIndex(idx);
                          replaceInputRef.current?.click();
                        }}
                        className="text-[11px] text-[#4a4945] hover:text-[#141413] underline cursor-pointer"
                        title="Sustituir fotografía"
                      >
                        Sustituir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-[11px] text-[#991b1b] hover:underline cursor-pointer"
                        title="Eliminar fotografía"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* PASO 2: COMPLETAR DATOS DEL PRODUCTO */}
        {/* ================================================================= */}
        <section className="bg-[#ffffff] border border-[#e4e2dc] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#e4e2dc] pb-4">
            <span className="text-xs text-[#8c3a1b] font-semibold">Paso 2 de 3</span>
            <h2 className="font-editorial text-2xl font-semibold text-[#141413]">
              Información Comercial y Precio
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            <div className="sm:col-span-8">
              <label
                htmlFor="prod_name"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Nombre del Producto *
              </label>
              <input
                id="prod_name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markDirty();
                }}
                placeholder="Ej. Botín Chelsea Nómada"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="prod_sku"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                SKU / Referencia *
              </label>
              <input
                id="prod_sku"
                type="text"
                required
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  markDirty();
                }}
                placeholder="Ej. SR-CHE-01"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 font-data text-sm text-[#141413] uppercase outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="prod_category"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Categoría *
              </label>
              <input
                id="prod_category"
                list="category-options"
                type="text"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                placeholder="Ej. Botas, Mocasines, Sastrería..."
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
              <datalist id="category-options">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="prod_price"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Precio de Venta ({tenantConfig.currency || 'MXN'}) *
              </label>
              <input
                id="prod_price"
                type="number"
                min={1}
                required
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  markDirty();
                }}
                placeholder="3450"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 font-data text-sm font-semibold text-[#141413] outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="prod_compare_price"
                className="block text-xs font-medium text-[#73716b] mb-1.5"
              >
                Precio Anterior (Opcional)
              </label>
              <input
                id="prod_compare_price"
                type="number"
                min={0}
                value={comparePrice}
                onChange={(e) => {
                  setComparePrice(e.target.value);
                  markDirty();
                }}
                placeholder="3900"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 font-data text-sm text-[#4a4945] outline-none"
              />
            </div>

            <div className="sm:col-span-8">
              <label
                htmlFor="prod_subtitle"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Resumen Editorial Breve (Visible en tarjeta de catálogo)
              </label>
              <input
                id="prod_subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  markDirty();
                }}
                placeholder="Ej. Silueta atemporal confeccionada en flor entera de piel vacuno curtida vegetal."
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="prod_badge"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Etiqueta Discreta (Opcional)
              </label>
              <input
                id="prod_badge"
                type="text"
                value={stockBadge}
                onChange={(e) => {
                  setStockBadge(e.target.value);
                  markDirty();
                }}
                placeholder="Ej. Entrega Inmediata"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>

            <div className="sm:col-span-12">
              <label
                htmlFor="prod_desc"
                className="block text-xs font-medium text-[#141413] mb-1.5"
              >
                Descripción y Especificaciones Técnicas
              </label>
              <textarea
                id="prod_desc"
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markDirty();
                }}
                placeholder="Describe los materiales, construcción, horma y recomendaciones de cuidado..."
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] p-3.5 text-sm text-[#141413] leading-relaxed outline-none"
              />
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PASO 3: COLORES, TALLAS, ESTADO Y CONVERSIÓN WHATSAPP */}
        {/* ================================================================= */}
        <section className="bg-[#ffffff] border border-[#e4e2dc] p-6 sm:p-8 space-y-8">
          <div className="border-b border-[#e4e2dc] pb-4">
            <span className="text-xs text-[#8c3a1b] font-semibold">Paso 3 de 3</span>
            <h2 className="font-editorial text-2xl font-semibold text-[#141413]">
              Colores, Tallas y Disponibilidad
            </h2>
          </div>

          {/* Finishes / Colors */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
              Acabados / Colores Disponibles ({finishes.length})
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {finishes.map((f) => (
                <div
                  key={f.id}
                  className="inline-flex items-center gap-2.5 px-3 py-2 bg-[#f7f6f2] border border-[#e4e2dc] text-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/15"
                    style={{ backgroundColor: f.colorHex }}
                  />
                  <div>
                    <span className="font-medium text-[#141413]">{f.name}</span>
                    {f.subtext && (
                      <span className="text-[#73716b] ml-1">({f.subtext})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFinish(f.id)}
                    aria-label={`Eliminar acabado ${f.name}`}
                    className="text-[#73716b] hover:text-[#991b1b] ml-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Add Finish Form */}
            <div className="p-4 bg-[#f7f6f2] border border-[#e4e2dc] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#73716b] mb-1">Color</label>
                <input
                  type="color"
                  value={newFinishHex}
                  onChange={(e) => setNewFinishHex(e.target.value)}
                  className="w-full h-9 bg-[#ffffff] border border-[#cfccc4] cursor-pointer p-1"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-[#73716b] mb-1">
                  Nombre del Color / Acabado
                </label>
                <input
                  type="text"
                  value={newFinishName}
                  onChange={(e) => setNewFinishName(e.target.value)}
                  placeholder="Ej. Cognac Añejo"
                  className="w-full bg-[#ffffff] border border-[#cfccc4] px-3 py-2 text-xs text-[#141413] outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-[#73716b] mb-1">
                  Detalle de Material (Opcional)
                </label>
                <input
                  type="text"
                  value={newFinishSubtext}
                  onChange={(e) => setNewFinishSubtext(e.target.value)}
                  placeholder="Ej. Vaqueta Vegetal"
                  className="w-full bg-[#ffffff] border border-[#cfccc4] px-3 py-2 text-xs text-[#141413] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddFinish}
                  className="w-full py-2 px-3 bg-[#141413] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Sizes / Variants Table */}
          <div className="space-y-4 pt-4 border-t border-[#e4e2dc]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                Matriz de Tallas o Variantes ({sizeMatrix.length})
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize();
                    }
                  }}
                  placeholder="Nueva talla (ej. 26.5, M, 40R)"
                  className="bg-[#f7f6f2] border border-[#cfccc4] px-3 py-1.5 text-xs text-[#141413] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-3 py-1.5 bg-[#141413] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  + Añadir Talla
                </button>
              </div>
            </div>

            {sizeMatrix.length > 0 && (
              <div className="overflow-x-auto border border-[#e4e2dc]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f6f2] text-[#73716b] uppercase border-b border-[#e4e2dc]">
                    <tr>
                      <th className="py-2.5 px-3">Talla / Variante</th>
                      <th className="py-2.5 px-3">Disponibilidad</th>
                      <th className="py-2.5 px-3 text-right">Existencias</th>
                      <th className="py-2.5 px-3 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e2dc]">
                    {sizeMatrix.map((item, idx) => (
                      <tr key={item.size}>
                        <td className="py-2.5 px-3 font-data font-semibold text-[#141413]">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleSizeChange(idx, 'status', e.target.value)
                            }
                            className="bg-[#ffffff] border border-[#cfccc4] px-2.5 py-1 text-xs text-[#141413] cursor-pointer outline-none"
                          >
                            <option value="in_stock">Disponible (Envío Inmediato)</option>
                            <option value="on_demand">Bajo Pedido (7-9 días)</option>
                            <option value="out">Agotado</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              handleSizeChange(idx, 'quantity', e.target.value)
                            }
                            className="w-20 text-right px-2 py-1 border border-[#cfccc4] bg-[#ffffff] font-data text-xs text-[#141413]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(item.size)}
                            className="text-[#991b1b] hover:underline cursor-pointer"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Visibility & WhatsApp Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e4e2dc]">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#141413]">
                Estado de Publicación Inicial
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Product['status']);
                  markDirty();
                }}
                className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3.5 py-2.5 text-xs font-medium text-[#141413] cursor-pointer outline-none"
              >
                <option value="published">Publicado (Visible para compradores)</option>
                <option value="hidden">Borrador Oculto (Solo en consola)</option>
                <option value="soldout">Agotado (Visible con aviso de agotado)</option>
              </select>
            </div>

            <div className="p-4 bg-[#f7f6f2] border border-[#e4e2dc] space-y-1.5">
              <span className="text-[11px] text-[#73716b] block">
                Mensaje dinámico que recibirá tu WhatsApp ({tenantConfig.whatsappPhone}):
              </span>
              <p className="text-xs text-[#141413] italic leading-relaxed">
                «{samplePreviewMessage}»
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PASO 4: ESTUDIO IA DE DISEÑO GRÁFICO Y KIT DE MARKETING */}
        {/* ================================================================= */}
        <section className="bg-[#ffffff] border border-[#e4e2dc] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e2dc] pb-4">
            <div className="space-y-1">
              <span className="text-xs text-[#fd5d5c] font-semibold">
                Paso 4 de 4 · Candy Studio AI Creative Lab
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1a1a1a]">
                Buscador IA de Diseño Gráfico y Entrega de Marketing
              </h2>
              <p className="text-xs text-[#5c5a54]">
                Nuestra IA investiga referencias de diseño gráfico, paletas cromáticas, dirección de arte y te entrega todo el material de marketing (Post, Story, Reels y WhatsApp) listo para publicar.
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingMarketingKit}
              onClick={handleGenerateGraphicMarketingKit}
              className="px-5 py-3 bg-[#fd5d5c] hover:bg-[#e04847] text-[#ffffff] text-xs font-semibold tracking-wide transition-colors cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isGeneratingMarketingKit
                ? 'Investigando Diseño Gráfico y Creando Kit...'
                : marketingKit
                ? 'Actualizar Investigación Gráfica y Marketing'
                : 'Generar Diseño Gráfico y Kit de Marketing con IA'}
            </button>
          </div>

          {/* Optional Custom Goal Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[#f5f3ea] p-4 border border-[#d8d4c8]">
            <div className="sm:col-span-4">
              <label className="text-xs font-semibold text-[#1a1a1a] block">
                Enfoque de la campaña o estilo buscado:
              </label>
              <span className="text-[11px] text-[#5c5a54]">
                Ej. Lanzamiento mayorista, promoción de temporada, estética minimalista...
              </span>
            </div>
            <div className="sm:col-span-8 flex gap-2">
              <input
                type="text"
                value={customMarketingGoal}
                onChange={(e) => setCustomMarketingGoal(e.target.value)}
                placeholder="Ej. Quiero un diseño editorial limpio para vender por mayoreo en Instagram y WhatsApp..."
                className="flex-1 bg-[#ffffff] border border-[#cfccc4] px-3.5 py-2 text-xs text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          {marketingKit && (
            <div className="space-y-8 pt-2">
              {/* 1. Graphic Design Research & Color Palette */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#f5f3ea] border border-[#d8d4c8] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#d8d4c8] pb-3">
                    <h3 className="font-editorial text-xl font-semibold text-[#1a1a1a]">
                      Dirección de Arte e Investigación Gráfica
                    </h3>
                    <span className="text-[10px] font-data uppercase px-2 py-0.5 bg-[#1a1a1a] text-[#ffffff]">
                      Candy Studio Direction
                    </span>
                  </div>

                  <p className="text-xs text-[#1a1a1a] leading-relaxed">
                    {marketingKit.designResearch.visualTrendSummary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-[#ffffff] border border-[#e4e2dc] space-y-1">
                      <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                        Estilo Fotográfico y Luz
                      </span>
                      <p className="text-xs text-[#1a1a1a]">
                        {marketingKit.designResearch.artDirection.photographyStyle}
                      </p>
                      <p className="text-[11px] text-[#5c5a54]">
                        {marketingKit.designResearch.artDirection.lightingAndProps}
                      </p>
                    </div>
                    <div className="p-3 bg-[#ffffff] border border-[#e4e2dc] space-y-1">
                      <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                        Composición y Empaque
                      </span>
                      <p className="text-xs text-[#1a1a1a]">
                        {marketingKit.designResearch.artDirection.compositionRules}
                      </p>
                      <p className="text-[11px] text-[#5c5a54]">
                        {marketingKit.designResearch.artDirection.packagingAndLabelIdeas}
                      </p>
                    </div>
                  </div>

                  {/* Typography System */}
                  <div className="p-3 bg-[#ffffff] border border-[#e4e2dc] space-y-1.5">
                    <span className="text-[10px] font-data uppercase text-[#5c5a54]">
                      Sistema Tipográfico Recomendado
                    </span>
                    <div className="flex flex-wrap gap-4 text-xs text-[#1a1a1a]">
                      <span>
                        <strong>Titulares:</strong>{' '}
                        {marketingKit.designResearch.typographySystem.headlineFont}
                      </span>
                      <span>
                        <strong>Cuerpo:</strong>{' '}
                        {marketingKit.designResearch.typographySystem.bodyFont}
                      </span>
                      <span>
                        <strong>Datos/SKU:</strong>{' '}
                        {marketingKit.designResearch.typographySystem.accentFont}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5c5a54]">
                      {marketingKit.designResearch.typographySystem.pairingRationale}
                    </p>
                  </div>
                </div>

                {/* Color Palette Swatches */}
                <div className="lg:col-span-5 bg-[#ffffff] border border-[#d8d4c8] p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e4e2dc] pb-3">
                      <h3 className="font-editorial text-xl font-semibold text-[#1a1a1a]">
                        Paleta Cromática Sugerida
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const newFinishes: ProductFinish[] =
                            marketingKit.designResearch.colorPalette.map((c, idx) => ({
                              id: `f-ai-${Date.now()}-${idx}`,
                              name: c.name,
                              colorHex: c.hex,
                              subtext: c.usage.slice(0, 32),
                            }));
                          setFinishes((prev) => [...prev, ...newFinishes].slice(0, 8));
                          markDirty();
                          onShowToast('Colores agregados a los acabados del producto');
                        }}
                        className="text-[11px] font-medium text-[#fd5d5c] hover:underline cursor-pointer"
                      >
                        + Aplicar a Acabados
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {marketingKit.designResearch.colorPalette.map((swatch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 bg-[#f5f3ea] border border-[#e4e2dc]"
                        >
                          <div
                            className="w-10 h-10 shrink-0 border border-black/15"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                                {swatch.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(swatch.hex);
                                  onShowToast(`Color ${swatch.hex} copiado`);
                                }}
                                className="font-data text-[11px] text-[#5c5a54] hover:text-[#1a1a1a] cursor-pointer"
                              >
                                {swatch.hex}
                              </button>
                            </div>
                            <p className="text-[11px] text-[#5c5a54] truncate">
                              {swatch.usage} — {swatch.psychology}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grounded Web References if any */}
                  {marketingKit.searchSources && marketingKit.searchSources.length > 0 && (
                    <div className="pt-3 border-t border-[#e4e2dc] space-y-1">
                      <span className="text-[10px] font-data uppercase text-[#5c5a54] block">
                        Referencias web consultadas en tiempo real:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {marketingKit.searchSources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#fd5d5c] underline truncate max-w-[200px]"
                          >
                            {src.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Interactive Promotional Graphic Poster Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#f5f3ea] border border-[#d8d4c8] p-5 sm:p-6">
                <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#ffffff] border border-[#e4e2dc] p-4">
                  {posterPreviewUrl ? (
                    <img
                      src={posterPreviewUrl}
                      alt="Vista previa de pieza gráfica"
                      className="max-h-[420px] w-auto object-contain shadow-sm border border-[#e4e2dc]"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-[#5c5a54] text-center px-6">
                      Sube al menos una fotografía en el Paso 1 para generar pósters publicitarios automáticos.
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                      Generador de Arte Publicitario Listo para Redes
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold text-[#1a1a1a]">
                      Pieza Gráfica del Producto (Con tu foto recortada)
                    </h3>
                    <p className="text-xs text-[#5c5a54]">
                      Combina automáticamente la fotografía de portada (con fondo blanco o transparente) con los titulares persuasivos y la paleta de Candy Studio.
                    </p>

                    {/* Format Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-medium text-[#1a1a1a] block">
                        Formato de diseño:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { id: 'editorial_4_5', label: 'Ficha Editorial (4:5)' },
                            { id: 'post_1_1', label: 'Post Cuadrado (1:1)' },
                            { id: 'story_9_16', label: 'Historia / Estado WhatsApp (9:16)' },
                          ] as const
                        ).map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => {
                              setPosterFormat(fmt.id);
                              handleRefreshPosterPreview(
                                fmt.id,
                                posterBgHex,
                                posterAccentHex,
                                posterHeadlineIdx
                              );
                            }}
                            className={`px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                              posterFormat === fmt.id
                                ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                : 'bg-[#ffffff] text-[#1a1a1a] border-[#cfccc4]'
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background Color Selector for Poster */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1a1a1a] block">
                        Fondo del póster:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { hex: '#F5F3EA', label: 'Crema Candy' },
                          { hex: '#FFFFFF', label: 'Blanco Estudio' },
                          { hex: '#FCF4D2', label: 'Mantequilla' },
                          { hex: '#CEE6EF', label: 'Cielo Editorial' },
                          { hex: '#EDB2D4', label: 'Rosa Candy' },
                          { hex: '#1A1A1A', label: 'Noir Carbón' },
                        ].map((bg) => (
                          <button
                            key={bg.hex}
                            type="button"
                            onClick={() => {
                              setPosterBgHex(bg.hex);
                              handleRefreshPosterPreview(
                                posterFormat,
                                bg.hex,
                                posterAccentHex,
                                posterHeadlineIdx
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border cursor-pointer ${
                              posterBgHex === bg.hex
                                ? 'border-[#1a1a1a] font-semibold bg-[#ffffff]'
                                : 'border-[#d8d4c8] bg-[#ffffff]/70'
                            }`}
                          >
                            <span
                              className="w-3 h-3 border border-black/20"
                              style={{ backgroundColor: bg.hex }}
                            />
                            <span>{bg.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Headline Selector */}
                    {marketingKit.marketingKit.headlines.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#1a1a1a] block">
                          Titular publicitario en el póster:
                        </label>
                        <select
                          value={posterHeadlineIdx}
                          onChange={(e) => {
                            const idx = Number(e.target.value);
                            setPosterHeadlineIdx(idx);
                            handleRefreshPosterPreview(
                              posterFormat,
                              posterBgHex,
                              posterAccentHex,
                              idx
                            );
                          }}
                          className="w-full bg-[#ffffff] border border-[#cfccc4] px-3 py-2 text-xs text-[#1a1a1a] outline-none"
                        >
                          {marketingKit.marketingKit.headlines.map((hl, i) => (
                            <option key={i} value={i}>
                              {hl}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Poster Actions: Download PNG or Add to Product Gallery */}
                  {posterPreviewUrl && (
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#d8d4c8]">
                      <a
                        href={posterPreviewUrl}
                        download={`poster-${(sku || 'producto').toLowerCase()}-${posterFormat}.png`}
                        className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#333333] text-[#ffffff] text-xs font-medium cursor-pointer"
                      >
                        Descargar Póster PNG
                      </a>
                      <button
                        type="button"
                        disabled={isRenderingPoster}
                        onClick={() => {
                          setGalleryImages((prev) => [
                            ...prev,
                            {
                              id: `poster-${Date.now()}`,
                              label: 'Póster Promocional IA',
                              url: posterPreviewUrl,
                              originalUrl: posterPreviewUrl,
                              backgroundMode: 'original',
                              alt: `Póster ${name || 'Producto'}`,
                            },
                          ]);
                          markDirty();
                          onShowToast('Póster añadido a la galería del producto');
                        }}
                        className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#efede8] text-[#1a1a1a] border border-[#1a1a1a] text-xs font-medium cursor-pointer"
                      >
                        + Añadir Póster a la Galería del Producto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Marketing Copywriting Deliverables (Instagram, Reels/TikTok, WhatsApp Broadcast) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Instagram Post Copy */}
                <div className="p-5 bg-[#ffffff] border border-[#d8d4c8] flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                      Instagram & Facebook Post
                    </span>
                    <h4 className="font-editorial text-xl font-semibold text-[#1a1a1a]">
                      Copy y Estructura de Carrusel
                    </h4>
                    <p className="text-xs text-[#1a1a1a] whitespace-pre-line leading-relaxed">
                      {marketingKit.marketingKit.instagramPost.caption}
                    </p>
                    <p className="text-[11px] font-data text-[#5c5a54] pt-1">
                      {marketingKit.marketingKit.instagramPost.hashtags.join(' ')}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#e4e2dc] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `${marketingKit.marketingKit.instagramPost.caption}\n\n${marketingKit.marketingKit.instagramPost.hashtags.join(' ')}`
                        );
                        onShowToast('Copy de Instagram copiado al portapapeles');
                      }}
                      className="text-xs font-semibold text-[#1a1a1a] underline cursor-pointer"
                    >
                      Copiar Post
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(marketingKit.marketingKit.instagramPost.caption);
                        setSubtitle(marketingKit.marketingKit.campaignHook);
                        markDirty();
                        onShowToast('Descripción y resumen actualizados con el copy de IA');
                      }}
                      className="text-xs font-semibold text-[#fd5d5c] hover:underline cursor-pointer"
                    >
                      Usar en Descripción
                    </button>
                  </div>
                </div>

                {/* Reel / TikTok Script */}
                <div className="p-5 bg-[#ffffff] border border-[#d8d4c8] flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-data uppercase text-[#fd5d5c]">
                      Guion de Video Corto (15 seg)
                    </span>
                    <h4 className="font-editorial text-xl font-semibold text-[#1a1a1a]">
                      Reels / TikTok / Shorts
                    </h4>
                    <div className="space-y-2 text-xs text-[#1a1a1a]">
                      <p>
                        <strong>0–3s (Gancho):</strong>{' '}
                        {marketingKit.marketingKit.reelOrTikTokScript.hook0to3s}
                      </p>
                      <p>
                        <strong>3–12s (Demostración):</strong>{' '}
                        {marketingKit.marketingKit.reelOrTikTokScript.body3to12s}
                      </p>
                      <p>
                        <strong>12–15s (Cierre CTA):</strong>{' '}
                        {marketingKit.marketingKit.reelOrTikTokScript.cta12to15s}
                      </p>
                      <p className="text-[11px] text-[#5c5a54]">
                        <strong>Audio sugerido:</strong>{' '}
                        {marketingKit.marketingKit.reelOrTikTokScript.audioVibe}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#e4e2dc]">
                    <button
                      type="button"
                      onClick={() => {
                        const script = `GANCHO (0-3s): ${marketingKit.marketingKit.reelOrTikTokScript.hook0to3s}\nCUERPO (3-12s): ${marketingKit.marketingKit.reelOrTikTokScript.body3to12s}\nCTA (12-15s): ${marketingKit.marketingKit.reelOrTikTokScript.cta12to15s}`;
                        navigator.clipboard?.writeText(script);
                        onShowToast('Guion de Reel/TikTok copiado');
                      }}
                      className="text-xs font-semibold text-[#1a1a1a] underline cursor-pointer"
                    >
                      Copiar Guion Completo
                    </button>
                  </div>
                </div>

                {/* WhatsApp Broadcast Campaign */}
                <div className="p-5 bg-[#ffffff] border border-[#d8d4c8] flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-data uppercase text-[#34c75a]">
                      WhatsApp Business Difusión
                    </span>
                    <h4 className="font-editorial text-xl font-semibold text-[#1a1a1a]">
                      Mensaje de Venta Directa
                    </h4>
                    <p className="text-xs text-[#1a1a1a] whitespace-pre-line leading-relaxed bg-[#f5f3ea] p-3 border border-[#e4e2dc]">
                      {marketingKit.marketingKit.whatsappBroadcast}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {marketingKit.marketingKit.promoBadges.map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setStockBadge(b);
                            markDirty();
                            onShowToast(`Etiqueta «${b}» aplicada al producto`);
                          }}
                          className="px-2 py-0.5 text-[10px] font-data bg-[#fcf4d2] border border-[#d8d4c8] text-[#1a1a1a] hover:border-[#1a1a1a] cursor-pointer"
                          title="Usar como etiqueta del producto"
                        >
                          + {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#e4e2dc]">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          marketingKit.marketingKit.whatsappBroadcast
                        );
                        onShowToast('Mensaje de difusión de WhatsApp copiado');
                      }}
                      className="text-xs font-semibold text-[#1a1a1a] underline cursor-pointer"
                    >
                      Copiar Mensaje WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#ffffff]/95 backdrop-blur-md border-t border-[#e4e2dc] px-4 sm:px-6 lg:px-10 py-3.5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            {isEditing && onDeleteProduct && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-xs font-medium text-[#991b1b] hover:bg-[#fef2f2] transition-colors cursor-pointer"
              >
                Eliminar Producto
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (isDirty) setShowCancelConfirm(true);
                else onCancel();
              }}
              className="px-4 py-2 text-xs text-[#4a4945] hover:text-[#141413] cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => {
                const built = validateAndBuildProduct();
                if (built) onPreviewInCatalog(built);
              }}
              className="px-4 py-2.5 bg-[#f7f6f2] hover:bg-[#efede8] text-[#141413] border border-[#cfccc4] text-xs font-medium cursor-pointer"
            >
              Previsualizar
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('hidden')}
              className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#efede8] text-[#141413] border border-[#cfccc4] text-xs font-medium cursor-pointer"
            >
              Guardar Borrador
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('published')}
              className="px-6 py-2.5 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium cursor-pointer"
            >
              {isEditing ? 'Guardar y Publicar' : 'Publicar Producto'}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showCancelConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#ffffff] max-w-md w-full p-6 border border-[#e4e2dc] shadow-xl space-y-4">
            <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
              ¿Salir sin guardar los cambios?
            </h3>
            <p className="text-sm text-[#4a4945]">
              Tienes modificaciones sin guardar en esta ficha de producto. Puedes guardarlas como borrador antes de salir.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e4e2dc]">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-xs text-[#4a4945] cursor-pointer"
              >
                Seguir Editando
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-[#991b1b] text-[#ffffff] text-xs font-medium cursor-pointer"
              >
                Descartar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && initialProduct && onDeleteProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#ffffff] max-w-md w-full p-6 border border-[#e4e2dc] shadow-xl space-y-4">
            <h3 className="font-editorial text-2xl font-semibold text-[#141413]">
              ¿Eliminar {initialProduct.name}?
            </h3>
            <p className="text-sm text-[#4a4945]">
              Esta acción eliminará el producto del catálogo. ¿Deseas continuar?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e4e2dc]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs text-[#4a4945] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(initialProduct.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-[#991b1b] text-[#ffffff] text-xs font-medium cursor-pointer"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

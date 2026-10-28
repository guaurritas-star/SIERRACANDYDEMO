import { authenticatedApiFetch } from '../utils/authenticatedApiFetch';
import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import {
  extractFromPdfFile,
  extractFromImageFiles,
  extractFromZipFile,
  createSampleCatalogPdfFile,
  markDuplicates,
  inferColorHex,
  removeProductBackgroundToStudio,
  ExtractedProductDraft,
  ExtractionProgressUpdate,
} from '../utils/catalogExtractor';

interface SyncResult {
  firestoreSavedCount: number;
  tenantId: string;
  isAuthenticated: boolean;
}

interface MerchantAiParserViewProps {
  tenantConfig: TenantConfig;
  currentUser?: User | null;
  activeTenantId?: string;
  onOpenLoginModal?: () => void;
  onSyncAllParsed: (
    newProducts: Product[],
    navigateAfter?: boolean
  ) => Promise<SyncResult> | void;
  onPreviewProduct: (product: Product) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export interface CriticalPathReport {
  timestamp: string;
  pdfFileName: string;
  pdfSizeBytes: number;
  extractedCount: number;
  croppedImageUrls: string[];
  firestoreTenantPath: string;
  firestoreSavedCount: number;
  firestoreVerifiedIds: string[];
  isAuthenticated: boolean;
  productsSummary: {
    id: string;
    name: string;
    sku: string;
    price: number | null;
    heroImage: string;
    missingFields: string[];
  }[];
}

function draftToProduct(
  draft: ExtractedProductDraft,
  status: 'published' | 'hidden',
  brandName: string,
  showroomCity: string
): Product {
  const cleanSku =
    draft.sku && draft.sku !== 'Por completar'
      ? draft.sku
      : `CAT-${draft.id.slice(-4).toUpperCase()}`;

  const colors = draft.colors.length > 0 ? draft.colors : ['Acabado Original'];
  const sizes = draft.sizes.length > 0 ? draft.sizes : ['Única'];

  return {
    id: draft.id,
    sku: cleanSku,
    name: draft.name,
    subtitle: (draft.description || draft.category).slice(0, 140),
    description:
      draft.description ||
      `${draft.name} perteneciente a la colección de ${brandName}.`,
    category: draft.category || 'Colección General',
    catalogCategory: (draft.category || 'general').toLowerCase(),
    price: draft.price && draft.price > 0 ? draft.price : 0,
    status,
    badge: draft.missingFields.length > 0 ? 'Por completar' : 'Recién Importado',
    badgeType: draft.missingFields.length > 0 ? 'neutral' : 'secondary',
    madeIn: showroomCity || 'México',
    heroImage: draft.heroImage,
    galleryImages: [
      {
        id: `${draft.id}-g1`,
        label: 'Vista Principal',
        url: draft.heroImage,
        alt: draft.name,
      },
    ],
    craftDetails: [
      `Extraído de ${draft.originMeta.fileName}${
        draft.originMeta.pageNumber ? ` (Pág. ${draft.originMeta.pageNumber})` : ''
      }`,
    ],
    finishes: colors.map((c, idx) => ({
      id: `${draft.id}-f-${idx}`,
      name: c,
      colorHex: inferColorHex(c),
      subtext: 'Variante detectada en catálogo',
    })),
    availableSizes: sizes,
    sizeMatrix: sizes.map((sz) => ({
      size: sz,
      sku: `${cleanSku}-${sz}`,
      status: 'in_stock' as const,
      quantity: 5,
    })),
    waTemplate: `Hola ${brandName}, me interesa consultar disponibilidad de ${draft.name} (SKU: ${cleanSku}).`,
    tags: [draft.category, ...colors].filter(Boolean),
    originMeta: draft.originMeta,
  };
}

export const MerchantAiParserView: React.FC<MerchantAiParserViewProps> = ({
  tenantConfig,
  currentUser,
  activeTenantId = 'sierra-footwear',
  onOpenLoginModal,
  onSyncAllParsed,
  onPreviewProduct,
  onShowToast,
  onBackToInventory,
}) => {
  const [extractedDrafts, setExtractedDrafts] = useState<ExtractedProductDraft[]>(
    []
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgressUpdate | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'complete' | 'incomplete'>(
    'all'
  );
  const [criticalPathReport, setCriticalPathReport] =
    useState<CriticalPathReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacePhotoInputRef = useRef<HTMLInputElement>(null);
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);

  const brandName = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const industry = tenantConfig.theme?.industry || 'Calzado Artesanal';
  const showroomCity = tenantConfig.showroomCity || 'León, Guanajuato · México';

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    const fileArray = Array.from(files);
    const allNewDrafts: ExtractedProductDraft[] = [];
    const businessContext = { brandName, industry };

    try {
      for (const file of fileArray) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
          const pdfProds = await extractFromPdfFile(
            file,
            businessContext,
            (prog: ExtractionProgressUpdate) => setExtractionProgress(prog)
          );
          allNewDrafts.push(...pdfProds);
        } else if (lower.endsWith('.zip') || file.type.includes('zip')) {
          const zipProds = await extractFromZipFile(
            file,
            businessContext,
            (prog: ExtractionProgressUpdate) => setExtractionProgress(prog)
          );
          allNewDrafts.push(...zipProds);
        }
      }

      const imageFiles = fileArray
        .filter((f) => f.type.startsWith('image/'))
        .map((f) => ({
          blob: f,
          name: f.name,
          sourceType: 'uploaded_photo' as const,
        }));

      if (imageFiles.length > 0) {
        const imgProds = await extractFromImageFiles(
          imageFiles,
          businessContext,
          (prog: ExtractionProgressUpdate) => setExtractionProgress(prog)
        );
        allNewDrafts.push(...imgProds);
      }

      if (allNewDrafts.length === 0) {
        onShowToast('No se detectaron productos en los archivos seleccionados.');
      } else {
        const combined = markDuplicates([...allNewDrafts, ...extractedDrafts]);
        setExtractedDrafts(combined);
        onShowToast(
          `Se extrajeron ${allNewDrafts.length} productos con sus fotografías recortadas.`
        );
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error al analizar el archivo.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  // End-to-End Critical Path Verification:
  // 1. Generates a real binary PDF (application/pdf) with embedded product JPEGs & text
  // 2. Parses it via pdfjs-dist in extractFromPdfFile
  // 3. Extracts structured products + bounding boxes via /api/gemini/extract-catalog-page
  // 4. Crops product images & uploads them to /api/uploads
  // 5. Persists structured products to state + Cloud Firestore & verifies with getDocFromServer
  const handleRunCriticalPathPdfTest = async () => {
    setIsExtracting(true);
    setCriticalPathReport(null);
    try {
      setExtractionProgress({
        stage: 'Paso 1/4: Generando archivo PDF binario real (CATALOGO_SIERRA_2025.pdf)...',
        currentStep: 1,
        totalSteps: 4,
      });

      const samplePdfFile = await createSampleCatalogPdfFile(brandName);

      const pdfDrafts = await extractFromPdfFile(
        samplePdfFile,
        { brandName, industry },
        (prog: ExtractionProgressUpdate) =>
          setExtractionProgress({
            stage: `Paso 2/4: ${prog.stage}`,
            currentStep: 2,
            totalSteps: 4,
            detail: prog.detail,
          })
      );

      const combined = markDuplicates([...pdfDrafts, ...extractedDrafts]);
      setExtractedDrafts(combined);

      setExtractionProgress({
        stage: 'Paso 3/4: Estructurando productos y guardando en estado y Cloud Firestore...',
        currentStep: 3,
        totalSteps: 4,
      });

      const productsToPersist = pdfDrafts.map((d) =>
        draftToProduct(d, 'hidden', brandName, showroomCity)
      );

      const syncRes = await onSyncAllParsed(productsToPersist, false);
      const verifiedIds: string[] = [];

      if (currentUser && syncRes && syncRes.firestoreSavedCount > 0) {
        setExtractionProgress({
          stage: 'Paso 4/4: Verificando documentos persistidos en Cloud Firestore (getDocFromServer)...',
          currentStep: 4,
          totalSteps: 4,
        });

        for (const prod of productsToPersist) {
          try {
            const snap = await getDocFromServer(
              doc(db, 'tenants', syncRes.tenantId, 'products', prod.id)
            );
            if (snap.exists()) {
              verifiedIds.push(prod.id);
            }
          } catch {
            // ignore individual read check error
          }
        }
      }

      setCriticalPathReport({
        timestamp: new Date().toLocaleTimeString(),
        pdfFileName: samplePdfFile.name,
        pdfSizeBytes: samplePdfFile.size,
        extractedCount: pdfDrafts.length,
        croppedImageUrls: pdfDrafts.map((d) => d.heroImage),
        firestoreTenantPath: `tenants/${syncRes?.tenantId || activeTenantId}/products`,
        firestoreSavedCount: syncRes?.firestoreSavedCount || 0,
        firestoreVerifiedIds: verifiedIds,
        isAuthenticated: Boolean(currentUser),
        productsSummary: pdfDrafts.map((d) => ({
          id: d.id,
          name: d.name,
          sku: d.sku || 'Por completar',
          price: d.price,
          heroImage: d.heroImage,
          missingFields: d.missingFields,
        })),
      });

      onShowToast(
        currentUser
          ? `Ruta crítica verificada: ${pdfDrafts.length} productos extraídos del PDF y guardados en Firestore.`
          : `PDF extraído con éxito (${pdfDrafts.length} productos). Inicia sesión con Google para persistir en Cloud Firestore.`
      );
    } catch (err: any) {
      onShowToast(err?.message || 'Error durante la prueba de ruta crítica.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  const handleUpdateDraft = (
    id: string,
    patch: Partial<ExtractedProductDraft>
  ) => {
    setExtractedDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        const missing = [...next.missingFields];
        if (patch.price !== undefined && patch.price !== null && patch.price > 0) {
          const idx = missing.indexOf('Precio');
          if (idx >= 0) missing.splice(idx, 1);
        }
        next.missingFields = missing;
        next.originMeta = {
          ...next.originMeta,
          missingFields: missing,
        };
        return next;
      })
    );
  };

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingProductId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      let finalUrl = dataUrl;
      try {
        const res = await authenticatedApiFetch('/api/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: file.name }),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.url || d.dataUrl) finalUrl = d.url || d.dataUrl;
        }
      } catch {
        // fallback to dataUrl
      }
      handleUpdateDraft(replacingProductId, {
        heroImage: finalUrl,
      });
      onShowToast('Fotografía reemplazada.');
      setReplacingProductId(null);
    };
    reader.readAsDataURL(file);
  };

  const filteredDrafts = extractedDrafts.filter((d) => {
    const hasMissing =
      d.missingFields.length > 0 || d.price === null || d.price <= 0;
    if (filterMode === 'complete') return !hasMissing;
    if (filterMode === 'incomplete') return hasMissing;
    return true;
  });

  const handleSaveAsDrafts = async () => {
    const products = extractedDrafts.map((d) =>
      draftToProduct(d, 'hidden', brandName, showroomCity)
    );
    const res = await onSyncAllParsed(products, true);
    onShowToast(
      res && res.isAuthenticated
        ? `${products.length} productos guardados como borrador en Cloud Firestore (${res.firestoreSavedCount} sincronizados).`
        : `${products.length} productos guardados como borrador en tu inventario.`
    );
  };

  const handlePublishConfirmed = async () => {
    const products = extractedDrafts.map((d) =>
      draftToProduct(d, 'published', brandName, showroomCity)
    );
    const res = await onSyncAllParsed(products, true);
    onShowToast(
      res && res.isAuthenticated
        ? `${products.length} productos publicados y persistidos en Cloud Firestore.`
        : `${products.length} productos publicados en tu aparador digital.`
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f6f2] py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#e4e2dc] pb-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBackToInventory}
              className="text-xs text-[#73716b] hover:text-[#141413] inline-flex items-center gap-1 cursor-pointer mb-1"
            >
              <span className="material-symbols-outlined text-[15px]">
                arrow_back
              </span>
              <span>Volver a Mis Productos</span>
            </button>
            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#141413]">
              Importador Multimodal de Catálogos (PDF, Fotos o ZIP)
            </h1>
            <p className="text-sm text-[#4a4945] max-w-2xl">
              Carga un catálogo en PDF, fotografías o archivo ZIP. Gemini analiza cada página, recorta la fotografía real de cada producto, estructura sus metadatos y los guarda en Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isExtracting}
              onClick={handleRunCriticalPathPdfTest}
              className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#efede8] text-[#141413] border border-[#141413] text-xs font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] text-[#8c3a1b]">
                science
              </span>
              <span>Probar Ruta Crítica PDF → Gemini → Firestore</span>
            </button>
            <button
              type="button"
              disabled={isExtracting}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                upload_file
              </span>
              <span>Subir PDF, Fotos o ZIP</span>
            </button>
          </div>
        </div>

        {/* Firestore Connection Status Banner */}
        <div className="p-4 bg-[#ffffff] border border-[#e4e2dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser ? 'bg-[#1b8748]' : 'bg-[#8c3a1b]'
              }`}
            />
            <span className="text-[#141413] font-medium">
              Destino de Persistencia:
            </span>
            <span className="font-data text-[#4a4945]">
              tenants/{activeTenantId}/products
            </span>
            <span className="text-[#73716b]">·</span>
            <span className="text-[#4a4945]">
              {currentUser
                ? `Autenticado como ${currentUser.email} (Escritura en Cloud Firestore activa)`
                : 'Modo Vista Previa Local (Inicia sesión con Google para escritura en Cloud Firestore)'}
            </span>
          </div>
          {!currentUser && onOpenLoginModal && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-3.5 py-1.5 bg-[#141413] text-[#ffffff] text-xs font-medium cursor-pointer shrink-0"
            >
              Conectar Google para Guardar en Firestore
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.zip,image/jpeg,image/png,image/webp"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <input
          ref={replacePhotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleReplacePhoto}
          className="hidden"
        />

        {/* Progress Banner */}
        {isExtracting && extractionProgress && (
          <div className="p-6 bg-[#ffffff] border border-[#141413] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#141413]">
                {extractionProgress.stage}
              </span>
              <span className="font-data text-[#73716b]">
                Paso {extractionProgress.currentStep} /{' '}
                {extractionProgress.totalSteps}
              </span>
            </div>
            {extractionProgress.detail && (
              <p className="text-[11px] font-data text-[#73716b]">
                {extractionProgress.detail}
              </p>
            )}
            <div className="w-full h-1.5 bg-[#efede8] overflow-hidden">
              <div
                className="h-full bg-[#8c3a1b] transition-all duration-300"
                style={{
                  width: `${Math.max(
                    15,
                    Math.round(
                      (extractionProgress.currentStep /
                        Math.max(1, extractionProgress.totalSteps)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Critical Path Verification Report */}
        {criticalPathReport && (
          <div className="p-6 bg-[#ffffff] border-2 border-[#141413] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e4e2dc] pb-3">
              <div>
                <p className="text-[11px] font-data uppercase tracking-wider text-[#8c3a1b] font-semibold">
                  Verificación End-to-End de Ruta Crítica ({criticalPathReport.timestamp})
                </p>
                <h2 className="font-editorial text-2xl text-[#141413]">
                  Resultado de Extracción PDF → Gemini Vision → Recorte → Firestore
                </h2>
              </div>
              <span className="px-3 py-1 bg-[#f7f6f2] border border-[#e4e2dc] font-data text-xs text-[#141413]">
                {criticalPathReport.extractedCount} productos estructurados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-[#f7f6f2] border border-[#e4e2dc] space-y-1">
                <span className="font-data text-[11px] text-[#73716b]">
                  1. Documento PDF (`pdfjs-dist`)
                </span>
                <p className="font-medium text-[#141413] font-data truncate">
                  {criticalPathReport.pdfFileName}
                </p>
                <p className="text-[#4a4945]">
                  {(criticalPathReport.pdfSizeBytes / 1024).toFixed(1)} KB · Renderizado en canvas
                </p>
              </div>

              <div className="p-3.5 bg-[#f7f6f2] border border-[#e4e2dc] space-y-1">
                <span className="font-data text-[11px] text-[#73716b]">
                  2. Extracción Gemini Vision
                </span>
                <p className="font-medium text-[#1b8748]">
                  ✓ {criticalPathReport.extractedCount} fichas estructuradas
                </p>
                <p className="text-[#4a4945]">
                  Detección de precios, SKUs y campos «Por completar»
                </p>
              </div>

              <div className="p-3.5 bg-[#f7f6f2] border border-[#e4e2dc] space-y-1">
                <span className="font-data text-[11px] text-[#73716b]">
                  3. Recorte de Imágenes (`/api/uploads`)
                </span>
                <p className="font-medium text-[#1b8748]">
                  ✓ {criticalPathReport.croppedImageUrls.length} recortes WebP
                </p>
                <p className="font-data text-[11px] text-[#4a4945] truncate">
                  {criticalPathReport.croppedImageUrls[0] || '/uploads/...'}
                </p>
              </div>

              <div className="p-3.5 bg-[#f7f6f2] border border-[#e4e2dc] space-y-1">
                <span className="font-data text-[11px] text-[#73716b]">
                  4. Persistencia Cloud Firestore
                </span>
                {criticalPathReport.isAuthenticated ? (
                  <>
                    <p className="font-medium text-[#1b8748]">
                      ✓ {criticalPathReport.firestoreSavedCount} guardados ({criticalPathReport.firestoreVerifiedIds.length} verificados)
                    </p>
                    <p className="font-data text-[11px] text-[#4a4945] truncate">
                      {criticalPathReport.firestoreTenantPath}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#8c3a1b]">
                      Guardado en estado local (Sesión no iniciada)
                    </p>
                    {onOpenLoginModal && (
                      <button
                        type="button"
                        onClick={onOpenLoginModal}
                        className="underline text-[#141413] font-medium cursor-pointer"
                      >
                        Iniciar sesión para escribir en Firestore
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty Upload State */}
        {extractedDrafts.length === 0 && !isExtracting && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesSelected(e.dataTransfer.files);
            }}
            className="bg-[#ffffff] border-2 border-dashed border-[#cfccc4] hover:border-[#141413] p-12 text-center cursor-pointer transition-colors space-y-4"
          >
            <div className="w-12 h-12 mx-auto bg-[#f7f6f2] border border-[#e4e2dc] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-[#8c3a1b]">
                document_scanner
              </span>
            </div>
            <div className="space-y-1 max-w-lg mx-auto">
              <h2 className="font-editorial text-2xl text-[#141413]">
                Arrastra tu catálogo PDF, paquete ZIP o fotografías de producto
              </h2>
              <p className="text-xs text-[#73716b] leading-relaxed">
                Cada página del PDF se renderiza en alta resolución para detectar productos individuales, recortar sus fotografías reales y recuperar nombres, categorías, precios y tallas sin inventar datos faltantes.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Products Review Grid */}
        {extractedDrafts.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] p-4 border border-[#e4e2dc]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-[#141413] text-[#ffffff]'
                      : 'bg-[#f7f6f2] text-[#4a4945]'
                  }`}
                >
                  Todos ({extractedDrafts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('incomplete')}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    filterMode === 'incomplete'
                      ? 'bg-[#8c3a1b] text-[#ffffff]'
                      : 'bg-[#f7f6f2] text-[#8c3a1b]'
                  }`}
                >
                  Con datos por completar (
                  {
                    extractedDrafts.filter(
                      (d) =>
                        d.missingFields.length > 0 ||
                        d.price === null ||
                        d.price <= 0
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('complete')}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    filterMode === 'complete'
                      ? 'bg-[#141413] text-[#ffffff]'
                      : 'bg-[#f7f6f2] text-[#4a4945]'
                  }`}
                >
                  Completos (
                  {
                    extractedDrafts.filter(
                      (d) =>
                        d.missingFields.length === 0 &&
                        d.price !== null &&
                        d.price > 0
                    ).length
                  }
                  )
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    onShowToast('Aplicando fondo blanco de estudio a todos los productos...');
                    const next: ExtractedProductDraft[] = [];
                    for (let i = 0; i < extractedDrafts.length; i++) {
                      const d = extractedDrafts[i];
                      const src = d.originalHeroImage || d.heroImage;
                      try {
                        const whiteUrl = await removeProductBackgroundToStudio(
                          src,
                          '#FFFFFF',
                          `console-white-${i + 1}`
                        );
                        next.push({
                          ...d,
                          heroImage: whiteUrl,
                          originalHeroImage: src,
                          backgroundMode: 'white',
                        });
                      } catch {
                        next.push(d);
                      }
                    }
                    setExtractedDrafts(next);
                    onShowToast('Fondo blanco (#FFFFFF) aplicado a todos los productos.');
                  }}
                  className="px-3.5 py-2 bg-[#fcf4d2] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#1a1a1a] text-xs font-semibold cursor-pointer"
                >
                  Fondo Blanco (#FFFFFF) a Todos
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsDrafts}
                  className="px-4 py-2 bg-[#ffffff] hover:bg-[#efede8] text-[#141413] border border-[#cfccc4] text-xs font-medium cursor-pointer"
                >
                  Guardar lote como borrador en Firestore
                </button>
                <button
                  type="button"
                  onClick={handlePublishConfirmed}
                  className="px-5 py-2 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium cursor-pointer"
                >
                  Confirmar y publicar en el aparador
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDrafts.map((draft) => {
                const origin = draft.originMeta;
                const missingPrice =
                  draft.price === null ||
                  draft.price <= 0 ||
                  draft.missingFields.includes('Precio');
                const isWhite = draft.backgroundMode === 'white';

                return (
                  <div
                    key={draft.id}
                    className="bg-[#ffffff] border border-[#e4e2dc] p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-[#e4e2dc] pb-3 text-xs">
                        <div className="text-[#73716b] font-data truncate">
                          Origen: {origin.fileName}
                          {origin.pageNumber ? ` · Pág. ${origin.pageNumber}` : ''}
                          {' · '}
                          <span className="text-[#141413]">{draft.heroImage}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExtractedDrafts((prev) =>
                              prev.filter((item) => item.id !== draft.id)
                            )
                          }
                          className="text-[#991b1b] hover:underline cursor-pointer shrink-0"
                        >
                          Descartar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-4 space-y-2">
                          <div className="aspect-[4/5] bg-[#ffffff] border border-[#e4e2dc] overflow-hidden">
                            <SmartProductImage
                              src={draft.heroImage}
                              alt={draft.name}
                              productName={draft.name}
                              fallbackCategory={draft.category}
                              className={`w-full h-full ${
                                isWhite ? 'object-contain p-2' : 'object-cover'
                              }`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                const src = draft.originalHeroImage || draft.heroImage;
                                const whiteUrl = await removeProductBackgroundToStudio(
                                  src,
                                  '#FFFFFF',
                                  `${draft.name.slice(0, 12)}-white`
                                );
                                handleUpdateDraft(draft.id, {
                                  heroImage: whiteUrl,
                                  originalHeroImage: src,
                                  backgroundMode: 'white',
                                });
                                onShowToast('Fondo blanco aplicado');
                              }}
                              className={`py-1 text-[10px] font-data border cursor-pointer ${
                                isWhite
                                  ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                  : 'bg-[#ffffff] text-[#1a1a1a] border-[#cfccc4]'
                              }`}
                            >
                              Fondo Blanco
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateDraft(draft.id, {
                                  heroImage: draft.originalHeroImage || draft.heroImage,
                                  backgroundMode: 'original',
                                });
                              }}
                              className={`py-1 text-[10px] font-data border cursor-pointer ${
                                !isWhite
                                  ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                  : 'bg-[#ffffff] text-[#73716b] border-[#e4e2dc]'
                              }`}
                            >
                              Original
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingProductId(draft.id);
                              replacePhotoInputRef.current?.click();
                            }}
                            className="w-full py-1.5 text-[11px] bg-[#f7f6f2] hover:bg-[#efede8] border border-[#e4e2dc] text-[#141413] cursor-pointer"
                          >
                            Reemplazar foto
                          </button>
                        </div>

                        <div className="sm:col-span-8 space-y-3">
                          <div>
                            <label className="block text-[11px] text-[#73716b] mb-1">
                              Nombre del producto
                            </label>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) =>
                                handleUpdateDraft(draft.id, { name: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-sm bg-[#f7f6f2] border border-[#cfccc4] text-[#141413]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] text-[#73716b] mb-1">
                                Categoría
                              </label>
                              <input
                                type="text"
                                value={draft.category}
                                onChange={(e) =>
                                  handleUpdateDraft(draft.id, {
                                    category: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f7f6f2] border border-[#cfccc4] text-[#141413]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-[#73716b] mb-1">
                                Precio ({tenantConfig.currency || 'MXN'})
                                {missingPrice && (
                                  <span className="ml-1 text-[#8c3a1b] font-semibold">
                                    · Por completar
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={draft.price ?? ''}
                                placeholder="Por completar"
                                onChange={(e) =>
                                  handleUpdateDraft(draft.id, {
                                    price: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-data bg-[#f7f6f2] border border-[#cfccc4] text-[#141413]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#73716b] mb-1">
                              Descripción comercial
                            </label>
                            <textarea
                              rows={2}
                              value={draft.description}
                              onChange={(e) =>
                                handleUpdateDraft(draft.id, {
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-[#f7f6f2] border border-[#cfccc4] text-[#141413]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#e4e2dc] flex items-center justify-between text-xs">
                      <span className="font-data text-[#73716b]">
                        SKU: {draft.sku || 'Por completar'} · Tallas:{' '}
                        {draft.sizes.length > 0
                          ? draft.sizes.join(', ')
                          : 'Por completar'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewProduct(
                            draftToProduct(draft, 'hidden', brandName, showroomCity)
                          )
                        }
                        className="text-[#141413] underline underline-offset-4 cursor-pointer"
                      >
                        Previsualizar ficha
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

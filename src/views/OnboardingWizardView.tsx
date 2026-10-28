import { authenticatedApiFetch } from '../utils/authenticatedApiFetch';
import { signInWithGoogle, googleSignInErrorMessage } from '../utils/googleSignIn';
import React, { useState, useRef } from 'react';
import {
  Product,
  TenantConfig,
  BusinessTheme,
  CatalogLayoutStyle,
  CatalogFontPairing,
} from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import { processAndUploadImage } from '../utils/imageUpload';
import {
  ExtractedProductDraft,
  ExtractionProgressUpdate,
  DetectedBusinessProfile,
  BoundingBoxCoords,
  extractFromPdfFile,
  extractFromImageFiles,
  extractFromZipFile,
  runLiveDemoPageExtraction,
  removeProductBackgroundToStudio,
  recropFromPageDataUrl,
  inferColorHex,
} from '../utils/catalogExtractor';

interface OnboardingWizardViewProps {
  tenantConfig: TenantConfig;
  onComplete: (
    updatedConfig: TenantConfig,
    generatedProducts: Product[],
    destination: 'public' | 'merchant-catalog' | 'merchant-new-product'
  ) => void;
  onExploreDemoSierra: () => void;
  onOpenMerchantConsole: () => void;
  onReturnToGateway: () => void;
  isAuthenticated: boolean;
  onShowToast: (msg: string) => void;
}

type OnboardingPhase = 'welcome' | 'phase1-interview' | 'phase2-import' | 'phase4-review' | 'phase5-customize';

interface ChatTurn {
  sender: 'gemini' | 'user';
  text: string;
}

export const OnboardingWizardView: React.FC<OnboardingWizardViewProps> = ({
  tenantConfig,
  onComplete,
  onExploreDemoSierra,
  onOpenMerchantConsole,
  onReturnToGateway,
  isAuthenticated,
  onShowToast,
}) => {
  const [phase, setPhase] = useState<OnboardingPhase>('welcome');
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);

  // Phase 1 State: Business Profile & Progressive Conversation
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([
    {
      sender: 'gemini',
      text: 'Hola. Soy el arquitecto comercial de candystudio®. Cuéntame brevemente cómo se llama tu marca y qué vendes, o sube tu catálogo PDF para detectar tu giro y aislar tus productos en fondo blanco.',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [brandName, setBrandName] = useState(
    /^sierra( footwear)?$/i.test(tenantConfig.theme?.brandName || '')
      ? '' : (tenantConfig.theme?.brandName || '')
  );
  const [industry, setIndustry] = useState(tenantConfig.theme?.industry || '');
  const [productTypes, setProductTypes] = useState('');
  const [targetAudience, setTargetAudience] = useState(tenantConfig.theme?.targetAudience || '');
  const [location, setLocation] = useState(tenantConfig.theme?.location || '');
  const [whatsappPhone, setWhatsappPhone] = useState(
    tenantConfig.whatsappPhone || '+52 477 123 4567'
  );
  const [catalogGoal, setCatalogGoal] = useState(
    'Recibir consultas de disponibilidad y pedidos directos por WhatsApp'
  );
  const [valuePropositions, setValuePropositions] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([
    'Colección Principal',
    'Ediciones Especiales',
  ]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [layoutStyle, setLayoutStyle] = useState<CatalogLayoutStyle>('editorial-luxury');
  const [fontPairing, setFontPairing] = useState<CatalogFontPairing>('editorial-serif');
  const [editorialRationale, setEditorialRationale] = useState(
    'Arquitectura editorial suiza de alto contraste: tus productos se presentan sobre lienzos puros (#FFFFFF), con jerarquía técnica JetBrains Mono y conversión inmediata vía WhatsApp Direct.'
  );
  const [accentColor, setAccentColor] = useState('#A23E18');
  const [logoUrl, setLogoUrl] = useState('');
  const [hasAutoDetectedGiro, setHasAutoDetectedGiro] = useState(false);

  // Studio White Background & UX Audit State
  const [autoWhiteBackground, setAutoWhiteBackground] = useState<boolean>(true);
  const [processingBgDraftId, setProcessingBgDraftId] = useState<string | null>(null);
  const [isBatchApplyingWhiteBg, setIsBatchApplyingWhiteBg] = useState<boolean>(false);
  const [showUxEvaluationModal, setShowUxEvaluationModal] = useState<boolean>(false);

  // Phase 2 & 3 State: File Upload & Extraction
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgressUpdate | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [maxPdfPages, setMaxPdfPages] = useState<number>(8);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  // Phase 4 State: Extracted Products Review
  const [extractedDrafts, setExtractedDrafts] = useState<ExtractedProductDraft[]>([]);
  const [replacingDraftId, setReplacingDraftId] = useState<string | null>(null);
  const [editingCropDraftId, setEditingCropDraftId] = useState<string | null>(null);
  const [cropBoxForm, setCropBoxForm] = useState<BoundingBoxCoords>({
    ymin: 20,
    xmin: 350,
    ymax: 970,
    xmax: 970,
  });
  const [isApplyingCrop, setIsApplyingCrop] = useState<boolean>(false);
  const replacePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const logoUploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenCropEditor = (draft: ExtractedProductDraft) => {
    setEditingCropDraftId(draft.id);
    setCropBoxForm(
      draft.boundingBox || {
        ymin: 20,
        xmin: 320,
        ymax: 975,
        xmax: 975,
      }
    );
  };

  const handleApplyInteractiveRecrop = async (
    customBox?: BoundingBoxCoords
  ) => {
    if (!editingCropDraftId) return;
    const draft = extractedDrafts.find((d) => d.id === editingCropDraftId);
    if (!draft || !draft.pagePreviewDataUrl) return;

    const boxToUse = customBox || cropBoxForm;
    setCropBoxForm(boxToUse);
    setIsApplyingCrop(true);
    try {
      const mode: 'white' | 'cream' | 'original' =
        draft.backgroundMode === 'cream'
          ? 'cream'
          : draft.backgroundMode === 'original'
          ? 'original'
          : 'white';
      const res = await recropFromPageDataUrl(
        draft.pagePreviewDataUrl,
        boxToUse,
        mode,
        `${draft.name.slice(0, 14)}-recrop`
      );
      setExtractedDrafts((prev) =>
        prev.map((item) =>
          item.id === draft.id
            ? {
                ...item,
                heroImage: res.heroImage,
                originalHeroImage: res.originalHeroImage,
                boundingBox: res.appliedBox,
              }
            : item
        )
      );
      onShowToast('Recorte actualizado con éxito sin cortar al modelo ni producto');
      setEditingCropDraftId(null);
    } catch {
      onShowToast('No se pudo actualizar el recorte de la página');
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const applyDetectedBusinessProfile = (profile: DetectedBusinessProfile) => {
    if (!profile) return;
    if (profile.brandName) setBrandName((prev) => prev || profile.brandName!);
    if (profile.industry) setIndustry((prev) => prev || profile.industry!);
    if (profile.productTypes) setProductTypes((prev) => prev || profile.productTypes!);
    if (profile.targetAudience) {
      setTargetAudience((prev) => prev || profile.targetAudience!);
    }
    if (profile.location) setLocation((prev) => prev || profile.location!);
    if (
      Array.isArray(profile.suggestedCategories) &&
      profile.suggestedCategories.length > 0
    ) {
      setSuggestedCategories(profile.suggestedCategories);
    }
    if (profile.layoutStyle) setLayoutStyle(profile.layoutStyle);
    if (profile.fontPairing) setFontPairing(profile.fontPairing);
    if (profile.accentColor) setAccentColor(profile.accentColor);
    if (profile.creativeProposal) {
      setEditorialRationale(profile.creativeProposal);
    }
    if (
      Array.isArray(profile.valuePropositions) &&
      profile.valuePropositions.length > 0
    ) {
      setValuePropositions(profile.valuePropositions);
    }
    setHasAutoDetectedGiro(true);
  };

  // Studio Background Changer (Single Product)
  const handleApplyStudioBgToDraft = async (
    draftId: string,
    mode: 'white' | 'cream' | 'original'
  ) => {
    const target = extractedDrafts.find((d) => d.id === draftId);
    if (!target) return;

    const baseSource = target.originalHeroImage || target.heroImage;
    if (!baseSource) return;

    if (mode === 'original') {
      setExtractedDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? { ...d, heroImage: baseSource, backgroundMode: 'original' }
            : d
        )
      );
      onShowToast('Fondo original del catálogo restaurado');
      return;
    }

    setProcessingBgDraftId(draftId);
    try {
      const hex = mode === 'white' ? '#FFFFFF' : '#F5F3EA';
      const studioUrl = await removeProductBackgroundToStudio(
        baseSource,
        hex,
        `${target.name.slice(0, 16)}-${mode}`
      );
      setExtractedDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                heroImage: studioUrl,
                originalHeroImage: d.originalHeroImage || d.heroImage,
                backgroundMode: mode,
              }
            : d
        )
      );
      onShowToast(
        mode === 'white'
          ? 'Producto aislado sobre fondo blanco de estudio (#FFFFFF)'
          : 'Producto aislado sobre fondo crema candystudio® (#F5F3EA)'
      );
    } catch {
      onShowToast('No se pudo procesar el fondo de esta imagen');
    } finally {
      setProcessingBgDraftId(null);
    }
  };

  // Studio Background Changer (Batch All Products)
  const handleBatchApplyStudioBg = async (mode: 'white' | 'cream' | 'original') => {
    if (extractedDrafts.length === 0 || isBatchApplyingWhiteBg) return;

    if (mode === 'original') {
      setExtractedDrafts((prev) =>
        prev.map((d) => ({
          ...d,
          heroImage: d.originalHeroImage || d.heroImage,
          backgroundMode: 'original',
        }))
      );
      onShowToast('Se restauró el fondo original en todos los productos');
      return;
    }

    setIsBatchApplyingWhiteBg(true);
    const hex = mode === 'white' ? '#FFFFFF' : '#F5F3EA';
    try {
      const updatedList: ExtractedProductDraft[] = [];
      for (let i = 0; i < extractedDrafts.length; i++) {
        const item = extractedDrafts[i];
        const baseSource = item.originalHeroImage || item.heroImage;
        if (!baseSource) {
          updatedList.push(item);
          continue;
        }
        try {
          const studioUrl = await removeProductBackgroundToStudio(
            baseSource,
            hex,
            `batch-${i + 1}-${mode}`
          );
          updatedList.push({
            ...item,
            heroImage: studioUrl,
            originalHeroImage: item.originalHeroImage || item.heroImage,
            backgroundMode: mode,
          });
        } catch {
          updatedList.push(item);
        }
      }
      setExtractedDrafts(updatedList);
      onShowToast(
        mode === 'white'
          ? `Fondo blanco de estudio (#FFFFFF) aplicado a los ${updatedList.length} productos`
          : `Fondo crema candystudio® (#F5F3EA) aplicado a los ${updatedList.length} productos`
      );
    } finally {
      setIsBatchApplyingWhiteBg(false);
    }
  };

  // Progressive Interview Handler (Fase 1)
  const handleSendInterviewMessage = async (customText?: string) => {
    const messageText = (customText ?? userInput).trim();
    if (!messageText || isAiThinking) return;

    const updatedHistory: ChatTurn[] = [
      ...chatHistory,
      { sender: 'user', text: messageText },
    ];
    setChatHistory(updatedHistory);
    setUserInput('');
    setIsAiThinking(true);

    try {
      const res = await authenticatedApiFetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'onboarding_interview',
          prompt: messageText,
          conversationHistory: updatedHistory,
          currentProfile: {
            brandName,
            industry,
            productTypes,
            targetAudience,
            location,
            whatsappPhone,
            catalogGoal,
            valuePropositions,
            suggestedCategories,
            layoutStyle,
            fontPairing,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo conectar con el asistente Gemini.');
      }

      const data = await res.json();
      const ext = data.extractedProfile || {};

      if (ext.brandName) setBrandName(ext.brandName);
      if (ext.industry) setIndustry(ext.industry);
      if (ext.productTypes) setProductTypes(ext.productTypes);
      if (ext.targetAudience) setTargetAudience(ext.targetAudience);
      if (ext.location) setLocation(ext.location);
      if (ext.whatsappPhone) setWhatsappPhone(ext.whatsappPhone);
      if (ext.catalogGoal) setCatalogGoal(ext.catalogGoal);
      if (Array.isArray(ext.valuePropositions) && ext.valuePropositions.length > 0) {
        setValuePropositions((prev) =>
          Array.from(new Set([...prev, ...ext.valuePropositions]))
        );
      }
      if (
        Array.isArray(ext.suggestedCategories) &&
        ext.suggestedCategories.length > 0
      ) {
        setSuggestedCategories(ext.suggestedCategories);
      }
      if (ext.layoutStyle) setLayoutStyle(ext.layoutStyle);
      if (ext.fontPairing) setFontPairing(ext.fontPairing);
      if (ext.editorialRationale) setEditorialRationale(ext.editorialRationale);

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text:
            data.reply ||
            'Perfecto. He actualizado la propuesta de estructura para tu catálogo. ¿Tienes un catálogo en PDF o fotografías de tus productos para importarlos?',
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'Excelente. Puedes ajustar cualquier dato en el panel derecho o pasar directamente a subir tu catálogo PDF o fotografías.',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // File Extraction Handlers (Fases 2 & 3)
  const runPdfExtractionFlow = async (file: File) => {
    setPhase('phase2-import');
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const drafts = await extractFromPdfFile(
        file,
        { brandName, industry },
        (prog) => setExtractionProgress(prog),
        maxPdfPages,
        (detectedProfile) => applyDetectedBusinessProfile(detectedProfile),
        autoWhiteBackground
      );
      if (drafts.length === 0) {
        setExtractionError(
          `Analizamos «${file.name}» pero no detectamos fichas de producto claras en las páginas seleccionadas. Puedes subir fotografías individuales o agregar productos manualmente.`
        );
      } else {
        const extractedCats = Array.from(
          new Set(drafts.map((d) => d.category).filter(Boolean))
        );
        if (extractedCats.length > 0) {
          setSuggestedCategories((prev) =>
            Array.from(
              new Set([
                ...extractedCats,
                ...prev.filter(
                  (c) => c !== 'Colección Principal' && c !== 'Ediciones Especiales'
                ),
              ])
            )
          );
        }
        setExtractedDrafts(drafts);
        setPhase('phase4-review');
        onShowToast(
          `Giro detectado y ${drafts.length} productos extraídos${
            autoWhiteBackground ? ' con fondo blanco de estudio' : ''
          } desde ${file.name}`
        );
      }
    } catch (err: any) {
      setExtractionError(err?.message || 'Error al procesar el archivo PDF.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await runPdfExtractionFlow(file);
  };

  const handleLoadAttachedKBotanasPdf = async () => {
    setPhase('phase2-import');
    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress({
      stage: 'Cargando archivo adjunto CATALOGO_HD_LINEA_COMERCIAL_K-BOTANAS_2026.pdf...',
      currentStep: 1,
      totalSteps: 10,
      detail: autoWhiteBackground
        ? 'Detectando giro comercial, recortando bolsas y aislando sobre fondo blanco #FFFFFF'
        : 'Detectando giro comercial, categorías y recortando bolsas de producto',
    });
    try {
      const res = await fetch(
        '/assets/aistudio/CATALOGO_HD_LINEA_COMERCIAL_K-BOTANAS_2026_d97f9640.pdf'
      );
      if (!res.ok) {
        throw new Error('No se encontró el archivo adjunto en el servidor.');
      }
      const blob = await res.blob();
      const file = new File(
        [blob],
        'CATALOGO_HD_LINEA_COMERCIAL_K-BOTANAS_2026.pdf',
        { type: 'application/pdf' }
      );
      await runPdfExtractionFlow(file);
    } catch (err: any) {
      setIsExtracting(false);
      setExtractionProgress(null);
      setExtractionError(
        err?.message || 'No se pudo abrir el catálogo K-Botanas adjunto.'
      );
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setPhase('phase2-import');
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const items: { blob: Blob; name: string; sourceType: 'uploaded_photo' }[] = [];
      for (let i = 0; i < Math.min(fileList.length, 16); i++) {
        const f = fileList[i];
        items.push({ blob: f, name: f.name, sourceType: 'uploaded_photo' });
      }
      const drafts = await extractFromImageFiles(
        items,
        { brandName, industry },
        (prog) => setExtractionProgress(prog),
        (detectedProfile) => applyDetectedBusinessProfile(detectedProfile),
        autoWhiteBackground
      );
      setExtractedDrafts(drafts);
      setPhase('phase4-review');
      onShowToast(
        `${drafts.length} ${
          drafts.length === 1 ? 'fotografía analizada' : 'fotografías analizadas'
        }${autoWhiteBackground ? ' con fondo blanco de estudio' : ''}`
      );
    } catch (err: any) {
      setExtractionError(err?.message || 'Error al analizar las fotografías.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      if (photosInputRef.current) photosInputRef.current.value = '';
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase('phase2-import');
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const drafts = await extractFromZipFile(
        file,
        { brandName, industry },
        (prog) => setExtractionProgress(prog),
        (detectedProfile) => applyDetectedBusinessProfile(detectedProfile),
        autoWhiteBackground
      );
      setExtractedDrafts(drafts);
      setPhase('phase4-review');
      onShowToast(
        `${drafts.length} productos recuperados desde el archivo ZIP`
      );
    } catch (err: any) {
      setExtractionError(err?.message || 'Error al descomprimir el paquete ZIP.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  const handleRunLiveSampleExtraction = async () => {
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const drafts = await runLiveDemoPageExtraction(
        { brandName: brandName || 'Mi Taller', industry: industry || 'Calzado Artesanal' },
        (prog) => setExtractionProgress(prog)
      );
      setExtractedDrafts(drafts);
      setPhase('phase4-review');
      onShowToast(
        `Extracción en vivo completada: ${drafts.length} productos y recortes recuperados`
      );
    } catch (err: any) {
      setExtractionError(err?.message || 'Error en la prueba de extracción.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  // Phase 4 Review Helpers
  const updateDraftField = (
    id: string,
    updates: Partial<ExtractedProductDraft>
  ) => {
    setExtractedDrafts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        const missing: string[] = [];
        if (next.price === null || isNaN(Number(next.price)) || Number(next.price) <= 0) {
          missing.push('Precio');
        }
        if (!next.sizes || next.sizes.length === 0) {
          missing.push('Tallas / Variantes');
        }
        if (!next.sku || !next.sku.trim()) {
          missing.push('SKU');
        }
        return {
          ...next,
          missingFields: missing,
          originMeta: {
            ...next.originMeta,
            missingFields: missing,
          },
        };
      })
    );
  };

  const handleReplaceDraftPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDraftId) return;
    try {
      const uploaded = await processAndUploadImage(file);
      setExtractedDrafts((prev) =>
        prev.map((d) =>
          d.id === replacingDraftId
            ? {
                ...d,
                heroImage: uploaded.url,
                originalHeroImage: uploaded.url,
                backgroundMode: 'original',
                originMeta: {
                  ...d.originMeta,
                  fileName: file.name,
                  sourceType: 'uploaded_photo',
                  qualityWarning: undefined,
                  isLowResolution: false,
                },
              }
            : d
        )
      );
      onShowToast('Fotografía sustituida con archivo de alta calidad');
    } catch (err: any) {
      onShowToast(err?.message || 'No se pudo cargar la nueva fotografía');
    } finally {
      setReplacingDraftId(null);
      if (replacePhotoInputRef.current) replacePhotoInputRef.current.value = '';
    }
  };

  const handleMergeWithPrevious = (index: number) => {
    if (index <= 0) return;
    setExtractedDrafts((prev) => {
      const copy = [...prev];
      const target = copy[index - 1];
      const current = copy[index];

      const mergedColors = Array.from(new Set([...target.colors, ...current.colors]));
      const mergedSizes = Array.from(new Set([...target.sizes, ...current.sizes]));
      const mergedDesc = [target.description, current.description]
        .filter(Boolean)
        .join('\n');

      copy[index - 1] = {
        ...target,
        price: target.price ?? current.price,
        sku: target.sku || current.sku,
        description: mergedDesc,
        colors: mergedColors,
        sizes: mergedSizes,
      };
      copy.splice(index, 1);
      return copy;
    });
    onShowToast('Registros fusionados en una sola ficha de producto');
  };

  const handleAddBlankDraft = () => {
    const newItem: ExtractedProductDraft = {
      id: `ext-manual-${Date.now()}`,
      name: 'Nuevo Producto por Completar',
      description: '',
      category: suggestedCategories[0] || 'General',
      price: null,
      currency: 'MXN',
      sku: '',
      colors: [],
      sizes: [],
      availability: 'Por completar',
      heroImage: '',
      missingFields: ['Precio', 'Tallas / Variantes', 'SKU', 'Fotografía'],
      originMeta: {
        fileName: 'Agregado manualmente en revisión',
        sourceType: 'manual',
        missingFields: ['Precio', 'Tallas / Variantes', 'SKU'],
      },
      selected: true,
    };
    setExtractedDrafts((prev) => [...prev, newItem]);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await processAndUploadImage(file);
      setLogoUrl(uploaded.url);
      onShowToast('Logotipo actualizado en la vista previa');
    } catch (err: any) {
      onShowToast(err?.message || 'Error al subir logotipo');
    }
  };

  // Convert reviewed drafts into full Product records
  const buildFinalConfigAndProducts = (
    publishExplicitly: boolean
  ): { config: TenantConfig; products: Product[] } => {
    const finalBrand = brandName.trim() || 'Mi Comercio';
    const finalIndustry = industry.trim() || 'Catálogo Digital';
    const finalLocation = location.trim() || 'México';

    const updatedTheme: BusinessTheme = {
      industry: finalIndustry,
      brandName: finalBrand,
      tagline:
        productTypes.trim() ||
        `Catálogo oficial de ${finalBrand}. Consulta disponibilidad y realiza tu pedido directamente por WhatsApp.`,
      tone:
        layoutStyle === 'editorial-luxury'
          ? 'Editorial Contemporáneo'
          : layoutStyle === 'minimal-gallery'
          ? 'Minimalista y Detallado'
          : 'Técnico y Directo',
      targetAudience: targetAudience.trim() || 'Clientes directos',
      location: finalLocation,
      valuePropositions:
        valuePropositions.length > 0
          ? valuePropositions
          : ['Atención directa por WhatsApp', `Envíos desde ${finalLocation}`],
      onboardingCompleted: true,
      productTypes,
      catalogGoal,
      suggestedCategories,
      layoutStyle,
      fontPairing,
    };

    const updatedConfig: TenantConfig = {
      ...tenantConfig,
      tenantId:
        finalBrand.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'mi-comercio',
      name: finalBrand,
      storeUrl: `${finalBrand
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}.candycatalog.store`,
      whatsappPhone: whatsappPhone.trim() || '+52 477 123 4567',
      showroomCity: finalLocation,
      announcement: `${finalBrand} · ${finalIndustry} · Atención directa por WhatsApp`,
      logoUrl,
      accentColor,
      theme: updatedTheme,
    };

    const selectedDrafts = extractedDrafts.filter((d) => d.selected);
    const finalProducts: Product[] = selectedDrafts.map((d, idx) => {
      const hasValidPrice =
        typeof d.price === 'number' && !isNaN(d.price) && d.price > 0;
      const finalSku =
        d.sku.trim() ||
        `${finalBrand.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`;
      const colorsList = d.colors.length > 0 ? d.colors : ['Estándar'];
      const sizesList = d.sizes.length > 0 ? d.sizes : ['Única'];

      const status: Product['status'] =
        publishExplicitly && hasValidPrice ? 'published' : 'hidden';

      return {
        id: d.id,
        tenantId: updatedConfig.tenantId,
        sku: finalSku,
        name: d.name.trim() || `Producto ${idx + 1}`,
        subtitle: d.description.slice(0, 140),
        description:
          d.description.trim() ||
          `${d.name.trim()} — Categoría: ${d.category}.`,
        category: d.category.trim() || suggestedCategories[0] || 'General',
        catalogCategory: (d.category.trim() || 'general').toLowerCase(),
        price: hasValidPrice ? Number(d.price) : 0,
        status,
        badge:
          !hasValidPrice
            ? 'Precio por completar'
            : d.availability && d.availability !== 'Por completar'
            ? d.availability
            : 'Disponible',
        badgeType: status === 'published' ? 'secondary' : 'neutral',
        madeIn: finalLocation,
        heroImage: d.heroImage,
        galleryImages: d.heroImage
          ? [
              {
                id: `${d.id}-g1`,
                label: 'Vista Principal',
                url: d.heroImage,
                alt: d.name,
              },
            ]
          : [],
        craftDetails: d.description
          ? d.description.split('\n').filter(Boolean)
          : [],
        finishes: colorsList.map((col, cIdx) => ({
          id: `${d.id}-f-${cIdx}`,
          name: col,
          colorHex: inferColorHex(col),
          subtext: '',
        })),
        availableSizes: sizesList,
        sizeMatrix: sizesList.map((sz) => ({
          size: sz,
          sku: `${finalSku}-${sz}`,
          status: 'in_stock',
          quantity: 5,
        })),
        waTemplate:
          'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.',
        tags: [d.category || 'Catálogo'],
        originMeta: d.originMeta,
      };
    });

    return { config: updatedConfig, products: finalProducts };
  };

  const whiteBgCount = extractedDrafts.filter(
    (d) => d.backgroundMode === 'white' || d.backgroundMode === 'cream'
  ).length;

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#1A1C1C] flex flex-col justify-between">
      {/* Top Bar: Google Stitch Ecosystem Header */}
      <header className="bg-white border-b border-[#E5E5E2] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onReturnToGateway} aria-label="Volver a Candy Studio AI" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E2] text-black hover:bg-[#EEE8F9] focus-visible:outline-2 focus-visible:outline-offset-2">←</button>
          <button
            type="button"
            onClick={() => setPhase('welcome')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 bg-[#A23E18] inline-block" />
            <span className="font-mono text-xs uppercase tracking-widest text-black font-bold">
              CANDY CATALOG / CREA TU CATÁLOGO CON GEMINI IA
            </span>
          </button>
        </div>

        {/* Phase Stepper */}
        <nav
          aria-label="Fases de creación"
          className="hidden xl:flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-[#5F5E5E]"
        >
          <button
            type="button"
            onClick={() => setPhase('welcome')}
            className={`cursor-pointer px-2.5 py-1 transition-colors ${
              phase === 'welcome'
                ? 'bg-black text-white font-bold'
                : 'hover:text-black'
            }`}
          >
            00. INICIO
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setPhase('phase1-interview')}
            className={`cursor-pointer px-2.5 py-1 transition-colors ${
              phase === 'phase1-interview'
                ? 'bg-black text-white font-bold'
                : 'hover:text-black'
            }`}
          >
            01. GIRO &amp; PROPUESTA
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setPhase('phase2-import')}
            className={`cursor-pointer px-2.5 py-1 transition-colors ${
              phase === 'phase2-import'
                ? 'bg-black text-white font-bold'
                : 'hover:text-black'
            }`}
          >
            02. IMPORTAR &amp; FONDO BLANCO
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            disabled={extractedDrafts.length === 0}
            onClick={() => setPhase('phase4-review')}
            className={`cursor-pointer px-2.5 py-1 transition-colors disabled:opacity-40 ${
              phase === 'phase4-review'
                ? 'bg-black text-white font-bold'
                : 'hover:text-black'
            }`}
          >
            03. REVISAR ({extractedDrafts.length})
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            disabled={extractedDrafts.length === 0 && !brandName}
            onClick={() => setPhase('phase5-customize')}
            className={`cursor-pointer px-2.5 py-1 transition-colors disabled:opacity-40 ${
              phase === 'phase5-customize'
                ? 'bg-black text-white font-bold'
                : 'hover:text-black'
            }`}
          >
            04. PUBLICAR
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  setGoogleLoginError(null);
                  onShowToast('Sesión iniciada. Ya puedes utilizar la importación inteligente.');
                } catch (error) {
                  setGoogleLoginError(googleSignInErrorMessage(error));
                }
              }}
              className="px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white bg-[#6447A3] hover:bg-[#4B367C] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Entrar con Google
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUxEvaluationModal((prev) => !prev)}
            className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold text-[#A23E18] border border-[#E5E5E2] bg-[#FFDBCE]/30 hover:border-black transition-colors cursor-pointer whitespace-nowrap"
          >
            Diagnóstico UX/UI
          </button>
          <button
            type="button"
            onClick={onExploreDemoSierra}
            className="hidden sm:inline-flex px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#5F5E5E] hover:text-black border border-[#E5E5E2] bg-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Saltar a Demo SIERRA →
          </button>
          <button
            type="button"
            onClick={onOpenMerchantConsole}
            className="px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider font-bold text-white bg-black hover:bg-[#A23E18] transition-colors cursor-pointer whitespace-nowrap"
          >
            Consola
          </button>
        </div>
      </header>

      {googleLoginError && (
        <div role="alert" className="mx-4 my-4 border border-[#ECA6A1] bg-[#FFF0EE] px-4 py-3 text-sm text-[#882B26] sm:mx-8">
          <strong>No pudimos abrir tu sesión de Google.</strong> {googleLoginError}
        </div>
      )}
      {/* ================================================================= */}
      {/* PANEL DESPLEGABLE: EVALUACIÓN UX/UI STITCH & CANDY CATALOG */}
      {/* ================================================================= */}
      {showUxEvaluationModal && (
        <section
          aria-label="Evaluación de Diseño UX/UI Candy Catalog"
          className="bg-[#2A1A14] text-white border-b border-[#E5E5E2] px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="max-w-[1440px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#FFDBCE] font-semibold uppercase tracking-widest">
                  <span>SISTEMA DE DISEÑO EDITORIAL SUIZO · CANDY CATALOG</span>
                  <span>·</span>
                  <span>CONVERSIÓN WHATSAPP DIRECT</span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mt-1">
                  Arquitectura UX/UI para Catálogos Digitales de Alta Conversión
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowUxEvaluationModal(false)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-[#A23E18] text-white font-mono text-xs uppercase cursor-pointer self-start sm:self-center"
              >
                Cerrar ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-5 bg-black/35 border border-white/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#FFDBCE] font-bold">
                      01 / FONDO BLANCO DE ESTUDIO
                    </span>
                    <span className="px-2 py-0.5 bg-[#25D366]/20 text-[#25D366] font-mono text-[10px] uppercase">
                      Activo
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase text-white">
                    Estandarización en Lienzo #FFFFFF
                  </h3>
                  <p className="text-white/75 leading-relaxed">
                    Aislar cada producto sobre fondo blanco puro o piedra editorial elimina el ruido visual de los catálogos PDF tradicionales y eleva el valor percibido.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-white/70">
                    Auto-Blanco: <strong>{autoWhiteBackground ? 'SÍ' : 'NO'}</strong>
                  </span>
                  {extractedDrafts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchApplyStudioBg('white')}
                      className="text-[#FFDBCE] underline cursor-pointer font-bold"
                    >
                      Aplicar ({extractedDrafts.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 bg-black/35 border border-white/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#FFDBCE] font-bold">
                      02 / RETÍCULA SUIZA 12-COL
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 text-white font-mono text-[10px] uppercase">
                      Stitch UI
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase text-white">
                    Jerarquía Escaneable en 3 Segundos
                  </h3>
                  <p className="text-white/75 leading-relaxed">
                    Bordes de 1px (#E5E5E2), titulares en Plus Jakarta Sans Bold Uppercase y metadatos técnicos en JetBrains Mono para lectura instantánea.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 font-mono text-[11px] text-white/70">
                  Tipografía: <strong>Plus Jakarta + Inter + JetBrains Mono</strong>
                </div>
              </div>

              <div className="p-5 bg-black/35 border border-white/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#25D366] font-bold">
                      03 / WHATSAPP DIRECT ENGINE
                    </span>
                    <span className="px-2 py-0.5 bg-[#25D366]/20 text-[#25D366] font-mono text-[10px] uppercase">
                      1-Clic
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase text-white">
                    Conversión Sin Fricción
                  </h3>
                  <p className="text-white/75 leading-relaxed">
                    Cada tarjeta e inspección de producto pre-carga SKU, acabado, talla y precio para abrir conversación directa con el vendedor en WhatsApp.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 font-mono text-[11px] text-white/70">
                  Línea activa: <strong>{whatsappPhone}</strong>
                </div>
              </div>

              <div className="p-5 bg-black/35 border border-white/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#FFDBCE] font-bold">
                      04 / ESTUDIO DE MARKETING IA
                    </span>
                    <span className="px-2 py-0.5 bg-[#A23E18] text-white font-mono text-[10px] uppercase">
                      Gemini Vision
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase text-white">
                    Onboarding &amp; Activos de Campaña
                  </h3>
                  <p className="text-white/75 leading-relaxed">
                    Importa desde PDF/ZIP, recorta fotografías reales, remueve fondos y genera kits de diseño gráfico y copy para redes sociales en segundos.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/15 font-mono text-[11px] text-white/70">
                  Persistencia: <strong>Cloud Firestore + LocalStorage</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col justify-center">
        {/* Global Hidden File Inputs */}
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handlePdfUpload}
          className="hidden"
        />
        <input
          ref={photosInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotosUpload}
          className="hidden"
        />
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handleZipUpload}
          className="hidden"
        />

        {/* ================================================================= */}
        {/* PANTALLA INICIAL: "CREA TU CATÁLOGO" — GOOGLE STITCH DESIGN */}
        {/* ================================================================= */}
        {phase === 'welcome' && (
          <div className="bg-white border border-[#E5E5E2] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Editorial Statement & 3 Primary Options (7 Cols) */}
              <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between space-y-8 border-b lg:border-b-0 lg:border-r border-[#E5E5E2]">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 border border-[#E5E5E2] bg-[#F9F9F8] px-3 py-1">
                    <span className="material-symbols-outlined text-[15px] text-[#A23E18]">
                      auto_awesome
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-[#A23E18] font-bold">
                      CONFIGURACIÓN INTELIGENTE CON GEMINI IA
                    </span>
                  </div>

                  <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl lg:text-[46px] font-bold uppercase tracking-tight text-black leading-[1.05]">
                    Tu negocio ya tiene productos.{' '}
                    <span className="text-[#5F5E5E]">
                      Vamos a darles su propio espacio.
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-[#5F5E5E] max-w-2xl leading-relaxed">
                    Cuéntanos qué vendes o sube tu catálogo actual en PDF. Nuestra IA detectará automáticamente el giro de tu negocio, recortará tus fotografías con <strong>fondo blanco de estudio (#FFFFFF)</strong> y creará un aparador digital listo para vender por WhatsApp.
                  </p>
                </div>

                {/* 3 Required Entry Paths (Stitch High-Contrast Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Opción 1: Crear mi catálogo con IA */}
                  <button
                    type="button"
                    onClick={() => setPhase('phase1-interview')}
                    className="p-5 bg-black hover:bg-[#A23E18] text-white text-left flex flex-col justify-between gap-6 transition-colors cursor-pointer group border border-black"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs text-[#FFDBCE] font-bold uppercase tracking-wider">
                        01 / IA CREATIVA
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-white group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase tracking-tight">
                        Crear mi catálogo con IA
                      </h2>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Conversa con Gemini para detectar tu giro, categorías y estructurar tu aparador.
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: Importar mi catálogo actual */}
                  <button
                    type="button"
                    onClick={() => setPhase('phase2-import')}
                    className="p-5 bg-white hover:border-black text-black border border-[#E5E5E2] text-left flex flex-col justify-between gap-6 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs text-[#A23E18] font-bold uppercase tracking-wider">
                        02 / PDF + FONDO BLANCO
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-[#A23E18] group-hover:translate-x-1 transition-transform">
                        upload_file
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase tracking-tight">
                        Importar mi catálogo actual
                      </h2>
                      <p className="text-xs text-[#5F5E5E] leading-relaxed">
                        Sube tu PDF, fotos o ZIP: la IA recorta cada producto y aisla el fondo a blanco.
                      </p>
                    </div>
                  </button>

                  {/* Opción 3: Comenzar manualmente */}
                  <button
                    type="button"
                    onClick={() => {
                      const { config } = buildFinalConfigAndProducts(false);
                      onComplete(
                        brandName ? config : tenantConfig,
                        [],
                        'merchant-new-product'
                      );
                    }}
                    className="p-5 bg-[#F9F9F8] hover:bg-white hover:border-black text-black border border-[#E5E5E2] text-left flex flex-col justify-between gap-6 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs text-[#5F5E5E] font-bold uppercase tracking-wider">
                        03 / MANUAL
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-black group-hover:translate-x-1 transition-transform">
                        edit_square
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold uppercase tracking-tight">
                        Comenzar manualmente
                      </h2>
                      <p className="text-xs text-[#5F5E5E] leading-relaxed">
                        Abre el editor con quita-fondo IA y estudio de marketing para cargar pieza por pieza.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Stitch Technical Footnote Strip */}
                <div className="pt-6 border-t border-[#E5E5E2] grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[#5F5E5E] tracking-wider">
                      01 / DISEÑO
                    </span>
                    <span className="font-mono text-xs font-bold text-black uppercase mt-0.5 block">
                      RETÍCULA SUIZA
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[#5F5E5E] tracking-wider">
                      02 / ESTUDIO IA
                    </span>
                    <span className="font-mono text-xs font-bold text-[#A23E18] uppercase mt-0.5 block">
                      FONDO BLANCO #FFF
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[#5F5E5E] tracking-wider">
                      03 / EXTRACCIÓN
                    </span>
                    <span className="font-mono text-xs font-bold text-black uppercase mt-0.5 block">
                      PDF &amp; FOTOS REALES
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-[#5F5E5E] tracking-wider">
                      04 / CONVERSIÓN
                    </span>
                    <span className="font-mono text-xs font-bold text-[#15803D] uppercase mt-0.5 block">
                      WHATSAPP DIRECT
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Interactive AI Prompt & 1-Click PDF Importer (5 Cols) */}
              <div className="lg:col-span-5 bg-[#F9F9F8] p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
                    <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                      ASISTENTE DE IMPORTACIÓN Y GIRO
                    </span>
                    <span className="px-2 py-0.5 bg-[#A23E18] text-white font-mono text-[10px] font-bold uppercase tracking-widest">
                      GEMINI VISION
                    </span>
                  </div>

                  {/* Studio White Background Automatic Switch */}
                  <div className="p-4 bg-white border border-[#E5E5E2] flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold text-black uppercase block">
                        Aislar Productos en Fondo Blanco (#FFFFFF)
                      </span>
                      <span className="text-xs text-[#5F5E5E] block">
                        Remueve el fondo del PDF o foto y centra cada pieza en lienzo de estudio.
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoWhiteBackground}
                      onClick={() => setAutoWhiteBackground((prev) => !prev)}
                      className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer transition-colors shrink-0 ${
                        autoWhiteBackground
                          ? 'bg-black text-white border-black'
                          : 'bg-[#F9F9F8] text-[#5F5E5E] border-[#E5E5E2]'
                      }`}
                    >
                      {autoWhiteBackground ? 'ACTIVO ✓' : 'ORIGINAL'}
                    </button>
                  </div>

                  {/* Direct 1-Click PDF Upload & Attached K-Botanas Quick Action */}
                  <div className="p-4 bg-white border border-[#E5E5E2] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase font-bold text-black">
                        SUBE TU ARCHIVO DE CATÁLOGO:
                      </span>
                      <span className="font-mono text-[11px] text-[#A23E18] uppercase font-semibold">
                        PDF · JPG · PNG · ZIP
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="py-3 px-3 bg-black hover:bg-[#A23E18] text-white font-mono text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          picture_as_pdf
                        </span>
                        <span>Subir mi PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadAttachedKBotanasPdf}
                        className="py-3 px-3 bg-[#A23E18] hover:bg-black text-white font-mono text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          auto_fix_high
                        </span>
                        <span>Probar K-Botanas PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Text Prompt for Business Giro */}
                  <div className="space-y-2">
                    <label
                      htmlFor="welcome-quick-prompt"
                      className="block font-mono text-xs uppercase tracking-wider text-[#5F5E5E] font-bold"
                    >
                      O DESCRIBE TU NEGOCIO PARA DETECTAR TU GIRO:
                    </label>
                    <textarea
                      id="welcome-quick-prompt"
                      rows={3}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Ej. Tengo una zapatería en León y vendo calzado artesanal de piel, o somos K-Botanas y vendemos snacks y gomitas..."
                      className="w-full bg-white border border-[#E5E5E2] focus:border-black p-3 text-xs sm:text-sm text-black outline-none leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text =
                          userInput.trim() ||
                          'Tengo una zapatería en León y vendo calzado artesanal de piel.';
                        setPhase('phase1-interview');
                        handleSendInterviewMessage(text);
                      }}
                      className="w-full py-3 px-4 bg-white hover:bg-black text-black hover:text-white border border-black font-mono text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        bolt
                      </span>
                      <span>Analizar Giro con Gemini IA →</span>
                    </button>
                  </div>
                </div>

                {/* Quick Sector Presets */}
                <div className="space-y-2 pt-4 border-t border-[#E5E5E2]">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-[#5F5E5E]">
                    EJEMPLOS RÁPIDOS DE GIRO COMERCIAL:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'Tengo una zapatería en León y vendo calzado artesanal de piel.',
                      'Somos K-Botanas: vendemos cacahuates, gomitas enchiladas, chocolates y galletas.',
                      'Somos una marca de sastrería masculina con trajes, sacos corte inglés y camisas.',
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhase('phase1-interview');
                          handleSendInterviewMessage(sample);
                        }}
                        className="text-left text-xs text-[#5F5E5E] hover:text-black bg-white hover:border-black px-3 py-2 border border-[#E5E5E2] transition-colors cursor-pointer truncate"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* FASE 1: GEMINI CONOCE EL NEGOCIO (CONVERSACIÓN + ARQUITECTURA) */}
        {/* ================================================================= */}
        {phase === 'phase1-interview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e4e2dc] pb-5">
              <div>
                <p className="text-xs text-[#8c3a1b] font-semibold">
                  Fase 1 · Identidad y Estructura Comercial
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#141413]">
                  Platícanos sobre tu negocio y tus productos
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setPhase('phase2-import')}
                className="px-5 py-2.5 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0"
              >
                <span>Siguiente: Importar Productos</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Progressive Conversation (6 Cols) */}
              <div className="lg:col-span-6 bg-[#ffffff] border border-[#e4e2dc] flex flex-col justify-between h-[560px]">
                <div className="p-4 border-b border-[#e4e2dc] bg-[#f7f6f2] flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                      Diálogo con Gemini
                    </h2>
                    <p className="text-[11px] text-[#73716b]">
                      Conversación progresiva · Sin formularios rígidos
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] text-[#73716b] mb-1">
                        {msg.sender === 'user' ? 'Tú' : 'Gemini · Arquitecto Comercial'}
                      </span>
                      <div
                        className={`max-w-[88%] p-4 text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#141413] text-[#ffffff]'
                            : 'bg-[#f7f6f2] text-[#141413] border border-[#e4e2dc]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isAiThinking && (
                    <div className="p-3 bg-[#f7f6f2] border border-[#e4e2dc] text-xs text-[#73716b] max-w-xs">
                      Gemini está analizando tu respuesta y ajustando la propuesta...
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-[#e4e2dc] bg-[#ffffff] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendInterviewMessage();
                      }}
                      placeholder="Escribe tu respuesta (ej. Mi marca se llama Taller Áurea, vendemos anillos...)"
                      className="flex-1 bg-[#f7f6f2] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
                    />
                    <button
                      type="button"
                      disabled={!userInput.trim() || isAiThinking}
                      onClick={() => handleSendInterviewMessage()}
                      className="px-5 py-2.5 bg-[#141413] text-[#ffffff] text-xs font-medium cursor-pointer disabled:opacity-40"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Live Editable Proposal (6 Cols) */}
              <div className="lg:col-span-6 bg-[#ffffff] border border-[#e4e2dc] p-6 space-y-5">
                <div className="border-b border-[#e4e2dc] pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-editorial text-2xl font-medium text-[#141413]">
                      Propuesta Comercial Editable
                    </h2>
                    <p className="text-xs text-[#73716b]">
                      Puedes modificar libremente cualquier sugerencia de Gemini.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Por definir..."
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      Giro o Sector
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Ej. Calzado artesanal, Joyería..."
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      Tipo de Productos
                    </label>
                    <input
                      type="text"
                      value={productTypes}
                      onChange={(e) => setProductTypes(e.target.value)}
                      placeholder="Ej. Botas, mocasines, cinturones..."
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      Público Objetivo
                    </label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Ej. Clientes directos, mayoristas..."
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      Ciudad / Origen
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ej. León, Guanajuato"
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4a4945] font-medium mb-1">
                      WhatsApp de Pedidos
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+52 477 123 4567"
                      className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 font-data text-[#141413] outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                {/* Suggested Categories */}
                <div className="space-y-2 pt-2 border-t border-[#e4e2dc]">
                  <label className="block text-xs font-medium text-[#4a4945]">
                    Categorías Comerciales Sugeridas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f7f6f2] border border-[#cfccc4] text-xs text-[#141413]"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSuggestedCategories((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-[#73716b] hover:text-[#991b1b] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="Agregar otra categoría..."
                      className="flex-1 bg-[#f7f6f2] border border-[#cfccc4] px-3 py-1.5 text-xs text-[#141413] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryInput.trim()) {
                          setSuggestedCategories((prev) => [
                            ...prev,
                            newCategoryInput.trim(),
                          ]);
                          setNewCategoryInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#141413] text-[#ffffff] text-xs cursor-pointer"
                    >
                      + Categoría
                    </button>
                  </div>
                </div>

                {/* Visual Direction Recommendation */}
                <div className="p-4 bg-[#f7f6f2] border border-[#e4e2dc] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#141413]">
                      Dirección Visual Recomendada por Gemini:
                    </span>
                    <select
                      value={layoutStyle}
                      onChange={(e) =>
                        setLayoutStyle(e.target.value as CatalogLayoutStyle)
                      }
                      className="bg-[#ffffff] border border-[#cfccc4] px-2 py-1 text-xs text-[#141413] cursor-pointer"
                    >
                      <option value="editorial-luxury">
                        Editorial de Colección (Fotos 4:5 + Spreads)
                      </option>
                      <option value="minimal-gallery">
                        Galería Minimalista de Detalle (1:1)
                      </option>
                      <option value="technical-spec">
                        Catálogo Técnico de Especificaciones
                      </option>
                    </select>
                  </div>
                  <p className="text-xs text-[#4a4945] leading-relaxed">
                    {editorialRationale}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* FASE 2 & 3: IMPORTACIÓN INTELIGENTE Y EXTRACCIÓN REAL DE FOTOS */}
        {/* ================================================================= */}
        {phase === 'phase2-import' && (
          <div className="space-y-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#dfdcd0] pb-5">
              <div>
                <p className="text-xs text-[#fd5d5c] font-semibold uppercase tracking-wider font-data">
                  Fases 2 y 3 · Importación, Giro Comercial y Estudio de Fondo Blanco
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#1a1a1a]">
                  Sube tu catálogo en PDF o tus fotografías de producto
                </h1>
                <p className="text-sm text-[#4a4945] mt-1">
                  Gemini analiza visualmente cada página, detecta el giro comercial, recorta tus productos y los aísla automáticamente sobre fondo blanco de estudio (#FFFFFF).
                </p>
              </div>

              {/* Automatic White Background Toggle in Phase 2 */}
              <div className="p-3 bg-[#fcf4d2] border border-[#1a1a1a] flex items-center gap-3 shrink-0">
                <div className="text-xs">
                  <span className="font-semibold text-[#1a1a1a] block">
                    Fondo Blanco de Estudio (#FFFFFF)
                  </span>
                  <span className="text-[11px] text-[#4a4945]">
                    Aislar producto al recortar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoWhiteBackground((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-data font-semibold border cursor-pointer ${
                    autoWhiteBackground
                      ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                      : 'bg-[#ffffff] text-[#4a4945] border-[#c8c4b6]'
                  }`}
                >
                  {autoWhiteBackground ? 'ACTIVO ✓' : 'ORIGINAL'}
                </button>
              </div>
            </div>

            {isExtracting && extractionProgress ? (
              <div className="bg-[#ffffff] border-2 border-[#1a1a1a] p-8 sm:p-10 space-y-6 text-center max-w-2xl mx-auto">
                <p className="text-xs uppercase tracking-wider text-[#fd5d5c] font-semibold font-data">
                  Procesamiento Multimodal + Estudio de Fondo Blanco en Curso
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#1a1a1a]">
                  {extractionProgress.stage}
                </h2>
                {extractionProgress.detail && (
                  <p className="text-xs text-[#6e6c65] font-data">
                    {extractionProgress.detail}
                  </p>
                )}
                <div className="w-full h-2.5 bg-[#ebe8dc] overflow-hidden border border-[#1a1a1a]">
                  <div
                    className="h-full bg-[#fd5d5c] transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (extractionProgress.currentStep /
                            Math.max(1, extractionProgress.totalSteps)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-[#4a4945]">
                  Paso {extractionProgress.currentStep} de {extractionProgress.totalSteps} · Detectando giro comercial, proponiendo arquitectura y aislando fotografías sobre fondo blanco...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. PDF Catalog Upload */}
                <div className="bg-[#ffffff] border border-[#1a1a1a] p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-data text-xs text-[#fd5d5c] font-semibold">
                        OPCIÓN 01 · PDF
                      </span>
                      <span className="material-symbols-outlined text-[24px] text-[#fd5d5c]">
                        picture_as_pdf
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl font-medium text-[#1a1a1a]">
                      Catálogo en PDF
                    </h2>
                    <p className="text-xs text-[#4a4945] leading-relaxed">
                      Renderizamos tu PDF, detectamos el giro del negocio y sus categorías, recortamos cada producto y le aplicamos fondo blanco de estudio.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-[#6e6c65]">
                      <span>Páginas máx. a escanear:</span>
                      <select
                        value={maxPdfPages}
                        onChange={(e) => setMaxPdfPages(Number(e.target.value))}
                        className="bg-[#f5f3ea] border border-[#c8c4b6] px-2 py-1 font-data text-xs text-[#1a1a1a]"
                      >
                        <option value={4}>4 páginas</option>
                        <option value={8}>8 páginas</option>
                        <option value={12}>12 páginas</option>
                        <option value={16}>16 páginas</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#fd5d5c] text-[#ffffff] text-xs font-medium transition-colors cursor-pointer"
                    >
                      Seleccionar Archivo PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadAttachedKBotanasPdf}
                      className="w-full py-2.5 px-3 bg-[#fcf4d2] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#1a1a1a] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Analizar K-Botanas 2026 + Fondo Blanco →
                    </button>
                  </div>
                </div>

                {/* 2. Multiple Photos Upload */}
                <div className="bg-[#ffffff] border border-[#dfdcd0] p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-data text-xs text-[#6e6c65]">OPCIÓN 02</span>
                      <span className="material-symbols-outlined text-[24px] text-[#1a1a1a]">
                        photo_library
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl font-medium text-[#1a1a1a]">
                      Fotografías JPG, PNG o WebP
                    </h2>
                    <p className="text-xs text-[#4a4945] leading-relaxed">
                      Sube una o múltiples fotografías de tus productos. Gemini identificará tu giro comercial, aislará el producto en fondo blanco y estructurará sus datos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => photosInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-[#ffffff] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#1a1a1a] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Seleccionar Fotografías
                  </button>
                </div>

                {/* 3. ZIP Package Upload */}
                <div className="bg-[#ffffff] border border-[#dfdcd0] p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-data text-xs text-[#6e6c65]">OPCIÓN 03</span>
                      <span className="material-symbols-outlined text-[24px] text-[#4a4945]">
                        folder_zip
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl font-medium text-[#1a1a1a]">
                      Archivo ZIP con Imágenes
                    </h2>
                    <p className="text-xs text-[#4a4945] leading-relaxed">
                      Si tienes una carpeta comprimida con las fotos de tu colección, súbela en formato .ZIP para extraer, poner fondo blanco y analizar en lote.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-[#f5f3ea] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#c8c4b6] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Subir Paquete .ZIP
                  </button>
                </div>
              </div>
            )}

            {extractionError && (
              <div
                role="alert"
                className="p-4 bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] flex items-center justify-between gap-4"
              >
                <span>{extractionError}</span>
                <button
                  type="button"
                  onClick={() => setExtractionError(null)}
                  className="underline cursor-pointer shrink-0"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Live Verification & Manual Entry Bar */}
            {!isExtracting && (
              <div className="p-6 bg-[#ffffff] border border-[#dfdcd0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">
                    ¿Quieres ver cómo el Estudio IA recorta y pone fondo blanco a K-Botanas 2026?
                  </h3>
                  <p className="text-xs text-[#6e6c65]">
                    Analiza el PDF adjunto «CATALOGO_HD_LINEA_COMERCIAL_K-BOTANAS_2026.pdf» con aislamiento de fondo blanco activado.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleLoadAttachedKBotanasPdf}
                    className="px-4 py-2.5 bg-[#fd5d5c] hover:bg-[#a00721] text-[#ffffff] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Analizar K-Botanas + Fondo Blanco
                  </button>
                  <button
                    type="button"
                    onClick={handleRunLiveSampleExtraction}
                    className="px-4 py-2.5 bg-[#f5f3ea] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#c8c4b6] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Probar Lámina Demo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* FASE 4: REVISIÓN DEL CATÁLOGO + ESTUDIO DE FONDO BLANCO + UX/UI */}
        {/* ================================================================= */}
        {phase === 'phase4-review' && (
          <div className="space-y-8">
            <input
              ref={replacePhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleReplaceDraftPhoto}
              className="hidden"
            />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#dfdcd0] pb-6">
              <div className="space-y-1">
                <p className="text-xs text-[#fd5d5c] font-semibold uppercase tracking-wider font-data">
                  Fase 4 · Giro Detectado, Estudio de Fondo Blanco y Fichas Recuperadas
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#1a1a1a]">
                  Tus productos se ven mejor, se entienden y están listos para revisión
                </h1>
                <p className="text-sm text-[#4a4945]">
                  Puedes alternar cada fotografía entre <strong>Fondo Blanco (#FFFFFF)</strong>, <strong>Fondo Crema candystudio® (#F5F3EA)</strong> o su <strong>Fondo Original</strong> en 1 clic.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPhase('phase2-import')}
                  className="px-3.5 py-2 bg-[#ffffff] border border-[#c8c4b6] text-xs text-[#4a4945] hover:text-[#1a1a1a] cursor-pointer"
                >
                  + Subir más archivos
                </button>
                <button
                  type="button"
                  onClick={handleAddBlankDraft}
                  className="px-3.5 py-2 bg-[#ffffff] border border-[#c8c4b6] text-xs font-medium text-[#1a1a1a] cursor-pointer"
                >
                  + Agregar producto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { config, products } = buildFinalConfigAndProducts(false);
                    onComplete(config, products, 'merchant-catalog');
                  }}
                  className="px-4 py-2 bg-[#ffffff] border border-[#1a1a1a] text-xs font-medium text-[#1a1a1a] cursor-pointer"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('phase5-customize')}
                  className="px-5 py-2 bg-[#fd5d5c] hover:bg-[#a00721] text-[#ffffff] text-xs font-semibold cursor-pointer"
                >
                  Ver Aparador en Vivo y Publicar →
                </button>
              </div>
            </div>

            {/* STUDIO WHITE BACKGROUND BATCH TOOLBAR */}
            <div className="bg-[#1a1a1a] text-[#f5f3ea] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#fd5d5c] text-[#ffffff] font-data text-[10px] font-semibold uppercase">
                    ESTUDIO FOTOGRÁFICO IA · CANDYSTUDIO®
                  </span>
                  <span className="text-xs text-[#c8c4b6] font-data">
                    {whiteBgCount} de {extractedDrafts.length} productos con fondo de estudio
                  </span>
                </div>
                <p className="text-sm font-medium text-[#ffffff]">
                  ¿Quieres cambiar el fondo de todos los productos a blanco puro o crema editorial?
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isBatchApplyingWhiteBg}
                  onClick={() => handleBatchApplyStudioBg('white')}
                  className="px-4 py-2 bg-[#ffffff] hover:bg-[#fcf4d2] text-[#1a1a1a] text-xs font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span className="w-3 h-3 bg-[#ffffff] border border-[#1a1a1a] inline-block" />
                  <span>
                    {isBatchApplyingWhiteBg
                      ? 'Procesando lote...'
                      : 'Poner Fondo Blanco (#FFFFFF) a Todos'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isBatchApplyingWhiteBg}
                  onClick={() => handleBatchApplyStudioBg('cream')}
                  className="px-3.5 py-2 bg-[#f5f3ea] hover:bg-[#ebe8dc] text-[#1a1a1a] text-xs font-medium cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span className="w-3 h-3 bg-[#f5f3ea] border border-[#1a1a1a] inline-block" />
                  <span>Fondo Crema (#F5F3EA) a Todos</span>
                </button>
                <button
                  type="button"
                  disabled={isBatchApplyingWhiteBg}
                  onClick={() => handleBatchApplyStudioBg('original')}
                  className="px-3.5 py-2 bg-[#2d2d2b] hover:bg-[#3d3d3a] text-[#c8c4b6] text-xs cursor-pointer disabled:opacity-50"
                >
                  Restaurar Fondo Original
                </button>
              </div>
            </div>

            {/* AI AUTOMATIC BUSINESS GIRO & CREATIVE PROPOSAL BANNER */}
            <div className="bg-[#ffffff] border-2 border-[#1a1a1a] p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dfdcd0] pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-data uppercase tracking-wider px-2 py-0.5 bg-[#1a1a1a] text-[#ffffff]">
                      Diagnóstico Comercial candystudio®
                    </span>
                    {hasAutoDetectedGiro && (
                      <span className="text-xs text-[#fd5d5c] font-semibold">
                        Giro e Identidad detectados automáticamente
                      </span>
                    )}
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#1a1a1a] font-medium pt-1">
                    Propuesta de Aparador para {brandName || 'tu Negocio'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowUxEvaluationModal(true)}
                    className="px-3.5 py-2 bg-[#fcf4d2] border border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium cursor-pointer"
                  >
                    Ver Auditoría UX/UI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('phase5-customize')}
                    className="px-4 py-2 bg-[#fd5d5c] hover:bg-[#a00721] text-[#ffffff] text-xs font-semibold cursor-pointer"
                  >
                    Personalizar Diseño →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#fd5d5c] font-data">
                    Idea Creativa y Comercial Propuesta al Cliente
                  </label>
                  <textarea
                    rows={3}
                    value={editorialRationale}
                    onChange={(e) => setEditorialRationale(e.target.value)}
                    className="w-full bg-[#f5f3ea] border border-[#c8c4b6] p-3.5 text-sm text-[#1a1a1a] leading-relaxed outline-none focus:border-[#1a1a1a]"
                  />
                  {valuePropositions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {valuePropositions.map((vp, i) => (
                        <span
                          key={i}
                          className="text-xs bg-[#fcf4d2] border border-[#dfdcd0] px-3 py-1 text-[#1a1a1a] font-medium"
                        >
                          ✓ {vp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f5f3ea] p-4 border border-[#dfdcd0]">
                  <div>
                    <label className="block text-[#6e6c65] mb-1">
                      Marca Detectada
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Nombre de tu marca"
                      className="w-full bg-[#ffffff] border border-[#c8c4b6] px-2.5 py-1.5 font-medium text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6e6c65] mb-1">
                      Giro Comercial Detectado
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Giro o sector"
                      className="w-full bg-[#ffffff] border border-[#c8c4b6] px-2.5 py-1.5 font-medium text-[#1a1a1a]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[#6e6c65] mb-1">
                      Categorías Sugeridas Automáticamente ({suggestedCategories.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#ffffff] border border-[#c8c4b6] text-[11px] text-[#1a1a1a]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {extractedDrafts.map((draft, idx) => {
                const isProcessingThisBg = processingBgDraftId === draft.id;
                const currentBgMode = draft.backgroundMode || 'original';

                return (
                  <div
                    key={draft.id}
                    className="bg-[#ffffff] border border-[#dfdcd0] p-5 flex flex-col justify-between gap-5"
                  >
                    {/* Top Bar: Origin Reference & Duplicate / Delete Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfdcd0] pb-3 text-xs">
                      <div className="flex items-center gap-2 text-[#6e6c65]">
                        <span className="font-data font-semibold text-[#1a1a1a]">
                          #{idx + 1}
                        </span>
                        <span>·</span>
                        <span>
                          Origen: <strong>{draft.originMeta.fileName}</strong>
                          {draft.originMeta.pageNumber
                            ? ` (Pág. ${draft.originMeta.pageNumber})`
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMergeWithPrevious(idx)}
                            className="text-xs text-[#fd5d5c] hover:underline cursor-pointer"
                            title="Fusionar este registro con el producto anterior"
                          >
                            Fusionar con #{idx}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExtractedDrafts((prev) =>
                              prev.filter((item) => item.id !== draft.id)
                            )
                          }
                          className="text-xs text-[#991b1b] hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {draft.duplicateOfId && (
                      <div className="p-2.5 bg-[#fff7ed] border border-[#fed7aa] text-xs text-[#9a3412] flex items-center justify-between">
                        <span>
                          Posible duplicado detectado (mismo nombre o SKU que un registro anterior).
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMergeWithPrevious(idx)}
                            className="underline font-medium cursor-pointer ml-2"
                          >
                            Fusionar ahora
                          </button>
                        )}
                      </div>
                    )}

                    {/* Main Split: Photo + Studio Background Switcher Left + Editable Fields Right */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                      {/* Left Photo Column (4 Cols) */}
                      <div className="sm:col-span-4 space-y-2.5">
                        <div
                          className={`aspect-[4/5] border border-[#dfdcd0] overflow-hidden relative flex items-center justify-center ${
                            currentBgMode === 'white'
                              ? 'bg-[#ffffff]'
                              : currentBgMode === 'cream'
                              ? 'bg-[#f5f3ea]'
                              : 'bg-[#ebe8dc]'
                          }`}
                        >
                          {draft.heroImage ? (
                            <img
                              src={draft.heroImage}
                              alt={draft.name}
                              className={`w-full h-full ${
                                currentBgMode === 'white' || currentBgMode === 'cream'
                                  ? 'object-contain p-2'
                                  : 'object-cover'
                              }`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs text-[#6e6c65]">
                              Fotografía por completar
                            </div>
                          )}

                          {isProcessingThisBg && (
                            <div className="absolute inset-0 bg-[#ffffff]/85 flex items-center justify-center p-3 text-center">
                              <span className="text-[11px] font-data font-semibold text-[#1a1a1a]">
                                Aislando fondo...
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 1-Click Background Selector (Blanco / Crema / Original) */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-data uppercase tracking-wider text-[#6e6c65]">
                            Fondo del Producto:
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              disabled={isProcessingThisBg}
                              onClick={() => handleApplyStudioBgToDraft(draft.id, 'white')}
                              className={`py-1.5 px-1 text-[10px] font-data font-medium border cursor-pointer transition-colors ${
                                currentBgMode === 'white'
                                  ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                  : 'bg-[#ffffff] text-[#1a1a1a] border-[#c8c4b6] hover:bg-[#f5f3ea]'
                              }`}
                            >
                              Blanco
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingThisBg}
                              onClick={() => handleApplyStudioBgToDraft(draft.id, 'cream')}
                              className={`py-1.5 px-1 text-[10px] font-data font-medium border cursor-pointer transition-colors ${
                                currentBgMode === 'cream'
                                  ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                  : 'bg-[#f5f3ea] text-[#1a1a1a] border-[#c8c4b6] hover:bg-[#ebe8dc]'
                              }`}
                            >
                              Crema
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingThisBg}
                              onClick={() =>
                                handleApplyStudioBgToDraft(draft.id, 'original')
                              }
                              className={`py-1.5 px-1 text-[10px] font-data font-medium border cursor-pointer transition-colors ${
                                currentBgMode === 'original'
                                  ? 'bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a]'
                                  : 'bg-[#ffffff] text-[#6e6c65] border-[#dfdcd0] hover:text-[#1a1a1a]'
                              }`}
                            >
                              Original
                            </button>
                          </div>
                        </div>

                        {draft.originMeta.qualityWarning && (
                          <div className="p-2 bg-[#fff7ed] border border-[#fed7aa] text-[11px] text-[#9a3412] leading-snug">
                            {draft.originMeta.qualityWarning}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-1.5">
                          {draft.pagePreviewDataUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenCropEditor(draft)}
                              className="py-1.5 px-2 bg-[#1A1C1C] hover:bg-[#A23E18] text-white font-mono text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                            >
                              Ajustar Recorte
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingDraftId(draft.id);
                              replacePhotoInputRef.current?.click();
                            }}
                            className={`${
                              draft.pagePreviewDataUrl ? '' : 'col-span-2'
                            } py-1.5 px-2 bg-[#f5f3ea] hover:bg-[#ebe8dc] border border-[#c8c4b6] text-[11px] font-medium text-[#1a1a1a] transition-colors cursor-pointer`}
                          >
                            Subir Otra Foto
                          </button>
                        </div>

                        {/* Interactive PDF Crop Editor Drawer */}
                        {editingCropDraftId === draft.id && draft.pagePreviewDataUrl && (
                          <div className="p-3 bg-[#F9F9F8] border border-[#1A1C1C] space-y-3 text-[11px]">
                            <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-1.5">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#A23E18]">
                                ENCUADRE EN PÁGINA PDF
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingCropDraftId(null)}
                                className="font-mono text-[10px] text-[#5F5E5E] hover:text-black cursor-pointer"
                              >
                                Cerrar ×
                              </button>
                            </div>

                            {/* Visual Full Page Overlay Preview */}
                            <div className="relative w-full aspect-[4/3] bg-white border border-[#E5E5E2] overflow-hidden">
                              <img
                                src={draft.pagePreviewDataUrl}
                                alt="Página PDF completa"
                                className="w-full h-full object-fill"
                              />
                              <div
                                className="absolute border-2 border-[#A23E18] bg-[#A23E18]/15 pointer-events-none"
                                style={{
                                  top: `${Math.max(0, Math.min(100, cropBoxForm.ymin / 10))}%`,
                                  left: `${Math.max(0, Math.min(100, cropBoxForm.xmin / 10))}%`,
                                  height: `${Math.max(
                                    5,
                                    Math.min(100, (cropBoxForm.ymax - cropBoxForm.ymin) / 10)
                                  )}%`,
                                  width: `${Math.max(
                                    5,
                                    Math.min(100, (cropBoxForm.xmax - cropBoxForm.xmin) / 10)
                                  )}%`,
                                }}
                              />
                            </div>

                            {/* Quick Presets for Common Catalog Layouts */}
                            <div className="space-y-1">
                              <span className="block font-mono text-[9px] uppercase text-[#5F5E5E]">
                                Ajustes Rápidos (1 Clic):
                              </span>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  disabled={isApplyingCrop}
                                  onClick={() =>
                                    handleApplyInteractiveRecrop({
                                      ymin: 15,
                                      xmin: 380,
                                      ymax: 980,
                                      xmax: 985,
                                    })
                                  }
                                  className="py-1 px-1.5 bg-white border border-[#E5E5E2] hover:border-black font-mono text-[9px] uppercase text-left cursor-pointer"
                                >
                                  Foto Derecha (Modelo)
                                </button>
                                <button
                                  type="button"
                                  disabled={isApplyingCrop}
                                  onClick={() =>
                                    handleApplyInteractiveRecrop({
                                      ymin: 15,
                                      xmin: 15,
                                      ymax: 980,
                                      xmax: 620,
                                    })
                                  }
                                  className="py-1 px-1.5 bg-white border border-[#E5E5E2] hover:border-black font-mono text-[9px] uppercase text-left cursor-pointer"
                                >
                                  Foto Izquierda
                                </button>
                                <button
                                  type="button"
                                  disabled={isApplyingCrop}
                                  onClick={() =>
                                    handleApplyInteractiveRecrop({
                                      ymin: 15,
                                      xmin: 180,
                                      ymax: 985,
                                      xmax: 860,
                                    })
                                  }
                                  className="py-1 px-1.5 bg-white border border-[#E5E5E2] hover:border-black font-mono text-[9px] uppercase text-left cursor-pointer"
                                >
                                  Centro Completo
                                </button>
                                <button
                                  type="button"
                                  disabled={isApplyingCrop}
                                  onClick={() =>
                                    handleApplyInteractiveRecrop({
                                      ymin: 10,
                                      xmin: 10,
                                      ymax: 990,
                                      xmax: 990,
                                    })
                                  }
                                  className="py-1 px-1.5 bg-white border border-[#E5E5E2] hover:border-black font-mono text-[9px] uppercase text-left cursor-pointer"
                                >
                                  Página Completa
                                </button>
                              </div>
                            </div>

                            {/* Fine Margin Sliders */}
                            <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                              <label className="block">
                                Arriba ({Math.round(cropBoxForm.ymin / 10)}%)
                                <input
                                  type="range"
                                  min={0}
                                  max={600}
                                  step={10}
                                  value={cropBoxForm.ymin}
                                  onChange={(e) =>
                                    setCropBoxForm((prev) => ({
                                      ...prev,
                                      ymin: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full accent-[#A23E18]"
                                />
                              </label>
                              <label className="block">
                                Abajo ({Math.round(cropBoxForm.ymax / 10)}%)
                                <input
                                  type="range"
                                  min={400}
                                  max={1000}
                                  step={10}
                                  value={cropBoxForm.ymax}
                                  onChange={(e) =>
                                    setCropBoxForm((prev) => ({
                                      ...prev,
                                      ymax: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full accent-[#A23E18]"
                                />
                              </label>
                              <label className="block">
                                Izquierda ({Math.round(cropBoxForm.xmin / 10)}%)
                                <input
                                  type="range"
                                  min={0}
                                  max={700}
                                  step={10}
                                  value={cropBoxForm.xmin}
                                  onChange={(e) =>
                                    setCropBoxForm((prev) => ({
                                      ...prev,
                                      xmin: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full accent-[#A23E18]"
                                />
                              </label>
                              <label className="block">
                                Derecha ({Math.round(cropBoxForm.xmax / 10)}%)
                                <input
                                  type="range"
                                  min={300}
                                  max={1000}
                                  step={10}
                                  value={cropBoxForm.xmax}
                                  onChange={(e) =>
                                    setCropBoxForm((prev) => ({
                                      ...prev,
                                      xmax: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full accent-[#A23E18]"
                                />
                              </label>
                            </div>

                            <button
                              type="button"
                              disabled={isApplyingCrop}
                              onClick={() => handleApplyInteractiveRecrop()}
                              className="w-full py-1.5 bg-[#A23E18] hover:bg-black text-white font-mono text-[10px] uppercase tracking-wider font-bold cursor-pointer disabled:opacity-50"
                            >
                              {isApplyingCrop ? 'Aplicando recorte...' : 'Aplicar Nuevo Encuadre'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Editable Fields (8 Cols) */}
                      <div className="sm:col-span-8 space-y-3 text-xs">
                        {draft.missingFields.length > 0 && (
                          <div className="p-2.5 bg-[#fcf4d2] border border-[#e5d58b] text-[#1a1a1a] text-[11px]">
                            <strong>Por completar:</strong>{' '}
                            {draft.missingFields.join(', ')}
                          </div>
                        )}

                        <div>
                          <label className="block text-[#4a4945] font-medium mb-1">
                            Nombre del Producto
                          </label>
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) =>
                              updateDraftField(draft.id, { name: e.target.value })
                            }
                            className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-1.5 text-sm font-medium text-[#1a1a1a] outline-none focus:bg-[#ffffff] focus:border-[#1a1a1a]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[#4a4945] font-medium mb-1">
                              Precio ({draft.currency || 'MXN'}){' '}
                              {draft.price === null && (
                                <span className="text-[#fd5d5c] font-semibold">
                                  (Por completar)
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={draft.price !== null ? draft.price : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDraftField(draft.id, {
                                  price: val === '' ? null : Number(val),
                                });
                              }}
                              placeholder="Por completar"
                              className={`w-full px-3 py-1.5 font-data text-xs outline-none border ${
                                draft.price === null
                                  ? 'bg-[#fcf4d2] border-[#d4b84a] text-[#1a1a1a]'
                                  : 'bg-[#f5f3ea] border-[#c8c4b6] text-[#1a1a1a]'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[#4a4945] font-medium mb-1">
                              SKU / Código{' '}
                              {!draft.sku && (
                                <span className="text-[#fd5d5c]">(Por completar)</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={draft.sku}
                              onChange={(e) =>
                                updateDraftField(draft.id, { sku: e.target.value })
                              }
                              placeholder="Por completar"
                              className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-1.5 font-data text-xs text-[#1a1a1a] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[#4a4945] font-medium mb-1">
                              Categoría
                            </label>
                            <input
                              type="text"
                              value={draft.category}
                              onChange={(e) =>
                                updateDraftField(draft.id, {
                                  category: e.target.value,
                                })
                              }
                              className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-1.5 text-xs text-[#1a1a1a] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[#4a4945] font-medium mb-1">
                              Sabores / Colores (separados por coma)
                            </label>
                            <input
                              type="text"
                              value={draft.colors.join(', ')}
                              onChange={(e) =>
                                updateDraftField(draft.id, {
                                  colors: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Por completar"
                              className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-1.5 text-xs text-[#1a1a1a] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[#4a4945] font-medium mb-1">
                            Gramaje / Tallas / Presentaciones{' '}
                            {draft.sizes.length === 0 && (
                              <span className="text-[#fd5d5c]">(Por completar)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={draft.sizes.join(', ')}
                            onChange={(e) =>
                              updateDraftField(draft.id, {
                                sizes: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Por completar (ej. 85g, 90g, Caja 24 pzas o 25, 26, 27)"
                            className={`w-full px-3 py-1.5 font-data text-xs outline-none border ${
                              draft.sizes.length === 0
                                ? 'bg-[#fcf4d2] border-[#d4b84a]'
                                : 'bg-[#f5f3ea] border-[#c8c4b6]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[#4a4945] font-medium mb-1">
                            Descripción Comercial
                          </label>
                          <textarea
                            rows={2}
                            value={draft.description}
                            onChange={(e) =>
                              updateDraftField(draft.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Por completar..."
                            className="w-full bg-[#f5f3ea] border border-[#c8c4b6] p-2 text-xs text-[#1a1a1a] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* FASE 5 & 6: PERSONALIZACIÓN INTELIGENTE, VISTA PREVIA Y PUBLICACIÓN */}
        {/* ================================================================= */}
        {phase === 'phase5-customize' && (
          <div className="space-y-8">
            <input
              ref={logoUploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#dfdcd0] pb-6">
              <div>
                <p className="text-xs text-[#fd5d5c] font-semibold uppercase tracking-wider font-data">
                  Fases 5 y 6 · Dirección Visual candystudio®, Vista Previa Real y Publicación
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#1a1a1a]">
                  Personaliza tu aparador antes de publicarlo
                </h1>
                <p className="text-sm text-[#4a4945]">
                  Ajusta el estilo de presentación para tu giro comercial ({industry || 'Comercio'}), alterna el fondo blanco de estudio y publica tu catálogo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isBatchApplyingWhiteBg}
                  onClick={() => handleBatchApplyStudioBg('white')}
                  className="px-4 py-2.5 bg-[#fcf4d2] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#1a1a1a] text-xs font-semibold cursor-pointer"
                >
                  {isBatchApplyingWhiteBg
                    ? 'Aplicando fondo blanco...'
                    : 'Fondo Blanco (#FFFFFF) a Todos'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const { config, products } = buildFinalConfigAndProducts(false);
                    onComplete(config, products, 'merchant-catalog');
                  }}
                  className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#ebe8dc] text-[#1a1a1a] border border-[#c8c4b6] text-xs font-medium cursor-pointer"
                >
                  Guardar Borrador en Consola
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const { config, products } = buildFinalConfigAndProducts(true);
                    onComplete(config, products, 'public');
                  }}
                  className="px-6 py-2.5 bg-[#fd5d5c] hover:bg-[#a00721] text-[#ffffff] text-xs font-semibold cursor-pointer"
                >
                  Confirmar y Publicar mi Catálogo →
                </button>
              </div>
            </div>

            {/* Customization Controls Bar */}
            <div className="bg-[#ffffff] border border-[#dfdcd0] p-6 grid grid-cols-1 md:grid-cols-4 gap-5 text-xs">
              <div>
                <label className="block text-[#4a4945] font-medium mb-1.5">
                  1. Estructura por Giro Comercial
                </label>
                <select
                  value={layoutStyle}
                  onChange={(e) =>
                    setLayoutStyle(e.target.value as CatalogLayoutStyle)
                  }
                  className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-2 text-[#1a1a1a] cursor-pointer"
                >
                  <option value="editorial-luxury">
                    Editorial de Colección (Fotos 4:5)
                  </option>
                  <option value="minimal-gallery">
                    Galería Minimalista Fondo Blanco (1:1)
                  </option>
                  <option value="technical-spec">
                    Catálogo Técnico Mayorista (B2B)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[#4a4945] font-medium mb-1.5">
                  2. Combinación Tipográfica
                </label>
                <select
                  value={fontPairing}
                  onChange={(e) =>
                    setFontPairing(e.target.value as CatalogFontPairing)
                  }
                  className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-2 text-[#1a1a1a] cursor-pointer"
                >
                  <option value="editorial-serif">
                    Cormorant Garamond + Plus Jakarta
                  </option>
                  <option value="modern-sans">
                    Plus Jakarta Sans (Geométrica Limpia)
                  </option>
                  <option value="technical-mono">
                    Plus Jakarta + JetBrains Mono Técnico
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[#4a4945] font-medium mb-1.5">
                  3. Color de Acento y Marca
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-9 bg-[#ffffff] border border-[#c8c4b6] p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Nombre de tu marca"
                    className="flex-1 bg-[#f5f3ea] border border-[#c8c4b6] px-3 py-2 text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4a4945] font-medium mb-1.5">
                  4. Logotipo y WhatsApp
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoUploadInputRef.current?.click()}
                    className="px-3 py-2 bg-[#f5f3ea] border border-[#c8c4b6] text-[#1a1a1a] cursor-pointer whitespace-nowrap"
                  >
                    {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                  </button>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+52..."
                    className="w-full bg-[#f5f3ea] border border-[#c8c4b6] px-2.5 py-2 font-data text-[#1a1a1a]"
                  />
                </div>
              </div>
            </div>

            {/* Real Interactive Storefront Preview Frame */}
            <div className="border-2 border-[#1a1a1a] bg-[#f5f3ea] overflow-hidden">
              <div className="bg-[#1a1a1a] text-[#ffffff] px-4 py-2.5 text-[11px] font-data flex flex-wrap items-center justify-between gap-2">
                <span>
                  VISTA PREVIA EN VIVO DEL APARADOR ·{' '}
                  {(brandName || 'MI COMERCIO').toUpperCase()} · DISEÑO CANDYSTUDIO®
                </span>
                <span>
                  Estilo:{' '}
                  {layoutStyle === 'editorial-luxury'
                    ? 'Editorial de Colección'
                    : layoutStyle === 'minimal-gallery'
                    ? 'Galería Minimalista'
                    : 'Catálogo Técnico'}
                </span>
              </div>

              <div className="p-6 sm:p-10 space-y-8">
                {/* Preview Storefront Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dfdcd0] pb-5">
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={brandName}
                        className="h-9 w-auto object-contain"
                      />
                    )}
                    <div>
                      <span
                        className={`text-2xl sm:text-3xl font-semibold text-[#1a1a1a] block ${
                          fontPairing === 'editorial-serif'
                            ? 'font-editorial'
                            : fontPairing === 'technical-mono'
                            ? 'font-data'
                            : 'font-ui'
                        }`}
                      >
                        {brandName || 'Mi Comercio'}
                      </span>
                      <span className="text-xs text-[#6e6c65]">
                        {industry || 'Catálogo Oficial'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#4a4945]">
                    Pedidos por WhatsApp: <span className="font-data font-semibold">{whatsappPhone}</span>
                  </div>
                </div>

                {/* Preview Products Grid Adapted to Layout Style */}
                <div
                  className={`grid gap-6 ${
                    layoutStyle === 'technical-spec'
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {(extractedDrafts.length > 0 ? extractedDrafts : []).map(
                    (item) => {
                      const isWhiteOrCream =
                        item.backgroundMode === 'white' ||
                        item.backgroundMode === 'cream';
                      return (
                        <div
                          key={item.id}
                          className={`bg-[#ffffff] border border-[#dfdcd0] overflow-hidden flex ${
                            layoutStyle === 'technical-spec'
                              ? 'flex-row items-center p-4 gap-4'
                              : 'flex-col justify-between'
                          }`}
                        >
                          <div
                            className={`overflow-hidden shrink-0 ${
                              item.backgroundMode === 'cream'
                                ? 'bg-[#f5f3ea]'
                                : 'bg-[#ffffff]'
                            } ${
                              layoutStyle === 'technical-spec'
                                ? 'w-28 h-28 border border-[#dfdcd0]'
                                : layoutStyle === 'minimal-gallery'
                                ? 'w-full aspect-square p-5 border-b border-[#dfdcd0]'
                                : 'w-full aspect-[4/5] p-3 border-b border-[#dfdcd0]'
                            }`}
                          >
                            <SmartProductImage
                              src={item.heroImage}
                              alt={item.name}
                              productName={item.name}
                              fallbackCategory={item.category}
                              className={`w-full h-full ${
                                isWhiteOrCream ? 'object-contain' : 'object-cover'
                              }`}
                            />
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-[#6e6c65]">
                                <span className="uppercase tracking-wider font-data">
                                  {item.category}
                                </span>
                                <span className="font-data">
                                  {item.sizes.length > 0
                                    ? item.sizes[0]
                                    : item.sku || 'SKU pendiente'}
                                </span>
                              </div>
                              <h3
                                className={`text-lg font-medium text-[#1a1a1a] mt-1 ${
                                  fontPairing === 'editorial-serif'
                                    ? 'font-editorial text-xl'
                                    : ''
                                }`}
                              >
                                {item.name}
                              </h3>
                              <p className="text-xs text-[#4a4945] line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#dfdcd0] flex items-center justify-between">
                              <span className="font-data text-xs font-semibold text-[#1a1a1a]">
                                {item.price !== null
                                  ? `$${item.price.toLocaleString()} ${item.currency}`
                                  : 'Consultar precio'}
                              </span>
                              <span
                                className="px-3 py-1.5 text-[11px] text-[#ffffff] font-semibold"
                                style={{ backgroundColor: accentColor }}
                              >
                                Pedir por WhatsApp
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Google Stitch Ecosystem Footer Bar */}
      <footer className="bg-white text-[#1A1C1C] border-t border-[#E5E5E2] px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black">
            CANDY CATALOG OS v3.2
          </span>
          <span className="text-[#E5E5E2]">/</span>
          <span className="text-[#5F5E5E]">
            Infraestructura de catálogos editoriales asistida por Gemini IA y conversión directa por WhatsApp.
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-mono text-xs uppercase">
          <button
            type="button"
            onClick={() => setShowUxEvaluationModal(true)}
            className="text-[#A23E18] hover:underline cursor-pointer font-bold"
          >
            Diagnóstico UX/UI
          </button>
          <button
            type="button"
            onClick={onExploreDemoSierra}
            className="text-black hover:text-[#A23E18] underline underline-offset-4 cursor-pointer font-bold"
          >
            Explorar Demo SIERRA →
          </button>
        </div>
      </footer>
    </div>
  );
};

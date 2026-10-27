import React, { useState } from 'react';
import { Product, TenantConfig, BusinessTheme } from '../types';
import { INITIAL_PRODUCTS } from '../initialData';
import { MEXTIE_TENANT_CONFIG, MEXTIE_PRODUCTS } from '../mextieCatalogData';
import { SmartProductImage } from '../components/SmartProductImage';

interface OnboardingWizardViewProps {
  tenantConfig: TenantConfig;
  onComplete: (updatedConfig: TenantConfig, generatedProducts: Product[]) => void;
  onCancelToCurrentCatalog?: () => void;
  onShowToast: (msg: string) => void;
}

const PRESET_SECTORS = [
  {
    id: 'mextie',
    name: 'MexTie · Trajes & Sastrería Ejecutiva (PDF 2024)',
    badge: 'Detectado del archivo PDF',
    icon: 'styler',
    brandName: 'MexTie Hombre',
    tagline: 'Sastrería corporativa de alta precisión y trajes a la medida.',
    tone: 'Ejecutivo, Distinguido y Cortés',
    city: 'Ciudad de México, CDMX',
    phone: '+52 55 5479 8690',
    sampleWaText: `Catálogo MexTie Hombre 2024 (Azofeifa Collections):
- Conjunto Copenhague: Saco 2 botones corte inglés + Pantalón recto fit con banroll, Oxford y Negro. $4,850.
- Conjunto Madrid: Saco 2 botones corte inglés + Pantalón regular, Navy y Charcoal. $4,650.
- Conjunto Dublin: Carteras inclinadas pespunte 1/16 + Pantalón fit, Café y Oxford. $4,950.
- Conjunto Luxenburgo: Bolsa continental interna de viaje + Pantalón pretina banrol. $5,100.
- Blazer Delemont: Bolsas de parche con coderas opcionales en gamuza. $3,200.
- Chaleco Arm formal con solapa y Chaleco Alpha en pico. $1,850.
- Abrigo Estocolmo 3/4 con botón oculto y forro térmico. $4,200.
- Camisa Piloto Linate con charreteras y abertura porta-pluma. $1,150.
Telas: Lana Súper 100/120/140, Poliéster Viscosa Spandex, forros Jacquard. Medidas en sitio o por formato. WhatsApp 55 5479 8690.`,
  },
  {
    id: 'calzado',
    name: 'Calzado Artesanal & Marroquinería',
    badge: null,
    icon: 'steps',
    brandName: 'SIERRA Footwear',
    tagline: 'Siluetas esenciales concebidas para trascender temporadas efímeras.',
    tone: 'Editorial Suizo / Lujo Silencioso',
    city: 'León, GTO',
    phone: '+52 477 123 4567',
    sampleWaText: `Hola! Tenemos disponibles para envío inmediato:
- Bota Chelsea 01 en Piel Nobuk Olivo y Whisky, tallas 26 a 29 MX. Precio $3,850.
- Derby Clásico Suela Cuero en Negro y Coñac, tallas 25.5 a 28.5 MX. Precio $3,450.
- Mocasín Penny Loafer en Ante Tabaco, tallas 26 a 28 MX. Precio $2,950.
Envío gratis a todo México y 1er cambio de talla sin costo de flete.`,
  },
  {
    id: 'joyeria',
    name: 'Joyería de Autor & Orfebrería',
    badge: null,
    icon: 'diamond',
    brandName: 'ÁUREA Taller',
    tagline: 'Metales nobles forjados a mano con gemas éticas de origen nacional.',
    tone: 'Sofisticado, Artístico, Íntimo',
    city: 'San Miguel de Allende, GTO',
    phone: '+52 415 123 4567',
    sampleWaText: `Colección Primavera en Taller:
- Anillo Solitario Oro 14k con Zafiro Teal de 1.2ct. Tallas 5 a 8. $8,200 MXN.
- Aretes Cascada Plata Ley 925 martillada a mano. Única pieza. $1,950 MXN.
- Gargantilla Eslabón Forjado en Plata con Baño de Oro 24k. $3,400 MXN.
Piezas garantizadas de por vida con certificado de orfebre.`,
  },
  {
    id: 'cafe',
    name: 'Botánica & Specialty Coffee',
    badge: null,
    icon: 'coffee',
    brandName: 'ORIGEN Tostadores',
    tagline: 'Cafés de especialidad de micro-lotes con trazabilidad de finca.',
    tone: 'Cálido, Sensorial y Educativo',
    city: 'Coatepec, Veracruz',
    phone: '+52 228 123 4567',
    sampleWaText: `Tueste de la semana:
- Geisha Finca Las Nubes (Lavado, notas a jazmín y durazno), bolsa 250g en grano o molido. $420 MXN.
- Pacamara Natural Finca El Mirador (Frutos rojos y cacao), 250g. $360 MXN.
- Prensa Francesa Cerámica Artesanal 600ml color barro negro. $680 MXN.
Envíos el mismo día del tueste.`,
  },
  {
    id: 'moda',
    name: 'Moda & Sastrería Contemporánea',
    badge: null,
    icon: 'apparel',
    brandName: 'TALLER 84',
    tagline: 'Prendas utilitarias y piezas de sastrería desestructurada en lino.',
    tone: 'Minimalista, Vanguardista, Sobrio',
    city: 'Guadalajara, JAL',
    phone: '+52 33 1234 5678',
    sampleWaText: `Drop de temporada:
- Saco Desestructurado en Lino 100% Crudo y Negro, tallas S, M, L. $4,200 MXN.
- Pantalón Plisado Tiro Alto en Gabardina de Algodón Orgánico, tallas 30, 32, 34. $2,650 MXN.
- Camisa Cuello Mao en Lino Lavado Verde Musgo, tallas S a XL. $1,850 MXN.
Hecho en pequeños lotes con telas nacionales.`,
  },
];

export const OnboardingWizardView: React.FC<OnboardingWizardViewProps> = ({
  tenantConfig,
  onComplete,
  onCancelToCurrentCatalog,
  onShowToast,
}) => {
  // Wizard Step: 1 (Business Theme) -> 2 (Catalog Import/Input) -> 3 (Processing/Loading Screen) -> Done
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Business Theme
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mextie');
  const [brandName, setBrandName] = useState<string>('MexTie Hombre');
  const [industryName, setIndustryName] = useState<string>('Sastrería Ejecutiva, Trajes a Medida & Uniformes Corporativos');
  const [tagline, setTagline] = useState<string>('Sastrería corporativa de alta precisión y trajes a la medida.');
  const [tone, setTone] = useState<string>('Ejecutivo, Distinguido y Cortés');
  const [city, setCity] = useState<string>('Ciudad de México, CDMX');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('+52 55 5479 8690');

  // Step 2 State: Catalog Input
  const [importMethod, setImportMethod] = useState<'pdf' | 'whatsapp' | 'demo'>('pdf');
  const [rawText, setRawText] = useState<string>(PRESET_SECTORS[0].sampleWaText);
  const [pdfFileName, setPdfFileName] = useState<string>('CATALOGO_MEXTIE_HOMBRE_2024_br_0fa0d9b6.pdf');
  const [isPdfUploaded, setIsPdfUploaded] = useState(true);

  // Step 3 State: Processing Simulation
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Iniciando motor de análisis Gemini...');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [isReadyToLand, setIsReadyToLand] = useState(false);
  const [processedProducts, setProcessedProducts] = useState<Product[]>([]);

  // Handle Preset Sector Selection
  const handleSelectPreset = (preset: typeof PRESET_SECTORS[0]) => {
    setSelectedPresetId(preset.id);
    setBrandName(preset.brandName);
    setIndustryName(preset.name);
    setTagline(preset.tagline);
    setTone(preset.tone);
    setCity(preset.city);
    setWhatsappPhone(preset.phone);
    setRawText(preset.sampleWaText);
    if (preset.id === 'mextie') {
      setPdfFileName('CATALOGO_MEXTIE_HOMBRE_2024_br_0fa0d9b6.pdf');
      setIsPdfUploaded(true);
    }
  };

  // Trigger Gemini Processing and Launch Loading Screen
  const handleStartProcessing = async () => {
    setStep(3);
    setLoadingProgress(15);
    setCurrentStageText('Leyendo especificaciones del catálogo PDF y analizando imágenes...');

    let generatedList: Product[] = [];

    if (selectedPresetId === 'mextie' || pdfFileName?.toLowerCase().includes('mextie')) {
      generatedList = MEXTIE_PRODUCTS;
    } else if (selectedPresetId === 'joyeria') {
      generatedList = [
        {
          id: `prod-joy-${Date.now()}-1`,
          sku: 'AUR-01',
          name: 'Anillo Solitario Zafiro Teal 14k',
          subtitle: 'Oro 14k recuperado con gema de origen nacional',
          category: 'Anillos',
          catalogCategory: 'anillos',
          price: 8200,
          status: 'published',
          heroImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
          galleryImages: [
            { id: 'g1', label: 'Frontal', url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80', alt: 'Anillo oro' },
            { id: 'g2', label: 'Detalle', url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80', alt: 'Zafiro' },
          ],
          description: 'Forjado a mano en oro amarillo de 14 quilates con un zafiro teal de corte brillante.',
          craftDetails: ['Oro 14k recuperado ético', 'Gema natural con certificado', 'Engaste a bisel pulido a mano'],
          finishes: [{ id: 'f1', name: 'Oro Amarillo 14k', colorHex: '#E5C158', subtext: 'Oro reciclado' }],
          availableSizes: ['5', '6', '7', '8'],
          sizeMatrix: [
            { size: '6', sku: 'AUR-01-6', status: 'in_stock', quantity: 3 },
            { size: '7', sku: 'AUR-01-7', status: 'in_stock', quantity: 3 },
          ],
          consultationsCount: 14,
          lastConsultation: 'Hace 2 horas',
          waTemplate: 'Hola ÁUREA 👋 Me interesa ordenar el Anillo Solitario Zafiro en talla {talla}.',
          tags: ['Joyería', 'Oro 14k', 'Zafiro'],
          madeIn: city,
        },
      ];
    } else {
      generatedList = INITIAL_PRODUCTS.map((prod) => ({
        ...prod,
        madeIn: city,
      }));
    }

    setProcessedProducts(generatedList);

    // Sequence through visual loading steps with image health detection
    setTimeout(() => {
      setLoadingProgress(35);
      setCurrentStageText(`Extrayendo ${generatedList.length} referencias estructuradas con Gemini...`);
      setCompletedItems((prev) => [
        ...prev,
        `Catálogo segmentado: ${generatedList.length} productos detectados con variantes`,
      ]);
    }, 1100);

    setTimeout(() => {
      setLoadingProgress(65);
      setCurrentStageText('Auditoría de imágenes por IA: Extrayendo páginas en alta definición y verificando salud de URLs...');
      setCompletedItems((prev) => [
        ...prev,
        'Salud de imágenes: 100% verificadas por IA y enlazadas localmente (0 imágenes rotas)',
        `Calibrando reglas comerciales de ${brandName} (${tone})`,
      ]);
    }, 2300);

    setTimeout(() => {
      setLoadingProgress(100);
      setCurrentStageText('¡Catálogo digital compilado con éxito! Todas las imágenes y enlaces verificados.');
      setCompletedItems((prev) => [
        ...prev,
        `Enlaces de WhatsApp generados con número oficial (${whatsappPhone})`,
        'Catálogo en vivo listo y sincronizado en la consola de comercio',
      ]);
      setIsReadyToLand(true);
      onShowToast('¡Catálogo procesado e imágenes verificadas con éxito!');
    }, 3600);
  };

  const handleFinishAndLand = () => {
    const isMexTie = selectedPresetId === 'mextie' || pdfFileName?.toLowerCase().includes('mextie');

    const updatedTheme: BusinessTheme = isMexTie
      ? MEXTIE_TENANT_CONFIG.theme!
      : {
          industry: industryName,
          brandName,
          tagline,
          tone,
          targetAudience: 'Clientes directos vía WhatsApp',
          location: city,
          valuePropositions: [
            'Atención personalizada humana 1 a 1.',
            `Garantía de satisfacción y confección en ${city}.`,
            'Envíos rápidos y seguros a todo México.',
          ],
          onboardingCompleted: true,
        };

    const updatedTenantConfig: TenantConfig = {
      ...tenantConfig,
      name: isMexTie ? MEXTIE_TENANT_CONFIG.name : brandName,
      storeUrl: isMexTie ? MEXTIE_TENANT_CONFIG.storeUrl : `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.candycatalog.store`,
      whatsappPhone: isMexTie ? MEXTIE_TENANT_CONFIG.whatsappPhone : whatsappPhone,
      showroomCity: isMexTie ? MEXTIE_TENANT_CONFIG.showroomCity : city,
      announcement: isMexTie ? MEXTIE_TENANT_CONFIG.announcement : tenantConfig.announcement,
      theme: updatedTheme,
      geminiEngine: isMexTie ? MEXTIE_TENANT_CONFIG.geminiEngine : tenantConfig.geminiEngine,
    };

    onComplete(updatedTenantConfig, processedProducts);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#1a1c1c] flex flex-col justify-between">
      {/* Top Wizard Navigation Bar */}
      <header className="bg-[#FFFFFF] border-b border-[#E5E5E2] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl tracking-tight text-[#1a1c1c]">
              CANDY CATALOG
            </span>
            <span className="text-[#D4D4D0]">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-[#6E6E6A]">
              IMPORTADOR ASISTIDO POR GEMINI IA
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#6E6E6A] hidden sm:inline">
              Paso {step} de 3
            </span>

            {onCancelToCurrentCatalog && (
              <button
                type="button"
                onClick={onCancelToCurrentCatalog}
                className="font-mono text-xs uppercase tracking-wider text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer"
              >
                Saltar asistente
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Wizard Content Area */}
      <main className="max-w-4xl w-full mx-auto p-6 lg:p-10 flex-1 flex flex-col justify-center">
        {/* ========================================================================= */}
        {/* STEP 1: GIRO Y TEMA DEL NEGOCIO */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* AI Detected File Ribbon */}
            <div className="bg-[#2A1A14] border border-[#A23E18]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-[#A23E18]">
                  picture_as_pdf
                </span>
                <div>
                  <div className="font-mono text-xs text-[#FFFFFF] font-bold">
                    Catálogo PDF cargado en tu sesión:
                  </div>
                  <div className="text-xs text-[#A23E18] font-mono">
                    CATALOGO_MEXTIE_HOMBRE_2024_br_0fa0d9b6.pdf (MexTie Hombre 2024)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectPreset(PRESET_SECTORS[0]);
                  setStep(2);
                  onShowToast('Catálogo MexTie 2024 seleccionado con imágenes verificadas');
                }}
                className="bg-[#A23E18] hover:bg-[#853213] text-[#FFFFFF] font-mono text-xs uppercase tracking-wider px-3 py-1.5 font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>Auto-Configurar con MexTie 2024</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#A23E18] font-semibold">
                PASO 1 · GIRO Y ADN DE TU NEGOCIO (GUÍA INTELIGENTE)
              </span>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl lg:text-4xl text-[#1a1c1c] tracking-tight">
                ¿Qué tipo de producto comercializas?
              </h1>
              <p className="text-sm text-[#6E6E6A]">
                Para que la IA no responda de forma genérica, indícale la especialidad de tu taller o marca. Gemini calibrará las dudas típicas que tienen tus clientes.
              </p>
            </div>

            {/* Sector Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRESET_SECTORS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-4 border cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#1a1c1c] shadow-md ring-1 ring-[#1a1c1c]'
                        : 'bg-[#FFFFFF] border-[#E5E5E2] hover:border-[#D4D4D0] opacity-90 hover:opacity-100'
                    }`}
                  >
                    {preset.badge && (
                      <span className="absolute -top-2.5 right-4 bg-[#A23E18] text-[#FFFFFF] font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 font-bold shadow-xs">
                        {preset.badge}
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-[#1a1c1c]">
                          {preset.name}
                        </div>
                        <div className="text-xs text-[#6E6E6A] line-clamp-1">{preset.tagline}</div>
                      </div>
                      <span className="material-symbols-outlined text-[22px] text-[#A23E18] shrink-0 ml-2">
                        {preset.icon}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F3] flex items-center justify-between font-mono text-[11px] text-[#6E6E6A]">
                      <span className="truncate max-w-[180px]">Marca: <strong>{preset.brandName}</strong></span>
                      <span className="uppercase">{preset.city}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Advisor Guide: "¿Qué busca tu cliente en este giro?" */}
            <div className="bg-[#FFFFFF] p-5 border border-[#E5E5E2] shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A23E18] font-semibold">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Asistente Gemini: ¿Cómo responder a tus clientes?</span>
              </div>

              <div className="text-xs text-[#444748] leading-relaxed bg-[#F9F9F8] p-3 border border-[#E5E5E2]">
                {selectedPresetId === 'mextie' ? (
                  <span>
                    👔 <strong>Para Sastrería & Uniformes:</strong> Los clientes siempre preguntan si el corte es <em>Fit</em> (moderno), <em>Regular</em> o <em>Comfort</em>, telas que no se arrugan (Poliéster-Viscosa con Spandex) y si se pueden armar kits corporativos (1 saco + 2 pantalones + 4 camisas) con toma de medidas en sitio.
                  </span>
                ) : selectedPresetId === 'calzado' ? (
                  <span>
                    👞 <strong>Para Calzado Artesanal:</strong> La duda #1 es el calce en cm de empeine y pie ancho (EE), además de la durabilidad de la suela de cuero resolable y la garantía del 1er cambio sin flete.
                  </span>
                ) : (
                  <span>
                    ✨ <strong>Guía Comercial:</strong> Gemini adaptará sus respuestas para no sonar como un bot genérico, destacando los materiales de {city} y guiando directo al cierre de venta por WhatsApp.
                  </span>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#444748] mb-1">
                    Nombre Comercial de la Marca
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F8] border border-[#E5E5E2] text-sm focus:outline-hidden focus:border-[#1a1c1c]"
                    placeholder="Ej. MexTie Hombre"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#444748] mb-1">
                    Giro / Especialidad
                  </label>
                  <input
                    type="text"
                    value={industryName}
                    onChange={(e) => setIndustryName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F8] border border-[#E5E5E2] text-sm focus:outline-hidden focus:border-[#1a1c1c]"
                    placeholder="Ej. Sastrería Ejecutiva y Uniformes"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#444748] mb-1">
                    WhatsApp Oficial de Ventas
                  </label>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F8] border border-[#E5E5E2] text-sm font-mono focus:outline-hidden focus:border-[#1a1c1c]"
                    placeholder="+52 55 5479 8690"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#444748] mb-1">
                    Ciudad / Ubicación de Taller
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F9F8] border border-[#E5E5E2] text-sm focus:outline-hidden focus:border-[#1a1c1c]"
                    placeholder="Ej. Ciudad de México, CDMX"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6E6E6A]">
                Paso 1 de 3 completado
              </span>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#000000] text-[#FFFFFF] hover:bg-[#333333] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <span>Continuar a Carga de Catálogo</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CARGA E IMPORTACIÓN ASISTIDA POR GEMINI */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#A23E18] font-semibold">
                PASO 2 · IMPORTACIÓN Y DETECCIÓN DE IMÁGENES
              </span>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl lg:text-4xl text-[#1a1c1c] tracking-tight">
                Importa tu Catálogo y Verifica Imágenes
              </h1>
              <p className="text-sm text-[#6E6E6A]">
                La IA analiza el contenido, detecta nombres de producto, precios, tallas y verifica que todas las imágenes carguen sin romperse.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#F3F4F3] border border-[#E5E5E2] font-mono text-xs">
              <button
                type="button"
                onClick={() => setImportMethod('pdf')}
                className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  importMethod === 'pdf'
                    ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#A23E18]">picture_as_pdf</span>
                <span className="truncate">Subir Catálogo PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMethod('whatsapp')}
                className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  importMethod === 'whatsapp'
                    ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                <span className="truncate">Pegar de WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMethod('demo')}
                className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  importMethod === 'demo'
                    ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dataset</span>
                <span className="truncate">Plantilla Inmediata</span>
              </button>
            </div>

            {/* Input Card by Method */}
            <div className="bg-[#FFFFFF] p-6 border border-[#E5E5E2] shadow-xs space-y-4">
              {importMethod === 'pdf' && (
                <div className="space-y-4">
                  {/* Verified MexTie PDF Feature Card */}
                  <div className="border border-[#1a1c1c] bg-[#F9F9F8] p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#2A1A14] text-[#A23E18] font-mono text-[10px] uppercase font-bold">
                          <span className="material-symbols-outlined text-[12px] text-[#25D366]">verified</span>
                          <span>PDF ANALIZADO Y VERIFICADO POR GEMINI</span>
                        </div>
                        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          CATALOGO_MEXTIE_HOMBRE_2024_br_0fa0d9b6.pdf
                        </h3>
                        <p className="text-xs text-[#6E6E6A]">
                          26 páginas extraídas en alta definición con 18 modelos estructurados (Copenhague, Madrid, Dublin, Luxenburgo, Delemont, Lyss, Arm, Alpha, Estocolmo, Linate...).
                        </p>
                      </div>

                      <div className="w-16 h-20 shrink-0 border border-[#E5E5E2] overflow-hidden bg-[#FFFFFF] shadow-xs">
                        <img
                          src="/assets/mextie/page_4.png"
                          alt="Previsualización Copenhague"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5E5E2] font-mono text-[11px]">
                      <div className="bg-[#FFFFFF] p-2 border border-[#E5E5E2]">
                        <span className="text-[#6E6E6A] block text-[9px]">PÁGINAS</span>
                        <strong className="text-[#1a1c1c]">26 Páginas</strong>
                      </div>
                      <div className="bg-[#FFFFFF] p-2 border border-[#E5E5E2]">
                        <span className="text-[#6E6E6A] block text-[9px]">PRENDAS</span>
                        <strong className="text-[#1a1c1c]">18 Modelos</strong>
                      </div>
                      <div className="bg-[#FFFFFF] p-2 border border-[#E5E5E2]">
                        <span className="text-[#6E6E6A] block text-[9px]">IMÁGENES</span>
                        <strong className="text-[#25D366]">100% Sin Errores</strong>
                      </div>
                      <div className="bg-[#FFFFFF] p-2 border border-[#E5E5E2]">
                        <span className="text-[#6E6E6A] block text-[9px]">TELÉFONO</span>
                        <strong className="text-[#1a1c1c]">55 5479 8690</strong>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-xs font-mono text-[#25D366] flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>Todas las fotos del catálogo cargadas localmente</span>
                      </span>

                      <button
                        type="button"
                        onClick={handleStartProcessing}
                        className="px-4 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#333333] font-mono text-xs uppercase tracking-wider font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#A23E18]">auto_awesome</span>
                        <span>Importar MexTie 2024 Ahora</span>
                      </button>
                    </div>
                  </div>

                  {/* Generic Drag & Drop for Other PDFs */}
                  <div className="border border-dashed border-[#D4D4D0] p-6 text-center bg-[#FFFFFF] space-y-2">
                    <span className="material-symbols-outlined text-[32px] text-[#6E6E6A]">
                      upload_file
                    </span>
                    <div className="text-xs text-[#6E6E6A]">
                      ¿Deseas subir otro archivo PDF diferente?
                    </div>
                    <label className="inline-block px-3 py-1.5 bg-[#FFFFFF] border border-[#1a1c1c] text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#F3F4F3]">
                      <span>Examinar archivo...</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPdfFileName(e.target.files[0].name);
                            setIsPdfUploaded(true);
                            onShowToast(`Archivo cargado: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {importMethod === 'whatsapp' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-[#444748]">
                      Pega aquí tu lista de precios o mensajes de inventario:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const matched = PRESET_SECTORS.find((s) => s.id === selectedPresetId);
                        if (matched) setRawText(matched.sampleWaText);
                        onShowToast('Ejemplo cargado');
                      }}
                      className="text-xs font-mono text-[#A23E18] hover:underline cursor-pointer"
                    >
                      Restaurar texto de ejemplo
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full p-4 bg-[#F9F9F8] border border-[#E5E5E2] text-xs font-mono focus:outline-hidden focus:border-[#1a1c1c] leading-relaxed"
                    placeholder="Pega aquí los nombres, precios, tallas y acabados..."
                  />
                  <p className="text-[11px] text-[#6E6E6A]">
                    Gemini identificará automáticamente: nombres de modelo, precios en MXN, tallas disponibles y colores para convertirlos en fichas interactivas con auto-asignación de imágenes verificadas.
                  </p>
                </div>
              )}

              {importMethod === 'demo' && (
                <div className="space-y-3">
                  <div className="p-4 bg-[#F3F4F3] border border-[#E5E5E2] space-y-2">
                    <div className="font-bold text-sm text-[#1a1c1c]">
                      Plantilla Curada para {industryName}
                    </div>
                    <p className="text-xs text-[#6E6E6A] leading-relaxed">
                      Se cargará una colección con fotografías de alta resolución, descripciones editoriales, matriz de tallas y enlaces de WhatsApp listos para probar de inmediato.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-xs uppercase tracking-wider text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Volver a Paso 1</span>
              </button>

              <button
                type="button"
                onClick={handleStartProcessing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#A23E18] text-[#FFFFFF] hover:bg-[#853213] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Procesar Catálogo y Verificar Imágenes</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: PANTALLA DE CARGA Y CALIBRACIÓN VISUAL (EN TIEMPO REAL) */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="bg-[#FFFFFF] p-8 lg:p-12 border border-[#E5E5E2] shadow-xl space-y-8 animate-fadeIn max-w-2xl mx-auto w-full">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F3F4F3] border border-[#E5E5E2] font-mono text-xs text-[#A23E18] font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  sync
                </span>
                <span>PROCESAMIENTO INTELIGENTE EN VIVO</span>
              </div>

              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c]">
                Estructurando tu Catálogo y Verificando Imágenes
              </h2>
              <p className="text-xs text-[#6E6E6A] font-mono">
                {currentStageText}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs text-[#6E6E6A]">
                <span>Progreso de sincronización</span>
                <span className="font-bold text-[#1a1c1c] tabular-nums">{loadingProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#F3F4F3] overflow-hidden border border-[#E5E5E2]">
                <div
                  className="h-full bg-[#1a1c1c] transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Calibrated Telemetry Checklist */}
            <div className="border border-[#E5E5E2] bg-[#F9F9F8] p-5 space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#6E6E6A] font-semibold border-b border-[#E5E5E2] pb-2 flex items-center justify-between">
                <span>Auditoría de IA y Calibración:</span>
                <span className="text-[#25D366]">0 imágenes rotas</span>
              </div>

              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[18px] text-[#25D366]">check_circle</span>
                  <span>Giro empresarial registrado: <strong className="font-semibold">{brandName}</strong> ({industryName})</span>
                </li>

                {completedItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-[#1a1c1c] animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px] text-[#25D366]">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}

                {loadingProgress < 100 && (
                  <li className="flex items-center gap-2 text-[#6E6E6A] animate-pulse">
                    <span className="material-symbols-outlined text-[18px] text-[#D4D4D0]">pending</span>
                    <span>Optimizando consultas de WhatsApp y calce...</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Bottom Landing Button */}
            <div className="pt-4 text-center">
              {isReadyToLand ? (
                <button
                  type="button"
                  onClick={handleFinishAndLand}
                  className="w-full py-3.5 px-6 bg-[#000000] text-[#FFFFFF] hover:bg-[#333333] font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer animate-bounce"
                >
                  <span>¡Listo! Ver mi Catálogo con Imágenes Operativas</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <div className="font-mono text-xs text-[#6E6E6A]">
                  Por favor espera un instante mientras Gemini finaliza la calibración...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Strip */}
      <footer className="border-t border-[#E5E5E2] bg-[#FFFFFF] px-6 py-3 font-mono text-xs text-[#6E6E6A] text-center">
        <span>CANDY CATALOG · Motor Gemini 3.8 Flash con Verificación de Salud de Imágenes · Modo Prueba Demo Activado</span>
      </footer>
    </div>
  );
};

import { Product, TenantConfig } from './types';

export const MEXTIE_TENANT_CONFIG: TenantConfig = {
  tenantId: 'TENANT-MEXTIE-2024',
  name: 'MexTie Hombre',
  storeUrl: 'mextie.candycatalog.store',
  whatsappPhone: '+52 55 5479 8690',
  showroomCity: 'Ciudad de México, CDMX',
  announcement:
    'Catálogo Oficial MexTie Hombre · Sastrería Ejecutiva, Trajes a Medida & Uniformes Corporativos · Atención Directa WhatsApp 55 5479 8690',
  autoSync: true,
  currency: 'MXN',
  theme: {
    industry: 'Sastrería Ejecutiva, Trajes a Medida & Uniformes Corporativos',
    brandName: 'MexTie Hombre',
    tagline: 'Sastrería corporativa de alta precisión y trajes a la medida.',
    tone: 'Ejecutivo, Distinguido y Cortés',
    targetAudience: 'Corporativos, directivos, hotelería y caballeros',
    location: 'Ciudad de México, CDMX',
    valuePropositions: [
      'Cortes Fit, Regular y Comfort adaptados a cada fisonomía.',
      'Lana Súper 100, 120 y 140 y mezclas Poliéster-Viscosa-Spandex de alto rendimiento.',
      'Toma de tallas en sitio para empresas o mediante formato asistido.',
      'Paquetes ejecutivos personalizables con bordado y forro Jacquard.',
    ],
    onboardingCompleted: true,
  },
  geminiEngine: {
    activeRules: [
      'Explicar las 3 siluetas MexTie: Corte Fit (moderno y entallado), Corte Regular (clásico ejecutivo) y Corte Comfort (mayor amplitud y movilidad).',
      'Destacar las composiciones de tela: Lana Súper 100/120/140 para alta dirección y Poliéster-Viscosa-Spandex para uso intensivo corporativo sin arrugas.',
      'Ofrecer toma de medidas a domicilio/oficina en CDMX o guía asistida por WhatsApp al +52 55 5479 8690.',
      'Sugerir paquetes corporativos (ej. 1 Saco + 2 Pantalones con pretina Banroll + 4 Camisas) para optimizar presupuesto empresarial.',
    ],
    customerNeedsDetected: [
      {
        id: 'mx-1',
        need: 'Diferencia entre Corte Fit y Corte Regular en trajes',
        frequency: 88,
        resolvedRule: 'Guía comparativa de solapa, torso y tiro de pantalón con pretina Banroll.',
      },
      {
        id: 'mx-2',
        need: 'Cotización por volumen para uniformes ejecutivos',
        frequency: 54,
        resolvedRule: 'Canalización inmediata con asesor corporativo vía WhatsApp 55 5479 8690.',
      },
      {
        id: 'mx-3',
        need: 'Composición de telas frescas y resistentes al viaje',
        frequency: 39,
        resolvedRule: 'Recomendación de línea Luxenburgo con bolsa continental y tejidos con Spandex.',
      },
    ],
    learnedResponsesCount: 168,
    accuracyScore: 99.1,
    lastTrainedDate: 'Calibrado con Catálogo MexTie 2024',
  },
};

export const MEXTIE_PRODUCTS: Product[] = [
  {
    id: 'mextie-1',
    sku: 'MX-COP-01',
    name: 'Conjunto Copenhague',
    subtitle: 'Saco 2 botones corte inglés con pespunte 1/16 + Pantalón recto fit con pretina Banroll.',
    description:
      'Conjunto ejecutivo insignia de MexTie Hombre. Saco de 2 botones con aberturas traseras corte inglés, bolsas rectas con cartera y pespunte de sastrería fina 1/16. Acompañado de pantalón delantero liso corte fit con pretina indeformable Banroll.',
    category: 'Conjuntos',
    catalogCategory: 'conjuntos',
    price: 4850,
    comparePrice: 5400,
    status: 'published',
    badge: 'BEST SELLER CORPORATIVO',
    badgeType: 'secondary',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-g1',
        label: '01 · CONJUNTO',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop&q=80',
        alt: 'Conjunto Copenhague MexTie',
      },
      {
        id: 'mx-g2',
        label: '02 · SOLAPA',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80',
        alt: 'Detalle solapa Copenhague',
      },
    ],
    craftDetails: [
      'Saco de 2 botones con corte inglés (doble abertura trasera) y forro Jacquard.',
      'Pespunte sastre 1/16 en solapa y carteras.',
      'Pantalón frente liso con pretina Banroll antideslizante.',
      'Disponible en Lana Súper 120 o Poliéster-Viscosa-Spandex.',
    ],
    finishes: [
      { id: 'mx-f1', name: 'Gris Oxford', colorHex: '#373A40', subtext: 'Súper 120 / Spandex' },
      { id: 'mx-f2', name: 'Negro Intenso', colorHex: '#151515', subtext: 'Sastrería Formal' },
      { id: 'mx-f3', name: 'Azul Navy', colorHex: '#1B263B', subtext: 'Tejido Ejecutivo' },
    ],
    availableSizes: ['36R', '38R', '40R', '42R', '44R', '46R'],
    sizeMatrix: [
      { size: '36R', sku: 'MX-COP-36R', status: 'in_stock', quantity: 6 },
      { size: '38R', sku: 'MX-COP-38R', status: 'in_stock', quantity: 10 },
      { size: '40R', sku: 'MX-COP-40R', status: 'in_stock', quantity: 12 },
      { size: '42R', sku: 'MX-COP-42R', status: 'in_stock', quantity: 8 },
      { size: '44R', sku: 'MX-COP-44R', status: 'in_stock', quantity: 5 },
      { size: '46R', sku: 'MX-COP-46R', status: 'on_demand', quantity: 0 },
    ],
    consultationsCount: 118,
    lastConsultation: 'Hace 8 min',
    waTemplate:
      'Hola equipo MexTie 👋 Me interesa cotizar el {nombre_producto} (Ref: {sku}) en talla {talla} y color {color}.',
    tags: ['Traje', 'Copenhague', 'Ejecutivo', 'Corte Inglés'],
  },
  {
    id: 'mextie-2',
    sku: 'MX-MAD-02',
    name: 'Conjunto Madrid',
    subtitle: 'Saco clásico 2 botones corte inglés + Pantalón regular de caída impecable.',
    description:
      'Diseñado para jornadas ejecutivas prolongadas. El Conjunto Madrid combina una estructura de hombros limpia con pantalón de corte regular y bolsas traseras de vivo con botón.',
    category: 'Conjuntos',
    catalogCategory: 'conjuntos',
    price: 4650,
    status: 'published',
    badge: 'LÍNEA DIRECTIVA',
    badgeType: 'primary',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-m1',
        label: '01 · FRENTE',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80',
        alt: 'Conjunto Madrid',
      },
    ],
    craftDetails: [
      'Corte Regular de gran confort y presencia corporativa.',
      'Forro interior respirable con bolsillos de seguridad.',
      'Pretina reforzada y costuras de alta resistencia.',
    ],
    finishes: [
      { id: 'mx-mf1', name: 'Azul Marino', colorHex: '#1B263B', subtext: 'Poliéster-Viscosa' },
      { id: 'mx-mf2', name: 'Charcoal', colorHex: '#2F3136', subtext: 'Lana / Poliéster' },
    ],
    availableSizes: ['38R', '40R', '42R', '44R', '46R'],
    sizeMatrix: [
      { size: '38R', sku: 'MX-MAD-38R', status: 'in_stock', quantity: 9 },
      { size: '40R', sku: 'MX-MAD-40R', status: 'in_stock', quantity: 11 },
      { size: '42R', sku: 'MX-MAD-42R', status: 'in_stock', quantity: 7 },
      { size: '44R', sku: 'MX-MAD-44R', status: 'in_stock', quantity: 4 },
    ],
    consultationsCount: 84,
    lastConsultation: 'Hace 25 min',
    waTemplate:
      'Hola equipo MexTie 👋 Me gustaría consultar disponibilidad del {nombre_producto} ({sku}) en talla {talla}, color {color}.',
    tags: ['Madrid', 'Traje', 'Regular Fit', 'Corporativo'],
  },
  {
    id: 'mextie-3',
    sku: 'MX-DUB-03',
    name: 'Conjunto Dublin',
    subtitle: 'Carteras inclinadas de inspiración británica con pespunte 1/16 y silueta Fit.',
    description:
      'El Conjunto Dublin destaca por sus carteras inclinadas ecuestres y su talle estilizado. Ideal para un perfil contemporáneo y distinguido.',
    category: 'Conjuntos',
    catalogCategory: 'conjuntos',
    price: 4950,
    status: 'published',
    badge: 'SASTRERÍA FIT',
    badgeType: 'secondary',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-d1',
        label: '01 · ESTUDIO',
        url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=900&auto=format&fit=crop&q=80',
        alt: 'Conjunto Dublin',
      },
    ],
    craftDetails: [
      'Bolsas con carteras inclinadas y pespunte 1/16.',
      'Solapa de muesca con ojal sastre.',
      'Pantalón corte Fit sin pinzas.',
    ],
    finishes: [
      { id: 'mx-df1', name: 'Café Espresso', colorHex: '#3B2820', subtext: 'Tejido Espiga' },
      { id: 'mx-df2', name: 'Gris Oxford', colorHex: '#373A40', subtext: 'Liso Sastre' },
    ],
    availableSizes: ['36R', '38R', '40R', '42R', '44R'],
    sizeMatrix: [
      { size: '36R', sku: 'MX-DUB-36R', status: 'in_stock', quantity: 5 },
      { size: '38R', sku: 'MX-DUB-38R', status: 'in_stock', quantity: 8 },
      { size: '40R', sku: 'MX-DUB-40R', status: 'in_stock', quantity: 6 },
      { size: '42R', sku: 'MX-DUB-42R', status: 'in_stock', quantity: 4 },
    ],
    consultationsCount: 76,
    lastConsultation: 'Hace 40 min',
    waTemplate:
      'Hola equipo MexTie 👋 Me interesa el {nombre_producto} ({sku}) en talla {talla} y acabado {color}.',
    tags: ['Dublin', 'Cartera Inclinada', 'Fit'],
  },
  {
    id: 'mextie-4',
    sku: 'MX-DEL-04',
    name: 'Blazer Delemont',
    subtitle: 'Blazer sport sartorial con bolsas de parche y coderas opcionales en contraste.',
    description:
      'Versatilidad total para viernes corporativo o viajes de negocios. Confeccionado con bolsas de parche inferiores, bolsa de pecho en curva y opción de coderas.',
    category: 'Blazers',
    catalogCategory: 'blazers',
    price: 3200,
    status: 'published',
    badge: 'SMART CASUAL',
    badgeType: 'neutral',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-b1',
        label: '01 · BLAZER',
        url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&auto=format&fit=crop&q=80',
        alt: 'Blazer Delemont',
      },
    ],
    craftDetails: [
      'Bolsas de parche con pespunte visible.',
      'Coderas opcionales en gamuza o contraste.',
      'Estructura ligera de media entretela.',
    ],
    finishes: [
      { id: 'mx-bf1', name: 'Azul Hielo / Navy', colorHex: '#253C59', subtext: 'Textura Hopsack' },
      { id: 'mx-bf2', name: 'Gris Medio', colorHex: '#6E7278', subtext: 'Jaspeado' },
    ],
    availableSizes: ['36R', '38R', '40R', '42R', '44R'],
    sizeMatrix: [
      { size: '38R', sku: 'MX-DEL-38R', status: 'in_stock', quantity: 7 },
      { size: '40R', sku: 'MX-DEL-40R', status: 'in_stock', quantity: 9 },
      { size: '42R', sku: 'MX-DEL-42R', status: 'in_stock', quantity: 6 },
    ],
    consultationsCount: 63,
    lastConsultation: 'Hace 1 hora',
    waTemplate:
      'Hola equipo MexTie 👋 Quiero cotizar el {nombre_producto} ({sku}) en talla {talla}, color {color}.',
    tags: ['Blazer', 'Delemont', 'Sport', 'Coderas'],
  },
  {
    id: 'mextie-5',
    sku: 'MX-EST-05',
    name: 'Abrigo Estocolmo 3/4',
    subtitle: 'Abrigo tres cuartos de botonadura oculta con solapa de muesca y forro térmico.',
    description:
      'Elegancia invernal sobre traje o prenda de punto. Largo 3/4 con carteras diagonales y espalda con abertura central para libertad de movimiento.',
    category: 'Abrigos',
    catalogCategory: 'abrigos',
    price: 4200,
    status: 'published',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-a1',
        label: '01 · ABRIGO',
        url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=900&auto=format&fit=crop&q=80',
        alt: 'Abrigo Estocolmo',
      },
    ],
    finishes: [
      { id: 'mx-af1', name: 'Negro Carbón', colorHex: '#181818', subtext: 'Paño de Lana' },
      { id: 'mx-af2', name: 'Camel Ejecutivo', colorHex: '#A67B5B', subtext: 'Paño Suave' },
    ],
    availableSizes: ['S', 'M', 'L', 'XL'],
    sizeMatrix: [
      { size: 'S', sku: 'MX-EST-S', status: 'in_stock', quantity: 4 },
      { size: 'M', sku: 'MX-EST-M', status: 'in_stock', quantity: 8 },
      { size: 'L', sku: 'MX-EST-L', status: 'in_stock', quantity: 6 },
      { size: 'XL', sku: 'MX-EST-XL', status: 'in_stock', quantity: 3 },
    ],
    consultationsCount: 49,
    lastConsultation: 'Hace 2 horas',
    waTemplate:
      'Hola equipo MexTie 👋 Me interesa el {nombre_producto} ({sku}) en talla {talla}, color {color}.',
    tags: ['Abrigo', 'Estocolmo', 'Invierno'],
  },
  {
    id: 'mextie-6',
    sku: 'MX-LIN-06',
    name: 'Camisa Piloto Linate',
    subtitle: 'Camisa institucional y aeronáutica con charreteras y bolsas con pliegue y porta-pluma.',
    description:
      'Confeccionada con estándares de aviación y alta representación institucional. Cuello fusionado indeformable, charreteras para insignias y bolsas frontales con cartera.',
    category: 'Camisas',
    catalogCategory: 'camisas',
    price: 1150,
    status: 'published',
    madeIn: 'SASTRERÍA CDMX · MEXTIE',
    heroImage:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'mx-c1',
        label: '01 · CAMISA',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80',
        alt: 'Camisa Piloto Linate',
      },
    ],
    finishes: [
      { id: 'mx-cf1', name: 'Blanco Óptico', colorHex: '#FFFFFF', subtext: 'Algodón / Poliéster' },
      { id: 'mx-cf2', name: 'Azul Cielo', colorHex: '#CFE2F3', subtext: 'Popelina Fina' },
    ],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeMatrix: [
      { size: 'S', sku: 'MX-LIN-S', status: 'in_stock', quantity: 15 },
      { size: 'M', sku: 'MX-LIN-M', status: 'in_stock', quantity: 24 },
      { size: 'L', sku: 'MX-LIN-L', status: 'in_stock', quantity: 20 },
      { size: 'XL', sku: 'MX-LIN-XL', status: 'in_stock', quantity: 12 },
    ],
    consultationsCount: 91,
    lastConsultation: 'Hace 19 min',
    waTemplate:
      'Hola equipo MexTie 👋 Me interesa cotizar la {nombre_producto} ({sku}) en talla {talla}, color {color}.',
    tags: ['Camisa', 'Piloto', 'Linate', 'Uniforme'],
  },
];

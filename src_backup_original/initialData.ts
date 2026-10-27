import { Product, TenantConfig, WhatsAppLead } from './types';

export const INITIAL_TENANT_CONFIG: TenantConfig = {
  tenantId: 'TENANT-SIERRA-084',
  name: 'SIERRA Footwear',
  storeUrl: 'sierra.candycatalog.store',
  whatsappPhone: '+52 477 123 4567',
  showroomCity: 'León, Guanajuato, México',
  announcement:
    'Envíos sin costo a todo México en órdenes con asesoría directa vía WhatsApp / Taller León, GTO',
  autoSync: true,
  currency: 'MXN',
  theme: {
    industry: 'Calzado Artesanal & Marroquinería',
    brandName: 'SIERRA',
    tagline: 'Siluetas esenciales concebidas para trascender temporadas efímeras.',
    tone: 'Editorial Suizo / Lujo Silencioso & Sobrio',
    targetAudience: 'Compradores de diseño contemporáneo y alta artesanía',
    location: 'León, Guanajuato, México',
    valuePropositions: [
      'Pieles vacunas 100% curtidas al vegetal con taninos biodegradables.',
      'Construcción Goodyear Welted artesanal resolable de por vida.',
      'Atención humana 1 a 1 por WhatsApp con el maestro cortador.',
      '1er cambio de talla gratuito con flete incluido.',
    ],
    onboardingCompleted: true,
  },
  geminiEngine: {
    activeRules: [
      'Si el cliente está entre dos tallas o tiene empeine alto, recomendar media talla superior.',
      'Destacar siempre que el 1er cambio de talla es gratuito con guía de retorno prepagada.',
      'Mencionar que las pieles son de curtición vegetal en León, Guanajuato con construcción Goodyear Welted resolable.',
      'Para pedidos personalizados o ancho especial EE, el tiempo de confección en taller es de 7 a 9 días hábiles.',
    ],
    customerNeedsDetected: [
      {
        id: 'need-1',
        need: 'Duda entre talla habitual de tenis y horma artesanal',
        frequency: 64,
        resolvedRule: 'Guía en centímetros + recomendación de media talla si hay empeine alto.',
      },
      {
        id: 'need-2',
        need: 'Consulta por tiempos de envío urgente a CDMX y Monterrey',
        frequency: 41,
        resolvedRule: 'Despacho el mismo día en pares en stock vía DHL Express (24-48 hrs).',
      },
      {
        id: 'need-3',
        need: 'Resistencia a lluvia y mantenimiento de gamuza/piel',
        frequency: 29,
        resolvedRule: 'Cera vegetal hidrofugada incluida y guía de cuidado cada 6 semanas.',
      },
    ],
    learnedResponsesCount: 142,
    accuracyScore: 98.6,
    lastTrainedDate: 'Sincronizado hoy',
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SR-CHE-01',
    name: 'Botín Chelsea Nómada',
    subtitle:
      'Silueta atemporal confeccionada en flor entera de piel vacuno curtida vegetal con suela de cuero recuperado.',
    description:
      'Estructurado sobre nuestra clásica horma 108, el Botín Chelsea Nómada reúne la resistencia de un botín de trabajo con la refinada silueta de sastrería contemporánea.',
    category: 'Calzado',
    catalogCategory: 'botas',
    price: 3450,
    comparePrice: 3900,
    status: 'published',
    badge: 'ENTREGA INMEDIATA',
    badgeType: 'secondary',
    madeIn: 'HECHO EN LEÓN, GTO.',
    heroImage:
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'img-1',
        label: '01 · PERFIL',
        url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&auto=format&fit=crop&q=80',
        alt: 'Botín Chelsea Nómada',
      },
      {
        id: 'img-2',
        label: '02 · VIRA',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80',
        alt: 'Detalle vira cosida',
      },
      {
        id: 'img-3',
        label: '03 · PIEL',
        url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=900&auto=format&fit=crop&q=80',
        alt: 'Textura piel curtida',
      },
    ],
    craftDetails: [
      'Piel de vacuno flor entera de curtición vegetal certificada LWG, grosor estructural de 1.8mm.',
      'Forro interno 100% piel suave transpirable que evita la retención de humedad.',
      'Construcción de vira cosida Goodyear Welted 360° con entresuela de corcho natural.',
    ],
    finishes: [
      { id: 'f1', name: 'Negro Ónix', colorHex: '#1C1A19', subtext: 'Piel Flor 1.8mm' },
      { id: 'f2', name: 'Tabaco Gamuza', colorHex: '#824424', subtext: 'Gamuza Encerada' },
      { id: 'f3', name: 'Cuero Crudo', colorHex: '#C2A384', subtext: 'Vaqueta Vegetal' },
    ],
    availableSizes: ['25', '26', '26.5', '27', '27.5', '28', '29'],
    sizeMatrix: [
      { size: '25', sku: 'SR-CHE-01-25', status: 'in_stock', quantity: 5 },
      { size: '26', sku: 'SR-CHE-01-26', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '26.5', sku: 'SR-CHE-01-265', status: 'in_stock', quantity: 4 },
      { size: '27', sku: 'SR-CHE-01-27', status: 'in_stock', quantity: 6 },
      { size: '27.5', sku: 'SR-CHE-01-275', status: 'in_stock', quantity: 3 },
      { size: '28', sku: 'SR-CHE-01-28', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '29', sku: 'SR-CHE-01-29', status: 'on_demand', quantity: 0 },
    ],
    consultationsCount: 94,
    lastConsultation: 'Hace 12 min',
    waTemplate:
      'Hola equipo SIERRA 👋 Me gustaría consultar la disponibilidad del {nombre_producto} (Ref: {sku}) en talla {talla} MX y acabado {color}.',
    tags: ['Botín', 'Chelsea', 'Goodyear Welt', 'Piel Vegetal'],
  },
  {
    id: 'prod-2',
    sku: 'SR-RIV-02',
    name: 'Mocasín Riviera Crepé',
    subtitle:
      'Gamuza de becerro aterciopelada con suela de caucho natural crepé virgen y costura artesanal a mano.',
    description:
      'Inspirado en la sastrería mediterránea relajada. El Mocasín Riviera ofrece flexibilidad inmediata desde el primer calce sin sacrificar soporte estructural.',
    category: 'Calzado',
    catalogCategory: 'mocasines',
    price: 2980,
    comparePrice: 3300,
    status: 'published',
    badge: 'NUEVA EDICIÓN',
    badgeType: 'primary',
    madeIn: 'HECHO EN LEÓN, GTO.',
    heroImage:
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'img-21',
        label: '01 · PERFIL',
        url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&auto=format&fit=crop&q=80',
        alt: 'Mocasín Riviera Crepé',
      },
    ],
    craftDetails: [
      'Gamuza hidrofugada resistente a manchas de agua.',
      'Suela crepé de caucho virgen de alta absorción de impacto.',
      'Costura de antifaz ejecutada a mano con hilo encerado.',
    ],
    finishes: [
      { id: 'f21', name: 'Arena Desierto', colorHex: '#C8B296', subtext: 'Gamuza Becerro' },
      { id: 'f22', name: 'Tabaco Oscuro', colorHex: '#5C3A21', subtext: 'Gamuza Becerro' },
    ],
    availableSizes: ['25', '26', '27', '27.5', '28'],
    sizeMatrix: [
      { size: '25', sku: 'SR-RIV-02-25', status: 'in_stock', quantity: 4 },
      { size: '26', sku: 'SR-RIV-02-26', status: 'in_stock', quantity: 5 },
      { size: '27', sku: 'SR-RIV-02-27', status: 'in_stock', quantity: 6 },
      { size: '27.5', sku: 'SR-RIV-02-275', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '28', sku: 'SR-RIV-02-28', status: 'in_stock', quantity: 3 },
    ],
    consultationsCount: 72,
    lastConsultation: 'Hace 38 min',
    waTemplate:
      'Hola equipo SIERRA 👋 Me interesa el {nombre_producto} (Ref: {sku}) en talla {talla} MX, color {color}.',
    tags: ['Mocasín', 'Loafer', 'Gamuza', 'Crepé'],
  },
  {
    id: 'prod-3',
    sku: 'SR-DRB-03',
    name: 'Derby Brutalista 02',
    subtitle:
      'Proporciones arquitectónicas con cerco storm welt 360° y suela Vibram® Commando de tracción urbana.',
    description:
      'Una reinterpretación contemporánea del clásico zapato de cordones. Construido para caminar largas jornadas en ciudad bajo cualquier condición climática.',
    category: 'Calzado',
    catalogCategory: 'derby',
    price: 3800,
    status: 'published',
    badge: 'LOTE LIMITADO',
    badgeType: 'neutral',
    madeIn: 'HECHO EN LEÓN, GTO.',
    heroImage:
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'img-31',
        label: '01 · ESTUDIO',
        url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&auto=format&fit=crop&q=80',
        alt: 'Derby Brutalista 02',
      },
    ],
    craftDetails: [
      'Piel vacuno grano cerrado negro mate de 2.0mm.',
      'Suela Vibram® Commando dentada de 3.8 cm.',
      'Cerco Storm Welt con sellado contra humedad.',
    ],
    finishes: [
      { id: 'f31', name: 'Negro Mate', colorHex: '#141414', subtext: 'Grano Cerrado' },
      { id: 'f32', name: 'Burdeos Cordovan', colorHex: '#4A1C24', subtext: 'Piel Pulida' },
    ],
    availableSizes: ['25.5', '26', '26.5', '27', '28', '29'],
    sizeMatrix: [
      { size: '25.5', sku: 'SR-DRB-03-255', status: 'in_stock', quantity: 3 },
      { size: '26', sku: 'SR-DRB-03-26', status: 'in_stock', quantity: 4 },
      { size: '26.5', sku: 'SR-DRB-03-265', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '27', sku: 'SR-DRB-03-27', status: 'in_stock', quantity: 5 },
      { size: '28', sku: 'SR-DRB-03-28', status: 'in_stock', quantity: 3 },
      { size: '29', sku: 'SR-DRB-03-29', status: 'in_stock', quantity: 2 },
    ],
    consultationsCount: 61,
    lastConsultation: 'Hace 1 hora',
    waTemplate:
      'Hola equipo SIERRA 👋 Quiero consultar disponibilidad del {nombre_producto} ({sku}) en talla {talla} MX, color {color}.',
    tags: ['Derby', 'Vibram', 'Zapato', 'Negro'],
  },
  {
    id: 'prod-4',
    sku: 'SR-SAN-04',
    name: 'Sandalia Cruzada Pacífico',
    subtitle:
      'Tiras anchas de vaqueta curtida al tanino vegetal con plantilla anatómica moldeable al calor.',
    description:
      'Diseñada para climas cálidos y descanso arquitectónico. La vaqueta natural desarrolla una pátina dorada única con el uso.',
    category: 'Sandalias',
    catalogCategory: 'sandalias',
    price: 2250,
    status: 'published',
    madeIn: 'HECHO EN LEÓN, GTO.',
    heroImage:
      'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=900&auto=format&fit=crop&q=80',
    galleryImages: [
      {
        id: 'img-41',
        label: '01 · PLANTA',
        url: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=900&auto=format&fit=crop&q=80',
        alt: 'Sandalia Cruzada Pacífico',
      },
    ],
    finishes: [
      { id: 'f41', name: 'Sela Natural', colorHex: '#B87A4B', subtext: 'Vaqueta 2.2mm' },
      { id: 'f42', name: 'Carbón', colorHex: '#232323', subtext: 'Vaqueta Teñida' },
    ],
    availableSizes: ['25', '26', '27', '28', '29'],
    sizeMatrix: [
      { size: '25', sku: 'SR-SAN-04-25', status: 'in_stock', quantity: 6 },
      { size: '26', sku: 'SR-SAN-04-26', status: 'in_stock', quantity: 8 },
      { size: '27', sku: 'SR-SAN-04-27', status: 'in_stock', quantity: 7 },
      { size: '28', sku: 'SR-SAN-04-28', status: 'in_stock', quantity: 4 },
      { size: '29', sku: 'SR-SAN-04-29', status: 'in_stock', quantity: 3 },
    ],
    consultationsCount: 39,
    lastConsultation: 'Hace 3 horas',
    waTemplate:
      'Hola equipo SIERRA 👋 Me interesa la {nombre_producto} ({sku}) en talla {talla} MX, color {color}.',
    tags: ['Sandalias', 'Vaqueta', 'Verano'],
  },
];

export const INITIAL_LEADS: WhatsAppLead[] = [
  {
    id: 'lead-101',
    clientName: 'Alejandro Villarreal',
    phone: '+52 55 4891 2201',
    productName: 'Botín Chelsea Nómada',
    sku: 'SR-CHE-01',
    finish: 'Tabaco Gamuza',
    size: '27 MX',
    date: 'Hoy, 11:42 AM',
    status: 'nueva',
  },
  {
    id: 'lead-102',
    clientName: 'Rodrigo Mondragón',
    phone: '+52 81 1920 4410',
    productName: 'Derby Brutalista 02',
    sku: 'SR-DRB-03',
    finish: 'Negro Mate',
    size: '26.5 MX',
    date: 'Hoy, 10:15 AM',
    status: 'en_conversacion',
  },
  {
    id: 'lead-103',
    clientName: 'Mariana Saldívar',
    phone: '+52 33 3812 9084',
    productName: 'Mocasín Riviera Crepé',
    sku: 'SR-RIV-02',
    finish: 'Arena Desierto',
    size: '25 MX',
    date: 'Ayer, 18:30 PM',
    status: 'esperando_pago',
  },
  {
    id: 'lead-104',
    clientName: 'Carlos Elizondo',
    phone: '+52 477 890 1122',
    productName: 'Botín Chelsea Nómada',
    sku: 'SR-CHE-01',
    finish: 'Negro Ónix',
    size: '28 MX',
    date: 'Ayer, 14:20 PM',
    status: 'despachado',
  },
];

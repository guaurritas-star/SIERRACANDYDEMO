import { Product, TenantConfig, WhatsAppLead } from './types';

export const INITIAL_TENANT_CONFIG: TenantConfig = {
  tenantId: 'sierra-footwear',
  name: 'SIERRA',
  storeUrl: 'sierra.candycatalog.store',
  whatsappPhone: '+52 477 123 4567',
  showroomCity: 'León, Guanajuato · México',
  announcement:
    'Edición Permanente — Confección artesanal en piel de curtición vegetal · Atención directa vía WhatsApp',
  autoSync: true,
  currency: 'MXN',
  logoUrl:
    'https://lh3.googleusercontent.com/aida/AEtjO1Xysap4dyGay6J8o-suHVTTb3GZIlMN9m_hdvDEWPWWGOnhv45M4C8Ohhzy5Dhh-Ak6k3g4_ACmQmKYHrpY1jNOz-vHrLku_dgR0pQCJYQ84OTbV0RPtosjZ99hIWb67F-QYhURdxJjvl93mGxRIV29r1dD2DoRfmsDLp-KpxRjgatHfZcI46xPXmfTTroMKt8siPojF0-rAfFatCKDXAOdCUsUaykwYtUN6X7F-oIzK5eJuaVj65JC0w',
  accentColor: '#8C3A1B',
  theme: {
    industry: 'Calzado Artesanal & Marroquinería',
    brandName: 'SIERRA',
    tagline:
      'Calzado de arquitectura sobria y corte contemporáneo, concebido en León, Guanajuato mediante pieles curtidas con extractos vegetales.',
    tone: 'Editorial Contemporáneo · Sobrio y Preciso',
    targetAudience: 'Compradores de diseño atemporal y manufactura ética',
    location: 'León, Guanajuato · México',
    valuePropositions: [
      'Pieles vacunas seleccionadas de curtición vegetal libre de metales pesados.',
      'Construcción Goodyear Welted 360° que permite reponer la suela al paso de los años.',
      'Asesoría de calce directa con el taller vía WhatsApp antes de despachar.',
      'Primer ajuste o cambio de talla cubierto por el taller.',
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
        need: 'Consulta por tiempos de envío a CDMX, Guadalajara y Monterrey',
        frequency: 41,
        resolvedRule: 'Despacho el mismo día en pares en stock vía mensajería express (24-48 hrs).',
      },
      {
        id: 'need-3',
        need: 'Resistencia a humedad y cuidado de gamuza o piel flor',
        frequency: 29,
        resolvedRule: 'Cera vegetal hidrofugada incluida y guía de hidratación cada 6 semanas.',
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
    tenantId: 'sierra-footwear',
    sku: 'SR-CHE-01',
    name: 'Botín Chelsea Nómada',
    subtitle:
      'Silueta atemporal confeccionada en flor entera de piel vacuno curtida al vegetal con vira cosida 360°.',
    description:
      'Estructurado sobre nuestra clásica horma 108, el Botín Chelsea Nómada reúne la resistencia de un botín de campo con la proporción limpia de la sastrería contemporánea.\n\n• Construcción: Goodyear Welted artesanal con doble pespunte.\n• Empeine: Piel de becerro curtida al tanino vegetal en Guanajuato.\n• Forro interior: Guante de piel natural sin pigmentos sintéticos.\n• Suela: Cuero natural con cerco dentado y tapeta antideslizante Vibram®.',
    category: 'Botas',
    catalogCategory: 'botas',
    price: 3450,
    comparePrice: 3900,
    status: 'published',
    badge: 'Entrega Inmediata',
    badgeType: 'secondary',
    madeIn: 'León, Guanajuato',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
    galleryImages: [
      {
        id: 'img-1',
        label: '01 · Perfil Principal',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
        alt: 'Botín Chelsea Nómada — Vista principal',
      },
      {
        id: 'img-2',
        label: '02 · Vira Cosida',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmhdTXEaZLyrHVvsDMyc_BWBnZtKgNirtHKoOdhem848STg1T2MPvl_G4FACl2HETfaCF2U_gGvpqOIw1-zcu849Lccuj1n1-nNId4K3uFuWN35Kinr_YRRtSVFyhZBaOFmVOH0zgwQyTd4QQ_vqBhAipZS1M3-Uy9fnwfmYNd5KHKdi0PE6ZIK5qyRVlae9sa1mqGYanXlyuF4rAp-q8pRK3z1tUZEfQ0iRKl6ewLWxG9tIUar_Kz',
        alt: 'Botín Chelsea Nómada — Detalle lateral',
      },
      {
        id: 'img-3',
        label: '03 · Suela y Cerco',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4MJFiqti4QnF5zqu1fiVCXH9st3Wvx3rdolt5q0oXshePN9Ve_FchY_OugGnW7Xw4Uav4V78Cb-nbwqgbcK11CYBXkhMfRDmXa5z6wT4zME_w96mn6b6B4lhqcAiywtSKWRca1Mr6ZDnh6l5-9fZkCtW4a7EoRSvFGq9skcal3Ws1HrBzv3Lza7D7_NJC4Ghmpx1uLwzpWFxOHnZLJdv_MdisXoWusSprlfN4ILdVKcUpmgpZxx7h',
        alt: 'Botín Chelsea Nómada — Detalle suela',
      },
    ],
    craftDetails: [
      'Piel de vacuno flor entera de curtición vegetal certificada LWG, grosor estructural de 1.8mm.',
      'Forro interno 100% piel suave transpirable que evita la retención de humedad.',
      'Construcción de vira cosida Goodyear Welted 360° con entresuela de corcho natural moldeable a la pisada.',
    ],
    finishes: [
      { id: 'f1', name: 'Negro Ónix', colorHex: '#1C1A19', subtext: 'Piel Flor 1.8mm' },
      { id: 'f2', name: 'Tabaco Gamuza', colorHex: '#824424', subtext: 'Gamuza Encerada' },
      { id: 'f3', name: 'Cuero Crudo', colorHex: '#C2A384', subtext: 'Vaqueta Vegetal' },
      { id: 'f4', name: 'Olivo Silvestre', colorHex: '#3D4035', subtext: 'Nobuck Hidrofugado' },
    ],
    availableSizes: ['24', '25', '26', '26.5', '27', '27.5', '28', '29'],
    sizeMatrix: [
      { size: '24', sku: 'SR-CHE-01-24', status: 'in_stock', quantity: 3 },
      { size: '25', sku: 'SR-CHE-01-25', status: 'in_stock', quantity: 5 },
      { size: '26', sku: 'SR-CHE-01-26', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '26.5', sku: 'SR-CHE-01-265', status: 'in_stock', quantity: 4 },
      { size: '27', sku: 'SR-CHE-01-27', status: 'in_stock', quantity: 6 },
      { size: '27.5', sku: 'SR-CHE-01-275', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '28', sku: 'SR-CHE-01-28', status: 'on_demand', quantity: 0 },
      { size: '29', sku: 'SR-CHE-01-29', status: 'in_stock', quantity: 3 },
    ],
    consultationsCount: 94,
    lastConsultation: 'Hace 12 min',
    waTemplate:
      'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.',
    tags: ['Botín', 'Chelsea', 'Goodyear Welt', 'Piel Vegetal'],
  },
  {
    id: 'prod-2',
    tenantId: 'sierra-footwear',
    sku: 'SR-RIV-02',
    name: 'Mocasín Riviera Crepé',
    subtitle:
      'Gamuza de becerro aterciopelada con suela de caucho natural crepé virgen y costura de antifaz a mano.',
    description:
      'Inspirado en la sastrería mediterránea relajada. El Mocasín Riviera ofrece flexibilidad inmediata desde el primer calce sin sacrificar soporte estructural.\n\n• Material exterior: Gamuza de becerro hidrofugada.\n• Forro: Badana natural transpirable.\n• Suela: Crepé de caucho virgen de alta absorción.',
    category: 'Mocasines',
    catalogCategory: 'mocasines',
    price: 2980,
    comparePrice: 3300,
    status: 'published',
    badge: 'Edición de Temporada',
    badgeType: 'primary',
    madeIn: 'León, Guanajuato',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb',
    galleryImages: [
      {
        id: 'img-21',
        label: '01 · Perfil Riviera',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb',
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
    availableSizes: ['25', '26', '26.5', '27', '27.5', '28', '29'],
    sizeMatrix: [
      { size: '25', sku: 'SR-RIV-02-25', status: 'in_stock', quantity: 4 },
      { size: '26', sku: 'SR-RIV-02-26', status: 'in_stock', quantity: 5 },
      { size: '26.5', sku: 'SR-RIV-02-265', status: 'in_stock', quantity: 3 },
      { size: '27', sku: 'SR-RIV-02-27', status: 'in_stock', quantity: 6 },
      { size: '27.5', sku: 'SR-RIV-02-275', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '28', sku: 'SR-RIV-02-28', status: 'in_stock', quantity: 3 },
      { size: '29', sku: 'SR-RIV-02-29', status: 'in_stock', quantity: 2 },
    ],
    consultationsCount: 72,
    lastConsultation: 'Hace 38 min',
    waTemplate:
      'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.',
    tags: ['Mocasín', 'Loafer', 'Gamuza', 'Crepé'],
  },
  {
    id: 'prod-3',
    tenantId: 'sierra-footwear',
    sku: 'SR-DRB-02',
    name: 'Derby Brutalista 02',
    subtitle:
      'Proporciones arquitectónicas con cerco storm welt 360° y suela Vibram® Commando de tracción urbana.',
    description:
      'Una reinterpretación contemporánea del clásico zapato de cordones. Construido para caminar largas jornadas en ciudad bajo cualquier condición climática.\n\n• Piel vacuno grano cerrado negro mate de 2.0mm.\n• Suela Vibram® Commando dentada de 3.8 cm.\n• Cerco Storm Welt con sellado contra humedad.',
    category: 'Zapatos Derby',
    catalogCategory: 'derby',
    price: 3800,
    status: 'published',
    badge: 'Lote Limitado',
    badgeType: 'neutral',
    madeIn: 'León, Guanajuato',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCV8_hGjBn7y8fa0mWH2q7XbC4kNliE4SPBeBBj_ZNQbtLpjOjBu5zW5mMEo0ZczPt_GOFNcKZCBcg1xqOo52QqZe3ngu1GHxzt4frX4utiVcyzumJpSzlBbcFRpcF4jLoiyCLolWOOtXn_f9OzRaJvqVxqerIveAGkumw2LWIiYjiWAi9MSX7mJUaWfNJNx6tB1NtNZl4MPHPS0gzwAoRAeDCjTs1Y-eYdW-v8qsq4dv1AdG7gH8tn',
    galleryImages: [
      {
        id: 'img-31',
        label: '01 · Estudio Lateral',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCV8_hGjBn7y8fa0mWH2q7XbC4kNliE4SPBeBBj_ZNQbtLpjOjBu5zW5mMEo0ZczPt_GOFNcKZCBcg1xqOo52QqZe3ngu1GHxzt4frX4utiVcyzumJpSzlBbcFRpcF4jLoiyCLolWOOtXn_f9OzRaJvqVxqerIveAGkumw2LWIiYjiWAi9MSX7mJUaWfNJNx6tB1NtNZl4MPHPS0gzwAoRAeDCjTs1Y-eYdW-v8qsq4dv1AdG7gH8tn',
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
    availableSizes: ['25.5', '26', '26.5', '27', '27.5', '28.5', '29.5'],
    sizeMatrix: [
      { size: '25.5', sku: 'SR-DRB-02-255', status: 'in_stock', quantity: 3 },
      { size: '26', sku: 'SR-DRB-02-26', status: 'in_stock', quantity: 4 },
      { size: '26.5', sku: 'SR-DRB-02-265', status: 'in_stock', quantity: 2, lowStock: true },
      { size: '27', sku: 'SR-DRB-02-27', status: 'in_stock', quantity: 5 },
      { size: '27.5', sku: 'SR-DRB-02-275', status: 'in_stock', quantity: 4 },
      { size: '28.5', sku: 'SR-DRB-02-285', status: 'in_stock', quantity: 3 },
      { size: '29.5', sku: 'SR-DRB-02-295', status: 'in_stock', quantity: 2 },
    ],
    consultationsCount: 61,
    lastConsultation: 'Hace 1 hora',
    waTemplate:
      'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.',
    tags: ['Derby', 'Vibram', 'Zapato', 'Negro'],
  },
  {
    id: 'prod-4',
    tenantId: 'sierra-footwear',
    sku: 'SR-WRK-04',
    name: 'Bota de Trabajo Urbana',
    subtitle:
      'Construcción de triple costura con cuero aceitado repelente al agua y lengüeta fuelle.',
    description:
      'Concebida para resistir el uso intensivo en estudio y exterior. Su piel aceitada adquiere carácter con cada postura y protege contra lluvia ligera y polvo urbano.',
    category: 'Botas',
    catalogCategory: 'botas',
    price: 3650,
    status: 'published',
    badge: 'Piel Aceitada',
    badgeType: 'neutral',
    madeIn: 'León, Guanajuato',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCzVdE6CnLEYQKWxOUhosYjKcT7C265j2htNwc2ht0CpMS-gVCFg3TXfu6Ot8m_-quuVp0CT1NI_A-s6t0U8_ve8c9oVYFSB788OYzCMAku9y4nTb6mjBX-DOPrLq_6h7epv0psCgcnly48nFMKKTsZ6ZDUJGYW9U_vxbb7GC-ZB8kD3yTxJ8Z6MFqXjDJm0_YKpxdQp9JqAE0bB_Y4ixVc5u8nZTkLZigct24m8AmotSlybo_5DUZS',
    galleryImages: [
      {
        id: 'img-41',
        label: '01 · Vista Frontal',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzVdE6CnLEYQKWxOUhosYjKcT7C265j2htNwc2ht0CpMS-gVCFg3TXfu6Ot8m_-quuVp0CT1NI_A-s6t0U8_ve8c9oVYFSB788OYzCMAku9y4nTb6mjBX-DOPrLq_6h7epv0psCgcnly48nFMKKTsZ6ZDUJGYW9U_vxbb7GC-ZB8kD3yTxJ8Z6MFqXjDJm0_YKpxdQp9JqAE0bB_Y4ixVc5u8nZTkLZigct24m8AmotSlybo_5DUZS',
        alt: 'Bota de Trabajo Urbana',
      },
    ],
    craftDetails: [
      'Cuero vacuno aceitado repelente a humedad.',
      'Triple costura de refuerzo en talón y chinela.',
      'Lengüeta tipo fuelle para sellado contra polvo.',
    ],
    finishes: [
      { id: 'f41', name: 'Cobre Aceitado', colorHex: '#6E3B23', subtext: 'Cuero Pull-Up' },
      { id: 'f42', name: 'Carbón Mate', colorHex: '#232323', subtext: 'Cuero Engrasado' },
    ],
    availableSizes: ['25', '26', '27', '28', '29'],
    sizeMatrix: [
      { size: '25', sku: 'SR-WRK-04-25', status: 'in_stock', quantity: 4 },
      { size: '26', sku: 'SR-WRK-04-26', status: 'in_stock', quantity: 6 },
      { size: '27', sku: 'SR-WRK-04-27', status: 'in_stock', quantity: 5 },
      { size: '28', sku: 'SR-WRK-04-28', status: 'in_stock', quantity: 5 },
      { size: '29', sku: 'SR-WRK-04-29', status: 'out', quantity: 0 },
    ],
    consultationsCount: 48,
    lastConsultation: 'Hace 2 horas',
    waTemplate:
      'Hola {marca}, me interesa consultar la disponibilidad de {nombre_producto} (SKU: {sku}) en color {color}, talla {talla}.',
    tags: ['Bota', 'Trabajo', 'Cuero Aceitado', 'Urbana'],
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
    sku: 'SR-DRB-02',
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

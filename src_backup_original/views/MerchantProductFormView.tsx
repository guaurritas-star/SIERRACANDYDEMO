import React, { useState } from 'react';
import { Product, TenantConfig, SizeStock } from '../types';

interface MerchantProductFormViewProps {
  initialProduct?: Product | null;
  tenantConfig: TenantConfig;
  onSaveProduct: (product: Product) => void;
  onCancel: () => void;
  onPreviewInCatalog: (product: Product) => void;
  onShowToast: (msg: string) => void;
}

export const MerchantProductFormView: React.FC<MerchantProductFormViewProps> = ({
  initialProduct,
  tenantConfig,
  onSaveProduct,
  onCancel,
  onPreviewInCatalog,
  onShowToast,
}) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || 'Botín Chelsea Nómada');
  const [sku, setSku] = useState(initialProduct?.sku || 'SR-CHE-01');
  const [subtitle, setSubtitle] = useState(
    initialProduct?.subtitle ||
      'Silueta atemporal confeccionada en flor entera de piel vacuno curtida vegetal con suela de cuero recuperado.'
  );
  const [description, setDescription] = useState(
    initialProduct?.description ||
      `Estructurado sobre nuestra clásica horma 108, el Botín Chelsea Nómada reúne la resistencia de un botín de trabajo con la refinada silueta de sastrería contemporánea.

• Construcción: Goodyear Welted artesanal con doble pespunte.
• Empeine: Piel de becerro curtida al tanino vegetal en Guanajuato.
• Forro interior: Guante de piel natural sin pigmentos sintéticos para transpirabilidad absoluta.
• Suela: Cuero natural con cerco dentado y tapeta antideslizante Vibram®.
• Cuidados: Tratar cada 6 semanas con bálsamo de ceras naturales.`
  );
  const [price, setPrice] = useState<number>(initialProduct?.price || 3450);
  const [comparePrice, setComparePrice] = useState<string>(
    initialProduct?.comparePrice ? String(initialProduct.comparePrice) : '3,900.00'
  );
  const [isPublished, setIsPublished] = useState<boolean>(initialProduct?.status === 'published' || true);
  const [stockBadge, setStockBadge] = useState<string>(
    initialProduct?.badge || 'En Stock (Entrega Inmediata)'
  );
  const [category, setCategory] = useState<Product['category']>(
    initialProduct?.category || 'Calzado'
  );
  const [catalogCategory, setCatalogCategory] = useState<Product['catalogCategory']>(
    initialProduct?.catalogCategory || 'botas'
  );
  const [waTemplate, setWaTemplate] = useState<string>(
    initialProduct?.waTemplate ||
      'Hola SIERRA, tengo interés en ordenar el producto {nombre_producto} en talla {talla} y acabado {color}. ¿Sigue disponible para entrega inmediata?'
  );
  const [tags, setTags] = useState<string[]>(
    initialProduct?.tags || ['Artesanal', 'Goodyear-Welt', 'Unisex']
  );
  const [newTagInput, setNewTagInput] = useState('');

  // Gallery items
  const [galleryImages, setGalleryImages] = useState(
    initialProduct?.galleryImages || [
      {
        id: 'img-1',
        label: 'Portada',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
        alt: 'chelsea-primario.webp',
      },
      {
        id: 'img-2',
        label: '01 · VIRA',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmhdTXEaZLyrHVvsDMyc_BWBnZtKgNirtHKoOdhem848STg1T2MPvl_G4FACl2HETfaCF2U_gGvpqOIw1-zcu849Lccuj1n1-nNId4K3uFuWN35Kinr_YRRtSVFyhZBaOFmVOH0zgwQyTd4QQ_vqBhAipZS1M3-Uy9fnwfmYNd5KHKdi0PE6ZIK5qyRVlae9sa1mqGYanXlyuF4rAp-q8pRK3z1tUZEfQ0iRKl6ewLWxG9tIUar_Kz',
        alt: 'side-profile.webp',
      },
      {
        id: 'img-3',
        label: '02 · SUELA',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4MJFiqti4QnF5zqu1fiVCXH9st3Wvx3rdolt5q0oXshePN9Ve_FchY_OugGnW7Xw4Uav4V78Cb-nbwqgbcK11CYBXkhMfRDmXa5z6wT4zME_w96mn6b6B4lhqcAiywtSKWRca1Mr6ZDnh6l5-9fZkCtW4a7EoRSvFGq9skcal3Ws1HrBzv3Lza7D7_NJC4Ghmpx1uLwzpWFxOHnZLJdv_MdisXoWusSprlfN4ILdVKcUpmgpZxx7h',
        alt: 'suela-detalle.webp',
      },
    ]
  );

  // Finishes
  const [finishes, setFinishes] = useState(
    initialProduct?.finishes || [
      { id: 'f1', name: 'Negro Ónix', colorHex: '#1C1A19', subtext: 'Piel Flor 1.8mm' },
      { id: 'f2', name: 'Tabaco Gamuza', colorHex: '#824424', subtext: 'Gamuza Encerada' },
      { id: 'f3', name: 'Cuero Crudo', colorHex: '#C2A384', subtext: 'Vaqueta Vegetal' },
      { id: 'f4', name: 'Olivo Silvestre', colorHex: '#3D4035', subtext: 'Nobuck Hidrofugado' },
    ]
  );
  const [activeFinishId, setActiveFinishId] = useState(finishes[0]?.id || 'f1');

  // Size Matrix
  const [sizeMatrix, setSizeMatrix] = useState<SizeStock[]>(
    initialProduct?.sizeMatrix || [
      { size: '24.0 CM', sku: 'SIE-CHE-240-BLK', status: 'in_stock', quantity: 3 },
      { size: '25.0 CM', sku: 'SIE-CHE-250-BLK', status: 'in_stock', quantity: 5 },
      { size: '26.0 CM', sku: 'SIE-CHE-260-BLK', status: 'in_stock', quantity: 8 },
      { size: '26.5 CM', sku: 'SIE-CHE-265-BLK', status: 'in_stock', quantity: 4 },
      { size: '27.0 CM', sku: 'SIE-CHE-270-BLK', status: 'on_demand', quantity: 0 },
      { size: '27.5 CM', sku: 'SIE-CHE-275-BLK', status: 'in_stock', quantity: 2 },
      { size: '28.0 CM', sku: 'SIE-CHE-280-BLK', status: 'out', quantity: 0 },
    ]
  );

  const handleSetCoverImage = (index: number) => {
    setGalleryImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    onShowToast('Imagen fijada como portada');
  };

  const handleRemoveImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    onShowToast('Imagen eliminada de la galería');
  };

  const handleAddColor = () => {
    const colorName = prompt('Nombre del nuevo acabado (ej. Cognac Añejo):');
    if (!colorName) return;
    const colorHex = prompt('Código Hex (ej. #8B4513):', '#8B4513') || '#8B4513';
    const subtext = prompt('Tipo de piel (ej. Piel Curtida):', 'Piel Curtida') || 'Piel Curtida';

    const newFinish = {
      id: `f-${Date.now()}`,
      name: colorName,
      colorHex,
      subtext,
    };
    setFinishes((prev) => [...prev, newFinish]);
    setActiveFinishId(newFinish.id);
    onShowToast(`Acabado ${colorName} añadido a la paleta`);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSizeChange = (
    index: number,
    field: 'status' | 'quantity',
    value: string | number
  ) => {
    setSizeMatrix((prev) => {
      const updated = [...prev];
      if (field === 'status') {
        updated[index].status = value as 'in_stock' | 'on_demand' | 'out';
      } else {
        updated[index].quantity = Number(value);
      }
      return updated;
    });
  };

  const constructProductObject = (): Product => {
    return {
      id: initialProduct?.id || `prod-${Date.now()}`,
      sku: sku || 'SR-GEN-01',
      name: name || 'Nueva Silueta SIERRA',
      subtitle,
      description,
      category,
      catalogCategory,
      price: Number(price) || 3450,
      comparePrice: comparePrice ? parseFloat(comparePrice.replace(/[^0-9.]/g, '')) : undefined,
      status: isPublished ? 'published' : 'hidden',
      badge: stockBadge,
      badgeType: isPublished ? 'secondary' : 'neutral',
      madeIn: 'HECHO EN LEÓN, GTO.',
      heroImage: galleryImages[0]?.url || initialProduct?.heroImage || '',
      galleryImages,
      craftDetails: [
        'Construcción artesanal con doble pespunte.',
        'Piel vacuna seleccionada con tanino vegetal.',
        'Suela moldeable a la pisada.',
      ],
      finishes,
      availableSizes: sizeMatrix.map((s) => s.size.replace(' CM', '')),
      sizeMatrix,
      consultationsCount: initialProduct?.consultationsCount || 0,
      lastConsultation: 'Reciente',
      waTemplate,
      tags,
    };
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalProd = constructProductObject();
    onSaveProduct(finalProd);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] pb-24">
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E2]">
          <div>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors pb-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Volver al Inventario</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight">
                {isEditing ? 'Editar Ficha de Producto' : 'Nuevo Producto en Catálogo'}
              </h1>
              <span className="px-2 py-0.5 bg-[#e8e8e7] text-[#1a1c1c] font-mono text-xs uppercase tracking-wider">
                {isEditing ? 'Versión Activa' : 'Borrador v0.1'}
              </span>
            </div>
            <p className="text-sm text-[#6E6E6A] mt-1">
              SIERRA Footwear · Los productos publicados se sincronizan de inmediato con el catálogo online y consultas por WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsPublished(false);
                handleSubmit();
                onShowToast('Borrador guardado exitosamente');
              }}
              className="px-4 py-2 bg-[#FFFFFF] text-[#1a1c1c] font-mono text-xs uppercase tracking-wider border border-[#D4D4D0] hover:bg-[#eeeeed] transition-colors shadow-xs cursor-pointer"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPublished(true);
                handleSubmit();
                onShowToast('Producto publicado y sincronizado');
              }}
              className="px-5 py-2 bg-[#000000] text-[#ffffff] font-mono text-xs uppercase tracking-wider hover:bg-[#333333] transition-colors flex items-center gap-2 shadow-xs cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              <span>Guardar y Publicar</span>
            </button>
          </div>
        </div>

        {/* 7 Section Form Layout */}
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 8 COLS */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* [01] Galería Editorial & Media */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-baseline justify-between border-b border-[#E5E5E2] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#6E6E6A]">[01]</span>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                    Galería Editorial & Media
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#6E6E6A]">
                  {galleryImages.length} de 8 imágenes cargadas
                </span>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => {
                  const url = prompt(
                    'Ingresa URL de imagen para añadir a la galería (o usa imagen local/web):',
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDWXQt8eBOGpf7eAej2hW0CFzMVPCBl4D5tHiqTtp0WHUIWxhzbIqSv0jUK7TWQIvZhCQmnIOsRWPouGfpJtB5zFVW8av53_rcZtvECCkXWdcFv4DIgnkofc6eIguZQ3Hcsbj-cnE7pM6KLTwtHQZF8UMDk4mzLD4D0bWC3o_oYVZUzrih1JrGCuApLEEp70KGWQwvZJYQi7rkGM96UzuyAKIRJ14CTG3dClWuO2vXnvLqdao6fYnAr'
                  );
                  if (url) {
                    setGalleryImages((prev) => [
                      ...prev,
                      {
                        id: `img-${Date.now()}`,
                        label: `TOMA 0${prev.length + 1}`,
                        url,
                        alt: 'nueva-toma.webp',
                      },
                    ]);
                    onShowToast('Imagen agregada a la galería');
                  }
                }}
                className="border border-dashed border-[#D4D4D0] bg-[#f3f4f3] p-8 text-center hover:bg-[#eeeeed] transition-colors cursor-pointer group mb-6"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#1a1c1c] shadow-xs group-hover:scale-105 transition-transform border border-[#E5E5E2]">
                    <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  </div>
                  <p className="text-sm text-[#1a1c1c] font-medium">
                    Arrastra imágenes editoriales aquí o{' '}
                    <span className="underline underline-offset-4 decoration-black cursor-pointer font-bold">
                      haz clic para examinar
                    </span>
                  </p>
                  <p className="font-mono text-xs text-[#6E6E6A]">
                    PNG, JPG, WebP hasta 10MB por archivo. Relación 4:5 recomendada.
                  </p>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className={`relative group bg-[#e8e8e7] aspect-[4/5] border flex flex-col justify-between p-2 overflow-hidden shadow-xs ${
                      idx === 0 ? 'border-[#000000] ring-1 ring-black' : 'border-[#E5E5E2]'
                    }`}
                  >
                    <img
                      alt={img.alt}
                      src={img.url}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="relative z-10 flex justify-between items-start">
                      {idx === 0 ? (
                        <span className="bg-[#000000] text-[#ffffff] font-mono text-[10px] px-2 py-0.5 uppercase tracking-widest shadow-xs font-bold">
                          Portada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(idx)}
                          className="bg-[#FFFFFF] text-[#1a1c1c] font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider hover:bg-[#000000] hover:text-white transition-colors shadow-xs opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          Hacer Portada
                        </button>
                      )}

                      <button
                        type="button"
                        aria-label="Eliminar foto"
                        onClick={() => handleRemoveImage(idx)}
                        className="bg-[#FFFFFF]/90 p-1 text-[#1a1c1c] hover:text-[#ba1a1a] transition-colors shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    <div className="relative z-10 bg-[#FFFFFF]/90 p-1.5 flex items-center justify-between text-[#1a1c1c] font-mono text-[11px] border border-[#E5E5E2]">
                      <span className="truncate">{img.alt || `foto-${idx + 1}.webp`}</span>
                      <span className="material-symbols-outlined text-[14px] text-[#6E6E6A]">
                        drag_handle
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add Shot Card */}
                <div
                  onClick={() => {
                    const url = prompt('URL de foto:');
                    if (url) {
                      setGalleryImages((prev) => [
                        ...prev,
                        {
                          id: `img-${Date.now()}`,
                          label: 'TOMA ADICIONAL',
                          url,
                          alt: 'detalle-nuevo.webp',
                        },
                      ]);
                      onShowToast('Toma añadida');
                    }
                  }}
                  className="aspect-[4/5] border border-dashed border-[#E5E5E2] bg-[#f3f4f3] flex flex-col items-center justify-center p-4 text-center text-[#6E6E6A] hover:border-[#1a1c1c] hover:text-[#1a1c1c] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[24px] mb-1">
                    add_photo_alternate
                  </span>
                  <span className="font-mono text-xs uppercase font-semibold">Añadir Toma</span>
                </div>
              </div>
            </div>

            {/* [02] Información Principal */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E2] pb-4 mb-6">
                <span className="font-mono text-xs text-[#6E6E6A]">[02]</span>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                  Información Principal
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="prod_name"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Nombre del Producto <span className="text-[#a23e18]">*</span>
                  </label>
                  <input
                    id="prod_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Botín Chelsea Nómada"
                    className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] font-['Plus_Jakarta_Sans'] font-bold text-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="prod_sku"
                      className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                    >
                      SKU Base / Referencia
                    </label>
                    <input
                      id="prod_sku"
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="ej. SR-CHE-01"
                      className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] font-mono text-sm px-4 py-2.5 outline-none transition-colors uppercase"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prod_subtitle"
                      className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                    >
                      Subtítulo Editorial / Declaración
                    </label>
                    <input
                      id="prod_subtitle"
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="ej. Silueta atemporal en piel vacuno curtida vegetal"
                      className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-sm px-4 py-2.5 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                      Descripción y Ficha Técnica
                    </label>
                    <div className="flex items-center gap-1 bg-[#f3f4f3] p-1 border border-[#E5E5E2]">
                      <button
                        type="button"
                        aria-label="Negrita"
                        onClick={() => setDescription((prev) => prev + '\n• ')}
                        className="px-2 py-0.5 hover:bg-[#FFFFFF] text-[#1a1c1c] font-semibold text-xs cursor-pointer"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        aria-label="Cursiva"
                        className="px-2 py-0.5 hover:bg-[#FFFFFF] text-[#1a1c1c] italic text-xs cursor-pointer"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        aria-label="Lista de viñetas"
                        onClick={() => setDescription((prev) => prev + '\n• ')}
                        className="px-2 py-0.5 hover:bg-[#FFFFFF] text-[#1a1c1c] flex items-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          format_list_bulleted
                        </span>
                      </button>
                      <span className="w-px h-4 bg-[#E5E5E2]"></span>
                      <button
                        type="button"
                        onClick={() =>
                          setDescription(
                            (prev) =>
                              prev +
                              '\n• Curtición: Extractos vegetales certificados LWG.\n• Vira: Goodyear 360° resolable.'
                          )
                        }
                        className="px-2 py-0.5 hover:bg-[#FFFFFF] text-[#1a1c1c] font-mono text-[11px] uppercase cursor-pointer"
                      >
                        Ficha Cuero
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-sm p-4 outline-none leading-relaxed transition-colors resize-y font-mono"
                  />
                </div>
              </div>
            </div>

            {/* [03] Variantes & Matriz de Tallas */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-baseline justify-between border-b border-[#E5E5E2] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#6E6E6A]">[03]</span>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                    Variantes & Matriz de Tallas
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#6E6E6A]">
                  Ajuste rápido de inventario por SKU
                </span>
              </div>

              <div className="space-y-6">
                {/* Paleta de Acabados / Piel */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                      Paleta de Acabados / Piel
                    </span>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="text-[#1a1c1c] hover:underline font-mono text-xs uppercase flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      <span>Añadir Color</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {finishes.map((f) => {
                      const isActive = activeFinishId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveFinishId(f.id)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 bg-[#FFFFFF] font-mono text-xs uppercase transition-all shadow-xs border cursor-pointer ${
                            isActive
                              ? 'border-2 border-[#000000] text-[#1a1c1c] font-bold'
                              : 'border-[#D4D4D0] text-[#6E6E6A] hover:border-[#1a1c1c] hover:text-[#1a1c1c]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-[#E5E5E2]"
                            style={{ backgroundColor: f.colorHex }}
                          ></span>
                          <span>{f.name}</span>
                          {isActive && (
                            <span className="material-symbols-outlined text-[14px] text-[#6E6E6A] ml-1">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matriz de Disponibilidad (Tallas México CM) */}
                <div className="pt-4 border-t border-[#E5E5E2]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                      Matriz de Disponibilidad (Tallas México CM)
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[#6E6E6A]">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]"></span> En Stock
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#fe8357]"></span> Bajo Pedido
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#D4D4D0]"></span> Agotado
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E2] text-[#6E6E6A] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Talla MX</th>
                          <th className="py-2.5 px-3">SKU Sierra</th>
                          <th className="py-2.5 px-3">Estado de Entrega</th>
                          <th className="py-2.5 px-3 text-right">Existencias</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E2]">
                        {sizeMatrix.map((item, idx) => (
                          <tr
                            key={item.size}
                            className="hover:bg-[#f3f4f3] transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-[#1a1c1c]">{item.size}</td>
                            <td className="py-3 px-3 text-[#6E6E6A]">{item.sku}</td>
                            <td className="py-3 px-3">
                              <select
                                value={item.status}
                                onChange={(e) => handleSizeChange(idx, 'status', e.target.value)}
                                className="bg-[#FFFFFF] border border-[#D4D4D0] px-2 py-1 text-xs font-mono focus:border-black outline-none text-[#1a1c1c] cursor-pointer"
                              >
                                <option value="in_stock">✓ Disponible Inmediata</option>
                                <option value="on_demand">⏳ Bajo Pedido (5-7 días)</option>
                                <option value="out">✕ Agotado</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleSizeChange(idx, 'quantity', e.target.value)
                                }
                                className="w-16 text-right px-2 py-1 border border-[#D4D4D0] bg-[#FFFFFF] font-mono focus:border-black outline-none text-[#1a1c1c]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 COLS */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* [04] Fijación de Precio */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E2] pb-3 mb-4">
                <span className="font-mono text-xs text-[#6E6E6A]">[04]</span>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                  Fijación de Precio
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="reg_price"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Precio en Catálogo (MXN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-['Plus_Jakarta_Sans'] text-lg text-[#6E6E6A]">
                      $
                    </span>
                    <input
                      id="reg_price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] font-['Plus_Jakarta_Sans'] text-2xl pl-9 pr-4 py-2 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="compare_price"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Precio de Comparación / Tachar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#6E6E6A]">
                      $
                    </span>
                    <input
                      id="compare_price"
                      type="text"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      placeholder="ej. 3,900.00"
                      className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#6E6E6A] font-mono text-sm pl-7 pr-4 py-2 outline-none"
                    />
                  </div>
                  <p className="font-mono text-[11px] text-[#6E6E6A] mt-1.5">
                    Si se define, mostrará un distintivo de descuento implícito en la ficha.
                  </p>
                </div>
              </div>
            </div>

            {/* [05] Visibilidad & Estatus */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E2] pb-3 mb-4">
                <span className="font-mono text-xs text-[#6E6E6A]">[05]</span>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                  Visibilidad & Estatus
                </h2>
              </div>

              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 p-3 bg-[#f3f4f3] border border-[#E5E5E2]">
                  <div>
                    <p className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                      Estado: {isPublished ? 'Publicado' : 'Oculto'}
                    </p>
                    <p className="font-mono text-xs text-[#6E6E6A]">
                      {isPublished
                        ? `Visible para clientes en ${tenantConfig.storeUrl}`
                        : 'No visible en catálogo público'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#D4D4D0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border-[#D4D4D0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#000000]"></div>
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="stock_badge"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Insignia de Disponibilidad
                  </label>
                  <select
                    id="stock_badge"
                    value={stockBadge}
                    onChange={(e) => setStockBadge(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-xs font-mono px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="En Stock (Entrega Inmediata)">En Stock (Entrega Inmediata)</option>
                    <option value="Edición Limitada (Pocas Piezas)">Edición Limitada (Pocas Piezas)</option>
                    <option value="Preventa Exclusiva">Preventa Exclusiva</option>
                    <option value="Últimas Tallas Disponibles">Últimas Tallas Disponibles</option>
                  </select>
                </div>
              </div>
            </div>

            {/* [06] Conversión WhatsApp (1-CLICK) */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-[#25D366]/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#6E6E6A]">[06]</span>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                    Conversión WhatsApp
                  </h2>
                </div>
                <span className="flex items-center gap-1 font-mono text-[#25D366] text-xs font-bold">
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  1-CLICK
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                      Botonera Directa
                    </p>
                    <p className="font-mono text-xs text-[#6E6E6A]">
                      Abre chat de compra con datos del calzado precargados.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-[#D4D4D0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border-[#D4D4D0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="wa_msg_template"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Plantilla del Mensaje de Entrada
                  </label>
                  <textarea
                    id="wa_msg_template"
                    rows={3}
                    value={waTemplate}
                    onChange={(e) => setWaTemplate(e.target.value)}
                    className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-[#25D366] text-[#1a1c1c] font-mono text-xs p-3 outline-none leading-relaxed"
                  />
                  <p className="text-[10px] font-mono text-[#6E6E6A] mt-1">
                    Variables dinámicas disponibles: {'{nombre_producto}'}, {'{talla}'}, {'{color}'}, {'{sku}'}
                  </p>
                </div>

                <div className="p-3 bg-[#f3f4f3] border border-[#E5E5E2] flex items-center justify-between">
                  <div>
                    <span className="block font-mono text-[10px] text-[#6E6E6A] uppercase">
                      Línea de Ventas Asignada
                    </span>
                    <span className="font-mono text-xs text-[#1a1c1c] font-bold">
                      {tenantConfig.whatsappPhone}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FFFFFF] border border-[#D4D4D0] text-[#6E6E6A] uppercase font-bold">
                    Showroom León
                  </span>
                </div>
              </div>
            </div>

            {/* [07] Categorías & Filtros */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E2] pb-3 mb-4">
                <span className="font-mono text-xs text-[#6E6E6A]">[07]</span>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c] uppercase tracking-tight">
                  Categorías & Filtros
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="prod_category"
                    className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold"
                  >
                    Categoría de Catálogo
                  </label>
                  <select
                    id="prod_category"
                    value={catalogCategory}
                    onChange={(e) => {
                      const val = e.target.value as Product['catalogCategory'];
                      setCatalogCategory(val);
                      if (val === 'botas') setCategory('Calzado');
                      else if (val === 'sandalias') setCategory('Sandalias');
                      else if (val === 'accesorios') setCategory('Accesorios/Mulas');
                      else setCategory('Calzado');
                    }}
                    className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-xs font-mono px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="botas">Botas & Botines</option>
                    <option value="mocasines">Mocasines & Derbies</option>
                    <option value="sandalias">Sandalias de Cuero</option>
                    <option value="accesorios">Cinturones & Marroquinería</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
                    Etiquetas de Búsqueda (Tags)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[#f3f4f3] border border-[#D4D4D0] min-h-[42px] items-center">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-[#FFFFFF] border border-[#D4D4D0] px-2 py-0.5 font-mono text-xs text-[#1a1c1c]"
                      >
                        {tag}
                        <span
                          onClick={() => handleRemoveTag(tag)}
                          className="material-symbols-outlined text-[12px] cursor-pointer text-[#6E6E6A] hover:text-[#ba1a1a]"
                        >
                          close
                        </span>
                      </span>
                    ))}
                    <input
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="+ Escribir tag..."
                      className="bg-transparent text-[#1a1c1c] font-mono text-xs outline-none px-1 flex-1 min-w-[70px]"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Action & Auto-save Strip */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E5E5E2] px-4 lg:px-8 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
            <span className="font-mono text-xs text-[#6E6E6A]">
              Autoguardado en nube local activo · Último cambio registrado hace 12s
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer"
            >
              Descartar Cambios
            </button>

            <button
              type="button"
              onClick={() => {
                const prod = constructProductObject();
                onPreviewInCatalog(prod);
              }}
              className="px-5 py-2.5 bg-[#FFFFFF] text-[#1a1c1c] border border-[#D4D4D0] hover:bg-[#eeeeed] font-mono text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer font-semibold"
            >
              Vista Previa en Catálogo
            </button>

            <button
              type="button"
              onClick={() => {
                handleSubmit();
                onShowToast(isEditing ? 'Ficha de producto actualizada' : 'Nuevo producto creado');
              }}
              className="px-6 py-2.5 bg-[#000000] text-[#ffffff] font-mono text-xs uppercase tracking-wider hover:bg-[#333333] transition-colors flex items-center gap-2 shadow-xs cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_done</span>
              <span>{isEditing ? 'Actualizar Ficha de Producto' : 'Guardar y Publicar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Product, TenantConfig } from '../types';
import { SmartProductImage } from '../components/SmartProductImage';
import { MEXTIE_PRODUCTS } from '../mextieCatalogData';

interface MerchantAiParserViewProps {
  tenantConfig: TenantConfig;
  onSyncAllParsed: (newProducts: Product[]) => void;
  onPreviewProduct: (product: Product) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export const MerchantAiParserView: React.FC<MerchantAiParserViewProps> = ({
  tenantConfig,
  onSyncAllParsed,
  onPreviewProduct,
  onShowToast,
  onBackToInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'pending'>('all');
  const [isResolvedCard4, setIsResolvedCard4] = useState<boolean>(false);
  const [publishedSkus, setPublishedSkus] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleResolveCard4 = () => {
    setIsResolvedCard4(true);
    onShowToast('Discrepancia resuelta: Talla 28.0 asignada con 5 unidades de stock');
  };

  const handlePublishIndividualSku = (sku: string, name: string) => {
    setPublishedSkus((prev) => new Set(prev).add(sku));
    onShowToast(`[${sku}] ${name} publicado en vivo en ${tenantConfig.storeUrl}`);
  };

  const handleSimulateNewUpload = () => {
    setIsUploading(true);
    onShowToast('Cargando y parseando nuevo archivo lookbook...');
    setTimeout(() => {
      setIsUploading(false);
      onShowToast('Lookbook MexTie analizado: 18 fichas generadas con imágenes verificadas');
    }, 1500);
  };

  const handleApproveBatch = () => {
    onShowToast('¡Lote completo MexTie aprobado y sincronizado con catálogo y WhatsApp!');
    onSyncAllParsed(MEXTIE_PRODUCTS);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] lg:pl-64 pt-6 px-4 lg:px-8 pb-28">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#6E6E6A]">
            <button
              onClick={onBackToInventory}
              className="hover:text-[#1a1c1c] cursor-pointer"
            >
              Panel de Comercio
            </button>
            <span>/</span>
            <button
              onClick={onBackToInventory}
              className="hover:text-[#1a1c1c] cursor-pointer"
            >
              Gestión de Catálogo
            </button>
            <span>/</span>
            <span className="text-[#1a1c1c] font-semibold">Importador Inteligente</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2">
            <div className="max-w-3xl space-y-1.5">
              <div className="inline-flex items-center gap-2 bg-[#e8e8e7] px-2.5 py-0.5 border border-[#E5E5E2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a23e18]"></span>
                <span className="font-mono text-xs uppercase text-[#a23e18] font-bold">
                  AI Multimodal Parser v4.1
                </span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight">
                Subir Catálogo y Auto-generar Fichas
              </h1>
              <p className="text-sm text-[#6E6E6A] leading-relaxed">
                Carga tu lookbook en PDF, catálogo comercial o lista de inventario. Candy Catalog reconoce automáticamente fotografías, nombres, precios, variantes de talla y especificaciones técnicas para crear las fichas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onShowToast('Descargando plantilla de mapeo de tallas y calzado...')}
                className="bg-[#FFFFFF] hover:bg-[#eeeeed] text-[#1a1c1c] px-3.5 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-[#E5E5E2] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Plantilla de Mapeo</span>
              </button>
              <button
                onClick={() => onShowToast('Mostrando historial de 12 lotes procesados')}
                className="bg-[#f3f4f3] hover:bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c] px-3.5 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-[#E5E5E2] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Historial</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Uploader: Drag & Drop + Active Batch Telemetry */}
        <div className="bg-[#FFFFFF] shadow-sm p-6 border border-[#E5E5E2]">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Drag & Drop Zone */}
            <div
              onClick={handleSimulateNewUpload}
              className="lg:w-7/12 flex flex-col justify-between bg-[#f3f4f3] p-6 relative group cursor-pointer hover:bg-[#eeeeed] transition-colors border border-dashed border-[#D4D4D0]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#6E6E6A] font-semibold">
                    Origen de Archivo
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping"></span>
                    <span className="font-mono text-xs text-[#25D366] font-bold">
                      Listo para parsing
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center py-4 px-2">
                  <div className="w-14 h-14 bg-[#FFFFFF] flex items-center justify-center mb-3 shadow-xs border border-[#E5E5E2] group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[30px] text-[#1a1c1c]">
                      upload_file
                    </span>
                  </div>

                  <p className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c] mb-1">
                    {isUploading ? 'Procesando archivo...' : 'Arrastra tu catálogo aquí'}
                  </p>

                  <p className="text-xs text-[#6E6E6A] max-w-sm mb-4">
                    Acepta lookbooks editoriales en PDF, listas maestras en Excel/CSV o paquetes comprimidos ZIP con fotos de producto.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#444748] uppercase border border-[#E5E5E2]">
                      PDF Lookbook
                    </span>
                    <span className="bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#444748] uppercase border border-[#E5E5E2]">
                      Mayorista .PDF
                    </span>
                    <span className="bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#444748] uppercase border border-[#E5E5E2]">
                      Excel XLSX
                    </span>
                    <span className="bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#444748] uppercase border border-[#E5E5E2]">
                      CSV UTF-8
                    </span>
                    <span className="bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#444748] uppercase border border-[#E5E5E2]">
                      ZIP Fotos Lote
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between font-mono text-xs text-[#6E6E6A] border-t border-[#E5E5E2]">
                <span>Límite máximo: 150 MB por archivo</span>
                <span className="text-[#a23e18] font-bold">Examinar archivos locales →</span>
              </div>
            </div>

            {/* Active File Loaded & Extractor Telemetry */}
            <div className="lg:w-5/12 flex flex-col justify-between bg-[#e8e8e7] p-6 border border-[#E5E5E2]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                    Lote Activo en Memoria
                  </span>
                  <span className="bg-[#000000] text-[#ffffff] font-mono text-xs px-2 py-0.5 uppercase font-bold">
                    Procesado
                  </span>
                </div>

                <div className="flex items-start gap-3 bg-[#FFFFFF] p-3.5 mb-4 border border-[#E5E5E2]">
                  <div className="w-12 h-14 bg-[#a23e18] text-white flex flex-col items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">
                      PDF
                    </span>
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-mono text-xs text-[#1a1c1c] truncate font-bold">
                        CATALOGO_EDITORIAL_SIERRA_2025_V4.PDF
                      </p>
                      <span className="material-symbols-outlined text-[#6E6E6A] text-[16px] shrink-0">
                        verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#6E6E6A] mt-1">
                      <span>14 páginas</span>
                      <span>•</span>
                      <span>28.4 MB</span>
                      <span>•</span>
                      <span className="text-[#a23e18] font-bold">300 DPI</span>
                    </div>
                  </div>
                </div>

                {/* Extraction Steps / Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#1a1c1c] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#25D366]">
                        check_circle
                      </span>
                      Extracción multimodal completada
                    </span>
                    <span className="font-mono text-[#6E6E6A]">4.2s</span>
                  </div>

                  <div className="w-full bg-[#eeeeed] h-1.5 overflow-hidden">
                    <div className="bg-[#000000] h-full w-full"></div>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs text-[#6E6E6A] pt-1">
                    <span>
                      Confianza de lectura:{' '}
                      <strong className="text-[#1a1c1c] font-bold">98.4%</strong>
                    </span>
                    <span>18 productos aislados</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#eeeeed] p-2.5 mt-4 flex items-center justify-between font-mono text-xs border border-[#E5E5E2]">
                <div className="flex items-center gap-1 text-[#6E6E6A]">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Motor de visión Candy OCR v4</span>
                </div>
                <button
                  onClick={() => onShowToast('Log: 18 bounding boxes aisladas con éxito')}
                  className="text-[#1a1c1c] hover:text-[#a23e18] font-bold uppercase font-mono text-xs flex items-center gap-0.5 cursor-pointer"
                >
                  Ver log técnico <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Extraction Metrics / Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                Fichas Auto-generadas
              </span>
              <span className="material-symbols-outlined text-[#6E6E6A] text-[20px]">style</span>
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] leading-none mb-1">
                18
              </p>
              <p className="text-xs text-[#6E6E6A]">Fichas creadas con descripción y metadatos.</p>
            </div>
            <div className="mt-3 pt-1 font-mono text-xs text-[#a23e18] font-bold">
              +100% automatizado
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                Fotografías Aisladas
              </span>
              <span className="material-symbols-outlined text-[#6E6E6A] text-[20px]">crop_original</span>
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] leading-none mb-1">
                54
              </p>
              <p className="text-xs text-[#6E6E6A]">Recortes inteligentes en alta resolución.</p>
            </div>
            <div className="mt-3 pt-1 font-mono text-xs text-[#6E6E6A]">
              3 tomas promedio por SKU
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                Variantes de Stock
              </span>
              <span className="material-symbols-outlined text-[#6E6E6A] text-[20px]">schema</span>
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] leading-none mb-1">
                72
              </p>
              <p className="text-xs text-[#6E6E6A]">Combinaciones de talla y color parseadas.</p>
            </div>
            <div className="mt-3 pt-1 font-mono text-xs text-[#25D366] font-bold">
              Tallas 24 al 29.5 MX
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider font-semibold">
                Validación de Lote
              </span>
              <span className="material-symbols-outlined text-[#a23e18] text-[20px]">rule</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] leading-none">
                  {isResolvedCard4 ? '18' : '16'}
                </span>
                <span className="font-mono text-xs uppercase text-[#6E6E6A]">/ 18 Listas</span>
              </div>
              <p className="text-xs text-[#6E6E6A]">
                {isResolvedCard4
                  ? 'Todas las fichas confirmadas y listas'
                  : '2 fichas requieren confirmación de precio.'}
              </p>
            </div>
            <div className="mt-3 pt-1 font-mono text-xs text-[#a23e18] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a23e18]"></span>
              <span>{isResolvedCard4 ? 'Lote verificado 100%' : 'Revisión manual asistida'}</span>
            </div>
          </div>
        </div>

        {/* Workbench Toolbar & Filter Bar */}
        <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#000000] text-white font-bold'
                  : 'bg-[#eeeeed] text-[#1a1c1c] hover:bg-[#e8e8e7]'
              }`}
            >
              <span>Todas las Fichas</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2">18</span>
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ready'
                  ? 'bg-[#000000] text-white font-bold'
                  : 'bg-[#eeeeed] text-[#1a1c1c] hover:bg-[#e8e8e7]'
              }`}
            >
              <span>Listas para Publicar</span>
              <span className="bg-[#e2e2e2] text-[#444748] text-[10px] px-1.5 py-0.2">
                {isResolvedCard4 ? '18' : '16'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#a23e18] text-white font-bold'
                  : 'bg-[#eeeeed] text-[#a23e18] hover:bg-[#e8e8e7]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>Por Confirmar</span>
              <span className="bg-[#a23e18] text-white text-[10px] px-1.5 py-0.2">
                {isResolvedCard4 ? '0' : '2'}
              </span>
            </button>

            <div className="w-px h-5 bg-[#E5E5E2] mx-1 hidden md:block"></div>

            <div className="flex items-center gap-1 text-[#6E6E6A]">
              <span>Colección:</span>
              <span className="text-[#1a1c1c] font-bold uppercase">SIERRA OTOÑO/INVIERNO</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onShowToast('Reglas de Auto-Precio aplicadas: Margen estándar +2.4x')}
              className="bg-[#eeeeed] hover:bg-[#e8e8e7] text-[#1a1c1c] px-3 py-1.5 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer border border-[#E5E5E2]"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Reglas de Auto-Precio</span>
            </button>

            <button
              onClick={handleApproveBatch}
              className="bg-[#000000] text-[#ffffff] hover:bg-[#333333] px-4 py-1.5 uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Publicar 16 Fichas Listas</span>
            </button>
          </div>
        </div>

        {/* Comparative Product Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* CARD 1: Botín Chelsea Nómada */}
          {(activeTab === 'all' || activeTab === 'ready') && (
            <div className="bg-[#FFFFFF] shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow border border-[#E5E5E2]">
              <div>
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#eeeeed]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A]">Pág. 03 · PDF</span>
                    <span className="bg-[#f3f4f3] text-[#6E6E6A] font-mono text-xs px-2 py-0.5 border border-[#E5E5E2]">
                      ID: #AI-9021
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase bg-[#25D366]/15 text-[#15803d] px-2 py-0.5 font-bold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Ficha completa al 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="aspect-[4/5] bg-[#f3f4f3] overflow-hidden relative border border-[#E5E5E2]">
                      <img
                        alt="Botín Chelsea Nómada recortado"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSbUtek_8tujIiJ14MfHxKySlrt_UA-RW7_j8N8wTppein5h7_fGOzd6K62vcKCTipnzrt8c96Z77-C9ulxB3bRuuz_R2-7pd3Z8VD-gf5cgjQyz5glQbfjLTjfkm_bvbrBRd9iyqdhZp27jkG-AMBPHEP0suTgw83QKyFNIRrujl4QTmsTwjf_x_ui3I5QPfZGqBbfeAD9gOYhij84stZMWjrwkwnY4e9UmIk3Xzl07vpWDYXxRzI"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/90 text-white font-mono text-[9px] uppercase px-1.5 py-0.5">
                        Foto Principal Recortada
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#6E6E6A]">
                      <div className="bg-[#eeeeed] p-1 text-center">Toma Suela</div>
                      <div className="bg-[#eeeeed] p-1 text-center">Detalle Piel</div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-[#a23e18] uppercase font-bold">
                          Calzado / Botas
                        </span>
                        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          Botín Chelsea Nómada
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          $3,450
                        </span>
                        <span className="block font-mono text-[10px] text-[#6E6E6A]">MXN (IVA inc.)</span>
                      </div>
                    </div>

                    <div className="bg-[#f3f4f3] p-2.5 font-mono text-xs space-y-1 border border-[#E5E5E2]">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">SKU Generado:</span>
                        <span className="text-[#1a1c1c] font-bold">SR-CHE-01-BRN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Construcción:</span>
                        <span className="text-[#1a1c1c]">Goodyear Welted 360°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Origen Piel:</span>
                        <span className="text-[#1a1c1c]">Curtiduría León, Gto.</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6E6E6A] line-clamp-2">
                      Piel vacuno curtida al tanino vegetal en Guanajuato, acabado semibrillante con elásticos laterales italianos reforzados y tirador artesanal.
                    </p>

                    <div>
                      <span className="font-mono text-[11px] uppercase text-[#6E6E6A] block mb-1">
                        Tallas Parseadas (6 SKUs):
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-xs">
                        {['25.0', '26.0', '27.0', '27.5', '28.0', '29.0'].map((sz) => (
                          <span key={sz} className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#eeeeed] p-2 flex items-center justify-between text-[#25D366] font-mono text-xs border border-[#E5E5E2]">
                      <span className="flex items-center gap-1 text-[#444748]">
                        <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                        <span>Mensaje de pedido directo listo</span>
                      </span>
                      <span className="text-[#6E6E6A] font-mono text-[10px]">Auto-link</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 bg-[#f3f4f3] -mx-4 -mb-4 p-3 border-t border-[#E5E5E2]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onShowToast('Visualizando ficha de Botín Chelsea')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Ver Ficha</span>
                  </button>
                  <button
                    onClick={() => onShowToast('Abriendo editor para Botín Chelsea')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Editar</span>
                  </button>
                </div>

                <button
                  onClick={() => handlePublishIndividualSku('SR-CHE-01-BRN', 'Botín Chelsea Nómada')}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer font-bold ${
                    publishedSkus.has('SR-CHE-01-BRN')
                      ? 'bg-[#25D366] text-white'
                      : 'bg-[#000000] text-white hover:bg-[#333333]'
                  }`}
                >
                  {publishedSkus.has('SR-CHE-01-BRN') ? '✓ Publicado' : 'Publicar SKU'}
                </button>
              </div>
            </div>
          )}

          {/* CARD 2: Mocasín Riviera Crepé */}
          {(activeTab === 'all' || activeTab === 'ready') && (
            <div className="bg-[#FFFFFF] shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow border border-[#E5E5E2]">
              <div>
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#eeeeed]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A]">Pág. 05 · PDF</span>
                    <span className="bg-[#f3f4f3] text-[#6E6E6A] font-mono text-xs px-2 py-0.5 border border-[#E5E5E2]">
                      ID: #AI-9022
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase bg-[#25D366]/15 text-[#15803d] px-2 py-0.5 font-bold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Ficha completa al 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="aspect-[4/5] bg-[#f3f4f3] overflow-hidden relative border border-[#E5E5E2]">
                      <img
                        alt="Mocasín Riviera Crepé"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/90 text-white font-mono text-[9px] uppercase px-1.5 py-0.5">
                        2 Fotos Extraídas
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#6E6E6A]">
                      <div className="bg-[#eeeeed] p-1 text-center font-bold text-[#1a1c1c]">
                        Color Arena
                      </div>
                      <div className="bg-[#eeeeed] p-1 text-center font-bold text-[#1a1c1c]">
                        Color Tabaco
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-[#a23e18] uppercase font-bold">
                          Calzado / Mocasines
                        </span>
                        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          Mocasín Riviera Crepé
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          $2,980
                        </span>
                        <span className="block font-mono text-[10px] text-[#6E6E6A]">MXN (IVA inc.)</span>
                      </div>
                    </div>

                    <div className="bg-[#f3f4f3] p-2.5 font-mono text-xs space-y-1 border border-[#E5E5E2]">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">SKU Base:</span>
                        <span className="text-[#1a1c1c] font-bold">SR-RIV-02</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Material:</span>
                        <span className="text-[#1a1c1c]">Gamuza de becerro aterciopelada</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Suela:</span>
                        <span className="text-[#1a1c1c]">Caucho natural crepe virgen</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6E6E6A] line-clamp-2">
                      Inspirado en la sastrería mediterránea. Interior forrado en badana de cerdo transpirable y plantilla anatómica con memoria.
                    </p>

                    <div>
                      <span className="font-mono text-[11px] uppercase text-[#6E6E6A] block mb-1">
                        Tallas Parseadas (5 SKUs):
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-xs">
                        {['25.0', '26.0', '27.0', '28.0', '29.0'].map((sz) => (
                          <span key={sz} className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#eeeeed] p-2 flex items-center justify-between text-[#25D366] font-mono text-xs border border-[#E5E5E2]">
                      <span className="flex items-center gap-1 text-[#444748]">
                        <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                        <span>Mensaje de pedido directo listo</span>
                      </span>
                      <span className="text-[#6E6E6A] font-mono text-[10px]">Auto-link</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 bg-[#f3f4f3] -mx-4 -mb-4 p-3 border-t border-[#E5E5E2]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onShowToast('Visualizando ficha de Mocasín Riviera')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Ver Ficha</span>
                  </button>
                  <button
                    onClick={() => onShowToast('Abriendo editor para Mocasín Riviera')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Editar</span>
                  </button>
                </div>

                <button
                  onClick={() => handlePublishIndividualSku('SR-RIV-02', 'Mocasín Riviera Crepé')}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer font-bold ${
                    publishedSkus.has('SR-RIV-02')
                      ? 'bg-[#25D366] text-white'
                      : 'bg-[#000000] text-white hover:bg-[#333333]'
                  }`}
                >
                  {publishedSkus.has('SR-RIV-02') ? '✓ Publicado' : 'Publicar SKU'}
                </button>
              </div>
            </div>
          )}

          {/* CARD 3: Derby Brutalista 02 */}
          {(activeTab === 'all' || activeTab === 'ready') && (
            <div className="bg-[#FFFFFF] shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow border border-[#E5E5E2]">
              <div>
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#eeeeed]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A]">Pág. 08 · PDF</span>
                    <span className="bg-[#f3f4f3] text-[#6E6E6A] font-mono text-xs px-2 py-0.5 border border-[#E5E5E2]">
                      ID: #AI-9023
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase bg-[#25D366]/15 text-[#15803d] px-2 py-0.5 font-bold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Ficha completa al 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="aspect-[4/5] bg-[#f3f4f3] overflow-hidden relative border border-[#E5E5E2]">
                      <img
                        alt="Derby Brutalista 02"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV8_hGjBn7y8fa0mWH2q7XbC4kNliE4SPBeBBj_ZNQbtLpjOjBu5zW5mMEo0ZczPt_GOFNcKZCBcg1xqOo52QqZe3ngu1GHxzt4frX4utiVcyzumJpSzlBbcFRpcF4jLoiyCLolWOOtXn_f9OzRaJvqVxqerIveAGkumw2LWIiYjiWAi9MSX7mJUaWfNJNx6tB1NtNZl4MPHPS0gzwAoRAeDCjTs1Y-eYdW-v8qsq4dv1AdG7gH8tn"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/90 text-white font-mono text-[9px] uppercase px-1.5 py-0.5">
                        Foto Principal Recortada
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#6E6E6A]">
                      <div className="bg-[#eeeeed] p-1 text-center">Perfil Lateral</div>
                      <div className="bg-[#eeeeed] p-1 text-center">Suela Vibram</div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-[#a23e18] uppercase font-bold">
                          Calzado / Zapatos
                        </span>
                        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          Derby Brutalista 02
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          $3,800
                        </span>
                        <span className="block font-mono text-[10px] text-[#6E6E6A]">MXN (IVA inc.)</span>
                      </div>
                    </div>

                    <div className="bg-[#f3f4f3] p-2.5 font-mono text-xs space-y-1 border border-[#E5E5E2]">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">SKU Base:</span>
                        <span className="text-[#1a1c1c] font-bold">SR-DRB-02-BLK</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Material:</span>
                        <span className="text-[#1a1c1c]">Piel vacuno grano cerrado negro mate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Suela:</span>
                        <span className="text-[#1a1c1c]">Vibram Commando dentada 3.8 cm</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6E6E6A] line-clamp-2">
                      Silueta de proporciones sobredimensionadas con ribete storm welt. Ojillos metálicos reforzados y agujetas de algodón encerado.
                    </p>

                    <div>
                      <span className="font-mono text-[11px] uppercase text-[#6E6E6A] block mb-1">
                        Tallas Parseadas (5 SKUs):
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-xs">
                        {['25.5', '26.5', '27.5', '28.5', '29.5'].map((sz) => (
                          <span key={sz} className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#eeeeed] p-2 flex items-center justify-between text-[#25D366] font-mono text-xs border border-[#E5E5E2]">
                      <span className="flex items-center gap-1 text-[#444748]">
                        <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                        <span>Mensaje de pedido directo listo</span>
                      </span>
                      <span className="text-[#6E6E6A] font-mono text-[10px]">Auto-link</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 bg-[#f3f4f3] -mx-4 -mb-4 p-3 border-t border-[#E5E5E2]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onShowToast('Visualizando ficha de Derby Brutalista')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Ver Ficha</span>
                  </button>
                  <button
                    onClick={() => onShowToast('Abriendo editor para Derby Brutalista')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Editar</span>
                  </button>
                </div>

                <button
                  onClick={() => handlePublishIndividualSku('SR-DRB-02-BLK', 'Derby Brutalista 02')}
                  className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer font-bold ${
                    publishedSkus.has('SR-DRB-02-BLK')
                      ? 'bg-[#25D366] text-white'
                      : 'bg-[#000000] text-white hover:bg-[#333333]'
                  }`}
                >
                  {publishedSkus.has('SR-DRB-02-BLK') ? '✓ Publicado' : 'Publicar SKU'}
                </button>
              </div>
            </div>
          )}

          {/* CARD 4: Bota de Trabajo Urbana (Requiere Atención) */}
          {(activeTab === 'all' || activeTab === 'pending' || (activeTab === 'ready' && isResolvedCard4)) && (
            <div className="bg-[#FFFFFF] shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative border border-[#E5E5E2]">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isResolvedCard4 ? 'bg-[#25D366]' : 'bg-[#a23e18]'
                }`}
              ></div>
              <div>
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#eeeeed]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase text-[#6E6E6A]">Pág. 11 · PDF</span>
                    <span className="bg-[#f3f4f3] text-[#6E6E6A] font-mono text-xs px-2 py-0.5 border border-[#E5E5E2]">
                      ID: #AI-9024
                    </span>
                  </div>

                  {isResolvedCard4 ? (
                    <span className="inline-flex items-center gap-1 font-mono text-xs uppercase bg-[#25D366]/15 text-[#15803d] px-2 py-0.5 font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Stock verificado y listo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-xs uppercase bg-[#ffdbcf] text-[#822801] px-2 py-0.5 font-bold">
                      <span className="material-symbols-outlined text-[14px]">priority_high</span>
                      ! Confirmar stock talla 28
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="aspect-[4/5] bg-[#f3f4f3] overflow-hidden relative border border-[#E5E5E2]">
                      <img
                        alt="Bota de Trabajo Urbana"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzVdE6CnLEYQKWxOUhosYjKcT7C265j2htNwc2ht0CpMS-gVCFg3TXfu6Ot8m_-quuVp0CT1NI_A-s6t0U8_ve8c9oVYFSB788OYzCMAku9y4nTb6mjBX-DOPrLq_6h7epv0psCgcnly48nFMKKTsZ6ZDUJGYW9U_vxbb7GC-ZB8kD3yTxJ8Z6MFqXjDJm0_YKpxdQp9JqAE0bB_Y4ixVc5u8nZTkLZigct24m8AmotSlybo_5DUZS"
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute bottom-2 left-2 text-white font-mono text-[9px] uppercase px-1.5 py-0.5 font-bold ${
                          isResolvedCard4 ? 'bg-[#25D366]' : 'bg-[#a23e18]'
                        }`}
                      >
                        {isResolvedCard4 ? 'Stock Asignado' : 'Revisión Manual'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#6E6E6A]">
                      <div className="bg-[#eeeeed] p-1 text-center">Frente</div>
                      <div className="bg-[#eeeeed] p-1 text-center">Etiqueta Piel</div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-[#a23e18] uppercase font-bold">
                          Calzado / Botas
                        </span>
                        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          Bota de Trabajo Urbana
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c]">
                          $3,650
                        </span>
                        <span className="block font-mono text-[10px] text-[#6E6E6A]">MXN (IVA inc.)</span>
                      </div>
                    </div>

                    <div className="bg-[#f3f4f3] p-2.5 font-mono text-xs space-y-1 border border-[#E5E5E2]">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">SKU Detectado:</span>
                        <span className="text-[#1a1c1c] font-bold">SR-WRK-04-OIL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Tratamiento:</span>
                        <span className="text-[#1a1c1c]">Cuero repelente al agua & aceitado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6E6E6A]">Discrepancia:</span>
                        <span
                          className={`font-semibold ${
                            isResolvedCard4 ? 'text-[#25D366]' : 'text-[#a23e18]'
                          }`}
                        >
                          {isResolvedCard4
                            ? '✓ Resuelto (5 uds en talla 28)'
                            : 'Talla 28 sin cantidad en tabla'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6E6E6A] line-clamp-2">
                      Construcción de triple costura con lengüeta cerrada para evitar filtraciones de humedad y polvo urbano.
                    </p>

                    <div>
                      <span className="font-mono text-[11px] uppercase text-[#6E6E6A] block mb-1">
                        Tallas Detectadas:
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-xs">
                        <span className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">25.0</span>
                        <span className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">26.0</span>
                        <span className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">27.0</span>
                        <span
                          className={`px-2 py-0.5 font-bold border ${
                            isResolvedCard4
                              ? 'bg-[#25D366]/20 text-[#15803d] border-[#25D366]'
                              : 'bg-[#ffdbcf] text-[#822801] border-[#ffb59c]'
                          }`}
                        >
                          28.0 {isResolvedCard4 ? '(5 uds)' : '?'}
                        </span>
                        <span className="bg-[#eeeeed] text-[#1a1c1c] px-2 py-0.5 border border-[#E5E5E2]">29.0</span>
                      </div>
                    </div>

                    {/* Inline Quick Fix */}
                    {!isResolvedCard4 ? (
                      <div className="bg-[#ffdbcf]/40 p-2.5 flex items-center justify-between font-mono text-xs border border-[#ffb59c]">
                        <span className="text-[#822801] font-medium text-[11px]">
                          ¿Asignar stock inicial estándar (5 uds)?
                        </span>
                        <button
                          onClick={handleResolveCard4}
                          className="bg-[#000000] text-white px-3 py-1 font-mono text-[10px] uppercase font-bold hover:bg-[#a23e18] transition-colors cursor-pointer shadow-xs"
                        >
                          Confirmar
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#25D366]/10 p-2 text-xs font-mono text-[#15803d] flex items-center gap-1 border border-[#bbf7d0]">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Inventario confirmado para publicación</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 bg-[#f3f4f3] -mx-4 -mb-4 p-3 border-t border-[#E5E5E2]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onShowToast('Visualizando ficha de Bota de Trabajo')}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#1a1c1c] px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Ver Ficha</span>
                  </button>
                  <button
                    onClick={handleResolveCard4}
                    className="bg-[#FFFFFF] hover:bg-[#e8e8e7] text-[#a23e18] font-bold px-2.5 py-1 font-mono text-xs uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#E5E5E2] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    <span>{isResolvedCard4 ? 'Editado' : 'Resolver duda'}</span>
                  </button>
                </div>

                {isResolvedCard4 ? (
                  <button
                    onClick={() => handlePublishIndividualSku('SR-WRK-04-OIL', 'Bota de Trabajo Urbana')}
                    className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer font-bold ${
                      publishedSkus.has('SR-WRK-04-OIL')
                        ? 'bg-[#25D366] text-white'
                        : 'bg-[#000000] text-white hover:bg-[#333333]'
                    }`}
                  >
                    {publishedSkus.has('SR-WRK-04-OIL') ? '✓ Publicado' : 'Publicar SKU'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-[#e8e8e7] text-[#6E6E6A] px-3 py-1 font-mono text-xs uppercase tracking-wider cursor-not-allowed border border-[#D4D4D0]"
                  >
                    Bloqueado
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action & Sync Bar */}
        <div className="fixed bottom-4 left-4 right-4 lg:left-72 z-30 bg-[#000000] text-[#ffffff] p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-black/20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse shrink-0"></div>
            <div className="font-mono text-xs">
              <div className="text-white font-bold uppercase tracking-wider">
                TIENDA SIERRA EN LÍNEA: SINCRONIZACIÓN LISTA
              </div>
              <div className="text-[#c9c6c5]">
                {isResolvedCard4 ? '18' : '16'} fichas completadas se integrarán al catálogo de WhatsApp y catálogo web inmediatamente.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end font-mono text-xs">
            <button
              onClick={() => onShowToast('Lote descartado')}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Descartar Lote
            </button>
            <button
              onClick={() => onShowToast('Exportando archivo XLS con 18 referencias...')}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              <span>Exportar XLS</span>
            </button>
            <button
              onClick={handleApproveBatch}
              className="bg-[#a23e18] hover:bg-[#fe8357] text-white px-5 py-2 uppercase tracking-wider font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              <span>Aprobar y Sincronizar Lote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

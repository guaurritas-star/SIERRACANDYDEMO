import React from 'react';
import { Product, TenantConfig, WhatsAppLead } from '../types';

interface MerchantOverviewViewProps {
  products: Product[];
  leads: WhatsAppLead[];
  tenantConfig: TenantConfig;
  onNavigateMerchantTab: (tab: string) => void;
  onViewLiveCatalog: () => void;
}

export const MerchantOverviewView: React.FC<MerchantOverviewViewProps> = ({
  products,
  leads,
  tenantConfig,
  onNavigateMerchantTab,
  onViewLiveCatalog,
}) => {
  const publishedCount = products.filter((p) => p.status === 'published').length;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] lg:pl-64 pt-6 px-4 lg:px-8 pb-16">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] font-semibold">
                PANEL PRINCIPAL
              </span>
              <span className="text-[#6E6E6A]">/</span>
              <span className="font-mono text-xs text-[#25D366] font-bold">ACTIVO EN VIVO</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] tracking-tight mt-1">
              Consola Operativa SIERRA
            </h1>
            <p className="text-sm text-[#6E6E6A]">
              Rendimiento comercial y embudo de conversión artesanal 1 a 1 por WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewLiveCatalog}
              className="px-4 py-2 bg-[#FFFFFF] border border-[#E5E5E2] font-mono text-xs uppercase hover:bg-[#eeeeed] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span>Ver Tienda</span>
            </button>
            <button
              onClick={() => onNavigateMerchantTab('catalog')}
              className="px-4 py-2 bg-[#000000] text-white font-mono text-xs uppercase hover:bg-[#333333] transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>Catálogo ({products.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Shortcut Hero Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateMerchantTab('catalog')}
            className="p-5 bg-[#FFFFFF] border border-[#E5E5E2] shadow-sm hover:border-[#1a1c1c] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase text-[#6E6E6A] font-bold">
                Gestión de Catálogo
              </span>
              <span className="material-symbols-outlined text-[#6E6E6A] group-hover:text-[#1a1c1c] text-[20px]">
                arrow_forward
              </span>
            </div>
            <p className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1a1c1c]">
              {publishedCount} Publicados
            </p>
            <p className="text-xs text-[#6E6E6A] mt-1">
              Control de existencias, precios y matrices de talla MX.
            </p>
          </div>

          <div
            onClick={() => onNavigateMerchantTab('ai-parser')}
            className="p-5 bg-[#FFFFFF] border border-[#E5E5E2] shadow-sm hover:border-[#a23e18] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase text-[#a23e18] font-bold">
                Auto-Parse Lookbook (IA)
              </span>
              <span className="material-symbols-outlined text-[#a23e18] text-[20px]">
                auto_awesome
              </span>
            </div>
            <p className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1a1c1c]">
              18 Fichas Listas
            </p>
            <p className="text-xs text-[#6E6E6A] mt-1">
              Extracción multimodal de fotos, precios y SKUs desde PDF.
            </p>
          </div>

          <div
            onClick={() => onNavigateMerchantTab('orders')}
            className="p-5 bg-[#FFFFFF] border border-[#E5E5E2] shadow-sm hover:border-[#25D366] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase text-[#25D366] font-bold">
                Pedidos WhatsApp
              </span>
              <span className="material-symbols-outlined text-[#25D366] text-[20px]">chat</span>
            </div>
            <p className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#1a1c1c]">
              {leads.length} Conversaciones
            </p>
            <p className="text-xs text-[#6E6E6A] mt-1">
              Asesoría de calce y órdenes directas con clientes.
            </p>
          </div>
        </div>

        {/* Traffic Channels & Recent Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eeeeed]">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c] uppercase">
                Últimas Consultas de Compra por WhatsApp
              </h2>
              <button
                onClick={() => onNavigateMerchantTab('orders')}
                className="font-mono text-xs uppercase text-[#a23e18] font-bold hover:underline cursor-pointer"
              >
                Ver Todas →
              </button>
            </div>

            <div className="divide-y divide-[#eeeeed]">
              {leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-[#1a1c1c]">{lead.clientName}</div>
                    <div className="font-mono text-xs text-[#6E6E6A]">
                      {lead.productName} · Talla {lead.size} ({lead.finish})
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#6E6E6A] hidden sm:inline">
                      {lead.date}
                    </span>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#25D366] text-white font-mono text-[11px] font-bold uppercase hover:bg-[#18964B] transition-colors"
                    >
                      Chat
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm space-y-4">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1a1c1c] uppercase pb-2 border-b border-[#eeeeed]">
              Origen de Tráfico al Catálogo
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#444748]">WhatsApp Direct Catalog</span>
                  <span className="font-bold text-[#1a1c1c]">64%</span>
                </div>
                <div className="w-full bg-[#eeeeed] h-2">
                  <div className="bg-[#25D366] h-full" style={{ width: '64%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#444748]">Instagram Bio & Stories</span>
                  <span className="font-bold text-[#1a1c1c]">22%</span>
                </div>
                <div className="w-full bg-[#eeeeed] h-2">
                  <div className="bg-[#000000] h-full" style={{ width: '22%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#444748]">Búsqueda Orgánica & Directo</span>
                  <span className="font-bold text-[#1a1c1c]">14%</span>
                </div>
                <div className="w-full bg-[#eeeeed] h-2">
                  <div className="bg-[#a23e18] h-full" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#eeeeed] bg-[#f3f4f3] p-3 border border-[#E5E5E2]">
              <span className="font-mono text-[10px] text-[#6E6E6A] uppercase block font-semibold">
                Línea Activa Concierge
              </span>
              <span className="font-mono text-sm text-[#1a1c1c] font-bold">
                {tenantConfig.whatsappPhone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

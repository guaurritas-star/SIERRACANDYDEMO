import React from 'react';
import { Product, TenantConfig } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  tenantConfig: TenantConfig;
  onDownload: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  products,
  tenantConfig,
  onDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-[#E5E5E2] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a23e18] text-[24px]">
              picture_as_pdf
            </span>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase text-[#1a1c1c]">
                Exportar Catálogo Comercial PDF
              </h3>
              <p className="font-mono text-xs text-[#6E6E6A]">
                Formato suizo de alta resolución para compradores B2B y WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#f3f4f3] border border-[#E5E5E2] space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#6E6E6A]">Empresa / Tenant:</span>
              <span className="font-bold text-[#1a1c1c]">{tenantConfig.name}</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#6E6E6A]">Productos incluidos:</span>
              <span className="font-bold text-[#1a1c1c]">
                {products.filter((p) => p.status === 'published').length} referencias activas
              </span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#6E6E6A]">Resolución fotográfica:</span>
              <span className="font-bold text-[#25D366]">300 DPI Vectorial</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#6E6E6A]">Hipervínculos a WhatsApp:</span>
              <span className="font-bold text-[#1a1c1c]">Activados por cada SKU</span>
            </div>
          </div>

          <div className="border border-[#E5E5E2] p-4 max-h-48 overflow-y-auto divide-y divide-[#eeeeed]">
            <p className="font-mono text-[11px] text-[#6E6E6A] uppercase mb-2 font-semibold">
              Índice de Fichas a Generar:
            </p>
            {products.map((prod) => (
              <div key={prod.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#6E6E6A] text-[10px]">{prod.sku}</span>
                  <span className="font-medium text-[#1a1c1c]">{prod.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">${prod.price.toLocaleString()} MXN</span>
                  <span
                    className={`font-mono text-[9px] uppercase px-1.5 py-0.5 ${
                      prod.status === 'published'
                        ? 'bg-[#25D366]/20 text-[#178540]'
                        : 'bg-[#eeeeed] text-[#6E6E6A]'
                    }`}
                  >
                    {prod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E5E2]">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs uppercase text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#000000] text-[#ffffff] font-mono text-xs uppercase font-semibold hover:bg-[#333333] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Generar y Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

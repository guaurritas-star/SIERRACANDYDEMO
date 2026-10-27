import React from 'react';
import { Product, TenantConfig } from '../types';
import { cleanWhatsAppPhone } from '../utils/whatsapp';
import { SmartProductImage } from './SmartProductImage';

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  finish: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  tenantConfig: TenantConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  tenantConfig,
}) => {
  if (!isOpen) return null;

  const brandName = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const currency = tenantConfig.currency || 'MXN';
  const total = items.reduce((acc, curr) => acc + curr.product.price, 0);

  const generateBulkWhatsAppMessage = () => {
    let msg = `Hola ${brandName}, me interesa consultar la disponibilidad para ordenar las siguientes piezas:\n\n`;
    items.forEach((item, idx) => {
      const skuText = item.product.sku ? ` (SKU: ${item.product.sku})` : '';
      msg += `${idx + 1}. ${item.product.name}${skuText} — Acabado: ${item.finish}, Talla: ${item.size} ($${item.product.price.toLocaleString()} ${currency})\n`;
    });
    msg += `\nSubtotal estimado: $${total.toLocaleString()} ${currency}.\n¿Me pueden confirmar existencia y tiempo de envío?`;
    const phone = cleanWhatsAppPhone(tenantConfig.whatsappPhone);
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selección de piezas"
      className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#e4e2dc]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="p-5 border-b border-[#e4e2dc] flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-xl font-semibold text-[#141413]">
                Tu Selección ({items.length})
              </h3>
              <p className="text-xs text-[#73716b]">
                Piezas guardadas para consulta directa en {brandName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar selección"
              className="w-9 h-9 flex items-center justify-center text-[#73716b] hover:text-[#141413] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-5 max-h-[calc(100vh-16rem)] overflow-y-auto divide-y divide-[#e4e2dc]">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-[#141413]">
                  Aún no has guardado piezas en tu selección
                </p>
                <p className="text-xs text-[#73716b] max-w-xs mx-auto leading-relaxed">
                  Abre cualquier pieza del catálogo, elige tu acabado y talla, y agrégala para consultar varios modelos en un solo mensaje de WhatsApp.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex items-start gap-3.5">
                  <div className="w-16 h-20 border border-[#e4e2dc] shrink-0 overflow-hidden bg-[#efede8]">
                    <SmartProductImage
                      alt={item.product.name}
                      src={item.product.heroImage}
                      productName={item.product.name}
                      fallbackCategory={item.product.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-sm text-[#141413] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-[#73716b]">
                      {item.finish} · Talla {item.size}
                    </p>
                    <p className="font-data text-xs font-semibold text-[#141413]">
                      ${item.product.price.toLocaleString()} {currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-xs text-[#73716b] hover:text-[#991b1b] transition-colors cursor-pointer py-1 px-2"
                    title="Quitar de la selección"
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-[#f7f6f2] border-t border-[#e4e2dc] space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#4a4945]">Total estimado</span>
              <span className="font-data font-semibold text-lg text-[#141413]">
                ${total.toLocaleString()} {currency}
              </span>
            </div>

            <a
              href={generateBulkWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-medium tracking-wide transition-colors text-center"
            >
              <span>Consultar Selección por WhatsApp</span>
              <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
            </a>

            <p className="text-[11px] text-[#73716b] text-center">
              Atención directa en el número {tenantConfig.whatsappPhone}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

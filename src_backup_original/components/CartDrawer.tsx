import React from 'react';
import { Product, TenantConfig } from '../types';

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

  const total = items.reduce((acc, curr) => acc + curr.product.price, 0);

  const generateBulkWhatsAppMessage = () => {
    let msg = `Hola equipo SIERRA 👋 Me gustaría consultar la disponibilidad y ordenar los siguientes ${items.length} pares:\n\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.product.name} (Ref: ${item.product.sku}) - Talla ${item.size} MX - Acabado: ${item.finish} - $${item.product.price.toLocaleString()} MXN\n`;
    });
    msg += `\nTotal estimado: $${total.toLocaleString()} MXN (IVA incluido).\n¿Tienen entrega disponible a mi código postal?`;
    return `https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      msg
    )}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-[#FFFFFF] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E5E5E2] animate-in slide-in-from-right duration-200">
        <div>
          <div className="p-4 border-b border-[#E5E5E2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#1a1c1c]">
                shopping_bag
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base uppercase text-[#1a1c1c]">
                Bolsa de Selección ({items.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#6E6E6A] hover:text-[#1a1c1c] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-4 max-h-[calc(100vh-16rem)] overflow-y-auto divide-y divide-[#eeeeed]">
            {items.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#6E6E6A]">
                Tu bolsa de selección está vacía.
                <br />
                Explora el catálogo y añade los modelos que te interesan para consultar en lote.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-3 flex items-start gap-3">
                  <img
                    alt={item.product.name}
                    src={item.product.heroImage}
                    className="w-14 h-14 object-cover border border-[#E5E5E2] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c] truncate">
                      {item.product.name}
                    </h4>
                    <p className="font-mono text-xs text-[#6E6E6A]">
                      Talla {item.size} MX · {item.finish}
                    </p>
                    <p className="font-mono text-xs font-semibold text-[#1a1c1c] mt-0.5">
                      ${item.product.price.toLocaleString()} MXN
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-[#6E6E6A] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    title="Eliminar de bolsa"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-[#f3f4f3] border-t border-[#E5E5E2] space-y-3">
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="text-[#6E6E6A]">Total Estimado (IVA Inc.):</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1a1c1c]">
                ${total.toLocaleString()} MXN
              </span>
            </div>

            <a
              href={generateBulkWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#1FAF59] hover:bg-[#18964B] text-white py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs uppercase font-bold tracking-wider shadow-md transition-all text-center"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Consultar Todo por WhatsApp</span>
            </a>

            <p className="text-[10px] font-mono text-[#6E6E6A] text-center">
              Recibirás confirmación de inventario directo del taller de León.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

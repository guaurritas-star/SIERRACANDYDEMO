import React, { useState } from 'react';
import { Product } from '../types';
import { SmartProductImage } from './SmartProductImage';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [term, setTerm] = useState('');

  if (!isOpen) return null;

  const publicProducts = products.filter((p) => p.status !== 'hidden');

  const results = term.trim()
    ? publicProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(term.toLowerCase()) ||
          p.sku.toLowerCase().includes(term.toLowerCase()) ||
          p.category.toLowerCase().includes(term.toLowerCase()) ||
          p.description.toLowerCase().includes(term.toLowerCase())
      )
    : publicProducts.slice(0, 6);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en el catálogo"
      className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] max-w-xl w-full shadow-2xl border border-[#e4e2dc] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#e4e2dc] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#73716b] text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nombre, SKU, material o categoría..."
            className="flex-1 text-sm text-[#141413] outline-none placeholder:text-[#73716b]"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#73716b] hover:text-[#141413] text-xs px-2 py-1 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#e4e2dc]">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#73716b]">
              No se encontraron piezas para «{term}»
            </div>
          ) : (
            results.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  onSelectProduct(prod);
                  onClose();
                }}
                className="w-full p-3.5 hover:bg-[#f7f6f2] flex items-center justify-between cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-14 border border-[#e4e2dc] shrink-0 overflow-hidden bg-[#efede8]">
                    <SmartProductImage
                      alt={prod.name}
                      src={prod.heroImage}
                      productName={prod.name}
                      fallbackCategory={prod.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-[#141413] truncate">{prod.name}</div>
                    <div className="text-xs text-[#73716b] truncate">
                      {prod.category} · <span className="font-data">{prod.sku}</span>
                      {prod.status === 'soldout' && ' · Agotado'}
                    </div>
                  </div>
                </div>
                <div className="font-data text-xs font-semibold text-[#141413] shrink-0 ml-4">
                  ${prod.price.toLocaleString()} MXN
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

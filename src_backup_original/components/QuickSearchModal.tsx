import React, { useState } from 'react';
import { Product } from '../types';

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

  const results = term.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(term.toLowerCase()) ||
          p.sku.toLowerCase().includes(term.toLowerCase()) ||
          p.category.toLowerCase().includes(term.toLowerCase())
      )
    : products.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-[#FFFFFF] max-w-xl w-full shadow-2xl border border-[#E5E5E2] overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E2] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#6E6E6A] text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por silueta, SKU, categoría o piel..."
            className="flex-1 text-sm text-[#1a1c1c] outline-none"
          />
          <button
            onClick={onClose}
            className="text-[#6E6E6A] hover:text-[#1a1c1c] text-xs font-mono uppercase cursor-pointer"
          >
            [ESC]
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#eeeeed]">
          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6E6E6A] font-mono">
              No se encontraron coincidencias para "{term}"
            </div>
          ) : (
            results.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  onSelectProduct(prod);
                  onClose();
                }}
                className="p-3 hover:bg-[#f3f4f3] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt={prod.name}
                    src={prod.heroImage}
                    className="w-10 h-10 object-cover border border-[#E5E5E2]"
                  />
                  <div>
                    <div className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c]">
                      {prod.name}
                    </div>
                    <div className="font-mono text-xs text-[#6E6E6A]">
                      SKU: {prod.sku} · {prod.category}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs font-semibold text-[#1a1c1c]">
                  ${prod.price.toLocaleString()} MXN
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

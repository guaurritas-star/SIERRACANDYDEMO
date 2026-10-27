import React from 'react';
import { TenantConfig } from '../types';

interface FooterProps {
  tenantConfig: TenantConfig;
  onNavigatePublic?: (tab: 'catalog' | 'product', sectionId?: string) => void;
  onOpenMerchant?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  tenantConfig,
  onNavigatePublic,
  onOpenMerchant,
}) => {
  const brandName = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const tagline =
    tenantConfig.theme?.tagline ||
    'Curaduría de piezas artesanales y comercio directo de alta gama. Red Candy Catalog.';

  return (
    <footer className="w-full bg-[#FFFFFF] shadow-[0_-1px_0_rgba(0,0,0,0.06)] border-t border-[#E5E5E2]">
      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase text-[#1a1c1c]">
                {brandName}
              </span>
              <span className="font-mono text-xs text-[#6E6E6A]">STUDIO</span>
            </div>
            <p className="text-sm text-[#6E6E6A] leading-relaxed">{tagline}</p>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1a1c1c] mb-3 font-semibold">
              Colecciones
            </div>
            <ul className="space-y-2 text-sm text-[#444748]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePublic && onNavigatePublic('catalog', 'coleccion')}
                  className="hover:text-[#1a1c1c] transition-colors cursor-pointer text-left"
                >
                  Catálogo Principal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePublic && onNavigatePublic('catalog', 'coleccion')}
                  className="hover:text-[#1a1c1c] transition-colors cursor-pointer text-left"
                >
                  Ediciones Especiales
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePublic && onNavigatePublic('catalog', 'tallas-guide')}
                  className="hover:text-[#1a1c1c] transition-colors cursor-pointer text-left"
                >
                  Pedidos Mayoristas B2B
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1a1c1c] mb-3 font-semibold">
              Canales Directos
            </div>
            <ul className="space-y-2 text-sm text-[#444748]">
              <li>
                <a
                  href={`https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1a1c1c] transition-colors"
                >
                  WhatsApp Catalog Link
                </a>
              </li>
              <li>
                <a href="#tallas-guide" className="hover:text-[#1a1c1c] transition-colors">
                  Envíos y Despacho
                </a>
              </li>
              <li>
                <a href="#manifiesto" className="hover:text-[#1a1c1c] transition-colors">
                  Manifiesto de Origen
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1a1c1c] mb-3 font-semibold">
              Ecosistema
            </div>
            <div className="p-3 bg-[#f3f4f3] space-y-1 font-mono text-xs text-[#6E6E6A] border border-[#E5E5E2]">
              <div>PLATAFORMA: Candy Catalog OS</div>
              <div>TENANT ID: {tenantConfig.tenantId}</div>
              <div className="flex items-center gap-1.5 text-[#1a1c1c] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                <span>ACTIVO: Catálogo en Vivo</span>
              </div>
              {onOpenMerchant && (
                <button
                  type="button"
                  onClick={onOpenMerchant}
                  className="pt-1 text-[#a23e18] hover:underline font-bold uppercase block cursor-pointer"
                >
                  Abrir Consola →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-4 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-[#6E6E6A] gap-2 border-t border-[#eeeeed]">
          <p>
            © {new Date().getFullYear()} {brandName}. Candy Catalog Global Architecture.
          </p>
          <p className="uppercase">Diseñado bajo estándares de composición suiza</p>
        </div>
      </div>
    </footer>
  );
};

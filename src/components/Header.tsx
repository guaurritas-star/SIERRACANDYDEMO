import React from 'react';
import { User } from 'firebase/auth';
import { TenantConfig } from '../types';

interface HeaderProps {
  viewMode: 'public' | 'merchant';
  currentPublicTab: 'catalog' | 'product';
  currentMerchantTab: string;
  onNavigatePublic: (tab: 'catalog' | 'product', sectionId?: string) => void;
  onSwitchViewMode: (mode: 'public' | 'merchant') => void;
  onNavigateMerchant: (tab: string) => void;
  tenantConfig: TenantConfig;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenThemeModal: () => void;
  onOpenPricingModal: () => void;
  onRestartOnboarding: () => void;
  trialDaysLeft?: number;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  currentPublicTab,
  currentMerchantTab,
  onNavigatePublic,
  onSwitchViewMode,
  onNavigateMerchant,
  tenantConfig,
  cartCount,
  onOpenCart,
  onOpenSearch,
  onOpenThemeModal,
  onOpenPricingModal,
  onRestartOnboarding,
  trialDaysLeft = 14,
  currentUser,
}) => {
  const brandName = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const defaultStitchLogo =
    'https://lh3.googleusercontent.com/aida/AEtjO1Xysap4dyGay6J8o-suHVTTb3GZIlMN9m_hdvDEWPWWGOnhv45M4C8Ohhzy5Dhh-Ak6k3g4_ACmQmKYHrpY1jNOz-vHrLku_dgR0pQCJYQ84OTbV0RPtosjZ99hIWb67F-QYhURdxJjvl93mGxRIV29r1dD2DoRfmsDLp-KpxRjgatHfZcI46xPXmfTTroMKt8siPojF0-rAfFatCKDXAOdCUsUaykwYtUN6X7F-oIzK5eJuaVj65JC0w';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Ecosystem Ribbon */}
      <div className="bg-[#f3f4f3] px-4 lg:px-10 border-b border-[#E5E5E2]">
        <div className="max-w-7xl mx-auto h-8 flex items-center justify-between font-mono text-xs text-[#6E6E6A]">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">CANDY CATALOG</span>
            <span className="text-[#D4D4D0]">/</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  viewMode === 'public' ? 'bg-[#25D366]' : 'bg-[#fe8357]'
                }`}
              ></span>
              <span className="text-[#1a1c1c] font-semibold uppercase truncate max-w-[160px] sm:max-w-none">
                {brandName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Demo Status & Pricing CTA */}
            <button
              type="button"
              onClick={onOpenPricingModal}
              className="bg-[#2a1a14] text-[#A23E18] hover:bg-[#3a2016] px-2 py-0.5 border border-[#A23E18]/40 transition-colors flex items-center gap-1 cursor-pointer font-bold shrink-0"
              title="Ver planes de precios y estado de la prueba"
            >
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>DEMO: {trialDaysLeft} DÍAS</span>
            </button>

            <button
              type="button"
              onClick={onOpenPricingModal}
              className="text-[#1a1c1c] hover:text-[#A23E18] transition-colors flex items-center gap-1 cursor-pointer underline text-[11px] font-bold"
            >
              Planes
            </button>

            <button
              type="button"
              onClick={onRestartOnboarding}
              className="text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors flex items-center gap-1 cursor-pointer"
              title="Volver a ejecutar el asistente de inicio y cargar catálogo"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              <span className="hidden md:inline">Reiniciar Setup</span>
            </button>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="text-[#1a1c1c] bg-[#e8e8e7] hover:bg-[#D4D4D0] px-2 py-0.5 transition-colors flex items-center gap-1 cursor-pointer font-bold"
              title="Configurar tema del negocio y entrenar a Gemini"
            >
              <span className="material-symbols-outlined text-[14px] text-[#a23e18]">palette</span>
              <span className="hidden sm:inline">Tema</span>
            </button>

            {viewMode === 'public' ? (
              <button
                type="button"
                onClick={() => onSwitchViewMode('merchant')}
                className="text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                <span className="hidden sm:inline">Consola</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSwitchViewMode('public')}
                className="text-[#6E6E6A] hover:text-[#1a1c1c] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                <span className="hidden sm:inline">Catálogo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Navigation Bar */}
      <div className="px-4 lg:px-10">
        <div className="h-16 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'public') {
                  onNavigatePublic('catalog');
                } else {
                  onSwitchViewMode('public');
                  onNavigatePublic('catalog');
                }
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <img
                alt={`${brandName} Brand Logo`}
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                src={tenantConfig.logoUrl || defaultStitchLogo}
              />
              <span className="font-['Plus_Jakarta_Sans'] text-xl uppercase tracking-tight text-[#1a1c1c] font-bold">
                {brandName}
              </span>
            </button>

            <div className="hidden md:block w-px h-6 bg-[#E5E5E2]"></div>

            {viewMode === 'public' ? (
              <nav className="hidden md:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNavigatePublic('catalog', 'coleccion')}
                  className={`font-mono text-xs uppercase px-3 py-1.5 transition-colors cursor-pointer ${
                    currentPublicTab === 'catalog'
                      ? 'bg-[#000000] text-[#ffffff]'
                      : 'text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c]'
                  }`}
                >
                  Colecciones
                </button>
                <button
                  type="button"
                  onClick={() => onNavigatePublic('catalog', 'manifiesto')}
                  className="font-mono text-xs uppercase px-3 py-1.5 text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c] transition-colors cursor-pointer"
                >
                  Editorial
                </button>
                <a
                  href={`https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hola equipo ${brandName} 👋 Me gustaría contactar al servicio de atención al cliente.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs uppercase px-3 py-1.5 text-[#444748] hover:bg-[#eeeeed] hover:text-[#1a1c1c] transition-colors"
                >
                  WhatsApp Direct
                </a>
              </nav>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <span className="font-mono text-xs uppercase text-[#6E6E6A] tracking-wider">
                  MERCHANT OS v3.2
                </span>
                <nav className="hidden xl:flex items-center gap-1 font-mono text-xs uppercase">
                  <button
                    type="button"
                    onClick={() => onNavigateMerchant('overview')}
                    className={`px-2.5 py-1 transition-colors cursor-pointer ${
                      currentMerchantTab === 'overview'
                        ? 'bg-[#000000] text-[#ffffff] font-bold'
                        : 'text-[#444748] hover:bg-[#eeeeed]'
                    }`}
                  >
                    Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateMerchant('catalog')}
                    className={`px-2.5 py-1 transition-colors cursor-pointer ${
                      currentMerchantTab === 'catalog'
                        ? 'bg-[#000000] text-[#ffffff] font-bold'
                        : 'text-[#444748] hover:bg-[#eeeeed]'
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateMerchant('ai-parser')}
                    className={`px-2.5 py-1 transition-colors cursor-pointer ${
                      currentMerchantTab === 'ai-parser'
                        ? 'bg-[#000000] text-[#ffffff] font-bold'
                        : 'text-[#444748] hover:bg-[#eeeeed]'
                    }`}
                  >
                    Importador IA
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateMerchant('graphic-studio')}
                    className={`px-2.5 py-1 transition-colors cursor-pointer ${
                      currentMerchantTab === 'graphic-studio'
                        ? 'bg-[#a23e18] text-[#ffffff] font-bold'
                        : 'text-[#a23e18] hover:bg-[#eeeeed] font-semibold'
                    }`}
                  >
                    Diseño & Marketing IA
                  </button>
                </nav>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'public' ? (
              <>
                <a
                  href={`https://wa.me/${tenantConfig.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hola equipo ${brandName} 👋 Me gustaría recibir asesoría de un concierge.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#f3f4f3] text-[#25D366] font-mono text-xs uppercase hover:bg-[#eeeeed] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span className="font-semibold">Direct Concierge</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Buscar"
                    onClick={onOpenSearch}
                    className="w-8 h-8 flex items-center justify-center text-[#444748] hover:text-[#1a1c1c] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Bolsa"
                    onClick={onOpenCart}
                    className="w-8 h-8 flex items-center justify-center text-[#444748] hover:text-[#1a1c1c] transition-colors relative cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#a23e18] text-white text-[10px] font-mono rounded-full flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchViewMode('merchant')}
                    title="Ir a Consola Comerciante"
                    className="w-8 h-8 rounded-full bg-[#000000] flex items-center justify-center cursor-pointer hover:bg-[#333333] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[#ffffff] text-[18px]">
                      person
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#eeeeed] font-mono text-xs text-[#6E6E6A]">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                  <span className="font-semibold text-[#1a1c1c]">
                    {currentUser ? 'FIRESTORE SYNC ON' : 'SYNC ON'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateMerchant('orders')}
                  aria-label="Notificaciones de WhatsApp"
                  className="w-8 h-8 flex items-center justify-center text-[#444748] hover:text-[#1a1c1c] transition-colors cursor-pointer relative"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  <span className="w-2 h-2 rounded-full bg-[#a23e18] absolute top-1 right-1"></span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateMerchant('settings')}
                  title={currentUser?.email || 'Perfil Comerciante'}
                  className="w-8 h-8 rounded-full bg-[#000000] flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#ffffff] text-[18px]">
                    person
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

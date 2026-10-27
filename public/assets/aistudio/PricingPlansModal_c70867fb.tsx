import React, { useState } from 'react';
import { TenantConfig } from '../types';

interface PricingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantConfig: TenantConfig;
  onShowToast: (msg: string) => void;
  trialDaysLeft?: number;
}

export const PricingPlansModal: React.FC<PricingPlansModalProps> = ({
  isOpen,
  onClose,
  tenantConfig,
  onShowToast,
  trialDaysLeft = 14,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'starter',
      name: 'Plan Taller',
      tagline: 'Ideal para artesanos y creadores que inician con su primer catálogo digital.',
      monthlyPrice: 490,
      annualPrice: 390,
      isPopular: false,
      features: [
        'Hasta 25 referencias activas en catálogo',
        'Enlace comercial directo a WhatsApp',
        'Selector de tallas, acabados y existencias',
        'Ficha técnica con fotos en alta definición',
        'Dominio compartido (candy.catalog/tu-marca)',
        'Soporte técnico por chat y correo',
      ],
      ctaText: 'Comenzar con Plan Taller',
    },
    {
      id: 'pro',
      name: 'Plan Artesano Pro',
      tagline: 'Para marcas que buscan maximizar ventas por WhatsApp con asistencia de Gemini IA.',
      monthlyPrice: 890,
      annualPrice: 710,
      isPopular: true,
      badge: 'Recomendado para tu giro',
      features: [
        'Catálogo ilimitado de referencias y variantes',
        'Motor Gemini IA entrenado con tus reglas de calce y taller',
        'Importador inteligente de lookbooks (PDF, fotos y WhatsApp)',
        'Exportador de catálogos en PDF listos para imprimir y enviar',
        'Radar de objeciones frecuentes y asesoría en vivo',
        'Generador editorial de descripciones con IA',
        'Soporte prioritario directo por WhatsApp',
      ],
      ctaText: 'Elegir Plan Artesano Pro',
    },
    {
      id: 'enterprise',
      name: 'Plan Multi-Marca',
      tagline: 'Para talleres consolidados con múltiples líneas, agentes o sucursales físicas.',
      monthlyPrice: 1690,
      annualPrice: 1350,
      isPopular: false,
      features: [
        'Todo lo incluido en el Plan Pro',
        'Multi-agente para varios números de WhatsApp',
        'Múltiples sucursales y puntos de retiro (Showrooms)',
        'Conexión de dominio propio (ej. tumarca.com)',
        'Auditoría y afinación mensual del motor Gemini IA',
        'Gerente de cuenta dedicado y capacitación personalizada',
      ],
      ctaText: 'Solicitar Plan Multi-Marca',
    },
  ];

  const handleSelectPlan = (planName: string, price: number) => {
    const cycleText = billingCycle === 'annual' ? 'Facturación Anual (20% OFF)' : 'Facturación Mensual';
    const msg = `Hola equipo Candy Catalog 👋 Me interesa contratar el *${planName}* ($${price} MXN/mes · ${cycleText}) para mi negocio *${tenantConfig.theme?.brandName || tenantConfig.name}* (${tenantConfig.theme?.industry || 'Comercio'}). ¿Me pueden indicar los pasos de activación?`;
    
    const waUrl = `https://wa.me/524771234567?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onShowToast(`Abriendo solicitud para ${planName}...`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] w-full max-w-5xl my-8 border border-[#E5E5E2] shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#1a1c1c] text-[#FFFFFF] px-6 py-4 flex items-center justify-between border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#A23E18] font-semibold bg-[#2a1a14] px-2.5 py-1 border border-[#A23E18]/40">
              PRUEBA DEMO · {trialDaysLeft} DÍAS RESTANTES
            </span>
            <span className="text-sm text-[#999996] hidden sm:inline">
              Acceso completo sin compromiso para {tenantConfig.theme?.brandName || tenantConfig.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-[#999996] hover:text-[#FFFFFF] transition-colors p-1 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 lg:p-8 overflow-y-auto space-y-8">
          {/* Headline & Billing Cycle Toggle */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight">
              Planes transparentes para hacer crecer tu taller
            </h2>
            <p className="text-sm text-[#6E6E6A]">
              Durante tu prueba demo de 14 días puedes probar todas las herramientas y la IA sin costo. Elige el plan que mejor se adapte a tu volumen cuando decidas publicar de forma definitiva.
            </p>

            {/* Toggle */}
            <div className="pt-2 flex items-center justify-center">
              <div className="inline-flex items-center p-1 bg-[#F3F4F3] border border-[#E5E5E2] font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 transition-colors cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#6E6E6A] hover:text-[#1a1c1c]'
                  }`}
                >
                  <span>Anual</span>
                  <span className="text-[10px] bg-[#A23E18] text-[#FFFFFF] px-1.5 py-0.2 font-bold tracking-tight">
                    -20% AHORRO
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const activePrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-6 border transition-all ${
                    plan.isPopular
                      ? 'bg-[#FFFFFF] border-[#1a1c1c] shadow-lg ring-1 ring-[#1a1c1c]'
                      : 'bg-[#FAFAFA] border-[#E5E5E2] hover:border-[#D4D4D0]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-6">
                      <span className="bg-[#A23E18] text-[#FFFFFF] font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-xs">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1a1c1c]">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[#6E6E6A] mt-1 leading-relaxed">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="border-t border-b border-[#E5E5E2] py-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl text-[#1a1c1c] font-mono tabular-nums">
                          ${activePrice}
                        </span>
                        <span className="text-xs font-mono text-[#6E6E6A]">MXN / mes</span>
                      </div>
                      <p className="text-[11px] text-[#6E6E6A] mt-1 font-mono">
                        {billingCycle === 'annual' ? 'Facturado anualmente ($' + activePrice * 12 + ' MXN/año)' : 'Sin plazos forzosos'}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2.5">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#6E6E6A] font-semibold">
                        Incluye:
                      </p>
                      <ul className="space-y-2 text-xs text-[#444748]">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[16px] text-[#25D366] shrink-0 mt-0.5">
                              check
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#E5E5E2]">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.name, activePrice)}
                      className={`w-full py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        plan.isPopular
                          ? 'bg-[#000000] text-[#FFFFFF] hover:bg-[#333333]'
                          : 'bg-[#FFFFFF] text-[#1a1c1c] border border-[#1a1c1c] hover:bg-[#F3F4F3]'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee & FAQ strip */}
          <div className="bg-[#F3F4F3] border border-[#E5E5E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#6E6E6A]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-[#A23E18]">verified</span>
              <div>
                <span className="font-bold text-[#1a1c1c]">Garantía de Satisfacción 100%:</span> Sin contratos forzosos. Si no incrementas tus consultas de WhatsApp en tus primeros 30 días, te reembolsamos sin preguntas.
              </div>
            </div>

            <button
              onClick={() => {
                const url = `https://wa.me/524771234567?text=${encodeURIComponent('Hola, tengo dudas sobre los planes de Candy Catalog para mi negocio.')}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="whitespace-nowrap text-[#1a1c1c] hover:text-[#A23E18] font-bold underline cursor-pointer"
            >
              ¿Tienes dudas? Habla con un asesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

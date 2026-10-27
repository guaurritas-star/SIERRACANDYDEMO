import React, { useState } from 'react';
import { TenantConfig, BusinessTheme } from '../types';

interface BusinessThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantConfig: TenantConfig;
  onSaveTheme: (updatedConfig: TenantConfig) => void;
  onShowToast: (msg: string) => void;
}

const PRESET_THEMES = [
  {
    id: 'footwear',
    name: 'Calzado Artesanal & Marroquinería',
    icon: 'steps',
    brandName: 'SIERRA Footwear',
    tagline: 'Siluetas esenciales concebidas para trascender temporadas efímeras.',
    tone: 'Editorial Suizo / Lujo Silencioso & Sobrio',
    location: 'León, Guanajuato, México',
    announcement: 'Envíos sin costo a todo México en órdenes con asesoría directa vía WhatsApp / Taller León, GTO',
    valuePropositions: [
      'Pieles vacunas 100% curtidas al vegetal con taninos biodegradables.',
      'Construcción Goodyear Welted artesanal resolable de por vida.',
      'Atención humana 1 a 1 por WhatsApp con el maestro cortador.',
      '1er cambio de talla gratuito con flete incluido.',
    ],
  },
  {
    id: 'jewelry',
    name: 'Joyería de Autor & Orfebrería',
    icon: 'diamond',
    brandName: 'ÁUREA Taller',
    tagline: 'Metales nobles forjados a mano con gemas éticas de origen nacional.',
    tone: 'Sofisticado, Artístico, Íntimo',
    location: 'Taxco / San Miguel de Allende, México',
    announcement: 'Piezas únicas en Plata 925 y Oro 14k · Envíos asegurados a todo el país',
    valuePropositions: [
      'Metales recuperados y gemas de minería ética certificada.',
      'Certificado de autenticidad y número de serie único.',
      'Grabado personalizado de fechas e iniciales incluido.',
    ],
  },
  {
    id: 'botanics',
    name: 'Botánica, Café & Confitería Fina',
    icon: 'eco',
    brandName: 'BOTÁNICA & CO.',
    tagline: 'Curaduría sensorial de café de altura, extractos puros y chocolates de origen.',
    tone: 'Orgánico, Cálido, Poético y Moderno',
    location: 'Oaxaca / Coatepec, México',
    announcement: 'Tuestes frescos de semana y cajas de regalo corporativas B2B',
    valuePropositions: [
      'Café de especialidad con puntaje Q superior a 86.',
      'Empaques 100% compostables libres de plástico.',
      'Asesoría para métodos de extracción por WhatsApp.',
    ],
  },
  {
    id: 'fashion',
    name: 'Moda & Sastrería Contemporánea',
    icon: 'apparel',
    brandName: 'MERIDIANO Studio',
    tagline: 'Prendas estructuradas en lino lavado y lana merino de producción ética.',
    tone: 'Brutalismo Elegante / Minimalismo Arquitectónico',
    location: 'Ciudad de México, México',
    announcement: 'Colección Permanente · Confección bajo demanda para cero residuo textil',
    valuePropositions: [
      'Telas de fibra natural con teñido botánico.',
      'Ajustes de bastilla y talle a medida previo a despacho.',
      'Atención directa con el sastre en taller.',
    ],
  },
];

export const BusinessThemeModal: React.FC<BusinessThemeModalProps> = ({
  isOpen,
  onClose,
  tenantConfig,
  onSaveTheme,
  onShowToast,
}) => {
  const currentTheme = tenantConfig.theme || {
    industry: 'Calzado Artesanal & Marroquinería',
    brandName: 'SIERRA',
    tagline: 'Siluetas esenciales concebidas para trascender temporadas efímeras.',
    tone: 'Editorial Suizo / Lujo Silencioso & Sobrio',
    targetAudience: 'Compradores de diseño contemporáneo',
    location: 'León, Guanajuato, México',
    valuePropositions: [],
    onboardingCompleted: true,
  };

  const [industry, setIndustry] = useState(currentTheme.industry);
  const [brandName, setBrandName] = useState(currentTheme.brandName);
  const [tagline, setTagline] = useState(currentTheme.tagline);
  const [tone, setTone] = useState(currentTheme.tone);
  const [location, setLocation] = useState(currentTheme.location);
  const [announcement, setAnnouncement] = useState(tenantConfig.announcement);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_THEMES[0]) => {
    setIndustry(preset.name);
    setBrandName(preset.brandName);
    setTagline(preset.tagline);
    setTone(preset.tone);
    setLocation(preset.location);
    setAnnouncement(preset.announcement);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTheme: BusinessTheme = {
      industry,
      brandName,
      tagline,
      tone,
      targetAudience: currentTheme.targetAudience,
      location,
      valuePropositions: currentTheme.valuePropositions,
      onboardingCompleted: true,
    };

    const updatedConfig: TenantConfig = {
      ...tenantConfig,
      name: `${brandName} (${industry})`,
      announcement,
      showroomCity: location,
      theme: updatedTheme,
      geminiEngine: {
        ...(tenantConfig.geminiEngine || {
          activeRules: [],
          customerNeedsDetected: [],
          learnedResponsesCount: 120,
          accuracyScore: 98.4,
          lastTrainedDate: 'Reciente',
        }),
        lastTrainedDate: 'Re-calibrado con nuevo ADN de negocio',
      },
    };

    onSaveTheme(updatedConfig);
    onShowToast(`✓ Tema de negocio "${brandName}" configurado. Gemini adaptado a ${industry}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] max-w-2xl w-full p-6 shadow-2xl border border-[#E5E5E2] space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#000000] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#25D366]">
                palette
              </span>
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg uppercase text-[#1a1c1c]">
                Configurar Tema del Negocio & ADN de Marca
              </h2>
              <p className="font-mono text-xs text-[#6E6E6A]">
                Define la industria y personalidad para entrenar a Gemini en tus necesidades comerciales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#6E6E6A] hover:text-[#1a1c1c] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <span className="block font-mono text-xs uppercase text-[#6E6E6A] font-bold">
            Plantillas Rápidas por Sector:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 text-left border transition-all cursor-pointer font-mono text-xs ${
                  industry === preset.name
                    ? 'border-[#000000] bg-[#eeeeed] font-bold shadow-xs'
                    : 'border-[#E5E5E2] bg-[#f3f4f3] hover:bg-[#eeeeed]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-[16px] text-[#a23e18]">
                    {preset.icon}
                  </span>
                  <span>{preset.name}</span>
                </div>
                <div className="text-[10px] text-[#6E6E6A] font-normal truncate">
                  {preset.brandName} · {preset.location}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
                Nombre de la Marca
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
                Giro o Industria
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
              Slogan o Declaración Editorial
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
                Tono de Voz Comercial (Para Gemini)
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="ej. Editorial Suizo / Sofisticado / Cálido"
                className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none"
              />
            </div>

            <div>
              <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
                Ciudad / Taller de Origen
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-[#6E6E6A] mb-1 font-semibold">
              Cintillo de Anuncio Público
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-2.5 text-xs text-[#1a1c1c] outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-xs uppercase text-[#6E6E6A] hover:text-[#1a1c1c] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#000000] text-white hover:bg-[#333333] font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#25D366]">check</span>
              <span>Guardar Tema y Entrenar a Gemini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

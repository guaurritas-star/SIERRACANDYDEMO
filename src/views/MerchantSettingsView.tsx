import React, { useState, useRef } from 'react';
import { TenantConfig } from '../types';
import { processAndUploadImage } from '../utils/imageUpload';

interface MerchantSettingsViewProps {
  tenantConfig: TenantConfig;
  onSaveConfig: (updated: TenantConfig) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export const MerchantSettingsView: React.FC<MerchantSettingsViewProps> = ({
  tenantConfig,
  onSaveConfig,
  onShowToast,
  onBackToInventory,
}) => {
  const [brandName, setBrandName] = useState(
    tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA'
  );
  const [industry, setIndustry] = useState(
    tenantConfig.theme?.industry || 'Calzado Artesanal & Marroquinería'
  );
  const [tagline, setTagline] = useState(
    tenantConfig.theme?.tagline ||
      'Calzado de arquitectura sobria y corte contemporáneo, concebido en León, Guanajuato.'
  );
  const [whatsappPhone, setWhatsappPhone] = useState(
    tenantConfig.whatsappPhone || '+52 477 123 4567'
  );
  const [showroomCity, setShowroomCity] = useState(
    tenantConfig.showroomCity || 'León, Guanajuato · México'
  );
  const [announcement, setAnnouncement] = useState(tenantConfig.announcement || '');
  const [storeUrl, setStoreUrl] = useState(
    tenantConfig.storeUrl || 'sierra.candycatalog.store'
  );
  const [accentColor, setAccentColor] = useState(
    tenantConfig.accentColor || '#8C3A1B'
  );
  const [logoUrl, setLogoUrl] = useState(tenantConfig.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setValidationError(null);
    try {
      const uploaded = await processAndUploadImage(file);
      setLogoUrl(uploaded.url);
      onShowToast('Logotipo cargado correctamente');
    } catch (err: any) {
      setValidationError(err?.message || 'Error al cargar el logotipo.');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = whatsappPhone.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      setValidationError(
        'Ingresa un número de WhatsApp válido con código de país (mínimo 10 dígitos, ej. +52 477 123 4567).'
      );
      return;
    }
    if (!brandName.trim()) {
      setValidationError('El nombre comercial de la marca es obligatorio.');
      return;
    }

    const updated: TenantConfig = {
      ...tenantConfig,
      name: brandName.trim(),
      whatsappPhone: whatsappPhone.trim(),
      showroomCity: showroomCity.trim(),
      announcement: announcement.trim(),
      storeUrl: storeUrl.trim(),
      logoUrl: logoUrl.trim(),
      accentColor,
      theme: {
        ...(tenantConfig.theme || {
          tone: 'Editorial Contemporáneo',
          targetAudience: 'Clientes directos',
          valuePropositions: [],
          onboardingCompleted: true,
        }),
        brandName: brandName.trim(),
        industry: industry.trim(),
        tagline: tagline.trim(),
        location: showroomCity.trim(),
      },
    };

    onSaveConfig(updated);
    onShowToast(`Configuración de ${brandName.trim()} guardada y sincronizada`);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-[#f7f6f2] lg:pl-60 pt-8 px-4 sm:px-6 lg:px-10 pb-20">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="border-b border-[#e4e2dc] pb-5 space-y-1">
          <button
            type="button"
            onClick={onBackToInventory}
            className="inline-flex items-center gap-1.5 text-xs text-[#73716b] hover:text-[#141413] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Volver a Mis Productos</span>
          </button>
          <h1 className="font-editorial text-3xl font-semibold text-[#141413]">
            Identidad de Marca y Línea de WhatsApp
          </h1>
          <p className="text-sm text-[#4a4945]">
            Personaliza el logotipo, colores, información comercial y el número de WhatsApp al que llegarán las consultas del escaparate.
          </p>
        </div>

        {validationError && (
          <div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b]">
            {validationError}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-[#ffffff] border border-[#e4e2dc] p-6 sm:p-8 space-y-6"
        >
          {/* Brand Logo & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pb-6 border-b border-[#e4e2dc]">
            <div className="sm:col-span-8 flex items-center gap-4">
              <div className="w-16 h-16 bg-[#f7f6f2] border border-[#e4e2dc] flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="font-editorial text-xl font-semibold text-[#141413]">
                    {brandName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#141413]">
                  Logotipo del Negocio
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#f7f6f2] hover:bg-[#efede8] border border-[#cfccc4] text-xs font-medium text-[#141413] cursor-pointer"
                  >
                    {isUploadingLogo ? 'Subiendo...' : 'Subir desde dispositivo'}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-[#991b1b] hover:underline cursor-pointer"
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Color de Acento Editorial
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-9 bg-[#ffffff] border border-[#cfccc4] p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full bg-[#f7f6f2] border border-[#cfccc4] px-3 py-2 font-data text-xs text-[#141413]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Nombre Comercial de la Marca *
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Giro o Especialidad Comercial
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Número de WhatsApp de Ventas *
              </label>
              <input
                type="tel"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+52 477 123 4567"
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 font-data text-sm text-[#141413] outline-none"
              />
              <p className="text-[11px] text-[#73716b] mt-1">
                Todos los botones de consulta del catálogo enviarán mensajes a este número.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Ciudad / Taller de Origen
              </label>
              <input
                type="text"
                value={showroomCity}
                onChange={(e) => setShowroomCity(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1.5">
              Declaración Editorial (Subtítulo del Hero en el Aparador)
            </label>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] p-3.5 text-sm text-[#141413] outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1.5">
              Aviso Superior en el Aparador (Cintillo Editorial)
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#cfccc4] focus:border-[#141413] px-3.5 py-2.5 text-sm text-[#141413] outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e4e2dc]">
            <button
              type="button"
              onClick={onBackToInventory}
              className="px-4 py-2 text-xs text-[#4a4945] hover:text-[#141413] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#141413] hover:bg-[#2a2a28] text-[#ffffff] text-xs font-medium transition-colors cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { TenantConfig } from '../types';

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
  const [form, setForm] = useState<TenantConfig>({ ...tenantConfig });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    onShowToast('Configuración del tenant SIERRA guardada con éxito');
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] lg:pl-64 pt-6 px-4 lg:px-8 pb-16">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#6E6E6A]">
            <button onClick={onBackToInventory} className="hover:text-[#1a1c1c] cursor-pointer">
              Panel de Comercio
            </button>
            <span>/</span>
            <span className="text-[#1a1c1c] font-semibold">Configuración Multi-Tenant</span>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight pt-2">
            Ajustes de Marca & Conexión WhatsApp
          </h1>
          <p className="text-sm text-[#6E6E6A]">
            Personaliza la identidad del tenant, línea directa de WhatsApp y parámetros de catálogo.
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
                Nombre de la Marca
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-sm px-4 py-2.5 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
                Tenant ID del Ecosistema
              </label>
              <input
                type="text"
                value={form.tenantId}
                disabled
                className="w-full bg-[#f3f4f3] border border-[#D4D4D0] text-[#6E6E6A] font-mono text-sm px-4 py-2.5 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
                Número WhatsApp de Ventas / Concierge
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366] text-[18px]">
                  chat
                </span>
                <input
                  type="text"
                  value={form.whatsappPhone}
                  onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })}
                  placeholder="+52 477 123 4567"
                  className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] font-mono text-sm pl-10 pr-4 py-2.5 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
                Subdominio / URL de Tienda
              </label>
              <input
                type="text"
                value={form.storeUrl}
                onChange={(e) => setForm({ ...form, storeUrl: e.target.value })}
                className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] font-mono text-sm px-4 py-2.5 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
              Ciudad de Taller / Showroom
            </label>
            <input
              type="text"
              value={form.showroomCity}
              onChange={(e) => setForm({ ...form, showroomCity: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-sm px-4 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-2 tracking-wider font-semibold">
              Cintillo de Anuncios Público (Header Ribbon)
            </label>
            <input
              type="text"
              value={form.announcement}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
              className="w-full bg-[#FFFFFF] border border-[#D4D4D0] focus:border-[#000000] text-[#1a1c1c] text-sm px-4 py-2.5 outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#f3f4f3] border border-[#E5E5E2]">
            <div>
              <p className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                Sincronización Instantánea Web ↔ WhatsApp
              </p>
              <p className="font-mono text-xs text-[#6E6E6A]">
                Cualquier cambio de inventario impacta en tiempo real las consultas generadas.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoSync}
                onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#D4D4D0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border-[#D4D4D0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25D366]"></div>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E2]">
            <button
              type="button"
              onClick={onBackToInventory}
              className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#6E6E6A] hover:text-[#1a1c1c] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#000000] text-[#ffffff] font-mono text-xs uppercase tracking-wider hover:bg-[#333333] transition-colors flex items-center gap-2 shadow-xs cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

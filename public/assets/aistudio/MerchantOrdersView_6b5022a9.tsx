import React, { useState } from 'react';
import { WhatsAppLead, TenantConfig } from '../types';

interface MerchantOrdersViewProps {
  leads: WhatsAppLead[];
  tenantConfig: TenantConfig;
  onUpdateLeadStatus: (leadId: string, status: WhatsAppLead['status']) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export const MerchantOrdersView: React.FC<MerchantOrdersViewProps> = ({
  leads,
  tenantConfig,
  onUpdateLeadStatus,
  onShowToast,
  onBackToInventory,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchLead, setSearchLead] = useState<string>('');

  const filteredLeads = leads.filter((lead) => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (searchLead.trim()) {
      const q = searchLead.toLowerCase();
      return (
        lead.clientName.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.productName.toLowerCase().includes(q) ||
        lead.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: WhatsAppLead['status']) => {
    switch (status) {
      case 'nueva':
        return 'bg-[#25D366]/20 text-[#15803d] border-[#25D366]';
      case 'en_conversacion':
        return 'bg-[#ffdbcf] text-[#822801] border-[#ffb59c]';
      case 'esperando_pago':
        return 'bg-[#fef08a] text-[#854d0e] border-[#fde047]';
      case 'despachado':
        return 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]';
      case 'cerrado':
        return 'bg-[#eeeeed] text-[#6E6E6A] border-[#D4D4D0]';
    }
  };

  const getStatusLabel = (status: WhatsAppLead['status']) => {
    switch (status) {
      case 'nueva':
        return 'Nueva Consulta';
      case 'en_conversacion':
        return 'En Conversación';
      case 'esperando_pago':
        return 'Esperando Pago';
      case 'despachado':
        return 'Lote Despachado';
      case 'cerrado':
        return 'Completado';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] lg:pl-64 pt-6 px-4 lg:px-8 pb-16">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#6E6E6A]">
            <button onClick={onBackToInventory} className="hover:text-[#1a1c1c] cursor-pointer">
              Panel de Comercio
            </button>
            <span>/</span>
            <span className="text-[#1a1c1c] font-semibold">Pedidos WhatsApp</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight">
                Flujo de Conversión WhatsApp
              </h1>
              <p className="text-sm text-[#6E6E6A]">
                Gestión de consultas y órdenes de compra iniciadas directamente desde los enlaces del catálogo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
              <span className="font-mono text-xs text-[#1a1c1c] font-bold">
                {tenantConfig.whatsappPhone}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['all', 'en_conversacion', 'esperando_pago', 'despachado', 'cerrado'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-[#000000] text-white font-bold'
                    : 'bg-[#eeeeed] text-[#444748] hover:text-[#1a1c1c]'
                }`}
              >
                {st === 'all' ? `Todos (${leads.length})` : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6E6A]">
              search
            </span>
            <input
              type="text"
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
              placeholder="Buscar cliente, modelo o teléfono..."
              className="w-full bg-[#f3f4f3] pl-9 pr-3 py-1.5 text-xs text-[#1a1c1c] outline-none border border-[#E5E5E2] focus:bg-[#FFFFFF]"
            />
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E5E5E2] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#f3f4f3] text-[#6E6E6A] uppercase tracking-wider border-b border-[#E5E5E2]">
              <tr>
                <th className="py-3 px-4">Cliente / Contacto</th>
                <th className="py-3 px-3">Modelo Solicitado</th>
                <th className="py-3 px-3">Variante / Talla</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Estatus</th>
                <th className="py-3 px-4 text-right">Acción Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeed]">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#f9f9f8] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1a1c1c] text-sm font-['Plus_Jakarta_Sans']">
                      {lead.clientName}
                    </div>
                    <div className="text-[#6E6E6A] text-[11px]">{lead.phone}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#1a1c1c]">{lead.productName}</div>
                    <div className="text-[#6E6E6A] text-[11px]">{lead.sku}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-[#1a1c1c]">{lead.finish}</div>
                    <div className="text-[#a23e18] font-bold">Talla {lead.size}</div>
                  </td>

                  <td className="py-3 px-3 text-[#6E6E6A]">{lead.date}</td>

                  <td className="py-3 px-3">
                    <select
                      value={lead.status}
                      onChange={(e) => {
                        onUpdateLeadStatus(lead.id, e.target.value as WhatsAppLead['status']);
                        onShowToast(`Estado de consulta para ${lead.clientName} actualizado`);
                      }}
                      className={`px-2 py-1 uppercase text-[10px] font-bold border outline-none cursor-pointer ${getStatusBadge(
                        lead.status
                      )}`}
                    >
                      <option value="nueva">Nueva Consulta</option>
                      <option value="en_conversacion">En Conversación</option>
                      <option value="esperando_pago">Esperando Pago</option>
                      <option value="despachado">Lote Despachado</option>
                      <option value="cerrado">Completado</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hola ${lead.clientName}, te escribimos del taller SIERRA respecto a tu consulta sobre el ${lead.productName}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#18964B] text-white font-bold uppercase text-[11px] transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Abrir Chat</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { Product, TenantConfig } from '../types';

export function cleanWhatsAppPhone(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return digits || '524771234567';
}

export interface WhatsAppInquiryOptions {
  product: Product;
  tenantConfig: TenantConfig;
  selectedFinish?: string | null;
  selectedSize?: string | null;
}

export function buildProductWhatsAppMessage({
  product,
  tenantConfig,
  selectedFinish,
  selectedSize,
}: WhatsAppInquiryOptions): string {
  const brand = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const skuPart = product.sku ? ` (SKU: ${product.sku})` : '';

  if (selectedFinish && selectedSize) {
    return `Hola ${brand}, me interesa consultar la disponibilidad de ${product.name}${skuPart} en acabado ${selectedFinish}, talla ${selectedSize}. ¿Cuentan con existencia para envío?`;
  }

  if (selectedSize) {
    return `Hola ${brand}, me interesa consultar la disponibilidad de ${product.name}${skuPart} en talla ${selectedSize}. ¿En qué acabados lo tienen disponible?`;
  }

  if (selectedFinish) {
    return `Hola ${brand}, me interesa consultar la disponibilidad de ${product.name}${skuPart} en acabado ${selectedFinish}. ¿Qué tallas tienen disponibles?`;
  }

  return `Hola ${brand}, me interesa recibir información y disponibilidad del modelo ${product.name}${skuPart}. ¿Qué tallas y acabados tienen disponibles actualmente?`;
}

export function buildProductWhatsAppUrl(options: WhatsAppInquiryOptions): string {
  const phone = cleanWhatsAppPhone(options.tenantConfig.whatsappPhone);
  const text = buildProductWhatsAppMessage(options);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildConciergeWhatsAppUrl(
  tenantConfig: TenantConfig,
  customPrompt?: string
): string {
  const phone = cleanWhatsAppPhone(tenantConfig.whatsappPhone);
  const brand = tenantConfig.theme?.brandName || tenantConfig.name || 'SIERRA';
  const text =
    customPrompt ||
    `Hola ${brand}, me gustaría recibir asesoría sobre su colección y disponibilidad de tallas.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

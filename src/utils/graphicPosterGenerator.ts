export interface PosterRenderOptions {
  productName: string;
  category: string;
  priceText: string;
  headline: string;
  badgeText: string;
  brandName: string;
  whatsappPhone: string;
  productImageUrl: string;
  format: 'post_1_1' | 'story_9_16' | 'editorial_4_5';
  bgHex: string;
  accentHex: string;
  textHex: string;
}

export async function renderMarketingPosterToDataUrl(
  opts: PosterRenderOptions
): Promise<string> {
  const dimensions =
    opts.format === 'story_9_16'
      ? { width: 1080, height: 1920 }
      : opts.format === 'editorial_4_5'
      ? { width: 1080, height: 1350 }
      : { width: 1080, height: 1080 };

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el lienzo gráfico.');

  const W = dimensions.width;
  const H = dimensions.height;

  // 1. Background Canvas Fill
  ctx.fillStyle = opts.bgHex || '#F5F3EA';
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle Editorial Framing Border & Studio Accent Geometry
  ctx.strokeStyle = opts.textHex === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(26,26,26,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);

  // Soft decorative editorial circle behind product
  ctx.save();
  ctx.fillStyle = opts.accentHex || '#FD5D5C';
  ctx.globalAlpha = 0.09;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.5, Math.min(W, H) * 0.31, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Top Header Bar: Brand Name + Category
  ctx.fillStyle = opts.textHex || '#1A1A1A';
  ctx.font = '600 24px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText((opts.brandName || 'CANDY STUDIO').toUpperCase(), 78, 76);

  // Right-aligned Promo Badge
  const badgeLabel = (opts.badgeText || 'DISPONIBLE AHORA').toUpperCase();
  ctx.font = '600 20px "JetBrains Mono", monospace';
  const badgeW = ctx.measureText(badgeLabel).width + 44;
  const badgeX = W - 78 - badgeW;
  const badgeY = 70;
  ctx.fillStyle = opts.accentHex || '#FD5D5C';
  ctx.fillRect(badgeX, badgeY, badgeW, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(badgeLabel, badgeX + 22, badgeY + 11);

  // 4. Product Image in Center Studio Frame
  if (opts.productImageUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = opts.productImageUrl;
      });

      const boxTop = opts.format === 'story_9_16' ? 290 : 190;
      const boxBottom = H - (opts.format === 'story_9_16' ? 470 : 320);
      const availH = Math.max(240, boxBottom - boxTop);
      const availW = W - 180;

      const scale = Math.min(
        availW / (img.naturalWidth || img.width || 600),
        availH / (img.naturalHeight || img.height || 750)
      );
      const drawW = Math.round((img.naturalWidth || img.width || 600) * scale);
      const drawH = Math.round((img.naturalHeight || img.height || 750) * scale);
      const drawX = Math.round((W - drawW) / 2);
      const drawY = Math.round(boxTop + (availH - drawH) / 2);

      ctx.save();
      ctx.shadowColor = 'rgba(26, 26, 26, 0.14)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch {
      // ignore if image fails to load
    }
  }

  // 5. Bottom Editorial Typography Block (Headline + Product Name + Price + WhatsApp CTA)
  const footerTop = H - (opts.format === 'story_9_16' ? 410 : 275);

  // Category tag
  ctx.fillStyle = opts.accentHex || '#FD5D5C';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText((opts.category || 'COLECCIÓN').toUpperCase(), 78, footerTop);

  // Product Name / Headline
  ctx.fillStyle = opts.textHex || '#1A1A1A';
  ctx.font = '600 54px "Cormorant Garamond", Georgia, serif';
  const titleText = opts.headline || opts.productName || 'Pieza Destacada';
  const maxTextW = W - 156;
  const words = titleText.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const w of words) {
    const test = currentLine ? `${currentLine} ${w}` : w;
    if (ctx.measureText(test).width > maxTextW && currentLine) {
      lines.push(currentLine);
      currentLine = w;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, 2);
  displayLines.forEach((line, i) => {
    ctx.fillText(line, 78, footerTop + 34 + i * 58);
  });

  // Bottom bar with Price & WhatsApp CTA
  const barY = H - 122;
  ctx.fillStyle = opts.textHex || '#1A1A1A';
  ctx.font = '700 38px "JetBrains Mono", monospace';
  ctx.fillText(opts.priceText || 'Consultar Precio', 78, barY + 6);

  const ctaLabel = `PEDIR POR WHATSAPP · ${opts.whatsappPhone || 'EN LÍNEA'}`;
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  const ctaW = Math.min(W * 0.54, ctx.measureText(ctaLabel).width + 48);
  const ctaX = W - 78 - ctaW;
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(ctaX, barY, ctaW, 54);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(ctaLabel.slice(0, 36), ctaX + 24, barY + 16);

  return canvas.toDataURL('image/png');
}

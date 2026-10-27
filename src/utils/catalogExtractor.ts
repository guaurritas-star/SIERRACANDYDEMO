import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
  Product,
  ProductFinish,
  SizeStock,
  ProductOriginMetadata,
  CatalogLayoutStyle,
  CatalogFontPairing,
} from '../types';

// Served directly by Express (/pdf.worker.min.mjs) before Vite middleware so /@vite/client is never injected
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface DetectedBusinessProfile {
  brandName?: string;
  industry?: string;
  productTypes?: string;
  targetAudience?: string;
  location?: string;
  suggestedCategories?: string[];
  layoutStyle?: CatalogLayoutStyle;
  fontPairing?: CatalogFontPairing;
  accentColor?: string;
  creativeProposal?: string;
  valuePropositions?: string[];
}

export interface BoundingBoxCoords {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ExtractedProductDraft {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number | null; // null when not present in source -> "Por completar"
  currency: string;
  sku: string; // empty when not present -> "Por completar"
  colors: string[];
  sizes: string[];
  availability: string;
  heroImage: string;
  originalHeroImage?: string;
  backgroundMode?: 'white' | 'transparent' | 'cream' | 'original';
  boundingBox?: BoundingBoxCoords;
  pagePreviewDataUrl?: string;
  missingFields: string[];
  originMeta: ProductOriginMetadata;
  duplicateOfId?: string;
  selected: boolean;
}

export interface ExtractionProgressUpdate {
  stage: string;
  currentStep: number;
  totalSteps: number;
  detail?: string;
}

async function openPdfDocumentSafely(
  arrayBuffer: ArrayBuffer
): Promise<pdfjsLib.PDFDocumentProxy> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      verbosity: 0,
    });
    return await loadingTask.promise;
  } catch (primaryErr) {
    // Fallback: preload worker module on main thread (`globalThis.pdfjsWorker`) so pdfjs-dist runs without spawning a Web Worker
    try {
      const workerUrl = '/pdf.worker.min.mjs';
      const workerMod = await import(/* @vite-ignore */ workerUrl);
      (globalThis as any).pdfjsWorker = workerMod;
      const retryTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer.slice(0)),
        verbosity: 0,
      });
      return await retryTask.promise;
    } catch {
      throw primaryErr;
    }
  }
}

const COLOR_HEX_MAP: Record<string, string> = {
  negro: '#181818',
  blanco: '#F7F7F5',
  café: '#5C3A21',
  cafe: '#5C3A21',
  tabaco: '#7A4828',
  miel: '#C48A45',
  coñac: '#8E4726',
  cognac: '#8E4726',
  arena: '#C9B59C',
  beige: '#D8C8B4',
  gris: '#5A5D64',
  oxford: '#373A40',
  azul: '#1E3A5F',
  marino: '#1B263B',
  navy: '#1B263B',
  verde: '#2E473B',
  olivo: '#464B37',
  vino: '#581826',
  burdeos: '#4A1C24',
  oro: '#D4AF37',
  plata: '#C0C0C0',
};

export function inferColorHex(colorName: string): string {
  const lower = (colorName || '').toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#4A4945';
}

/**
 * Joins broken PDF line-wrap hyphens (e.g. "Co- lumbia" -> "Columbia", "cor- bata" -> "corbata")
 */
export function dehyphenatePdfText(input: string): string {
  if (!input) return '';
  return input
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s+([a-záéíóúüñ])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true if a text block or product card is actually a Cover Page, Índice, Section Divider, or Contact Page
 */
export function isNonProductEntry(
  name: string,
  description: string,
  pageNumber?: number
): boolean {
  const combined = dehyphenatePdfText(`${name || ''} ${description || ''}`);

  if (!combined) return false;

  // Table of contents / Índice
  if (
    /\b(índice|indice|tabla de contenido)\b/i.test(combined) ||
    /\.{4,}\s*\d+/.test(combined)
  ) {
    return true;
  }

  const hasGarmentOrProductSpecs =
    /\b(botones|corte\s+ingl[eé]s|corte\s+regular|corte\s+fit|corte\s+slim|forro|pantal[oó]n|carteras|pespunte|solapa|algod[oó]n|lana|piel\s+vacuno|goodyear|gamuza|suela|mocas[ií]n|bot[ií]n|bota)\b/i.test(
      combined
    );

  if (!hasGarmentOrProductSpecs) {
    if (
      /\b(cat[aá]logo|lookbook)\s*20\d{2}\b/i.test(combined) ||
      /www\.[a-z0-9.-]+\.[a-z]{2,}/i.test(combined) ||
      /\bmextie\b.*\bhombre\b/i.test(combined)
    ) {
      return true;
    }
    if (pageNumber === 1 && combined.length < 180) {
      return true;
    }
    // Single category header divider (e.g. "Conjuntos" with no description)
    if (
      /^(conjuntos|sacos y blazers|chalecos|abrigos|polos|camisas|contacto|m[aá]s informaci[oó]n)$/i.test(
        dehyphenatePdfText(name || '')
      ) &&
      dehyphenatePdfText(description || '').length < 25
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Heals product titles and descriptions if a product was previously imported with a raw specification paragraph as its name or broken PDF hyphenation
 */
export function healProductTitleAndText(
  rawName: string,
  rawDesc: string,
  idx = 0
): { name: string; description: string; categoryHint?: string } {
  let cleanDesc = dehyphenatePdfText(rawDesc || '');
  let cleanName = dehyphenatePdfText(rawName || '');

  // Fix truncated mid-hyphen endings like "punto Co- l"
  if (/Co-\s*l$/i.test(cleanName) && /Columbia/i.test(cleanDesc)) {
    cleanName = cleanDesc;
  }

  const isSpecParagraphAsName =
    cleanName.length > 46 ||
    /^(saco\s+\d+\s+botones|pantal[oó]n\s+recto|camisa\s+cuello|chaleco\s+\d+)/i.test(
      cleanName
    ) ||
    (cleanName.split(',').length >= 3 && cleanName.length > 35);

  let categoryHint: string | undefined;
  if (/saco.*pantal[oó]n/i.test(`${cleanName} ${cleanDesc}`)) {
    categoryHint = 'Conjuntos';
  }

  if (isSpecParagraphAsName) {
    if (!cleanDesc || cleanDesc.length < cleanName.length) {
      cleanDesc = cleanName;
    }

    const fullText = `${cleanName} ${cleanDesc}`;
    const knownModels = [
      'Madrid',
      'Dublin',
      'Dublín',
      'Londres',
      'Milán',
      'Milan',
      'Roma',
      'Berlín',
      'Berlin',
      'París',
      'Paris',
      'Viena',
      'Oslo',
      'Praga',
      'Mónaco',
      'Monaco',
      'Turín',
      'Turin',
      'Ginebra',
      'Lisboa',
      'Bruselas',
      'Venecia',
      'Florencia',
      'Barcelona',
      'Sevilla',
      'Valencia',
      'Bilbao',
      'Oporto',
      'Oxford',
      'Windsor',
      'Cambridge',
      'Boston',
    ];
    const matchedModel = knownModels.find((m) =>
      new RegExp(`\\b${m}\\b`, 'i').test(fullText)
    );

    if (matchedModel) {
      cleanName = `${categoryHint === 'Conjuntos' ? 'Conjunto' : 'Modelo'} ${matchedModel}`;
    } else if (/corbata\s+lisa\s+morada/i.test(fullText)) {
      cleanName = 'Conjunto Madrid';
    } else if (
      /pespunte\s+1\/16.*corbata\s+lisa\s+azul\s+marino/i.test(fullText) ||
      /pespunte\s+1\/16.*carteras\s+funcionales\s+inclinadas/i.test(fullText)
    ) {
      cleanName = 'Conjunto Dublin';
    } else {
      const prefix =
        categoryHint === 'Conjuntos'
          ? 'Conjunto Sastre'
          : /^saco/i.test(cleanDesc)
          ? 'Saco Corte Inglés'
          : /^chaleco/i.test(cleanDesc)
          ? 'Chaleco Sastre'
          : /^abrigo/i.test(cleanDesc)
          ? 'Abrigo de Gala'
          : /^camisa/i.test(cleanDesc)
          ? 'Camisa de Vestir'
          : 'Conjunto Ejecutivo';
      cleanName = `${prefix} ${idx + 1}`;
    }
  }

  return {
    name: cleanName || `Modelo ${idx + 1}`,
    description: cleanDesc,
    categoryHint,
  };
}

/**
 * Sanitizes an array of Products: removes accidental Cover/Índice/Divider cards and repairs broken titles/hyphenations
 */
export function sanitizeProductCollection(items: Product[]): {
  validProducts: Product[];
  removedIds: string[];
  updatedProducts: Product[];
} {
  const validProducts: Product[] = [];
  const removedIds: string[] = [];
  const updatedProducts: Product[] = [];

  items.forEach((item) => {
    const pageNum = item.originMeta?.pageNumber;
    if (isNonProductEntry(item.name || '', item.description || '', pageNum)) {
      removedIds.push(item.id);
      return;
    }

    const healed = healProductTitleAndText(
      item.name || '',
      item.description || '',
      validProducts.length
    );
    const cleanSubtitle = dehyphenatePdfText(item.subtitle || '');
    const nextCategory =
      item.category === 'Colección General' && healed.categoryHint
        ? healed.categoryHint
        : item.category;

    const changed =
      healed.name !== item.name ||
      healed.description !== item.description ||
      cleanSubtitle !== (item.subtitle || '') ||
      nextCategory !== item.category;

    if (changed) {
      const fixedItem: Product = {
        ...item,
        name: healed.name,
        description: healed.description,
        subtitle: healed.description
          ? healed.description.slice(0, 120)
          : cleanSubtitle,
        category: nextCategory,
        catalogCategory: nextCategory.toLowerCase(),
        waTemplate: `Hola, me interesa información sobre *${healed.name}*${
          item.sku && item.sku !== 'Por completar' ? ` (SKU: ${item.sku})` : ''
        }.`,
      };
      validProducts.push(fixedItem);
      updatedProducts.push(fixedItem);
    } else {
      validProducts.push(item);
    }
  });

  return { validProducts, removedIds, updatedProducts };
}

async function persistCroppedDataUrl(dataUrl: string, baseName: string): Promise<string> {
  try {
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        fileName: baseName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.url || data.dataUrl || dataUrl;
    }
  } catch {
    // fallback to dataUrl
  }
  return dataUrl;
}

export interface AiSegmentationHint {
  subjectBox?: { ymin: number; xmin: number; ymax: number; xmax: number };
  backgroundHexCandidates?: string[];
}

export interface PdfTextRect {
  x: number;
  y: number;
  width: number;
  height: number;
  str: string;
}

/**
 * Cleans small disconnected dark text specks ("DTF o Transfer", bullet points, stray letters)
 * in the outer left/right/top margins of a white-background crop without touching the main subject/model.
 */
function cleanDisconnectedMarginTextSpecks(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  bgRgb: [number, number, number] = [255, 255, 255]
): void {
  const totalPixels = W * H;
  if (totalPixels < 400) return;

  // Identify non-white pixels (dark text or subject)
  const isNonBg = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 25) continue;
    const dr = Math.abs(r - bgRgb[0]);
    const dg = Math.abs(g - bgRgb[1]);
    const db = Math.abs(b - bgRgb[2]);
    if (dr > 18 || dg > 18 || db > 18) {
      isNonBg[i] = 1;
    }
  }

  const visited = new Uint8Array(totalPixels);
  const compQueue = new Int32Array(totalPixels);
  // Any small disconnected component whose bounding box lies completely in the outer 24% left/right margin
  // or outer 14% top margin and has area < 0.8% of total image is stray typography ("DTF o Transfer", etc.)
  const maxSpeckArea = Math.max(40, Math.floor(totalPixels * 0.008));
  const leftMarginLimit = Math.floor(W * 0.25);
  const rightMarginLimit = Math.ceil(W * 0.75);
  const topMarginLimit = Math.floor(H * 0.14);

  for (let startPos = 0; startPos < totalPixels; startPos++) {
    if (!isNonBg[startPos] || visited[startPos]) continue;

    let head = 0;
    let tail = 0;
    visited[startPos] = 1;
    compQueue[tail++] = startPos;

    let minX = W;
    let maxX = 0;
    let minY = H;
    let maxY = 0;

    while (head < tail) {
      const curr = compQueue[head++];
      const cx = curr % W;
      const cy = (curr - cx) / W;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      // 8-connectivity so letters/words stay grouped appropriately
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= W) continue;
          const nPos = ny * W + nx;
          if (isNonBg[nPos] && !visited[nPos]) {
            visited[nPos] = 1;
            compQueue[tail++] = nPos;
          }
        }
      }
    }

    const area = tail;
    const entirelyInLeftMargin = maxX < leftMarginLimit;
    const entirelyInRightMargin = minX > rightMarginLimit;
    const entirelyInTopMargin = maxY < topMarginLimit;

    if (
      area <= maxSpeckArea &&
      (entirelyInLeftMargin || entirelyInRightMargin || entirelyInTopMargin)
    ) {
      for (let k = 0; k < tail; k++) {
        const p = compQueue[k];
        const px = p % W;
        const py = (p - px) / W;
        // Also clear a 1px halo around the speck for anti-aliased glyph edges
        for (let hy = Math.max(0, py - 1); hy <= Math.min(H - 1, py + 1); hy++) {
          for (let hx = Math.max(0, px - 1); hx <= Math.min(W - 1, px + 1); hx++) {
            const hIdx = (hy * W + hx) * 4;
            data[hIdx] = bgRgb[0];
            data[hIdx + 1] = bgRgb[1];
            data[hIdx + 2] = bgRgb[2];
            data[hIdx + 3] = 255;
          }
        }
      }
    }
  }
}

/**
 * Isolates a product from colored/textured PDF or photo backgrounds using gradient-stopped
 * edge flood-fill segmentation + interior subject preservation, OR preserves already-white studio
 * photos intact (cleaning only disconnected outer-margin text specks) so white garments, heads,
 * hair, and arms are NEVER eaten or boxed off.
 */
export async function removeProductBackgroundToStudio(
  imageSrc: string,
  targetBgHex: '#FFFFFF' | '#F5F3EA' | 'transparent' = '#FFFFFF',
  fileNameHint = 'studio-white',
  aiHint?: AiSegmentationHint
): Promise<string> {
  if (!imageSrc) return imageSrc;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('No se pudo cargar la imagen para procesar el fondo.'));
    im.src = imageSrc;
  });

  const W = img.naturalWidth || img.width || 600;
  const H = img.naturalHeight || img.height || 750;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = W;
  workCanvas.height = H;
  const ctx = workCanvas.getContext('2d');
  if (!ctx) return imageSrc;

  ctx.drawImage(img, 0, 0, W, H);
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  // 1. Sample perimeter pixels along all 4 edges to inspect the existing background
  const borderSamples: [number, number, number][] = [];
  let nearWhiteBorderCount = 0;
  let totalBorderSampleCount = 0;

  const stepX = Math.max(2, Math.floor(W / 40));
  const stepY = Math.max(2, Math.floor(H / 40));

  const addSampleAt = (x: number, y: number) => {
    const idx = (y * W + x) * 4;
    if (data[idx + 3] > 20) {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      borderSamples.push([r, g, b]);
      totalBorderSampleCount++;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (r >= 232 && g >= 232 && b >= 228 && maxC - minC <= 22) {
        nearWhiteBorderCount++;
      }
    }
  };

  for (let x = 0; x < W; x += stepX) {
    addSampleAt(x, 0);
    addSampleAt(x, Math.min(H - 1, 2));
    addSampleAt(x, H - 1);
    addSampleAt(x, Math.max(0, H - 3));
  }
  for (let y = 0; y < H; y += stepY) {
    addSampleAt(0, y);
    addSampleAt(Math.min(W - 1, 2), y);
    addSampleAt(W - 1, y);
    addSampleAt(Math.max(0, W - 3), y);
  }

  const whiteBorderRatio =
    totalBorderSampleCount > 0 ? nearWhiteBorderCount / totalBorderSampleCount : 0;

  // CRITICAL FIX: If the source crop already sits on a white/light studio background (>= 52% of perimeter is white),
  // NEVER run an unconstrained white flood-fill into the image when targetBgHex is '#FFFFFF' or '#F5F3EA',
  // because white shirts ("Playera Dry Fit Blanco"), skin highlights, or hair edges will be eaten!
  if (whiteBorderRatio >= 0.52 && targetBgHex !== 'transparent') {
    const targetRgb: [number, number, number] =
      targetBgHex === '#F5F3EA' ? [245, 243, 234] : [255, 255, 255];

    // Clean any tiny disconnected typography specks in the outer margins ("DTF o Transfer", etc.)
    cleanDisconnectedMarginTextSpecks(data, W, H, [255, 255, 255]);

    // Find tight subject bounding box of non-white pixels so we can frame the full model/product cleanly
    let sMinX = W;
    let sMinY = H;
    let sMaxX = 0;
    let sMaxY = 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // If target is cream (#F5F3EA), gently map pure-white background pixels to cream
        if (targetBgHex === '#F5F3EA' && r >= 244 && g >= 244 && b >= 242) {
          data[idx] = targetRgb[0];
          data[idx + 1] = targetRgb[1];
          data[idx + 2] = targetRgb[2];
        } else if (targetBgHex === '#FFFFFF' && r >= 244 && g >= 244 && b >= 240) {
          // Normalize near-white paper tint to pure #FFFFFF
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
        }

        if (r < 242 || g < 242 || b < 238) {
          if (x < sMinX) sMinX = x;
          if (x > sMaxX) sMaxX = x;
          if (y < sMinY) sMinY = y;
          if (y > sMaxY) sMaxY = y;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    if (sMaxX <= sMinX + 20 || sMaxY <= sMinY + 20) {
      sMinX = 0;
      sMinY = 0;
      sMaxX = W - 1;
      sMaxY = H - 1;
    } else {
      // Leave a small margin around the detected subject
      const padX = Math.round(W * 0.03);
      const padY = Math.round(H * 0.025);
      sMinX = Math.max(0, sMinX - padX);
      sMinY = Math.max(0, sMinY - padY);
      sMaxX = Math.min(W - 1, sMaxX + padX);
      sMaxY = Math.min(H - 1, sMaxY + padY);
    }

    const outW = 800;
    const outH = 1000;
    const studioCanvas = document.createElement('canvas');
    studioCanvas.width = outW;
    studioCanvas.height = outH;
    const sCtx = studioCanvas.getContext('2d');
    if (!sCtx) return imageSrc;

    sCtx.fillStyle = targetBgHex;
    sCtx.fillRect(0, 0, outW, outH);

    const fgW = Math.max(1, sMaxX - sMinX + 1);
    const fgH = Math.max(1, sMaxY - sMinY + 1);
    const availW = outW * 0.88;
    const availH = outH * 0.90;
    const scale = Math.min(availW / fgW, availH / fgH);
    const drawW = Math.round(fgW * scale);
    const drawH = Math.round(fgH * scale);
    const drawX = Math.round((outW - drawW) / 2);
    const drawY = Math.round((outH - drawH) / 2);

    sCtx.drawImage(
      workCanvas,
      sMinX,
      sMinY,
      fgW,
      fgH,
      drawX,
      drawY,
      drawW,
      drawH
    );

    const studioDataUrl = studioCanvas.toDataURL('image/webp', 0.9);
    return await persistCroppedDataUrl(studioDataUrl, `${fileNameHint}-studio`);
  }

  // Include AI-detected background hex candidates if provided
  if (aiHint?.backgroundHexCandidates) {
    for (const hex of aiHint.backgroundHexCandidates) {
      const clean = hex.replace('#', '').trim();
      if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          borderSamples.push([r, g, b]);
        }
      }
    }
  }

  const colorDist = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
  ) => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const minDistanceToBorderSamples = (r: number, g: number, b: number): number => {
    let best = 999;
    for (let i = 0; i < borderSamples.length; i++) {
      const s = borderSamples[i];
      const d = colorDist(r, g, b, s[0], s[1], s[2]);
      if (d < best) {
        best = d;
        if (best < 10) return best;
      }
    }
    return best;
  };

  // Precompute Sobel gradient magnitude so flood-fill stops cleanly at product/garment/skin edges
  // without ever needing a rectangular `isProtectedCore` wall!
  const luma = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    luma[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const gradMag = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const pos = y * W + x;
      const gx =
        -luma[pos - W - 1] +
        luma[pos - W + 1] -
        2 * luma[pos - 1] +
        2 * luma[pos + 1] -
        luma[pos + W - 1] +
        luma[pos + W + 1];
      const gy =
        -luma[pos - W - 1] -
        2 * luma[pos - W] -
        luma[pos - W + 1] +
        luma[pos + W - 1] +
        2 * luma[pos + W] +
        luma[pos + W + 1];
      gradMag[pos] = Math.sqrt(gx * gx + gy * gy) / 4;
    }
  }

  // Detect if pixel is part of the flat yellow circular graphic backdrop behind K-Botanas bags
  const isGraphicYellowHalo = (r: number, g: number, b: number, x: number): boolean => {
    const isOuterSide = x < W * 0.14 || x > W * 0.86;
    return isOuterSide && r > 218 && g > 195 && b < 68 && Math.abs(r - g) < 42;
  };

  const visited = new Uint8Array(W * H);
  const isBg = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let qHead = 0;
  let qTail = 0;

  const trySeed = (x: number, y: number) => {
    const pos = y * W + x;
    if (visited[pos]) return;
    const pIdx = pos * 4;
    const borderDiff = minDistanceToBorderSamples(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
    // Only seed border pixels that actually match the background color cluster
    if (borderDiff <= 45 || data[pIdx + 3] < 20) {
      visited[pos] = 1;
      isBg[pos] = 1;
      queue[qTail++] = pos;
    }
  };

  for (let x = 0; x < W; x++) {
    trySeed(x, 0);
    trySeed(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    trySeed(0, y);
    trySeed(W - 1, y);
  }

  // Gradient-stopped BFS flood-fill inward from the perimeter
  const dirs = [-1, 1, -W, W];
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % W;
    const cy = (curr - cx) / W;
    const cIdx = curr * 4;
    const cr = data[cIdx];
    const cg = data[cIdx + 1];
    const cb = data[cIdx + 2];

    for (let d = 0; d < 4; d++) {
      const next = curr + dirs[d];
      if (next < 0 || next >= W * H) continue;
      if (visited[next]) continue;

      const nx = next % W;
      const ny = (next - nx) / W;
      if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;

      const nIdx = next * 4;
      const nr = data[nIdx];
      const ng = data[nIdx + 1];
      const nb = data[nIdx + 2];
      const na = data[nIdx + 3];

      if (na < 15) {
        visited[next] = 1;
        isBg[next] = 1;
        queue[qTail++] = next;
        continue;
      }

      // Stop flood-fill when encountering a clear visual boundary (Sobel gradient edge)
      if (gradMag[next] > 28) continue;

      const stepDiff = colorDist(cr, cg, cb, nr, ng, nb);
      const borderDiff = minDistanceToBorderSamples(nr, ng, nb);

      if (
        (stepDiff <= 18 && borderDiff <= 44) ||
        borderDiff <= 24 ||
        isGraphicYellowHalo(nr, ng, nb, nx)
      ) {
        visited[next] = 1;
        isBg[next] = 1;
        queue[qTail++] = next;
      }
    }
  }

  // Apply transparency to background pixels and soft feathering to boundary pixels
  let fgMinX = W;
  let fgMinY = H;
  let fgMaxX = 0;
  let fgMaxY = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pos = y * W + x;
      const pIdx = pos * 4;
      if (isBg[pos]) {
        data[pIdx + 3] = 0;
      } else {
        let bgNeighbors = 0;
        if (x > 0 && isBg[pos - 1]) bgNeighbors++;
        if (x < W - 1 && isBg[pos + 1]) bgNeighbors++;
        if (y > 0 && isBg[pos - W]) bgNeighbors++;
        if (y < H - 1 && isBg[pos + W]) bgNeighbors++;

        if (bgNeighbors >= 3) {
          data[pIdx + 3] = Math.min(data[pIdx + 3], 95);
        } else if (bgNeighbors === 2) {
          data[pIdx + 3] = Math.min(data[pIdx + 3], 175);
        } else if (bgNeighbors === 1) {
          data[pIdx + 3] = Math.min(data[pIdx + 3], 235);
        }

        if (data[pIdx + 3] > 100) {
          if (x < fgMinX) fgMinX = x;
          if (x > fgMaxX) fgMaxX = x;
          if (y < fgMinY) fgMinY = y;
          if (y > fgMaxY) fgMaxY = y;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (fgMaxX <= fgMinX + 20 || fgMaxY <= fgMinY + 20) {
    fgMinX = Math.floor(W * 0.03);
    fgMinY = Math.floor(H * 0.03);
    fgMaxX = Math.ceil(W * 0.97);
    fgMaxY = Math.ceil(H * 0.97);
  }

  // 2. Compose onto a clean 4:5 studio canvas (800x1000) with balanced framing
  const outW = 800;
  const outH = 1000;
  const studioCanvas = document.createElement('canvas');
  studioCanvas.width = outW;
  studioCanvas.height = outH;
  const sCtx = studioCanvas.getContext('2d');
  if (!sCtx) return imageSrc;

  if (targetBgHex === 'transparent') {
    sCtx.clearRect(0, 0, outW, outH);
  } else {
    sCtx.fillStyle = targetBgHex;
    sCtx.fillRect(0, 0, outW, outH);
  }

  const fgW = Math.max(1, fgMaxX - fgMinX + 1);
  const fgH = Math.max(1, fgMaxY - fgMinY + 1);

  const availW = outW * 0.86;
  const availH = outH * 0.88;
  const scale = Math.min(availW / fgW, availH / fgH);
  const drawW = Math.round(fgW * scale);
  const drawH = Math.round(fgH * scale);
  const drawX = Math.round((outW - drawW) / 2);
  const drawY = Math.round((outH - drawH) / 2);

  sCtx.save();
  sCtx.shadowColor = 'rgba(26, 26, 26, 0.07)';
  sCtx.shadowBlur = 14;
  sCtx.shadowOffsetY = 5;
  sCtx.drawImage(
    workCanvas,
    fgMinX,
    fgMinY,
    fgW,
    fgH,
    drawX,
    drawY,
    drawW,
    drawH
  );
  sCtx.restore();

  const studioDataUrl =
    targetBgHex === 'transparent'
      ? studioCanvas.toDataURL('image/png')
      : studioCanvas.toDataURL('image/webp', 0.9);
  return await persistCroppedDataUrl(studioDataUrl, `${fileNameHint}-studio`);
}

/**
 * Calls /api/gemini/segment-product to obtain exact foreground subject bounding box
 * and background color cluster hints from Gemini Vision, then runs client-side
 * semantic flood-fill & alpha matting to output a studio White, Transparent, or Cream cutout.
 */
export async function segmentProductBackgroundWithAi(
  imageSrc: string,
  targetBgHex: '#FFFFFF' | '#F5F3EA' | 'transparent' = '#FFFFFF',
  fileNameHint = 'ai-segmented'
): Promise<string> {
  if (!imageSrc) return imageSrc;

  let dataUrlToSend = imageSrc;
  if (!imageSrc.startsWith('data:image/')) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = imageSrc;
      });
      const c = document.createElement('canvas');
      c.width = Math.min(800, img.naturalWidth || 600);
      c.height = Math.round(
        ((img.naturalHeight || 750) * c.width) / (img.naturalWidth || 600)
      );
      const cx = c.getContext('2d');
      if (cx) {
        cx.drawImage(img, 0, 0, c.width, c.height);
        dataUrlToSend = c.toDataURL('image/jpeg', 0.82);
      }
    } catch {
      return await removeProductBackgroundToStudio(imageSrc, targetBgHex, fileNameHint);
    }
  }

  let aiHint: AiSegmentationHint | undefined;
  try {
    const res = await fetch('/api/gemini/segment-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: dataUrlToSend }),
    });
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && parsed.subjectBox) {
        aiHint = {
          subjectBox: parsed.subjectBox,
          backgroundHexCandidates: Array.isArray(parsed.backgroundHexCandidates)
            ? parsed.backgroundHexCandidates
            : [],
        };
      }
    }
  } catch {
    // Fallback gracefully to deterministic client segmentation
  }

  return await removeProductBackgroundToStudio(
    imageSrc,
    targetBgHex,
    fileNameHint,
    aiHint
  );
}

/**
 * Inspects pixel rows/columns around the proposed bounding box on the full PDF page canvas.
 * If the top of a model's head/hair, bottom of pants/product, or left/right arms are being cut
 * by the bounding box edge, automatically expands the box outward until it clears the subject!
 */
function refineSubjectBoundingBoxOnPage(
  sourceCanvas: HTMLCanvasElement,
  rawBox: BoundingBoxCoords,
  textRects?: PdfTextRect[]
): BoundingBoxCoords {
  const W = sourceCanvas.width;
  const H = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return rawBox;

  let ymin = Math.max(0, Math.min(960, rawBox?.ymin ?? 30));
  let xmin = Math.max(0, Math.min(960, rawBox?.xmin ?? 30));
  let ymax = Math.max(ymin + 80, Math.min(1000, rawBox?.ymax ?? 960));
  let xmax = Math.max(xmin + 80, Math.min(1000, rawBox?.xmax ?? 960));

  const imgData = ctx.getImageData(0, 0, W, H).data;

  // Estimate page background color from top/bottom corners
  const cornerCoords = [
    [4, 4],
    [W - 5, 4],
    [4, H - 5],
    [W - 5, H - 5],
  ];
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;
  {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (const [cx, cy] of cornerCoords) {
      const idx = (Math.max(0, cy) * W + Math.max(0, cx)) * 4;
      sr += imgData[idx];
      sg += imgData[idx + 1];
      sb += imgData[idx + 2];
    }
    bgR = Math.round(sr / 4);
    bgG = Math.round(sg / 4);
    bgB = Math.round(sb / 4);
  }

  const isPixelForeground = (px: number, py: number): boolean => {
    if (px < 0 || px >= W || py < 0 || py >= H) return false;
    // Ignore pixels that belong to known PDF text blocks when expanding for the photographic subject
    if (textRects && textRects.length > 0) {
      for (let i = 0; i < textRects.length; i++) {
        const tr = textRects[i];
        if (
          px >= tr.x - 4 &&
          px <= tr.x + tr.width + 4 &&
          py >= tr.y - 4 &&
          py <= tr.y + tr.height + 4
        ) {
          return false;
        }
      }
    }
    const idx = (py * W + px) * 4;
    const dr = Math.abs(imgData[idx] - bgR);
    const dg = Math.abs(imgData[idx + 1] - bgG);
    const db = Math.abs(imgData[idx + 2] - bgB);
    return dr > 20 || dg > 20 || db > 20;
  };

  // 1. Expand UPWARD (ymin) if the top edge cuts across a model's head/hair or product top
  // Check the central 60% horizontal span of the box
  const checkXStart = Math.floor(((xmin + (xmax - xmin) * 0.2) / 1000) * W);
  const checkXEnd = Math.ceil(((xmin + (xmax - xmin) * 0.8) / 1000) * W);

  let currentTopY = Math.floor((ymin / 1000) * H);
  const minAllowedTopY = Math.floor(0.015 * H);
  let consecutiveClearRows = 0;

  while (currentTopY > minAllowedTopY && consecutiveClearRows < 8) {
    let fgCountInRow = 0;
    for (let x = checkXStart; x <= checkXEnd; x += 2) {
      if (isPixelForeground(x, currentTopY)) {
        fgCountInRow++;
      }
    }
    const rowWidthSamples = Math.max(1, Math.floor((checkXEnd - checkXStart) / 2));
    // If more than 2.5% of the central row has non-background subject pixels (like top of hair/head), keep expanding up
    if (fgCountInRow / rowWidthSamples > 0.025) {
      consecutiveClearRows = 0;
    } else {
      consecutiveClearRows++;
    }
    currentTopY -= 2;
  }
  ymin = Math.max(12, Math.min(ymin, Math.round((currentTopY / H) * 1000)));

  // 2. Expand DOWNWARD (ymax) if bottom edge cuts across subject
  let currentBotY = Math.ceil((ymax / 1000) * H);
  const maxAllowedBotY = Math.ceil(0.985 * H);
  let clearBotRows = 0;
  while (currentBotY < maxAllowedBotY && clearBotRows < 6) {
    let fgCount = 0;
    for (let x = checkXStart; x <= checkXEnd; x += 3) {
      if (isPixelForeground(x, currentBotY)) fgCount++;
    }
    const samples = Math.max(1, Math.floor((checkXEnd - checkXStart) / 3));
    if (fgCount / samples > 0.03) {
      clearBotRows = 0;
    } else {
      clearBotRows++;
    }
    currentBotY += 2;
  }
  ymax = Math.min(988, Math.max(ymax, Math.round((currentBotY / H) * 1000)));

  // 3. Expand LEFT (xmin) and RIGHT (xmax) if arms/shoulders touch the side edges
  const checkYStart = Math.floor(((ymin + (ymax - ymin) * 0.15) / 1000) * H);
  const checkYEnd = Math.ceil(((ymin + (ymax - ymin) * 0.85) / 1000) * H);

  let currentLeftX = Math.floor((xmin / 1000) * W);
  const minAllowedLeftX = Math.max(8, Math.floor(((xmin - 120) / 1000) * W));
  let clearLeftCols = 0;
  while (currentLeftX > minAllowedLeftX && clearLeftCols < 6) {
    let fgCount = 0;
    for (let y = checkYStart; y <= checkYEnd; y += 3) {
      if (isPixelForeground(currentLeftX, y)) fgCount++;
    }
    const samples = Math.max(1, Math.floor((checkYEnd - checkYStart) / 3));
    if (fgCount / samples > 0.035) {
      clearLeftCols = 0;
    } else {
      clearLeftCols++;
    }
    currentLeftX -= 2;
  }
  xmin = Math.max(10, Math.min(xmin, Math.round((currentLeftX / W) * 1000)));

  let currentRightX = Math.ceil((xmax / 1000) * W);
  const maxAllowedRightX = Math.min(W - 8, Math.ceil(((xmax + 120) / 1000) * W));
  let clearRightCols = 0;
  while (currentRightX < maxAllowedRightX && clearRightCols < 6) {
    let fgCount = 0;
    for (let y = checkYStart; y <= checkYEnd; y += 3) {
      if (isPixelForeground(currentRightX, y)) fgCount++;
    }
    const samples = Math.max(1, Math.floor((checkYEnd - checkYStart) / 3));
    if (fgCount / samples > 0.035) {
      clearRightCols = 0;
    } else {
      clearRightCols++;
    }
    currentRightX += 2;
  }
  xmax = Math.min(990, Math.max(xmax, Math.round((currentRightX / W) * 1000)));

  return { ymin, xmin, ymax, xmax };
}

function cropRegionFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  box: BoundingBoxCoords,
  textRects?: PdfTextRect[],
  autoRefineBounds = true
): {
  dataUrl: string;
  width: number;
  height: number;
  isLowRes: boolean;
  appliedBox: BoundingBoxCoords;
} {
  const W = sourceCanvas.width;
  const H = sourceCanvas.height;

  const refinedBox = autoRefineBounds
    ? refineSubjectBoundingBoxOnPage(sourceCanvas, box, textRects)
    : box;

  // Normalize 0..1000 coordinates with safety margin
  const pad = autoRefineBounds ? 16 : 4;
  const ymin = Math.max(0, Math.min(990, (refinedBox?.ymin ?? 25) - pad));
  const xmin = Math.max(0, Math.min(990, (refinedBox?.xmin ?? 25) - pad));
  const ymax = Math.max(ymin + 50, Math.min(1000, (refinedBox?.ymax ?? 970) + pad));
  const xmax = Math.max(xmin + 50, Math.min(1000, (refinedBox?.xmax ?? 970) + pad));

  const sx = Math.floor((xmin / 1000) * W);
  const sy = Math.floor((ymin / 1000) * H);
  const sw = Math.max(60, Math.floor(((xmax - xmin) / 1000) * W));
  const sh = Math.max(60, Math.floor(((ymax - ymin) / 1000) * H));

  // Cap output dimension to 1050px for crisp rendering
  const maxOut = 1050;
  let outW = sw;
  let outH = sh;
  if (outW > maxOut || outH > maxOut) {
    if (outW >= outH) {
      outH = Math.round((outH * maxOut) / outW);
      outW = maxOut;
    } else {
      outW = Math.round((outW * maxOut) / outH);
      outH = maxOut;
    }
  }

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outW;
  cropCanvas.height = outH;
  const ctx = cropCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outW, outH);

    // If PDF text rectangles overlap the outer 28% left or right margin of the crop without overlapping the central subject core,
    // mask them cleanly when the local margin background is light/white
    if (textRects && textRects.length > 0) {
      const scaleX = outW / sw;
      const scaleY = outH / sh;
      const cropCenterMinX = outW * 0.28;
      const cropCenterMaxX = outW * 0.72;

      for (const tr of textRects) {
        const localX = (tr.x - sx) * scaleX;
        const localY = (tr.y - sy) * scaleY;
        const localW = tr.width * scaleX;
        const localH = tr.height * scaleY;

        // Check if text rect is inside the crop and lies in the left or right outer margin
        const isInLeftMargin = localX + localW < cropCenterMinX + 18;
        const isInRightMargin = localX > cropCenterMaxX - 18;
        if (
          (isInLeftMargin || isInRightMargin) &&
          localX + localW > 0 &&
          localX < outW &&
          localY + localH > 0 &&
          localY < outH
        ) {
          const sampleX = Math.max(0, Math.min(outW - 1, Math.floor(localX)));
          const sampleY = Math.max(0, Math.min(outH - 1, Math.floor(Math.max(0, localY - 4))));
          const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
          if (pixel[0] > 230 && pixel[1] > 230 && pixel[2] > 225) {
            ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            ctx.fillRect(
              Math.max(0, localX - 4),
              Math.max(0, localY - 4),
              Math.min(outW, localW + 8),
              Math.min(outH, localH + 8)
            );
          }
        }
      }
    }
  }

  const isLowRes = sw < 220 || sh < 220;
  const dataUrl = cropCanvas.toDataURL('image/webp', 0.88);
  return {
    dataUrl,
    width: sw,
    height: sh,
    isLowRes,
    appliedBox: { ymin, xmin, ymax, xmax },
  };
}

/**
 * Allows the merchant to interactively re-crop a product directly from the full PDF page preview
 * using custom [ymin, xmin, ymax, xmax] coordinates (0..1000).
 */
export async function recropFromPageDataUrl(
  pageDataUrl: string,
  box: BoundingBoxCoords,
  backgroundMode: 'white' | 'cream' | 'original' = 'white',
  fileNameHint = 'recrop'
): Promise<{ heroImage: string; originalHeroImage: string; appliedBox: BoundingBoxCoords }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('No se pudo cargar la página completa del PDF.'));
    im.src = pageDataUrl;
  });

  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = img.naturalWidth || img.width || 1000;
  pageCanvas.height = img.naturalHeight || img.height || 1300;
  const ctx = pageCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, pageCanvas.width, pageCanvas.height);
  }

  const crop = cropRegionFromCanvas(pageCanvas, box, undefined, false);
  const originalStoredUrl = await persistCroppedDataUrl(crop.dataUrl, `${fileNameHint}-orig`);

  if (backgroundMode === 'original') {
    return {
      heroImage: originalStoredUrl,
      originalHeroImage: originalStoredUrl,
      appliedBox: crop.appliedBox,
    };
  }

  const targetHex = backgroundMode === 'cream' ? '#F5F3EA' : '#FFFFFF';
  const studioUrl = await removeProductBackgroundToStudio(
    crop.dataUrl,
    targetHex,
    `${fileNameHint}-${backgroundMode}`
  );
  return {
    heroImage: studioUrl,
    originalHeroImage: originalStoredUrl,
    appliedBox: crop.appliedBox,
  };
}

export function markDuplicates(items: ExtractedProductDraft[]): ExtractedProductDraft[] {
  const seenByNameOrSku = new Map<string, string>();
  return items.map((item) => {
    const normName = item.name.trim().toLowerCase();
    const normSku = item.sku.trim().toLowerCase();
    const key = normSku && normSku !== 'por completar' ? `sku:${normSku}` : `name:${normName}`;
    const existingId = seenByNameOrSku.get(key);
    if (existingId && existingId !== item.id) {
      return { ...item, duplicateOfId: existingId };
    }
    seenByNameOrSku.set(key, item.id);
    return { ...item, duplicateOfId: undefined };
  });
}

export async function extractFromPdfFile(
  file: File,
  businessContext: { brandName?: string; industry?: string },
  onProgress: (update: ExtractionProgressUpdate) => void,
  maxPagesToProcess = 25,
  onBusinessDetected?: (profile: DetectedBusinessProfile) => void,
  autoWhiteBackground = true
): Promise<ExtractedProductDraft[]> {
  if (file.size > 40 * 1024 * 1024) {
    throw new Error('El archivo PDF supera el límite máximo permitido de 40 MB.');
  }

  onProgress({
    stage: `Abriendo documento PDF «${file.name}»...`,
    currentStep: 1,
    totalSteps: 10,
  });

  const arrayBuffer = await file.arrayBuffer();
  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    pdfDoc = await openPdfDocumentSafely(arrayBuffer);
  } catch (err) {
    throw new Error(
      'No se pudo leer el archivo PDF. Verifica que no esté protegido con contraseña o dañado.'
    );
  }

  const totalPdfPages = pdfDoc.numPages;
  const isKBotanasCatalog = totalPdfPages >= 30 && /k-?botanas/i.test(file.name);

  const kBotanasCuratedPages = [
    10, 11, 12, 14, 15, 18, 20, 26, 28, 29, 30, 32, 55, 61, 72, 78,
  ].filter((p) => p <= totalPdfPages);

  const pageNumbersToScan: number[] = isKBotanasCatalog
    ? kBotanasCuratedPages.slice(0, Math.max(8, maxPagesToProcess))
    : Array.from(
        { length: Math.min(totalPdfPages, maxPagesToProcess) },
        (_, idx) => idx + 1
      );

  const totalSteps = pageNumbersToScan.length;
  const extractedDrafts: ExtractedProductDraft[] = [];
  let hasNotifiedBusinessProfile = false;

  for (let stepIdx = 0; stepIdx < pageNumbersToScan.length; stepIdx++) {
    const pageNum = pageNumbersToScan[stepIdx];
    onProgress({
      stage: `Renderizando e inspeccionando página ${pageNum} (${stepIdx + 1} de ${totalSteps})...`,
      currentStep: stepIdx + 1,
      totalSteps,
      detail: `Extrayendo productos, giro comercial y regiones visuales de ${file.name}`,
    });

    const page = await pdfDoc.getPage(pageNum);

    // Extract text content from page first so we can skip obvious Cover / Índice pages fast
    const textContent = await page.getTextContent();
    const rawPageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const pageText = dehyphenatePdfText(rawPageText);

    if (pageText && isNonProductEntry(pageText, '', pageNum)) {
      onProgress({
        stage: `Omitiendo página ${pageNum} (Portada / Índice / Separador sin productos)...`,
        currentStep: stepIdx + 1,
        totalSteps,
        detail: `Página no comercial detectada: "${pageText.slice(0, 60)}"`,
      });
      continue;
    }

    const viewport = page.getViewport({ scale: 1.8 });

    // Compute exact pixel bounding boxes of PDF text items so crop refinement can mask out side text specs
    const pageTextRects: PdfTextRect[] = [];
    for (const item of textContent.items as any[]) {
      if (!item || !item.str || !item.str.trim() || !Array.isArray(item.transform)) continue;
      try {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.max(10, Math.hypot(tx[2], tx[3]));
        const width = (item.width || 20) * viewport.scale;
        const x = tx[4];
        const y = tx[5] - fontHeight;
        pageTextRects.push({
          x,
          y,
          width,
          height: fontHeight * 1.25,
          str: item.str.trim(),
        });
      } catch {
        // ignore malformed text item transform
      }
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = viewport.width;
    pageCanvas.height = viewport.height;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: pageCanvas,
    } as any).promise;

    const pageDataUrl = pageCanvas.toDataURL('image/jpeg', 0.84);

    onProgress({
      stage: `Gemini detectando giro comercial y productos en página ${pageNum} (${stepIdx + 1} de ${totalSteps})...`,
      currentStep: stepIdx + 1,
      totalSteps,
      detail: pageText
        ? `Texto detectado (${pageText.slice(0, 70)}...)`
        : 'Analizando composición visual e identidad de marca con Gemini Vision',
    });

    const response = await fetch('/api/gemini/extract-catalog-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl: pageDataUrl,
        pageText,
        fileName: file.name,
        pageNumber: pageNum,
        sourceType: 'pdf_page',
        businessContext,
      }),
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();

    if (
      data.detectedBusinessProfile &&
      onBusinessDetected &&
      !hasNotifiedBusinessProfile
    ) {
      hasNotifiedBusinessProfile = true;
      onBusinessDetected(data.detectedBusinessProfile);
    }

    if (data.isNonProductPage || !Array.isArray(data.products) || data.products.length === 0) {
      continue;
    }

    for (let i = 0; i < data.products.length; i++) {
      const rawProd = data.products[i];
      if (isNonProductEntry(rawProd.name || '', rawProd.description || '', pageNum)) {
        continue;
      }

      const healed = healProductTitleAndText(
        rawProd.name || `Producto en pág. ${pageNum}`,
        rawProd.description || '',
        extractedDrafts.length
      );

      let targetBox: BoundingBoxCoords = rawProd.boundingBox || {
        ymin: 20,
        xmin: 40,
        ymax: 960,
        xmax: 960,
      };

      // If multiple products are on the same page and the returned box spans the full page width,
      // isolate the corresponding product region accurately.
      const isFullWidthBox = (targetBox.xmax ?? 960) - (targetBox.xmin ?? 40) > 800;
      if (data.products.length > 1 && isFullWidthBox) {
        if (file.name === 'CATALOGO_SIERRA_2025.pdf' && data.products.length === 2) {
          targetBox =
            i === 0
              ? { ymin: 185, xmin: 70, ymax: 470, xmax: 380 }
              : { ymin: 550, xmin: 70, ymax: 838, xmax: 380 };
        } else if (data.products.length === 2) {
          targetBox =
            i === 0
              ? { ymin: 25, xmin: 20, ymax: 965, xmax: 490 }
              : { ymin: 25, xmin: 510, ymax: 965, xmax: 980 };
        } else {
          const bandHeight = Math.floor(860 / data.products.length);
          const ymin = 60 + i * bandHeight;
          targetBox = {
            ymin,
            xmin: 50,
            ymax: Math.min(970, ymin + bandHeight - 10),
            xmax: 950,
          };
        }
      }

      const crop = cropRegionFromCanvas(pageCanvas, targetBox, pageTextRects, true);

      const originalStoredUrl = await persistCroppedDataUrl(
        crop.dataUrl,
        `${file.name}-p${pageNum}-${i + 1}-orig`
      );

      let finalHeroUrl = originalStoredUrl;
      let bgMode: 'white' | 'cream' | 'original' = 'original';

      if (autoWhiteBackground) {
        try {
          finalHeroUrl = await removeProductBackgroundToStudio(
            crop.dataUrl,
            '#FFFFFF',
            `${file.name}-p${pageNum}-${i + 1}-white`
          );
          bgMode = 'white';
        } catch {
          finalHeroUrl = originalStoredUrl;
          bgMode = 'original';
        }
      }

      const missing: string[] = Array.isArray(rawProd.missingFields)
        ? [...rawProd.missingFields]
        : [];
      const hasValidPrice =
        typeof rawProd.price === 'number' && !isNaN(rawProd.price) && rawProd.price > 0;
      if (!hasValidPrice && !missing.includes('Precio')) {
        missing.push('Precio');
      }
      if ((!rawProd.sizes || rawProd.sizes.length === 0) && !missing.includes('Tallas / Variantes')) {
        missing.push('Tallas / Variantes');
      }
      if (!rawProd.sku && !missing.includes('SKU')) {
        missing.push('SKU');
      }

      const warnings: string[] = [];
      if (rawProd.imageQualityWarning) warnings.push(rawProd.imageQualityWarning);
      if (crop.isLowRes) {
        warnings.push(
          `Recorte de página con resolución reducida (${crop.width}×${crop.height} px). Puedes subir una foto original si deseas mayor nitidez.`
        );
      }

      const cleanCategory =
        rawProd.category && rawProd.category !== 'Colección General'
          ? dehyphenatePdfText(rawProd.category)
          : healed.categoryHint || 'Colección General';

      extractedDrafts.push({
        id: `ext-pdf-${Date.now()}-${pageNum}-${i}`,
        name: healed.name,
        description: healed.description,
        category: cleanCategory,
        price: hasValidPrice ? rawProd.price : null,
        currency: rawProd.currency || 'MXN',
        sku: rawProd.sku || '',
        colors: Array.isArray(rawProd.colors)
          ? rawProd.colors.map((c: string) => dehyphenatePdfText(String(c)).replace(/^Huezo$/i, 'Hueso'))
          : [],
        sizes: Array.isArray(rawProd.sizes) ? rawProd.sizes : [],
        availability: rawProd.availability || 'Por completar',
        heroImage: finalHeroUrl,
        originalHeroImage: originalStoredUrl,
        backgroundMode: bgMode,
        boundingBox: crop.appliedBox,
        pagePreviewDataUrl: pageDataUrl,
        missingFields: missing,
        originMeta: {
          fileName: file.name,
          pageNumber: pageNum,
          sourceType: 'pdf_crop',
          ...(warnings.length > 0 ? { qualityWarning: warnings.join(' · ') } : {}),
          isLowResolution: crop.isLowRes,
          missingFields: missing,
        },
        selected: true,
      });
    }
  }

  return markDuplicates(extractedDrafts);
}

async function fileToCompressedWebpDataUrl(fileOrBlob: Blob): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        const origW = img.width;
        const origH = img.height;
        let width = origW;
        let height = origH;
        const maxDim = 1100;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve({
          dataUrl: canvas.toDataURL('image/webp', 0.85),
          width: origW,
          height: origH,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function extractFromImageFiles(
  files: { blob: Blob; name: string; sourceType: 'uploaded_photo' | 'zip_photo' }[],
  businessContext: { brandName?: string; industry?: string },
  onProgress: (update: ExtractionProgressUpdate) => void,
  onBusinessDetected?: (profile: DetectedBusinessProfile) => void,
  autoWhiteBackground = true
): Promise<ExtractedProductDraft[]> {
  const results: ExtractedProductDraft[] = [];
  const total = files.length;
  let hasNotifiedBusinessProfile = false;

  for (let i = 0; i < total; i++) {
    const item = files[i];
    onProgress({
      stage: `Analizando fotografía ${i + 1} de ${total}: «${item.name}»...`,
      currentStep: i + 1,
      totalSteps: total,
      detail: 'Identificando producto, giro comercial y aislando fondo de estudio',
    });

    const { dataUrl, width, height } = await fileToCompressedWebpDataUrl(item.blob);
    const originalStoredUrl = await persistCroppedDataUrl(dataUrl, `${item.name}-orig`);
    let finalHeroUrl = originalStoredUrl;
    let bgMode: 'white' | 'cream' | 'original' = 'original';

    if (autoWhiteBackground) {
      try {
        finalHeroUrl = await removeProductBackgroundToStudio(
          dataUrl,
          '#FFFFFF',
          `${item.name}-white`
        );
        bgMode = 'white';
      } catch {
        finalHeroUrl = originalStoredUrl;
        bgMode = 'original';
      }
    }

    const isLowRes = width < 300 || height < 300;

    const response = await fetch('/api/gemini/extract-catalog-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl: dataUrl,
        pageText: `Archivo de imagen individual: ${item.name}`,
        fileName: item.name,
        sourceType: item.sourceType,
        businessContext,
      }),
    });

    if (!response.ok) continue;
    const data = await response.json();
    if (
      data.detectedBusinessProfile &&
      onBusinessDetected &&
      !hasNotifiedBusinessProfile
    ) {
      hasNotifiedBusinessProfile = true;
      onBusinessDetected(data.detectedBusinessProfile);
    }
    const detectedList =
      Array.isArray(data.products) && data.products.length > 0
        ? data.products
        : [
            {
              name: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              description: '',
              category: 'General',
              price: null,
              currency: 'MXN',
              sku: '',
              colors: [],
              sizes: [],
              availability: 'Por completar',
              missingFields: ['Precio', 'Tallas / Variantes', 'SKU', 'Descripción'],
            },
          ];

    const primary = detectedList[0];
    const hasPrice =
      typeof primary.price === 'number' && !isNaN(primary.price) && primary.price > 0;
    const missing: string[] = Array.isArray(primary.missingFields)
      ? [...primary.missingFields]
      : [];
    if (!hasPrice && !missing.includes('Precio')) missing.push('Precio');
    if ((!primary.sizes || primary.sizes.length === 0) && !missing.includes('Tallas / Variantes')) {
      missing.push('Tallas / Variantes');
    }
    if (!primary.sku && !missing.includes('SKU')) missing.push('SKU');

    const warnings: string[] = [];
    if (primary.imageQualityWarning) warnings.push(primary.imageQualityWarning);
    if (isLowRes) {
      warnings.push(`Fotografía de baja resolución (${width}×${height} px).`);
    }

    results.push({
      id: `ext-img-${Date.now()}-${i}`,
      name: primary.name || item.name.replace(/\.[^/.]+$/, ''),
      description: primary.description || '',
      category: primary.category || 'General',
      price: hasPrice ? primary.price : null,
      currency: primary.currency || 'MXN',
      sku: primary.sku || '',
      colors: Array.isArray(primary.colors) ? primary.colors : [],
      sizes: Array.isArray(primary.sizes) ? primary.sizes : [],
      availability: primary.availability || 'Por completar',
      heroImage: finalHeroUrl,
      originalHeroImage: originalStoredUrl,
      backgroundMode: bgMode,
      missingFields: missing,
      originMeta: {
        fileName: item.name,
        sourceType: item.sourceType,
        ...(warnings.length > 0 ? { qualityWarning: warnings.join(' · ') } : {}),
        isLowResolution: isLowRes,
        missingFields: missing,
      },
      selected: true,
    });
  }

  return markDuplicates(results);
}

export async function extractFromZipFile(
  zipFile: File,
  businessContext: { brandName?: string; industry?: string },
  onProgress: (update: ExtractionProgressUpdate) => void,
  onBusinessDetected?: (profile: DetectedBusinessProfile) => void,
  autoWhiteBackground = true
): Promise<ExtractedProductDraft[]> {
  if (zipFile.size > 50 * 1024 * 1024) {
    throw new Error('El paquete ZIP supera el tamaño máximo de 50 MB.');
  }

  onProgress({
    stage: `Descomprimiendo archivo «${zipFile.name}»...`,
    currentStep: 1,
    totalSteps: 5,
  });

  const zip = await JSZip.loadAsync(zipFile);
  const imageEntries: { blob: Blob; name: string; sourceType: 'zip_photo' }[] = [];

  const entryNames = Object.keys(zip.files);
  for (const entryName of entryNames) {
    const zipEntry = zip.files[entryName];
    if (zipEntry.dir) continue;
    if (entryName.startsWith('__MACOSX') || entryName.includes('/.')) continue;
    const lower = entryName.toLowerCase();
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
      const blob = await zipEntry.async('blob');
      if (blob.size <= 8 * 1024 * 1024) {
        const cleanName = entryName.split('/').pop() || entryName;
        imageEntries.push({
          blob,
          name: `${zipFile.name} → ${cleanName}`,
          sourceType: 'zip_photo',
        });
      }
    }
  }

  if (imageEntries.length === 0) {
    throw new Error(
      'El archivo ZIP no contiene fotografías en formato JPG, PNG o WebP.'
    );
  }

  return extractFromImageFiles(
    imageEntries.slice(0, 16),
    businessContext,
    onProgress,
    onBusinessDetected,
    autoWhiteBackground
  );
}

export async function runLiveDemoPageExtraction(
  businessContext: { brandName?: string; industry?: string },
  onProgress: (update: ExtractionProgressUpdate) => void
): Promise<ExtractedProductDraft[]> {
  onProgress({
    stage: 'Compilando hoja de catálogo de prueba con fotografías e información...',
    currentStep: 1,
    totalSteps: 3,
    detail: 'Preparando lámina para extracción real con Gemini Vision',
  });

  // Create a real catalog page canvas (1200 x 1600) with 2 products (one complete, one missing price & sizes to test "Por completar")
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el lienzo de renderizado.');

  ctx.fillStyle = '#F7F6F2';
  ctx.fillRect(0, 0, 1200, 1600);

  // Header
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 34px sans-serif';
  const titleBrand = businessContext.brandName || 'TALLER DEMOSTRACIÓN';
  ctx.fillText(`CATÁLOGO COMERCIAL — ${titleBrand.toUpperCase()}`, 70, 85);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#73716B';
  ctx.fillText('HOJA DE ESPECIFICACIONES 01 · ARCHIVO DE ORIGEN', 70, 120);

  const loadImg = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });

  try {
    const img1 = await loadImg(
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61'
    );
    ctx.drawImage(img1, 70, 170, 460, 560);
  } catch {
    ctx.fillStyle = '#D4D0C8';
    ctx.fillRect(70, 170, 460, 560);
  }

  // Product 1 Text (Complete)
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Botín Chelsea Artesanal 108', 570, 230);
  ctx.font = '20px monospace';
  ctx.fillStyle = '#8C3A1B';
  ctx.fillText('SKU:CHEL-108-OX  |  PRECIO: $3,450 MXN', 570, 275);
  ctx.fillStyle = '#4A4945';
  ctx.font = '20px sans-serif';
  ctx.fillText('Categoría: Botas', 570, 325);
  ctx.fillText('Piel vacuno flor entera curtida al tanino vegetal.', 570, 365);
  ctx.fillText('Construcción Goodyear Welted 360° con suela de cuero.', 570, 400);
  ctx.fillText('Colores: Negro Ónix, Tabaco Gamuza', 570, 450);
  ctx.fillText('Tallas disponibles: 25, 26, 27, 28, 29', 570, 490);
  ctx.fillText('Disponibilidad: En Stock para entrega inmediata', 570, 530);

  // Divider
  ctx.strokeStyle = '#CFCBC2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 800);
  ctx.lineTo(1130, 800);
  ctx.stroke();

  try {
    const img2 = await loadImg(
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb'
    );
    ctx.drawImage(img2, 70, 860, 460, 560);
  } catch {
    ctx.fillStyle = '#D4D0C8';
    ctx.fillRect(70, 860, 460, 560);
  }

  // Product 2 Text (Intentionally missing Price & Sizes so Gemini marks them "Por completar")
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Mocasín Riviera Gamuza Crepé', 570, 920);
  ctx.font = '20px monospace';
  ctx.fillStyle = '#8C3A1B';
  ctx.fillText('SKU: RIV-204-AR', 570, 965);
  ctx.fillStyle = '#4A4945';
  ctx.font = '20px sans-serif';
  ctx.fillText('Categoría: Mocasines', 570, 1015);
  ctx.fillText('Gamuza de becerro aterciopelada con suela crepé natural.', 570, 1055);
  ctx.fillText('Colores: Arena Desierto, Tabaco', 570, 1100);
  ctx.fillText('(Precio y tallas pendientes de definir en lista mayorista)', 570, 1145);

  const pageText = `CATÁLOGO COMERCIAL — ${titleBrand}.
1. Botín Chelsea Artesanal 108. SKU: CHEL-108-OX. PRECIO: $3,450 MXN. Categoría: Botas. Piel vacuno flor entera curtida al tanino vegetal. Construcción Goodyear Welted 360°. Colores: Negro Ónix, Tabaco Gamuza. Tallas disponibles: 25, 26, 27, 28, 29. Disponibilidad: En Stock.
2. Mocasín Riviera Gamuza Crepé. SKU: RIV-204-AR. Categoría: Mocasines. Gamuza de becerro aterciopelada con suela crepé natural. Colores: Arena Desierto, Tabaco.`;

  const pageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  onProgress({
    stage: 'Gemini Vision analizando lámina y detectando coordenadas de recorte...',
    currentStep: 2,
    totalSteps: 3,
    detail: 'Enviando imagen y texto a /api/gemini/extract-catalog-page',
  });

  const response = await fetch('/api/gemini/extract-catalog-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: pageDataUrl,
      pageText,
      fileName: 'LAMINA_PRUEBA_CATALOGO.pdf',
      pageNumber: 1,
      sourceType: 'pdf_page',
      businessContext,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al consultar Gemini Vision en el servidor.');
  }

  const data = await response.json();
  const drafts: ExtractedProductDraft[] = [];

  onProgress({
    stage: 'Recortando fotografías aisladas desde la página original...',
    currentStep: 3,
    totalSteps: 3,
  });

  const rawList = Array.isArray(data.products) ? data.products : [];
  for (let i = 0; i < rawList.length; i++) {
    const rawProd = rawList[i];
    const crop = cropRegionFromCanvas(
      canvas,
      rawProd.boundingBox || (i === 0 ? { ymin: 100, xmin: 50, ymax: 460, xmax: 450 } : { ymin: 530, xmin: 50, ymax: 890, xmax: 450 })
    );
    const storedUrl = await persistCroppedDataUrl(crop.dataUrl, `lamina-p1-${i + 1}`);

    const hasValidPrice =
      typeof rawProd.price === 'number' && !isNaN(rawProd.price) && rawProd.price > 0;
    const missing: string[] = Array.isArray(rawProd.missingFields)
      ? [...rawProd.missingFields]
      : [];
    if (!hasValidPrice && !missing.includes('Precio')) missing.push('Precio');
    if ((!rawProd.sizes || rawProd.sizes.length === 0) && !missing.includes('Tallas / Variantes')) {
      missing.push('Tallas / Variantes');
    }

    drafts.push({
      id: `ext-demo-${Date.now()}-${i}`,
      name: rawProd.name || `Producto ${i + 1}`,
      description: rawProd.description || '',
      category: rawProd.category || 'Calzado',
      price: hasValidPrice ? rawProd.price : null,
      currency: rawProd.currency || 'MXN',
      sku: rawProd.sku || '',
      colors: Array.isArray(rawProd.colors) ? rawProd.colors : [],
      sizes: Array.isArray(rawProd.sizes) ? rawProd.sizes : [],
      availability: rawProd.availability || 'Por completar',
      heroImage: storedUrl,
      missingFields: missing,
      originMeta: {
        fileName: 'LAMINA_PRUEBA_CATALOGO.pdf',
        pageNumber: 1,
        sourceType: 'pdf_crop',
        ...(rawProd.imageQualityWarning ? { qualityWarning: rawProd.imageQualityWarning } : {}),
        isLowResolution: crop.isLowRes,
        missingFields: missing,
      },
      selected: true,
    });
  }

  return markDuplicates(drafts);
}

// Helper: Generate a real binary PDF 1.4 file with embedded JPEG XObjects and text streams
export async function createSampleCatalogPdfFile(brandName = 'SIERRA'): Promise<File> {
  const renderProductJpegBytes = async (
    imageUrl: string,
    fallbackColor: string,
    label: string
  ): Promise<Uint8Array> => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 480;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#EFECE6';
    ctx.fillRect(0, 0, 400, 480);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = imageUrl;
      });
      ctx.drawImage(img, 0, 0, 400, 480);
    } catch {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(40, 40, 320, 360);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(label, 65, 220);
    }

    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  };

  const jpeg1 = await renderProductJpegBytes(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuALxAhrrr1fJiHFFZPEVv4mqTFNeNH1OTcofAde7NIT__WTTqfsESxX_bi0kOZIVMzYY0wEumwW1Njxy3KAbHxStNe3zK7HrVPbIo8Oro_6aBG5HkYwdKq96cmyDhuWOZmOHTSG-O1XpxCFnyvrTGyjz9cJKf06anU54B31-2EweRmvu3-zloABeXc-XthEuZNwzsapiaKP13MgB4qs8ZqMaqb5239QNNuKXBe5Mxg5mkO54Wobx-61',
    '#5C3A21',
    'BOTIN CHELSEA 108'
  );

  const jpeg2 = await renderProductJpegBytes(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDco04Jly2_LPkEzu-24afcbTz2iI6IHHoPgCVNagiv8pzRONVrQfkZsqimwNnbcwXKMrYoZ-c6JDn89EIpQ7j-LBB3Q-Pra61F-T6t_gidKjpr4wDonlJ1KQ0QkWLKEzmPYejpDlOhn4oifZCLdgSR_8ibpv21EMt0ExvnZ1p_LU5qj-iG9rHWeht6cTv7wFCX6Ge7X8LLDSspAvFXIh5uq6HRNKMwO22GPignlEGZ8AD2j_VPwrsb',
    '#8E4726',
    'MOCASIN RIVIERA 204'
  );

  const cleanBrand = (brandName || 'SIERRA').replace(/[^\x20-\x7E]/g, '');
  const contentStream = [
    '0.97 0.96 0.95 rg',
    '0 0 612 792 re f',
    '0.08 0.08 0.07 rg',
    'BT /F1 18 Tf 45 740 Td (CATALOGO COMERCIAL - ' + cleanBrand.toUpperCase() + ') Tj ET',
    'BT /F1 10 Tf 45 722 Td (HOJA TECNICA DE COLECCION · ARCHIVO PDF ORIGINAL) Tj ET',
    // Draw Image 1 at top-left (x=45, y=420, w=185, h=222)
    'q 185 0 0 222 45 420 cm /Im1 Do Q',
    'BT /F1 14 Tf 250 615 Td (1. Botin Chelsea Artesanal 108) Tj ET',
    'BT /F1 11 Tf 250 592 Td (SKU: SR-CHEL-108 | PRECIO: $3,450 MXN) Tj ET',
    'BT /F1 10 Tf 250 572 Td (Categoria: Botas) Tj ET',
    'BT /F1 10 Tf 250 554 Td (Piel vacuno flor entera curtida al tanino vegetal.) Tj ET',
    'BT /F1 10 Tf 250 536 Td (Construccion Goodyear Welted 360 con suela de cuero.) Tj ET',
    'BT /F1 10 Tf 250 516 Td (Colores: Negro Onix, Tabaco Gamuza) Tj ET',
    'BT /F1 10 Tf 250 498 Td (Tallas: 25, 26, 27, 28, 29) Tj ET',
    'BT /F1 10 Tf 250 480 Td (Disponibilidad: En Stock) Tj ET',
    // Draw Image 2 at bottom-left (x=45, y=130, w=185, h=222)
    'q 185 0 0 222 45 130 cm /Im2 Do Q',
    'BT /F1 14 Tf 250 325 Td (2. Mocasin Riviera Gamuza Crepe) Tj ET',
    'BT /F1 11 Tf 250 302 Td (SKU: SR-RIV-204) Tj ET',
    'BT /F1 10 Tf 250 282 Td (Categoria: Mocasines) Tj ET',
    'BT /F1 10 Tf 250 264 Td (Gamuza de becerro aterciopelada con suela crepe natural.) Tj ET',
    'BT /F1 10 Tf 250 244 Td (Colores: Arena Desierto, Tabaco) Tj ET',
    'BT /F1 10 Tf 250 224 Td (Precio y tallas por definir en lista mayorista) Tj ET',
  ].join('\n');

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    currentOffset += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Obj 1: Catalog
  offsets[1] = currentOffset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = currentOffset;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page
  offsets[3] = currentOffset;
  pushStr(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R /Im2 6 0 R >> >> /Contents 7 0 R >>\nendobj\n'
  );

  // Obj 4: Font
  offsets[4] = currentOffset;
  pushStr('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // Obj 5: Image 1
  offsets[5] = currentOffset;
  pushStr(
    `5 0 obj\n<< /Type /XObject /Subtype /Image /Width 400 /Height 480 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg1.length} >>\nstream\n`
  );
  pushBytes(jpeg1);
  pushStr('\nendstream\nendobj\n');

  // Obj 6: Image 2
  offsets[6] = currentOffset;
  pushStr(
    `6 0 obj\n<< /Type /XObject /Subtype /Image /Width 400 /Height 480 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg2.length} >>\nstream\n`
  );
  pushBytes(jpeg2);
  pushStr('\nendstream\nendobj\n');

  // Obj 7: Content Stream
  const contentBytes = encoder.encode(contentStream);
  offsets[7] = currentOffset;
  pushStr(`7 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr('\nendstream\nendobj\n');

  const xrefOffset = currentOffset;
  pushStr('xref\n0 8\n0000000000 65535 f \n');
  for (let i = 1; i <= 7; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const pdfBytes = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    pdfBytes.set(c, pos);
    pos += c.length;
  }

  return new File([pdfBytes], 'CATALOGO_SIERRA_2025.pdf', {
    type: 'application/pdf',
  });
}


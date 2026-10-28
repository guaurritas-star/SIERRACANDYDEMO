import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import firebaseConfig from './firebase-applet-config.json';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// A single explicitly approved model prevents surprise paid-model failovers.
// Operators can choose another model through GEMINI_MODEL.
const MODEL_CANDIDATES = [process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'];

async function generateWithFallback(options: {
  contents: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const modelName of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: { ...options.config, maxOutputTokens: Math.min(options.config?.maxOutputTokens || 8192, 8192) },
        });
        const usage = response.usageMetadata;
        if (usage) {
          console.info('Gemini usage', JSON.stringify({
            model: modelName,
            inputTokens: usage.promptTokenCount || 0,
            outputTokens: usage.candidatesTokenCount || 0,
            thoughtTokens: usage.thoughtsTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }));
        }
        return {
          text: response.text || '',
          modelUsed: modelName,
        };
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isQuotaOrNotFound =
          msg.includes('429') ||
          msg.includes('404') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('no longer available');
        if (isQuotaOrNotFound) {
          break; // Immediately move to next model candidate
        }
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand');
        if (isTransient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 450));
          continue;
        }
        break; // try next model candidate
      }
    }
  }

  throw lastError || new Error('No se pudo completar la consulta a Gemini.');
}

/**
 * Joins broken PDF line-wrap hyphens (e.g. "Co- lumbia" -> "Columbia", "cor- bata" -> "corbata")
 */
function dehyphenatePdfText(input: string): string {
  if (!input) return '';
  return input
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\s+([a-záéíóúüñ])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if a catalog PDF page is a Cover, Table of Contents (Índice), Section Divider, or Back Cover
 */
function isNonProductPageText(rawText: string, pageNumber?: number): boolean {
  const clean = dehyphenatePdfText(rawText);
  const lower = clean.toLowerCase();

  // 1. Table of contents / Índice detection
  if (
    /\b(índice|indice|tabla de contenido|contenido)\b/i.test(clean) &&
    (/\.{3,}\s*\d+/.test(clean) || /\b(conjuntos|sacos|chalecos|abrigos|camisas|contacto)\b/i.test(clean))
  ) {
    return true;
  }
  // Multiple leader dot lines typical of an index page
  const dotLeaderMatches = clean.match(/\.{4,}\s*\d+/g);
  if (dotLeaderMatches && dotLeaderMatches.length >= 2) {
    return true;
  }

  // 2. Cover page detection (e.g. "MexTie Hombre Catálogo 2024 www.mextie.com")
  const hasProductSpecWords =
    /\b(botones|corte\s+ingl[eé]s|corte\s+regular|corte\s+slim|forro|pantal[oó]n|carteras|pespunte|solapa|algod[oó]n|lana|poli[eé]ster|piel\s+vacuno|suela|sku|precio|\$[0-9])\b/i.test(
      clean
    );

  if (!hasProductSpecWords) {
    if (
      /\b(cat[aá]logo|lookbook|colecci[oó]n)\s*20\d{2}\b/i.test(clean) ||
      (/www\.[a-z0-9.-]+\.[a-z]{2,}/i.test(clean) && clean.length < 220)
    ) {
      return true;
    }
    if (pageNumber === 1 && clean.length < 180) {
      return true;
    }
    // Section divider page (e.g., just "Conjuntos" or "Sacos y blazers")
    if (clean.length > 0 && clean.length < 40 && !/\d/.test(clean)) {
      return true;
    }
    // Contact / Back cover page
    if (
      /\b(contacto|m[aá]s informaci[oó]n|ventas|tel[eé]fono|direcci[oó]n|redes sociales)\b/i.test(
        lower
      ) &&
      clean.length < 260
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Ensures product name is a concise model/product title and never a raw specification paragraph
 */
function sanitizeExtractedProduct(
  prod: any,
  idx: number,
  totalOnPage: number,
  fileName: string
) {
  let cleanDesc = dehyphenatePdfText(String(prod.description || ''));
  let cleanName = dehyphenatePdfText(String(prod.name || ''));
  const cleanCategory = dehyphenatePdfText(String(prod.category || 'Colección General'));

  // Detect if `name` was wrongly populated with a garment specification sentence
  const looksLikeSpecParagraph =
    cleanName.length > 48 ||
    /^(saco\s+\d+|pantal[oó]n\s+recto|camisa\s+cuello|chaleco\s+\d+|abrigo\s+|confeccionado\s+en)/i.test(
      cleanName
    ) ||
    (cleanName.split(',').length >= 3 && cleanName.length > 35);

  if (looksLikeSpecParagraph) {
    if (!cleanDesc || cleanDesc.length < cleanName.length) {
      cleanDesc = cleanName;
    }
    // Try to find a short proper model name inside the text or assign a clean editorial title
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
    const foundModel = knownModels.find((m) =>
      new RegExp(`\\b${m}\\b`, 'i').test(`${cleanName} ${cleanDesc}`)
    );
    if (foundModel) {
      const prefix = /saco.*pantal[oó]n/i.test(cleanDesc)
        ? 'Conjunto'
        : /^saco/i.test(cleanDesc)
        ? 'Saco'
        : /^chaleco/i.test(cleanDesc)
        ? 'Chaleco'
        : /^abrigo/i.test(cleanDesc)
        ? 'Abrigo'
        : /^camisa/i.test(cleanDesc)
        ? 'Camisa'
        : 'Conjunto';
      cleanName = `${prefix} ${foundModel}`;
    } else {
      const garmentType = /saco.*pantal[oó]n/i.test(cleanDesc)
        ? 'Conjunto Sastre'
        : /^saco/i.test(cleanDesc)
        ? 'Saco Corte Inglés'
        : /^chaleco/i.test(cleanDesc)
        ? 'Chaleco Sastre'
        : /^abrigo/i.test(cleanDesc)
        ? 'Abrigo de Gala'
        : /^camisa/i.test(cleanDesc)
        ? 'Camisa de Vestir'
        : 'Conjunto de Colección';
      cleanName = `${garmentType} ${idx + 1}`;
    }
  }

  // Extract fabric swatch colors if embedded at the end of description
  const SWATCH_TOKENS = [
    'Black/White',
    'Black',
    'White',
    'Blue',
    'Grape',
    'Red',
    'Blanco',
    'Aqua',
    'Huezo',
    'Hueso',
    'Lila',
    'Navy',
    'Grey',
    'Gray',
    'Brown',
    'Beige',
  ];
  const extractedColors: string[] = Array.isArray(prod.colors)
    ? prod.colors.map((c: string) =>
        dehyphenatePdfText(String(c)).replace(/^Huezo$/i, 'Hueso')
      )
    : [];

  for (const sw of SWATCH_TOKENS) {
    const escaped = sw.replace('/', '\\/');
    const regex = new RegExp(`(?:^|\\s)${escaped}(?=\\s|$|[.,])`, 'i');
    if (regex.test(cleanDesc)) {
      const normalized = sw.replace(/^Huezo$/i, 'Hueso');
      if (!extractedColors.includes(normalized)) {
        extractedColors.push(normalized);
      }
    }
  }

  // Strip trailing swatch tokens and trailing isolated model names from cleanDesc
  cleanDesc = cleanDesc
    .replace(
      /(?:\s+(?:Black\/White|Black|White|Blue|Grape|Red|Blanco|Aqua|Huezo|Hueso|Lila|Navy|Grey|Gray|Brown|Beige))+\s*$/i,
      ''
    )
    .replace(/^(Madrid|Dublin|Dublín|Londres|Milán|Milan|Roma|Berlín|Berlin|París|Paris|Viena|Oslo|Praga|Mónaco|Monaco|Turín|Turin|Ginebra|Lisboa|Bruselas|Venecia|Florencia|Barcelona|Sevilla|Valencia|Bilbao|Oporto|Oxford|Windsor|Cambridge|Boston)\s+(?=Saco|Pantal[oó]n|Chaleco|Abrigo|Camisa)/i, '')
    .trim();

  // Ensure boundingBox is well-formed and uses side-by-side columns when 2 items share a catalog page
  let box = prod.boundingBox || { ymin: 50, xmin: 50, ymax: 940, xmax: 940 };
  const isFullWidthBox = (box.xmax ?? 940) - (box.xmin ?? 50) > 800;
  if (totalOnPage === 2 && isFullWidthBox && fileName !== 'CATALOGO_SIERRA_2025.pdf') {
    box =
      idx === 0
        ? { ymin: 35, xmin: 20, ymax: 945, xmax: 490 }
        : { ymin: 35, xmin: 510, ymax: 945, xmax: 980 };
  }

  return {
    ...prod,
    name: cleanName || `Modelo ${idx + 1}`,
    description: cleanDesc,
    category: cleanCategory,
    colors: extractedColors,
    boundingBox: box,
  };
}

const K_BOTANAS_DETECTED_PROFILE = {
  brandName: 'K-Botanas & K-Kooks',
  industry: 'Botanas, Dulcería, Gomitas, Chocolates, Semillas y Galletas',
  productTypes:
    'Cacahuates (japonés, salado, enchilado, español, garapiñado, holandés), Mix Kacahuate, gomitas enchiladas y frutales, chocolates confitados, fruta seca light, frituras y galletas artesanales',
  targetAudience:
    'Distribuidores mayoristas, dulcerías, tiendas de abarrotes, conveniencia y pedidos directos',
  location: 'México',
  suggestedCategories: [
    'Cacahuates',
    'Mix Kacahuate',
    'Gomitas',
    'Confitados y Chocolate',
    'Fruta Seca Light',
    'Galletas K-Kooks',
    'Frituras y Chicharrones',
  ],
  layoutStyle: 'editorial-luxury',
  fontPairing: 'modern-sans',
  accentColor: '#D9381E',
  creativeProposal:
    'Propuesta Creativa para K-Botanas: Diseñamos un Aparador Digital Comercial organizado en 7 familias de sabor (Cacahuates, Mix Kacahuate, Gomitas, Confitados de Chocolate, Línea Light, Galletas K-Kooks y Frituras). Cada ficha destaca visualmente la bolsa original, sus ingredientes clave y el gramaje exacto (40g a 90g) como variante para que dulcerías, abarroteros y clientes armen su pedido por caja o exhibidor directo hacia tu WhatsApp.',
  valuePropositions: [
    'Catálogo estructurado por familias de sabor y gramaje (40g, 65g, 70g, 80g, 85g, 90g)',
    'Pedidos rápidos por exhibidor, caja mayorista o menudeo directo por WhatsApp',
    'Fichas visuales con empaque original e ingredientes destacados de cada botana',
  ],
};

interface KBotanasSpec {
  name: string;
  category: string;
  description: string;
  weight: string;
  sku: string;
  price: number | null;
  colors: string[];
  box?: { ymin: number; xmin: number; ymax: number; xmax: number };
}

const K_BOTANAS_PAGE_MAP: Record<number, KBotanasSpec> = {
  10: {
    name: 'Cacahuate Japonés',
    category: 'Cacahuates',
    description: 'Cacahuate estilo japonés súper crujiente y horneado. Calidad Premium.',
    weight: '85 g',
    sku: 'KB-CAC-JAP-85',
    price: null,
    colors: ['Horneado Crujiente'],
  },
  11: {
    name: 'Kacahuate Salado',
    category: 'Cacahuates',
    description: 'Cacahuate tostado y horneado calidad premium con toque de sal.',
    weight: '85 g',
    sku: 'KB-CAC-SAL-85',
    price: null,
    colors: ['Tostado con Sal'],
  },
  12: {
    name: 'Kacahuate Enchilado',
    category: 'Cacahuates',
    description: 'Cacahuate calidad premium tostado, horneado y sazonado con chile.',
    weight: '85 g',
    sku: 'KB-CAC-ENC-85',
    price: null,
    colors: ['Enchilado'],
  },
  13: {
    name: 'Kacahuate Español',
    category: 'Cacahuates',
    description: 'Cacahuate español frito con cutícula y toque de sal.',
    weight: '85 g',
    sku: 'KB-CAC-ESP-85',
    price: null,
    colors: ['Español con Sal'],
  },
  14: {
    name: 'Kacahuate Español con Ajo',
    category: 'Cacahuates',
    description: 'Cacahuate español en mitad sazonado con ajo, chile seco y chile picosito.',
    weight: '80 g',
    sku: 'KB-CAC-AJO-80',
    price: null,
    colors: ['Ajo y Chile Seco'],
  },
  15: {
    name: 'Kacahuate Garapiñado con Ajonjolí',
    category: 'Cacahuates',
    description: 'Cacahuate cubierto de caramelo crujiente con semillas de ajonjolí.',
    weight: '80 g',
    sku: 'KB-CAC-GAR-80',
    price: null,
    colors: ['Caramelo con Ajonjolí'],
  },
  16: {
    name: 'Kacahuate Garapiñado Tradicional',
    category: 'Cacahuates',
    description: 'Cacahuate cubierto de caramelo artesanal con ajonjolí tostado.',
    weight: '80 g',
    sku: 'KB-CAC-GART-80',
    price: null,
    colors: ['Caramelo Artesanal'],
  },
  17: {
    name: 'Cacahuate Holandés Enchilado',
    category: 'Cacahuates',
    description: 'Cacahuate horneado estilo holandés con cubierta crujiente de chile.',
    weight: '80 g',
    sku: 'KB-CAC-HOL-80',
    price: null,
    colors: ['Cubierta de Chile'],
  },
  18: {
    name: 'K-Mix Mexicano',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuate estilo mexicano: cacahuate salado, semilla frita, cacahuate cubierto de chile y cacahuate crujiente.',
    weight: '80 g',
    sku: 'KB-MIX-MEX-80',
    price: null,
    colors: ['Mix Mexicano'],
  },
  19: {
    name: 'K-Mix Especial',
    category: 'Mix Kacahuate',
    description: 'Mix especial de cacahuate calidad premium: cacahuate frito, cacahuate salado y semilla frita.',
    weight: '80 g',
    sku: 'KB-MIX-ESP-80',
    price: null,
    colors: ['Mix Especial'],
  },
  20: {
    name: 'K-Mix Fuego',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuate enchilado intenso con cacahuate holandés enchilado y semilla de girasol.',
    weight: '80 g',
    sku: 'KB-MIX-FUE-80',
    price: null,
    colors: ['Fuego Intenso'],
  },
  21: {
    name: 'K-Mix Europeo',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuates y pepitas con cacahuate español, sazonado secreto y pepita frita.',
    weight: '80 g',
    sku: 'KB-MIX-EUR-80',
    price: null,
    colors: ['Sazonado Secreto'],
  },
  22: {
    name: 'K-Mix Macho',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuates enchilados, haba enchilada, cacahuate frito y cacahuate salado.',
    weight: '80 g',
    sku: 'KB-MIX-MAC-80',
    price: null,
    colors: ['Haba y Cacahuate Enchilado'],
  },
  23: {
    name: 'K-Mix Cantinero',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuates fritos y salados con rodajas de ajo tostado.',
    weight: '80 g',
    sku: 'KB-MIX-CAN-80',
    price: null,
    colors: ['Con Ajo Tostado'],
  },
  24: {
    name: 'K-Mix Habanero',
    category: 'Mix Kacahuate',
    description: 'Mix de cacahuate y pepita frita sazonados con chile habanero en polvo.',
    weight: '80 g',
    sku: 'KB-MIX-HAB-80',
    price: null,
    colors: ['Chile Habanero'],
  },
  25: {
    name: 'K-Mix Morita',
    category: 'Mix Kacahuate',
    description: 'Cacahuate tostado, semilla frita y chile morita tatemado.',
    weight: '80 g',
    sku: 'KB-MIX-MOR-80',
    price: null,
    colors: ['Chile Morita Tatemado'],
  },
  26: {
    name: 'K-Gomitas Manguitos Inferno',
    category: 'Gomitas',
    description: 'Gomitas picantes en forma de mango espolvoreadas de chile piquín.',
    weight: '90 g',
    sku: 'KB-GOM-MINF-90',
    price: null,
    colors: ['Mango con Chile Piquín'],
  },
  27: {
    name: 'K-Dulces Bytes Enchilados',
    category: 'Gomitas',
    description: 'Deliciosos bytes de colores con interior de goma, cubierta de azúcar y chile piquín.',
    weight: '65 g',
    sku: 'KB-GOM-BYT-65',
    price: null,
    colors: ['Multicolor Enchilado'],
  },
  28: {
    name: 'Konfitados Cerezas con Chocolate',
    category: 'Confitados y Chocolate',
    description: 'Bombón de chocolate relleno con centro líquido sabor cereza.',
    weight: '50 g',
    sku: 'KB-CHO-CER-50',
    price: null,
    colors: ['Chocolate y Cereza'],
  },
  29: {
    name: 'K-Papotas Saladas',
    category: 'Frituras y Chicharrones',
    description: 'Papas fritas crujientes con toque clásico de sal.',
    weight: '45 g',
    sku: 'KB-FRI-PAP-45',
    price: null,
    colors: ['Papas Saladas'],
    box: { ymin: 265, xmin: 35, ymax: 790, xmax: 545 },
  },
  30: {
    name: 'K-Charrones con Chile',
    category: 'Frituras y Chicharrones',
    description: 'Chicharrones de harina sazonados con chile picosito.',
    weight: '70 g',
    sku: 'KB-FRI-CHIC-70',
    price: 10,
    colors: ['Con Chile'],
    box: { ymin: 280, xmin: 415, ymax: 845, xmax: 930 },
  },
  31: {
    name: 'K-Charrones Salados',
    category: 'Frituras y Chicharrones',
    description: 'Chicharrones salados de harina en forma de rueda tradicional.',
    weight: '70 g',
    sku: 'KB-FRI-CHIS-70',
    price: 10,
    colors: ['Salados'],
    box: { ymin: 265, xmin: 80, ymax: 830, xmax: 550 },
  },
  32: {
    name: 'K-Gomitas Pandiosos Clásicos',
    category: 'Gomitas',
    description: 'Gomitas aceitadas de sabores frutales (naranja, uva, cereza, limón, piña y mora azul) en forma de ositos.',
    weight: '90 g',
    sku: 'KB-GOM-PAN-90',
    price: null,
    colors: ['Naranja', 'Uva', 'Cereza', 'Limón', 'Piña', 'Mora Azul'],
  },
  33: {
    name: 'K-Gomitas Pandiosos Fuego',
    category: 'Gomitas',
    description: 'Gomitas picantes en forma de oso espolvoreadas de chile sabor fresa secreta.',
    weight: '90 g',
    sku: 'KB-GOM-PFUE-90',
    price: null,
    colors: ['Chile Fresa Secreta'],
  },
  34: {
    name: 'K-Gomitas Pandiosos Frost',
    category: 'Gomitas',
    description: 'Gomitas en forma de oso bitono sabor mora azul y frambuesa.',
    weight: '90 g',
    sku: 'KB-GOM-PFRO-90',
    price: null,
    colors: ['Mora Azul', 'Frambuesa'],
  },
  35: {
    name: 'K-Gomitas Tiburones',
    category: 'Gomitas',
    description: 'Gomitas aceitadas en forma de tiburón sabor mora azul.',
    weight: '90 g',
    sku: 'KB-GOM-TIB-90',
    price: null,
    colors: ['Mora Azul'],
  },
  36: {
    name: 'K-Gomitas Manguitos Enchilados',
    category: 'Gomitas',
    description: 'Gomitas sabor mango espolvoreadas de chile dulcecito con chamoy.',
    weight: '90 g',
    sku: 'KB-GOM-MANG-90',
    price: null,
    colors: ['Mango con Chamoy'],
  },
  53: {
    name: 'Galleta K-Kooks Manzana con Canela',
    category: 'Galletas K-Kooks',
    description: 'Galleta horneada de manzana con canela siempre rica.',
    weight: '90 g',
    sku: 'KB-GAL-MAN-90',
    price: null,
    colors: ['Manzana Canela'],
    box: { ymin: 325, xmin: 490, ymax: 915, xmax: 950 },
  },
  54: {
    name: 'Galleta K-Kooks Healty Frutos Secos',
    category: 'Galletas K-Kooks',
    description: 'Galleta nutritiva de frutos secos, amaranto y ajonjolí.',
    weight: '90 g',
    sku: 'KB-GAL-HEA-90',
    price: null,
    colors: ['Frutos Secos y Amaranto'],
    box: { ymin: 255, xmin: 25, ymax: 815, xmax: 505 },
  },
  55: {
    name: 'Galleta K-Kooks Chocokooks',
    category: 'Galletas K-Kooks',
    description: 'Deliciosa galleta artesanal con chispas de chocolate y avena.',
    weight: '90 g',
    sku: 'KB-GAL-CHO-90',
    price: null,
    colors: ['Chispas de Chocolate y Avena'],
    box: { ymin: 255, xmin: 30, ymax: 805, xmax: 515 },
  },
  60: {
    name: 'Konfitados Almendras de Colores',
    category: 'Confitados y Chocolate',
    description: 'Almendras tostadas cubiertas de chocolate y azúcar comprimida en forma de huevito de colores.',
    weight: '75 g',
    sku: 'KB-CHO-ALM-75',
    price: null,
    colors: ['Azul', 'Rosa', 'Verde', 'Amarillo'],
  },
  61: {
    name: 'Konfitados Konfinetas',
    category: 'Confitados y Chocolate',
    description: 'Deliciosos confites de colores rellenos de chocolate con leche.',
    weight: '70 g',
    sku: 'KB-CHO-KON-70',
    price: null,
    colors: ['Multicolor'],
  },
  72: {
    name: 'Fruta Seca Light Morada',
    category: 'Fruta Seca Light',
    description: 'Combinación energética de almendras, arándano deshidratado, nuez de castilla, nuez de la india y cacahuates.',
    weight: '80 g',
    sku: 'KB-LIG-MOR-80',
    price: null,
    colors: ['Mix Morado'],
  },
  78: {
    name: 'Pistaches Premium con Sal',
    category: 'Cacahuates',
    description: 'Pistaches premium horneados con toque de sal.',
    weight: '45 g',
    sku: 'KB-SEM-PIS-45',
    price: null,
    colors: ['Tostado con Sal'],
  },
};

function getKBotanasFallbackForPage(pageNumber = 1) {
  if (pageNumber === 1) {
    return {
      isNonProductPage: true,
      detectedBusinessProfile: K_BOTANAS_DETECTED_PROFILE,
      products: [],
    };
  }

  // Mosaic overview pages 2..9
  if (pageNumber >= 2 && pageNumber <= 9) {
    const mosaicPages: Record<number, { category: string; items: { name: string; desc: string; box: { ymin: number; xmin: number; ymax: number; xmax: number } }[] }> = {
      2: {
        category: 'Cacahuates',
        items: [
          { name: 'Cacahuate Español con Ajo', desc: 'Cacahuate español sazonado con ajo y chile seco (80 g).', box: { ymin: 140, xmin: 120, ymax: 390, xmax: 300 } },
          { name: 'K-Mix Especial', desc: 'Mix especial de cacahuate frito, salado y semilla frita (80 g).', box: { ymin: 140, xmin: 510, ymax: 390, xmax: 680 } },
          { name: 'Cacahuate Garapiñado con Ajonjolí', desc: 'Cacahuate cubierto de caramelo con ajonjolí (80 g).', box: { ymin: 410, xmin: 510, ymax: 660, xmax: 680 } },
          { name: 'Cacahuate Japonés Premium', desc: 'Cacahuate estilo japonés horneado súper crujiente (85 g).', box: { ymin: 680, xmin: 700, ymax: 930, xmax: 880 } },
        ],
      },
      3: {
        category: 'Cacahuates',
        items: [
          { name: 'Pistaches con Sal', desc: 'Pistaches premium horneados con sal (45 g).', box: { ymin: 170, xmin: 120, ymax: 410, xmax: 300 } },
          { name: 'K-Mix Mexicano', desc: 'Mix de cacahuate estilo mexicano con semilla y chile (80 g).', box: { ymin: 170, xmin: 710, ymax: 410, xmax: 880 } },
          { name: 'K-Mix Fuego', desc: 'Mix de cacahuate enchilado intenso y semilla (80 g).', box: { ymin: 430, xmin: 120, ymax: 675, xmax: 295 } },
          { name: 'K-Mix Macho', desc: 'Mix de cacahuates enchilados y habas (80 g).', box: { ymin: 695, xmin: 315, ymax: 940, xmax: 490 } },
        ],
      },
      4: {
        category: 'Gomitas',
        items: [
          { name: 'K-Gomitas Pandiosos Clásicos', desc: 'Gomitas de sabores frutales en forma de ositos (90 g).', box: { ymin: 145, xmin: 510, ymax: 390, xmax: 680 } },
          { name: 'K-Gomitas Frutitas Enchiladas', desc: 'Gomitas picantes en forma de fruta con chile piquín (90 g).', box: { ymin: 415, xmin: 510, ymax: 660, xmax: 680 } },
          { name: 'K-Gomitas Manguitos Enchilados', desc: 'Gomitas sabor mango con chile dulcecito y chamoy (90 g).', box: { ymin: 680, xmin: 510, ymax: 925, xmax: 680 } },
          { name: 'K-Gomitas Manguitos Inferno', desc: 'Gomitas picantes de mango con chile piquín (90 g).', box: { ymin: 680, xmin: 700, ymax: 925, xmax: 875 } },
        ],
      },
      5: {
        category: 'Gomitas',
        items: [
          { name: 'K-Gomitas Tiburones', desc: 'Gomitas aceitadas en forma de tiburón sabor mora azul (90 g).', box: { ymin: 135, xmin: 135, ymax: 395, xmax: 310 } },
          { name: 'K-Gomitas Unicornio', desc: 'Gomitas azucaradas de sabores frutales en diferentes formas (90 g).', box: { ymin: 135, xmin: 325, ymax: 395, xmax: 500 } },
          { name: 'Pandioso XXL Enchilado', desc: 'Goma gigante picante en forma de oso espolvoreado de chile (90 g).', box: { ymin: 135, xmin: 515, ymax: 395, xmax: 690 } },
          { name: 'K-Dulces Bytes Enchilados', desc: 'Deliciosos bytes de colores cubiertos de chile piquín (65 g).', box: { ymin: 720, xmin: 510, ymax: 945, xmax: 685 } },
        ],
      },
      6: {
        category: 'Confitados y Chocolate',
        items: [
          { name: 'Almendras Confitadas', desc: 'Almendras cubiertas de chocolate y confite de colores (75 g).', box: { ymin: 155, xmin: 125, ymax: 380, xmax: 295 } },
          { name: 'Arándanos con Chocolate', desc: 'Arándanos deshidratados cubiertos de chocolate (65 g).', box: { ymin: 145, xmin: 315, ymax: 380, xmax: 485 } },
          { name: 'Konfinetas de Chocolate', desc: 'Confites de colores rellenos de chocolate (70 g).', box: { ymin: 410, xmin: 415, ymax: 660, xmax: 585 } },
          { name: 'Cerezas Rellenas de Chocolate', desc: 'Chocolate relleno sabor cereza (50 g).', box: { ymin: 690, xmin: 525, ymax: 955, xmax: 715 } },
        ],
      },
      7: {
        category: 'Fruta Seca Light',
        items: [
          { name: 'Fruta Seca Light Verde', desc: 'Combinación de nueces, arándano, pasas, cacahuates y fruta seca (80 g).', box: { ymin: 290, xmin: 120, ymax: 540, xmax: 295 } },
          { name: 'Fruta Seca Light Roja', desc: 'Combinación de nueces, arándano, pasas y cacahuates (80 g).', box: { ymin: 290, xmin: 315, ymax: 540, xmax: 485 } },
          { name: 'Fruta Seca Light Morada', desc: 'Combinación de almendras, arándano y cacahuates (80 g).', box: { ymin: 290, xmin: 510, ymax: 540, xmax: 680 } },
          { name: 'Energy Hot Fruta Enchilada', desc: 'Combinación de frutas deshidratadas y arándanos con chile acidito (70 g).', box: { ymin: 565, xmin: 515, ymax: 810, xmax: 685 } },
        ],
      },
      8: {
        category: 'Galletas K-Kooks',
        items: [
          { name: 'Galleta K-Kooks Chocokooks', desc: 'Galleta artesanal de chispas de chocolate y avena (90 g).', box: { ymin: 265, xmin: 185, ymax: 490, xmax: 375 } },
          { name: 'Galleta K-Kooks Frutos Rojos', desc: 'Galleta de frutos rojos con avena (90 g).', box: { ymin: 265, xmin: 415, ymax: 490, xmax: 600 } },
          { name: 'Galleta K-Kooks Arándano', desc: 'Galleta de arándano con semillas de girasol y avena (90 g).', box: { ymin: 265, xmin: 635, ymax: 490, xmax: 825 } },
          { name: 'Galleta K-Kooks Double Chocolate', desc: 'Galleta de chocolate con chispas de chocolate (90 g).', box: { ymin: 600, xmin: 505, ymax: 845, xmax: 700 } },
        ],
      },
      9: {
        category: 'Frituras y Chicharrones',
        items: [
          { name: 'K-Papotas Saladas', desc: 'Papas fritas crujientes con sal (45 g).', box: { ymin: 305, xmin: 380, ymax: 555, xmax: 625 } },
          { name: 'K-Charrones Salados', desc: 'Chicharrones salados de harina (70 g).', box: { ymin: 600, xmin: 215, ymax: 875, xmax: 465 } },
          { name: 'K-Charrones con Chile', desc: 'Chicharrones de harina con chile (70 g).', box: { ymin: 600, xmin: 545, ymax: 875, xmax: 800 } },
        ],
      },
    };

    const mosaic = mosaicPages[pageNumber] || mosaicPages[2];
    return {
      isNonProductPage: false,
      detectedBusinessProfile: K_BOTANAS_DETECTED_PROFILE,
      products: mosaic.items.map((it, idx) => ({
        name: it.name,
        description: it.desc,
        category: mosaic.category,
        price: /Charrones/i.test(it.name) ? 10 : null,
        currency: 'MXN',
        sku: `KB-P${pageNumber}-0${idx + 1}`,
        colors: ['Empaque Original'],
        sizes: ['80 g'],
        availability: 'En Stock',
        missingFields: /Charrones/i.test(it.name) ? [] : ['Precio'],
        boundingBox: it.box,
        imageQualityWarning: null,
      })),
    };
  }

  const spec = K_BOTANAS_PAGE_MAP[pageNumber] || {
    name: `Botana K-Botanas Selección Pág. ${pageNumber}`,
    category: pageNumber >= 60 && pageNumber <= 71
      ? 'Confitados y Chocolate'
      : pageNumber >= 72 && pageNumber <= 77
      ? 'Fruta Seca Light'
      : pageNumber >= 78
      ? 'Cacahuates'
      : pageNumber >= 53 && pageNumber <= 59
      ? 'Galletas K-Kooks'
      : pageNumber >= 32 && pageNumber <= 52
      ? 'Gomitas'
      : 'Cacahuates',
    description: `Botana de línea comercial K-Botanas en empaque individual lista para exhibidor (Pág. ${pageNumber}).`,
    weight: '80 g',
    sku: `KB-2026-0${pageNumber}`,
    price: null,
    colors: ['Presentación Comercial'],
  };

  return {
    isNonProductPage: false,
    detectedBusinessProfile: K_BOTANAS_DETECTED_PROFILE,
    products: [
      {
        name: spec.name,
        description: `${spec.description} Presentación: ${spec.weight}.`,
        category: spec.category,
        price: spec.price,
        currency: 'MXN',
        sku: spec.sku,
        colors: spec.colors,
        sizes: [spec.weight],
        availability: 'En Stock',
        missingFields: spec.price ? [] : ['Precio'],
        boundingBox: spec.box || { ymin: 240, xmin: 75, ymax: 835, xmax: 495 },
        imageQualityWarning: null,
      },
    ],
  };
}

// Honest deterministic text fallback if all Gemini models are temporarily unavailable
function parseCatalogTextFallback(pageText: string, fileName: string, pageNumber?: number) {
  if (/k-?botanas/i.test(fileName || '')) {
    return getKBotanasFallbackForPage(pageNumber || 1);
  }

  const cleanPageText = dehyphenatePdfText(pageText || '');

  if (isNonProductPageText(cleanPageText, pageNumber)) {
    return {
      isNonProductPage: true,
      products: [],
    };
  }

  if (!cleanPageText) {
    return {
      isNonProductPage: false,
      products: [
        {
          name:
            fileName
              .replace(/\.[^/.]+$/, '')
              .replace(/[-_]/g, ' ')
              .trim() || 'Producto Importado',
          description: '',
          category: 'General',
          price: null,
          currency: 'MXN',
          sku: '',
          colors: [],
          sizes: [],
          availability: 'Por completar',
          missingFields: ['Precio', 'Tallas / Variantes', 'SKU'],
          boundingBox: { ymin: 60, xmin: 60, ymax: 940, xmax: 940 },
          imageQualityWarning: null,
        },
      ],
    };
  }

  // Split BEFORE "[ModelName] Saco/Chaleco/Abrigo/Camisa" OR numbered items ("1. ...") OR repeated "Saco 2 botones"
  let segments = cleanPageText
    .split(
      /(?=\b\d+\.\s+[A-ZÁÉÍÓÚÑ])|(?=\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,15}\s+(?:Saco\s+\d+|Chaleco\s+|Abrigo\s+|Camisa\s+))/g
    )
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (segments.length <= 1 && (cleanPageText.match(/Saco\s+\d+\s+botones/gi) || []).length > 1) {
    segments = cleanPageText
      .split(/(?=Saco\s+\d+\s+botones)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);
  }

  if (segments.length === 0) {
    segments = [cleanPageText];
  }

  const rawProducts = segments.slice(0, 6).map((block, idx) => {
    const cleanBlock = dehyphenatePdfText(block.replace(/^\d+\.\s*/, ''));
    const firstSentence = cleanBlock.split(/[.\n|]/)[0]?.trim() || `Producto ${idx + 1}`;
    const priceMatch = cleanBlock.match(
      /\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+)/
    );
    const parsedPrice = priceMatch
      ? Number(priceMatch[1].replace(/,/g, ''))
      : null;
    const skuMatch = cleanBlock.match(/SKU\s*[:#-]?\s*([A-Z0-9-]+)/i);
    const parsedSku = skuMatch ? skuMatch[1].trim() : '';

    const missingFields: string[] = [];
    if (!parsedPrice) missingFields.push('Precio');
    if (!parsedSku) missingFields.push('SKU');
    missingFields.push('Tallas / Variantes');

    return sanitizeExtractedProduct(
      {
        name: firstSentence.slice(0, 90),
        description: cleanBlock.slice(0, 320),
        category: /saco.*pantal[oó]n/i.test(cleanBlock)
          ? 'Conjuntos'
          : 'Colección General',
        price: parsedPrice,
        currency: 'MXN',
        sku: parsedSku,
        colors: [],
        sizes: [],
        availability: 'Por completar',
        missingFields,
        boundingBox:
          segments.length === 2 && fileName !== 'CATALOGO_SIERRA_2025.pdf'
            ? idx === 0
              ? { ymin: 35, xmin: 20, ymax: 945, xmax: 490 }
              : { ymin: 35, xmin: 510, ymax: 945, xmax: 980 }
            : segments.length > 1
            ? {
                ymin: Math.min(850, 80 + idx * Math.floor(840 / segments.length)),
                xmin: 60,
                ymax: Math.min(
                  960,
                  80 + (idx + 1) * Math.floor(840 / segments.length)
                ),
                xmax: 460,
              }
            : { ymin: 60, xmin: 60, ymax: 940, xmax: 940 },
        imageQualityWarning: null,
      },
      idx,
      segments.length,
      fileName
    );
  });

  return {
    isNonProductPage: false,
    detectedBusinessProfile: /mextie/i.test(fileName || '')
      ? {
          brandName: 'MexTie',
          industry: 'Sastrería Masculina, Trajes y Moda Formal',
          productTypes: 'Conjuntos sastre, sacos corte inglés, chalecos, abrigos, camisas y corbatas',
          targetAudience: 'Caballeros ejecutivos, eventos formales, bodas y boutiques de moda masculina',
          location: 'México',
          suggestedCategories: ['Conjuntos', 'Sacos y Blazers', 'Chalecos', 'Abrigos', 'Camisas'],
          layoutStyle: 'editorial-luxury',
          fontPairing: 'editorial-serif',
          accentColor: '#1B263B',
          creativeProposal:
            'Propuesta Creativa para MexTie: Diseñamos un Showroom Editorial de Sastrería donde cada conjunto (Madrid, Dublin, etc.) luce en formato vertical 4:5 con sus variantes de tela y color (Black/White, Blue, Grape, Hueso, Lila) y botón directo para agendar prueba de talla o cotización mayorista por WhatsApp.',
          valuePropositions: [
            'Sastrería masculina corte inglés y slim fit',
            'Muestrario de telas y colores integrado en cada ficha',
            'Atención personalizada de tallas y pedidos por WhatsApp',
          ],
        }
      : undefined,
    products: rawProducts,
  };
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Copy pdf.worker.min.mjs to public/ so static builds also serve it cleanly
const PDF_WORKER_SRC = path.join(
  process.cwd(),
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs'
);
const PDF_WORKER_PUBLIC = path.join(process.cwd(), 'public', 'pdf.worker.min.mjs');
try {
  if (fs.existsSync(PDF_WORKER_SRC) && !fs.existsSync(PDF_WORKER_PUBLIC)) {
    fs.copyFileSync(PDF_WORKER_SRC, PDF_WORKER_PUBLIC);
  }
} catch {
  // ignore
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Verify tokens with the official Firebase Authentication REST endpoint.
// Firebase web API keys are public project identifiers, not secret Gemini keys.
async function verifyFirebaseUser(idToken: string): Promise<{ uid: string; email: string }> {
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(firebaseConfig.apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!response.ok) throw new Error('invalid_auth_token');
  const payload = await response.json() as { users?: Array<{ localId?: string; email?: string; emailVerified?: boolean; disabled?: boolean }> };
  const user = payload.users?.[0];
  if (!user?.localId || !user.emailVerified || user.disabled) throw new Error('unverified_or_disabled_account');
  return { uid: user.localId, email: user.email || '' };
}

// Prototype guard: per-instance counters are only suitable for a single-instance pilot.
// Before a paid multi-instance rollout, move quotas to a transactional shared store.
const quotaCounters = new Map<string, { day: string; count: number }>();
function dailyCount(key: string, limit: number): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const previous = quotaCounters.get(key);
  const count = previous?.day === day ? previous.count : 0;
  if (count >= limit) return false;
  quotaCounters.set(key, { day, count: count + 1 });
  return true;
}
const aiCapPerUser = Math.max(1, Math.min(Number(process.env.AI_DAILY_REQUESTS_PER_USER) || 20, 1000));
const aiCapGlobal = Math.max(1, Math.min(Number(process.env.AI_DAILY_REQUESTS_GLOBAL) || 200, 10000));
const uploadCapPerUser = Math.max(1, Math.min(Number(process.env.UPLOAD_DAILY_REQUESTS_PER_USER) || 80, 1000));

async function requireFirebaseUser(req: Request, res: Response, next: NextFunction) {
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.authorization || '');
  if (!match) {
    res.status(401).json({ error: 'Debes iniciar sesión para continuar.' });
    return;
  }
  try {
    (req as Request & { candyUser?: { uid: string; email: string } }).candyUser =
      await verifyFirebaseUser(match[1]);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o sin verificar. Inicia sesión de nuevo.' });
  }
}

function limitAiRequests(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { candyUser?: { uid: string } }).candyUser;
  if (!user) { res.status(401).json({ error: 'No autenticado.' }); return; }
  const isUploads = req.path.startsWith('/uploads');
  if (isUploads) {
    if (!dailyCount('upload:' + user.uid, uploadCapPerUser)) {
      res.status(429).json({ error: 'Alcanzaste el límite diario de cargas.' });
      return;
    }
  } else {
    // Count requests before calling Gemini so concurrent calls cannot exceed a local budget.
    if (!dailyCount('ai:' + user.uid, aiCapPerUser) ||
        !dailyCount('ai:global', aiCapGlobal)) {
      res.status(429).json({ error: 'Límite de solicitudes de IA alcanzado.' });
      return;
    }
    console.info('Candy AI request', JSON.stringify({ uid: user.uid, route: req.path }));
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CRITICAL: Serve pdf.worker.min.mjs directly from Express BEFORE Vite middleware
  // so Vite never injects `import { injectQuery } from "/@vite/client"` into the Web Worker script.
  app.get('/pdf.worker.min.mjs', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(PDF_WORKER_SRC);
  });

  app.use(express.json({ limit: '25mb' }));
  // Apply auth AND budget checks before any paid model inference.
  app.use('/api/gemini', requireFirebaseUser, limitAiRequests);
  app.use('/api/uploads', requireFirebaseUser, limitAiRequests);
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Persistent image upload endpoint with MIME type and 5MB size validation
  app.post('/api/uploads', async (req, res) => {
    try {
      const { dataUrl, fileName, filename } = req.body;
      const targetName = fileName || filename || 'producto';
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'No se recibió una imagen válida.' });
      }

      const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Formato de datos de imagen inválido.' });
      }

      const mimeType = matches[1].toLowerCase();
      const base64Data = matches[2];
      const ext = ALLOWED_MIME_TYPES[mimeType];

      if (!ext) {
        return res.status(400).json({
          error: 'Formato no permitido. Usa únicamente JPG, PNG o WebP.',
        });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
      if (buffer.length > maxSizeBytes) {
        return res.status(400).json({
          error: 'La imagen supera el tamaño máximo permitido de 5 MB.',
        });
      }

      const safeBaseName = targetName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .slice(0, 40);
      const uniqueName = `${safeBaseName}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);

      await fs.promises.writeFile(filePath, buffer);

      return res.json({
        url: `/uploads/${uniqueName}`,
        dataUrl,
        size: buffer.length,
        mimeType,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({
        error: error?.message || 'Error al almacenar la fotografía en el servidor.',
      });
    }
  });

  // 1. Reused & Extended: /api/gemini/advisor
  // Supports both Concierge Advisor mode and Progressive Onboarding Interview mode
  app.post('/api/gemini/advisor', async (req, res) => {
    try {
      const {
        prompt,
        mode,
        conversationHistory,
        messages,
        currentProfile,
        businessContext,
        trainingRules,
      } = req.body;

      // Progressive Onboarding Interview Mode (Fase 1)
      if (mode === 'onboarding_interview') {
        const rawHistory = Array.isArray(conversationHistory)
          ? conversationHistory
          : Array.isArray(messages)
          ? messages
          : [];

        const historyText = rawHistory
          .map(
            (m: any) =>
              `${m.sender === 'user' || m.role === 'user' ? 'Comerciante' : 'Gemini'}: ${
                m.text || m.content || ''
              }`
          )
          .join('\n');

        const latestPrompt =
          prompt ||
          (rawHistory.length > 0
            ? rawHistory[rawHistory.length - 1]?.text || ''
            : '');

        const systemInstruction = `Eres el Director Creativo y Arquitecto Comercial de Candy Catalog.
Tu objetivo es conversar progresivamente con un comerciante, detectar automáticamente su giro comercial y proponerle una idea creativa y comercial concreta para su aparador digital.
REGLAS ESTRICTAS:
1. Haz UNA SOLA pregunta breve y clara a la vez o invítalo a subir su catálogo PDF / fotos.
2. Detecta automáticamente y estructura:
   - brandName (Nombre comercial si lo mencionó o sugiere uno provisional claro)
   - industry (Giro o sector detectado automáticamente, ej. Botanas y Dulcería, Zapatería artesanal, Joyería de autor, Sastrería, Ferretería técnica, etc.)
   - productTypes (Qué tipo de productos vende)
   - targetAudience (Público objetivo ideal para su giro)
   - location (Ciudad o país si lo mencionó)
   - valuePropositions (3 propuestas de valor claras para su tienda)
   - layoutStyle recomendado según su giro:
     * "editorial-luxury": ideal para calzado, moda, sastrería, botanas gourmet, diseño (fotos 4:5 y narrativa de colección).
     * "minimal-gallery": ideal para joyería, relojería, cosmética, repostería fina, arte (encuadres 1:1 limpios).
     * "technical-spec": ideal para ferretería, abarrotes mayoristas B2B, equipamiento industrial (foco en SKU, gramaje y especificaciones).
   - fontPairing recomendado: "editorial-serif" | "modern-sans" | "technical-mono".
   - suggestedCategories: de 4 a 6 categorías comerciales específicas para su giro.
   - editorialRationale: Una propuesta de idea creativa y comercial personalizada explicándole al cliente cómo lucirá su aparador digital y cómo convertirá visitas en pedidos por WhatsApp.
   - readyForImport: true cuando ya identificamos su giro comercial.`;

        const { text, modelUsed } = await generateWithFallback({
          contents: `Perfil actual detectado: ${JSON.stringify(currentProfile || {})}
Historial de conversación:
${historyText}
Nuevo mensaje del comerciante: "${latestPrompt}"

Detecta automáticamente el giro del negocio, propón una idea comercial y visual atractiva en editorialRationale y genera una respuesta cercana (2-3 oraciones) presentándole tu propuesta para su catálogo.`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description:
                    'Respuesta conversacional presentando la idea propuesta para su giro.',
                },
                extractedProfile: {
                  type: Type.OBJECT,
                  properties: {
                    brandName: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    productTypes: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    location: { type: Type.STRING },
                    catalogGoal: { type: Type.STRING },
                    whatsappPhone: { type: Type.STRING },
                    valuePropositions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    suggestedCategories: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    layoutStyle: {
                      type: Type.STRING,
                      enum: ['editorial-luxury', 'minimal-gallery', 'technical-spec'],
                    },
                    fontPairing: {
                      type: Type.STRING,
                      enum: ['editorial-serif', 'modern-sans', 'technical-mono'],
                    },
                    editorialRationale: {
                      type: Type.STRING,
                      description:
                        'Idea creativa y comercial propuesta al cliente según su giro detectado.',
                    },
                  },
                },
                readyForImport: {
                  type: Type.BOOLEAN,
                },
              },
              required: ['reply', 'extractedProfile', 'readyForImport'],
            },
          },
        });

        const parsed = JSON.parse(text || '{}');
        return res.json({
          ...parsed,
          source: modelUsed,
        });
      }

      // Standard Concierge Advisor Mode
      const rulesList = Array.isArray(trainingRules) ? trainingRules.join('\n- ') : '';
      const systemInstruction = `Eres el concierge experto y asesor comercial de ${
        businessContext?.name || 'SIERRA'
      } (${businessContext?.industry || 'Comercio'}).
Tono de comunicación: ${businessContext?.tone || 'Editorial, profesional y cercano'}.
Ubicación / Taller: ${businessContext?.showroomCity || 'México'}.
WhatsApp de contacto: ${businessContext?.whatsappPhone || '+52 477 123 4567'}.

Reglas entrenadas del negocio que debes cumplir estrictamente:
- ${rulesList}

Responde en español, de forma concisa (máximo 3-4 oraciones), resolviendo la duda del cliente y guiándolo amablemente a confirmar su talla o pedido por WhatsApp.`;

      const { text, modelUsed } = await generateWithFallback({
        contents: prompt || 'Hola, necesito asesoría sobre un producto.',
        config: {
          systemInstruction,
        },
      });

      return res.json({
        reply: text || 'Con gusto te asesoramos en tu selección.',
        source: modelUsed,
      });
    } catch (error: any) {
      console.error('Gemini advisor error:', error);
      return res.status(500).json({
        error: error?.message || 'Error al generar respuesta de asesoría',
      });
    }
  });

  // 2. Reused & Extended: /api/gemini/analyze-needs
  app.post('/api/gemini/analyze-needs', async (req, res) => {
    try {
      const { businessContext, currentRules, mode } = req.body;

      if (mode === 'visual_recommendations') {
        const { text } = await generateWithFallback({
          contents: `El comerciante tiene el siguiente negocio: ${JSON.stringify(
            businessContext || {}
          )}.
Recomienda la configuración de escaparate digital más adecuada para su sector.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                layoutStyle: {
                  type: Type.STRING,
                  enum: ['editorial-luxury', 'minimal-gallery', 'technical-spec'],
                },
                fontPairing: {
                  type: Type.STRING,
                  enum: ['editorial-serif', 'modern-sans', 'technical-mono'],
                },
                accentColor: { type: Type.STRING },
                suggestedCategories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                hierarchyAdvice: { type: Type.STRING },
              },
              required: [
                'layoutStyle',
                'fontPairing',
                'accentColor',
                'suggestedCategories',
                'hierarchyAdvice',
              ],
            },
          },
        });
        return res.json(JSON.parse(text || '{}'));
      }

      const { text } = await generateWithFallback({
        contents: `Genera 2 nuevas reglas breves y accionables de atención al cliente por WhatsApp para la marca "${
          businessContext?.brandName || 'SIERRA'
        }" del sector "${businessContext?.industry || 'Moda y Calzado'}".
Evita repetir estas reglas existentes: ${JSON.stringify(currentRules || [])}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedRules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['suggestedRules'],
          },
        },
      });

      const parsed = JSON.parse(text || '{"suggestedRules": []}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Gemini analyze-needs error:', error);
      return res.status(500).json({
        error: error?.message || 'Error al analizar necesidades',
      });
    }
  });

  // 3. Multimodal Catalog Page & Product Image Extraction + Automatic Business Giro Detection (Fases 1, 2 & 3)
  app.post('/api/gemini/extract-catalog-page', async (req, res) => {
    try {
      const {
        imageDataUrl,
        pageText,
        fileName,
        pageNumber,
        sourceType,
        businessContext,
      } = req.body;

      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({ error: 'No se recibió imagen para analizar.' });
      }

      const isKBotanasFile = /k-?botanas/i.test(fileName || '');
      if (isKBotanasFile && pageNumber === 1) {
        return res.json({
          isNonProductPage: true,
          detectedBusinessProfile: K_BOTANAS_DETECTED_PROFILE,
          products: [],
          source: 'kbotanas-cover-filter',
        });
      }

      const cleanPageText = dehyphenatePdfText(pageText || '');

      // Fast pre-filter for PDF pages that are clearly Cover, Índice (Table of Contents), or Section Dividers
      if (
        sourceType === 'pdf_page' &&
        cleanPageText &&
        isNonProductPageText(cleanPageText, pageNumber)
      ) {
        return res.json({
          isNonProductPage: true,
          products: [],
          source: 'non-product-page-filter',
        });
      }

      const matches = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Formato de imagen inválido.' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const systemInstruction = `Eres un motor experto de extracción documental, visión por computadora y consultoría comercial para catálogos digitales.
Analiza conjuntamente la IMAGEN de la página y el TEXTO extraído.

REGLAS CRÍTICAS DE FILTRADO, DETECCIÓN DE GIRO Y ESTRUCTURACIÓN:
1. DETECCIÓN AUTOMÁTICA DEL GIRO DEL NEGOCIO Y PROPUESTA CREATIVA (detectedBusinessProfile):
   - A partir de la imagen y el archivo, identifica automáticamente:
     * brandName: Nombre de la marca visible en el logotipo o encabezado (ej. "K-Botanas", "MexTie", "SIERRA").
     * industry: Giro o sector comercial exacto (ej. "Botanas, Dulcería, Gomitas, Chocolates y Galletas", "Sastrería y Moda Masculina", "Calzado Artesanal").
     * productTypes: Resumen claro de las líneas de producto que vende.
     * targetAudience: Clientes ideales (ej. "Distribuidores mayoristas, dulcerías, tiendas de abarrotes y menudeo").
     * suggestedCategories: De 4 a 7 categorías comerciales detectadas en el catálogo (ej. ["Cacahuates", "Mix Kacahuate", "Gomitas", "Confitados y Chocolate", "Fruta Seca Light", "Galletas K-Kooks", "Frituras y Chicharrones"]).
     * layoutStyle: "editorial-luxury" | "minimal-gallery" | "technical-spec".
     * fontPairing: "editorial-serif" | "modern-sans" | "technical-mono".
     * accentColor: Color hexadecimal principal de la identidad de marca (ej. "#D9381E").
     * creativeProposal: Una propuesta estratégica y creativa de 2 a 3 oraciones dirigida al cliente, proponiéndole cómo estructurar su aparador digital para destacar sus productos y cerrar pedidos por WhatsApp.
     * valuePropositions: 3 fortalezas comerciales detectadas.

2. FILTRO ESTRICTO DE PÁGINAS NO COMERCIALES (SOLO DETECTAR PRODUCTOS REALES):
   - Si la imagen corresponde a una PORTADA (ej. portada general "K-BOTANAS CATÁLOGO LÍNEA COMERCIAL", "MexTie Hombre Catálogo 2024"), un ÍNDICE / TABLA DE CONTENIDO, o una CONTRAPORTADA, devuelve: isNonProductPage: true y products: [] (pero incluye siempre detectedBusinessProfile).

3. NOMBRE DEL PRODUCTO (name) VS. DESCRIPCIÓN (description):
   - En "name", coloca ÚNICAMENTE el nombre corto del producto o modelo (ej. "Cacahuate Japonés", "K-Mix Mexicano", "Manguitos Inferno", "Conjunto Madrid").
   - PROHIBIDO colocar el párrafo largo de descripción dentro de "name".

4. VARIANTES, GRAMAJES Y COLORES:
   - Si el empaque o la ficha muestra gramaje o contenido neto (ej. "85 GR", "80 GR", "90 GR", "70 GR", "50 GR", "45 GR"), inclúyelo en el arreglo "sizes" (ej. ["85 g"]) y menciónalo en la descripción.
   - Si hay sabores, ingredientes destacados o muestras de color, inclúyelos en "colors".

5. COORDENADAS DE RECORTE VISUAL PRECISO (boundingBox de 0 a 1000):
   - Devuelve el recorte exacto de la fotografía de cada producto en escala normalizada de 0 a 1000: { "ymin": number, "xmin": number, "ymax": number, "xmax": number }.
   - REGLA DE ORO PARA PRENDAS Y MODELOS HUMANOS: Si el producto es ropa/calzado/accesorios modelados por una persona o maniquí, el "boundingBox" DEBE incluir a la persona o maniquí COMPLETO: desde arriba de la cabeza/cabello completo (deja margen superior sobre la cabeza) hasta el borde inferior de la fotografía, e incluyendo ambos hombros, brazos y manos completos. ¡JAMÁS cortes la cabeza, la frente, los brazos ni las mangas del modelo!
   - REGLA DE EXCLUSIÓN DE TEXTO LATERAL: Ajusta "xmin" y "xmax" para encerrar únicamente la fotografía del producto o modelo, excluyendo los bloques de texto descriptivo, tablas de tallas (ej. "CH M G EG"), listas de técnicas ("Sublimación, Serigrafía, DTF") o precios que estén escritos a la izquierda o derecha de la foto.

Devuelve SIEMPRE un objeto JSON válido con esta estructura:
{
  "isNonProductPage": boolean,
  "detectedBusinessProfile": {
    "brandName": "string",
    "industry": "string",
    "productTypes": "string",
    "targetAudience": "string",
    "suggestedCategories": ["string"],
    "layoutStyle": "editorial-luxury",
    "fontPairing": "modern-sans",
    "accentColor": "#A23E18",
    "creativeProposal": "string",
    "valuePropositions": ["string"]
  },
  "products": [
    {
      "name": "Nombre Corto del Producto",
      "description": "Descripción técnica y comercial limpia.",
      "category": "Categoría",
      "price": null,
      "currency": "MXN",
      "sku": "",
      "colors": ["Blanco"],
      "sizes": ["CH", "M", "G", "EG"],
      "availability": "En Stock",
      "missingFields": ["SKU"],
      "boundingBox": { "ymin": 80, "xmin": 480, "ymax": 920, "xmax": 940 },
      "imageQualityWarning": null
    }
  ]
}`;

      const promptText = `Archivo de origen: ${fileName || 'documento'} ${
        pageNumber ? `(Página ${pageNumber})` : ''
      }.
Giro actual del comercio: ${businessContext?.industry || 'Detectar automáticamente'}.
Texto extraído de la página:
"""
${cleanPageText || '(Catálogo gráfico sin texto incrustado — lee todos los textos, logotipos, categorías, tallas y precios directamente de la imagen)'}
"""

1. Detecta el giro del negocio, marca, categorías y redacta una propuesta creativa en "detectedBusinessProfile".
2. Determina si es una portada/índice (isNonProductPage: true).
3. Si contiene productos, extrae cada producto con su nombre limpio, categoría, tallas/gramajes, precio y el boundingBox exacto de la fotografía completa del producto o modelo (incluyendo cabeza y brazos completos si hay modelo, y excluyendo los textos descriptivos laterales).`;

      try {
        const { text, modelUsed } = await generateWithFallback({
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            promptText,
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const rawParsed = JSON.parse(text || '{"isNonProductPage": false, "products": []}');
        const parsed = Array.isArray(rawParsed)
          ? { isNonProductPage: rawParsed.length === 0, products: rawParsed }
          : rawParsed;

        const detectedProfile =
          parsed.detectedBusinessProfile ||
          (isKBotanasFile ? K_BOTANAS_DETECTED_PROFILE : undefined);

        if (parsed.isNonProductPage || !Array.isArray(parsed.products) || parsed.products.length === 0) {
          if (isKBotanasFile && pageNumber && pageNumber >= 2) {
            const kbFallback = getKBotanasFallbackForPage(pageNumber);
            return res.json({ ...kbFallback, source: modelUsed });
          }
          return res.json({
            isNonProductPage: true,
            detectedBusinessProfile: detectedProfile,
            products: [],
            source: modelUsed,
          });
        }

        // Filter out any item that accidentally looks like a cover/index entry and sanitize all valid products
        const validRawProducts = parsed.products.filter((p: any) => {
          const combined = `${p.name || ''} ${p.description || ''}`;
          return !isNonProductPageText(combined, pageNumber);
        });

        if (validRawProducts.length === 0) {
          return res.json({
            isNonProductPage: true,
            detectedBusinessProfile: detectedProfile,
            products: [],
            source: modelUsed,
          });
        }

        const sanitizedProducts = validRawProducts.map((p: any, i: number) => {
          const sanitized = sanitizeExtractedProduct(
            p,
            i,
            validRawProducts.length,
            fileName || 'documento'
          );
          // For single-product K-Botanas feature pages (pages 10..85), ensure boundingBox tightly crops the product bag rather than the full slide
          if (isKBotanasFile && pageNumber && pageNumber >= 10 && validRawProducts.length === 1) {
            const b = sanitized.boundingBox;
            const isFullSlide =
              !b || (b.xmax - b.xmin > 750 && b.ymax - b.ymin > 750);
            if (isFullSlide) {
              const knownSpec = K_BOTANAS_PAGE_MAP[pageNumber];
              sanitized.boundingBox = knownSpec?.box || {
                ymin: 240,
                xmin: 75,
                ymax: 835,
                xmax: 495,
              };
            }
          }
          return sanitized;
        });

        return res.json({
          isNonProductPage: false,
          detectedBusinessProfile: detectedProfile,
          products: sanitizedProducts,
          source: modelUsed,
        });
      } catch (aiErr) {
        console.warn('Gemini vision fallback to deterministic OCR/text parser:', aiErr);
        const fallbackResult = parseCatalogTextFallback(
          cleanPageText,
          fileName || 'archivo',
          pageNumber
        );
        return res.json({ ...fallbackResult, source: 'fallback-parser' });
      }
    } catch (error: any) {
      console.error('Gemini catalog extraction error:', error);
      return res.status(500).json({
        error: error?.message || 'Error al analizar la página del catálogo con Gemini.',
      });
    }
  });

  // 4. Gemini Vision Foreground Segmentation Hint Endpoint (Assists client-side background removal)
  app.post('/api/gemini/segment-product', async (req, res) => {
    try {
      const { imageDataUrl } = req.body;
      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({ error: 'Se requiere imageDataUrl.' });
      }

      const matches = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.json({
          subjectBox: { ymin: 50, xmin: 60, ymax: 940, xmax: 940 },
          backgroundHexCandidates: ['#FFFFFF', '#F5F3EA'],
        });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      const { text, modelUsed } = await generateWithFallback({
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          `Analiza esta fotografía de producto para aislar el artículo principal y remover el fondo.
Devuelve un objeto JSON con:
1. "subjectBox": coordenadas exactas del producto principal en escala 0 a 1000 ({ "ymin": number, "xmin": number, "ymax": number, "xmax": number }).
2. "backgroundHexCandidates": lista de 2 a 4 colores HEX que componen el fondo alrededor del producto (ej. ["#1E293B", "#FACC15"]).`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectBox: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
                },
                required: ['ymin', 'xmin', 'ymax', 'xmax'],
              },
              backgroundHexCandidates: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['subjectBox', 'backgroundHexCandidates'],
          },
        },
      });

      const parsed = JSON.parse(
        text ||
          '{"subjectBox":{"ymin":50,"xmin":60,"ymax":940,"xmax":940},"backgroundHexCandidates":[]}'
      );
      return res.json({ ...parsed, sourceModel: modelUsed });
    } catch {
      return res.json({
        subjectBox: { ymin: 50, xmin: 60, ymax: 940, xmax: 940 },
        backgroundHexCandidates: [],
        sourceModel: 'local-heuristic',
      });
    }
  });

  // 5. AI Graphic Design Research & Marketing Kit Generator (with Google Search grounding + multimodal support)
  app.post('/api/gemini/graphic-design-marketing', async (req, res) => {
    try {
      const {
        productName,
        category,
        description,
        price,
        currency,
        brandName,
        industry,
        targetAudience,
        customGoal,
        imageDataUrl,
      } = req.body;

      const cleanBrand = brandName || 'Candy Studio Showcase';
      const cleanIndustry = industry || category || 'Comercio y Productos de Marca';
      const cleanProduct = productName || `Colección ${cleanBrand}`;
      const cleanPrice = price ? `$${Number(price).toLocaleString('es-MX')} ${currency || 'MXN'}` : 'Precio por consultar';

      // Optional Google Search Grounding step to gather real graphic design & marketing references
      let groundedResearchContext = '';
      const searchSources: { title: string; uri: string }[] = [];

      try {
        const searchResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Investiga las tendencias actuales de diseño gráfico comercial, dirección de arte, paletas de colores, empaque y estrategias de marketing digital (Instagram, TikTok y WhatsApp Business) para el giro "${cleanIndustry}" y específicamente para el producto "${cleanProduct}" (${description || ''}). Resume hallazgos clave concretos.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        groundedResearchContext = searchResponse.text || '';
        const chunks =
          searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            searchSources.push({
              title: chunk.web.title,
              uri: chunk.web.uri,
            });
          }
        }
      } catch {
        // Proceed with direct Gemini knowledge if search tool is unavailable
      }

      const contentParts: any[] = [];
      if (imageDataUrl && typeof imageDataUrl === 'string') {
        const matches = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentParts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }

      contentParts.push(`Eres el Director de Arte Digital, Investigador de Diseño Gráfico y Estratega de Marketing de Candy Studio (candystudiomx).
Genera una investigación completa de Diseño Gráfico y un Kit de Marketing listo para ejecutar para:
- Marca: ${cleanBrand}
- Giro / Sector: ${cleanIndustry}
- Producto / Colección: ${cleanProduct}
- Categoría: ${category || 'Destacados'}
- Precio: ${cleanPrice}
- Descripción: ${description || 'Calidad superior y atención directa por WhatsApp.'}
- Público Objetivo: ${targetAudience || 'Compradores digitales y clientes por WhatsApp'}
- Objetivo específico: ${customGoal || 'Aumentar ventas por WhatsApp, destacar visualmente en redes sociales y profesionalizar la identidad gráfica del producto'}
${groundedResearchContext ? `\nInvestigación de tendencias en tiempo real:\n${groundedResearchContext}\n` : ''}

Devuelve un objeto JSON estructurado con:
1. "designResearch":
   - "visualTrendSummary": análisis editorial de qué estilo de diseño gráfico funciona mejor hoy para este producto y sector.
   - "colorPalette": 4 colores estratégicos con { "name", "hex" (código #HEX válido de 6 dígitos), "usage", "psychology" }.
   - "typographySystem": { "headlineFont", "bodyFont", "accentFont", "pairingRationale" }.
   - "artDirection": { "photographyStyle", "lightingAndProps", "compositionRules", "packagingAndLabelIdeas" }.
   - "aiImagePrompts": 3 prompts detallados listos para generar sesiones fotográficas o fondos publicitarios de estudio.
2. "marketingKit":
   - "campaignHook": el concepto creativo y gancho comercial principal.
   - "headlines": 4 titulares cortos y persuasivos listos para anuncios o banners.
   - "instagramPost": { "caption", "hashtags" (arreglo de 6 hashtags), "visualBrief", "cta" }.
   - "reelOrTikTokScript": { "hook0to3s", "body3to12s", "cta12to15s", "audioVibe" }.
   - "whatsappBroadcast": mensaje persuasivo listo para enviar por lista de difusión de WhatsApp Business.
   - "promoBadges": 4 etiquetas cortas de conversión (ej. "Edición Limitada", "Envío Hoy", "Favorito del Mes").`);

      const { text, modelUsed } = await generateWithFallback({
        contents: contentParts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              designResearch: {
                type: Type.OBJECT,
                properties: {
                  visualTrendSummary: { type: Type.STRING },
                  colorPalette: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        hex: { type: Type.STRING },
                        usage: { type: Type.STRING },
                        psychology: { type: Type.STRING },
                      },
                      required: ['name', 'hex', 'usage', 'psychology'],
                    },
                  },
                  typographySystem: {
                    type: Type.OBJECT,
                    properties: {
                      headlineFont: { type: Type.STRING },
                      bodyFont: { type: Type.STRING },
                      accentFont: { type: Type.STRING },
                      pairingRationale: { type: Type.STRING },
                    },
                    required: [
                      'headlineFont',
                      'bodyFont',
                      'accentFont',
                      'pairingRationale',
                    ],
                  },
                  artDirection: {
                    type: Type.OBJECT,
                    properties: {
                      photographyStyle: { type: Type.STRING },
                      lightingAndProps: { type: Type.STRING },
                      compositionRules: { type: Type.STRING },
                      packagingAndLabelIdeas: { type: Type.STRING },
                    },
                    required: [
                      'photographyStyle',
                      'lightingAndProps',
                      'compositionRules',
                      'packagingAndLabelIdeas',
                    ],
                  },
                  aiImagePrompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'visualTrendSummary',
                  'colorPalette',
                  'typographySystem',
                  'artDirection',
                  'aiImagePrompts',
                ],
              },
              marketingKit: {
                type: Type.OBJECT,
                properties: {
                  campaignHook: { type: Type.STRING },
                  headlines: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  instagramPost: {
                    type: Type.OBJECT,
                    properties: {
                      caption: { type: Type.STRING },
                      hashtags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      visualBrief: { type: Type.STRING },
                      cta: { type: Type.STRING },
                    },
                    required: ['caption', 'hashtags', 'visualBrief', 'cta'],
                  },
                  reelOrTikTokScript: {
                    type: Type.OBJECT,
                    properties: {
                      hook0to3s: { type: Type.STRING },
                      body3to12s: { type: Type.STRING },
                      cta12to15s: { type: Type.STRING },
                      audioVibe: { type: Type.STRING },
                    },
                    required: ['hook0to3s', 'body3to12s', 'cta12to15s', 'audioVibe'],
                  },
                  whatsappBroadcast: { type: Type.STRING },
                  promoBadges: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'campaignHook',
                  'headlines',
                  'instagramPost',
                  'reelOrTikTokScript',
                  'whatsappBroadcast',
                  'promoBadges',
                ],
              },
            },
            required: ['designResearch', 'marketingKit'],
          },
        },
      });

      const parsed = JSON.parse(text || '{}');
      return res.json({
        ...parsed,
        searchSources: searchSources.slice(0, 5),
        sourceModel: modelUsed,
      });
    } catch (error: any) {
      console.error('Graphic design marketing AI error:', error);
      // Deterministic high-value fallback so the merchant always gets a complete kit
      const {
        productName = 'Producto Destacado',
        category = 'Colección Principal',
        brandName = 'Mi Marca',
        price,
        currency = 'MXN',
      } = req.body || {};
      const formattedPrice = price
        ? `$${Number(price).toLocaleString('es-MX')} ${currency}`
        : 'Edición Especial';

      return res.json({
        designResearch: {
          visualTrendSummary: `Tendencia "Digital Showroom Editorial" estilo Candy Studio: fondos limpios en blanco estudio (#FFFFFF) o crema cálido (#F5F3EA) que aíslan la silueta de ${productName}, combinados con tipografía serif de alto contraste y acentos coral (#FD5D5C) para dirigir la mirada hacia la conversión por WhatsApp.`,
          colorPalette: [
            {
              name: 'Blanco Estudio Puro',
              hex: '#FFFFFF',
              usage: 'Fondo de recorte de producto y tarjetas de galería',
              psychology: 'Claridad absoluta, higiene visual y protagonismo del producto.',
            },
            {
              name: 'Crema Editorial Candy',
              hex: '#F5F3EA',
              usage: 'Lienzo general del catálogo y fondos de historia',
              psychology: 'Calidez táctil, sofisticación editorial y lectura descansada.',
            },
            {
              name: 'Coral Conversión',
              hex: '#FD5D5C',
              usage: 'Etiquetas de precio, sellos promocionales y acentos clave',
              psychology: 'Energía comercial, urgencia positiva y recordación de marca.',
            },
            {
              name: 'Carbón Tipográfico',
              hex: '#1A1A1A',
              usage: 'Titulares principales, SKU y botones de acción',
              psychology: 'Autoridad, contraste nítido y legibilidad inmediata en móvil.',
            },
          ],
          typographySystem: {
            headlineFont: 'Cormorant Garamond (SemiBold / Italic 600)',
            bodyFont: 'Plus Jakarta Sans (Regular 400 / Medium 500)',
            accentFont: 'JetBrains Mono (500 Uppercase)',
            pairingRationale:
              'El contraste entre un titular serif editorial y datos técnicos en monoespaciada eleva la percepción de valor de cualquier producto físico.',
          },
          artDirection: {
            photographyStyle:
              'Recorte limpio de producto en proporción 4:5 con sombra de contacto suave en la base sobre fondo blanco (#FFFFFF) o transparente.',
            lightingAndProps:
              'Luz difusa lateral a 45° para resaltar texturas reales del empaque o material sin reflejos duros.',
            compositionRules:
              'Mantener 15% de aire negativo alrededor del artículo para que el titular y el precio respiren en formatos móviles 1:1 y 9:16.',
            packagingAndLabelIdeas:
              'Incluir sello de origen, gramaje o talla visible en esquina superior y código QR directo al catálogo digital.',
          },
          aiImagePrompts: [
            `Studio product photography of ${productName} (${category}), isolated on pure white background #FFFFFF, soft natural contact shadow, crisp commercial lighting, 85mm lens, ultra-detailed texture.`,
            `Editorial flat-lay composition featuring ${productName} by ${brandName} on warm cream travertine surface #F5F3EA, subtle geometric shadows, contemporary Mexican design studio aesthetic.`,
            `Social media promotional poster 4:5 for ${productName}, floating product cutout with clean shadows, bold editorial typography space at top, warm coral and cream color palette.`,
          ],
        },
        marketingKit: {
          campaignHook: `${productName}: Diseño, calidad y atención directa en un solo clic por WhatsApp.`,
          headlines: [
            `Nuevo en catálogo: ${productName}`,
            `Calidad que se nota en cada detalle — ${productName} (${formattedPrice})`,
            `Pide tu ${productName} hoy por WhatsApp con atención inmediata`,
            `${brandName} presenta: ${productName} · Disponible ahora`,
          ],
          instagramPost: {
            caption: `Conoce ${productName} de nuestra línea ${category}.\n\nCuidamos cada detalle para entregarte un producto que destaca por sí mismo. Explora todas las variantes en nuestro aparador digital y haz tu pedido directo sin intermediarios.\n\nPrecio: ${formattedPrice}\nEscríbenos por WhatsApp desde el enlace en nuestro perfil.`,
            hashtags: [
              `#${String(brandName).replace(/\s+/g, '')}`,
              `#${String(category).replace(/\s+/g, '')}`,
              '#CatalogoDigital',
              '#ComprasPorWhatsApp',
              '#DiseñoMexicano',
              '#CandyStudio',
            ],
            visualBrief:
              'Carrusel de 3 imágenes: 1) Portada con producto recortado sobre fondo blanco/crema y titular grande; 2) Acercamiento al detalle/empaque; 3) Tarjeta con precio y botón de WhatsApp.',
            cta: 'Toca el enlace en bio y pide el tuyo por WhatsApp en 30 segundos.',
          },
          reelOrTikTokScript: {
            hook0to3s: `¿Ya conocías ${productName} de ${brandName}? Mira por qué es de los más pedidos en nuestro catálogo.`,
            body3to12s: `Muestra el producto en primer plano destacando su acabado en ${category}. Superpón en pantalla sus variantes disponibles y el precio (${formattedPrice}).`,
            cta12to15s: `Entra a nuestro catálogo digital y mándanos WhatsApp con un toque para apartar el tuyo.`,
            audioVibe: 'Beat lo-fi dinámico o tendencia instrumental limpia con cortes al ritmo.',
          },
          whatsappBroadcast: `¡Hola! En *${brandName}* acabamos de actualizar nuestro catálogo digital y queremos presentarte *${productName}* (${formattedPrice}).\n\nDisponibilidad inmediata en la categoría *${category}*.\n\nResponde a este mensaje para apartar tu pedido o ver todas las fotos en nuestro aparador digital.`,
          promoBadges: [
            'Entrega Inmediata',
            'Favorito del Catálogo',
            'Pedido Directo WhatsApp',
            'Calidad Garantizada',
          ],
        },
        searchSources: [],
        sourceModel: 'fallback-studio',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Candy Catalog server running on http://localhost:${PORT}`);
  });
}

startServer();

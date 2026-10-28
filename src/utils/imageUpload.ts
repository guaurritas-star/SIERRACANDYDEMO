import { authenticatedApiFetch } from './authenticatedApiFetch';
import { removeProductBackgroundToStudio } from './catalogExtractor';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadBackgroundOption = 'original' | 'white' | 'transparent' | 'cream';

export interface UploadedImageResult {
  url: string;
  originalUrl: string;
  dataUrl: string;
  fileName: string;
  backgroundMode: UploadBackgroundOption;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return `El archivo "${file.name}" no es válido. Usa formatos JPG, PNG o WebP.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `El archivo "${file.name}" supera el límite de 5 MB.`;
  }
  return null;
}

function compressImageToDataUrl(file: File, maxDimension = 1200, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen dañado o no compatible.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type.toLowerCase() === 'image/png';
        const compressedDataUrl = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/webp', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function processAndUploadImage(
  file: File,
  backgroundMode: UploadBackgroundOption = 'original'
): Promise<UploadedImageResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const compressedDataUrl = await compressImageToDataUrl(file);
  const cleanName = file.name.replace(/\.[^/.]+$/, '');

  let originalStoredUrl = compressedDataUrl;
  try {
    const response = await authenticatedApiFetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: compressedDataUrl,
        fileName: `${cleanName}-orig`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      originalStoredUrl = data.dataUrl || data.url || compressedDataUrl;
    }
  } catch {
    // Fallback to compressed persistent dataUrl if offline
  }

  let finalUrl = originalStoredUrl;
  if (backgroundMode !== 'original') {
    const targetBg =
      backgroundMode === 'transparent'
        ? 'transparent'
        : backgroundMode === 'cream'
        ? '#F5F3EA'
        : '#FFFFFF';
    try {
      finalUrl = await removeProductBackgroundToStudio(
        compressedDataUrl,
        targetBg,
        `${cleanName}-${backgroundMode}`
      );
    } catch {
      finalUrl = originalStoredUrl;
    }
  }

  return {
    url: finalUrl,
    originalUrl: originalStoredUrl,
    dataUrl: compressedDataUrl,
    fileName: file.name,
    backgroundMode,
  };
}


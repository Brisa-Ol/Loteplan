// src/shared/utils/fileUtils.ts
import httpService from '@/core/api/httpService';
import { env } from '@/core/config/env';

/**
 * Descarga un archivo protegido o público manejando correctamente la URL base.
 */
export const downloadSecureFile = async (urlRelativa: string, nombreArchivo: string) => {
  try {
    let cleanPath = urlRelativa.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    let targetUrl = cleanPath;

    const isStaticFile =
      /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(cleanPath) ||
      cleanPath.startsWith('uploads') ||
      cleanPath.startsWith('plantillas');

    if (isStaticFile) {
      if (!cleanPath.startsWith('uploads')) {
        cleanPath = `uploads/${cleanPath}`;
      }
      targetUrl = `${env.apiPublicUrl}/${cleanPath}`;
    }

    const response = await httpService.get(targetUrl, {
      responseType: 'blob',
    });

    // Detectar y forzar el MIME type para evitar archivos corruptos (.txt)
    let mimeType = response.headers['content-type'];

    if (!mimeType || mimeType === 'application/octet-stream') {
      const extension = nombreArchivo.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      mimeType = mimeMap[extension || ''] || mimeType;
    }

    const blob = new Blob([response.data], { type: mimeType });
    downloadBlob(blob, nombreArchivo);

  } catch (error) {
    console.error("❌ Error al descargar:", error);
    throw error;
  }
};

/**
 * Helper genérico para descargar un Blob como archivo
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Convierte un File a Base64 (útil para previews)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Calcula el hash SHA-256 de un archivo
 */
export const calculateFileHash = async (file: Blob | File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
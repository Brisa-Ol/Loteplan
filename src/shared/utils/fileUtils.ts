// src/shared/utils/fileUtils.ts

import httpService from '@/core/api/httpService';
import { env } from '@/core/config/env';


// ════════════════════════════════════════════════════════
// DESCARGA
// ════════════════════════════════════════════════════════

/**
 * Helper genérico para descargar un Blob como archivo en el navegador.
 * Usado internamente por downloadSecureFile y externamente donde se tenga el blob listo.
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
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
 * Descarga un archivo desde una URL pública sin autenticación.
 * Útil para archivos estáticos con URL directa.
 */
export const downloadFromUrl = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Descarga un archivo protegido o público a través del httpService,
 * manejando correctamente la URL base y el MIME type.
 * Usar para archivos que requieren autenticación o están detrás del proxy.
 */
export const downloadSecureFile = async (urlRelativa: string, nombreArchivo: string): Promise<void> => {
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

    // Detectar y forzar el MIME type para evitar archivos corruptos
    let mimeType = response.headers['content-type'];

    if (!mimeType || mimeType === 'application/octet-stream') {
      const extension = nombreArchivo.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
      };
      mimeType = mimeMap[extension ?? ''] ?? mimeType;
    }

    const blob = new Blob([response.data], { type: mimeType });
    downloadBlob(blob, nombreArchivo);

  } catch (error) {
    console.error('❌ Error al descargar archivo:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════
// CONVERSIÓN
// ════════════════════════════════════════════════════════

/**
 * Convierte un File a Base64 con el prefijo data URL incluido.
 * Útil para previews de imágenes sin subirlas al servidor.
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
 * Convierte una URL remota en un objeto File local.
 * Útil para obtener la plantilla del servidor, hashearla y reenviarla.
 * ⚠️ Asegurate de hacer try/catch en el llamador — falla si la URL expira o devuelve 403.
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};

// ════════════════════════════════════════════════════════
// HASHING
// ════════════════════════════════════════════════════════

/**
 * Calcula el hash SHA-256 de un archivo (File o Blob) en el navegador.
 * El resultado debe coincidir con el cálculo del backend para verificar integridad.
 */
export const calculateFileHash = async (file: Blob | File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
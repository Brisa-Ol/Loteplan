// src/shared/utils/fileUtils.ts
import httpService from '@/core/api/httpService';
import { env } from '@/core/config/env';

/**
 * Descarga un archivo protegido o público manejando correctamente la URL base.
 * Detecta si la ruta es un archivo estático (/uploads) o un endpoint de API.
 */
export const downloadSecureFile = async (urlRelativa: string, nombreArchivo: string) => {
  try {
    // 1. Normalización de ruta (Igual que antes)
    let cleanPath = urlRelativa.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    let targetUrl = cleanPath;

    // 2. Detección inteligente (Igual que antes)
    const isStaticFile = 
        /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(cleanPath) || 
        cleanPath.startsWith('uploads') ||                    
        cleanPath.startsWith('plantillas') ||                 
        cleanPath.startsWith('documentos') ||                 
        cleanPath.startsWith('imagenes');                     

    if (isStaticFile) {
        if (!cleanPath.startsWith('uploads')) {
            cleanPath = `uploads/${cleanPath}`;
        }
        targetUrl = `${env.apiPublicUrl}/${cleanPath}`;
    }

    console.log("📥 Intentando descargar desde:", targetUrl);

    // 3. Petición al servidor
    const response = await httpService.get(targetUrl, {
      responseType: 'blob',
    });

    // =====================================================================
    // 🔴 AQUÍ ESTÁ LA SOLUCIÓN: DETECTAR Y FORZAR EL TIPO DE ARCHIVO
    // =====================================================================
    
    // A. Intentamos leer el tipo desde las cabeceras del servidor
    let mimeType = response.headers['content-type'];

    // B. Si el servidor no lo manda o es genérico, lo deducimos por la extensión del nombre
    if (!mimeType || mimeType === 'application/octet-stream') {
        const extension = nombreArchivo.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') mimeType = 'application/pdf';
        else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
        else if (extension === 'png') mimeType = 'image/png';
    }

    // C. Creamos el Blob ESPECIFICANDO el tipo. Esto evita que se guarde como .txt
    const blob = new Blob([response.data], { type: mimeType });

    // 4. Crear URL y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo); // Asegura que el nombre tenga la extensión
    document.body.appendChild(link);
    link.click();
    
    // 5. Limpieza
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("❌ Error al descargar:", error);
    throw error;
  }
};

/**
 * Descarga un blob directamente (útil cuando ya tienes el archivo en memoria)
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
 * Fuerza la descarga de un archivo desde una URL pública.
 * ⚠️ Solo funciona para archivos públicos sin autenticación.
 */
export const downloadFromPublicUrl = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Calcula el hash SHA-256 de un archivo (File o Blob) en el navegador.
 */
export const calculateFileHash = async (file: Blob | File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Convierte una URL en un objeto File local.
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};

/**
 * Convierte un File a string Base64 (útil para previsualizaciones de imágenes).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
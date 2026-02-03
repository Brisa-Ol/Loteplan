// src/utils/fileUtils.ts

/**
 * Calcula el hash SHA-256 de un archivo (File o Blob) en el navegador.
 * Esto debe coincidir con el cálculo que hace el backend para verificar integridad.
 */
export const calculateFileHash = async (file: Blob | File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convertir bytes a hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Convierte una URL (ej: plantilla del servidor) en un objeto File local.
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};

/**
 * Helper genérico para descargar un Blob como archivo en el navegador.
 * @param blob - El objeto Blob a descargar
 * @param fileName - Nombre con el que se guardará
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Limpieza para evitar fugas de memoria
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Fuerza la descarga de un archivo desde una URL pública (bypass de vista previa).
 */
export const downloadFromUrl = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  link.remove();
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
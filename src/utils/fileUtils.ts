// src/utils/fileUtils.ts

/**
 * Calcula el hash SHA-256 de un archivo o Blob en el navegador.
 * Esto es necesario para la validación de integridad del contrato.
 */
export const calculateFileHash = async (file: Blob | File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Convierte una URL de archivo en un objeto File/Blob.
 * Útil para descargar la plantilla y prepararla para la firma.
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new File([buf], filename, { type: mimeType });
};
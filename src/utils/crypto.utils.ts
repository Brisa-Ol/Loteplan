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
 * Convierte una URL (la plantilla del servidor) en un objeto File local
 * para poder procesarlo, hashearlo y enviarlo de vuelta.
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
};
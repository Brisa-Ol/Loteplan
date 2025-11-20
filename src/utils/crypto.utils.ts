/**
 * Calcula el hash SHA-256 de un archivo (File o Blob) en el navegador.
 * Esencial para garantizar la integridad del contrato antes de enviarlo.
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
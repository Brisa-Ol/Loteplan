/**
 * Calcula el hash SHA-256 de un archivo File.
 * Utiliza la Web Crypto API nativa del navegador.
 * @param file - El archivo a hashear
 * @returns Promise con el hash en formato hexadecimal
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Valida que un string sea un hash SHA-256 válido
 * @param hash - String a validar
 * @returns boolean
 */
export const isValidSHA256 = (hash: string): boolean => {
  return /^[a-f0-9]{64}$/i.test(hash);
};

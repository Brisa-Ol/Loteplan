// 1. Exportamos todo lo que NO genere conflicto de forma masiva
export * from './contrato.utils';
export * from './permissions.utils';
export * from './secureStorage';
export * from './snackbarUtils';

// 2. Exportamos TODO de fileUtils (donde está tu downloadSecureFile)
export * from './fileUtils';

// 3. Resolvemos los conflictos de forma EXPLÍCITA:
// Si prefieres las versiones de crypto.utils y download.utils sobre las de fileUtils,
// o si son distintas, impórtalas y expórtalas con nombres claros.

export { calculateFileHash } from './crypto.utils';
export { downloadBlob, fileToBase64, downloadFromUrl } from './download.utils';

/**
 * NOTA: Al hacer esto, si fileUtils también tiene un 'downloadBlob', 
 * el 'export * from ./fileUtils' lo ignorará silenciosamente a favor de 
 * la exportación explícita que pusimos arriba.
 */
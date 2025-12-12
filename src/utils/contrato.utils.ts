import type { ContratoPlantillaDto } from '../types/dto/contrato-plantilla.dto';
import type { ContratoFirmadoDto } from '../types/dto/contrato-firmado.dto';

/**
 * Formatea la fecha de un contrato
 */
export const formatContratoDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Genera un nombre sugerido para descargar un contrato
 */
export const generateDownloadFileName = (contrato: ContratoFirmadoDto): string => {
  const fecha = new Date(contrato.fecha_firma).toISOString().split('T')[0];
  return `contrato_${contrato.id}_${fecha}.pdf`;
};

/**
 * Determina si una plantilla está lista para ser usada
 */
export const isPlantillaReady = (plantilla: ContratoPlantillaDto): boolean => {
  return plantilla.activo && 
         !plantilla.integrity_compromised && 
         !!plantilla.id_proyecto;
};

/**
 * Obtiene el tipo de autorización de un contrato firmado
 */
export const getTipoAutorizacion = (contrato: ContratoFirmadoDto): string => {
  if (contrato.id_inversion_asociada) return 'Inversión Directa';
  if (contrato.id_suscripcion_asociada) return 'Suscripción Mensual';
  return 'Desconocido';
};
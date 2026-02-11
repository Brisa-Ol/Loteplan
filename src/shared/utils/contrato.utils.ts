// src/utils/contractUtils.ts
import type { ContratoFirmadoDto, ContratoPlantillaDto } from "@/core/types/dto";

/**
 * Formatea la fecha de un contrato para mostrar en la UI.
 * Incluye validación de fecha inválida.
 */
export const formatContratoDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Validación extra por seguridad
  if (isNaN(date.getTime())) return 'Fecha inválida';

  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Genera un nombre de archivo estandarizado para descargar un contrato firmado.
 * Formato: contrato_{ID}_{FECHA}.pdf
 */
export const generateDownloadFileName = (contrato: ContratoFirmadoDto): string => {
  // Intentamos usar la fecha de firma, si no la de creación, o la actual
  const fechaBase = contrato.fecha_firma || contrato.fecha_creacion || new Date().toISOString();
  const fechaStr = new Date(fechaBase).toISOString().split('T')[0];

  return `contrato_${contrato.id}_${fechaStr}.pdf`;
};

/**
 * Determina si una plantilla cumple los requisitos para ser utilizada en una firma.
 */
export const isPlantillaReady = (plantilla: ContratoPlantillaDto): boolean => {
  return (
    plantilla.activo &&
    !plantilla.integrity_compromised &&
    !!plantilla.id_proyecto
  );
};

/**
 * Obtiene el texto legible del tipo de autorización según los IDs asociados.
 */
export const getTipoAutorizacion = (contrato: ContratoFirmadoDto): string => {
  if (contrato.id_inversion_asociada) return 'Inversión Directa';
  if (contrato.id_suscripcion_asociada) return 'Suscripción Mensual';
  return 'Desconocido';
};
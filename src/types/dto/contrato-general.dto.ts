
import type { BaseDTO } from "./base.dto";
// ==========================================
// 📥 RESPONSE DTOs (Modelos de Datos)
// ==========================================



/**
 * Representación completa de un Contrato Firmado (Auditoría).
 * Coincide con el modelo `ContratoFirmado` de Sequelize.
 */
export interface ContratoFirmadoDto extends BaseDTO {
  id_contrato_plantilla: number;
  
  // Metadatos del archivo
  nombre_archivo: string;
  url_archivo: string; // Ruta relativa en el servidor
  hash_archivo_firmado: string; // Hash SHA-256 de integridad
  
  // Datos de la firma
  // firma_digital: string; // Omitimos el string largo criptográfico en listados para no pesar la red
  fecha_firma: string; // ISO String
  estado_firma: 'FIRMADO' | 'REVOCADO' | 'INVALIDO';
  
  // Contexto
  id_proyecto: number;
  id_usuario_firmante: number;
  
  // Relaciones detectadas (Una de las dos tendrá valor)
  id_inversion_asociada?: number;
  id_suscripcion_asociada?: number;
  
  // Auditoría técnica
  ip_firma?: string;
  geolocalizacion_firma?: string;
}

/**
 * DTO simplificado para listados masivos (opcional, si el backend filtrara campos)
 * Por ahora usamos el completo ya que tu backend devuelve todo el objeto.
 */
export type ContratoFirmadoListDto = ContratoFirmadoDto[];
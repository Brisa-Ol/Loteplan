// src/types/dto/contrato.dto.ts
import type { BaseDTO } from './base.dto';

/**
 * ❗ DTO PRINCIPAL (ACTUALIZADO)
 * Representa un contrato recibido desde el backend.
 * Incluye el nuevo campo de verificación de integridad.
 */
export interface ContratoDTO extends BaseDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string; // Hash guardado en la DB
  firma_digital: string | null;
  fecha_firma: string | null;
  id_proyecto: number;
  id_usuario_firmante: number | null;

  /**
   * ❗ NUEVO CAMPO:
   * Este campo es añadido dinámicamente por tu 'contratoService.js'
   * en el backend (función 'findAndVerifyById').
   * Será 'true' si el hash del archivo físico no coincide con el
   * 'hash_archivo_original' guardado, o si el archivo no se encuentra.
   */
  integrity_compromised?: boolean;
}

/**
 * DTO para crear un nuevo contrato (plantilla base).
 * Usado por tu función 'create' del backend.
 */
export interface CreateContratoDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string;
  id_proyecto: number;
}

/**
 * DTO para registrar una firma en un contrato.
 * Usado por tu función 'registerSignature' del backend.
 */
export interface RegisterSignatureDTO {
  firma_digital: string;
  id_usuario_firmante: number;
  fecha_firma: string;
  // ...cualquier otro dato que 'signatureData' pueda contener
}
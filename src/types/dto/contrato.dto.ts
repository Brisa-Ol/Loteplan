

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

import type { BaseDTO } from "./base.dto";

/**
 * Parámetros para subir una nueva plantilla (Admin)
 * Se convertirá a FormData en el servicio.
 */
export interface UploadPlantillaDto {
  file: File;
  id_proyecto: number;
}

/**
 * Parámetros para actualizar el PDF de una plantilla (Admin)
 */
export interface UpdatePlantillaPdfDto {
  id: number;
  file: File;
}

/**
 * Parámetros para FIRMAR un contrato.
 * ⚠️ CRÍTICO: Requiere autorización de inversión o suscripción.
 */
export interface SignContractDto {
  file: File; // El PDF firmado digitalmente
  id_contrato_base: number;
  firma_digital: string; // String de la firma criptográfica
  id_inversion?: number;   // Opcional (uno de los dos es obligatorio)
  id_suscripcion?: number; // Opcional
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo principal de Contrato.
 * Extiende BaseDTO.
 */
export interface ContratoDto extends BaseDTO {
  nombre_archivo: string;
  url_archivo: string;
  hash_archivo_original: string; // Hash SHA-256
  
  firma_digital?: string;
  fecha_firma?: string; // ISO Date string
  estado_firma?: string; // Ejem: 'FIRMADO', 'PENDIENTE' (si tuvieras ese campo)
  
  id_proyecto: number;
  id_usuario_firmante?: number;

  // Relaciones
  proyecto?: ProyectoDto;

  // 🚨 Campo calculado en el backend (Service: findAndVerifyById)
  // Si es true, mostrar advertencia roja en la UI
  integrity_compromised?: boolean; 
}

/**
 * Respuesta simple para eliminaciones o actualizaciones sin retorno de objeto
 */
export interface ContratoActionResponse {
  message: string;
  error?: string;
}
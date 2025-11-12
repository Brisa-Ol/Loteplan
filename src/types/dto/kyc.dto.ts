// src/types/dto/kyc.dto.ts
import type { BaseDTO } from './base.dto'; // Asumiendo que tienes un base.dto

// ══════════════════════════════════════════════════════════
// TIPOS (Basados en tu Modelo)
// ══════════════════════════════════════════════════════════

// ❗ Coincide con tu ENUM de Sequelize: 'PENDIENTE', 'APROBADA', 'RECHAZADA'
export type KycStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type KycTipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

// ══════════════════════════════════════════════════════════
// DTOs DE SALIDA (Lo que el backend envía)
// ══════════════════════════════════════════════════════════

/**
 * DTO DE SALIDA (Completo)
 * Lo que recibes de: GET /kyc/pending (para Admin)
 */
export interface KycDTO extends BaseDTO {
  id_usuario: number;
  tipo_documento: KycTipoDocumento;
  numero_documento: string;
  url_foto_documento_frente: string;
  url_foto_documento_dorso: string | null;
  url_foto_selfie_con_documento: string;
  url_video_verificacion: string | null;
  nombre_completo: string | null;
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  estado_verificacion: KycStatus;
  id_verificador: number | null;
  fecha_verificacion: string | null; // ISO Date String
  motivo_rechazo: string | null;
  latitud_verificacion: number | null;
  longitud_verificacion: number | null;
  ip_verificacion: string | null;
  
  // Opcional: para mostrar quién es el usuario en el panel de admin
  usuario?: {
    email: string;
    nombre_usuario: string;
  };
}

/**
 * DTO DE SALIDA (Parcial - para Usuario)
 * Lo que recibes de: GET /kyc/status
 */
export type KycStatusDTO = Omit<
  KycDTO, 
  | 'url_foto_documento_frente'
  | 'url_foto_documento_dorso'
  | 'url_foto_selfie_con_documento'
  | 'url_video_verificacion'
>;

// ══════════════════════════════════════════════════════════
// DTOs de ENTRADA (Lo que el frontend envía)
// ══════════════════════════════════════════════════════════

/**
 * DTO DE ENTRADA (para POST /kyc/submit)
 * Campos de TEXTO que acompañan a los archivos en el FormData
 */
export interface SubmitKycDataDTO {
  nombre_completo: string;
  tipo_documento: KycTipoDocumento;
  numero_documento: string;
  fecha_nacimiento: string; // "YYYY-MM-DD"
  // ❗ 'domicilio' no está en tu modelo de backend, así que lo quitamos
  latitud_verificacion?: number;
  longitud_verificacion?: number;
  ip_verificacion?: string;
}

/**
 * DTO DE ENTRADA (para POST /kyc/reject/:idUsuario)
 * El 'motivo' que envía el admin al rechazar.
 */
export interface RejectKycDTO {
  motivo_rechazo: string;
}
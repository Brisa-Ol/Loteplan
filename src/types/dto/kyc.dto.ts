// src/types/dto/kyc.dto.ts

import type { BaseDTO } from './base.dto'; // Asumiendo que tienes un base.dto

// ══════════════════════════════════════════════════════════
// TIPOS (Unificados)
// ══════════════════════════════════════════════════════════

// ❗ Usamos los nombres de V2 (mayúsculas) para consistencia
export type KYCStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

// ══════════════════════════════════════════════════════════
// DTOs DE SALIDA (Lo que el backend envía)
// ══════════════════════════════════════════════════════════

/**
 * DTO completo de Verificación de Identidad (KYC)
 * (Se usa en GET /pending para el admin)
 * ❗ Mantenemos la estructura de V1, que incluye el usuario (útil para admin)
 */
export interface KycDTO extends BaseDTO {
  id_usuario: number;
  // Datos del documento
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string | null;
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  // URLs de archivos subidos
  url_foto_documento_frente: string;
  url_foto_documento_dorso: string | null;
  url_foto_selfie_con_documento: string;
  url_video_verificacion: string | null;
  
  estado_verificacion: KYCStatus;
  id_verificador: number | null;
  fecha_verificacion: string | null; // ISO Date String
  motivo_rechazo: string | null;

  // Geolocalización y metadata
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
 * ❗ AÑADIDO (de V2)
 * Respuesta al enviar documentos (POST /kyc/submit)
 */
export interface KYCSubmissionResponse {
  message: string;
  registro: {
    id: number;
    estado_verificacion: KYCStatus;
    fecha_envio: string; // ISO Date String
  };
}

/**
 * ❗ AÑADIDO (de V2)
 * Respuesta de estado de KYC (GET /kyc/status)
 * (Reemplaza al 'KycStatusDTO' de V1, que era un 'Omit' incompleto)
 */
export interface KYCStatusResponse {
  message?: string;
  estado_verificacion: KYCStatus;
  // El registro puede venir o no, dependiendo del estado
  registro?: KycDTO; 
}


// ══════════════════════════════════════════════════════════
// DTOs de ENTRADA (Lo que el frontend envía)
// ══════════════════════════════════════════════════════════

/**
 * DTO DE ENTRADA (para POST /kyc/submit)
 * (Mantenemos el de V1, es más completo y preciso que el de V2)
 * Campos de TEXTO que acompañan a los archivos en el FormData
 */
export interface SubmitKycDataDTO {
  nombre_completo: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_nacimiento: string; // "YYYY-MM-DD"
  latitud_verificacion?: number;
  longitud_verificacion?: number;
  ip_verificacion?: string;
}

/**
 * DTO DE ENTRADA (para POST /kyc/reject/:idUsuario)
 * (Mantenemos el de V1, que es idéntico al de V2)
 */
export interface RejectKycDTO {
  motivo_rechazo: string;
}
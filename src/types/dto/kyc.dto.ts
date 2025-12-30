import type { BaseDTO } from './base.dto';

// ==========================================
// 🧠 ENUMS & TIPOS GLOBALES
// ==========================================

/**
 * Estados posibles del proceso de verificación de identidad.
 * - `NO_INICIADO`: El usuario aún no ha enviado ninguna solicitud.
 * - `PENDIENTE`: Solicitud enviada y esperando revisión manual.
 * - `APROBADA`: Identidad validada. Usuario habilitado para operar.
 * - `RECHAZADA`: Solicitud denegada. El usuario puede reintentar.
 */
export type EstadoVerificacion = 'NO_INICIADO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

/**
 * Tipos de documentos aceptados por la plataforma.
 * Coincide con el ENUM de la base de datos.
 */
export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

// ==========================================
// 📦 DTO PRINCIPAL (Modelo Completo)
// ==========================================

/**
 * Representación completa de un registro de Verificación de Identidad (KYC).
 * Refleja la tabla `verificacion_identidad` y sus relaciones.
 */
export interface KycDTO extends BaseDTO {
  
  /** ID del usuario dueño de la verificación (FK). */
  id_usuario: number;
  
  // --- DATOS PERSONALES DEL FORMULARIO ---
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  /** Fecha de nacimiento en formato ISO "YYYY-MM-DD". */
  fecha_nacimiento?: string;
  
  // --- URLs DE ARCHIVOS (Solo lectura desde el back) ---
  url_foto_documento_frente: string;
  url_foto_documento_dorso: string | null;
  url_foto_selfie_con_documento: string;
  url_video_verificacion: string | null;
  
  // --- ESTADO Y GESTIÓN ---
  estado_verificacion: EstadoVerificacion;
  /** ID del administrador que realizó la revisión (si aplica). */
  id_verificador?: number;
  fecha_verificacion?: string;
  /** Razón del rechazo, visible para el usuario si estado es 'RECHAZADA'. */
  motivo_rechazo?: string;
  
  // --- METADATOS TÉCNICOS ---
  latitud_verificacion?: number;
  longitud_verificacion?: number;
  ip_verificacion?: string;

  // --- RELACIONES (Includes) ---
  /** Datos del usuario que envió la solicitud (útil para el Admin Dashboard). */
  usuario?: {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    dni?: string;
    nombre_usuario?: string;
    numero_telefono?: string;
    rol?: string;
  };

  /** Datos del administrador que procesó la solicitud. */
  verificador?: {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    nombre_usuario?: string;
    rol?: string;
  };

  // --- HELPERS (Calculados en el Controller) ---
  /** Indica si el usuario puede enviar una nueva solicitud (True si es NO_INICIADO o RECHAZADA). */
  puede_enviar?: boolean; 
  /** Mensaje descriptivo del estado actual para la UI. */
  mensaje_estado?: string;
}

// ==========================================
// 🛡️ DTOs ESPECÍFICOS (Vistas Parciales)
// ==========================================

/**
 * Versión "ligera" del estado KYC para mostrar en el perfil del cliente.
 * Omite URLs de archivos sensibles y datos técnicos irrelevantes para el usuario final.
 */
export type KycStatusDTO = Omit<
  KycDTO, 
  | 'url_foto_documento_frente' 
  | 'url_foto_documento_dorso' 
  | 'url_foto_selfie_con_documento' 
  | 'url_video_verificacion'
  | 'ip_verificacion'
>;

/**
 * Datos requeridos para enviar una nueva solicitud de verificación.
 * Se convierte a `FormData` en el servicio antes de enviarse.
 */
export interface SubmitKycDto {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  
  /** Archivo de imagen (JPG/PNG/PDF). Obligatorio. */
  documento_frente: File;
  /** Archivo de imagen. Opcional. */
  documento_dorso?: File;
  /** Selfie sosteniendo el documento. Obligatorio. */
  selfie_con_documento: File;
  /** Video corto de prueba de vida. Opcional. */
  video_verificacion?: File;
  
  // Geo-localización del usuario al momento de enviar
  latitud_verificacion?: number;
  longitud_verificacion?: number;
}

/**
 * Datos requeridos por el administrador para rechazar una solicitud.
 */
export interface RejectKycDTO {
  /** Explicación clara de por qué se rechazó la solicitud. */
  motivo_rechazo: string;
}
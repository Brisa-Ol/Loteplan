import type { BaseDTO } from './base.dto';

// ==========================================
// 🧠 ENUMS & TIPOS GLOBALES
// ==========================================

export type EstadoVerificacion = 'NO_INICIADO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

// ==========================================
// 📦 DTO PRINCIPAL (Modelo Completo)
// ==========================================

/**
 * Representación completa de un registro de Verificación de Identidad (KYC).
 * Refleja la tabla `verificacion_identidad` y sus relaciones.
 *
 * Hereda de BaseDTO: id, activo, fecha_creacion, fecha_actualizacion.
 *
 * Nota sobre timestamps: Sequelize manda createdAt/updatedAt en toJSON().
 * BaseDTO los declara como fecha_creacion/fecha_actualizacion.
 * createdAt se incluye aquí porque es el nombre real que llega del back.
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

  // --- URLs DE ARCHIVOS (Solo lectura desde el back, presentes en endpoints admin) ---
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
  /** Datos del usuario que envió la solicitud. Presente en endpoints admin (pending/approved/rejected/all). */
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

  /** Datos del administrador que procesó la solicitud. Presente en approved/rejected/all y en status. */
  verificador?: {
    id: number;
    nombre: string;
    apellido?: string;
    email: string;
    nombre_usuario?: string;
    rol?: string;
  };

  // --- HELPERS (Calculados en el Controller, presentes en la respuesta de /status) ---
  puede_enviar?: boolean;
  mensaje_estado?: string;
}

// ==========================================
// 🛡️ DTOs ESPECÍFICOS (Vistas Parciales)
// ==========================================

/**
 * Respuesta de GET /kyc/status cuando el usuario YA tiene un registro.
 *
 * El servicio del back excluye las URLs de archivos y la IP via attributes.exclude.
 * El controlador agrega puede_enviar y mensaje_estado.
 * Incluye la relación verificador si existe.
 */
export type KycStatusWithRecord = Omit<
  KycDTO,
  | 'url_foto_documento_frente'
  | 'url_foto_documento_dorso'
  | 'url_foto_selfie_con_documento'
  | 'url_video_verificacion'
  | 'ip_verificacion'
> & {
  puede_enviar: boolean;
  mensaje_estado: string;
};

/**
 * Respuesta de GET /kyc/status cuando NO existe registro para el usuario.
 *
 * El controlador retorna este objeto mínimo directamente (sin modelo):
 *   { success: true, estado_verificacion: 'NO_INICIADO', mensaje: '...', puede_enviar: true }
 *
 * success no se incluye aquí porque es parte del envelope genérico de la API,
 * no es un dato del modelo KYC y el frontend nunca lo consume.
 */
export interface KycStatusNoRecord {
  estado_verificacion: 'NO_INICIADO';
  mensaje: string;
  puede_enviar: true;
}

/**
 * Tipo unificado de la respuesta de GET /kyc/status.
 *
 * Uso en componentes:
 *   const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';
 *   const puedeEnviar = kycStatus?.puede_enviar ?? true;
 */
export type KycStatusDTO = KycStatusWithRecord | KycStatusNoRecord;

// ==========================================
// 📤 DTOs DE ENTRADA (Envío desde el frontend)
// ==========================================

/**
 * Datos requeridos para enviar una nueva solicitud de verificación.
 * Se convierte a FormData en kyc.service.ts antes de enviarse.
 * Los nombres de los campos coinciden con uploadKYCData.fields() del middleware Multer.
 */
export interface SubmitKycDto {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;

  /** Archivo de imagen (JPG/PNG). Obligatorio. Campo: documento_frente */
  documento_frente: File;
  /** Archivo de imagen. Opcional. Campo: documento_dorso */
  documento_dorso?: File;
  /** Selfie sosteniendo el documento. Obligatorio. Campo: selfie_con_documento */
  selfie_con_documento: File;
  /** Video corto de prueba de vida. Opcional. Campo: video_verificacion */
  video_verificacion?: File;

  // Geo-localización del usuario al momento de enviar
  latitud_verificacion?: number;
  longitud_verificacion?: number;
}

/**
 * Body requerido por el administrador para rechazar una solicitud.
 * Se envía como JSON en POST /kyc/reject/:idUsuario
 */
export interface RejectKycDTO {
  motivo_rechazo: string;
}
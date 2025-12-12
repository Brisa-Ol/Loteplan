import type { BaseDTO } from './base.dto';

// ✅ CORRECCIÓN: Agregado 'NO_INICIADO' para manejar el estado inicial sin errores de tipo
export type EstadoVerificacion = 'NO_INICIADO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'LICENCIA';

/**
 * DTO DE SALIDA (Completo)
 * Lo que recibes de: GET /kyc/pending (para Admin)
 */
export interface KycDTO extends BaseDTO {
  id_usuario: number;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  
  // URLs de las imágenes (vienen del backend)
  url_foto_documento_frente: string;
  url_foto_documento_dorso: string | null;
  url_foto_selfie_con_documento: string;
  url_video_verificacion: string | null;
  
  estado_verificacion: EstadoVerificacion;
  id_verificador?: number;
  fecha_verificacion?: string;
  motivo_rechazo?: string;
  
  // Opcional: Datos del usuario (si el backend hace include)
  usuario?: {
    email: string;
    nombre_usuario: string;
  };
}

/**
 * DTO DE SALIDA (Parcial - para Usuario)
 * Lo que recibes de: GET /kyc/status
 * (Es igual al KycDTO pero OMITIMOS las URLs por seguridad o limpieza en la vista del usuario)
 */
export type KycStatusDTO = Omit<
  KycDTO, 
  | 'url_foto_documento_frente'
  | 'url_foto_documento_dorso'
  | 'url_foto_selfie_con_documento'
  | 'url_video_verificacion'
>;

/**
 * DTO DE ENTRADA (Admin)
 * Lo que envías en: POST /reject/:idUsuario
 */
export interface RejectKycDTO {
  motivo_rechazo: string;
}

/**
 * DTO PARA RESPUESTAS GENÉRICAS
 */
export interface KycResponse {
  message: string;
}

export interface SubmitKycDto {
  // Datos del formulario
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  
  // Archivos (FormData)
  documento_frente: File;
  documento_dorso?: File;
  selfie_con_documento: File;
  video_verificacion?: File;
  
  // Opcional: Geolocalización
  latitud_verificacion?: number;
  longitud_verificacion?: number;
}
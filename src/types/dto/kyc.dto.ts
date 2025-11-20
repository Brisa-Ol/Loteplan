import type { BaseDTO } from "./base.dto";

export type KycStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'NO_INICIADO';

// Respuesta del backend al consultar el estado
export interface KycStatusResponseDto extends BaseDTO {
  id_usuario: number;
  estado_verificacion: KycStatus;
  comentarios_rechazo?: string; // Razón si fue rechazada
  fecha_solicitud: string;
}

// Datos para el formulario de subida
export interface SubmitKycDto {
  documento_frente: File;
  documento_dorso: File;
  selfie_con_documento: File;
  video_verificacion: File;
}
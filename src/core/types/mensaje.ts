import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs
// ==========================================

export interface CreateMensajeDto {
  id_receptor: number;
  contenido: string;
}

// ==========================================
// 📥 RESPONSE DTOs
// ==========================================

export interface UsuarioMensajeDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export interface MensajeDto extends BaseDTO {
  id_remitente: number;
  id_receptor: number;
  contenido: string;
  fecha_envio: string; // ISO Date
  leido: boolean;

  // Relaciones (Include del backend)
  remitente?: UsuarioMensajeDto;
  receptor?: UsuarioMensajeDto;
}


export interface ConteoNoLeidosDto {
  conteo: number;
}
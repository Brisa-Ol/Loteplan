
import type { UserDto } from "./auth.dto";
import type { BaseDTO } from "./base.dto";

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================


export interface EnviarMensajeDto {
  id_receptor: number;
  contenido: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Representación de un Mensaje.
 */
export interface MensajeDto extends BaseDTO {
  id_remitente: number;
  id_receptor: number;
  contenido: string;
  fecha_envio: string; // ISO Date
  leido: boolean;
  
  // El backend incluye los modelos asociados en 'obtenerPorUsuario'
  // Hacemos estos campos opcionales (?) porque no siempre vienen en todas las consultas
  remitente?: Partial<UserDto>; 
  receptor?: Partial<UserDto>;
}

/**
 * Respuesta del conteo de no leídos
 */
export interface ConteoNoLeidosResponse {
  conteo: number;
}

// ==========================================
// 🛠️ CONSTANTES DE SISTEMA
// ==========================================

// ID reservado que usas en el backend para mensajes automáticos
export const SYSTEM_USER_ID = 2;
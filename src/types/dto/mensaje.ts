// src/types/dto/mensaje.dto.ts
import type { BaseDTO } from './base.dto';
import type { UsuarioDTO } from './usuario.dto'; // Importamos el DTO seguro de Usuario

/**
 * ❗ DTO DE SALIDA (ACTUALIZADO)
 * Representa el mensaje que RECIBIMOS del backend.
 *
 * Tu backend service ('obtenerPorUsuario') usa 'include' para
 * adjuntar los objetos 'remitente' y 'receptor',
 * así que los definimos aquí.
 */
export interface MensajeDTO extends BaseDTO {
  // --- Atributos de BaseDTO ---
  // id: number;
  // activo: boolean;
  // createdAt?: string;
  // updatedAt?: string;

  // --- Atributos específicos de Mensaje ---
  id_remitente: number;
  id_receptor: number;
  contenido: string;
  fecha_envio: string; // Se recibe como un string ISO
  leido: boolean;

  /**
   * ❗ Campos del 'include'
   * Estos objetos son añadidos por tu backend service.
   * Son opcionales (?) por si alguna consulta no los incluye.
   */
  remitente?: UsuarioDTO; // El objeto del usuario que envió
  receptor?: UsuarioDTO;  // El objeto del usuario que recibió
}

/**
 * ❗ DTO DE ENTRADA (NUEVO)
 * Datos que el frontend ENVÍA para crear un nuevo mensaje.
 * (Basado en la función 'crear' de tu backend).
 */
export interface CreateMensajeDTO {
  id_receptor: number;
  contenido: string;
  // 'id_remitente' lo pone el backend (basado en el token del usuario logueado)
}
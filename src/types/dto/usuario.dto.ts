// src/types/dto/usuario.dto.ts (CORREGIDO - FUENTE DE VERDAD)
import type { BaseDTO } from './base.dto';

export type UserRole = 'admin' | 'cliente';

/**
 * ❗ DTO DE SALIDA (Completo)
 * Esta es la definición principal de un Usuario, basada en models/Usuario.js
 */
export interface UsuarioDTO extends BaseDTO {
  activo: boolean;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;                // 👈 Corregido: Es obligatorio
  nombre_usuario: string;
  rol: UserRole;
  fecha_registro: string;     // 👈 CORREGIDO: Nunca es null
  numero_telefono: string;    // 👈 Corregido: Es obligatorio
  is_2fa_enabled: boolean;
  confirmado_email: boolean;
}

/**
 * ❗ DTO DE ENTRADA (PUT /api/usuarios/me)
 * Datos que un CLIENTE envía para actualizar su propio perfil.
 */
export interface UpdateProfileDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  // ❗ Tu backend (usuario.controller.js) usa 'telefono'
  telefono?: string;
  nombre_usuario?: string;
}

/**
 * ❗ DTO DE ENTRADA (PUT /api/usuarios/:id)
 * Datos que un ADMIN envía para actualizar el perfil de CUALQUIER usuario.
 */
export interface UpdateUserByAdminDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string; // ❗ Tu backend (usuario.controller.js) usa 'telefono'
  activo?: boolean;
  rol?: UserRole;
  nombre_usuario?: string;
}

/**
 * ❗ DTO DE ENTRADA (POST /api/usuarios)
 * Datos que un ADMIN usa para crear un nuevo usuario.
 */
export interface CreateUsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  contraseña: string; // Tu backend (auth.controller) espera 'contraseña'
  rol: UserRole;
  numero_telefono: string;
}

/**
 * ❗ DTO DE ENTRADA (GET /api/usuarios/search)
 * Parámetros de query para buscar usuarios.
 */
export interface SearchUsuarioParams {
  q: string;
}
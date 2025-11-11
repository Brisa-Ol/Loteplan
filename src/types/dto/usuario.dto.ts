// src/types/dto/usuario.dto.ts

import type { BaseDTO } from './base.dto';

/**
 * Define los roles de usuario para toda la aplicación.
 */
export type UserRole = 'admin' | 'cliente';

/**
 * DTO DE SALIDA
 */
export interface UsuarioDTO extends BaseDTO {
  // id y activo son heredados de BaseDTO
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  rol: UserRole; // Usa el tipo definido arriba
  fecha_registro: string | null;
  numero_telefono: string;
  is_2fa_enabled: boolean;
  confirmado_email: boolean;
  activo: boolean;
}

/**
 * ❗ DTO DE ENTRADA (PUT /api/usuarios/me)
 * Datos que un CLIENTE envía para actualizar su propio perfil.
 */
export interface UpdateProfileDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
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
  telefono?: string;
  activo?: boolean;
  rol?: UserRole; // ⬅️ Usa el tipo
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
  contraseña: string; // El backend se encargará del hash
  rol: UserRole; // ⬅️ Usa el tipo
  numero_telefono: string;
}

/**
 * ❗ DTO DE ENTRADA (GET /api/usuarios/search)
 * Parámetros de query para buscar usuarios.
 */
export interface SearchUsuarioParams {
  q: string;
}

/**
 * ❗ DTO DE ENTRADA (Añadido)
 * Datos para solicitar el reenvío del email de confirmación.
 * (Usado por auth.service.ts)
 */
export interface ResendConfirmationDTO {
  email: string;
}
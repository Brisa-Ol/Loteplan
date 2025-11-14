// src/types/dto/usuario.dto.ts

import type { BaseDTO } from "./base.dto";

export type UserRole = "admin" | "cliente";

// ══════════════════════════════════════════════════════════
// DTO DE SALIDA (Completo)
// ══════════════════════════════════════════════════════════

/**
 * DTO completo del usuario según el modelo backend (models/Usuario.js)
 * Usado para: GET /usuarios/me, GET /usuarios/:id, etc.
 */
export interface UsuarioDTO extends BaseDTO {
  activo: boolean;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  rol: UserRole;
  fecha_registro: string; // ISO date string
  numero_telefono: string;
  is_2fa_enabled: boolean;
  confirmado_email: boolean;
}

// ══════════════════════════════════════════════════════════
// DTO DE ENTRADA (PUT /usuarios/me)
// ══════════════════════════════════════════════════════════

/**
 * Datos que un CLIENTE puede actualizar de su propio perfil
 * Backend: usuario.controller.js updateMe() línea 110
 */
export interface UpdateProfileDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string; // ⚠️ Tu controller usa 'telefono' pero el modelo es 'numero_telefono'
  nombre_usuario?: string;
}

// ══════════════════════════════════════════════════════════
// DTO DE ENTRADA (PUT /usuarios/:id)
// ══════════════════════════════════════════════════════════

/**
 * Datos que un ADMIN puede actualizar de cualquier usuario
 * Backend: usuario.controller.js update() línea 60
 */
export interface UpdateUserByAdminDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string; // ⚠️ Tu controller usa 'telefono' pero el modelo es 'numero_telefono'
  activo?: boolean;
  rol?: UserRole;
  nombre_usuario?: string;
}

// ══════════════════════════════════════════════════════════
// DTO DE ENTRADA (POST /usuarios)
// ══════════════════════════════════════════════════════════

/**
 * Datos para crear un nuevo usuario (solo ADMIN)
 * Backend: usuario.controller.js create()
 */
export interface CreateUsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  contraseña: string;
  rol: UserRole;
  numero_telefono: string;
}

// ══════════════════════════════════════════════════════════
// DTO DE BÚSQUEDA
// ══════════════════════════════════════════════════════════

/**
 * Parámetros de query para buscar usuarios
 * Backend: GET /usuarios/search?q=...
 */
export interface SearchUsuarioParams {
  q: string;
}
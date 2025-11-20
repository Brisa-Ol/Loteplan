

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

import type { BaseDTO } from "./base.dto";

/**
 * Datos que el PROPIO usuario puede actualizar.
 */
export interface UpdateProfileDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string; 
  nombre_usuario?: string;
}

/**
 * Datos que un ADMIN puede actualizar en otro usuario.
 */
export interface UpdateUserAdminDto extends UpdateProfileDto {
  rol?: 'admin' | 'cliente';
  activo?: boolean;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Modelo completo de Usuario (seguro para frontend).
 * No incluye hashes ni secretos.
 */
export interface UsuarioDto extends BaseDTO {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  numero_telefono: string;
  rol: 'admin' | 'cliente';
  
  // Estados
  activo: boolean;
  confirmado_email: boolean;
  is_2fa_enabled: boolean;
  
  fecha_registro?: string; // ISO Date
}
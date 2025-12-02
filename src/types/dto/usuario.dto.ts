import { type BaseDTO } from './base.dto';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Backend)
// ==========================================

/**
 * Datos para registrar un nuevo usuario.
 * Backend: usuarioService.create()
 * ✅ VALIDADO: Coincide 100% con tu modelo de BD
 */
export interface CreateUsuarioDto {
  nombre_usuario: string;
  email: string;
  contraseña: string; // Se hashea en el backend antes de guardar
  dni: string;
  nombre: string;
  apellido: string;
  numero_telefono: string; // ✅ Coincide con BD
  rol?: 'cliente' | 'admin'; 
}

/**
 * Datos que el Admin puede actualizar de cualquier usuario.
 * Backend: usuarioController.update() con filtro allowedAdminFields
 * ✅ VALIDADO: Todos estos campos están en el filtro del controller
 * ⚠️ NOTA CRÍTICA: Tu backend controller DEBE tener "numero_telefono", NO "telefono"
 */
export interface UpdateUserAdminDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  nombre_usuario?: string;
  numero_telefono?: string; // ✅ CORRECTO - Coincide con BD
  rol?: 'cliente' | 'admin';
  activo?: boolean;
}

/**
 * Datos que el Usuario puede actualizar de sí mismo.
 * Backend: usuarioController.updateMe() con filtro allowedUserFields
 * ✅ VALIDADO: Coincide con el filtro del backend
 */
export interface UpdateUserMeDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string; // ✅ CORRECTO
  nombre_usuario?: string;
}

/**
 * DTO para la acción de deshabilitar 2FA.
 * Backend: usuarioController.adminReset2FA()
 * ✅ VALIDADO: El campo justificacion es opcional en el backend
 */
export interface AdminDisable2FADto {
  justificacion?: string; 
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes del Backend)
// ==========================================

/**
 * Usuario completo devuelto por la API.
 * ✅ VALIDADO: Coincide 100% con tu modelo Usuario.js
 */
export interface UsuarioDto extends BaseDTO {
  // Credenciales
  nombre_usuario: string;
  email: string;
  rol: 'cliente' | 'admin';
  
  // Estados de seguridad
  confirmado_email: boolean;
  is_2fa_enabled: boolean;
  activo: boolean;
  
  // Datos personales
  nombre: string;
  apellido: string;
  dni: string;
  numero_telefono: string; // ✅ Coincide con BD
  
  // Fechas (del modelo Sequelize)
  fecha_registro?: string; // DataTypes.DATE
  createdAt?: string;      // Sequelize automático
  updatedAt?: string;      // Sequelize automático

}
import { type BaseDTO } from './base.dto';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Backend)
// ==========================================

/**
 * Datos para registrar un nuevo usuario.
 * Coincide con usuarioService.create
 */
export interface CreateUsuarioDto {
  nombre_usuario: string;
  email: string;
  contraseña: string; // Se envía plana, el servicio la hashea antes de guardar como contraseña_hash
  dni: string;
  nombre: string;
  apellido: string;
  numero_telefono: string; // ✅ ALINEADO CON BD
  rol?: 'cliente' | 'admin'; 
}

/**
 * Datos que el Admin puede actualizar de cualquier usuario.
 */
export interface UpdateUserAdminDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  nombre_usuario?: string;
  numero_telefono?: string; // ✅ CORREGIDO: Debe ser numero_telefono para que Sequelize lo tome
  rol?: 'cliente' | 'admin';
  activo?: boolean;
}

/**
 * Datos que el Usuario puede actualizar de sí mismo.
 */
export interface UpdateUserMeDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string; // ✅ CORREGIDO
  nombre_usuario?: string;
}

/**
 * DTO para la acción de deshabilitar 2FA.
 */
export interface AdminDisable2FADto {
  justificacion?: string; 
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes del Backend)
// ==========================================

/**
 * Usuario completo devuelto por la API.
 */
export interface UsuarioDto extends BaseDTO {
  nombre_usuario: string;
  email: string;
  rol: 'cliente' | 'admin';
  
  // Estados
  confirmado_email: boolean;
  is_2fa_enabled: boolean;
  activo: boolean;
  
  // Datos personales
  nombre: string;
  apellido: string;
  dni: string;
  numero_telefono: string; // ✅ ALINEADO CON BD
  
  // Fechas
  fecha_registro?: string;
  ultima_actualizacion?: string;
  
  // Opcional: Si devuelves tokens (aunque no recomendado en el DTO general)
  // confirmacion_token?: string; 
}

/**
 * Estadísticas para el Dashboard.
 */
export interface UserStatsDTO {
  nuevos_ultimos_7_dias: number;
  total_usuarios: number;
  activos: number;
  inactivos: number;
}
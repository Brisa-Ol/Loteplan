import { type BaseDTO } from './base.dto';

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al Backend)
// ==========================================

/**
 * Datos necesarios para registrar un nuevo usuario desde el panel de administración.
 * Endpoint: POST /usuarios
 */
export interface CreateUsuarioDto {
  /** Nombre de usuario único (min 4 caracteres). */
  nombre_usuario: string;
  /** Correo electrónico único. */
  email: string;
  /** Contraseña en texto plano (se hashea en el servidor). */
  contraseña: string;
  /** DNI único (solo números). */
  dni: string;
  nombre: string;
  apellido: string;
  /** Número de teléfono móvil. */
  numero_telefono: string;
  /** Nivel de acceso. Por defecto es 'cliente'. */
  rol?: 'cliente' | 'admin'; 
}

/**
 * Datos que un Administrador puede modificar de cualquier usuario.
 * Endpoint: PUT /usuarios/:id
 */
export interface UpdateUserAdminDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  nombre_usuario?: string;
  numero_telefono?: string;
  rol?: 'cliente' | 'admin';
  /** Permite activar/desactivar (banear) al usuario. */
  activo?: boolean;
}

/**
 * Datos que un Usuario puede modificar de su propio perfil.
 * Endpoint: PUT /usuarios/me
 * Nota: No puede modificar su DNI, rol ni estado activo.
 */
export interface UpdateUserMeDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  numero_telefono?: string;
  nombre_usuario?: string;
}

/**
 * Datos para la acción administrativa de resetear el 2FA de un usuario.
 * Endpoint: PATCH /usuarios/:id/reset-2fa
 */
export interface AdminDisable2FADto {
  /** Razón del reseteo (opcional, para auditoría futura). */
  justificacion?: string; 
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes del Backend)
// ==========================================

/**
 * Representación completa de un Usuario en el sistema.
 * Coincide con el modelo de base de datos 'Usuario'.
 */
export interface UsuarioDto extends BaseDTO {
  // Credenciales y Acceso
  nombre_usuario: string;
  email: string;
  rol: 'cliente' | 'admin';
  
  // Estados de Seguridad
  /** Indica si validó su email. */
  confirmado_email: boolean;
  /** Indica si tiene la autenticación de dos pasos activada. */
  is_2fa_enabled: boolean;
  /** Si es false, el usuario está "baneado" o eliminado lógicamente. */
  activo: boolean;
  
  // Datos Personales
  nombre: string;
  apellido: string;
  dni: string;
  numero_telefono: string;
  
  // Metadatos (Sequelize)
  fecha_registro?: string;
  createdAt?: string;
  updatedAt?: string;
}
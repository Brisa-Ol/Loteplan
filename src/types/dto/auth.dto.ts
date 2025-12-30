import { type BaseDTO } from './base.dto'; 

// ==========================================
// 📤 REQUEST DTOs (Peticiones al servidor)
// ==========================================

/**
 * Datos necesarios para registrar un nuevo usuario en la plataforma.
 * Se utiliza en el formulario de registro público.
 */
export interface RegisterRequestDto {
  /** Nombre de usuario único en el sistema. Mínimo 4 caracteres. */
  nombre_usuario: string;
  /** Correo electrónico válido y único. Se usará para confirmación. */
  email: string;
  /** Contraseña segura. Debe contener mayúscula, minúscula y número. Mínimo 8 caracteres. */
  contraseña: string;
  /** Documento Nacional de Identidad. Solo números (7-8 dígitos). */
  dni: string; 
  /** Nombre real del usuario (Perfil). */
  nombre: string;
  /** Apellido real del usuario (Perfil). */
  apellido: string;
  /** Número de teléfono móvil. Solo números. Útil para contacto o validaciones futuras. */
  numero_telefono: string;
}

/**
 * Credenciales para el primer paso del inicio de sesión.
 */
export interface LoginRequestDto {
  /** Puede ser el `nombre_usuario` o el `email`. */
  identificador: string; 
  /** Contraseña en texto plano (se hashea en el backend). */
  contraseña: string;
}

/**
 * Datos para el segundo paso del login (si se requiere 2FA).
 */
export interface Verify2faRequestDto {
  /** Token JWT temporal (con vida corta) recibido en el paso 1 del login (Status 202). */
  twoFaToken: string;
  /** Código TOTP de 6 dígitos generado por la app autenticadora del usuario. */
  token: string;
}

/**
 * Solicitud para reenviar el correo de activación de cuenta.
 */
export interface ResendConfirmationDto {
  email: string;
}

/**
 * Solicitud para iniciar el flujo de "Olvidé mi contraseña".
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * Datos para establecer una nueva contraseña tras validar el token de email.
 */
export interface ResetPasswordDto {
  nueva_contraseña: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Respuestas del servidor)
// ==========================================

/**
 * Representación completa del usuario en el frontend.
 * Se extiende de BaseDTO (id, activo, timestamps).
 */
export interface UserDto extends BaseDTO {
  nombre_usuario: string;
  email: string;
  /** Rol del usuario para control de acceso (RBAC). */
  rol: 'cliente' | 'admin'; 
  /** Indica si el usuario completó la validación por correo. */
  confirmado_email: boolean;
  /** Indica si el usuario tiene activado el Doble Factor de Autenticación. */
  is_2fa_enabled: boolean;
  
  // Datos de perfil opcionales
  nombre?: string;
  apellido?: string;
  dni?: string;
  numero_telefono?: string;
}

/**
 * Respuesta estándar para operaciones que no devuelven datos complejos.
 * Usada en: Logout, Reenvío de email, Reset password, etc.
 */
export interface GenericResponseDto {
  /** Mensaje de éxito descriptivo para mostrar al usuario. */
  message: string;
  /** Mensaje de error (opcional) en caso de fallo controlado. */
  error?: string;
}

/**
 * Escenario A: Login Exitoso Directo (Status 200).
 * El usuario NO tiene 2FA activo o está dentro del periodo de confianza (15 días).
 */
export interface LoginSuccessResponse {
  message: string;
  /** Token JWT de sesión completa (con permisos de rol). */
  token: string;
  /** Datos del usuario logueado. */
  user: UserDto;
  /** Bandera explícita indicando que NO se requiere paso adicional. */
  is2FARequired?: false;
}

/**
 * Escenario B: Login Requiere 2FA (Status 202).
 * El usuario tiene 2FA activo y expiró su sesión de confianza.
 */
export interface Login2FARequiredResponse {
  message: string;
  /** Token JWT temporal. SOLO sirve para validar el endpoint `/auth/2fa/verify`. */
  twoFaToken: string; 
  /** Bandera que activa el modal de código TOTP en el frontend. */
  is2FARequired: true;
  /** Datos mínimos del usuario (usualmente solo ID) por seguridad. */
  user: { id: number };
}

/**
 * Tipo Unión para la respuesta del Login.
 * El frontend debe verificar `is2FARequired` para decidir el flujo.
 */
export type LoginResponseDto = LoginSuccessResponse | Login2FARequiredResponse;
// src/types/dto/auth.types.ts

import type { UsuarioDTO } from "./usuario.dto";

// ══════════════════════════════════════════════════════════
// USER TYPE (Alias de UsuarioDTO)
// ══════════════════════════════════════════════════════════

export type User = UsuarioDTO;
export type UserRole = "admin" | "cliente";

// ══════════════════════════════════════════════════════════
// LOGIN & REGISTER
// ══════════════════════════════════════════════════════════

/**
 * Credenciales para iniciar sesión
 * Backend: POST /auth/login
 */
export interface LoginCredentials {
  identificador: string; // Email o nombre de usuario
  contraseña: string;
}

/**
 * Datos para registrar un nuevo usuario
 * Backend: POST /auth/register
 */
export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  contraseña: string;
  numero_telefono: string;
}

/**
 * Respuesta de login exitoso SIN 2FA
 * Backend: auth.controller.js línea 132
 */
export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    nombre_usuario: string;
    rol: UserRole;
  };
}

/**
 * Respuesta de login cuando 2FA está activo
 * Backend: auth.controller.js línea 105
 */
export interface Auth2FARequiredResponse {
  message: string;
  twoFaToken: string; // Token temporal para el paso 2
  is2FARequired: true;
  user: {
    id: number;
  };
}

/**
 * Tipo unión para la respuesta de login
 */
export type LoginResponse = AuthResponse | Auth2FARequiredResponse;

// ══════════════════════════════════════════════════════════
// 2FA VERIFICATION (Login Step 2)
// ══════════════════════════════════════════════════════════

/**
 * Datos para verificar el código 2FA durante el login
 * Backend: POST /auth/2fa/verify
 */
export interface Verify2FAData {
  twoFaToken: string; // Token temporal del paso 1
  token: string; // Código TOTP de 6 dígitos
}

// ══════════════════════════════════════════════════════════
// 2FA MANAGEMENT
// ══════════════════════════════════════════════════════════

/**
 * Respuesta al generar un nuevo secreto 2FA
 * Backend: POST /auth/2fa/generate-secret (auth2fa.controller.js línea 40)
 */
export interface TwoFASetupResponse {
  message: string;
  secret: string; // Secreto Base32
  otpauthUrl: string; // URL para generar QR
}

/**
 * Datos para habilitar 2FA (después de escanear el QR)
 * Backend: POST /auth/2fa/enable
 */
export interface TwoFAEnableRequest {
  token: string; // Código TOTP de 6 dígitos para verificar
}

/**
 * Datos para deshabilitar 2FA
 * Backend: POST /auth/2fa/disable
 */
export interface TwoFADisableRequest {
  contraseña: string; // Contraseña actual del usuario
  token: string; // Código TOTP actual de 6 dígitos
}

// ══════════════════════════════════════════════════════════
// PASSWORD RECOVERY
// ══════════════════════════════════════════════════════════

/**
 * Datos para solicitar restablecimiento de contraseña
 * Backend: POST /auth/forgot-password
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Datos para restablecer contraseña con token
 * Backend: POST /auth/reset-password/:token
 */
export interface ResetPasswordData {
  nueva_contraseña: string; // Tu backend espera 'nueva_contraseña'
}

/**
 * Datos para reenviar email de confirmación
 * Backend: POST /auth/reenviar_confirmacion
 */
export interface ResendConfirmationData {
  email: string;
}

// ══════════════════════════════════════════════════════════
// GENERIC RESPONSES
// ══════════════════════════════════════════════════════════

/**
 * Respuesta genérica con mensaje
 */
export interface MessageResponse {
  message: string;
  mensaje?: string; // Algunos endpoints usan 'mensaje' en español
}

// ══════════════════════════════════════════════════════════
// MÉTRICAS Y KPIs DE PROYECTOS (Para Admin Dashboard)
// ══════════════════════════════════════════════════════════

/**
 * Tasa de culminación de proyectos
 * Backend: GET /proyectos/kpi/completion-rate
 */
export interface CompletionRateDTO {
  tasa_culminacion: string; // Porcentaje como string (ej: "75.50")
  total_finalizados: number;
  total_iniciados: number;
}

/**
 * Item de progreso mensual de proyecto
 * Backend: GET /proyectos/kpi/monthly-progress
 */
export interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: "En proceso" | "En Espera" | "Finalizado";
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string; // Porcentaje como string (ej: "45.50")
}

// ══════════════════════════════════════════════════════════
// NOTA IMPORTANTE
// ══════════════════════════════════════════════════════════
// Estas interfaces deberían estar en auth.types.ts porque
// AdminDashboard las importa desde allí.
// 
// En tu archivo auth.types.ts, agrega estas interfaces al final:
//
// export interface CompletionRateDTO { ... }
// export interface MonthlyProgressItem { ... }
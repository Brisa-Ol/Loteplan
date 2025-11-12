// src/types/auth.types.ts (CORREGIDO - YA NO DUPLICA 'USER')

import type { UsuarioDTO } from "./usuario.dto";

// ❗ 1. Importamos la definición real del DTO de usuario


// ❗ 2. 'User' es ahora un alias de 'UsuarioDTO'
export type User = UsuarioDTO;
export type UserRole = 'admin' | 'cliente';

// ══════════════════════════════════════════════════════════
// LOGIN & REGISTER
// ══════════════════════════════════════════════════════════

export interface LoginCredentials {
  identificador: string; // Email o nombre de usuario
  contraseña: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  nombre_usuario: string;
  contraseña: string;
  numero_telefono: string;
}

// ❗ 3. La respuesta de éxito ahora usa 'User' (que es UsuarioDTO)
export interface AuthResponse {
  message: string;
  token: string;
  user: User; // 👈 Ahora usa el tipo completo y correcto
}

export interface Auth2FARequiredResponse {
  message: string;
  twoFaToken: string;
  is2FARequired: true;
  user: {
    id: number;
  };
}

// El tipo 'LoginResponse' que usa tu AuthContext
export type LoginResponse = AuthResponse | Auth2FARequiredResponse;

// ══════════════════════════════════════════════════════════
// 2FA VERIFICATION (Login Step 2)
// ══════════════════════════════════════════════════════════

// Para: POST /auth/2fa/verify
export interface Verify2FAData {
  twoFaToken: string;
  token: string; // Código TOTP de 6 dígitos
}

// ══════════════════════════════════════════════════════════
// 2FA MANAGEMENT
// ══════════════════════════════════════════════════════════

// ❗ Respuesta de tu backend (auth2fa.controller.js, línea 40)
export interface TwoFASetupResponse {
  message: string;
  secret: string;
  otpauthUrl: string;
}

export interface TwoFAEnableRequest {
  token: string;
}

export interface TwoFADisableRequest {
  contraseña: string;
  token: string;
}

// ══════════════════════════════════════════════════════════
// PASSWORD RECOVERY
// ══════════════════════════════════════════════════════════

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  // Tu backend (auth.controller.js, línea 291) espera 'nueva_contraseña'
  nueva_contraseña: string;
}

export interface ResendConfirmationData {
  email: string;
}

// ❗ DTO Genérico para respuestas { message: string }
export interface MessageResponse {
  message: string;
  mensaje?: string;
}

// ══════════════════════════════════════════════════════════
// ADMIN METRICS (Basado en tu backend)
// ══════════════════════════════════════════════════════════

export interface CompletionRateDTO {
  tasa_culminacion: string; // "90.00"
  total_iniciados: number;
  total_finalizados: number;
}

export interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: string;
  meta_suscripciones: number;
  suscripciones_actuales: number;
  porcentaje_avance: string; // "75.00"
}

export interface AdminStatCount {
  total: number;
  activos: number;
}
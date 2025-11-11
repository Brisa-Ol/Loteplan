// src/types/auth.types.ts

// ══════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════
export type UserRole = 'admin' | 'cliente';

// ══════════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════════
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nombre_usuario: string;
  rol: UserRole;
  dni?: string;
  numero_telefono?: string;
  is_2fa_enabled: boolean;
  email_confirmado: boolean;
  activo?: boolean; // usado en dashboard para métricas
}

// ══════════════════════════════════════════════════════════
// LOGIN & REGISTER
// ══════════════════════════════════════════════════════════
export interface LoginCredentials {
  identificador: string;
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

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nombre_usuario: string;
    rol: UserRole;
  };
}

export interface Auth2FARequiredResponse {
  is2FARequired: true;
  twoFaToken: string;
  user: {
    id: number;
  };
}

export type LoginResponse = AuthResponse | Auth2FARequiredResponse;

// ══════════════════════════════════════════════════════════
// 2FA VERIFICATION (Login Step 2)
// ══════════════════════════════════════════════════════════
export interface Verify2FAData {
  twoFaToken: string;
  token: string;
}

// ══════════════════════════════════════════════════════════
// 2FA MANAGEMENT
// ══════════════════════════════════════════════════════════
export interface TwoFASetupResponse {
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
export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  nueva_contraseña: string;
}

export interface ResendConfirmationDTO {
  email: string;
}

// ══════════════════════════════════════════════════════════
// MÉTRICAS ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════
export interface CompletionRateDTO {
  tasa_culminacion: number; // porcentaje
  total_iniciados: number;
  total_finalizados: number;
}

export interface MonthlyProgressItem {
  id: number;
  nombre: string;
  estado: string;
  suscripciones_actuales: number;
  meta_suscripciones: number;
  porcentaje_avance: string; // viene como string desde el backend
}

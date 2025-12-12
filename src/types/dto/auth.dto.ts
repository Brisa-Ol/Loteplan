// src/features/auth/auth.dto.ts
import { type BaseDTO } from './base.dto'; 

// ==========================================
// 📤 REQUEST DTOs (Lo que envías al backend)
// ==========================================

export interface RegisterRequestDto {
  // Campos de cuenta
  nombre_usuario: string;
  email: string;
  contraseña: string;
  dni: string; 
  
  // Campos de perfil personal
  nombre: string;
  apellido: string;
  numero_telefono: string;
}

export interface LoginRequestDto {
  identificador: string; // username o email
  contraseña: string;
}

export interface Verify2faRequestDto {
  twoFaToken: string;
  token: string;
}

export interface ResendConfirmationDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  nueva_contraseña: string;
}

export interface Enable2faDto {
  token: string;
}

// ✅ DTO faltante para disable 2FA
export interface Disable2faDto {
  contraseña: string;
  token: string;
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

export interface UserDto extends BaseDTO {
  nombre_usuario: string;
  email: string;
  rol: 'cliente' | 'admin'; // Coincide con el ENUM del backend
  confirmado_email: boolean;
  is_2fa_enabled: boolean;
  
  // Datos de perfil
  nombre?: string;
  apellido?: string;
  dni?: string;
  numero_telefono?: string;
}

/**
 * Respuesta genérica para mensajes de éxito/error
 * (Usada en logout, reenvío de email, etc.)
 */
export interface GenericResponseDto {
  message: string;
  error?: string;
}

/**
 * Respuesta exitosa de Login (Token final)
 */
export interface LoginSuccessResponse {
  message: string;
  token: string;
  user: UserDto;
  is2FARequired?: false;
}

/**
 * Respuesta intermedia de Login (Requiere 2FA)
 */
export interface Login2FARequiredResponse {
  message: string;
  twoFaToken: string; // Token temporal
  is2FARequired: true;
  user: { id: number };
}

// Unión de tipos para el login
export type LoginResponseDto = LoginSuccessResponse | Login2FARequiredResponse;

/**
 * Datos para generar el QR de 2FA
 */
export interface Generate2faSecretResponse {
  secret: string;
  otpauthUrl: string;
}
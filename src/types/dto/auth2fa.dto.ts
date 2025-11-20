import type { GenericResponseDto } from './auth.dto'; // Reutilizamos la respuesta genérica

// ==========================================
// 📤 REQUEST DTOs (Lo que envías)
// ==========================================

/**
 * Datos necesarios para activar permanentemente el 2FA
 * Endpoint: verifyAndEnable2FA
 */
export interface Enable2faRequestDto {
  token: string; // El código TOTP de 6 dígitos
}

/**
 * Datos necesarios para desactivar el 2FA
 * Requiere contraseña para mayor seguridad
 * Endpoint: disable2FA
 */
export interface Disable2faRequestDto {
  contraseña: string;
  token: string; // El código TOTP de 6 dígitos
}

// ==========================================
// 📥 RESPONSE DTOs (Lo que recibes)
// ==========================================

/**
 * Respuesta al solicitar configurar 2FA.
 * El frontend debe usar 'otpauthUrl' para generar el QR.
 */
export interface Generate2faSecretResponseDto {
  message: string;
  secret: string;      // Clave en texto (para guardado manual si el usuario quiere)
  otpauthUrl: string;  // URL para generar el QR (usar librería 'qrcode')
}

// ==========================================
// 🛡️ INTERFACES DE ERROR (Middleware de Seguridad)
// ==========================================

/**
 * Estructura del error 403 devuelto por checkKYCandTwoFA.
 * El frontend debe interceptar esto para redirigir al usuario.
 */
export interface SecurityRequirementError {
  error: string;
  action_required: 'enable_2fa' | 'complete_kyc';
  kyc_status?: string; // Ejem: 'NO_INICIADO', 'PENDIENTE', 'RECHAZADO'
}
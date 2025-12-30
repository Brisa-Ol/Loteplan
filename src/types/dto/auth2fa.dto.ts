// ==========================================
// 🛡️ DTOs para Gestión de 2FA
// ==========================================

/**
 * Datos necesarios para activar permanentemente el 2FA.
 * Se envía tras escanear el QR para confirmar que el usuario lo configuró bien.
 */
export interface Enable2faRequestDto {
  /** Código TOTP de 6 dígitos actual. */
  token: string; 
}

/**
 * Datos necesarios para desactivar el 2FA.
 * Requiere contraseña para evitar desactivación por sesión secuestrada.
 */
export interface Disable2faRequestDto {
  /** Contraseña actual del usuario. */
  contraseña: string;
  /** Código TOTP de 6 dígitos actual. */
  token: string; 
}

/**
 * Respuesta al solicitar configurar 2FA.
 */
export interface Generate2faSecretResponseDto {
  message: string;
  /** Clave secreta en texto (Base32). Útil si el usuario no puede escanear el QR. */
  secret: string;      
  /** URL con protocolo `otpauth://`. Debe ser convertida a imagen QR por el frontend. */
  otpauthUrl: string;  
}
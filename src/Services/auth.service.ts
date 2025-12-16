import httpService from './httpService'; // Tu instancia personalizada de Axios
import type { AxiosResponse } from 'axios';
import type {
  RegisterRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  Verify2faRequestDto,
  LoginSuccessResponse,
  GenericResponseDto,
  ResendConfirmationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Generate2faSecretResponse,
  Enable2faDto
} from '../types/dto/auth.dto'; // Ajusta la ruta a tus DTOs

const AuthService = {
  
  // =================================================
  // 📝 REGISTRO Y LOGIN
  // =================================================

  /**
   * Registra un nuevo usuario
   */
  register: async (data: RegisterRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/register', data);
  },

  /**
   * Inicia sesión. 
   * ⚠️ OJO: Puede devolver el token final O pedir 2FA.
   * Revisa response.data.is2FARequired en el componente.
   */
  login: async (data: LoginRequestDto): Promise<AxiosResponse<LoginResponseDto>> => {
    return await httpService.post('/auth/login', data);
  },

  /**
   * Paso 2 del Login: Verifica el código TOTP y devuelve el token real
   */
  verify2fa: async (data: Verify2faRequestDto): Promise<AxiosResponse<LoginSuccessResponse>> => {
    return await httpService.post('/auth/2fa/verify', data);
  },

  /**
   * Cierra sesión (El cliente debe borrar el token localmente también)
   */
  logout: async (): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/logout');
  },

  // =================================================
  // 📧 GESTIÓN DE CUENTA (Email / Password)
  // =================================================

  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`/usuario/confirmar/${token}`);
  },

  resendConfirmation: async (data: ResendConfirmationDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/reenviar_confirmacion', data);
  },

  forgotPassword: async (data: ForgotPasswordDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/forgot-password', data);
  },

  resetPassword: async (token: string, data: ResetPasswordDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`/auth/reset-password/${token}`, data);
  },

  // =================================================
  // 🔐 CONFIGURACIÓN 2FA (Perfil de Usuario)
  // =================================================

  /**
   * Genera el secreto y la URL para el código QR
   */
  generate2faSecret: async (): Promise<AxiosResponse<Generate2faSecretResponse>> => {
    return await httpService.post('/auth/2fa/generate-secret');
  },

  /**
   * Activa el 2FA enviando un código de prueba
   */
  enable2fa: async (data: Enable2faDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/enable', data);
  },

  /**
   * Desactiva el 2FA
   */
  disable2fa: async (): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/disable');
  }
  
};
/**
 * Estructura del error cuando el Rate Limiter bloquea al usuario.
 * Status HTTP: 429
 */
export interface RateLimitErrorDto {
  success: false;
  error: string; // Ej: "Demasiados intentos de inicio de sesión fallidos..."
}
export default AuthService;
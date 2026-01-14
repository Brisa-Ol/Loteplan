import type { ForgotPasswordDto, GenericResponseDto, LoginRequestDto, LoginResponseDto, LoginSuccessResponse, RegisterRequestDto, ResendConfirmationDto, ResetPasswordDto, Verify2faRequestDto } from "@/core/types/dto/auth.dto";
import httpService from "../httpService";
import type { AxiosResponse } from "axios";


/**
 * Servicio encargado del ciclo de vida de la autenticación y la cuenta del usuario.
 * Maneja Registro, Login (incluyendo paso 2), Logout y recuperación de contraseñas.
 */
const AuthService = {
  
  // =================================================
  // 📝 REGISTRO Y LOGIN
  // =================================================

  /**
   * Registra un nuevo usuario en la plataforma.
   * @param data - DTO con datos personales y de cuenta (email, dni, password, etc).
   * @returns Respuesta genérica indicando que se envió el email de confirmación.
   */
  register: async (data: RegisterRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/register', data);
  },

  /**
   * Inicia sesión (Paso 1).
   * ⚠️ IMPORTANTE: El backend puede responder con:
   * - 200 OK: Login exitoso (devuelve token final).
   * - 202 Accepted: Requiere 2FA (devuelve `is2FARequired: true` y token temporal).
   * @param data - Credenciales (identificador y contraseña).
   */
  login: async (data: LoginRequestDto): Promise<AxiosResponse<LoginResponseDto>> => {
    return await httpService.post('/auth/login', data);
  },

  /**
   * Paso 2 del Login: Verificación de Código TOTP.
   * Se llama solo si el `login` devolvió `is2FARequired: true`.
   * @param data - Contiene el `twoFaToken` (temporal) y el código de 6 dígitos.
   * @returns Token JWT final con permisos de sesión completos.
   */
  verify2fa: async (data: Verify2faRequestDto): Promise<AxiosResponse<LoginSuccessResponse>> => {
    return await httpService.post('/auth/2fa/verify', data);
  },

  /**
   * Cierra la sesión del usuario en el servidor.
   * Nota: El frontend debe encargarse de borrar el token del almacenamiento local.
   */
  logout: async (): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/logout');
  },

  // =================================================
  // 📧 GESTIÓN DE CUENTA (Email / Password)
  // =================================================

  /**
   * Confirma la cuenta de usuario mediante el token enviado por correo.
   * @param token - Token extraído de la URL del correo de confirmación.
   */
  confirmEmail: async (token: string): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.get(`/auth/confirmar_email/${token}`);
  },

  /**
   * Reenvía el correo de confirmación si el enlace anterior expiró.
   * @param data - Email del usuario.
   */
  resendConfirmation: async (data: ResendConfirmationDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/reenviar_confirmacion', data);
  },

  /**
   * Inicia el flujo de recuperación de contraseña enviando un correo.
   * @param data - Email del usuario.
   */
  forgotPassword: async (data: ForgotPasswordDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/forgot-password', data);
  },

  /**
   * Establece una nueva contraseña utilizando el token de recuperación.
   * @param token - Token recibido por correo.
   * @param data - Nueva contraseña.
   */
  resetPassword: async (token: string, data: ResetPasswordDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post(`/auth/reset-password/${token}`, data);
  },
  
};

export default AuthService;
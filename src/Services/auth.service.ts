// src/services/auth.service.ts

import httpService from "./httpService";
import type {
  LoginCredentials,
  RegisterData,
  Verify2FAData,
  LoginResponse,
  AuthResponse,
  User,
  ForgotPasswordData,
  ResendConfirmationData,
  ResetPasswordData,
  MessageResponse,
} from "../types/dto/auth.types";

const API_ENDPOINT = "/auth";
const TOKEN_KEY = "auth_token";
const TWO_FA_TOKEN_KEY = "two_fa_token";

// ══════════════════════════════════════════════════════════
// TIPOS DE RESPUESTA ESPECÍFICOS DEL BACKEND
// ══════════════════════════════════════════════════════════

type RegisterResponse = MessageResponse & {
  user: {
    id: number;
    nombre_usuario: string;
    email: string;
  };
};

// ══════════════════════════════════════════════════════════
// SERVICIO DE AUTENTICACIÓN
// ══════════════════════════════════════════════════════════

const authService = {
  // ──────────────────────────────────────────────────────────
  // GESTIÓN DE TOKENS (LOCAL STORAGE)
  // ──────────────────────────────────────────────────────────

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  set2FAToken(token: string): void {
    localStorage.setItem(TWO_FA_TOKEN_KEY, token);
  },

  get2FAToken(): string | null {
    return localStorage.getItem(TWO_FA_TOKEN_KEY);
  },

  remove2FAToken(): void {
    localStorage.removeItem(TWO_FA_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // ──────────────────────────────────────────────────────────
  // REGISTRO Y CONFIRMACIÓN DE EMAIL
  // ──────────────────────────────────────────────────────────

  /**
   * Registra un nuevo usuario
   * Backend: POST /auth/register
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const { data: responseData } = await httpService.post<RegisterResponse>(
      `${API_ENDPOINT}/register`,
      data
    );
    return responseData;
  },

  /**
   * Confirma el email del usuario mediante token
   * Backend: GET /auth/confirmar_email/:token
   */
  async confirmEmail(token: string): Promise<MessageResponse> {
    const { data } = await httpService.get<MessageResponse>(
      `${API_ENDPOINT}/confirmar_email/${token}`
    );
    return data;
  },

  /**
   * Reenvía el email de confirmación
   * Backend: POST /auth/reenviar_confirmacion
   */
  async resendConfirmation(
    data: ResendConfirmationData
  ): Promise<MessageResponse> {
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/reenviar_confirmacion`,
      data
    );
    return responseData;
  },

  // ──────────────────────────────────────────────────────────
  // INICIO DE SESIÓN (CON SOPORTE 2FA)
  // ──────────────────────────────────────────────────────────

  /**
   * Inicia sesión con identificador (email o nombre_usuario) y contraseña
   * Backend: POST /auth/login
   * 
   * Retorna:
   * - Auth2FARequiredResponse (status 202) si 2FA está activo
   * - AuthResponse (status 200) si no requiere 2FA
   */
  async login(data: LoginCredentials): Promise<LoginResponse> {
    const { data: response } = await httpService.post<LoginResponse>(
      `${API_ENDPOINT}/login`,
      data
    );

    // Si requiere 2FA, guardar token temporal
    if ("is2FARequired" in response && response.is2FARequired) {
      this.set2FAToken(response.twoFaToken);
    } else {
      // Si no requiere 2FA, guardar token de sesión final
      this.setToken((response as AuthResponse).token);
    }

    return response;
  },

  /**
   * Verifica el código 2FA (Paso 2 del login)
   * Backend: POST /auth/2fa/verify
   */
  async verify2FA(data: Verify2FAData): Promise<AuthResponse> {
    const { data: response } = await httpService.post<AuthResponse>(
      `${API_ENDPOINT}/2fa/verify`,
      data
    );

    // Limpiar token temporal y guardar token de sesión final
    this.remove2FAToken();
    this.setToken(response.token);

    return response;
  },

  // ──────────────────────────────────────────────────────────
  // GESTIÓN DE USUARIO AUTENTICADO
  // ──────────────────────────────────────────────────────────

  /**
   * Obtiene los datos del usuario autenticado
   * Backend: GET /usuarios/me
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await httpService.get<User>("/usuarios/me");
    return data;
  },

  /**
   * Cierra la sesión del usuario (cliente)
   * Backend: POST /auth/logout
   */
  async logoutUser(): Promise<MessageResponse> {
    const { data } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/logout`
    );
    return data;
  },

  /**
   * Cierra la sesión y limpia el almacenamiento local
   */
  logout(): void {
    this.removeToken();
    this.remove2FAToken();
    window.location.href = "/login";
  },

  // ──────────────────────────────────────────────────────────
  // RECUPERACIÓN DE CONTRASEÑA
  // ──────────────────────────────────────────────────────────

  /**
   * Solicita el envío de email para restablecer contraseña
   * Backend: POST /auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordData): Promise<MessageResponse> {
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/forgot-password`,
      data
    );
    return responseData;
  },

  /**
   * Restablece la contraseña usando el token del email
   * Backend: POST /auth/reset-password/:token
   */
  async resetPassword(
    token: string,
    data: ResetPasswordData
  ): Promise<MessageResponse> {
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/reset-password/${token}`,
      data
    );
    return responseData;
  },
};

export { authService };
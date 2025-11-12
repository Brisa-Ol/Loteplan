// src/services/auth.service.ts (CORREGIDO PARA TU httpService)

import httpService from "./httpService";
import type {
  LoginCredentials,
  RegisterData,
  Verify2FAData,
  LoginResponse,
  AuthResponse,
  User,
  TwoFASetupResponse,
  TwoFAEnableRequest,
  TwoFADisableRequest,
  ForgotPasswordData,  // ❗ Usamos 'Data'
  ResendConfirmationData, // ❗ Usamos 'Data'
  ResetPasswordData,    // ❗ Usamos 'Data'
  MessageResponse,
} from "../types/dto/auth.types"; // ❗ Usamos el DTO unificado

const API_ENDPOINT = "/auth";
const TOKEN_KEY = "auth_token";
const TWO_FA_TOKEN_KEY = "two_fa_token";

// ❗ Tu backend (auth.controller.js, línea 46) devuelve esto:
type RegisterResponse = MessageResponse & {
  user: {
    id: number;
    nombre_usuario: string;
    email: string;
  }
};

const authService = {
  // ══════════════════════════════════════════════════════════
  // TOKEN MANAGEMENT (Sin cambios)
  // ══════════════════════════════════════════════════════════

  setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); },
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); },
  removeToken(): void { localStorage.removeItem(TOKEN_KEY); },
  set2FAToken(token: string): void { localStorage.setItem(TWO_FA_TOKEN_KEY, token); },
  get2FAToken(): string | null { return localStorage.getItem(TWO_FA_TOKEN_KEY); },
  remove2FAToken(): void { localStorage.removeItem(TWO_FA_TOKEN_KEY); },
  isAuthenticated(): boolean { return !!this.getToken(); },
  logout(): void {
    this.removeToken();
    this.remove2FAToken();
    window.location.href = "/login";
  },

  // ══════════════════════════════════════════════════════════
  // AUTH OPERATIONS (CORREGIDO)
  // ══════════════════════════════════════════════════════════

  async register(data: RegisterData): Promise<RegisterResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data' de la respuesta de httpService
    const { data: responseData } = await httpService.post<RegisterResponse>(
      `${API_ENDPOINT}/register`, 
      data
    );
    return responseData;
  },

  async login(data: LoginCredentials): Promise<LoginResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: response } = await httpService.post<LoginResponse>(
      `${API_ENDPOINT}/login`,
      data
    );

    // Ahora 'response' ES el objeto JSON (LoginResponse)
    if ("is2FARequired" in response && response.is2FARequired) {
      this.set2FAToken(response.twoFaToken);
    } else {
      this.setToken((response as AuthResponse).token);
    }

    return response;
  },

  async verify2FA(data: Verify2FAData): Promise<AuthResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: response } = await httpService.post<AuthResponse>(
      `${API_ENDPOINT}/2fa/verify`,
      data
    );

    this.remove2FAToken();
    this.setToken(response.token);

    return response;
  },

  async getCurrentUser(): Promise<User> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data } = await httpService.get<User>("/usuarios/me");
    return data;
  },

  // ══════════════════════════════════════════════════════════
  // 2FA MANAGEMENT
  // ══════════════════════════════════════════════════════════

  async generate2FASecret(): Promise<TwoFASetupResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data } = await httpService.post<TwoFASetupResponse>(
      `${API_ENDPOINT}/2fa/generate-secret`
    );
    return data;
  },

  async enable2FA(data: TwoFAEnableRequest): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/2fa/enable`, 
      data
    );
    return responseData;
  },

  async disable2FA(data: TwoFADisableRequest): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/2fa/disable`, 
      data
    );
    return responseData;
  },

  // ══════════════════════════════════════════════════════════
  // EMAIL & PASSWORD RECOVERY
  // ══════════════════════════════════════════════════════════

  async confirmEmail(token: string): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data } = await httpService.get<MessageResponse>(
      `${API_ENDPOINT}/confirmar_email/${token}`
    );
    return data;
  },

  async resendConfirmation(data: ResendConfirmationData): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/reenviar_confirmacion`, 
      data
    );
    return responseData;
  },

  async forgotPassword(data: ForgotPasswordData): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/forgot-password`, 
      data
    );
    return responseData;
  },

  async resetPassword(token: string, data: ResetPasswordData): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/reset-password/${token}`, 
      data
    );
    return responseData;
  },
  
  async logoutUser(): Promise<MessageResponse> {
    // ❗ CORRECCIÓN: Desestructuramos 'data'
    const { data } = await httpService.post<MessageResponse>(`${API_ENDPOINT}/logout`);
    return data;
  },
};

export default authService;
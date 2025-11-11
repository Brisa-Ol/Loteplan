// src/Services/auth.service.ts

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
  ForgotPasswordDTO,
  ResendConfirmationDTO,
  ResetPasswordDTO,
} from "../types/dto/auth.types";

const API_ENDPOINT = "/auth";
const TOKEN_KEY = "auth_token";
const TWO_FA_TOKEN_KEY = "two_fa_token";

const authService = {
  // ══════════════════════════════════════════════════════════
  // 🔐 TOKEN MANAGEMENT
  // ══════════════════════════════════════════════════════════

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

  async logout(): Promise<void> {
    try {
      await httpService.post(`${API_ENDPOINT}/logout`);
    } catch {
      // Ignorar errores si ya expiró la sesión
    } finally {
      this.removeToken();
      this.remove2FAToken();
      window.location.href = "/login";
    }
  },

  // ══════════════════════════════════════════════════════════
  // 👤 AUTH OPERATIONS
  // ══════════════════════════════════════════════════════════

  async register(data: RegisterData): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/register`, data);
  },

  async login(data: LoginCredentials): Promise<LoginResponse> {
    // ✅ CORRECCIÓN: Desestructuramos 'data' del AxiosResponse
    const { data: response } = await httpService.post<LoginResponse>(
      `${API_ENDPOINT}/login`,
      data
    );

    // Verificamos si el backend exige 2FA
    if ("is2FARequired" in response && response.is2FARequired) {
      if (response.twoFaToken) {
        this.set2FAToken(response.twoFaToken);
      }
    } else if ("token" in response && response.token) {
      this.setToken(response.token);
    }

    return response;
  },

  async verify2FA(data: Verify2FAData): Promise<AuthResponse> {
    const { data: response } = await httpService.post<AuthResponse>(
      `${API_ENDPOINT}/2fa/verify`,
      data
    );

    if (response.token) {
      this.remove2FAToken();
      this.setToken(response.token);
    }

    return response;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await httpService.get<User>("/usuarios/me");
    return data;
  },

  // ══════════════════════════════════════════════════════════
  // 🔢 2FA MANAGEMENT
  // ══════════════════════════════════════════════════════════

  async generate2FASecret(): Promise<TwoFASetupResponse> {
    const { data } = await httpService.post<TwoFASetupResponse>(
      `${API_ENDPOINT}/2fa/generate-secret`
    );
    return data;
  },

  async enable2FA(data: TwoFAEnableRequest): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/2fa/enable`, data);
  },

  async disable2FA(data: TwoFADisableRequest): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/2fa/disable`, data);
  },

  // ══════════════════════════════════════════════════════════
  // 📧 EMAIL & PASSWORD RECOVERY
  // ══════════════════════════════════════════════════════════

  async confirmEmail(token: string): Promise<void> {
    await httpService.get(`${API_ENDPOINT}/confirmar_email/${token}`);
  },

  async resendConfirmation(data: ResendConfirmationDTO): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/reenviar_confirmacion`, data);
  },

  async forgotPassword(data: ForgotPasswordDTO): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/forgot-password`, data);
  },

  async resetPassword(token: string, data: ResetPasswordDTO): Promise<void> {
    await httpService.post(`${API_ENDPOINT}/reset-password/${token}`, data);
  },
};

export default authService;
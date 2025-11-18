// src/services/auth2fa.service.ts

import httpService from "./httpService";
import type {
  TwoFASetupResponse,
  TwoFAEnableRequest,
  TwoFADisableRequest,
  MessageResponse,
} from "../types/dto/auth.types";

const API_ENDPOINT = "/auth/2fa";

// ══════════════════════════════════════════════════════════
// SERVICIO DE AUTENTICACIÓN DE DOS FACTORES (2FA)
// ══════════════════════════════════════════════════════════

const auth2faService = {
  // ──────────────────────────────────────────────────────────
  // GENERACIÓN Y CONFIGURACIÓN DE 2FA
  // ──────────────────────────────────────────────────────────

  /**
   * Genera un nuevo secreto 2FA y la URL del código QR
   * Backend: POST /auth/2fa/generate-secret
   * Requiere: JWT de sesión normal
   */
  async generateSecret(): Promise<TwoFASetupResponse> {
    const { data } = await httpService.post<TwoFASetupResponse>(
      `${API_ENDPOINT}/generate-secret`
    );
    return data;
  },

  /**
   * Verifica el código TOTP y habilita 2FA permanentemente
   * Backend: POST /auth/2fa/enable
   * Requiere: JWT de sesión normal
   */
  async enable(data: TwoFAEnableRequest): Promise<MessageResponse> {
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/enable`,
      data
    );
    return responseData;
  },

  /**
   * Deshabilita el 2FA (requiere contraseña y código TOTP actual)
   * Backend: POST /auth/2fa/disable
   * Requiere: JWT de sesión normal
   */
  async disable(data: TwoFADisableRequest): Promise<MessageResponse> {
    const { data: responseData } = await httpService.post<MessageResponse>(
      `${API_ENDPOINT}/disable`,
      data
    );
    return responseData;
  },
};

export { auth2faService };
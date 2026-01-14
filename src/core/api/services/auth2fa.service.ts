import type { Disable2faRequestDto, Enable2faRequestDto, Generate2faSecretResponseDto } from "@/core/types/dto/auth2fa.dto";
import httpService from "../httpService";
import type { GenericResponseDto } from "@/core/types/dto/auth.dto";
import type { AxiosResponse } from "axios";

/**
 * Servicio dedicado a la GESTIÓN de la configuración de 2FA en el perfil del usuario.
 * No maneja el login, sino la activación/desactivación de la seguridad.
 */
const Auth2faService = {
  
  /**
   * Paso 1 de Activación: Generar secreto.
   * Solicita al backend generar un secreto TOTP temporal.
   * @returns Objeto con la URL `otpauth` para generar el código QR en el frontend.
   */
  generateSecret: async (): Promise<AxiosResponse<Generate2faSecretResponseDto>> => {
    return await httpService.post('/auth/2fa/generate-secret');
  },

  /**
   * Paso 2 de Activación: Confirmar y Habilitar.
   * Envía el código TOTP escaneado para verificar que el usuario configuró bien su app.
   * Si es correcto, el backend activa `is_2fa_enabled = true`.
   * @param data - Contiene el código de 6 dígitos.
   */
  enable: async (data: Enable2faRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/enable', data);
  },

  /**
   * Desactivar 2FA.
   * Requiere la contraseña actual y un código TOTP válido por seguridad.
   * @param data - Contraseña y código TOTP.
   */
  disable: async (data: Disable2faRequestDto): Promise<AxiosResponse<GenericResponseDto>> => {
    return await httpService.post('/auth/2fa/disable', data);
  }
};

export default Auth2faService;
// src/hooks/auth/use2FAManagement.ts
// Hook unificado para gestión completa de 2FA:
// - Login con 2FA (verify)
// - Setup 2FA (generate secret, enable, disable)

import { useState, useCallback } from 'react';
import type { LoginSuccessResponse } from '../../types/dto/auth.dto';
import type { Generate2faSecretResponseDto } from '../../types/dto/auth2fa.dto';
import AuthService from '../../services/auth.service';
import Auth2faService from '../../services/auth2fa.service';


export interface Use2FAManagementReturn {
  // ========== Estado del flujo de LOGIN con 2FA ==========
  requires2FA: boolean;
  twoFaToken: string | null;
  setRequires2FA: (value: boolean) => void;
  setTwoFaToken: (token: string | null) => void;
  verify2FA: (code: string, onSuccess: () => Promise<void>) => Promise<LoginSuccessResponse>;

  // ========== Estado del SETUP de 2FA ==========
  secret: string | null;
  qrCodeUrl: string | null;
  isLoading: boolean;
  error: string | null;

  // ========== Métodos de gestión ==========
  generate2FASecret: () => Promise<Generate2faSecretResponseDto>;
  generateSecret: () => Promise<boolean>; // Alias simplificado que retorna boolean
  enable2FA: (code: string, onSuccess: () => Promise<void>) => Promise<void>;
  enable2FASimple: (token: string) => Promise<boolean>; // Versión simplificada
  disable2FA: (password: string, code: string, onSuccess: () => Promise<void>) => Promise<void>;
  
  // ========== Utilidades ==========
  clearError: () => void;
  reset2FAState: () => void;
}

export const use2FAManagement = (): Use2FAManagementReturn => {
  // ========== Estados del flujo de LOGIN con 2FA ==========
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);

  // ========== Estados del SETUP de 2FA ==========
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Utilidades ==========
  const clearError = useCallback(() => setError(null), []);

  const reset2FAState = useCallback(() => {
    setRequires2FA(false);
    setTwoFaToken(null);
    setSecret(null);
    setQrCodeUrl(null);
    setError(null);
  }, []);

  // ========== VERIFICAR código 2FA durante LOGIN ==========
  const verify2FA = useCallback(
    async (code: string, onSuccess: () => Promise<void>): Promise<LoginSuccessResponse> => {
      if (!twoFaToken) {
        const err = new Error('No hay token de sesión temporal. Vuelva a iniciar sesión.');
        setError(err.message);
        throw err;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data } = await AuthService.verify2fa({
          twoFaToken,
          token: code,
        });

        // Guardar token final
        localStorage.setItem('auth_token', data.token);
        setRequires2FA(false);
        setTwoFaToken(null);
        await onSuccess(); // Callback para recargar usuario

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Código 2FA incorrecto o expirado';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [twoFaToken]
  );

  // ========== GENERAR secreto para configurar 2FA ==========
  const generate2FASecret = useCallback(async (): Promise<Generate2faSecretResponseDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await Auth2faService.generateSecret();
      setSecret(data.secret);
      setQrCodeUrl(data.otpauthUrl);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando secreto 2FA';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== GENERAR secreto (versión simplificada que retorna boolean) ==========
  const generateSecret = useCallback(async (): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      const { data } = await Auth2faService.generateSecret();
      setSecret(data.secret);
      setQrCodeUrl(data.otpauthUrl);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando secreto 2FA';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== ACTIVAR 2FA (versión completa con callback) ==========
  const enable2FA = useCallback(
    async (code: string, onSuccess: () => Promise<void>): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await Auth2faService.enable({ token: code });
        await onSuccess(); // Callback para recargar usuario
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error activando 2FA. Verifique el código.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ========== ACTIVAR 2FA (versión simplificada que retorna boolean) ==========
  const enable2FASimple = useCallback(async (token: string): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    try {
      await Auth2faService.enable({ token });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error activando 2FA. Verifique el código.';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== DESACTIVAR 2FA ==========
  const disable2FA = useCallback(
    async (password: string, code: string, onSuccess: () => Promise<void>): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await Auth2faService.disable({ contraseña: password, token: code });
        await onSuccess(); // Callback para recargar usuario
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desactivando 2FA.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    // Estado LOGIN
    requires2FA,
    twoFaToken,
    setRequires2FA,
    setTwoFaToken,
    verify2FA,

    // Estado SETUP
    secret,
    qrCodeUrl,
    isLoading,
    error,

    // Métodos
    generate2FASecret, // Versión completa que retorna el DTO
    generateSecret, // Versión simplificada que retorna boolean
    enable2FA, // Versión con callback
    enable2FASimple, // Versión simplificada
    disable2FA,

    // Utilidades
    clearError,
    reset2FAState,
  };
};
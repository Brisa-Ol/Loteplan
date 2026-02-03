import { useState, useCallback } from 'react';
import { secureStorage } from '@/shared/utils/secureStorage';
import type { LoginSuccessResponse } from '@/core/types/dto/auth.dto';
import type { Generate2faSecretResponseDto } from '@/core/types/dto/auth2fa.dto';
import Auth2faService from '@/core/api/services/auth2fa.service';
import AuthService from '@/core/api/services/auth.service';
import type { ApiError } from '@/core/api/httpService';

export interface Use2FAManagementReturn {
  requires2FA: boolean;
  twoFaToken: string | null;
  setRequires2FA: (value: boolean) => void;
  setTwoFaToken: (token: string | null) => void;
  verify2FA: (code: string, onSuccess: () => Promise<void>) => Promise<LoginSuccessResponse>;
  
  secret: string | null;
  qrCodeUrl: string | null;
  isLoading: boolean;
  error: string | null;
  
  generate2FASecret: () => Promise<Generate2faSecretResponseDto>;
  enable2FA: (code: string, onSuccess: () => Promise<void>) => Promise<void>;
  disable2FA: (password: string, code: string, onSuccess: () => Promise<void>) => Promise<void>;
  
  clearError: () => void;
  reset2FAState: () => void;
}

export const use2FAManagement = (): Use2FAManagementReturn => {
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);

  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset2FAState = useCallback(() => {
    setRequires2FA(false);
    setTwoFaToken(null);
    setSecret(null);
    setQrCodeUrl(null);
    setError(null);
  }, []);

  const extractMsg = (err: unknown) => (err as ApiError).message || 'Error en operación 2FA';

  const verify2FA = useCallback(
    async (code: string, onSuccess: () => Promise<void>): Promise<LoginSuccessResponse> => {
      if (!twoFaToken) {
        const msg = 'Sesión temporal expirada. Inicie sesión nuevamente.';
        setError(msg);
        throw new Error(msg);
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data } = await AuthService.verify2fa({ twoFaToken, token: code });
        
        // Guardamos el token definitivo
        secureStorage.setToken(data.token);
        
        setRequires2FA(false);
        setTwoFaToken(null);
        await onSuccess(); // Recargar usuario
        return data;
      } catch (err) {
        const msg = extractMsg(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [twoFaToken]
  );

  const generate2FASecret = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await Auth2faService.generateSecret();
      setSecret(data.secret);
      setQrCodeUrl(data.otpauthUrl);
      return data;
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enable2FA = useCallback(async (code: string, onSuccess: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      await Auth2faService.enable({ token: code });
      await onSuccess();
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable2FA = useCallback(async (password: string, code: string, onSuccess: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      await Auth2faService.disable({ contraseña: password, token: code });
      await onSuccess();
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    requires2FA, twoFaToken, setRequires2FA, setTwoFaToken, verify2FA,
    secret, qrCodeUrl, isLoading, error,
    generate2FASecret, enable2FA, disable2FA,
    clearError, reset2FAState,
  };
};
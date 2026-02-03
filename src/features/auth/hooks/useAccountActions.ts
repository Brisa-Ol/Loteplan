import { useState, useCallback } from 'react';
import UsuarioService from '@/core/api/services/usuario.service';
import AuthService from '@/core/api/services/auth.service';
import type { ApiError } from '@/core/api/httpService';

export interface UseAccountActionsReturn {
  isLoading: boolean;
  error: string | null;
  deleteAccount: (twofaCode?: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAccountActions = (logout: () => void): UseAccountActionsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const extractMsg = (err: unknown) => (err as ApiError).message || 'Error en la cuenta';

  const deleteAccount = useCallback(async (twofaCode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await UsuarioService.softDeleteMe(twofaCode);
      logout();
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const resendConfirmation = useCallback(async (email: string) => {
    setError(null);
    try {
      await AuthService.resendConfirmation({ email });
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await AuthService.forgotPassword({ email });
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
      throw err;
    }
  }, []);

  return { isLoading, error, deleteAccount, resendConfirmation, forgotPassword, clearError };
};
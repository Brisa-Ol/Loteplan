// src/hooks/auth/useAccountActions.ts
// Account management: delete, resend confirmation, forgot password

import { useState, useCallback } from 'react';
import UsuarioService from '../../services/usuario.service';
import AuthService from '../../services/auth.service';



export interface UseAccountActionsReturn {
    isLoading: boolean;
    error: string | null;
    deleteAccount: (twofaCode?: string) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

export const useAccountActions = (
    logout: () => void
): UseAccountActionsReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    // Eliminar cuenta (soft delete)
    const deleteAccount = useCallback(async (twofaCode?: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await UsuarioService.softDeleteMe(twofaCode);
            logout();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al desactivar la cuenta';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    // Reenviar email de confirmación
    const resendConfirmation = useCallback(async (email: string): Promise<void> => {
        setError(null);
        try {
            await AuthService.resendConfirmation({ email });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error enviando email de confirmación';
            setError(message);
            throw err;
        }
    }, []);

    // Solicitar recuperación de contraseña
    const forgotPassword = useCallback(async (email: string): Promise<void> => {
        setError(null);
        try {
            await AuthService.forgotPassword({ email });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error solicitando recuperación';
            setError(message);
            throw err;
        }
    }, []);

    return {
        isLoading,
        error,
        deleteAccount,
        resendConfirmation,
        forgotPassword,
        clearError,
    };
};
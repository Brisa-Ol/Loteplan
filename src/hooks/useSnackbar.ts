import { useState, useCallback } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
}

export interface UseSnackbarReturn {
    /** Estado actual del Snackbar */
    snackbar: SnackbarState;
    /** Muestra un mensaje de éxito */
    showSuccess: (message: string) => void;
    /** Muestra un mensaje de error */
    showError: (message: string) => void;
    /** Muestra un mensaje informativo */
    showInfo: (message: string) => void;
    /** Muestra un mensaje de advertencia */
    showWarning: (message: string) => void;
    /** Muestra un mensaje con severidad personalizada */
    showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
    /** Cierra el Snackbar */
    handleClose: () => void;
}

/**
 * Hook para manejar el estado del Snackbar de forma consistente en toda la aplicación.
 * 
 * @example
 * ```tsx
 * const { snackbar, showSuccess, showError, handleClose } = useSnackbar();
 * 
 * // En el handler de éxito
 * showSuccess('Operación completada');
 * 
 * // En el JSX
 * <GlobalSnackbar {...snackbar} onClose={handleClose} />
 * ```
 */
export const useSnackbar = (): UseSnackbarReturn => {
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const showSuccess = useCallback((message: string) => {
        showSnackbar(message, 'success');
    }, [showSnackbar]);

    const showError = useCallback((message: string) => {
        showSnackbar(message, 'error');
    }, [showSnackbar]);

    const showInfo = useCallback((message: string) => {
        showSnackbar(message, 'info');
    }, [showSnackbar]);

    const showWarning = useCallback((message: string) => {
        showSnackbar(message, 'warning');
    }, [showSnackbar]);

    const handleClose = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    return {
        snackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showSnackbar,
        handleClose
    };
};

export default useSnackbar;
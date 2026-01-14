import { useState, useCallback } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
}

export interface UseSnackbarReturn {
    snackbar: SnackbarState;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    showWarning: (message: string) => void;
    showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
    handleClose: () => void;
}

/**
 * Hook optimizado para Snackbar con cierre automático del anterior
 */
export const useSnackbar = (): UseSnackbarReturn => {
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
        // ✅ OPTIMIZACIÓN: Cerrar el anterior antes de abrir uno nuevo
        // Esto evita que se acumulen y mejora la UX
        setSnackbar({ open: false, message: '', severity: 'success' });
        
        // Pequeño delay para permitir la animación de cierre
        setTimeout(() => {
            setSnackbar({ open: true, message, severity });
        }, 50);
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
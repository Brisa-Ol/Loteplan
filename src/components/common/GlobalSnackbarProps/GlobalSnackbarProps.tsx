import React from 'react';
import { Snackbar, Alert, useTheme } from '@mui/material';
import type { SnackbarSeverity } from '../../../hooks/useSnackbar';


export interface GlobalSnackbarProps {
    /** Si el Snackbar está abierto */
    open: boolean;
    /** Mensaje a mostrar */
    message: string;
    /** Nivel de severidad del mensaje */
    severity: SnackbarSeverity;
    /** Callback al cerrar el Snackbar */
    onClose: () => void;
    /** Tiempo en ms antes de auto-cerrar (default: 4000) */
    autoHideDuration?: number;
}

/**
 * Componente Snackbar global estandarizado para toda la aplicación.
 * Usa el estilo "filled" con sombra para consistencia visual.
 * 
 * @example
 * ```tsx
 * const { snackbar, handleClose } = useSnackbar();
 * 
 * <GlobalSnackbar
 *   open={snackbar.open}
 *   message={snackbar.message}
 *   severity={snackbar.severity}
 *   onClose={handleClose}
 * />
 * ```
 */
export const GlobalSnackbar: React.FC<GlobalSnackbarProps> = ({
    open,
    message,
    severity,
    onClose,
    autoHideDuration = 4000
}) => {
    const theme = useTheme();

    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                severity={severity}
                variant="filled"
                onClose={onClose}
                sx={{
                    boxShadow: theme.shadows[4],
                    minWidth: 280,
                    fontWeight: 500
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default GlobalSnackbar;
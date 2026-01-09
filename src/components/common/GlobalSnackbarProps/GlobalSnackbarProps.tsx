// src/components/common/GlobalSnackbar/GlobalSnackbar.tsx

import React from 'react';
import { Snackbar, Alert, useTheme, Slide, type SlideProps } from '@mui/material';
import type { SnackbarSeverity } from '../../../hooks/useSnackbar';

export interface GlobalSnackbarProps {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
    onClose: () => void;
    autoHideDuration?: number;
}

// Helper para la animación de deslizamiento hacia arriba
function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

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
            TransitionComponent={SlideTransition} // ✅ Mejora 1: Animación nativa
            sx={{
                // ✅ Mejora 2: Margen inferior para no pegar con la barra de gestos del móvil
                bottom: { xs: 24, md: 32 } 
            }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{
                    // ✅ Mejora 3: Estética
                    width: '100%',
                    minWidth: { xs: '280px', md: '350px' }, // Un poco más ancho en PC
                    boxShadow: theme.shadows[6], // Sombra más pronunciada para destacar sobre el contenido
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    alignItems: 'center',
                    borderRadius: 2
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default GlobalSnackbar;
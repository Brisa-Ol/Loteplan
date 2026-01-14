import React from 'react';
import { Snackbar, Alert, useTheme, Slide, type SlideProps } from '@mui/material';
import type { SnackbarSeverity } from '../../../../hooks/useSnackbar';

export interface GlobalSnackbarProps {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
    onClose: () => void;
    autoHideDuration?: number;
}

// ✅ Duración reducida para mejor UX (2.5 segundos en vez de 4)
const ENV_DURATION = Number(import.meta.env.VITE_SNACKBAR_DURATION);
const DEFAULT_DURATION = !isNaN(ENV_DURATION) && ENV_DURATION > 0 ? ENV_DURATION : 2500;

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

export const GlobalSnackbar: React.FC<GlobalSnackbarProps> = ({
    open,
    message,
    severity,
    onClose,
    autoHideDuration = DEFAULT_DURATION
}) => {
    const theme = useTheme();

    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            TransitionComponent={SlideTransition}
            // ✅ Animación más rápida (150ms en vez de 200ms)
            transitionDuration={{ enter: 150, exit: 150 }}
            sx={{
                bottom: { xs: 24, md: 32 },
                zIndex: theme.zIndex.tooltip + 100,
            }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                elevation={6}
                sx={{
                    width: '100%',
                    minWidth: { xs: '280px', md: '350px' },
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    alignItems: 'center',
                    borderRadius: 2,
                    color: '#fff'
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default GlobalSnackbar;
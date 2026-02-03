import React from 'react';
import { 
  Snackbar, 
  Alert, 
  useTheme, 
  Slide, 
  type SlideProps, 
  type AlertProps 
} from '@mui/material';
import { env } from '@/core/config/env';


// Tipado directo de MUI para evitar dependencias circulares
export interface GlobalSnackbarProps {
  open: boolean;
  message: string;
  severity: AlertProps['severity']; 
  onClose: () => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const GlobalSnackbar: React.FC<GlobalSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <Snackbar
      open={open}
      // ✅ Usamos la variable de entorno procesada por tu clase EnvConfig
      autoHideDuration={env.snackbarDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      transitionDuration={{ enter: 150, exit: 150 }}
      sx={{
        bottom: { xs: 24, md: 32 },
        // Aseguramos que quede por encima de Modales y Fab buttons
        zIndex: theme.zIndex.modal + 50, 
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
          fontWeight: 600, // Un poco más de peso para legibilidad
          fontSize: '0.9rem',
          alignItems: 'center',
          // ✅ Coherencia visual: 12px igual que tus Cards y Modales
          borderRadius: '12px', 
          color: '#fff',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)', // Sombra suave moderna
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
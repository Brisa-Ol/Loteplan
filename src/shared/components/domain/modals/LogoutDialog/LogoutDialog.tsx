import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Slide,
  Grow,
  useTheme,
  useMediaQuery
} from '@mui/material';

import { Logout as LogoutIcon } from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Transición Slide para móviles
const TransitionSlide = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();
  // Detectar si es móvil
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // Transición adaptativa: Slide en móvil, Grow en escritorio
      TransitionComponent={isMobile ? TransitionSlide : Grow}
      transitionDuration={300}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          p: 2,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          // En móvil, pegar al fondo si se usa Slide, o centrar si se prefiere
          m: 2 
        }
      }}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
    >
      <DialogContent 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          pt: 3,
          pb: 2
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'warning.light',
            color: 'warning.main',
            mb: 2,
            boxShadow: '0 8px 16px rgba(245, 124, 0, 0.15)'
          }}
        >
          <LogoutIcon sx={{ fontSize: 32 }} />
        </Avatar>

        <Typography 
          id="logout-dialog-title"
          variant="h5" 
          gutterBottom 
          fontWeight={700} 
          color="text.primary"
        >
          ¿Cerrar Sesión?
        </Typography>

        <Typography 
          id="logout-dialog-description"
          variant="body1" 
          color="text.secondary"
        >
          Estás a punto de salir de tu cuenta.
        </Typography>
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: 3, 
          pb: 3, 
          pt: 1, 
          display: 'flex',
          // En móvil: Columna (botones apilados). En escritorio: Fila (lado a lado)
          flexDirection: { xs: 'column-reverse', sm: 'row' }, 
          gap: 1.5 
        }}
      >
        {/* Botón Cancelar (Secundario) */}
        <Button 
          onClick={onClose} 
          variant="text" 
          fullWidth
          size="large"
          sx={{ 
            borderRadius: 2,
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          Cancelar
        </Button>

        {/* Botón Confirmar (Principal) */}
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary" 
          fullWidth
          size="large"
          disableElevation
          autoFocus 
          sx={{ 
            borderRadius: 2,
            fontSize: '1rem',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Sí, Cerrar Sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
};
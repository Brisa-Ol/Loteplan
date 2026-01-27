// src/components/common/LogoutDialog/LogoutDialog.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Slide,
  CircularProgress
} from '@mui/material';

import { Logout as LogoutIcon } from '@mui/icons-material';
import type { TransitionProps } from 'node_modules/@mui/material/esm/transitions/transition';

// ════════════════════════════════════════════════════════════
// ✨ UX: TRANSICIÓN SUAVE (Slide Up)
// ════════════════════════════════════════════════════════════
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean; // ✨ Nuevo prop para manejar estado de carga
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ 
  open, 
  onClose, 
  onConfirm,
  isLoading = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ✨ UX: Permitir confirmar con Enter
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose} // Bloquear cierre si carga
      TransitionComponent={Transition} // Animación
      maxWidth="xs"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        elevation: 24, // Sombra profunda para destacar
        sx: {
          borderRadius: 4, // Bordes más redondeados (Estilo iOS/Moderno)
          overflow: 'hidden',
          boxShadow: theme.shadows[10],
          m: 2 // Margen en móvil para que no toque los bordes
        }
      }}
    >
      <DialogContent 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          pt: 5, 
          pb: 3,
          px: 3
        }}
      >
        {/* Avatar con animación sutil al entrar (opcional, pero queda bien el estilo estático) */}
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: alpha(theme.palette.warning.main, 0.08),
            color: theme.palette.warning.main,
            mb: 3,
            boxShadow: `0 0 0 8px ${alpha(theme.palette.warning.main, 0.04)}` // ✨ Efecto de halo sutil
          }}
        >
          <LogoutIcon sx={{ fontSize: 36 }} />
        </Avatar>

        <Typography 
          variant="h5" 
          gutterBottom 
          color="text.primary"
          sx={{ fontWeight: 800 }} // ✨ Consistencia con ConfirmDialog
        >
          ¿Cerrar Sesión?
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '80%' }}>
          Estás a punto de salir de tu cuenta. ¿Estás seguro de que quieres continuar?
        </Typography>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 3,
          pt: 0,
          display: 'flex',
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: 1.5,
          justifyContent: 'center'
        }}
      >
        {/* Botón Cancelar */}
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          variant="text" 
          color="inherit"
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none', // ✨ Texto amigable
            fontWeight: 600,
            color: 'text.secondary',
            px: 3
          }}
        >
          Cancelar
        </Button>

        {/* Botón Confirmar */}
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          variant="contained" 
          color="primary" 
          fullWidth={isMobile}
          disableElevation
          autoFocus 
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            py: 1.2,
            boxShadow: theme.shadows[4],
            minWidth: 140
          }}
        >
          {isLoading ? 'Cerrando...' : 'Sí, Salir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
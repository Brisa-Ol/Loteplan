import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Grow
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Grow}
      transitionDuration={300}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          p: 2,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }
      }}
      // Mejora de accesibilidad
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
        {/* Icono Circular Animado */}
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
          flexDirection: 'column', 
          gap: 1.5 
        }}
      >
        {/* Botón Principal */}
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary" 
          fullWidth
          size="large"
          disableElevation
          autoFocus // El botón primario tiene foco automático
          sx={{ 
            borderRadius: 2,
            fontSize: '1rem',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Sí, Cerrar Sesión
        </Button>

        {/* Botón Secundario */}
        <Button 
          onClick={onClose} 
          variant="text" 
          fullWidth
          size="large"
          sx={{ 
            borderRadius: 2,
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': { 
              bgcolor: 'action.hover' 
            }
          }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
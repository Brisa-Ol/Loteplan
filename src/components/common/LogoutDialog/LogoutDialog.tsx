import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Fade,
  Grow
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Grow} // Animación de entrada suave
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3, // Usa el borderRadius del theme (12px * 2 aprox o ajustado)
          p: 2,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)', // Sombra más dramática para modales
        }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pt: 3 }}>
        
        {/* Icono Circular Animado */}
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'warning.light', // Fondo suave naranjita (del theme)
            color: 'warning.main',    // Icono naranja fuerte
            mb: 2,
            boxShadow: '0 8px 16px rgba(245, 124, 0, 0.15)'
          }}
        >
          <LogoutIcon sx={{ fontSize: 32 }} />
        </Avatar>

        <Typography variant="h5" gutterBottom fontWeight="700" color="text.primary">
          ¿Cerrar Sesión?
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Estás a punto de salir de tu cuenta.
        </Typography>
    
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: 'column', gap: 1.5 }}>
        
        {/* Botón Principal (Primary del Theme #CC6333) */}
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary" 
          fullWidth
          size="large"
          disableElevation
          sx={{ 
            borderRadius: 2,
            fontSize: '1rem'
          }}
        >
          Sí, Cerrar Sesión
        </Button>

        {/* Botón Secundario (Outlined del Theme) */}
        <Button 
          onClick={onClose} 
          color="inherit" 
          variant="text" 
          fullWidth
          sx={{ 
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          Cancelar y Volver
        </Button>
      </DialogActions>
    </Dialog>
  );
};
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
  alpha 
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth

    >
      <DialogContent 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          pt: 4, // Un poco más de aire arriba
          pb: 1
        }}
      >
        {/* Avatar visualmente consistente con el sistema */}
        <Avatar
          sx={{
            width: 64,
            height: 64,
            // ✅ Usamos alpha para un look más moderno y consistente con tu ConfirmDialog
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.main,
            mb: 2,
          }}
        >
          <LogoutIcon sx={{ fontSize: 32 }} />
        </Avatar>

        <Typography 
          variant="h5" 
          gutterBottom 
          color="text.primary"
          // ✅ ELIMINADO: fontWeight hardcodeado (h5 ya tiene el peso correcto en el theme)
        >
          ¿Cerrar Sesión?
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Estás a punto de salir de tu cuenta.
        </Typography>
      </DialogContent>

      <DialogActions 
        sx={{ 
          // ✅ ELIMINADO: Paddings manuales (el theme ya tiene p: 3 o p: 2 según dispositivo)
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' }, 
          gap: 2,
          width: '100%',
          justifyContent: 'center'
        }}
      >
        {/* Botón Cancelar */}
        <Button 
          onClick={onClose} 
          variant="text" 
          color="inherit" // Hereda color neutro
          fullWidth={isMobile} // Full width solo en móvil
          sx={{ 
             // ✅ ELIMINADO: borderRadius, fontWeight, etc. El theme lo hace solo.
             color: 'text.secondary' 
          }}
        >
          Cancelar
        </Button>

        {/* Botón Confirmar */}
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="primary" 
          fullWidth={isMobile}
          disableElevation
          autoFocus 
          // ✅ ELIMINADO: sx innecesario.
        >
          Sí, Cerrar Sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
};
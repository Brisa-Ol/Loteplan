import { ROUTES } from '@/routes';
import { Lock, VerifiedUser } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  alpha, useTheme
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export type SecurityRequirementType = '2FA_MISSING' | 'KYC_MISSING' | null;

interface SecurityRequirementModalProps {
  open: boolean;
  type: SecurityRequirementType;
  onClose: () => void;
}

export const SecurityRequirementModal: React.FC<SecurityRequirementModalProps> = ({
  open, type, onClose
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!type) return null;

  const config = {
    '2FA_MISSING': {
      title: 'Seguridad Requerida (2FA)',
      icon: <Lock sx={{ fontSize: 60, color: 'warning.main' }} />,
      description: 'Para realizar esta operación, debes activar la Autenticación de Dos Factores (2FA) en tu cuenta.',
      buttonText: 'Activar 2FA Ahora',
      path: ROUTES.CLIENT.CUENTA.SEGURIDAD // Ajusta a tu ruta real
    },
    'KYC_MISSING': {
      title: 'Verificación de Identidad Requerida',
      icon: <VerifiedUser sx={{ fontSize: 60, color: 'info.main' }} />,
      description: 'Por regulaciones de seguridad, debes completar y aprobar tu verificación de identidad (KYC) antes de operar.',
      buttonText: 'Ir a Verificación',
      path: ROUTES.CLIENT.CUENTA.KYC // Ajusta a tu ruta real
    }
  };

  const current = config[type];

  const handleAction = () => {
    onClose();
    navigate(current.path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <Box textAlign="center" mt={2}>
        <Box
          sx={{
            mx: 'auto', mb: 2, width: 80, height: 80,
            borderRadius: '50%',
            bgcolor: alpha(type === '2FA_MISSING' ? theme.palette.warning.main : theme.palette.info.main, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {current.icon}
        </Box>
      </Box>

      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>
        {current.title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {current.description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, flexDirection: 'column', gap: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleAction}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {current.buttonText}
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Alert, TextField, CircularProgress,
  Stack, Box, Avatar, useTheme, alpha
} from '@mui/material';
import { Warning, Lock } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  // Agregamos props opcionales para recibir textos del hook
  title?: string;
  description?: string;
}

const DeleteAccountModal: React.FC<Props> = ({ 
  open, 
  onClose, 
  is2FAEnabled,
  title, // Nuevo
  description // Nuevo
}) => {
  const theme = useTheme();
  const { deleteAccount } = useAuth();
  
  const [twoFaCode, setTwoFaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteAccount(is2FAEnabled ? twoFaCode : undefined);
    },
    onSuccess: () => {
      onClose(); 
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al procesar la solicitud.';
      setLocalError(msg);
    }
  });

  const handleSubmit = () => {
    if (is2FAEnabled && twoFaCode.length !== 6) {
      setLocalError('El código debe tener 6 dígitos.');
      return;
    }
    setLocalError(null);
    deleteMutation.mutate();
  };

  const handleClose = () => {
    if (deleteMutation.isPending) return;
    setTwoFaCode('');
    setLocalError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, padding: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 3 }}>
        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 56, height: 56 }}>
          <Warning fontSize="large" />
        </Avatar>
        <Typography variant="h5" fontWeight={800} align="center">
          {/* Usamos el título del hook o el default */}
          {title || "¿Desactivar Cuenta?"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Typography align="center" color="text.secondary">
            {/* Usamos la descripción del hook o el default */}
            {description || (
              <>
                Esta acción restringirá tu acceso inmediatamente.<br />
                <strong>¿Estás completamente seguro?</strong>
              </>
            )}
          </Typography>

          {localError && (
            <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
              {localError}
            </Alert>
          )}

          {is2FAEnabled && (
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Lock fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>Seguridad Requerida</Typography>
              </Stack>
              <TextField
                fullWidth
                placeholder="000 000"
                value={twoFaCode}
                onChange={(e) => {
                  setLocalError(null);
                  setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                disabled={deleteMutation.isPending}
                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.2rem', fontWeight: 700 } }}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" fullWidth disabled={deleteMutation.isPending} sx={{ py: 1.5 }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error" 
          fullWidth
          disabled={deleteMutation.isPending || (is2FAEnabled && twoFaCode.length !== 6)}
          sx={{ py: 1.5, boxShadow: 'none' }}
        >
          {deleteMutation.isPending ? <CircularProgress size={24} color="inherit"/> : 'Sí, Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountModal;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  TextField,
  CircularProgress,
  Stack,
  Box
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import UsuarioService from '../../../../Services/usuario.service';
import { useAuth } from '../../../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
}

const DeleteAccountModal: React.FC<Props> = ({ open, onClose, is2FAEnabled }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [twoFaCode, setTwoFaCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Call endpoint with 2FA code if needed
      await UsuarioService.softDeleteMe(is2FAEnabled ? twoFaCode : undefined);
    },
    onSuccess: () => {
      onClose();
      logout(); // Logout user after deletion
      navigate('/'); // Redirect to home
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al desactivar la cuenta.');
    }
  });

  const handleSubmit = () => {
    if (is2FAEnabled && twoFaCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos.');
      return;
    }
    setError(null);
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <Warning /> Desactivar Cuenta
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={1}>
          <Typography>
            ¿Estás seguro de que quieres desactivar tu cuenta? Perderás acceso a tus suscripciones y datos inmediatamente.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          {is2FAEnabled && (
            <Box>
              <Typography variant="body2" gutterBottom fontWeight="bold">
                Seguridad Requerida:
              </Typography>
              <TextField
                fullWidth
                label="Código 2FA"
                placeholder="Ingresa el código de tu app"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={deleteMutation.isPending}
                inputProps={{ maxLength: 6, style: { letterSpacing: 4 } }}
              />
              <Typography variant="caption" color="text.secondary">
                Para confirmar, ingresa el código de tu aplicación autenticadora.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={deleteMutation.isPending}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="error" 
          disabled={deleteMutation.isPending || (is2FAEnabled && twoFaCode.length !== 6)}
        >
          {deleteMutation.isPending ? <CircularProgress size={24} color="inherit"/> : 'Confirmar Desactivación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountModal;
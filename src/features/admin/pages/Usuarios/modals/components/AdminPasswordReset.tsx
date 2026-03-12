// src/features/admin/pages/Usuarios/modals/components/AdminPasswordReset.tsx

import UsuarioService from '@/core/api/services/usuario.service';
import { useSnackbar } from '@/shared';
import { VpnKeyOutlined as KeyIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { Alert, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface Props {
  userId: number;
  userName: string;
}

const AdminPasswordReset: React.FC<Props> = ({ userId, userName }) => {
  const { showSuccess, showError } = useSnackbar();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = newPassword.length >= 8 && newPassword === confirmPassword;

  const handleReset = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    try {
      await UsuarioService.adminResetPassword(userId, newPassword);
      showSuccess(`Contraseña de ${userName} actualizada correctamente.`);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error al restablecer la contraseña';
      setError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdornment = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShowPass(p => !p)}>
        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField fullWidth size="small" label="Nueva contraseña"
          type={showPass ? 'text' : 'password'} value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={newPassword.length > 0 && newPassword.length < 8}
          helperText={newPassword.length > 0 && newPassword.length < 8 ? 'Mínimo 8 caracteres' : ''}
          disabled={isLoading} InputProps={{ endAdornment: toggleAdornment }} sx={INPUT_SX}
        />
        <TextField fullWidth size="small" label="Confirmar contraseña"
          type={showPass ? 'text' : 'password'} value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword.length > 0 && confirmPassword !== newPassword}
          helperText={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'No coinciden' : ''}
          disabled={isLoading} sx={INPUT_SX}
        />
      </Stack>

      <Button variant="outlined" color="warning" size="small" fullWidth
        disabled={!isValid || isLoading}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <KeyIcon />}
        onClick={handleReset} sx={{ borderRadius: 2, fontWeight: 700 }}
      >
        {isLoading ? 'Actualizando...' : 'Establecer Nueva Contraseña'}
      </Button>
    </Stack>
  );
};

export default AdminPasswordReset;
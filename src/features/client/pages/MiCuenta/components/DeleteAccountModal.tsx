// src/pages/client/MiCuenta/components/DeleteAccountModal.tsx

import React, { useState, useCallback } from 'react';
import {
  Typography, Alert, TextField, Stack, Box, useTheme, alpha
} from '@mui/material';
import { Warning, Lock } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/core/context/AuthContext';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  title?: string;
  description?: string;
}

const DeleteAccountModal: React.FC<Props> = ({
  open,
  onClose,
  is2FAEnabled,
  title = "¿Desactivar Cuenta?",
  description
}) => {
  const theme = useTheme();
  const { deleteAccount } = useAuth();

  const [twoFaCode, setTwoFaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Pasamos el código solo si 2FA está habilitado
      await deleteAccount(is2FAEnabled ? twoFaCode : undefined);
    },
    onSuccess: () => {
      // El logout y redirección suelen manejarse dentro de deleteAccount o AuthContext
      // Aquí solo cerramos el modal
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al procesar la solicitud.';
      setLocalError(msg);
    }
  });

  const handleConfirm = () => {
    if (is2FAEnabled) {
      if (!twoFaCode || twoFaCode.length !== 6) {
        setLocalError('El código debe tener 6 dígitos.');
        return;
      }
    }
    setLocalError(null);
    deleteMutation.mutate();
  };

  const handleClose = useCallback(() => {
    if (deleteMutation.isPending) return;
    setTwoFaCode('');
    setLocalError(null);
    onClose();
  }, [deleteMutation.isPending, onClose]);

  // Manejo de cambio de input 2FA (Solo números)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocalError(null);
    setTwoFaCode(val);
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle="Zona de Peligro"
      icon={<Warning />}
      headerColor="error"
      maxWidth="xs"
      confirmText="Sí, Confirmar"
      confirmButtonColor="error"
      onConfirm={handleConfirm}
      isLoading={deleteMutation.isPending}
      disableConfirm={(is2FAEnabled && twoFaCode.length !== 6) || deleteMutation.isPending}
    >
      <Stack spacing={3}>

        {/* Descripción / Advertencia */}
        <Box textAlign="center">
          {description ? (
            <Typography color="text.secondary">{description}</Typography>
          ) : (
            <>
              <Typography color="text.primary" fontWeight={600} gutterBottom>
                Esta acción restringirá tu acceso inmediatamente.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ¿Estás completamente seguro de que deseas continuar?
              </Typography>
            </>
          )}
        </Box>

        {localError && (
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            {localError}
          </Alert>
        )}

        {is2FAEnabled && (
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5} justifyContent="center">
              <Lock fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Verificación de Seguridad
              </Typography>
            </Stack>

            <TextField
              fullWidth
              placeholder="000 000"
              value={twoFaCode}
              onChange={handleCodeChange}
              disabled={deleteMutation.isPending}
              autoFocus
              variant="outlined"
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper'
                }
              }}
            />
            <Typography variant="caption" display="block" textAlign="center" mt={1} color="text.secondary">
              Ingresa el código de tu autenticador (2FA)
            </Typography>
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default DeleteAccountModal;
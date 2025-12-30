import React, { useState } from 'react';
import {
  Typography, Alert, TextField, Stack, Box, useTheme
} from '@mui/material';
import { Warning, Lock } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';

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
  title = "¿Desactivar Cuenta?", // Valor por defecto
  description
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

  const handleConfirm = () => {
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
        
        <Typography align="center" color="text.secondary">
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
              inputProps={{ 
                  maxLength: 6, 
                  style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.2rem', fontWeight: 700 } 
              }}
            />
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default DeleteAccountModal;
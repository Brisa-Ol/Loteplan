// src/pages/client/MiCuenta/components/DeleteAccountModal.tsx

import { useAuth } from '@/core/context/AuthContext';
import { BaseModal } from '@/shared/components/domain/modals/BaseModal';
import UsuarioService from '@/core/api/services/usuario.service';
import { Lock, Warning } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

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
  is2FAEnabled, // Lo que dice el frontend
  title = "¿Desactivar Cuenta?",
  description
}) => {
  const theme = useTheme();
  const { logout } = useAuth();

  const [twoFaCode, setTwoFaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // ✅ Nuevo estado: Por si el backend exige 2FA aunque el frontend no lo sabía
  const [serverRequires2FA, setServerRequires2FA] = useState(false);

  // La verdad absoluta: si el frontend dice que sí, o si el backend nos corrigió y dijo que sí.
  const actual2FA = is2FAEnabled || serverRequires2FA;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (actual2FA) {
        const response = await UsuarioService.confirmCancelacionCuenta(twoFaCode);
        return response.data;
      } else {
        const response = await UsuarioService.startCancelacionCuenta();
        // Axios procesa el 202 Accepted como éxito, así que lo devolvemos para evaluarlo en onSuccess
        return response.data; 
      }
    },
    onSuccess: (data: any) => {
      // ✅ Si la API nos responde que necesita 2FA (Paso 1)
      if (data && data.requires2FA) {
        setServerRequires2FA(true); // Forzamos a mostrar el input
        setLocalError('Por seguridad, el servidor requiere que ingreses tu código 2FA.');
        return; // Cortamos la ejecución para que el usuario ponga el código
      }

      // ✅ Si todo salió bien y se borró
      handleClose();
      if (logout) logout();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al procesar la solicitud.';
      setLocalError(msg);
    }
  });

  const handleConfirm = () => {
    if (actual2FA) {
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
    setServerRequires2FA(false); // Reseteamos el estado de fallback
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
      disableConfirm={(actual2FA && twoFaCode.length !== 6) || deleteMutation.isPending}
    >
      <Stack spacing={3}>

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

        {/* ✅ Usamos actual2FA para renderizar el input dinámicamente */}
        {actual2FA && (
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
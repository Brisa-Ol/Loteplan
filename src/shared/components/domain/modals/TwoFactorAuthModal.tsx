// src/shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal.tsx

import { BaseModal } from '@/shared/components/domain/modals/BaseModal'; // ✅ Importación de BaseModal
import { Security as SecurityIcon } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Fade,
  Stack,
  TextField,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface TwoFactorAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  title = "Verificación de Seguridad",
  description = "Ingresá el código de 6 dígitos de tu aplicación autenticadora para continuar."
}) => {
  const theme = useTheme();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (open) setCode('');
  }, [open]);

  const handleConfirm = () => {
    if (code.length === 6 && !isLoading) {
      onSubmit(code);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
  };

  // ✅ Permite enviar el formulario presionando "Enter" dentro del input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      icon={<SecurityIcon />}
      headerColor="primary"
      maxWidth="xs"
      confirmText="Verificar Identidad"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableConfirm={code.length !== 6}
    >
      <Stack spacing={4} mt={1}>
        {error && (
          <Fade in={!!error}>
            <Alert
              severity="error"
              variant="outlined"
              sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: alpha(theme.palette.error.main, 0.02) }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Input OTP Estilizado */}
        <Box sx={{ position: 'relative' }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="000 000"
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="one-time-code"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
              style: {
                textAlign: 'center',
                letterSpacing: '0.5em',
                fontSize: '2rem',
                fontWeight: 800,
                padding: '20px',
                fontFamily: 'monospace',
                color: theme.palette.primary.main
              }
            }}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5, // 12px
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                '& fieldset': { borderColor: alpha(theme.palette.divider, 0.1) },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                '&.Mui-focused fieldset': { borderWidth: '2px' }
              }
            }}
          />
        </Box>

        {/* Indicadores de Progreso de Código */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pb: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 12, height: 12,
                borderRadius: '50%',
                bgcolor: i < code.length
                  ? theme.palette.primary.main
                  : alpha(theme.palette.text.disabled, 0.2),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: i < code.length ? 'scale(1.3)' : 'scale(1)',
                boxShadow: i < code.length ? `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}` : 'none'
              }}
            />
          ))}
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default TwoFactorAuthModal;
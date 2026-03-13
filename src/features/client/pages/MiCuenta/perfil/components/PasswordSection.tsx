// src/pages/client/MiCuenta/Perfil/components/PasswordSection.tsx

import { Close as CloseIcon, ExpandLess, ExpandMore, Key, Lock, Save as SaveIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert, alpha, Box, Button, CircularProgress, Collapse, Divider,
  IconButton, InputAdornment, Stack, TextField, useTheme
} from '@mui/material';
import React, { useState } from 'react';
import type { usePasswordChange } from '../hooks/usePasswordChange';

interface Props { passwordHook: ReturnType<typeof usePasswordChange>; }

const PasswordSection: React.FC<Props> = ({ passwordHook: p }) => {
  const theme = useTheme();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleOpen = () => p.isOpen ? p.close() : p.setIsOpen(true);

  return (
    <Box sx={{ gridColumn: { md: '1 / -1' } }}>
      <Divider sx={{ mb: 3 }}>
        <Button
          variant="text" color="warning" size="small"
          startIcon={<Key fontSize="small" />}
          endIcon={p.isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          onClick={toggleOpen}
          sx={{ fontWeight: 600, px: 2 }}
        >
          {p.isOpen ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
        </Button>
      </Divider>

      <Collapse in={p.isOpen} unmountOnExit>
        <Box sx={{
          p: 3, borderRadius: 2,
          bgcolor: alpha(theme.palette.warning.main, 0.03),
          border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
        }}>
          <Stack spacing={2.5}>
            {p.apiError && (
              <Alert severity="error" action={
                <IconButton size="small" onClick={() => p.setApiError(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }>
                {p.apiError}
              </Alert>
            )}

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2}>
              {[
                { name: 'currentPassword', label: 'Contraseña actual',   show: showCurrent, toggle: () => setShowCurrent(v => !v), helperText: undefined },
                { name: 'newPassword',     label: 'Nueva contraseña',     show: showNew,     toggle: () => setShowNew(v => !v),     helperText: 'Mín. 8 caracteres, 1 mayúscula y 1 número' },
                { name: 'confirmPassword', label: 'Confirmar contraseña', show: showConfirm, toggle: () => setShowConfirm(v => !v), helperText: undefined },
              ].map(({ name, label, show, toggle, helperText }) => (
                <TextField
                  key={name} fullWidth label={label} name={name}
                  type={show ? 'text' : 'password'}
                  value={(p.formik.values as any)[name]}
                  onChange={p.formik.handleChange}
                  onBlur={p.formik.handleBlur}
                  error={(p.formik.touched as any)[name] && Boolean((p.formik.errors as any)[name])}
                  helperText={((p.formik.touched as any)[name] && (p.formik.errors as any)[name]) || helperText}
                  InputProps={{
                    startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={toggle} edge="end" size="small">
                          {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              ))}
            </Box>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained" color="warning"
                disabled={p.isPending || !p.formik.isValid || !p.formik.dirty}
                startIcon={p.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={() => p.formik.handleSubmit()}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {p.is2FAEnabled ? 'Continuar con 2FA' : 'Guardar contraseña'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default PasswordSection;
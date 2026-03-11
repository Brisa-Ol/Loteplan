import React, { useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, CircularProgress,
  Collapse, Divider, IconButton, InputAdornment, Stack, TextField,
  Typography, alpha, useTheme
} from '@mui/material';
import { Close, ExpandLess, ExpandMore, Key, Lock, Save, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import UsuarioService from '@/core/api/services/usuario.service';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useAuth } from '@/core/context/AuthContext';
import type { ChangePasswordDto } from '@/core/types/dto/usuario.dto';

const ChangePasswordCard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { showSuccess } = useSnackbar();

  const [isOpen, setIsOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => UsuarioService.changePassword(data),
    onSuccess: () => {
      showSuccess('Contraseña actualizada correctamente');
      handleClose();
    },
    onError: (error: any) => {
      setApiError(error?.response?.data?.error || error?.message || 'Error al cambiar la contraseña');
    },
  });

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twofaCode: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('La contraseña actual es requerida'),
      newPassword: Yup.string()
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .matches(/[0-9]/, 'Debe contener al menos un número')
        .required('La nueva contraseña es requerida'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
        .required('Debes confirmar la nueva contraseña'),
      twofaCode: user?.is_2fa_enabled
        ? Yup.string().length(6, 'El código debe tener 6 dígitos').required('El código 2FA es requerido')
        : Yup.string(),
    }),
    onSubmit: (values) => {
      setApiError(null);
      const payload: ChangePasswordDto = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        ...(user?.is_2fa_enabled && { twofaCode: values.twofaCode }),
      };
      mutation.mutate(payload);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    formik.resetForm();
    setApiError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              variant="rounded"
              sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
            >
              <Key />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Cambiar Contraseña</Typography>
              <Typography variant="body2" color="text.secondary">
                Actualizá tu contraseña periódicamente para mayor seguridad.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            color="warning"
            endIcon={isOpen ? <ExpandLess /> : <ExpandMore />}
            onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {isOpen ? 'Cancelar' : 'Cambiar'}
          </Button>
        </Box>

        {/* Formulario colapsable */}
        <Collapse in={isOpen} unmountOnExit>
          <Divider sx={{ my: 3 }} />

          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>

              {apiError && (
                <Alert
                  severity="error"
                  action={
                    <IconButton size="small" onClick={() => setApiError(null)}>
                      <Close fontSize="small" />
                    </IconButton>
                  }
                >
                  {apiError}
                </Alert>
              )}

              {/* Contraseña actual */}
              <TextField
                fullWidth
                label="Contraseña actual"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
                helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                InputProps={{
                  startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small">
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Nueva contraseña */}
              <TextField
                fullWidth
                label="Nueva contraseña"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                helperText={
                  (formik.touched.newPassword && formik.errors.newPassword) ||
                  'Mínimo 8 caracteres, una mayúscula y un número'
                }
                InputProps={{
                  startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Confirmar nueva contraseña */}
              <TextField
                fullWidth
                label="Confirmar nueva contraseña"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                InputProps={{
                  startAdornment: <Lock color="action" sx={{ mr: 1 }} fontSize="small" />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Código 2FA — solo si está activo */}
              {user?.is_2fa_enabled && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    Tu cuenta tiene 2FA activo. Ingresá el código de tu autenticador para confirmar el cambio.
                  </Alert>
                  <TextField
                    fullWidth
                    label="Código 2FA"
                    name="twofaCode"
                    placeholder="000000"
                    value={formik.values.twofaCode}
                    onChange={(e) =>
                      formik.setFieldValue('twofaCode', e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    onBlur={formik.handleBlur}
                    error={formik.touched.twofaCode && Boolean(formik.errors.twofaCode)}
                    helperText={formik.touched.twofaCode && formik.errors.twofaCode}
                    inputProps={{
                      maxLength: 6,
                      style: { textAlign: 'center', letterSpacing: 6, fontSize: '1.2rem', fontWeight: 700 },
                    }}
                  />
                </Box>
              )}

              {/* Botón guardar */}
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={mutation.isPending || !formik.isValid || !formik.dirty}
                  startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Save />}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
                >
                  Guardar Contraseña
                </Button>
              </Box>

            </Stack>
          </Box>
        </Collapse>

      </CardContent>
    </Card>
  );
};

export default ChangePasswordCard;
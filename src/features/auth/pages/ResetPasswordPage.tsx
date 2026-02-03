import { CheckCircleOutline, LockReset, Visibility, VisibilityOff, VpnKey } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

import type { ApiError } from '@/core/api/httpService';
import FormTextField from '../../../shared/components/forms/inputs/FormTextField';

import AuthFormContainer from './components/AuthFormContainer/AuthFormContainer';
import AuthService from '@/core/api/services/auth.service';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[A-Z]/, 'Debe tener una mayúscula')
        .matches(/[a-z]/, 'Debe tener una minúscula')
        .matches(/[0-9]/, 'Debe tener un número')
        .required('Requerido'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
        .required('Confirma tu contraseña'),
    }),
    onSubmit: async (values) => {
      if (!token) {
        setErrorMessage('Token no válido o expirado.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        await AuthService.resetPassword(token, { nueva_contraseña: values.password });
        setStatus('success');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Contraseña restablecida. Ingresa con tu nueva clave.' } });
        }, 3000);
      } catch (err: unknown) {
        setStatus('error');
        const apiError = err as ApiError;
        // Obtenemos el mensaje de forma segura del interceptor o del error nativo
        const msg = apiError.message || 'El enlace es inválido o ha expirado.';
        setErrorMessage(msg);
      }
    },
  });

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <AuthFormContainer
      title={isSuccess ? "¡Todo listo!" : "Nueva Contraseña"}
      subtitle={isSuccess ? "Tu clave ha sido actualizada correctamente." : "Crea una contraseña segura para proteger tu cuenta."}
      maxWidth="sm"
    >
      {isSuccess ? (
        <Fade in={true}>
          <Box textAlign="center">
            <Avatar sx={{ width: 72, height: 72, margin: '0 auto', mb: 3, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
              <CheckCircleOutline fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">Contraseña Actualizada</Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>Serás redirigido al inicio de sesión en unos segundos...</Typography>
            <Button variant="contained" onClick={() => navigate('/login')} fullWidth size="large" sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}>
              Ir al Login ahora
            </Button>
          </Box>
        </Fade>
      ) : (
        <Fade in={true}>
          <Box>
            <Box textAlign="center" mb={4}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <VpnKey fontSize="large" />
              </Box>
              <Typography variant="body1" color="text.secondary">Ingresa tu nueva contraseña a continuación.</Typography>
            </Box>

            {status === 'error' && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMessage}</Alert>}

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <FormTextField
                  name="password"
                  label="Nueva Contraseña"
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  formik={formik}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <FormTextField
                  name="confirmPassword"
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  disabled={isLoading}
                  formik={formik}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button fullWidth variant="contained" type="submit" size="large" disabled={isLoading} endIcon={!isLoading && <LockReset />} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña'}
                </Button>
              </Stack>
            </form>
          </Box>
        </Fade>
      )}
    </AuthFormContainer>
  );
};

export default ResetPasswordPage;
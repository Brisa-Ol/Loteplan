// src/pages/Auth/ResetPasswordPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Button, 
  TextField, 
  Alert, 
  CircularProgress, 
  Stack, 
  InputAdornment, 
  IconButton,
  Box,
  Typography,
  Fade
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircleOutline, LockReset } from '@mui/icons-material';

// Servicios y Componentes
import AuthService from '../../services/auth.service';
import AuthFormContainer from './components/AuthFormContainer/AuthFormContainer';
import { PageContainer } from '../../components/common/PageContainer/PageContainer';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Estados
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
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
        
        // Redirección automática
        setTimeout(() => {
            navigate('/login', { 
                state: { message: 'Contraseña restablecida. Ingresa con tu nueva clave.' } 
            });
        }, 3000);

      } catch (error: any) {
        setStatus('error');
        
        // ✅ CORRECCIÓN CRÍTICA:
        // Como 'httpService' ya normalizó el error, accedemos a 'error.message'
        const msg = error.message || 'El enlace es inválido o ha expirado.';
        setErrorMessage(msg);
      }
    },
  });

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer 
        title={isSuccess ? "¡Todo listo!" : "Restablecer Contraseña"} 
        subtitle={isSuccess ? "" : "Crea una nueva contraseña segura para tu cuenta"}
      >
        
        {isSuccess ? (
          <Fade in={true}>
            <Box textAlign="center" py={4}>
              <CheckCircleOutline color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Contraseña actualizada
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Serás redirigido al inicio de sesión en unos segundos...
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/login')} 
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Ir al Login ahora
              </Button>
            </Box>
          </Fade>
        ) : (
          <Fade in={true}>
            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                
                {status === 'error' && (
                  <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                    {errorMessage}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  {...formik.getFieldProps('password')}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  disabled={isLoading}
                  {...formik.getFieldProps('confirmPassword')}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button 
                  fullWidth 
                  variant="contained" 
                  type="submit" 
                  size="large"
                  disabled={isLoading}
                  startIcon={!isLoading && <LockReset />}
                  sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña'}
                </Button>
              </Stack>
            </form>
          </Fade>
        )}
      </AuthFormContainer>
    </PageContainer>
  );
};

export default ResetPasswordPage;
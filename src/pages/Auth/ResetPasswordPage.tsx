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
  Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import AuthService from '../../Services/auth.service';
import AuthFormContainer from './components/AuthFormContainer/AuthFormContainer';
import { PageContainer } from '../../components/common/PageContainer/PageContainer';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para controlar la visibilidad de las contraseñas
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
      if (!token) return;
      setStatus('loading');
      try {
        await AuthService.resetPassword(token, { nueva_contraseña: values.password });
        setStatus('success');
        setTimeout(() => navigate('/login', { 
            state: { message: 'Contraseña restablecida. Ingresa con tu nueva clave.' } 
        }), 3000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.error || 'El enlace es inválido o ha expirado.');
      }
    },
  });

  const isDisabled = status === 'loading' || status === 'success';

  return (
    <PageContainer maxWidth="sm">
      <AuthFormContainer 
        title={status === 'success' ? "¡Contraseña Actualizada!" : "Nueva Contraseña"} 
        subtitle={status === 'success' ? "" : "Ingresa tu nueva clave de acceso"}
      >
        
        {status === 'success' ? (
          <Box textAlign="center" py={2}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Tu contraseña ha sido actualizada correctamente.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Serás redirigido al login en unos segundos...
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/login')} 
              sx={{ mt: 3 }}
              fullWidth
            >
              Ir al Login ahora
            </Button>
          </Box>
        ) : (
          <>
            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}
            
            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  type={showPassword ? "text" : "password"}
                  {...formik.getFieldProps('password')}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  disabled={isDisabled}
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
                  {...formik.getFieldProps('confirmPassword')}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  disabled={isDisabled}
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
                  disabled={isDisabled}
                >
                  {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña'}
                </Button>
              </Stack>
            </form>
          </>
        )}
      </AuthFormContainer>
    </PageContainer>
  );
};

export default ResetPasswordPage;
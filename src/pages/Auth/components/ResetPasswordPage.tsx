import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Alert, CircularProgress, Stack } from '@mui/material';
import AuthService from '../../../Services/auth.service';
import AuthFormContainer from './AuthFormContainer/AuthFormContainer';


const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  if (status === 'success') {
    return (
      <AuthFormContainer title="¡Éxito!" subtitle="">
        <Alert severity="success">
          Tu contraseña ha sido actualizada correctamente. Redirigiendo al login...
        </Alert>
      </AuthFormContainer>
    );
  }

  return (
    <AuthFormContainer title="Nueva Contraseña" subtitle="Ingresa tu nueva clave de acceso">
      {status === 'error' && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      
      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Nueva Contraseña"
            type="password"
            {...formik.getFieldProps('password')}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            disabled={status === 'loading'}
          />
          
          <TextField
            fullWidth
            label="Confirmar Nueva Contraseña"
            type="password"
            {...formik.getFieldProps('confirmPassword')}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={status === 'loading'}
          />

          <Button 
            fullWidth 
            variant="contained" 
            type="submit" 
            disabled={status === 'loading'}
            sx={{ mt: 2 }}
          >
            {status === 'loading' ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
          </Button>
        </Stack>
      </form>
    </AuthFormContainer>
  );
};

export default ResetPasswordPage;
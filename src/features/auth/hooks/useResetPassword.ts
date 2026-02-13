import AuthService from '@/core/api/services/auth.service';
import type { ApiError } from '@/core/api/httpService';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

export const useResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Estados de UI
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
        // Redirección automática después de 3s
        setTimeout(() => {
          navigate('/login', { state: { message: 'Contraseña restablecida. Ingresa con tu nueva clave.' } });
        }, 3000);
      } catch (err: unknown) {
        setStatus('error');
        const apiError = err as ApiError;
        const msg = apiError.message || 'El enlace es inválido o ha expirado.';
        setErrorMessage(msg);
      }
    },
  });

  return {
    formik,
    status: {
      isLoading: status === 'loading',
      isSuccess: status === 'success',
      isError: status === 'error',
      errorMessage,
      showPassword,
      showConfirmPassword
    },
    actions: {
      togglePassword: () => setShowPassword(!showPassword),
      toggleConfirmPassword: () => setShowConfirmPassword(!showConfirmPassword),
      navigateToLogin: () => navigate('/login')
    }
  };
};
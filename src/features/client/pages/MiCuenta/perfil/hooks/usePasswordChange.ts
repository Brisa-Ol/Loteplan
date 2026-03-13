// src/pages/client/MiCuenta/Perfil/hooks/usePasswordChange.ts

import UsuarioService from '@/core/api/services/usuario.service';
import { useAuth } from '@/core/context/AuthContext';
import type { ChangePasswordDto } from '@/core/types/usuario.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

export const usePasswordChange = () => {
  const { user } = useAuth();
  const { showSuccess } = useSnackbar();

  const [isOpen,          setIsOpen]          = useState(false);
  const [apiError,        setApiError]        = useState<string | null>(null);
  const [twoFaOpen,       setTwoFaOpen]       = useState(false);
  const [twoFaLoading,    setTwoFaLoading]    = useState(false);
  const [twoFaError,      setTwoFaError]      = useState<string | null>(null);
  const [pendingPayload,  setPendingPayload]  = useState<Omit<ChangePasswordDto, 'twofaCode'> | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => UsuarioService.changePassword(data),
    onSuccess: () => { showSuccess('Contraseña actualizada correctamente'); close(); },
    onError: (error: any) => {
      setApiError(error?.response?.data?.error || error?.message || 'Error al cambiar la contraseña');
    },
  });

  const formik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Requerido'),
      newPassword: Yup.string()
        .min(8, 'Mínimo 8 caracteres')
        .matches(/[A-Z]/, 'Al menos una mayúscula')
        .matches(/[0-9]/, 'Al menos un número')
        .required('Requerido'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
        .required('Requerido'),
    }),
    onSubmit: (values) => {
      setApiError(null);
      const payload = { currentPassword: values.currentPassword, newPassword: values.newPassword };
      if (user?.is_2fa_enabled) {
        setPendingPayload(payload);
        setTwoFaError(null);
        setTwoFaOpen(true);
      } else {
        mutation.mutate(payload);
      }
    },
  });

  const handleTwoFaSubmit = async (code: string) => {
    if (!pendingPayload) return;
    setTwoFaLoading(true);
    setTwoFaError(null);
    try {
      await UsuarioService.changePassword({ ...pendingPayload, twofaCode: code });
      setTwoFaOpen(false);
      setPendingPayload(null);
      showSuccess('Contraseña actualizada correctamente');
      close();
    } catch (error: any) {
      setTwoFaError(error?.response?.data?.error || 'Código 2FA incorrecto');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    formik.resetForm();
    setApiError(null);
  };

  return {
    formik, isOpen, setIsOpen, apiError, setApiError, close,
    twoFaOpen, setTwoFaOpen, twoFaLoading, twoFaError, setTwoFaError,
    pendingPayload, setPendingPayload, handleTwoFaSubmit,
    isPending: mutation.isPending,
    is2FAEnabled: user?.is_2fa_enabled,
  };
};
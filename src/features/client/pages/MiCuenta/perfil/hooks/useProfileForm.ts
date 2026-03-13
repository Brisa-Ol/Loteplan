// src/pages/client/MiCuenta/Perfil/hooks/useProfileForm.ts

import UsuarioService from '@/core/api/services/usuario.service';
import { useAuth } from '@/core/context/AuthContext';
import type { UpdateUserMeDto } from '@/core/types/usuario.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

export const useProfileForm = () => {
  const { user, refetchUser } = useAuth();
  const { showSuccess } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: UpdateUserMeDto) => (await UsuarioService.updateMe(data)).data,
    onSuccess: async () => {
      await refetchUser();
      setIsEditing(false);
      showSuccess('Perfil actualizado correctamente');
    },
  });

  const formik = useFormik<UpdateUserMeDto>({
    initialValues: {
      nombre:           user?.nombre           || '',
      apellido:         user?.apellido          || '',
      email:            user?.email             || '',
      numero_telefono:  user?.numero_telefono   || '',
      nombre_usuario:   user?.nombre_usuario    || '',
    },
    validationSchema: Yup.object({
      nombre:          Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      apellido:        Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      email:           Yup.string().email('Email inválido').required('Requerido'),
      nombre_usuario:  Yup.string().min(4, 'Mínimo 4 caracteres').required('Requerido'),
      numero_telefono: Yup.string().min(8, 'Número inválido').required('Requerido'),
    }),
    onSubmit: (values) => mutation.mutate(values),
    enableReinitialize: true,
  });

  const cancel = () => { formik.resetForm(); setIsEditing(false); };

  return { formik, isEditing, setIsEditing, cancel, isLoading: mutation.isPending };
};
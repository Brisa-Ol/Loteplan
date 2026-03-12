// src/features/admin/pages/Usuarios/modals/CreateUserModal.tsx

import type { CreateUsuarioDto } from '@/core/types/dto/usuario.dto';
import { BaseModal } from '@/shared';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { Divider, Stack } from '@mui/material';
import { useFormik } from 'formik';
import React, { useCallback } from 'react';
import * as Yup from 'yup';
import PersonalSection from './PersonalSection1';
import CredentialsSection from './CredentialsSection2';
import RoleSection from './RoleSection3';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioDto) => Promise<any>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  email: Yup.string().email("Email inválido").required("Requerido"),
  dni: Yup.string().matches(/^\d+$/, "Solo números").min(7).max(8).required("Requerido"),
  nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
  numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Mínimo 10 dígitos").required("Requerido"),
  contraseña: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe tener mayúscula, minúscula y número")
    .required("Requerido"),
  rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
});

const CreateUserModal: React.FC<CreateUserModalProps> = ({ open, onClose, onSubmit, isLoading = false }) => {
  const formik = useFormik<CreateUsuarioDto>({
    initialValues: {
      nombre: '', apellido: '', email: '', dni: '',
      nombre_usuario: '', numero_telefono: '', contraseña: '', rol: 'cliente',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try { await onSubmit(values); resetForm(); }
      catch (error) { console.error("Error creating user", error); }
    },
  });

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.setFieldValue(e.target.name, e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleClose = useCallback(() => { formik.resetForm(); onClose(); }, [formik, onClose]);

  return (
    <BaseModal
      open={open} onClose={handleClose}
      title="Registrar Nuevo Usuario"
      subtitle="Defina los datos personales y credenciales de acceso"
      icon={<PersonAddIcon />} headerColor="primary"
      confirmText="Crear Usuario" confirmButtonIcon={<PersonAddIcon />}
      onConfirm={formik.submitForm} isLoading={isLoading}
      disableConfirm={!formik.isValid || isLoading} maxWidth="md"
    >
      <Stack spacing={4} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        <PersonalSection formik={formik} isLoading={isLoading} onNumericChange={handleNumericChange} />
        <CredentialsSection formik={formik} isLoading={isLoading} />
        <RoleSection formik={formik} isLoading={isLoading} />
      </Stack>
    </BaseModal>
  );
};

export default CreateUserModal;
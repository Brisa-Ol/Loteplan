// src/features/admin/pages/Usuarios/modals/EditUserModal.tsx

import UsuarioService from '@/core/api/services/usuario.service';
import { useAuth } from '@/core/context/AuthContext';
import type { UpdateUserAdminDto, UsuarioDto } from '@/core/types/dto/usuario.dto';
import { BaseModal, useSnackbar } from '@/shared';
import { Edit as EditIcon, VpnKeyOutlined as KeyIcon, PersonOutline as PersonIcon } from '@mui/icons-material';
import { Alert, Box, Chip, Divider, Stack, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Disable2FADialog from '../components/Disable2FADialog';
import SectionTitle from '../components/SectionTitle';
import PermissionsSection from './PermissionsSection';
import SecuritySection from './SecuritySection';


const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UsuarioDto | null;
  onSubmit: (id: number, data: UpdateUserAdminDto) => Promise<any>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  email: Yup.string().email("Email inválido").required("Requerido"),
  nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
  numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Teléfono inválido").required("Requerido"),
  rol: Yup.string().required("Requerido"),
  activo: Yup.boolean().required("Requerido"),
});

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, user, onSubmit, isLoading = false }) => {
  const { showSuccess, showError } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [preparingReactivation, setPreparingReactivation] = useState(false);
  const [reactivationError, setReactivationError] = useState<string | null>(null);

  const isSelfEditing = currentUser?.id === user?.id;
  const isInactiveUser = user ? !user.activo : false;
  const isBusy = isLoading || preparingReactivation;

  const formik = useFormik({
    initialValues: { nombre: '', apellido: '', email: '', nombre_usuario: '', numero_telefono: '', rol: 'cliente', activo: true },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!user) return;
      setReactivationError(null);
      try {
        const identityChanged = values.email !== user.email || values.nombre_usuario !== user.nombre_usuario;
        if (isInactiveUser && identityChanged) {
          setPreparingReactivation(true);
          try {
            await UsuarioService.prepareForReactivation(user.id, {
              email: values.email !== user.email ? values.email : undefined,
              nombre_usuario: values.nombre_usuario !== user.nombre_usuario ? values.nombre_usuario : undefined,
            });
            const dataToSend: any = { ...values, telefono: values.numero_telefono };
            delete dataToSend.email;
            delete dataToSend.nombre_usuario;
            await onSubmit(user.id, dataToSend);
          } finally {
            setPreparingReactivation(false);
          }
        } else {
          await onSubmit(user.id, { ...values, telefono: values.numero_telefono } as any);
        }
        onClose();
      } catch (error: any) {
        setReactivationError(error.response?.data?.error || error.message || 'Error al guardar');
      }
    },
  });

  useEffect(() => {
    if (user && open) {
      formik.setValues({
        nombre: user.nombre || '', apellido: user.apellido || '', email: user.email || '',
        nombre_usuario: user.nombre_usuario || '', numero_telefono: user.numero_telefono || '',
        rol: user.rol || 'cliente', activo: user.activo ?? true,
      });
    }
  }, [user, open]);

  const handleDisable2FA = async (justificacion: string) => {
    if (!user) return;
    setIsDisabling2FA(true);
    try {
      await UsuarioService.adminReset2FA(user.id, { justificacion });
      showSuccess('✅ 2FA desactivado correctamente.');
      setShowDisable2FADialog(false);
      onClose();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    } finally {
      setIsDisabling2FA(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <BaseModal
        open={open} onClose={onClose}
        title={isInactiveUser ? "Preparar Reactivación" : "Editar Usuario"}
        subtitle={isInactiveUser ? "Resolver conflictos antes de reactivar" : "Modificar datos y permisos de acceso"}
        icon={<EditIcon />} headerColor={isInactiveUser ? "warning" : "primary"}
        confirmText={preparingReactivation ? "Preparando..." : "Confirmar Cambios"}
        onConfirm={formik.submitForm} isLoading={isBusy}
        disableConfirm={!formik.isValid || isBusy}
        confirmButtonIcon={<EditIcon />} maxWidth="md"
        headerExtra={
          <Stack direction="row" spacing={1}>
            <Chip label={`ID: ${user.id}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
            {user.dni && <Chip label={`DNI: ${user.dni}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
            {isInactiveUser && <Chip label="INACTIVO" size="small" color="warning" sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
            {isSelfEditing && <Chip label="TÚ" size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
          </Stack>
        }
      >
        <Stack spacing={4}>
          {isInactiveUser && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Cuenta desactivada.</strong> Modifica email o nombre de usuario si hay conflictos,
              luego podrás reactivar la cuenta desde la tabla.
            </Alert>
          )}
          {reactivationError && (
            <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setReactivationError(null)}>
              {reactivationError}
            </Alert>
          )}

          {/* ── DATOS PERSONALES ── */}
          <Box>
            <SectionTitle icon={<PersonIcon fontSize="inherit" />}>Información Personal</SectionTitle>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField fullWidth label="Nombre" {...formik.getFieldProps('nombre')}
                  error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                  helperText={formik.touched.nombre && formik.errors.nombre}
                  disabled={isLoading} sx={INPUT_SX}
                />
                <TextField fullWidth label="Apellido" {...formik.getFieldProps('apellido')}
                  error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                  helperText={formik.touched.apellido && formik.errors.apellido}
                  disabled={isLoading} sx={INPUT_SX}
                />
              </Stack>
              <TextField fullWidth label="Teléfono" {...formik.getFieldProps('numero_telefono')}
                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                disabled={isLoading} sx={INPUT_SX}
              />
            </Stack>
          </Box>

          {/* ── CREDENCIALES ── */}
          <Box>
            <SectionTitle icon={<KeyIcon fontSize="inherit" />}>Credenciales</SectionTitle>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="Email" {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={isLoading} sx={INPUT_SX}
              />
              <TextField fullWidth label="Usuario" {...formik.getFieldProps('nombre_usuario')}
                error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                disabled={isLoading} sx={INPUT_SX}
              />
            </Stack>
          </Box>

          <Divider />
          <PermissionsSection formik={formik} isLoading={isLoading} isSelfEditing={isSelfEditing} />
          <SecuritySection user={user} isSelfEditing={isSelfEditing} onDisable2FA={() => setShowDisable2FADialog(true)} />
        </Stack>
      </BaseModal>

      <Disable2FADialog
        open={showDisable2FADialog}
        onClose={() => setShowDisable2FADialog(false)}
        onConfirm={handleDisable2FA}
        isLoading={isDisabling2FA}
        userName={`${user.nombre} ${user.apellido}`}
      />
    </>
  );
};

export default EditUserModal;
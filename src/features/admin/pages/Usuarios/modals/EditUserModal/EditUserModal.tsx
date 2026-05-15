// src/features/admin/pages/Usuarios/modals/EditUserModal.tsx

import UsuarioService from '@/core/api/services/usuario.service';
import { useAuth } from '@/core/context/AuthContext';
import type { UpdateUserAdminDto, UsuarioDto } from '@/core/types/usuario.dto';
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
import { Block, CheckCircle, Edit } from '@mui/icons-material';
import { ModalMotivoAdmin } from '../../../Suscripciones/modals/ModalMotivoAdmin/ModalMotivoAdmin';

const INPUT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UsuarioDto | null;
  onSubmit: (id: number, data: UpdateUserAdminDto) => Promise<any>;
  isLoading?: boolean;
}

// ─── Campos que requieren justificación al ser modificados ───
interface SensitiveChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  dni: Yup.string().matches(/^\d+$/, "Solo números").min(6, "DNI inválido").required("Requerido"),
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

  // ─── Estado para el modal de motivo ──────────────────────
  const [motivoModalOpen, setMotivoModalOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [pendingValues, setPendingValues] = useState<typeof formik.values | null>(null);
  const [sensitiveChanges, setSensitiveChanges] = useState<SensitiveChange[]>([]);

  const isSelfEditing = currentUser?.id === user?.id;
  const isInactiveUser = user ? !user.activo : false;
  const isBusy = isLoading || preparingReactivation;

  // ─── Detecta qué cambios sensibles hubo ──────────────────
  const detectSensitiveChanges = (values: typeof formik.values): SensitiveChange[] => {
    if (!user) return [];
    const changes: SensitiveChange[] = [];

    if (values.dni !== user.dni)
      changes.push({ field: 'dni', label: 'DNI', from: user.dni || '—', to: values.dni });

    if (values.email !== user.email)
      changes.push({ field: 'email', label: 'Email', from: user.email, to: values.email });

    if (values.activo !== user.activo) {
      changes.push({
        field: 'activo',
        label: 'Estado de cuenta',
        from: user.activo ? 'Activo' : 'Inactivo',
        to: values.activo ? 'Activo' : 'Inactivo',
      });
    }

    return changes;
  };

  const formik = useFormik({
    initialValues: { nombre: '', apellido: '', dni: '', email: '', nombre_usuario: '', numero_telefono: '', rol: 'cliente', activo: true },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Si hay cambios sensibles, interceptamos y pedimos motivo
      const changes = detectSensitiveChanges(values);
      if (changes.length > 0) {
        setSensitiveChanges(changes);
        setPendingValues(values);
        setMotivo('');
        setMotivoModalOpen(true);
        return; // No ejecutamos aún
      }
      // Sin cambios sensibles → submit directo
      await executeSubmit(values, undefined);
    },
  });

  // ─── Lógica de submit real (con o sin motivo) ─────────────
  const executeSubmit = async (values: typeof formik.values, motivoTexto: string | undefined) => {
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
          const dataToSend: any = {
            ...values,
            telefono: values.numero_telefono,
            ...(motivoTexto ? { motivo: motivoTexto } : {}),
          };
          delete dataToSend.email;
          delete dataToSend.nombre_usuario;
          await onSubmit(user.id, dataToSend);
        } finally {
          setPreparingReactivation(false);
        }
      } else {
        await onSubmit(user.id, {
          ...values,
          telefono: values.numero_telefono,
          ...(motivoTexto ? { motivo_cambio: motivoTexto } : {}),
        } as any);
      }
      onClose();
    } catch (error: any) {
      setReactivationError(error.response?.data?.error || error.message || 'Error al guardar');
    }
  };

  // ─── Confirma el modal de motivo ─────────────────────────
  const handleConfirmMotivo = async () => {
    if (!pendingValues || !motivo.trim()) return;
    setMotivoModalOpen(false);
    await executeSubmit(pendingValues, motivo);
    setPendingValues(null);
    setSensitiveChanges([]);
    setMotivo('');
  };

  useEffect(() => {
    if (user && open) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        dni: user.dni || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        numero_telefono: user.numero_telefono || '',
        rol: user.rol || 'cliente',
        activo: user.activo ?? true,
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

  // ─── Texto descriptivo dinámico según qué cambió ─────────
  const buildDescription = () => {
    if (sensitiveChanges.length === 0) return null;
    return (
      <Box>
        <Box mb={1}>Se detectaron los siguientes cambios sensibles que requieren justificación:</Box>
        {sensitiveChanges.map((c) => (
          <Box key={c.field} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
            {c.field === 'activo' 
              ? (c.to === 'Activo' ? <CheckCircle fontSize="small" color="success" /> : <Block fontSize="small" color="error" />)
              : <Edit fontSize="small" color="primary" />
            }
            <Box component="span">
              <b>{c.label}:</b>{' '}
              <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.6 }}>{c.from}</Box>
              {' → '}
              <b>{c.to}</b>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField fullWidth label="DNI" {...formik.getFieldProps('dni')}
                  error={formik.touched.dni && Boolean(formik.errors.dni)}
                  helperText={formik.touched.dni && formik.errors.dni}
                  disabled={isLoading} sx={INPUT_SX}
                />
                <TextField fullWidth label="Teléfono" {...formik.getFieldProps('numero_telefono')}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                  disabled={isLoading} sx={INPUT_SX}
                />
              </Stack>
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

      {/* ─── MODAL DE MOTIVO para cambios sensibles ─────────── */}
      <ModalMotivoAdmin
        open={motivoModalOpen}
        onClose={() => { setMotivoModalOpen(false); setMotivo(''); setPendingValues(null); }}
        onConfirm={handleConfirmMotivo}
        isLoading={isBusy}
        title="Justificación de Cambios"
        icon={<EditIcon />}
        headerColor="warning"
        confirmText="Guardar Cambios"
        confirmButtonColor="warning"
        description={buildDescription()}
        motivo_cambio={motivo}
        onMotivoChange={setMotivo}
        motivoLabel="Motivo de los cambios (Obligatorio)"
        motivoPlaceholder="Ej: Corrección de datos por solicitud del titular con documentación presentada."
        motivoHelperText="Explicá el motivo administrativo que justifica estos cambios."
      />

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
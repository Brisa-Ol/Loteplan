import React, { useEffect, useState } from 'react';
import {
  TextField, MenuItem, Stack, Box, Typography, Button, Alert,
  Switch, Chip, Avatar, useTheme, alpha, Divider, Tooltip
} from '@mui/material';
import {
  Edit as EditIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Security as SecurityIcon, Warning as WarningIcon,
  Block as BlockIcon, PersonOutline as PersonIcon, VpnKeyOutlined as KeyIcon,
  AdminPanelSettingsOutlined as SettingsIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { UpdateUserAdminDto, UsuarioDto } from '../../../../types/dto/usuario.dto';
import UsuarioService from '../../../../services/usuario.service';
import { useAuth } from '../../../../context/AuthContext'; // ✅ Importamos useAuth

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTE: DIÁLOGO 2FA (Refactorizado con BaseModal)
// ════════════════════════════════════════════════════════════

const Disable2FADialog: React.FC<{
  open: boolean; onClose: () => void; onConfirm: (justificacion: string) => void;
  isLoading: boolean; userName: string;
}> = ({ open, onClose, onConfirm, isLoading, userName }) => {
  const [justificacion, setJustificacion] = useState('');
  
  const handleConfirm = () => {
    if (justificacion.trim().length < 10) return alert('La justificación debe tener al menos 10 caracteres');
    onConfirm(justificacion); 
    setJustificacion('');
  };

  return (
    <BaseModal
        open={open}
        onClose={onClose}
        title="Confirmar Desactivación 2FA"
        subtitle={`Acción de seguridad para: ${userName}`}
        icon={<WarningIcon />}
        headerColor="warning"
        confirmText="Confirmar Desactivación"
        confirmButtonColor="warning"
        onConfirm={handleConfirm}
        isLoading={isLoading}
        disableConfirm={justificacion.trim().length < 10 || isLoading}
        maxWidth="sm"
    >
        <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            Esta acción reducirá la seguridad de la cuenta. Se requiere justificación obligatoria para auditoría.
        </Alert>
        <TextField 
          fullWidth multiline rows={4} 
          label="Justificación obligatoria" 
          placeholder="Ingrese el motivo por el cual se desactiva el 2FA..."
          value={justificacion} 
          onChange={(e) => setJustificacion(e.target.value)} 
          disabled={isLoading}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
    </BaseModal>
  );
};

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UsuarioDto | null;
  onSubmit: (id: number, data: UpdateUserAdminDto) => Promise<void>;
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
  const theme = useTheme();
  
  // ✅ Obtenemos el usuario actual logueado
  const { user: currentUser } = useAuth();

  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // ✅ Determinamos si se está auto-editando
  const isSelfEditing = currentUser?.id === user?.id;

  const formik = useFormik({
    initialValues: {
      nombre: '', apellido: '', email: '', nombre_usuario: '',
      numero_telefono: '', rol: 'cliente', activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!user) return;
      try {
        // Mapeo el campo numero_telefono a telefono para el DTO si es necesario
        // (Si ya corregiste el backend, puedes quitar 'telefono: values.numero_telefono')
        const dataToSend: any = { ...values, telefono: values.numero_telefono };
        await onSubmit(user.id, dataToSend);
        onClose();
      } catch (error) {
        console.error('Error update:', error);
      }
    },
  });

  useEffect(() => {
    if (user && open) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
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
      alert('✅ 2FA desactivado.');
      setShowDisable2FADialog(false);
      onClose(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsDisabling2FA(false);
    }
  };

  if (!user) return null;

  // Estilos reutilizables
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, 
      color: 'text.secondary', fontSize: '0.75rem', mb: 1, display: 'flex', alignItems: 'center', gap: 1
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title="Editar Usuario"
        subtitle="Modificar datos y permisos de acceso"
        icon={<EditIcon />}
        headerColor="primary"
        confirmText="Confirmar Cambios"
        onConfirm={formik.submitForm}
        isLoading={isLoading}
        disableConfirm={!formik.isValid || isLoading}
        confirmButtonIcon={<EditIcon />}
        maxWidth="md"
        headerExtra={
            <Stack direction="row" spacing={1}>
                <Chip label={`ID: ${user.id}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                {user.dni && <Chip label={`DNI: ${user.dni}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
                {/* Etiqueta visual si se está editando a sí mismo */}
                {isSelfEditing && (
                    <Chip label="TÚ" size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                )}
            </Stack>
        }
      >
        <Stack spacing={4}>

            {/* DATOS PERSONALES */}
            <Box>
                <Typography sx={sectionTitleSx}><PersonIcon fontSize="inherit" /> Información Personal</Typography>
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField fullWidth label="Nombre" {...formik.getFieldProps('nombre')} error={formik.touched.nombre && Boolean(formik.errors.nombre)} helperText={formik.touched.nombre && formik.errors.nombre} disabled={isLoading} sx={commonInputSx} />
                        <TextField fullWidth label="Apellido" {...formik.getFieldProps('apellido')} error={formik.touched.apellido && Boolean(formik.errors.apellido)} helperText={formik.touched.apellido && formik.errors.apellido} disabled={isLoading} sx={commonInputSx} />
                    </Stack>
                    <TextField fullWidth label="Teléfono" {...formik.getFieldProps('numero_telefono')} error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)} helperText={formik.touched.numero_telefono && formik.errors.numero_telefono} disabled={isLoading} sx={commonInputSx} />
                </Stack>
            </Box>

            {/* CREDENCIALES */}
            <Box>
                <Typography sx={sectionTitleSx}><KeyIcon fontSize="inherit" /> Credenciales</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="Email" {...formik.getFieldProps('email')} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} disabled={isLoading} sx={commonInputSx} />
                    <TextField fullWidth label="Usuario" {...formik.getFieldProps('nombre_usuario')} error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)} helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario} disabled={isLoading} sx={commonInputSx} />
                </Stack>
            </Box>

            <Divider />

            {/* PERMISOS Y ESTADO */}
            <Box>
                <Typography sx={sectionTitleSx}><SettingsIcon fontSize="inherit" /> Permisos y Estado</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                    
                    {/* ✅ Bloquear cambio de ROL si es uno mismo */}
                    <Tooltip title={isSelfEditing ? "No puedes cambiar tu propio rol" : ""}>
                        <TextField 
                            select 
                            label="Rol del Sistema" 
                            {...formik.getFieldProps('rol')} 
                            disabled={isLoading || isSelfEditing} 
                            sx={{ ...commonInputSx, flex: 1 }}
                        >
                            <MenuItem value="cliente">Cliente</MenuItem>
                            <MenuItem value="admin">Administrador</MenuItem>
                        </TextField>
                    </Tooltip>

                    {/* ✅ Bloquear cambio de ESTADO si es uno mismo */}
                    <Tooltip title={isSelfEditing ? "No puedes desactivar tu propia cuenta aquí" : ""}>
                        <Box sx={{ 
                            p: 1, px: 2,
                            border: '1px solid', 
                            borderColor: formik.values.activo ? 'success.main' : 'error.main', 
                            bgcolor: formik.values.activo ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05),
                            borderRadius: 2, 
                            flex: 1.5, 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: isSelfEditing ? 0.6 : 1, // Feedback visual de deshabilitado
                            cursor: isSelfEditing ? 'not-allowed' : 'default'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: formik.values.activo ? 'success.main' : 'error.main' }}>
                                    {formik.values.activo ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold" color={formik.values.activo ? 'success.dark' : 'error.dark'}>
                                        {formik.values.activo ? 'CUENTA HABILITADA' : 'CUENTA BLOQUEADA'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formik.values.activo ? 'Acceso permitido' : 'Acceso denegado'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Switch
                                checked={Boolean(formik.values.activo)}
                                onChange={formik.handleChange}
                                name="activo"
                                color={formik.values.activo ? 'success' : 'error'}
                                disabled={isLoading || isSelfEditing} // 🔒 BLOQUEADO
                            />
                        </Box>
                    </Tooltip>
                </Stack>
                
                {/* Alerta de seguridad (solo si no es self-editing) */}
                {!formik.values.activo && !isSelfEditing && (
                    <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: 2 }}>
                        Al guardar, este usuario será desconectado inmediatamente.
                    </Alert>
                )}
                 {/* Alerta de Self Editing */}
                 {isSelfEditing && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        Estás editando tu propio perfil. Ciertas acciones de seguridad están bloqueadas.
                    </Alert>
                )}
            </Box>

            {/* ZONA DE SEGURIDAD 2FA */}
            <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" /> Estado de Seguridad
                </Typography>
                <Stack direction="row" spacing={1} mb={user.is_2fa_enabled ? 2 : 0} alignItems="center">
                    <Chip 
                        icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />} 
                        label={user.confirmado_email ? 'Email Confirmado' : 'Email Pendiente'} 
                        color={user.confirmado_email ? 'success' : 'default'} 
                        size="small" variant="outlined" 
                    />
                    <Chip 
                        label={user.is_2fa_enabled ? '2FA Activado' : '2FA Desactivado'} 
                        color={user.is_2fa_enabled ? 'info' : 'default'} 
                        size="small" variant="outlined" 
                    />
                </Stack>
                
                {user.is_2fa_enabled && (
                    <Tooltip title={isSelfEditing ? "Usa 'Mi Perfil' para gestionar tu seguridad" : ""}>
                         <span> {/* Span necesario para tooltip en elemento disabled */}
                            <Button 
                                variant="outlined" 
                                color="warning" 
                                startIcon={<SecurityIcon />} 
                                onClick={() => setShowDisable2FADialog(true)} 
                                fullWidth 
                                size="small"
                                disabled={isSelfEditing} // 🔒 También bloqueamos el reset 2FA propio desde admin
                                sx={{ mt: 1, borderColor: 'warning.light', color: 'warning.dark', borderRadius: 2 }}
                            >
                                Resetear Autenticación de Dos Pasos
                            </Button>
                         </span>
                    </Tooltip>
                )}
            </Box>

        </Stack>
      </BaseModal>

      {/* Sub-modal de confirmación */}
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
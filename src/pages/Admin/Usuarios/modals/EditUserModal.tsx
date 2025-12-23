import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, Box, Typography, IconButton, Alert,
  Switch, Chip, CircularProgress, Divider, Avatar, useTheme, alpha
} from '@mui/material';
import {
  Close as CloseIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Security as SecurityIcon, Warning as WarningIcon,
  Block as BlockIcon, PersonOutline as PersonIcon, VpnKeyOutlined as KeyIcon,
  AdminPanelSettingsOutlined as SettingsIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { UpdateUserAdminDto, UsuarioDto } from '../../../../types/dto/usuario.dto';
import UsuarioService from '../../../../Services/usuario.service';

// ════════════════════════════════════════════════════════════
// DIÁLOGO CONFIRMACIÓN 2FA (Estilo mejorado)
// ════════════════════════════════════════════════════════════
const Disable2FADialog: React.FC<{
  open: boolean; onClose: () => void; onConfirm: (justificacion: string) => void;
  isLoading: boolean; userName: string;
}> = ({ open, onClose, onConfirm, isLoading, userName }) => {
  const [justificacion, setJustificacion] = useState('');
  const handleSubmit = () => {
    if (justificacion.trim().length < 10) return alert('La justificación debe tener al menos 10 caracteres');
    onConfirm(justificacion); setJustificacion('');
  };
  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
        <WarningIcon /> <Typography variant="h6" fontWeight="bold">Confirmar Desactivación 2FA</Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            Esta acción reducirá la seguridad de la cuenta de <strong>{userName}</strong>.
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
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">Cancelar</Button>
        <Button variant="contained" color="warning" onClick={handleSubmit} disabled={isLoading}>Confirmar Desactivación</Button>
      </DialogActions>
    </Dialog>
  );
};

// ════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
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
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

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

  // Estilos comunes
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
      textTransform: 'uppercase', 
      letterSpacing: 1, 
      fontWeight: 700, 
      color: 'text.secondary',
      fontSize: '0.75rem',
      mb: 1
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={isLoading ? undefined : onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
      >
        {/* HEADER */}
        <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            pb: 2, pt: 3, px: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.04)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                Editar Usuario
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {user.id} • DNI: {user.dni}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={isLoading}><CloseIcon /></IconButton>
        </DialogTitle>

        <Divider />

        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ p: 4 }}>
            <Stack spacing={4}>

              {/* DATOS PERSONALES */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography sx={sectionTitleSx}>Información Personal</Typography>
                </Stack>
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
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <KeyIcon fontSize="small" color="action" />
                    <Typography sx={sectionTitleSx}>Credenciales</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="Email" {...formik.getFieldProps('email')} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} disabled={isLoading} sx={commonInputSx} />
                    <TextField fullWidth label="Usuario" {...formik.getFieldProps('nombre_usuario')} error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)} helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario} disabled={isLoading} sx={commonInputSx} />
                </Stack>
              </Box>

              {/* PERMISOS Y ESTADO */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <SettingsIcon fontSize="small" color="action" />
                    <Typography sx={sectionTitleSx}>Permisos y Estado</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                  
                  <TextField select label="Rol del Sistema" {...formik.getFieldProps('rol')} disabled={isLoading} sx={{ ...commonInputSx, flex: 1 }}>
                    <MenuItem value="cliente">Cliente</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </TextField>

                  {/* SWITCH DE ESTADO ESTILIZADO */}
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
                    transition: 'all 0.3s ease'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ 
                            width: 32, height: 32, 
                            bgcolor: formik.values.activo ? 'success.main' : 'error.main' 
                        }}>
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
                      disabled={isLoading}
                    />
                  </Box>
                </Stack>
                
                {/* ALERTA DE SEGURIDAD */}
                {!formik.values.activo && (
                    <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: 2 }}>
                        Al guardar, este usuario será desconectado y no podrá ingresar.
                    </Alert>
                )}
              </Box>

              {/* ZONA DE SEGURIDAD 2FA */}
              <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">Estado de Seguridad</Typography>
                <Stack direction="row" spacing={1} mb={user.is_2fa_enabled ? 2 : 0} alignItems="center">
                  <Chip 
                    icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />} 
                    label={user.confirmado_email ? 'Email Confirmado' : 'Email Pendiente'} 
                    color={user.confirmado_email ? 'success' : 'default'} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={user.is_2fa_enabled ? '2FA Activado' : '2FA Desactivado'} 
                    color={user.is_2fa_enabled ? 'info' : 'default'} 
                    size="small" 
                    variant="outlined" 
                  />
                </Stack>
                
                {user.is_2fa_enabled && (
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    startIcon={<SecurityIcon />} 
                    onClick={() => setShowDisable2FADialog(true)} 
                    fullWidth 
                    size="small"
                    sx={{ mt: 1, borderColor: 'warning.light', color: 'warning.dark' }}
                  >
                    Resetear Autenticación de Dos Pasos
                  </Button>
                )}
              </Box>

            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Button onClick={onClose} variant="text" color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>Cancelar</Button>
            <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={isLoading || !formik.isValid} 
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
                sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
            >
              {isLoading ? 'Guardando...' : 'Confirmar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Disable2FADialog open={showDisable2FADialog} onClose={() => setShowDisable2FADialog(false)} onConfirm={handleDisable2FA} isLoading={isDisabling2FA} userName={`${user.nombre} ${user.apellido}`} />
    </>
  );
};

export default EditUserModal;
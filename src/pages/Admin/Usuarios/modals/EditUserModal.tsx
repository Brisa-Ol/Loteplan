import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, Box, Typography, IconButton, Alert, FormControlLabel,
  Switch, Chip, CircularProgress, Divider
} from '@mui/material';
import {
  Close as CloseIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Security as SecurityIcon, Warning as WarningIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { AdminDisable2FADto, UpdateUserAdminDto, UsuarioDto } from '../../../../types/dto/usuario.dto';
import UsuarioService from '../../../../Services/usuario.service';

// ════════════════════════════════════════════════════════════
// DIÁLOGO CONFIRMACIÓN 2FA (Sin cambios)
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
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" /> <Typography variant="h6">Confirmar Desactivación 2FA</Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>Desactivarás el 2FA para <strong>{userName}</strong>.</Alert>
        <TextField fullWidth multiline rows={4} label="Justificación" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} disabled={isLoading} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button variant="contained" color="warning" onClick={handleSubmit} disabled={isLoading}>Confirmar</Button>
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
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const formik = useFormik({
    initialValues: {
      nombre: '', apellido: '', email: '', nombre_usuario: '',
      numero_telefono: '', rol: 'cliente', activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, // ⚠️ CLAVE: Esto permite que el form se actualice si 'user' cambia
    onSubmit: async (values) => {
      if (!user) return;
      try {
        // Mapeo seguro: Si el backend pide 'telefono', le enviamos lo que hay en 'numero_telefono'
        const dataToSend: any = { ...values, telefono: values.numero_telefono };
        await onSubmit(user.id, dataToSend);
        onClose();
      } catch (error) {
        console.error('Error update:', error);
      }
    },
  });

  // Efecto para cargar datos cuando el modal se abre o cambia el usuario
  useEffect(() => {
    if (user && open) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        numero_telefono: user.numero_telefono || '',
        rol: user.rol || 'cliente',
        activo: user.activo ?? true, // ⚠️ CLAVE: Carga el estado actual (si vienes de AdminUsuarios activado, aquí será true)
      });
    }
  }, [user, open]); // Se ejecuta al abrir o cambiar user

  const handleDisable2FA = async (justificacion: string) => {
    if (!user) return;
    setIsDisabling2FA(true);
    try {
      await UsuarioService.adminReset2FA(user.id, { justificacion });
      alert('✅ 2FA desactivado.');
      setShowDisable2FADialog(false);
      onClose(); // Cerramos el modal principal para refrescar datos en la tabla padre
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsDisabling2FA(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Editar Usuario</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={isLoading}><CloseIcon /></IconButton>
        </DialogTitle>

        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              
              {/* Header Info */}
              <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2"><strong>ID:</strong> {user.id}</Typography>
                  <Typography variant="body2"><strong>DNI:</strong> {user.dni}</Typography>
                  <Typography variant="body2"><strong>Registro:</strong> {user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : '-'}</Typography>
                </Box>
              </Alert>

              {/* Datos Personales */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Información Personal</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  <TextField fullWidth label="Nombre" {...formik.getFieldProps('nombre')} error={formik.touched.nombre && Boolean(formik.errors.nombre)} helperText={formik.touched.nombre && formik.errors.nombre} disabled={isLoading} />
                  <TextField fullWidth label="Apellido" {...formik.getFieldProps('apellido')} error={formik.touched.apellido && Boolean(formik.errors.apellido)} helperText={formik.touched.apellido && formik.errors.apellido} disabled={isLoading} />
                </Box>
                <TextField fullWidth label="Teléfono" {...formik.getFieldProps('numero_telefono')} error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)} helperText={formik.touched.numero_telefono && formik.errors.numero_telefono} disabled={isLoading} />
              </Box>

              {/* Credenciales */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Credenciales</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField fullWidth label="Email" {...formik.getFieldProps('email')} error={formik.touched.email && Boolean(formik.errors.email)} helperText={formik.touched.email && formik.errors.email} disabled={isLoading} />
                  <TextField fullWidth label="Usuario" {...formik.getFieldProps('nombre_usuario')} error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)} helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario} disabled={isLoading} />
                </Box>
              </Box>

              {/* Permisos y Estado (SECCIÓN MODIFICADA) */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Permisos y Estado</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                  
                  <TextField select label="Rol" {...formik.getFieldProps('rol')} disabled={isLoading} sx={{ flex: 1 }}>
                    <MenuItem value="cliente">Cliente</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </TextField>

                  {/* ✅ SWITCH ALINEADO VISUALMENTE */}
                  <Box sx={{ 
                    p: 1, px: 2,
                    border: '1px solid', 
                    // Borde verde si activo, rojo si inactivo
                    borderColor: formik.values.activo ? 'success.main' : 'error.light', 
                    // Fondo verde suave si activo, rojo suave si inactivo
                    bgcolor: formik.values.activo ? 'success.50' : 'error.50',
                    borderRadius: 1, 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {formik.values.activo ? <CheckCircleIcon color="success" /> : <BlockIcon color="error" />}
                        <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            // Color del texto dinámico
                            color={formik.values.activo ? 'success.main' : 'error.main'}
                        >
                          {formik.values.activo ? 'CUENTA HABILITADA' : 'CUENTA DESHABILITADA'}
                        </Typography>
                    </Box>
                    
                    <Switch
                      checked={Boolean(formik.values.activo)}
                      onChange={formik.handleChange}
                      name="activo"
                      color={formik.values.activo ? 'success' : 'error'}
                      disabled={isLoading}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Mensajes de Alerta según estado */}
              {!formik.values.activo && (
                <Alert severity="error" variant="filled">
                  <strong>Atención:</strong> Al guardar, este usuario perderá acceso inmediato al sistema.
                </Alert>
              )}

              {/* Estado de Seguridad (2FA) */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">Seguridad</Typography>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />} label={user.confirmado_email ? 'Email Confirmado' : 'Pendiente'} color={user.confirmado_email ? 'success' : 'warning'} size="small" variant="outlined" />
                  <Chip label={user.is_2fa_enabled ? '2FA Activo' : '2FA Inactivo'} color={user.is_2fa_enabled ? 'info' : 'default'} size="small" variant="outlined" />
                </Stack>
                {user.is_2fa_enabled && (
                  <Button variant="outlined" color="warning" startIcon={<SecurityIcon />} onClick={() => setShowDisable2FADialog(true)} fullWidth size="small">
                    Resetear 2FA (Emergencia)
                  </Button>
                )}
              </Box>

            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={onClose} variant="outlined" color="inherit" disabled={isLoading}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={isLoading || !formik.isValid} startIcon={isLoading ? <CircularProgress size={20} /> : <EditIcon />}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Disable2FADialog open={showDisable2FADialog} onClose={() => setShowDisable2FADialog(false)} onConfirm={handleDisable2FA} isLoading={isDisabling2FA} userName={`${user.nombre} ${user.apellido}`} />
    </>
  );
};

export default EditUserModal;
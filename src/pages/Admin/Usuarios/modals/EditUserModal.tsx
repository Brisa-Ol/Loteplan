import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { AdminDisable2FADto, UpdateUserAdminDto, UsuarioDto } from '../../../../types/dto/usuario.dto';
import UsuarioService from '../../../../Services/usuario.service';

// ════════════════════════════════════════════════════════════
// 🆕 COMPONENTE DE CONFIRMACIÓN PARA DESACTIVAR 2FA
// ════════════════════════════════════════════════════════════
const Disable2FADialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (justificacion: string) => void;
  isLoading: boolean;
  userName: string;
}> = ({ open, onClose, onConfirm, isLoading, userName }) => {
  const [justificacion, setJustificacion] = useState('');

  const handleSubmit = () => {
    if (justificacion.trim().length < 10) {
      alert('La justificación debe tener al menos 10 caracteres');
      return;
    }
    onConfirm(justificacion);
    setJustificacion('');
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6" fontWeight="bold">
          Confirmar Desactivación de 2FA
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>¡Atención!</strong> Estás a punto de desactivar la autenticación de dos factores para <strong>{userName}</strong>.
          Esta acción quedará registrada en los logs de auditoría.
        </Alert>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Justificación (mínimo 10 caracteres)"
          placeholder="Ejemplo: El cliente perdió acceso a su aplicación 2FA y completó el proceso de verificación de identidad..."
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          disabled={isLoading}
          required
          helperText={`${justificacion.length} caracteres`}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={isLoading || justificacion.trim().length < 10}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
        >
          {isLoading ? 'Desactivando...' : 'Confirmar Desactivación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ════════════════════════════════════════════════════════════
// PROPS DEL MODAL PRINCIPAL
// ════════════════════════════════════════════════════════════

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UsuarioDto | null;
  onSubmit: (id: number, data: UpdateUserAdminDto) => Promise<void>;
  isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// VALIDACIÓN (Yup)
// ════════════════════════════════════════════════════════════

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("El nombre es requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("El apellido es requerido"),
  email: Yup.string().email("Email inválido").required("El email es requerido"),
  nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("El nombre de usuario es requerido"),
  // ✅ FIX CRÍTICO: Ahora usa 'numero_telefono' como en el DTO
  numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Teléfono inválido").required("El teléfono es requerido"),
  rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
  activo: Yup.boolean().required("Requerido"),
});

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  open, 
  onClose, 
  user, 
  onSubmit, 
  isLoading = false 
}) => {
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // ✅ FIX: Ahora usa 'numero_telefono' en todo el formulario
  const formik = useFormik<UpdateUserAdminDto>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      nombre_usuario: '',
      numero_telefono: '', // ✅ CORREGIDO
      rol: 'cliente',
      activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!user) return;
      try {
        await onSubmit(user.id, values);
        onClose();
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
      }
    },
  });

  useEffect(() => {
    if (user) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        numero_telefono: user.numero_telefono || '', // ✅ CORREGIDO: Ya no mapea
        rol: user.rol || 'cliente',
        activo: user.activo ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDisable2FA = async (justificacion: string) => {
    if (!user) return;
    
    setIsDisabling2FA(true);
    try {
      const payload: AdminDisable2FADto = { justificacion };
      await UsuarioService.adminReset2FA(user.id, payload);
      
      alert('✅ 2FA desactivado correctamente.');
      setShowDisable2FADialog(false);
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`❌ Error al desactivar 2FA: ${errorMsg}`);
    } finally {
      setIsDisabling2FA(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={isLoading ? undefined : onClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Editar Usuario
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              
              <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    <strong>ID:</strong> {user.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>DNI:</strong> {user.dni}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Registro:</strong> {user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : '-'}
                  </Typography>
                </Box>
              </Alert>

              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                  Información Personal
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    id="nombre"
                    label="Nombre"
                    {...formik.getFieldProps('nombre')}
                    error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                    helperText={formik.touched.nombre && formik.errors.nombre}
                    disabled={isLoading}
                    required
                  />
                  <TextField
                    fullWidth
                    id="apellido"
                    label="Apellido"
                    {...formik.getFieldProps('apellido')}
                    error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                    helperText={formik.touched.apellido && formik.errors.apellido}
                    disabled={isLoading}
                    required
                  />
                </Box>
                {/* ✅ FIX: Ahora usa 'numero_telefono' */}
                <TextField
                  fullWidth
                  id="numero_telefono"
                  name="numero_telefono"
                  label="Teléfono"
                  value={formik.values.numero_telefono}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                  disabled={isLoading}
                  required
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                  Credenciales
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    id="email"
                    label="Email"
                    type="email"
                    {...formik.getFieldProps('email')}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={isLoading}
                    required
                  />
                  <TextField
                    fullWidth
                    id="nombre_usuario"
                    label="Nombre de Usuario"
                    {...formik.getFieldProps('nombre_usuario')}
                    error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                    helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                    disabled={isLoading}
                    required
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                  Permisos y Estado
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
                  
                  <TextField
                    select
                    id="rol"
                    label="Rol de Usuario"
                    {...formik.getFieldProps('rol')}
                    disabled={isLoading}
                    sx={{ flex: 1 }}
                  >
                    <MenuItem value="cliente">Cliente</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </TextField>

                  <Box sx={{ 
                    p: 1, 
                    border: '1px solid', 
                    borderColor: formik.values.activo ? 'success.light' : 'divider', 
                    bgcolor: formik.values.activo ? 'success.lighter' : 'transparent',
                    borderRadius: 1, 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(formik.values.activo)}
                          onChange={formik.handleChange}
                          name="activo"
                          color="success"
                          disabled={isLoading}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="bold" color={formik.values.activo ? 'success.main' : 'text.secondary'}>
                          {formik.values.activo ? 'CUENTA ACTIVA' : 'CUENTA SUSPENDIDA'}
                        </Typography>
                      }
                    />
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                  Estado de Seguridad
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip 
                    icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />}
                    label={user.confirmado_email ? 'Email Confirmado' : 'Email No Confirmado'} 
                    color={user.confirmado_email ? 'success' : 'warning'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={user.is_2fa_enabled ? '2FA Habilitado' : '2FA Deshabilitado'} 
                    color={user.is_2fa_enabled ? 'info' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                {user.is_2fa_enabled && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        ⚠️ Gestión de Autenticación de Dos Factores
                      </Typography>
                      <Typography variant="caption">
                        Si el cliente perdió acceso a su aplicación 2FA, puedes desactivarla temporalmente.
                        Se requiere justificación para auditoría.
                      </Typography>
                    </Alert>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<SecurityIcon />}
                      onClick={() => setShowDisable2FADialog(true)}
                      fullWidth
                    >
                      Desactivar 2FA de este Usuario
                    </Button>
                  </Box>
                )}
              </Box>

              {!formik.values.activo && (
                <Alert severity="error" variant="filled">
                  <strong>Atención:</strong> Al desactivar esta cuenta, el usuario perderá el acceso inmediato a la plataforma.
                </Alert>
              )}

            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              color="inherit"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              color="primary"
              disabled={isLoading || !formik.isValid}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
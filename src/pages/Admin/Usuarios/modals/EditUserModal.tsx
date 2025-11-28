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
// Asegúrate de que la ruta de importación sea correcta según tu estructura


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
      // Idealmente usar un toast/snackbar, pero alert funciona para validación rápida
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
  // ⚠️ CAMBIO IMPORTANTE: Validamos 'telefono' en lugar de 'numero_telefono'
  telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Teléfono inválido").required("El teléfono es requerido"),
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
  // Estado para controlar el diálogo de desactivación 2FA
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // Inicializamos Formik con UpdateUserAdminDto
  // Nota: UpdateUserAdminDto usa 'telefono', no 'numero_telefono'
  const formik = useFormik<UpdateUserAdminDto>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      nombre_usuario: '',
      telefono: '', // Corresponde al campo del DTO de actualización
      rol: 'cliente',
      activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, // Permite reiniciar valores cuando cambia 'user'
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

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        // 🚨 MAPEO CRÍTICO: De 'numero_telefono' (BD) a 'telefono' (DTO Update)
        telefono: user.numero_telefono || '', 
        rol: user.rol || 'cliente',
        activo: user.activo ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // FUNCIÓN PARA DESACTIVAR 2FA
  const handleDisable2FA = async (justificacion: string) => {
    if (!user) return;
    
    setIsDisabling2FA(true);
    try {
      const payload: AdminDisable2FADto = { justificacion };
      // Llamada al servicio corregido (PATCH /reset-2fa)
      await UsuarioService.adminReset2FA(user.id, payload);
      
      alert('✅ 2FA desactivado correctamente.');
      setShowDisable2FADialog(false);
      
      // Cerrar modal principal para forzar refresco en la tabla padre si es necesario
      onClose();
      // Opcional: window.location.reload() si no gestionas estado global
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
              
              {/* DATOS DE SOLO LECTURA (IDs y Fechas) */}
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

              {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
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
                <TextField
                  fullWidth
                  id="telefono" // ⚠️ Nombre del campo ajustado a 'telefono'
                  name="telefono" // ⚠️ Nombre del campo ajustado a 'telefono'
                  label="Teléfono"
                  value={formik.values.telefono}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.telefono && Boolean(formik.errors.telefono)}
                  helperText={formik.touched.telefono && formik.errors.telefono}
                  disabled={isLoading}
                  required
                />
              </Box>

              {/* SECCIÓN 2: CREDENCIALES */}
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

              {/* SECCIÓN 3: PERMISOS Y ESTADO */}
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

              {/* SECCIÓN 4: INDICADORES DE SEGURIDAD */}
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

                {/* BOTÓN PARA DESACTIVAR 2FA */}
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

              {/* Alerta de suspensión */}
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

      {/* DIÁLOGO DE CONFIRMACIÓN PARA DESACTIVAR 2FA */}
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
// src/components/Admin/Users/EditUserModal.tsx

import React, { useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { UpdateUserAdminDto, UsuarioDto } from '../../../../types/dto/usuario.dto';



// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UsuarioDto | null; // ✅ Usamos el DTO de respuesta
  onSubmit: (id: number, data: UpdateUserAdminDto) => Promise<void>; // ✅ Usamos el DTO de envío
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

  // 2. Configuración de Formik con el DTO de Actualización
  const formik = useFormik<UpdateUserAdminDto>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      nombre_usuario: '',
      numero_telefono: '',
      rol: 'cliente',
      activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, // Importante para cargar los datos cuando 'user' llega
    onSubmit: async (values) => {
      if (!user) return;
      try {
        // values ya coincide con UpdateUserAdminDto gracias a TypeScript
        await onSubmit(user.id, values);
        onClose();
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
      }
    },
  });

  // 3. Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        numero_telefono: user.numero_telefono || '',
        rol: user.rol || 'cliente',
        activo: user.activo ?? true, // Usamos ?? por si activo es false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
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
                id="numero_telefono"
                label="Teléfono"
                {...formik.getFieldProps('numero_telefono')}
                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
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
                
                {/* Selector de Rol */}
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

                {/* Switch de Activo/Inactivo */}
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

            {/* SECCIÓN 4: INDICADORES DE SEGURIDAD (Visual) */}
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
  );
};

export default EditUserModal;
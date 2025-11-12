// src/components/Admin/Users/EditUserModal.tsx (Adaptado con Formik/Yup y SIN Grid)

import React, { useState, useEffect } from 'react';
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
import { useFormik } from 'formik'; // ❗ 1. Importamos Formik
import * as Yup from 'yup'; // ❗ 2. Importamos Yup

// ❗ 3. Importamos los tipos centralizados
import type { UpdateUserByAdminDTO } from '../../../types/dto/usuario.dto'; 
import type { User } from '../../../types/dto/auth.types';

// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null; // Usamos el tipo 'User' de auth.types.ts
  onSubmit: (id: number, data: UpdateUserByAdminDTO) => Promise<void>;
  isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════

// ❗ 4. Usamos los nombres de campo de 'UpdateUserByAdminDTO'
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

  // ❗ 5. Usamos Formik para manejar el estado y la validación
  const formik = useFormik<UpdateUserByAdminDTO>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      nombre_usuario: '',
      telefono: '', // ❗ CORREGIDO: de 'telefono' a 'numero_telefono'
      rol: 'cliente',
      activo: true,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, // Permite que los valores se actualicen cuando 'user' cambie
    onSubmit: async (values) => {
      if (!user) return;
      try {
        await onSubmit(user.id, values);
        onClose(); // Cierra solo si tiene éxito
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
      }
    },
  });

  // Efecto para cargar datos en Formik cuando el 'user' (prop) cambia
  useEffect(() => {
    if (user) {
      formik.setValues({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        nombre_usuario: user.nombre_usuario || '',
        telefono: user.numero_telefono || '', // ❗ CORREGIDO
        rol: user.rol || 'cliente',
        activo: user.activo ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Se ejecuta solo cuando el 'user' (prop) cambia

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
            
            <Alert severity="info" icon={false}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight="medium">
                  <strong>ID:</strong> {user.id}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  <strong>DNI:</strong> {user.dni}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {/* ❗ CORRECCIÓN: Tu tipo 'User' ahora tiene 'fecha_registro' */}
                  <strong>Registro:</strong> {new Date(user.fecha_registro || '').toLocaleDateString()}
                </Typography>
              </Box>
            </Alert>

            {/* INFORMACIÓN PERSONAL (SIN GRID) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
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
                {...formik.getFieldProps('numero_telefono')} // ❗ CORREGIDO
                error={formik.touched.telefono && Boolean(formik.errors.telefono)} // ❗ CORREGIDO
                helperText={formik.touched.telefono && formik.errors.telefono} // ❗ CORREGIDO
                disabled={isLoading}
                required
              />
            </Box>

            {/* CREDENCIALES (SIN GRID) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
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

            {/* PERMISOS Y ESTADO (SIN GRID) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Permisos y Estado
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  select
                  id="rol"
                  label="Rol"
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
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  flex: 1, 
                  minHeight: 56, 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.activo}
                        onChange={formik.handleChange} // Formik maneja el 'checked'
                        name="activo"
                        color="success"
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formik.values.activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            </Box>

            {/* ESTADO DE SEGURIDAD (SOLO LECTURA) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Estado de Seguridad
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip 
                  icon={user.confirmado_email ? <CheckCircleIcon /> : <CancelIcon />}
                  label={user.confirmado_email ? 'Email Confirmado' : 'Email Pendiente'} 
                  color={user.confirmado_email ? 'success' : 'warning'}
                  size="small"
                />
                <Chip 
                  label={user.is_2fa_enabled ? '2FA Activo' : '2FA Inactivo'} 
                  color={user.is_2fa_enabled ? 'info' : 'default'}
                  size="small"
                />
              </Stack>
            </Box>

            {!formik.values.activo && (
              <Alert severity="warning">
                <strong>Advertencia:</strong> Al desactivar esta cuenta, el usuario no podrá iniciar sesión.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
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
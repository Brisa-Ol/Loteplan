// src/components/Admin/CreateUserModal.tsx (Corregido sin 'name' duplicado)

import React, { useState } from 'react';
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
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { CreateUsuarioDTO } from '../../../../types/dto/usuario.dto';

// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioDTO) => Promise<void>;
  isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("El nombre es requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("El apellido es requerido"),
  email: Yup.string().email("Email inválido").required("El email es requerido"),
  dni: Yup.string()
    .matches(/^\d+$/, "El DNI debe contener solo números")
    .min(7, "DNI inválido (mínimo 7 dígitos)")
    .max(8, "DNI inválido (máximo 8 dígitos)")
    .required("El DNI es requerido"),
  nombre_usuario: Yup.string()
    .min(4, "Mínimo 4 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo")
    .required("El nombre de usuario es requerido"),
  numero_telefono: Yup.string()
    .matches(/^\d+$/, "Solo números")
    .min(10, "Teléfono inválido (mínimo 10 dígitos)")
    .required("El teléfono es requerido"),
  contraseña: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe contener mayúscula, minúscula y número"
    )
    .required("La contraseña es requerida"),
  rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
});

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik<CreateUsuarioDTO>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      dni: '',
      nombre_usuario: '',
      contraseña: '',
      numero_telefono: '',
      rol: 'cliente'
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (error) {
        console.error('Error al crear usuario:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : handleClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Crear Nuevo Usuario
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            
            {/* INFORMACIÓN PERSONAL */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Información Personal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="nombre"
                  // name="nombre" 👈 CORRECCIÓN: Eliminado
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
                  // name="apellido" 👈 CORRECCIÓN: Eliminado
                  label="Apellido"
                  {...formik.getFieldProps('apellido')}
                  error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                  helperText={formik.touched.apellido && formik.errors.apellido}
                  disabled={isLoading}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  id="dni"
                  // name="dni" 👈 CORRECCIÓN: Eliminado
                  label="DNI"
                  {...formik.getFieldProps('dni')}
                  error={formik.touched.dni && Boolean(formik.errors.dni)}
                  helperText={formik.touched.dni && formik.errors.dni}
                  disabled={isLoading}
                  required
                  placeholder="12345678"
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                />
                <TextField
                  fullWidth
                  id="numero_telefono"
                  // name="numero_telefono" 👈 CORRECCIÓN: Eliminado
                  label="Teléfono"
                  {...formik.getFieldProps('numero_telefono')}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                  disabled={isLoading}
                  required
                  placeholder="+5491112345678"
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                />
              </Box>
            </Box>

            {/* CREDENCIALES DE ACCESO */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Credenciales de Acceso
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="email"
                  // name="email" 👈 CORRECCIÓN: Eliminado
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
                  // name="nombre_usuario" 👈 CORRECCIÓN: Eliminado
                  label="Nombre de Usuario"
                  {...formik.getFieldProps('nombre_usuario')}
                  error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                  helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                  disabled={isLoading}
                  required
                />
              </Box>
              <TextField
                fullWidth
                sx={{ mt: 2 }}
                id="contraseña"
                // name="contraseña" 👈 CORRECCIÓN: Eliminado
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                {...formik.getFieldProps('contraseña')}
                error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                helperText={formik.touched.contraseña && formik.errors.contraseña || 'Mínimo 8 caracteres, con mayúscula, minúscula y número'}
                disabled={isLoading}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* ROL Y PERMISOS */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Rol y Permisos
              </Typography>
              <TextField
                fullWidth
                select
                id="rol"
                // name="rol" 👈 CORRECCIÓN: Eliminado
                label="Rol"
                {...formik.getFieldProps('rol')}
                disabled={isLoading}
              >
                <MenuItem value="cliente">Cliente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </TextField>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Nota:</strong> El usuario recibirá un email de confirmación 
                para activar su cuenta.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        {/* ACCIONES */}
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
          >
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateUserModal;
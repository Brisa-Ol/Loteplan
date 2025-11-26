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
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { CreateUsuarioDto } from '../../../../types/dto/usuario.dto';



// ════════════════════════════════════════════════════════════
// PROPS CORRECTAS PARA CREAR (Sin 'user', sin 'id')
// ════════════════════════════════════════════════════════════

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioDto) => Promise<void>; // ✅ Solo recibe data
  isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════

const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  email: Yup.string().email("Email inválido").required("Requerido"),
  dni: Yup.string().matches(/^\d+$/, "Solo números").min(7).max(8).required("Requerido"),
  nombre_usuario: Yup.string().min(4).required("Requerido"),
  numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10).required("Requerido"),
  contraseña: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe tener mayúscula, minúscula y número")
    .required("Requerido"),
  rol: Yup.string().oneOf(['admin', 'cliente']).required("Requerido"),
});

// ════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════

const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik<CreateUsuarioDto>({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      dni: '',
      nombre_usuario: '',
      numero_telefono: '',
      contraseña: '',
      rol: 'cliente', 
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await onSubmit(values); // ✅ Enviamos solo los valores
        resetForm(); 
      } catch (error) {
        console.error("Error creating user", error);
      }
    },
  });

  // Helper para inputs numéricos
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    formik.setFieldValue(name, numericValue);
  };

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
          <Stack spacing={3}>
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
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
                    />
                    <TextField
                        fullWidth
                        id="apellido"
                        label="Apellido"
                        {...formik.getFieldProps('apellido')}
                        error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                        helperText={formik.touched.apellido && formik.errors.apellido}
                        disabled={isLoading}
                    />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                        fullWidth
                        id="dni"
                        name="dni"
                        label="DNI"
                        value={formik.values.dni}
                        onChange={handleNumericChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dni && Boolean(formik.errors.dni)}
                        helperText={formik.touched.dni && formik.errors.dni}
                        disabled={isLoading}
                    />
                    <TextField
                        fullWidth
                        id="numero_telefono"
                        name="numero_telefono"
                        label="Teléfono"
                        value={formik.values.numero_telefono}
                        onChange={handleNumericChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                        helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                        disabled={isLoading}
                    />
                </Box>
            </Box>

            {/* SECCIÓN 2: ACCESO */}
            <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                    Credenciales de Acceso
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        id="email"
                        label="Email"
                        type="email"
                        {...formik.getFieldProps('email')}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        disabled={isLoading}
                    />
                    <TextField
                        fullWidth
                        id="nombre_usuario"
                        label="Usuario"
                        {...formik.getFieldProps('nombre_usuario')}
                        error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                        helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                        disabled={isLoading}
                    />
                </Box>
                <TextField
                    fullWidth
                    id="contraseña"
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    {...formik.getFieldProps('contraseña')}
                    error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                    helperText={formik.touched.contraseña && formik.errors.contraseña}
                    disabled={isLoading}
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

            {/* SECCIÓN 3: ROL */}
            <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                    Rol
                </Typography>
                <TextField
                    fullWidth
                    select
                    id="rol"
                    label="Rol"
                    {...formik.getFieldProps('rol')}
                    disabled={isLoading}
                >
                    <MenuItem value="cliente">Cliente</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                </TextField>
            </Box>

            <Alert severity="info">
                El usuario se creará como "Inactivo" hasta que confirme su email.
            </Alert>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
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
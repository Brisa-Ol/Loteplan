// src/pages/MiCuenta/Perfil.tsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Paper,
  Avatar
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import type { UpdateUserMeDto } from '../../../types/dto/usuario.dto'; // ✅ FIX: Usar el DTO correcto
import UsuarioService from '../../../Services/usuario.service';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';

const Perfil: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Configuración de la Mutación
  const mutation = useMutation({
    mutationFn: async (data: UpdateUserMeDto) => {
      const response = await UsuarioService.updateMe(data);
      return response.data;
    },
    onSuccess: async () => {
      await refetchUser();
      setIsEditing(false);
      setSuccessOpen(true);
      setServerError(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al actualizar el perfil.';
      setServerError(msg);
    },
  });

  // 2. Configuración del Formulario
  const formik = useFormik<UpdateUserMeDto>({
    initialValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      numero_telefono: user?.numero_telefono || '', // ✅ CORRECTO
      nombre_usuario: user?.nombre_usuario || '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      apellido: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
      email: Yup.string().email('Email inválido').required('Requerido'),
      nombre_usuario: Yup.string().min(4, 'Mínimo 4 caracteres').required('Requerido'),
      numero_telefono: Yup.string()
        .matches(/^[0-9+\- ]+$/, 'Solo números, espacios o guiones')
        .min(8, 'Número muy corto')
        .required('Requerido'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
    enableReinitialize: true,
  });

  const handleCancel = () => {
    formik.resetForm();
    setServerError(null);
    setIsEditing(false);
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>

        {/* Encabezado */}
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Avatar
            sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
          >
            {user?.nombre?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h3" fontWeight="bold">
            Mi Perfil
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Gestiona tu información personal
          </Typography>
        </Box>

        {/* Tarjeta Principal */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>

          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>

              {/* --- Datos Personales --- */}
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  Datos Personales
                </Typography>
                <Divider />
              </Box>

              {/* Fila 1: Nombre y Apellido */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={isEditing ? formik.values.nombre : user?.nombre}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                  helperText={isEditing && formik.touched.nombre && formik.errors.nombre}
                  disabled={!isEditing || mutation.isPending}
                  variant={isEditing ? "outlined" : "filled"}
                />
                <TextField
                  fullWidth
                  label="Apellido"
                  name="apellido"
                  value={isEditing ? formik.values.apellido : user?.apellido}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                  helperText={isEditing && formik.touched.apellido && formik.errors.apellido}
                  disabled={!isEditing || mutation.isPending}
                  variant={isEditing ? "outlined" : "filled"}
                />
              </Box>

              {/* Fila 2: DNI (Solo lectura) */}
              <TextField
                fullWidth
                label="DNI / Identificación"
                value={user?.dni || ''}
                disabled
                variant="filled"
                helperText="Este campo no se puede modificar."
              />

              {/* --- Información de Cuenta --- */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Información de Cuenta
                </Typography>
                <Divider />
              </Box>

              {/* Fila 3: Usuario y Email */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  name="nombre_usuario"
                  value={isEditing ? formik.values.nombre_usuario : user?.nombre_usuario}
                  onChange={formik.handleChange}
                  error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                  helperText={isEditing && formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                  disabled={!isEditing || mutation.isPending}
                  variant={isEditing ? "outlined" : "filled"}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={isEditing ? formik.values.email : user?.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={isEditing && formik.touched.email && formik.errors.email}
                  disabled={!isEditing || mutation.isPending}
                  variant={isEditing ? "outlined" : "filled"}
                />
              </Box>

              {/* Fila 4: Teléfono */}
              <TextField
                fullWidth
                label="Teléfono"
                name="numero_telefono"
                value={isEditing ? formik.values.numero_telefono : user?.numero_telefono}
                onChange={formik.handleChange}
                error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                helperText={isEditing && formik.touched.numero_telefono && formik.errors.numero_telefono}
                disabled={!isEditing || mutation.isPending}
                variant={isEditing ? "outlined" : "filled"}
              />

              {/* --- Botones de Acción --- */}
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    size="large"
                  >
                    Editar Información
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleCancel}
                      startIcon={<CloseIcon />}
                      disabled={mutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={mutation.isPending || !formik.isValid}
                    >
                      {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </>
                )}
              </Box>

            </Stack>
          </form>
        </Paper>
      </Stack>

      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled">
          ¡Perfil actualizado correctamente!
        </Alert>  
      </Snackbar>
    </PageContainer>
  );
};

export default Perfil;
// src/pages/MiCuenta/Perfil.tsx (VERSIÓN LIMPIA Y MODERNA)
// ═══════════════════════════════════════════════════════════
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
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { PageContainer } from '../../components/common';
import { useMutation } from '@tanstack/react-query';
import { updateMyProfile } from '../../Services/usuario.service';
import type { UpdateProfileDTO } from '../../types/dto/usuario.dto';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Perfil: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileDTO) => updateMyProfile(data),
    onSuccess: (updatedUser) => {
      updateUserContext(updatedUser);
      setIsEditing(false);
      setSuccessOpen(true);
    },
    onError: (error: any) => {
      console.error("Error al actualizar el perfil:", error);
    },
  });

  const formik = useFormik<UpdateProfileDTO>({
    initialValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      numero_telefono: user?.numero_telefono || '',
      email: user?.email || '',
      nombre_usuario: user?.nombre_usuario || '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("El nombre es requerido"),
      apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("El apellido es requerido"),
      numero_telefono: Yup.string()
        .matches(/^[0-9()+\- ]+$/, "Formato de teléfono inválido")
        .required("El teléfono es requerido"),
      email: Yup.string().email("Email inválido").required("El email es requerido"),
      nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("El nombre de usuario es requerido"),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
    enableReinitialize: true,
  });

  return (
    <PageContainer maxWidth="sm">
      <Stack spacing={4} alignItems="center">
        {/* Título */}
        <Box textAlign="center">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Mi Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestioná tu información personal
          </Typography>
        </Box>

        {/* Contenedor del perfil */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {!isEditing ? (
            // --- MODO VISTA ---
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Nombre completo
                </Typography>
                <Typography variant="h6">
                  {user?.nombre} {user?.apellido}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography>{user?.email}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Teléfono
                </Typography>
                <Typography>{user?.numero_telefono}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Usuario
                </Typography>
                <Typography>{user?.nombre_usuario}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  DNI
                </Typography>
                <Typography>{user?.dni}</Typography>
              </Box>

              <Box textAlign="right" mt={2}>
                <Button variant="contained" onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              </Box>
            </Stack>
          ) : (
            // --- MODO EDICIÓN ---
            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={2}>
                {mutation.isError && (
                  <Alert severity="error">
                    {(mutation.error as Error)?.message || "No se pudo guardar los cambios."}
                  </Alert>
                )}

                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    {...formik.getFieldProps("nombre")}
                    error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                    helperText={formik.touched.nombre && formik.errors.nombre}
                    disabled={mutation.isPending}
                  />
                  <TextField
                    fullWidth
                    label="Apellido"
                    {...formik.getFieldProps("apellido")}
                    error={formik.touched.apellido && Boolean(formik.errors.apellido)}
                    helperText={formik.touched.apellido && formik.errors.apellido}
                    disabled={mutation.isPending}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  {...formik.getFieldProps("nombre_usuario")}
                  error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                  helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                  disabled={mutation.isPending}
                />

                <TextField
                  fullWidth
                  label="Número de Teléfono"
                  {...formik.getFieldProps("numero_telefono")}
                  error={formik.touched.numero_telefono && Boolean(formik.errors.numero_telefono)}
                  helperText={formik.touched.numero_telefono && formik.errors.numero_telefono}
                  disabled={mutation.isPending}
                />

                <TextField
                  fullWidth
                  label="Email"
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  disabled={mutation.isPending}
                />

                <TextField
                  fullWidth
                  label="DNI"
                  value={user?.dni || ''}
                  disabled
                  helperText="El DNI no se puede modificar."
                />

                {/* Botones */}
                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      formik.resetForm();
                      mutation.reset();
                    }}
                    disabled={mutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={mutation.isPending || !formik.isValid}
                    sx={{ minWidth: 150, position: 'relative' }}
                  >
                    {mutation.isPending ? (
                      <>
                        <CircularProgress size={22} sx={{ position: 'absolute' }} />
                        <span style={{ opacity: 0 }}>Guardando...</span>
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Paper>
      </Stack>

      {/* Snackbar de éxito */}
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        message="Perfil actualizado correctamente 🎉"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PageContainer>
  );
};

export default Perfil;

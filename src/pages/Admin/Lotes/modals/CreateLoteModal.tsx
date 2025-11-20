// src/components/Admin/Lotes/CreateLoteModal.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Alert, Divider
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import type { CreateLoteDTO } from '../../../../types/dto/lote.dto';
import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';

interface CreateLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDTO, images: File[]) => Promise<void>;
  isLoading?: boolean;
  proyectos: ProyectoDTO[];
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .required('Requerido'),
  precio_base: Yup.number()
    .min(0, 'Debe ser positivo')
    .required('Requerido'),
  fecha_inicio: Yup.date().nullable(),
  fecha_fin: Yup.date()
    .nullable()
    .when('fecha_inicio', {
      is: (val: any) => val != null,
      then: (schema) => schema.min(
        Yup.ref('fecha_inicio'),
        'Debe ser posterior a la fecha de inicio'
      ),
    }),
  id_proyecto: Yup.number().nullable(),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

const CreateLoteModal: React.FC<CreateLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  proyectos
}) => {
  const [images, setImages] = useState<File[]>([]);

  const formik = useFormik<CreateLoteDTO>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      fecha_inicio: null,
      fecha_fin: null,
      id_proyecto: null,
      latitud: null,
      longitud: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        // Formatear fechas a ISO string si existen
        const dataToSend: CreateLoteDTO = {
          ...values,
          fecha_inicio: values.fecha_inicio
            ? new Date(values.fecha_inicio).toISOString()
            : null,
          fecha_fin: values.fecha_fin
            ? new Date(values.fecha_fin).toISOString()
            : null,
        };

        await onSubmit(dataToSend, images);
        formik.resetForm();
        setImages([]);
        onClose();
      } catch (error) {
        console.error('Error al crear lote:', error);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setImages([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Crear Nuevo Lote
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Información Básica */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight="medium"
              >
                Información Básica
              </Typography>
              <TextField
                fullWidth
                id="nombre_lote"
                label="Nombre del Lote"
                {...formik.getFieldProps('nombre_lote')}
                error={
                  formik.touched.nombre_lote &&
                  Boolean(formik.errors.nombre_lote)
                }
                helperText={
                  formik.touched.nombre_lote && formik.errors.nombre_lote
                }
                disabled={isLoading}
                required
              />
              <TextField
                fullWidth
                id="precio_base"
                label="Precio Base"
                type="number"
                sx={{ mt: 2 }}
                {...formik.getFieldProps('precio_base')}
                error={
                  formik.touched.precio_base &&
                  Boolean(formik.errors.precio_base)
                }
                helperText={
                  formik.touched.precio_base && formik.errors.precio_base
                }
                disabled={isLoading}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Box>

            {/* Proyecto */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight="medium"
              >
                Asignación a Proyecto
              </Typography>
              <TextField
                fullWidth
                select
                id="id_proyecto"
                label="Proyecto (Opcional)"
                {...formik.getFieldProps('id_proyecto')}
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>Sin proyecto (Subasta pública)</em>
                </MenuItem>
                {proyectos.map((proyecto) => (
                  <MenuItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre_proyecto}
                  </MenuItem>
                ))}
              </TextField>
              <Alert severity="info" sx={{ mt: 1 }}>
                Si no asignas un proyecto, el lote estará disponible para
                subasta pública.
              </Alert>
            </Box>

            {/* Fechas */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight="medium"
              >
                Fechas de Subasta (Opcional)
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  id="fecha_inicio"
                  label="Fecha de Inicio"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={
                    formik.touched.fecha_inicio &&
                    Boolean(formik.errors.fecha_inicio)
                  }
                  helperText={
                    formik.touched.fecha_inicio && formik.errors.fecha_inicio
                  }
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="fecha_fin"
                  label="Fecha de Fin"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_fin')}
                  error={
                    formik.touched.fecha_fin &&
                    Boolean(formik.errors.fecha_fin)
                  }
                  helperText={
                    formik.touched.fecha_fin && formik.errors.fecha_fin
                  }
                  disabled={isLoading}
                />
              </Box>
            </Box>

            {/* Ubicación */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight="medium"
              >
                Ubicación Geográfica (Opcional)
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  id="latitud"
                  label="Latitud"
                  type="number"
                  {...formik.getFieldProps('latitud')}
                  error={
                    formik.touched.latitud && Boolean(formik.errors.latitud)
                  }
                  helperText={formik.touched.latitud && formik.errors.latitud}
                  disabled={isLoading}
                  inputProps={{ step: 'any' }}
                />
                <TextField
                  fullWidth
                  id="longitud"
                  label="Longitud"
                  type="number"
                  {...formik.getFieldProps('longitud')}
                  error={
                    formik.touched.longitud && Boolean(formik.errors.longitud)
                  }
                  helperText={
                    formik.touched.longitud && formik.errors.longitud
                  }
                  disabled={isLoading}
                  inputProps={{ step: 'any' }}
                />
              </Box>
            </Box>

            <Divider />

            {/* Upload de Imágenes - MÚLTIPLES para carrusel */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                fontWeight="medium"
              >
                Imágenes del Lote (Carrusel)
              </Typography>
              <ImageUploadZone
                images={images}
                onChange={setImages}
                maxFiles={10}
                maxSizeMB={15}
                disabled={isLoading}
              />
              {images.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Puedes agregar hasta 10 imágenes para el carrusel del lote.
                  También puedes hacerlo después de crear el lote.
                </Alert>
              )}
            </Box>
          </Stack>
        </DialogContent>

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
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
          >
            {isLoading ? 'Creando...' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateLoteModal;
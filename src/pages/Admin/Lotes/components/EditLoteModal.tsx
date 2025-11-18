// src/components/Admin/Lotes/EditLoteModal.tsx
import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton, CircularProgress,
  MenuItem, Alert, Chip
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';


import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';
import { proyectoService } from '../../../../Services/proyecto.service';
import type { LoteDTO, LoteUpdateDTO } from '../../../../types/dto/lote.dto';

interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: LoteUpdateDTO) => Promise<void>;
  lote: LoteDTO | null;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres'),
  precio_base: Yup.number().min(0, 'Debe ser positivo'),
  fecha_inicio: Yup.date().nullable(),
  fecha_fin: Yup.date().nullable(),
  id_proyecto: Yup.number().nullable(),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'activa': return 'success';
    case 'finalizada': return 'default';
    case 'pendiente': return 'warning';
    default: return 'default';
  }
};

const EditLoteModal: React.FC<EditLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  lote,
  isLoading = false,
}) => {
  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery<
    ProyectoDTO[], Error
  >({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos,
    enabled: open,
  });

  const formik = useFormik<LoteUpdateDTO>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      fecha_inicio: null,
      fecha_fin: null,
      id_proyecto: null,
      latitud: null,
      longitud: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!lote) return;

      const dataToSend: LoteUpdateDTO = {
        ...values,
        fecha_inicio: values.fecha_inicio
          ? new Date(values.fecha_inicio).toISOString()
          : null,
        fecha_fin: values.fecha_fin
          ? new Date(values.fecha_fin).toISOString()
          : null,
      };

      await onSubmit(lote.id, dataToSend);
      onClose();
    },
  });

  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote,
        precio_base:Number(lote.precio_base),
        fecha_inicio: lote.fecha_inicio ? lote.fecha_inicio.slice(0, 16) : null,
        fecha_fin: lote.fecha_fin ? lote.fecha_fin.slice(0, 16) : null,
        id_proyecto: lote.id_proyecto,
        latitud: lote.latitud,
        longitud: lote.longitud,
      });
    }
  }, [lote, open]);

  if (!lote) return null;

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Editar Lote: {lote.nombre_lote}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>

            {/* Información del lote */}
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  <strong>ID:</strong> {lote.id}
                </Typography>

                <Chip
                  label={lote.estado_subasta.toUpperCase()}
                  size="small"
                  color={getEstadoColor(lote.estado_subasta)}
                />

                {lote.id_ganador && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ganador ID:</strong> {lote.id_ganador}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Nombre + precio */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Información Básica
              </Typography>

              <TextField
                fullWidth
                id="nombre_lote"
                label="Nombre del Lote"
                {...formik.getFieldProps('nombre_lote')}
                error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)}
                helperText={formik.touched.nombre_lote && formik.errors.nombre_lote}
                disabled={isLoading}
              />

              <TextField
                fullWidth
                id="precio_base"
                label="Precio Base"
                type="number"
                sx={{ mt: 2 }}
                {...formik.getFieldProps('precio_base')}
                error={formik.touched.precio_base && Boolean(formik.errors.precio_base)}
                helperText={formik.touched.precio_base && formik.errors.precio_base}
                disabled={isLoading || lote.estado_subasta === 'activa'}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
              />

              {lote.estado_subasta === 'activa' && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No se puede modificar el precio base de una subasta activa
                </Alert>
              )}
            </Box>

            {/* Proyecto */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Proyecto
              </Typography>

              <TextField
                fullWidth
                select
                id="id_proyecto"
                label="Asignar a Proyecto"
                {...formik.getFieldProps('id_proyecto')}
                disabled={isLoading || isLoadingProyectos || lote.estado_subasta !== 'pendiente'}
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

              {lote.estado_subasta !== 'pendiente' && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Solo se puede cambiar el proyecto de lotes en estado "pendiente"
                </Alert>
              )}
            </Box>

            {/* Fechas */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Fechas de Subasta
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="fecha_inicio"
                  label="Fecha de Inicio"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                  helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio}
                  disabled={isLoading || lote.estado_subasta !== 'pendiente'}
                />

                <TextField
                  fullWidth
                  id="fecha_fin"
                  label="Fecha de Fin"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_fin')}
                  error={formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin)}
                  helperText={formik.touched.fecha_fin && formik.errors.fecha_fin}
                  disabled={isLoading || lote.estado_subasta === 'finalizada'}
                />
              </Box>
            </Box>

            {/* Ubicación */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Ubicación Geográfica
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="latitud"
                  label="Latitud"
                  type="number"
                  {...formik.getFieldProps('latitud')}
                  error={formik.touched.latitud && Boolean(formik.errors.latitud)}
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
                  error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                  helperText={formik.touched.longitud && formik.errors.longitud}
                  disabled={isLoading}
                  inputProps={{ step: 'any' }}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" disabled={isLoading}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={
              isLoading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />
            }
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditLoteModal;

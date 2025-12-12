// src/components/Admin/Lotes/EditLoteModal.tsx

import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton,
  CircularProgress, MenuItem, Alert, Divider,
  Chip
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import type { LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';

import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import ProyectoService from '../../../../Services/proyecto.service';



interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLoteDto) => Promise<void>;
  lote: LoteDto | null;
  isLoading?: boolean;
}

// Validación
const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(),
  // Usamos mixed para permitir string vacio temporalmente en el formulario
  id_proyecto: Yup.mixed().nullable(),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

// Helper visual para estado
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'activa': return 'success';
    case 'finalizada': return 'info';
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

  // 1. Cargar Proyectos
  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<UpdateLoteDto>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      fecha_inicio: '',
      fecha_fin: '',
      id_proyecto: null,
      latitud: undefined,
      longitud: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!lote) return;

      // 🛠️ CORRECCIÓN DEL ERROR TS2367
      // Convertimos a 'unknown' para poder comparar con string vacío sin que TS se queje
      const rawId = values.id_proyecto as unknown;

      const dataToSend: UpdateLoteDto = {
        ...values,
        // ✅ datetime-local ya está en formato correcto, solo agregamos si tiene valor
        fecha_inicio: values.fecha_inicio || undefined,
        fecha_fin: values.fecha_fin || undefined,

        // Lógica segura: Si es '' o null -> null. Si no, Number().
        id_proyecto: (rawId === '' || rawId === null) ? null : Number(rawId),

        // Coordenadas (null si no hay valor)
        latitud: values.latitud ?? null,
        longitud: values.longitud ?? null
      };

      try {
        await onSubmit(lote.id, dataToSend);
        onClose();
      } catch (error) {
        console.error('Error al editar lote:', error);
      }
    },
    enableReinitialize: false
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote,
        precio_base: Number(lote.precio_base),
        fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().slice(0, 16) : '',
        fecha_fin: lote.fecha_fin ? new Date(lote.fecha_fin).toISOString().slice(0, 16) : '',
        id_proyecto: lote.id_proyecto,
        latitud: lote.latitud,
        longitud: lote.longitud,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Typography variant="h6" fontWeight="bold">Editar Lote #{lote.id}</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>

            {/* Estado */}
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary"><strong>ID:</strong> {lote.id}</Typography>
                <Chip
                  label={lote.estado_subasta.toUpperCase()}
                  size="small"
                  color={getStatusColor(lote.estado_subasta) as any}
                  sx={{ fontWeight: 'bold' }}
                />
                {lote.id_ganador && (
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Ganador ID: {lote.id_ganador}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Info Básica */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Información Básica</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre del Lote"
                  {...formik.getFieldProps('nombre_lote')}
                  error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)}
                  helperText={formik.touched.nombre_lote && formik.errors.nombre_lote}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Precio Base"
                  {...formik.getFieldProps('precio_base')}
                  disabled={isLoading || lote.estado_subasta === 'activa'}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Box>
              {lote.estado_subasta === 'activa' && (
                <Alert severity="warning" sx={{ mt: 1 }}>No se puede modificar el precio base de una subasta activa.</Alert>
              )}
            </Box>

            <Divider />

            {/* Proyecto */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Asociación</Typography>
              <TextField
                select
                fullWidth
                label="Proyecto Asociado"
                {...formik.getFieldProps('id_proyecto')}
                // ✅ Usamos ?? '' para manejar el null en el Select de MUI
                value={formik.values.id_proyecto ?? ''}
                disabled={isLoading || isLoadingProyectos || lote.estado_subasta !== 'pendiente'}
              >
                <MenuItem value=""><em>Sin Asignar (Huérfano)</em></MenuItem>
                {proyectos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                ))}
              </TextField>
              {lote.estado_subasta !== 'pendiente' && (
                <Alert severity="info" sx={{ mt: 1 }}>Solo se puede cambiar el proyecto de lotes en estado "pendiente".</Alert>
              )}
            </Box>

            <Divider />

            {/* Fechas */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Tiempos de Subasta</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Inicio"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  disabled={isLoading || lote.estado_subasta !== 'pendiente'}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Fin"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_fin')}
                  disabled={isLoading || lote.estado_subasta === 'finalizada'}
                />
              </Box>
            </Box>

            <Divider />

            {/* Ubicación */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">Ubicación Geográfica</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitud"
                  {...formik.getFieldProps('latitud')}
                  disabled={isLoading}
                  inputProps={{ step: 'any' }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Longitud"
                  {...formik.getFieldProps('longitud')}
                  disabled={isLoading}
                  inputProps={{ step: 'any' }}
                />
              </Box>
            </Box>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} disabled={isLoading} color="inherit">Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditLoteModal;
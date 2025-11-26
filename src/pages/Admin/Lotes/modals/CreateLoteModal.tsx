import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton,
  CircularProgress, MenuItem, Alert, Divider, Chip
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import ProyectoService from '../../../../Services/proyecto.service';

// ✅ CORRECCIÓN 1: Tipo correcto para onSubmit
interface CreateEditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDto | UpdateLoteDto, id?: number) => Promise<void>;
  loteToEdit?: LoteDto | null;
  isLoading?: boolean;
}

// ✅ CORRECCIÓN 2: Validación mejorada
const validationSchema = Yup.object({
  nombre_lote: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .required('El nombre es requerido'),
  precio_base: Yup.number()
    .min(0, 'Debe ser positivo')
    .required('El precio base es requerido'),
  id_proyecto: Yup.mixed().nullable(),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string()
    .nullable()
    .test('fecha-fin-posterior', 'La fecha fin debe ser posterior al inicio', function(value) {
      const { fecha_inicio } = this.parent;
      if (!value || !fecha_inicio) return true;
      return new Date(value) > new Date(fecha_inicio);
    }),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

// ✅ Helper para estado visual
const getStatusColor = (estado: string): 'success' | 'info' | 'warning' | 'default' => {
  switch (estado) {
    case 'activa': return 'success';
    case 'finalizada': return 'info';
    case 'pendiente': return 'warning';
    default: return 'default';
  }
};

const CreateEditLoteModal: React.FC<CreateEditLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  loteToEdit,
  isLoading = false,
}) => {
  
  // Cargar proyectos para el selector
  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<CreateLoteDto>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      id_proyecto: null,
      fecha_inicio: '',
      fecha_fin: '',
      latitud: null,
      longitud: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      // ✅ CORRECCIÓN 3: Limpieza de datos antes de enviar
      const rawId = values.id_proyecto as unknown;
      const idProyectoLimpio = (rawId === '' || rawId === null) ? null : Number(rawId);

      const payload: CreateLoteDto | UpdateLoteDto = {
        nombre_lote: values.nombre_lote,
        precio_base: Number(values.precio_base),
        id_proyecto: idProyectoLimpio,
        // Solo enviar fechas si tienen valor
        ...(values.fecha_inicio && { 
          fecha_inicio: new Date(values.fecha_inicio).toISOString() 
        }),
        ...(values.fecha_fin && { 
          fecha_fin: new Date(values.fecha_fin).toISOString() 
        }),
        // Solo enviar coordenadas si son válidas
        ...(values.latitud && values.latitud !== 0 && { latitud: values.latitud }),
        ...(values.longitud && values.longitud !== 0 && { longitud: values.longitud }),
      };

      await onSubmit(payload, loteToEdit?.id);
    },
  });

  // ✅ CORRECCIÓN 4: Cargar datos al editar
  useEffect(() => {
    if (open) {
      if (loteToEdit) {
        formik.setValues({
          nombre_lote: loteToEdit.nombre_lote,
          precio_base: Number(loteToEdit.precio_base),
          id_proyecto: loteToEdit.id_proyecto,
          fecha_inicio: loteToEdit.fecha_inicio 
            ? new Date(loteToEdit.fecha_inicio).toISOString().slice(0, 16) 
            : '',
          fecha_fin: loteToEdit.fecha_fin 
            ? new Date(loteToEdit.fecha_fin).toISOString().slice(0, 16) 
            : '',
          latitud: loteToEdit.latitud || null,
          longitud: loteToEdit.longitud || null,
        });
      } else {
        formik.resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loteToEdit]);

  const handleClose = () => {
    if (!isLoading) {
      formik.resetForm();
      onClose();
    }
  };

  // ✅ Flags para deshabilitar campos según estado
  const esEdicion = !!loteToEdit;
  const subastaActiva = loteToEdit?.estado_subasta === 'activa';
  const subastaFinalizada = loteToEdit?.estado_subasta === 'finalizada';
  const puedeEditarPrecios = !subastaActiva && !subastaFinalizada;
  const puedeEditarProyecto = !esEdicion || loteToEdit?.estado_subasta === 'pendiente';

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : handleClose} 
      maxWidth="md" 
      fullWidth
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 1 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {esEdicion ? <EditIcon color="primary" /> : <SaveIcon color="primary" />}
          <Typography variant="h6" fontWeight="bold">
            {esEdicion ? `Editar Lote #${loteToEdit.id}` : 'Crear Nuevo Lote'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            
            {/* Badge de Estado (Solo en Edición) */}
            {esEdicion && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 1, 
                border: '1px solid', 
                borderColor: 'divider' 
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {loteToEdit.id}
                  </Typography>
                  <Chip
                    label={loteToEdit.estado_subasta.toUpperCase()}
                    size="small"
                    color={getStatusColor(loteToEdit.estado_subasta)}
                    sx={{ fontWeight: 'bold' }}
                  />
                  {loteToEdit.id_ganador && (
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      Ganador ID: {loteToEdit.id_ganador}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Información Básica */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Información Básica
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' } 
              }}>
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
                  label="Precio Base"
                  type="number"
                  {...formik.getFieldProps('precio_base')}
                  error={formik.touched.precio_base && Boolean(formik.errors.precio_base)}
                  helperText={formik.touched.precio_base && formik.errors.precio_base}
                  disabled={isLoading || !puedeEditarPrecios}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Box>
              {!puedeEditarPrecios && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No se puede modificar el precio base en subastas activas o finalizadas.
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Proyecto Asociado */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Asociación a Proyecto
              </Typography>
              <TextField
                select
                fullWidth
                label="Proyecto Asociado"
                {...formik.getFieldProps('id_proyecto')}
                value={formik.values.id_proyecto ?? ''}
                disabled={isLoading || loadingProyectos || !puedeEditarProyecto}
                helperText={
                  !puedeEditarProyecto 
                    ? "Solo se puede cambiar en estado 'pendiente'"
                    : "Si se deja vacío, será un lote de subasta pública"
                }
              >
                <MenuItem value=""><em>Sin Asignar (Lote Público)</em></MenuItem>
                {proyectos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre_proyecto}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Divider />

            {/* Fechas de Subasta */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Tiempos de Subasta
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' } 
              }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Fecha Inicio"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                  helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio}
                  disabled={isLoading || subastaActiva || subastaFinalizada}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Fecha Fin"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_fin')}
                  error={formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin)}
                  helperText={formik.touched.fecha_fin && formik.errors.fecha_fin}
                  disabled={isLoading || subastaFinalizada}
                />
              </Box>
            </Box>

            <Divider />

            {/* Ubicación Geográfica */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Ubicación Geográfica (Opcional)
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' } 
              }}>
                <TextField
                  fullWidth
                  label="Latitud"
                  type="number"
                  {...formik.getFieldProps('latitud')}
                  error={formik.touched.latitud && Boolean(formik.errors.latitud)}
                  helperText={formik.touched.latitud && formik.errors.latitud}
                  inputProps={{ step: 'any' }}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  label="Longitud"
                  type="number"
                  {...formik.getFieldProps('longitud')}
                  error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                  helperText={formik.touched.longitud && formik.errors.longitud}
                  inputProps={{ step: 'any' }}
                  disabled={isLoading}
                />
              </Box>
            </Box>

          </Stack>
        </DialogContent>
        
        {/* Footer con acciones */}
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            color="inherit" 
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading || !formik.isValid || !formik.dirty}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
          >
            {isLoading ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateEditLoteModal;
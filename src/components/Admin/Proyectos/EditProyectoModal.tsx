// src/components/Admin/Proyectos/EditProyectoModal.tsx
import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Alert
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import type { ProyectoDTO, UpdateProyectoDTO } from '../../../types/dto/proyecto.dto';

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateProyectoDTO) => Promise<void>;
  proyecto: ProyectoDTO | null;
  isLoading?: boolean;
}

// Validación (más flexible que en creación)
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres'),
  descripcion: Yup.string().nullable(),
  monto_inversion: Yup.number().min(0, 'Debe ser positivo'),
  moneda: Yup.string(),
  fecha_inicio: Yup.date(),
  fecha_cierre: Yup.date(),
  plazo_inversion: Yup.number().min(1, 'Debe ser mayor a 0').nullable(),
  obj_suscripciones: Yup.number().min(1, 'Debe ser mayor a 0').nullable(),
  suscripciones_minimas: Yup.number().nullable(),
  forma_juridica: Yup.string().nullable(),
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
});

const EditProyectoModal: React.FC<EditProyectoModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  proyecto,
  isLoading = false 
}) => {

  const formik = useFormik<UpdateProyectoDTO>({
    initialValues: {
      nombre_proyecto: '',
      descripcion: '',
      plazo_inversion: undefined,
      forma_juridica: '',
      monto_inversion: 0,
      moneda: 'ARS',
      suscripciones_minimas: undefined,
      obj_suscripciones: undefined,
      fecha_inicio: '',
      fecha_cierre: '',
      latitud: undefined,
      longitud: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await onSubmit(proyecto.id.toString(), values);
        onClose();
      } catch (error) {
        console.error('Error al actualizar proyecto:', error);
      }
    },
  });

  // Cargar datos del proyecto cuando se abre el modal
  useEffect(() => {
    if (proyecto && open) {
      formik.setValues({
        nombre_proyecto: proyecto.nombre_proyecto,
        descripcion: proyecto.descripcion || '',
        plazo_inversion: proyecto.plazo_inversion || undefined,
        forma_juridica: proyecto.forma_juridica || '',
        monto_inversion: proyecto.monto_inversion || 0,
        moneda: proyecto.moneda || 'ARS',
        suscripciones_minimas: proyecto.suscripciones_minimas || undefined,
        obj_suscripciones: proyecto.obj_suscripciones || undefined,
        fecha_inicio: proyecto.fecha_inicio,
        fecha_cierre: proyecto.fecha_cierre,
        latitud: proyecto.latitud || undefined,
        longitud: proyecto.longitud || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto, open]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  if (!proyecto) return null;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Editar Proyecto: {proyecto.nombre_proyecto}
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
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Información Básica
              </Typography>
              <TextField
                fullWidth
                id="nombre_proyecto"
                label="Nombre del Proyecto"
                {...formik.getFieldProps('nombre_proyecto')}
                error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                disabled={isLoading}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                id="descripcion"
                label="Descripción"
                sx={{ mt: 2 }}
                {...formik.getFieldProps('descripcion')}
                disabled={isLoading}
              />
            </Box>

            {/* Tipo de Inversión (No editable) */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Tipo de Inversión:</strong> {proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
              <br />
              <Typography variant="caption">
                El tipo de inversión no se puede modificar después de la creación.
              </Typography>
            </Alert>

            {/* Moneda y Monto */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                fullWidth
                select
                id="moneda"
                label="Moneda"
                {...formik.getFieldProps('moneda')}
                disabled={isLoading || proyecto.tipo_inversion === 'mensual'}
                sx={{ flex: 1 }}
              >
                <MenuItem value="ARS">ARS (Pesos)</MenuItem>
                <MenuItem value="USD">USD (Dólares)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                id="monto_inversion"
                label={proyecto.tipo_inversion === 'mensual' ? "Monto Base (Cuota)" : "Monto Inversión (Total)"}
                type="number"
                {...formik.getFieldProps('monto_inversion')}
                error={formik.touched.monto_inversion && Boolean(formik.errors.monto_inversion)}
                helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                disabled={isLoading}
                sx={{ flex: 1 }}
              />
            </Box>

            {/* Fechas */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Fechas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="fecha_inicio"
                  label="Fecha de Inicio"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                  helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="fecha_cierre"
                  label="Fecha de Cierre"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_cierre')}
                  error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                  helperText={formik.touched.fecha_cierre && formik.errors.fecha_cierre}
                  disabled={isLoading}
                />
              </Box>
            </Box>

            {/* Campos Condicionales para 'Mensual' */}
            {proyecto.tipo_inversion === 'mensual' && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                  Configuración de Ahorro (Mensual)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    id="plazo_inversion"
                    label="Plazo (Total Cuotas)"
                    type="number"
                    {...formik.getFieldProps('plazo_inversion')}
                    error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                    helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                    disabled={isLoading}
                  />
                  <TextField
                    fullWidth
                    id="obj_suscripciones"
                    label="Objetivo Suscripciones"
                    type="number"
                    {...formik.getFieldProps('obj_suscripciones')}
                    error={formik.touched.obj_suscripciones && Boolean(formik.errors.obj_suscripciones)}
                    helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones}
                    disabled={isLoading}
                  />
                  <TextField
                    fullWidth
                    id="suscripciones_minimas"
                    label="Suscripciones Mínimas"
                    type="number"
                    {...formik.getFieldProps('suscripciones_minimas')}
                    error={formik.touched.suscripciones_minimas && Boolean(formik.errors.suscripciones_minimas)}
                    helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas}
                    disabled={isLoading}
                  />
                </Box>
              </Box>
            )}

            {/* Campos Adicionales */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Detalles Adicionales
              </Typography>
              <TextField
                fullWidth
                id="forma_juridica"
                label="Forma Jurídica (ej. Fideicomiso)"
                {...formik.getFieldProps('forma_juridica')}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="latitud"
                  label="Latitud (Opcional)"
                  type="number"
                  {...formik.getFieldProps('latitud')}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="longitud"
                  label="Longitud (Opcional)"
                  type="number"
                  {...formik.getFieldProps('longitud')}
                  disabled={isLoading}
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
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProyectoModal;
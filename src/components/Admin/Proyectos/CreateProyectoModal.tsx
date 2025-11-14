// src/components/Admin/Proyectos/CreateProyectoModal.tsx (CON UNA IMAGEN)
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Alert, Divider
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import type { CreateProyectoDTO } from '../../../types/dto/proyecto.dto';
import SingleImageUpload from '../../common/singleImageUpload/SingleImageUpload';

interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProyectoDTO, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().nullable(),
  tipo_inversion: Yup.string().oneOf(['directo', 'mensual']).required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date().required('Requerido'),
  plazo_inversion: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1, 'Debe ser mayor a 0').required('Requerido para tipo "mensual"'),
    otherwise: (schema) => schema.nullable(),
  }),
  obj_suscripciones: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1, 'Debe ser mayor a 0').required('Requerido para tipo "mensual"'),
    otherwise: (schema) => schema.nullable(),
  }),
  suscripciones_minimas: Yup.number().nullable(),
  forma_juridica: Yup.string().nullable(),
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [image, setImage] = useState<File | null>(null);

  const formik = useFormik<CreateProyectoDTO>({
    initialValues: {
      nombre_proyecto: '',
      descripcion: '',
      tipo_inversion: 'mensual',
      plazo_inversion: 12,
      forma_juridica: 'Fideicomiso',
      monto_inversion: 0,
      moneda: 'ARS',
      suscripciones_minimas: 1,
      obj_suscripciones: 1,
      fecha_inicio: '',
      fecha_cierre: '',
      latitud: undefined,
      longitud: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        await onSubmit(values, image);
        formik.resetForm();
        setImage(null);
        onClose();
      } catch (error) {
        console.error('Error al crear proyecto:', error);
      }
    },
  });
  
  useEffect(() => {
    if (formik.values.tipo_inversion === 'mensual') {
      formik.setFieldValue('moneda', 'ARS');
    } else if (formik.values.tipo_inversion === 'directo') {
      formik.setFieldValue('moneda', 'USD');
    }
  }, [formik.values.tipo_inversion]);

  const handleClose = () => {
    formik.resetForm();
    setImage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Crear Nuevo Proyecto</Typography>
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
                required
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

            {/* Tipo de Inversión y Moneda */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                fullWidth
                select
                id="tipo_inversion"
                label="Tipo de Inversión"
                {...formik.getFieldProps('tipo_inversion')}
                disabled={isLoading}
                sx={{ flex: 1 }}
              >
                <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
                <MenuItem value="directo">Inversión (Directo)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                id="moneda"
                label="Moneda"
                {...formik.getFieldProps('moneda')}
                disabled={isLoading || formik.values.tipo_inversion === 'mensual' || formik.values.tipo_inversion === 'directo'}
                sx={{ flex: 1 }}
              >
                <MenuItem value="ARS">ARS (Pesos)</MenuItem>
                <MenuItem value="USD">USD (Dólares)</MenuItem>
              </TextField>
            </Box>

            {/* Monto y Fechas */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Montos y Plazos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="monto_inversion"
                  label={formik.values.tipo_inversion === 'mensual' ? "Monto Base (Cuota)" : "Monto Inversión (Total)"}
                  type="number"
                  {...formik.getFieldProps('monto_inversion')}
                  error={formik.touched.monto_inversion && Boolean(formik.errors.monto_inversion)}
                  helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                  disabled={isLoading}
                  required
                />
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
                  required
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
                  required
                />
              </Box>
            </Box>

            {/* Campos Condicionales para Mensual */}
            {formik.values.tipo_inversion === 'mensual' && (
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
                    required
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
                    required
                  />
                  <TextField
                    fullWidth
                    id="suscripciones_minimas"
                    label="Suscripciones Mínimas"
                    type="number"
                    {...formik.getFieldProps('suscripciones_minimas')}
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

            <Divider />

            {/* Upload de UNA SOLA Imagen para Proyecto */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Imagen Principal del Proyecto
              </Typography>
              <SingleImageUpload
                image={image}
                onChange={setImage}
                maxSizeMB={15}
                disabled={isLoading}
              />
              {!image && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Puedes agregar la imagen principal ahora o después de crear el proyecto.
                </Alert>
              )}
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
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {isLoading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProyectoModal;
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Divider, Alert, InputAdornment
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Importaciones
import type { CreateProyectoDto } from '../../../../../types/dto/proyecto.dto';
import SingleImageUpload from '../../../../../components/common/singleImageUpload/SingleImageUpload';

interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProyectoDto, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

// ✅ VALIDACIONES ALINEADAS AL BACKEND
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().nullable(),
  tipo_inversion: Yup.string().oneOf(['directo', 'mensual']).required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  
  // Fechas
  fecha_inicio: Yup.date()
    .required('Requerido')
    .min(new Date(new Date().setHours(0,0,0,0)), 'La fecha de inicio no puede ser anterior a hoy'),
  fecha_cierre: Yup.date()
    .required('Requerido')
    .min(Yup.ref('fecha_inicio'), 'La fecha de cierre debe ser posterior a la fecha de inicio'),

  // Condicionales para 'mensual'
  plazo_inversion: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1).required('Requerido para tipo mensual'),
    otherwise: (schema) => schema.nullable(),
  }),
  obj_suscripciones: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1).required('Requerido para tipo mensual'),
    otherwise: (schema) => schema.nullable(),
  }),
  
  suscripciones_minimas: Yup.number().nullable().min(0),
  forma_juridica: Yup.string().max(100, 'Máximo 100 caracteres').nullable(),

  // ✅ NUEVO: Validaciones de Geo-localización (Igual al modelo Sequelize)
  latitud: Yup.number()
    .nullable()
    .min(-90, 'Latitud mínima -90')
    .max(90, 'Latitud máxima 90')
    .typeError('Debe ser un número válido'),
  longitud: Yup.number()
    .nullable()
    .min(-180, 'Longitud mínima -180')
    .max(180, 'Longitud máxima 180')
    .typeError('Debe ser un número válido'),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [image, setImage] = useState<File | null>(null);

  const handleClose = () => {
    formik.resetForm();
    setImage(null);
    onClose();
  };

  const formik = useFormik<CreateProyectoDto>({
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
      // ✅ Inicializamos como undefined para que no envíe "0" si está vacío
      latitud: undefined, 
      longitud: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        await onSubmit(values, image); 
        handleClose(); 
      } catch (error) {
        console.error('Error al crear proyecto:', error);
      }
    },
  });
  
  // Lógica de Moneda Automática
  useEffect(() => {
    if (formik.values.tipo_inversion === 'mensual') {
      formik.setFieldValue('moneda', 'ARS');
    } else if (formik.values.tipo_inversion === 'directo') {
      formik.setFieldValue('moneda', 'USD');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tipo_inversion]);

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
            
            {/* 1. Información Básica */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Información General
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
              <TextField
                  fullWidth
                  id="forma_juridica"
                  label="Forma Jurídica"
                  placeholder="Ej: Fideicomiso, S.A., SRL"
                  sx={{ mt: 2 }}
                  {...formik.getFieldProps('forma_juridica')}
                  error={formik.touched.forma_juridica && Boolean(formik.errors.forma_juridica)}
                  helperText={formik.touched.forma_juridica && formik.errors.forma_juridica}
                  disabled={isLoading}
                />
            </Box>

            <Divider />

            {/* 2. Configuración Financiera */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Configuración Financiera
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                 <TextField
                  fullWidth
                  select
                  id="tipo_inversion"
                  label="Tipo de Inversión"
                  {...formik.getFieldProps('tipo_inversion')}
                  disabled={isLoading}
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
                  // Deshabilitado porque se controla automáticamente
                  disabled={true} 
                >
                  <MenuItem value="ARS">ARS (Pesos)</MenuItem>
                  <MenuItem value="USD">USD (Dólares)</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="monto_inversion"
                  label={formik.values.tipo_inversion === 'mensual' ? "Valor Cuota Base" : "Monto Total Inversión"}
                  type="number" 
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  {...formik.getFieldProps('monto_inversion')}
                  error={formik.touched.monto_inversion && Boolean(formik.errors.monto_inversion)}
                  helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                  disabled={isLoading}
                  required
                />
                 {formik.values.tipo_inversion === 'mensual' && (
                    <TextField
                      fullWidth
                      id="plazo_inversion"
                      label="Plazo (Meses)"
                      type="number"
                      {...formik.getFieldProps('plazo_inversion')}
                      error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                      helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                      disabled={isLoading}
                      required
                    />
                 )}
              </Box>
            </Box>

            {/* 3. Suscripciones (Solo Mensual) */}
            {formik.values.tipo_inversion === 'mensual' && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                  Objetivos de Suscripción
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    id="obj_suscripciones"
                    label="Objetivo (Total)"
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
                    label="Mínimo para Iniciar"
                    type="number"
                    {...formik.getFieldProps('suscripciones_minimas')}
                    disabled={isLoading}
                  />
                </Box>
              </Box>
            )}

            <Divider />

            {/* 4. Tiempos y Fechas */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Cronograma
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  id="fecha_inicio"
                  label="Apertura Suscripciones"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                  helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
                  disabled={isLoading}
                  required
                />
                <TextField
                  fullWidth
                  id="fecha_cierre"
                  label="Cierre Suscripciones"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_cierre')}
                  error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                  helperText={formik.touched.fecha_cierre && (formik.errors.fecha_cierre as string)}
                  disabled={isLoading}
                  required
                />
              </Box>
            </Box>

            {/* ✅ 5. Ubicación (NUEVO SECCIÓN PARA MATCHEAR BACKEND) */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" /> Ubicación Geográfica
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  id="latitud"
                  label="Latitud"
                  type="number"
                  placeholder="-32.889459"
                  inputProps={{ step: "any" }} // Permite decimales
                  {...formik.getFieldProps('latitud')}
                  error={formik.touched.latitud && Boolean(formik.errors.latitud)}
                  helperText={formik.touched.latitud && formik.errors.latitud}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="longitud"
                  label="Longitud"
                  type="number"
                  placeholder="-68.845839"
                  inputProps={{ step: "any" }} // Permite decimales
                  {...formik.getFieldProps('longitud')}
                  error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                  helperText={formik.touched.longitud && formik.errors.longitud}
                  disabled={isLoading}
                />
              </Box>
            </Box>

            <Divider />

            {/* 6. Imagen */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Imagen de Portada
              </Typography>
              <SingleImageUpload
                image={image}
                onChange={setImage}
                maxSizeMB={15}
                disabled={isLoading}
              />
              {!image && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  La imagen es opcional al crear, pero recomendada para el catálogo.
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
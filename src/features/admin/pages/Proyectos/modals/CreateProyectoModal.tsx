import {
  Add as AddIcon,
  ArrowForward,
  CalendarMonth as CalendarIcon,
  MonetizationOn as MonetizationIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Step, StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useMemo, useState } from 'react';
import * as Yup from 'yup';

import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import ImageUpload from '@/shared/components/forms/upload/ImageUploadZone';

// --- FUNCIONES Y VARIABLES AUXILIARES ---

// Bloquea el tipeo de caracteres inválidos en campos numéricos
const blockInvalidChar = (e: React.KeyboardEvent) =>
  ['e', 'E', '-', '+'].includes(e.key) && e.preventDefault();

// Fecha de hoy en formato YYYY-MM-DD para el atributo 'min' de los calendarios
const today = new Date().toISOString().split('T')[0];

// Estilos del campo de fecha para mostrar el icono de MUI e invisibilizar el del navegador
const dateFieldSx = {
  '& .MuiInputBase-input': {
    color: 'text.primary',
  },
  '& input::-webkit-calendar-picker-indicator': {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    cursor: 'pointer',
    opacity: 0, // El del navegador es invisible para que se vea el de MUI
  },
};

// --- ESQUEMAS DE VALIDACIÓN ---
const projectSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().min(20, 'Describe mejor el proyecto').required('Requerido'),
  tipo_inversion: Yup.string().required('Requerido'),
  monto_inversion: Yup.number().positive('Debe ser mayor a 0').required('Requerido'),
  moneda: Yup.string().required('Requerido'),

  // Validaciones de Fechas
  fecha_inicio: Yup.date()
    .required('La fecha de inicio es requerida')
    .min(today, 'La fecha no puede ser anterior a hoy'),
  fecha_cierre: Yup.date()
    .required('La fecha de cierre es requerida')
    .min(
      Yup.ref('fecha_inicio'),
      'La fecha de cierre no puede ser anterior a la de inicio'
    ),

  // Suscriptores
  obj_suscripciones: Yup.number().integer().min(1, 'Mínimo 1').required('Requerido'),
  suscripciones_minimas: Yup.number()
    .integer()
    .min(1, 'Mínimo 1')
    .required('Requerido')
    .test('min-max', 'No puede superar al cupo máximo', function (value) {
      return value <= this.parent.obj_suscripciones;
    }),
});

const quotaSchema = Yup.object({
  valor_cemento_unidades: Yup.number().positive('Mínimo 1').required('Requerido'),
  valor_cemento: Yup.number().positive('Precio inválido').required('Requerido'),
  porcentaje_plan: Yup.number().min(0).max(100),
  porcentaje_administrativo: Yup.number().min(0).max(100),
  porcentaje_iva: Yup.number().min(0).max(100),
});

const CreateProyectoModal: React.FC<any> = ({ open, onClose, onSubmit, isLoading = false }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  const [nombreContrato, setNombreContrato] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      nombre_proyecto: '', descripcion: '', tipo_inversion: 'mensual',
      plazo_inversion: 12, forma_juridica: 'Fideicomiso', monto_inversion: 0, // Se inicializa en 0 para UI, pero Yup pedirá que sea mayor
      moneda: 'ARS', suscripciones_minimas: 1, obj_suscripciones: 10,
      fecha_inicio: '', fecha_cierre: '',
      latitud: '', longitud: '',
      nombre_cemento_cemento: 'Bolsa de Cemento', valor_cemento_unidades: 1, valor_cemento: 0,
      porcentaje_plan: 70, porcentaje_administrativo: 10, porcentaje_iva: 21,
    },
    onSubmit: async (values) => {
      const cleanData = {
        ...values,
        monto_inversion: values.monto_inversion.toString(),
        latitud: values.latitud === '' ? null : values.latitud,
        longitud: values.longitud === '' ? null : values.longitud,
      };
      await onSubmit(cleanData, image, contratoFile, nombreContrato);
      handleReset();
    },
  });

  const handleReset = () => {
    formik.resetForm();
    setImage(null);
    setContratoFile(null);
    setActiveStep(0);
    onClose();
  };

  const steps = formik.values.tipo_inversion === 'mensual'
    ? ['Información', 'Cuotas', 'Multimedia', 'Contrato']
    : ['Información', 'Multimedia', 'Contrato'];

  const currentStepLabel = steps[activeStep];

  const handleNext = async () => {
    const schema = currentStepLabel === 'Información' ? projectSchema : quotaSchema;
    try {
      if (currentStepLabel !== 'Multimedia' && currentStepLabel !== 'Contrato') {
        await schema.validate(formik.values, { abortEarly: false });
      }
      setActiveStep(prev => prev + 1);
    } catch (err: any) {
      const errors: any = {};
      err.inner.forEach((e: any) => { errors[e.path] = e.message; });
      formik.setErrors(errors);
    }
  };

  const simulation = useMemo(() => {
    const { plazo_inversion, valor_cemento_unidades, valor_cemento, porcentaje_plan, porcentaje_administrativo, porcentaje_iva } = formik.values;
    const valorMovil = (Number(valor_cemento_unidades) || 0) * (Number(valor_cemento) || 0);
    const cuotaMensualFull = valorMovil / (Number(plazo_inversion) || 1);
    const cuotaPuraPlan = (valorMovil * ((porcentaje_plan || 0) / 100)) / (Number(plazo_inversion) || 1);
    const gastosAdmin = cuotaMensualFull * ((porcentaje_administrativo || 0) / 100);
    const iva = gastosAdmin * ((porcentaje_iva || 0) / 100);
    return { pura: cuotaPuraPlan, admin: gastosAdmin, final: cuotaPuraPlan + gastosAdmin + iva };
  }, [formik.values]);

  return (
    <BaseModal
      open={open} onClose={handleReset} title="Nuevo Proyecto" icon={<AddIcon />}
      headerColor="primary" hideConfirmButton hideCancelButton maxWidth="md" isLoading={isLoading}
      customActions={
        <>
          <Button onClick={activeStep === 0 ? handleReset : () => setActiveStep(p => p - 1)} color="inherit" sx={{ mr: 'auto' }}>
            {activeStep === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={formik.submitForm} startIcon={<AddIcon />} disabled={isLoading}>Crear Proyecto</Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>Siguiente</Button>
          )}
        </>
      }
    >
      <Stack spacing={3}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>

        {currentStepLabel === 'Información' && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Nombre del Proyecto" {...formik.getFieldProps('nombre_proyecto')} error={Boolean(formik.touched.nombre_proyecto && formik.errors.nombre_proyecto)} helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto as string} />
              <TextField fullWidth label="Forma Jurídica" {...formik.getFieldProps('forma_juridica')} />
            </Stack>

            <TextField fullWidth multiline rows={3} label="Descripción" {...formik.getFieldProps('descripcion')} error={Boolean(formik.touched.descripcion && formik.errors.descripcion)} helperText={formik.errors.descripcion as string} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonetizationIcon fontSize="small" color="primary" /> Configuración Financiera
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField select fullWidth label="Tipo Inversión" {...formik.getFieldProps('tipo_inversion')}>
                <MenuItem value="mensual">Plan de Ahorro</MenuItem>
                <MenuItem value="directo">Inversión Directa</MenuItem>
              </TextField>
              <TextField
                fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0 }} label="Monto Inversión"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                {...formik.getFieldProps('monto_inversion')}
                onChange={(e) => {
                  if (Number(e.target.value) < 0) return;
                  formik.handleChange(e);
                }}
                error={Boolean(formik.touched.monto_inversion && formik.errors.monto_inversion)}
                helperText={formik.touched.monto_inversion && formik.errors.monto_inversion as string}
              />
            </Stack>

            {formik.values.tipo_inversion === 'mensual' && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Stack spacing={2}>
                  <TextField 
                    fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 1 }} label="Plazo (Meses)" 
                    {...formik.getFieldProps('plazo_inversion')} 
                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                    error={Boolean(formik.touched.plazo_inversion && formik.errors.plazo_inversion)} 
                    helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion as string} 
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField 
                      fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 1 }} label="Min. Suscriptores" 
                      {...formik.getFieldProps('suscripciones_minimas')} 
                      onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                      error={Boolean(formik.errors.suscripciones_minimas)} 
                      helperText={formik.errors.suscripciones_minimas as string} 
                    />
                    <TextField 
                      fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 1 }} label="Cupo Máximo" 
                      {...formik.getFieldProps('obj_suscripciones')} 
                      onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                      error={Boolean(formik.errors.obj_suscripciones)} 
                      helperText={formik.errors.obj_suscripciones as string} 
                    />
                  </Stack>
                </Stack>
              </Paper>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="primary" /> Fechas Clave
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Inicio de Ronda"
                InputLabelProps={{ shrink: true }}
                {...formik.getFieldProps('fecha_inicio')}
                inputProps={{ min: today }} // Bloquea visualmente días pasados
                error={Boolean(formik.touched.fecha_inicio && formik.errors.fecha_inicio)}
                helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio as string}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarIcon color="primary" sx={{ pointerEvents: 'none' }} />
                    </InputAdornment>
                  ),
                }}
                sx={dateFieldSx}
              />

              <TextField
                fullWidth
                type="date"
                label="Cierre Estimado"
                InputLabelProps={{ shrink: true }}
                {...formik.getFieldProps('fecha_cierre')}
                inputProps={{ min: formik.values.fecha_inicio || today }} // El mínimo es lo que diga la fecha de inicio
                error={Boolean(formik.touched.fecha_cierre && formik.errors.fecha_cierre)}
                helperText={formik.touched.fecha_cierre && formik.errors.fecha_cierre as string}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarIcon color="primary" sx={{ pointerEvents: 'none' }} />
                    </InputAdornment>
                  ),
                }}
                sx={dateFieldSx}
              />
            </Stack>
          </Stack>
        )}

        {currentStepLabel === 'Cuotas' && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block' }}>1. REFERENCIA DE INSUMO</Typography>
              <Stack spacing={2}>
                <TextField fullWidth label="Nombre Insumo" {...formik.getFieldProps('nombre_cemento_cemento')} />
                <Stack direction="row" spacing={2}>
                  <TextField 
                    fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0 }} label="Unidades" 
                    {...formik.getFieldProps('valor_cemento_unidades')} 
                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                    error={Boolean(formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades)}
                    helperText={formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades as string}
                  />
                  <TextField 
                    fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0 }} label="Precio Unitario" 
                    {...formik.getFieldProps('valor_cemento')} 
                    onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                    error={Boolean(formik.touched.valor_cemento && formik.errors.valor_cemento)}
                    helperText={formik.touched.valor_cemento && formik.errors.valor_cemento as string}
                  />
                </Stack>
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block' }}>2. PORCENTAJES Y CARGAS</Typography>
              <Stack direction="row" spacing={2}>
                <TextField 
                  fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0, max: 100 }} label="% Plan" 
                  {...formik.getFieldProps('porcentaje_plan')} 
                  onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                />
                <TextField 
                  fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0, max: 100 }} label="% Admin" 
                  {...formik.getFieldProps('porcentaje_administrativo')} 
                  onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                />
                <TextField 
                  fullWidth type="number" onKeyDown={blockInvalidChar} inputProps={{ min: 0, max: 100 }} label="% IVA" 
                  {...formik.getFieldProps('porcentaje_iva')} 
                  onChange={(e) => { if (Number(e.target.value) < 0) return; formik.handleChange(e); }}
                />
              </Stack>
            </Box>
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Typography variant="subtitle2" fontWeight={800} color="success.main">Simulación Mes 1</Typography>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">Cuota Final:</Typography><Typography variant="subtitle1" fontWeight={900}>${simulation.final.toLocaleString()}</Typography></Box>
            </Paper>
          </Stack>
        )}

        {currentStepLabel === 'Multimedia' && (
          <ImageUpload multiple={false} image={image} onChange={(f) => setImage(f as File)} label="Imagen de Portada" />
        )}

        {currentStepLabel === 'Contrato' && (
          <Box textAlign="center" py={2}>
            <Button variant="contained" component="label" startIcon={<PdfIcon />}>
              {contratoFile ? 'Cambiar PDF' : 'Subir Contrato'}
              <input type="file" hidden accept="application/pdf" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setContratoFile(f);
                if (f) setNombreContrato(f.name.replace('.pdf', ''));
              }} />
            </Button>
            {contratoFile && <TextField fullWidth sx={{ mt: 3 }} label="Nombre de Plantilla" value={nombreContrato} onChange={(e) => setNombreContrato(e.target.value)} />}
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
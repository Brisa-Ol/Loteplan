// src/components/Admin/Proyectos/Components/modals/CreateProyectoModal.tsx

import {
  Add as AddIcon,
  ArrowForward,
  CalendarMonth as CalendarIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
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
import React, { useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';

// Componentes Shared
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import SingleImageUpload from '@/shared/components/forms/upload/singleImageUpload/SingleImageUpload';

// Interfaces
interface FullProjectFormValues {
  nombre_proyecto: string;
  descripcion: string;
  tipo_inversion: 'directo' | 'mensual';
  plazo_inversion: number;
  forma_juridica: string;
  monto_inversion: number | string; // ✅ Ajustado para compatibilidad
  moneda: string;
  suscripciones_minimas: number;
  obj_suscripciones: number;
  fecha_inicio: string;
  fecha_cierre: string;
  latitud: number | '';
  longitud: number | '';
  nombre_cemento_cemento?: string;
  valor_cemento_unidades?: number;
  valor_cemento?: number;
  porcentaje_plan?: number;
  porcentaje_administrativo?: number;
  porcentaje_iva?: number;
}

interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

// ESQUEMAS DE VALIDACIÓN
const projectSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').max(100, 'Máximo 100').required('Requerido'),
  descripcion: Yup.string().min(20, 'Describe mejor el proyecto (mín 20 car.)').required('Requerido'),
  tipo_inversion: Yup.string().required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Monto inválido').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date()
    .required('Requerido')
    .min(Yup.ref('fecha_inicio'), 'Debe ser posterior al inicio'),
  plazo_inversion: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (s) => s.min(1, 'Mínimo 1 mes').required('Requerido'),
    otherwise: (s) => s.nullable(),
  }),
});

const quotaSchema = Yup.object({
  valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1').required('Requerido'),
  valor_cemento: Yup.number().min(0.01, 'Precio inválido').required('Requerido'),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({
  open, onClose, onSubmit, isLoading = false
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const formik = useFormik<FullProjectFormValues>({
    initialValues: {
      nombre_proyecto: '', descripcion: '', tipo_inversion: 'mensual',
      plazo_inversion: 12, forma_juridica: 'Fideicomiso', monto_inversion: 0,
      moneda: 'ARS', suscripciones_minimas: 1, obj_suscripciones: 10,
      fecha_inicio: '', fecha_cierre: '',
      latitud: '', longitud: '',
      nombre_cemento_cemento: 'Bolsa de Cemento', valor_cemento_unidades: 1, valor_cemento: 0,
      porcentaje_plan: 70, porcentaje_administrativo: 10, porcentaje_iva: 21,
    },
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      // ✅ Limpieza y formateo para el Backend de Inversiones
      const cleanData = {
        ...values,
        // Forzamos monto a string para el DECIMAL del backend
        monto_inversion: values.monto_inversion.toString(),
        // En inversión directa, el cupo siempre es 1 (fondeo total)
        obj_suscripciones: values.tipo_inversion === 'directo' ? 1 : values.obj_suscripciones,
        suscripciones_minimas: values.tipo_inversion === 'directo' ? 1 : values.suscripciones_minimas,
        latitud: values.latitud === '' ? null : values.latitud,
        longitud: values.longitud === '' ? null : values.longitud,
      };

      await onSubmit(cleanData, image);
      handleReset();
    },
  });

  const handleReset = () => {
    formik.resetForm();
    setImage(null);
    setActiveStep(0);
    onClose();
  };

  // ✅ Sincronización de reglas de negocio por Tipo de Inversión
  useEffect(() => {
    if (formik.values.tipo_inversion === 'directo') {
      formik.setFieldValue('moneda', 'USD');
      formik.setFieldValue('obj_suscripciones', 1);
      formik.setFieldValue('suscripciones_minimas', 1);
    } else {
      formik.setFieldValue('moneda', 'ARS');
    }
  }, [formik.values.tipo_inversion]);

  const simulation = useMemo(() => {
    const { plazo_inversion, valor_cemento_unidades, valor_cemento, porcentaje_plan, porcentaje_administrativo, porcentaje_iva } = formik.values;
    const plazo = plazo_inversion || 1;
    const unidades = valor_cemento_unidades || 0;
    const precio = valor_cemento || 0;
    const valorMovil = unidades * precio;
    const cuotaPura = (valorMovil * ((porcentaje_plan || 0) / 100)) / plazo;
    const gastosAdmin = cuotaPura * ((porcentaje_administrativo || 0) / 100);
    const iva = gastosAdmin * ((porcentaje_iva || 0) / 100);

    return {
      pura: cuotaPura,
      admin: gastosAdmin,
      final: cuotaPura + gastosAdmin + iva
    };
  }, [formik.values]);

  const handleNext = async () => {
    const isStep0 = activeStep === 0;
    const schema = isStep0 ? projectSchema : quotaSchema;

    try {
      await schema.validate(formik.values, { abortEarly: false });
      if (isStep0 && formik.values.tipo_inversion === 'directo') setActiveStep(2);
      else setActiveStep(prev => prev + 1);
    } catch (err: any) {
      const errors: any = {};
      err.inner.forEach((e: any) => { errors[e.path] = e.message; });
      formik.setErrors(errors);
    }
  };

  const steps = formik.values.tipo_inversion === 'mensual'
    ? ['Información', 'Cuotas', 'Multimedia']
    : ['Información', 'Multimedia'];

  const sectionTitleSx = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' };

  return (
    <BaseModal
      open={open} onClose={handleReset} title="Nuevo Proyecto" icon={<AddIcon />} headerColor="primary"
      hideConfirmButton hideCancelButton maxWidth="md" isLoading={isLoading}
      customActions={
        <>
          <Button onClick={activeStep === 0 ? handleReset : () => setActiveStep(p => p === 2 && formik.values.tipo_inversion === 'directo' ? 0 : p - 1)} color="inherit" disabled={isLoading} sx={{ mr: 'auto' }}>
            {activeStep === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {activeStep === 2 ? (
            <Button variant="contained" onClick={formik.submitForm} startIcon={<AddIcon />} disabled={isLoading}>Crear Proyecto</Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>Siguiente</Button>
          )}
        </>
      }
    >
      <Stack spacing={3}>
        {/* ✅ Stepper corregido para saltos de inversión directa */}
        <Stepper activeStep={activeStep === 2 && formik.values.tipo_inversion === 'directo' ? 1 : activeStep} alternativeLabel>
          {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Nombre del Proyecto" {...formik.getFieldProps('nombre_proyecto')} error={Boolean(formik.touched.nombre_proyecto && formik.errors.nombre_proyecto)} helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto} />
                <TextField fullWidth label="Forma Jurídica" {...formik.getFieldProps('forma_juridica')} />
              </Stack>

              <Box>
                <TextField
                  fullWidth multiline rows={4} maxRows={10} label="Descripción Comercial"
                  {...formik.getFieldProps('descripcion')}
                  error={Boolean(formik.touched.descripcion && formik.errors.descripcion)}
                  helperText={formik.errors.descripcion || `${formik.values.descripcion.length} caracteres`}
                />
              </Box>

              <Typography variant="subtitle2" sx={sectionTitleSx}><MonetizationIcon fontSize="inherit" /> Finanzas</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth select label="Tipo" {...formik.getFieldProps('tipo_inversion')}>
                  <MenuItem value="mensual">Plan de Ahorro (Cuotas)</MenuItem>
                  <MenuItem value="directo">Inversión Directa (Fondeo)</MenuItem>
                </TextField>
                <TextField 
                    fullWidth 
                    type="number" 
                    label={formik.values.tipo_inversion === 'directo' ? "Monto Total de Inversión" : "Valor de Referencia del Lote"} 
                    InputProps={{ 
                        startAdornment: <InputAdornment position="start">{formik.values.moneda === 'USD' ? 'u$d' : '$'}</InputAdornment> 
                    }} 
                    {...formik.getFieldProps('monto_inversion')} 
                />
              </Stack>

              {/* ✅ Campos condicionales optimizados para Inversión */}
              {formik.values.tipo_inversion === 'mensual' ? (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField fullWidth type="number" label="Plazo (Meses)" {...formik.getFieldProps('plazo_inversion')} />
                    <TextField fullWidth type="number" label="Cupo Máximo (Inversores)" {...formik.getFieldProps('obj_suscripciones')} />
                  </Stack>
                </Paper>
              ) : (
                <Alert severity="success" icon={<MonetizationIcon />}>
                  Modo <b>Inversión Directa</b>: El proyecto se cerrará automáticamente al recibir el primer pago del monto total.
                </Alert>
              )}

              <Typography variant="subtitle2" sx={sectionTitleSx}><CalendarIcon fontSize="inherit" /> Fechas Clave</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth type="date" label="Apertura de Ronda" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_inicio')} />
                <TextField fullWidth type="date" label="Cierre Estimado" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_cierre')} />
              </Stack>
            </Stack>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>Configura el valor de referencia para el cálculo de cuotas dinámicas.</Alert>
            <Stack spacing={3}>
              <TextField fullWidth label="Insumo de Referencia" {...formik.getFieldProps('nombre_cemento_cemento')} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Unidades" {...formik.getFieldProps('valor_cemento_unidades')} />
                <TextField fullWidth type="number" label="Precio Unitario" {...formik.getFieldProps('valor_cemento')} />
              </Stack>
              <Paper sx={{ p: 3, textAlign: 'right', border: `1px solid ${theme.palette.success.light}`, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                <Typography variant="caption" color="text.secondary">Estimación de Cuota Inicial</Typography>
                <Typography variant="h4" fontWeight={900} color="success.main">
                  ${simulation.final.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Stack>
          </Box>
        )}

        {activeStep === 2 && (
          <Box textAlign="center" py={2}>
            <SingleImageUpload image={image} onChange={setImage} maxSizeMB={10} />
            {!image && <Alert severity="warning" sx={{ mt: 2 }}>Debes seleccionar una imagen de portada para el proyecto.</Alert>}
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
// src/components/Admin/Proyectos/Components/modals/CreateProyectoModal.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  TextField, MenuItem, Stack, Box, Typography,
  Divider, Alert, InputAdornment, useTheme, alpha, Paper,
  Stepper, Step, StepLabel, Button
} from '@mui/material';
import { 
  Add as AddIcon, 
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  MonetizationOn as MonetizationIcon,
  CalendarMonth as CalendarIcon,
  Image as ImageIcon,
  Savings as SavingsIcon,
  Calculate as CalculateIcon,
  ArrowForward
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Componentes Shared
import SingleImageUpload from '@/shared/components/forms/upload/singleImageUpload/SingleImageUpload';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';

// Interfaces
interface FullProjectFormValues {
  nombre_proyecto: string;
  descripcion: string;
  tipo_inversion: 'directo' | 'mensual';
  plazo_inversion: number;
  forma_juridica: string;
  monto_inversion: number;
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

// ✅ ESQUEMAS DE VALIDACIÓN REFORZADOS
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
      // Limpieza de datos profunda
      const cleanData = Object.fromEntries(
        Object.entries(values).map(([key, val]) => [key, val === '' ? null : val])
      );
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

  useEffect(() => {
    formik.setFieldValue('moneda', formik.values.tipo_inversion === 'mensual' ? 'ARS' : 'USD');
  }, [formik.values.tipo_inversion]);

  // 🧮 CÁLCULOS OPTIMIZADOS (useMemo)
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
          <Button onClick={activeStep === 0 ? handleReset : () => setActiveStep(p => p - 1)} color="inherit" disabled={isLoading} sx={{ mr: 'auto' }}>
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

              {/* ✅ DESCRIPCIÓN OPTIMIZADA CON CONTADOR */}
              <Box>
                <TextField 
                  fullWidth multiline rows={4} maxRows={10} label="Descripción Comercial" 
                  {...formik.getFieldProps('descripcion')} 
                  error={Boolean(formik.touched.descripcion && formik.errors.descripcion)}
                  helperText={formik.errors.descripcion || `${formik.values.descripcion.length} caracteres`}
                />
              </Box>

              <Typography variant="subtitle2" sx={sectionTitleSx}><MonetizationIcon fontSize="inherit"/> Finanzas</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth select label="Tipo" {...formik.getFieldProps('tipo_inversion')}>
                  <MenuItem value="mensual">Plan de Ahorro</MenuItem>
                  <MenuItem value="directo">Inversión Directa</MenuItem>
                </TextField>
                <TextField fullWidth type="number" label="Monto Base / Total" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} {...formik.getFieldProps('monto_inversion')} />
              </Stack>

              {formik.values.tipo_inversion === 'mensual' && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField fullWidth type="number" label="Plazo (Meses)" {...formik.getFieldProps('plazo_inversion')} />
                    <TextField fullWidth type="number" label="Cupo Máximo" {...formik.getFieldProps('obj_suscripciones')} />
                  </Stack>
                </Paper>
              )}

              <Typography variant="subtitle2" sx={sectionTitleSx}><CalendarIcon fontSize="inherit"/> Fechas Clave</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth type="date" label="Apertura" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_inicio')} />
                <TextField fullWidth type="date" label="Cierre" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_cierre')} />
              </Stack>
            </Stack>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>Configura el valor de referencia para el cálculo de cuotas.</Alert>
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
            {!image && <Alert severity="warning" sx={{ mt: 2 }}>No se ha seleccionado imagen de portada.</Alert>}
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
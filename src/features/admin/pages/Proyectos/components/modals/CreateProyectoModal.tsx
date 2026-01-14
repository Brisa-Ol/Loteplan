// src/components/Admin/Proyectos/Components/modals/CreateProyectoModal.tsx

import React, { useEffect, useState } from 'react';
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

// Importaciones
import SingleImageUpload from '../../../../../../shared/components/forms/upload/singleImageUpload/SingleImageUpload';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';

// Tipos combinados para el formulario
interface FullProjectFormValues {
  // --- Proyecto ---
  nombre_proyecto: string;
  descripcion: string;
  tipo_inversion: 'directo' | 'mensual';
  plazo_inversion: number;
  forma_juridica: string;
  monto_inversion: number;
  moneda: string;
  
  // Suscripciones
  suscripciones_minimas: number;
  obj_suscripciones: number;
  
  // Fechas
  fecha_inicio: string;
  fecha_cierre: string;
  
  // Ubicación
  latitud: number | ''; 
  longitud: number | '';
  
  // --- Cuota (Solo mensual) ---
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
  onSubmit: (data: FullProjectFormValues, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

// ✅ VALIDACIONES
const projectSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().nullable(),
  tipo_inversion: Yup.string().required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Debe ser mayor a 0').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date().required('Requerido')
    .min(Yup.ref('fecha_inicio'), 'La fecha de cierre debe ser posterior al inicio'),
  plazo_inversion: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (s) => s.min(1, 'Mínimo 1 mes').required('Requerido para proyectos mensuales'),
    otherwise: (s) => s.nullable(),
  }),
  obj_suscripciones: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (s) => s.min(1, 'Mínimo 1').required('Requerido'),
    otherwise: (s) => s.nullable(),
  }),
  suscripciones_minimas: Yup.number().min(0).nullable(),
  latitud: Yup.number().typeError('Debe ser un número').min(-90).max(90).nullable(),
  longitud: Yup.number().typeError('Debe ser un número').min(-180).max(180).nullable(),
});

const quotaSchema = Yup.object({
  valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1').required('Requerido'),
  valor_cemento: Yup.number().min(0.01, 'Precio inválido').required('Requerido'),
  porcentaje_plan: Yup.number().min(0).max(100).required('Requerido'),
  porcentaje_administrativo: Yup.number().min(0).max(100).required('Requerido'),
  porcentaje_iva: Yup.number().min(0).max(100).required('Requerido'),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, onClose, onSubmit, isLoading = false 
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const formik = useFormik<FullProjectFormValues>({
    initialValues: {
      // Proyecto Defaults
      nombre_proyecto: '', descripcion: '', tipo_inversion: 'mensual',
      plazo_inversion: 12, forma_juridica: 'Fideicomiso', monto_inversion: 0,
      moneda: 'ARS', suscripciones_minimas: 1, obj_suscripciones: 10,
      fecha_inicio: '', fecha_cierre: '', 
      latitud: '', longitud: '',
      
      // Cuota Defaults
      nombre_cemento_cemento: '',
      valor_cemento_unidades: 1,
      valor_cemento: 0,
      porcentaje_plan: 70,
      porcentaje_administrativo: 10,
      porcentaje_iva: 21,
    },
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      await onSubmit(values, image); 
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
    if (formik.values.tipo_inversion === 'mensual') {
      formik.setFieldValue('moneda', 'ARS');
    } else {
      formik.setFieldValue('moneda', 'USD');
    }
  }, [formik.values.tipo_inversion]);

  // =====================================================================
  // 🧮 CÁLCULOS VISUALES (Alineados con Backend y ConfigCuotasModal)
  // =====================================================================
  
  const plazo = formik.values.plazo_inversion || 1;
  const unidades = formik.values.valor_cemento_unidades || 0;
  const precioUnitario = formik.values.valor_cemento || 0;
  const pctPlan = formik.values.porcentaje_plan || 0;
  const pctAdmin = formik.values.porcentaje_administrativo || 0;
  const pctIva = formik.values.porcentaje_iva || 0;

  // 1. Valor Móvil Total
  const valorMovil = unidades * precioUnitario;

  // 2. Total del Plan (Capital real que paga el cliente)
  const totalDelPlan = valorMovil * (pctPlan / 100);
  
  // 3. Cuota Pura (Mensual) - Base para gastos admin
  const valorMensual = totalDelPlan / plazo;

  // 4. Carga Administrativa (Sobre la cuota mensual)
  const cargaAdministrativa = valorMensual * (pctAdmin / 100);

  // 5. IVA (Sobre Carga Administrativa)
  const ivaCarga = cargaAdministrativa * (pctIva / 100);
  
  // 6. Total Final
  const valorMensualFinal = valorMensual + cargaAdministrativa + ivaCarga;

  // --- NAVEGACIÓN ---
  const handleNext = async () => {
    if (activeStep === 0) {
      try {
        await projectSchema.validate(formik.values, { abortEarly: false });
        if (formik.values.tipo_inversion === 'directo') {
            setActiveStep(2); 
        } else {
            setActiveStep(1); 
        }
      } catch (err: any) {
        const errors: any = {};
        err.inner.forEach((e: any) => { errors[e.path] = e.message; });
        formik.setErrors(errors);
        formik.setTouched(errors);
      }
    } else if (activeStep === 1) {
       try {
        await quotaSchema.validate(formik.values, { abortEarly: false });
        setActiveStep(2);
       } catch (err: any) {
         const errors: any = {};
         err.inner.forEach((e: any) => { errors[e.path] = e.message; });
         formik.setErrors(errors);
         formik.setTouched(errors);
       }
    }
  };

  const handleBack = () => {
    if (activeStep === 2 && formik.values.tipo_inversion === 'directo') {
        setActiveStep(0);
    } else {
        setActiveStep((prev) => prev - 1);
    }
  };

  const steps = formik.values.tipo_inversion === 'mensual' 
    ? ['Datos Proyecto', 'Configurar Cuota', 'Imagen'] 
    : ['Datos Proyecto', 'Imagen'];

  const getStepIndex = () => {
      if (activeStep === 0) return 0;
      if (activeStep === 2) return formik.values.tipo_inversion === 'mensual' ? 2 : 1;
      return 1;
  };

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' };

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title="Nuevo Proyecto"
      subtitle={activeStep === 0 ? "Información General" : activeStep === 1 ? "Definición de Cuotas" : "Carga de Multimedia"}
      icon={<AddIcon />}
      headerColor="primary"
      hideConfirmButton
      hideCancelButton
      maxWidth="md"
      isLoading={isLoading}
      customActions={
        <>
            <Button onClick={activeStep === 0 ? handleReset : handleBack} color="inherit" disabled={isLoading} sx={{ mr: 'auto' }}>
                {activeStep === 0 ? 'Cancelar' : 'Atrás'}
            </Button>
            
            {activeStep === 2 ? (
                <Button variant="contained" onClick={formik.submitForm} startIcon={<AddIcon />} disabled={isLoading}>
                    {isLoading ? 'Creando...' : 'Finalizar y Crear'}
                </Button>
            ) : (
                <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>
                    Siguiente
                </Button>
            )}
        </>
      }
    >
      <Stack spacing={3}>
        <Stepper activeStep={getStepIndex()} alternativeLabel sx={{ mb: 2 }}>
            {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
        </Stepper>

        {/* === PASO 0: DATOS PROYECTO === */}
        {activeStep === 0 && (
            <Box>
                <Stack spacing={2}>
                    {/* Fila 1: Nombre y Forma Jurídica */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth label="Nombre del Proyecto"
                            {...formik.getFieldProps('nombre_proyecto')}
                            error={Boolean(formik.touched.nombre_proyecto && formik.errors.nombre_proyecto)}
                            helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                            sx={{ flex: 2, ...commonInputSx }}
                        />
                        <TextField
                            fullWidth label="Forma Jurídica"
                            {...formik.getFieldProps('forma_juridica')}
                            error={Boolean(formik.touched.forma_juridica && formik.errors.forma_juridica)}
                            helperText={formik.touched.forma_juridica && formik.errors.forma_juridica}
                            sx={{ flex: 1, ...commonInputSx }}
                        />
                    </Stack>

                    <TextField
                        fullWidth multiline rows={2} label="Descripción Comercial"
                        {...formik.getFieldProps('descripcion')}
                        sx={commonInputSx}
                    />

                    <Divider />
                    
                    {/* Configuración Financiera */}
                    <Typography variant="subtitle2" sx={sectionTitleSx}><MonetizationIcon fontSize="inherit"/> Configuración Financiera</Typography>
                    
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth select label="Tipo de Inversión"
                            {...formik.getFieldProps('tipo_inversion')}
                            sx={commonInputSx}
                        >
                            <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
                            <MenuItem value="directo">Inversión (Directo)</MenuItem>
                        </TextField>
                        
                        <TextField
                            fullWidth select label="Moneda"
                            {...formik.getFieldProps('moneda')}
                            disabled
                            sx={commonInputSx}
                        >
                            <MenuItem value="ARS">ARS</MenuItem>
                            <MenuItem value="USD">USD</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth type="number"
                            label={formik.values.tipo_inversion === 'mensual' ? "Valor Cuota Base" : "Monto Total"}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            {...formik.getFieldProps('monto_inversion')}
                            error={Boolean(formik.touched.monto_inversion && formik.errors.monto_inversion)}
                            helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                            sx={commonInputSx}
                        />
                    </Stack>

                    {/* Suscripciones y Plazo (Solo Mensual) */}
                    {formik.values.tipo_inversion === 'mensual' && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth type="number" label="Plazo (Meses)"
                                    {...formik.getFieldProps('plazo_inversion')}
                                    error={Boolean(formik.touched.plazo_inversion && formik.errors.plazo_inversion)}
                                    helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth type="number" label="Obj. Suscripciones"
                                    {...formik.getFieldProps('obj_suscripciones')}
                                    error={Boolean(formik.touched.obj_suscripciones && formik.errors.obj_suscripciones)}
                                    helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth type="number" label="Mínimo Suscripciones"
                                    {...formik.getFieldProps('suscripciones_minimas')}
                                    error={Boolean(formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas)}
                                    helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas}
                                    sx={commonInputSx}
                                />
                            </Stack>
                        </Paper>
                    )}

                    {/* Fechas */}
                    <Typography variant="subtitle2" sx={sectionTitleSx}><CalendarIcon fontSize="inherit"/> Cronograma</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth type="date" label="Inicio Suscripciones" InputLabelProps={{ shrink: true }}
                            {...formik.getFieldProps('fecha_inicio')}
                            error={Boolean(formik.touched.fecha_inicio && formik.errors.fecha_inicio)}
                            helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
                            sx={commonInputSx}
                        />
                        <TextField
                            fullWidth type="date" label="Cierre Suscripciones" InputLabelProps={{ shrink: true }}
                            {...formik.getFieldProps('fecha_cierre')}
                            error={Boolean(formik.touched.fecha_cierre && formik.errors.fecha_cierre)}
                            helperText={formik.touched.fecha_cierre && (formik.errors.fecha_cierre as string)}
                            sx={commonInputSx}
                        />
                    </Stack>

                    {/* Ubicación */}
                    <Typography variant="subtitle2" sx={sectionTitleSx}><LocationIcon fontSize="inherit"/> Ubicación (Opcional)</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth type="number" label="Latitud" placeholder="-34.12345"
                            {...formik.getFieldProps('latitud')}
                            error={Boolean(formik.touched.latitud && formik.errors.latitud)}
                            helperText={formik.touched.latitud && formik.errors.latitud}
                            sx={commonInputSx}
                        />
                        <TextField
                            fullWidth type="number" label="Longitud" placeholder="-58.12345"
                            {...formik.getFieldProps('longitud')}
                            error={Boolean(formik.touched.longitud && formik.errors.longitud)}
                            helperText={formik.touched.longitud && formik.errors.longitud}
                            sx={commonInputSx}
                        />
                    </Stack>

                </Stack>
            </Box>
        )}

        {/* === PASO 1: CONFIGURAR CUOTA (SOLO MENSUAL) === */}
        {activeStep === 1 && (
            <Box>
                <Alert severity="info" sx={{ mb: 2 }}>Define los valores base para la primera cuota del proyecto.</Alert>
                
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle2" sx={sectionTitleSx}><DescriptionIcon fontSize="inherit"/> Datos del Cemento</Typography>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth label="Referencia (Ej: Bolsa 50kg)"
                                {...formik.getFieldProps('nombre_cemento_cemento')}
                                sx={commonInputSx}
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth type="number" label="Unidades"
                                    {...formik.getFieldProps('valor_cemento_unidades')}
                                    error={Boolean(formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades)}
                                    helperText={formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades}
                                    sx={commonInputSx}
                                />
                                <TextField
                                    fullWidth type="number" label="Precio Unitario"
                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                    {...formik.getFieldProps('valor_cemento')}
                                    error={Boolean(formik.touched.valor_cemento && formik.errors.valor_cemento)}
                                    helperText={formik.touched.valor_cemento && formik.errors.valor_cemento}
                                    sx={commonInputSx}
                                />
                            </Stack>
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={sectionTitleSx}><CalculateIcon fontSize="inherit"/> Porcentajes</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField 
                                fullWidth type="number" label="% Plan" 
                                {...formik.getFieldProps('porcentaje_plan')} 
                                error={Boolean(formik.touched.porcentaje_plan && formik.errors.porcentaje_plan)}
                                sx={commonInputSx} 
                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} 
                            />
                            <TextField 
                                fullWidth type="number" label="% Admin" 
                                {...formik.getFieldProps('porcentaje_administrativo')} 
                                error={Boolean(formik.touched.porcentaje_administrativo && formik.errors.porcentaje_administrativo)}
                                sx={commonInputSx} 
                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} 
                            />
                            <TextField 
                                fullWidth type="number" label="% IVA" 
                                {...formik.getFieldProps('porcentaje_iva')} 
                                error={Boolean(formik.touched.porcentaje_iva && formik.errors.porcentaje_iva)}
                                sx={commonInputSx} 
                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} 
                            />
                        </Stack>
                    </Box>

                    {/* Previsualización del Cálculo */}
                    <Alert severity="success" icon={<SavingsIcon fontSize="inherit"/>} variant="outlined">
                        <Typography variant="subtitle2" gutterBottom>Simulación de Cuota Inicial:</Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                            <Box>
                                <Typography variant="caption" display="block">Cuota Pura: ${valorMensual.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                <Typography variant="caption" display="block">Gastos Admin: ${cargaAdministrativa.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="body2">Valor Mensual Final:</Typography>
                                <Typography variant="h5" fontWeight={800} color="primary">
                                    ${valorMensualFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Box>
                        </Stack>
                    </Alert>
                </Stack>
            </Box>
        )}

        {/* === PASO 2: IMAGEN === */}
        {activeStep === 2 && (
            <Box textAlign="center">
                <Typography variant="subtitle2" sx={{ ...sectionTitleSx, justifyContent: 'center' }}>
                    <ImageIcon fontSize="inherit"/> Portada del Proyecto
                </Typography>
                <Box sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
                    <SingleImageUpload
                        image={image}
                        onChange={setImage}
                        maxSizeMB={15}
                        disabled={isLoading}
                    />
                </Box>
                {!image && (
                      <Alert severity="warning" sx={{mt: 2, display: 'inline-flex'}}>
                        Se creará el proyecto sin imagen de portada.
                      </Alert>
                )}
            </Box>
        )}

      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
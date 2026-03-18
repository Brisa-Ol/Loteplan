// src/features/admin/pages/Proyectos/modals/CreateProyectoModal.tsx

import { BaseModal } from '@/shared/components/domain';
import ImageUploadZone from '@/shared/components/forms/ImageUploadZone';
import {
  Add as AddIcon,
  ArrowBack,
  ArrowForward,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
  Business as ProjectIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as Yup from 'yup';

import { env } from '@/core/config/env';

// --- FUNCIONES AUXILIARES ---
const blockInvalidChar = (e: React.KeyboardEvent) =>
  ['e', 'E', '-', '+'].includes(e.key) && e.preventDefault();

const today = new Date().toISOString().split('T')[0];

// --- ESQUEMAS DE VALIDACIÓN ---
const projectSchema = Yup.object({
  nombre_proyecto: Yup.string()
    .min(5, 'Faltan caracteres (Mín. 5)')
    .required('El nombre es obligatorio'),
  descripcion: Yup.string()
    .min(20, 'Faltan caracteres (Mín. 20)')
    .required('La descripción es obligatoria'),
  forma_juridica: Yup.string().required('Requerido'),
  tipo_inversion: Yup.string().required('Requerido'),
  monto_inversion: Yup.number()
    .moreThan(0, 'El monto debe ser mayor a 0')
    .required('Requerido'),
  plazo_inversion: Yup.number()
    .min(1, 'Mínimo 1 mes')
    .required('Requerido'),
  fecha_inicio: Yup.date()
    .nullable()
    .required('Obligatorio')
    .min(today, 'La apertura no puede ser en el pasado'),
  fecha_cierre: Yup.date()
    .nullable()
    .required('Obligatorio')
    .min(Yup.ref('fecha_inicio'), 'El cierre debe ser posterior a la apertura'),
  obj_suscripciones: Yup.number()
    .integer()
    .min(1, 'Mínimo 1')
    .required('Requerido'),
  suscripciones_minimas: Yup.number()
    .integer()
    .min(1, 'Mínimo 1')
    .required('Requerido')
    .test('min-max', 'Supera el cupo máximo', function (value) {
      return value <= this.parent.obj_suscripciones;
    }),
});

const quotaSchema = Yup.object({
  nombre_cemento_cemento: Yup.string().required('El insumo es obligatorio'),
  valor_cemento_unidades: Yup.number()
    .positive('Debe ser mayor a 0')
    .required('Requerido'),
  valor_cemento: Yup.number()
    .positive('Precio inválido')
    .required('Requerido'),
  porcentaje_plan: Yup.number()
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100%')
    .required('Requerido'),
  porcentaje_administrativo: Yup.number()
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100%')
    .required('Requerido'),
  porcentaje_iva: Yup.number()
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100%')
    .required('Requerido'),
});

// ✅ Creamos un esquema combinado dinámico para dárselo a Formik
const fullValidationSchema = Yup.lazy((values: any) => {
  if (values.tipo_inversion === 'mensual') {
    return projectSchema.concat(quotaSchema);
  }
  return projectSchema;
});

const INITIAL_VALUES = {
  nombre_proyecto: '', descripcion: '', tipo_inversion: 'mensual',
  plazo_inversion: 12, forma_juridica: 'Fideicomiso', monto_inversion: 0,
  moneda: 'ARS', suscripciones_minimas: 1, obj_suscripciones: 10,
  fecha_inicio: '', fecha_cierre: '',
  latitud: '', longitud: '',
  nombre_cemento_cemento: 'Bolsa de Cemento', valor_cemento_unidades: 1, valor_cemento: 0,
  porcentaje_plan: 70, porcentaje_administrativo: 10, porcentaje_iva: 21,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

const FastTextField = React.memo(({ formikValue, onCommit, onBlur, ...props }: any) => {
  const [localValue, setLocalValue] = useState<string>(String(formikValue ?? ''));
  const prevFormikRef = useRef(formikValue);

  if (prevFormikRef.current !== formikValue) {
    prevFormikRef.current = formikValue;
    setLocalValue(String(formikValue ?? ''));
  }

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={(e) => {
        onCommit(e.target.value);
        (onBlur as any)?.(e);
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, ...props.sx }}
    />
  );
});

const SimulationDisplay = React.memo(({ plazo, unidades, precio, pctPlan, pctAdmin, pctIva }: any) => {
  const theme = useTheme();
  const calc = useMemo(() => {
    const vPlazo = Number(plazo) || 1;
    const valorMovil = (Number(unidades) || 0) * (Number(precio) || 0);
    const cuotaPura = (valorMovil * (pctPlan / 100)) / vPlazo;
    const cargaAdmin = valorMovil * (pctAdmin / 100);
    const ivaSobreAdmin = cargaAdmin * (pctIva / 100);
    return { cuotaPura, gastos: cargaAdmin + ivaSobreAdmin, final: cuotaPura + cargaAdmin + ivaSobreAdmin };
  }, [plazo, unidades, precio, pctPlan, pctAdmin, pctIva]);

  return (
    <Paper elevation={0} sx={{
      p: 3, textAlign: 'center', borderRadius: 3,
      bgcolor: alpha(theme.palette.success.main, 0.04),
      border: '1px dashed', borderColor: theme.palette.success.main
    }}>
      <Typography variant="caption" fontWeight={800} color="success.main" sx={{ letterSpacing: 1 }}>
        CUOTA MENSUAL ESTIMADA (MES 1)
      </Typography>
      <Typography variant="h3" fontWeight={900} color="success.dark" sx={{ my: 1 }}>
        ${calc.final.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
      <Stack direction="row" spacing={4} justifyContent="center">
        <Box>
          <Typography variant="caption" display="block" color="text.secondary" fontWeight={700}>CAPITAL</Typography>
          <Typography variant="body2" fontWeight={800}>${calc.cuotaPura.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" display="block" color="text.secondary" fontWeight={700}>GASTOS + IVA</Typography>
          <Typography variant="body2" fontWeight={800}>${calc.gastos.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const CreateProyectoModal: React.FC<any> = ({ open, onClose, onSubmit, isLoading = false }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  const [nombreContrato, setNombreContrato] = useState<string>('');

  const formik = useFormik({
    initialValues: INITIAL_VALUES,
    validationSchema: fullValidationSchema, // ✅ Formik ahora conoce las reglas de validación
    validateOnChange: true,
    validateOnBlur: true,
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

  const styles = useMemo(() => ({
    dateField: {
      '& input::-webkit-calendar-picker-indicator': {
        position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
        margin: 0, padding: 0, cursor: 'pointer', opacity: 0,
      }
    },
    sectionTitle: { fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }
  }), []);

  // Actualiza el campo en Formik y lo marca como 'tocado' para forzar la validación visual
  const set = useCallback((field: string) => (value: string) => {
    formik.setFieldValue(field, value);
    formik.setFieldTouched(field, true, true);
  }, [formik]);

  const steps = useMemo(() => formik.values.tipo_inversion === 'mensual'
    ? ['Información', 'Cuotas', 'Multimedia', 'Contrato']
    : ['Información', 'Multimedia', 'Contrato'],
    [formik.values.tipo_inversion]
  );

  const currentStepLabel = steps[activeStep];

  const handleNext = useCallback(async () => {
    if (currentStepLabel === 'Multimedia' || currentStepLabel === 'Contrato') {
      setActiveStep(prev => prev + 1);
      return;
    }

    const schema = currentStepLabel === 'Información' ? projectSchema : quotaSchema;

    try {
      // ✅ Validamos explícitamente solo los campos de este paso
      await schema.validate(formik.values, { abortEarly: false });
      setActiveStep(prev => prev + 1);
    } catch (err: any) {
      // ✅ Si falla la validación, "tocamos" los campos con errores para que se pinten de rojo
      const stepTouched: Record<string, boolean> = {};
      err.inner?.forEach((e: any) => {
        if (e.path) stepTouched[e.path] = true;
      });
      formik.setTouched({ ...formik.touched, ...stepTouched }, true);
    }
  }, [currentStepLabel, formik]);

  const handleReset = useCallback(() => {
    formik.resetForm();
    setImage(null);
    setContratoFile(null);
    setActiveStep(0);
    onClose();
  }, [onClose, formik]);

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title="Nuevo Proyecto"
      subtitle="Defina los parámetros del activo inmobiliario"
      icon={<ProjectIcon />}
      maxWidth="md"
      isLoading={isLoading}
      customActions={
        <>
          <Button
            onClick={activeStep === 0 ? handleReset : () => setActiveStep(p => p - 1)}
            color="inherit"
            startIcon={activeStep !== 0 && <ArrowBack />}
            sx={{ mr: 'auto', borderRadius: 2, fontWeight: 700 }}
          >
            {activeStep === 0 ? 'Cancelar' : 'Atrás'}
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={formik.submitForm} startIcon={<AddIcon />}
              disabled={isLoading} sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}>
              Crear Proyecto
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}
              sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}>
              Siguiente
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={4}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {/* ── PASO 1: INFORMACIÓN ── */}
        {currentStepLabel === 'Información' && (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
              <FastTextField
                label="Nombre del Proyecto"
                formikValue={formik.values.nombre_proyecto}
                onCommit={set('nombre_proyecto')}
                error={formik.touched.nombre_proyecto && !!formik.errors.nombre_proyecto}
                helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto as string}
              />
              <FastTextField
                label="Forma Jurídica"
                formikValue={formik.values.forma_juridica}
                onCommit={set('forma_juridica')}
                error={formik.touched.forma_juridica && !!formik.errors.forma_juridica}
                helperText={formik.touched.forma_juridica && formik.errors.forma_juridica as string}
              />
            </Box>

            <FastTextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              formikValue={formik.values.descripcion}
              onCommit={set('descripcion')}
              error={formik.touched.descripcion && !!formik.errors.descripcion}
              helperText={formik.touched.descripcion && formik.errors.descripcion as string}
            />

            <Divider><Chip label="Finanzas y Cupos" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem' }} /></Divider>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField select fullWidth label="Modelo Inversión" {...formik.getFieldProps('tipo_inversion')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <MenuItem value="mensual">Plan de Ahorro</MenuItem>
                <MenuItem value="directo">Inversión Directa</MenuItem>
              </TextField>
              <FastTextField
                type="number"
                label="Monto Objetivo"
                onKeyDown={blockInvalidChar}
                inputProps={{ min: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                formikValue={formik.values.monto_inversion}
                onCommit={set('monto_inversion')}
                error={formik.touched.monto_inversion && !!formik.errors.monto_inversion}
                helperText={formik.touched.monto_inversion && formik.errors.monto_inversion as string}
              />
            </Box>

            {formik.values.tipo_inversion === 'mensual' && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                  <FastTextField
                    type="number"
                    label="Plazo (Meses)"
                    onKeyDown={blockInvalidChar}
                    inputProps={{ min: 1 }}
                    formikValue={formik.values.plazo_inversion}
                    onCommit={set('plazo_inversion')}
                    error={formik.touched.plazo_inversion && !!formik.errors.plazo_inversion}
                    helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion as string}
                  />
                  <FastTextField
                    type="number"
                    label="Mín. Suscriptores"
                    onKeyDown={blockInvalidChar}
                    inputProps={{ min: 1 }}
                    formikValue={formik.values.suscripciones_minimas}
                    onCommit={set('suscripciones_minimas')}
                    error={formik.touched.suscripciones_minimas && !!formik.errors.suscripciones_minimas}
                    helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas as string}
                  />
                  <FastTextField
                    type="number"
                    label="Cupo Máximo"
                    onKeyDown={blockInvalidChar}
                    inputProps={{ min: 1 }}
                    formikValue={formik.values.obj_suscripciones}
                    onCommit={set('obj_suscripciones')}
                    error={formik.touched.obj_suscripciones && !!formik.errors.obj_suscripciones}
                    helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones as string}
                  />
                </Box>
              </Paper>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <FastTextField
                type="date"
                label="Apertura"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today }} // Bloqueo HTML fechas pasadas
                formikValue={formik.values.fecha_inicio}
                onCommit={set('fecha_inicio')}
                error={formik.touched.fecha_inicio && !!formik.errors.fecha_inicio}
                helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio as string}
                sx={styles.dateField}
              />
              <FastTextField
                type="date"
                label="Cierre"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formik.values.fecha_inicio || today }} // Bloqueo HTML antes de apertura
                formikValue={formik.values.fecha_cierre}
                onCommit={set('fecha_cierre')}
                error={formik.touched.fecha_cierre && !!formik.errors.fecha_cierre}
                helperText={formik.touched.fecha_cierre && formik.errors.fecha_cierre as string}
                sx={styles.dateField}
              />
            </Box>
          </Stack>
        )}

        {/* ── PASO 2: CUOTAS ── */}
        {currentStepLabel === 'Cuotas' && (
          <Stack spacing={4}>
            {/* Fila 1: Insumo, Unidades y Precio */}
            <Box>
              <Typography sx={styles.sectionTitle} mb={2}>Variables de Costo (Referencia)</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1.5fr' }, gap: 2 }}>
                <FastTextField
                  label="Insumo Referencia"
                  formikValue={formik.values.nombre_cemento_cemento}
                  onCommit={set('nombre_cemento_cemento')}
                  error={formik.touched.nombre_cemento_cemento && !!formik.errors.nombre_cemento_cemento}
                  helperText={formik.touched.nombre_cemento_cemento && formik.errors.nombre_cemento_cemento as string}
                />
                <FastTextField
                  type="number"
                  label="Unidades"
                  onKeyDown={blockInvalidChar}
                  inputProps={{ min: 1 }}
                  formikValue={formik.values.valor_cemento_unidades}
                  onCommit={set('valor_cemento_unidades')}
                  error={formik.touched.valor_cemento_unidades && !!formik.errors.valor_cemento_unidades}
                  helperText={formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades as string}
                />
                <FastTextField
                  type="number"
                  label="Precio Unit."
                  onKeyDown={blockInvalidChar}
                  inputProps={{ min: 0 }}
                  formikValue={formik.values.valor_cemento}
                  onCommit={set('valor_cemento')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  error={formik.touched.valor_cemento && !!formik.errors.valor_cemento}
                  helperText={formik.touched.valor_cemento && formik.errors.valor_cemento as string}
                />
              </Box>
            </Box>

            <Divider />

            {/* Fila 2: Porcentajes agregados */}
            <Box>
              <Typography sx={styles.sectionTitle} mb={2}>Distribución y Porcentajes (%)</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <FastTextField
                  type="number"
                  label="% Capital (Plan)"
                  onKeyDown={blockInvalidChar}
                  inputProps={{ min: 0, max: 100 }}
                  formikValue={formik.values.porcentaje_plan}
                  onCommit={set('porcentaje_plan')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  error={formik.touched.porcentaje_plan && !!formik.errors.porcentaje_plan}
                  helperText={formik.touched.porcentaje_plan && formik.errors.porcentaje_plan as string}
                />
                <FastTextField
                  type="number"
                  label="% Carga Admin."
                  onKeyDown={blockInvalidChar}
                  inputProps={{ min: 0, max: 100 }}
                  formikValue={formik.values.porcentaje_administrativo}
                  onCommit={set('porcentaje_administrativo')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  error={formik.touched.porcentaje_administrativo && !!formik.errors.porcentaje_administrativo}
                  helperText={formik.touched.porcentaje_administrativo && formik.errors.porcentaje_administrativo as string}
                />
                <FastTextField
                  type="number"
                  label="% IVA (s/ Admin)"
                  onKeyDown={blockInvalidChar}
                  inputProps={{ min: 0, max: 100 }}
                  formikValue={formik.values.porcentaje_iva}
                  onCommit={set('porcentaje_iva')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  error={formik.touched.porcentaje_iva && !!formik.errors.porcentaje_iva}
                  helperText={formik.touched.porcentaje_iva && formik.errors.porcentaje_iva as string}
                />
              </Box>
            </Box>

            <SimulationDisplay
              plazo={formik.values.plazo_inversion}
              unidades={formik.values.valor_cemento_unidades}
              precio={formik.values.valor_cemento}
              pctPlan={formik.values.porcentaje_plan}
              pctAdmin={formik.values.porcentaje_administrativo}
              pctIva={formik.values.porcentaje_iva}
            />
          </Stack>
        )}

        {/* ── PASO 3: MULTIMEDIA ── */}
        {currentStepLabel === 'Multimedia' && (
          <Box sx={{ p: 1 }}>
            <Typography sx={styles.sectionTitle} mb={2}>Visuales del Proyecto</Typography>
            <ImageUploadZone multiple={false} image={image} onChange={(f) => setImage(f as File)} label="Foto de Portada" />
          </Box>
        )}

        {/* ── PASO 4: CONTRATO ── */}
        {currentStepLabel === 'Contrato' && (
          <Stack alignItems="center" spacing={4} py={2}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: contratoFile ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.primary.main, 0.1), color: contratoFile ? 'success.main' : 'primary.main' }}>
              {contratoFile ? <CheckCircleIcon sx={{ fontSize: 40 }} /> : <PdfIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <Box textAlign="center">
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>{contratoFile ? 'Documento Listo' : 'Subir Contrato Base'}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Solo archivos PDF permitidos para la plantilla legal (Máximo {env.maxFileSize / (1024 * 1024)}MB)
              </Typography>
              <Button variant="contained" component="label" startIcon={<UploadIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                {contratoFile ? 'Reemplazar Archivo' : 'Seleccionar PDF'}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > env.maxFileSize) {
                      alert(`El archivo excede el tamaño máximo permitido de ${env.maxFileSize / (1024 * 1024)}MB.`);
                      e.target.value = '';
                      return;
                    }
                    setContratoFile(f);
                    if (f) setNombreContrato(f.name.replace('.pdf', ''));
                  }}
                />
              </Button>
            </Box>
            {contratoFile && (
              <TextField fullWidth label="Nombre del Documento" value={nombreContrato} onChange={(e) => setNombreContrato(e.target.value)} sx={{ maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          </Stack>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
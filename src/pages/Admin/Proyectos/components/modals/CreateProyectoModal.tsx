// src/components/Admin/Proyectos/Components/modals/CreateProyectoModal.tsx

import React, { useEffect, useState } from 'react';
import {
  TextField, MenuItem, Stack, Box, Typography,
  Divider, Alert, InputAdornment, useTheme, alpha, Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  MonetizationOn as MonetizationIcon,
  CalendarMonth as CalendarIcon,
  Image as ImageIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Importaciones
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
import type { CreateProyectoDto } from '../../../../../types/dto/proyecto.dto';
import SingleImageUpload from '../../../../../components/common/singleImageUpload/SingleImageUpload';

interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProyectoDto, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

// ✅ VALIDACIONES
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().nullable(),
  tipo_inversion: Yup.string().oneOf(['directo', 'mensual']).required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date()
    .required('Requerido')
    .min(new Date(new Date().setHours(0,0,0,0)), 'La fecha de inicio no puede ser anterior a hoy'),
  fecha_cierre: Yup.date()
    .required('Requerido')
    .min(Yup.ref('fecha_inicio'), 'La fecha de cierre debe ser posterior a la fecha de inicio'),
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
  latitud: Yup.number().nullable().min(-90).max(90).typeError('Debe ser un número válido'),
  longitud: Yup.number().nullable().min(-180).max(180).typeError('Debe ser un número válido'),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, onClose, onSubmit, isLoading = false 
}) => {
  const theme = useTheme();
  const [image, setImage] = useState<File | null>(null);

  const formik = useFormik<CreateProyectoDto>({
    initialValues: {
      nombre_proyecto: '', descripcion: '', tipo_inversion: 'mensual',
      plazo_inversion: 12, forma_juridica: 'Fideicomiso', monto_inversion: 0,
      moneda: 'ARS', suscripciones_minimas: 1, obj_suscripciones: 1,
      fecha_inicio: '', fecha_cierre: '', latitud: undefined, longitud: undefined,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        await onSubmit(values, image); 
        handleReset(); 
      } catch (error) {
        console.error('Error al crear proyecto:', error);
      }
    },
  });

  const handleReset = () => {
    formik.resetForm();
    setImage(null);
    onClose();
  };
  
  // Lógica de Moneda Automática
  useEffect(() => {
    if (formik.values.tipo_inversion === 'mensual') {
      formik.setFieldValue('moneda', 'ARS');
    } else if (formik.values.tipo_inversion === 'directo') {
      formik.setFieldValue('moneda', 'USD');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tipo_inversion]);

  // Estilos Comunes
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
    fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, 
    display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem', letterSpacing: 0.5
  };

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title="Nuevo Proyecto"
      subtitle="Complete los datos para dar de alta una oportunidad"
      icon={<AddIcon />}
      headerColor="primary"
      confirmText="Crear Proyecto"
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      disableConfirm={!formik.isValid || isLoading}
      confirmButtonIcon={<AddIcon />}
      maxWidth="md"
    >
      <Stack spacing={4}>
        
        {/* 1. INFORMACIÓN GENERAL */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <DescriptionIcon fontSize="inherit" /> Información General
            </Typography>
            
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth
                        sx={{ flex: { md: 2 }, ...commonInputSx }}
                        id="nombre_proyecto"
                        label="Nombre del Proyecto"
                        placeholder="Ej: Loteo Los Álamos"
                        {...formik.getFieldProps('nombre_proyecto')}
                        error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                        helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                        disabled={isLoading}
                    />
                     <TextField
                        fullWidth
                        sx={{ flex: { md: 1 }, ...commonInputSx }}
                        id="forma_juridica"
                        label="Forma Jurídica"
                        placeholder="Ej: Fideicomiso"
                        {...formik.getFieldProps('forma_juridica')}
                        error={formik.touched.forma_juridica && Boolean(formik.errors.forma_juridica)}
                        helperText={formik.touched.forma_juridica && formik.errors.forma_juridica}
                        disabled={isLoading}
                    />
                </Stack>

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    id="descripcion"
                    label="Descripción Comercial"
                    placeholder="Detalles atractivos sobre el proyecto..."
                    {...formik.getFieldProps('descripcion')}
                    disabled={isLoading}
                    sx={commonInputSx}
                />
            </Stack>
        </Box>

        <Divider />

        {/* 2. CONFIGURACIÓN FINANCIERA */}
        <Box>
          <Typography variant="subtitle2" sx={sectionTitleSx}>
             <MonetizationIcon fontSize="inherit" /> Modelo de Negocio
          </Typography>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                    fullWidth select
                    id="tipo_inversion"
                    label="Tipo de Inversión"
                    {...formik.getFieldProps('tipo_inversion')}
                    disabled={isLoading}
                    sx={commonInputSx}
                >
                    <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
                    <MenuItem value="directo">Inversión (Directo)</MenuItem>
                </TextField>
              </Box>
             
              <Box sx={{ flex: 1 }}>
                <TextField
                    fullWidth select
                    id="moneda"
                    label="Moneda"
                    {...formik.getFieldProps('moneda')}
                    disabled={true} 
                    helperText="Automático según tipo"
                    sx={commonInputSx}
                >
                    <MenuItem value="ARS">ARS (Pesos)</MenuItem>
                    <MenuItem value="USD">USD (Dólares)</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                    fullWidth
                    id="monto_inversion"
                    label={formik.values.tipo_inversion === 'mensual' ? "Valor Cuota Base" : "Monto Total"}
                    type="number" 
                    InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    {...formik.getFieldProps('monto_inversion')}
                    error={formik.touched.monto_inversion && Boolean(formik.errors.monto_inversion)}
                    helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                    disabled={isLoading}
                    sx={commonInputSx}
                />
              </Box>
          </Stack>
        </Box>

        {/* 3. CONFIGURACIÓN ESPECÍFICA (SOLO MENSUAL) */}
        {formik.values.tipo_inversion === 'mensual' && (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2.5, 
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                }}
            >
                <Typography variant="subtitle2" sx={{ ...sectionTitleSx, color: 'primary.main', mb: 2 }}>
                    <SavingsIcon fontSize="inherit" /> Configuración de Ahorro
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth
                        id="obj_suscripciones"
                        label="Objetivo Suscripciones"
                        type="number"
                        {...formik.getFieldProps('obj_suscripciones')}
                        error={formik.touched.obj_suscripciones && Boolean(formik.errors.obj_suscripciones)}
                        helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones}
                        disabled={isLoading}
                        size="small"
                        InputProps={{ endAdornment: <InputAdornment position="end">Subs</InputAdornment> }}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth
                        id="suscripciones_minimas"
                        label="Mínimo para Iniciar"
                        type="number"
                        {...formik.getFieldProps('suscripciones_minimas')}
                        disabled={isLoading}
                        size="small"
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth
                        id="plazo_inversion"
                        label="Plazo Estimado"
                        type="number"
                        {...formik.getFieldProps('plazo_inversion')}
                        error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                        helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                        disabled={isLoading}
                        size="small"
                        InputProps={{ endAdornment: <InputAdornment position="end">Meses</InputAdornment> }}
                        sx={commonInputSx}
                    />
                </Stack>
            </Paper>
        )}

        <Divider />

        {/* 4. CRONOGRAMA y UBICACION */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <CalendarIcon fontSize="inherit" /> Cronograma y Ubicación
            </Typography>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* Columna Izquierda: Fechas */}
                <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
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
                            sx={commonInputSx}
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
                            sx={commonInputSx}
                        />
                    </Stack>
                </Box>

                {/* Columna Derecha: Ubicación */}
                <Box sx={{ flex: 1 }}>
                      <Stack spacing={2}>
                        <TextField
                            fullWidth
                            id="latitud"
                            label="Latitud"
                            type="number"
                            placeholder="-32.889459"
                            inputProps={{ step: "any" }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LocationIcon fontSize='small' color="action"/></InputAdornment>,
                            }}
                            {...formik.getFieldProps('latitud')}
                            error={formik.touched.latitud && Boolean(formik.errors.latitud)}
                            helperText={formik.touched.latitud && formik.errors.latitud}
                            disabled={isLoading}
                            sx={commonInputSx}
                        />
                        <TextField
                            fullWidth
                            id="longitud"
                            label="Longitud"
                            type="number"
                            placeholder="-68.845839"
                            inputProps={{ step: "any" }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LocationIcon fontSize='small' color="action"/></InputAdornment>,
                            }}
                            {...formik.getFieldProps('longitud')}
                            error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                            helperText={formik.touched.longitud && formik.errors.longitud}
                            disabled={isLoading}
                            sx={commonInputSx}
                        />
                     </Stack>
                </Box>
            </Stack>
        </Box>

        <Divider />

        {/* 5. IMAGEN */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <ImageIcon fontSize="inherit" /> Imagen de Portada
            </Typography>
            <Box sx={{ maxWidth: 400 }}>
                <SingleImageUpload
                    image={image}
                    onChange={setImage}
                    maxSizeMB={15}
                    disabled={isLoading}
                />
            </Box>
            {!image && (
                <Alert severity="info" sx={{ mt: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                    La imagen es opcional al crear, pero recomendada para el catálogo.
                </Alert>
            )}
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default CreateProyectoModal;
// src/components/Admin/Proyectos/Components/modals/EditProyectoModal.tsx

import React, { useEffect } from 'react';
import {
  TextField, MenuItem, Stack, Box, Typography, Divider, 
  FormControlLabel, Switch, useTheme, alpha, Paper, InputAdornment, Chip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Savings as SavingsIcon,
  Public as WorldIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { ProyectoDto, UpdateProyectoDto } from '../../../../../../core/types/dto/proyecto.dto';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
  onSubmit: (id: number, data: UpdateProyectoDto) => Promise<void>;
  isLoading?: boolean;
}

// ✅ Esquema de validación consistente
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().min(20, 'Describe mejor el proyecto (mín 20 car.)').required('Requerido'),
  forma_juridica: Yup.string().required('Requerido'),
  estado_proyecto: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date()
    .required('Requerido')
    .min(Yup.ref('fecha_inicio'), 'Debe ser posterior al inicio'),
  latitud: Yup.number().nullable().min(-90).max(90),
  longitud: Yup.number().nullable().min(-180).max(180),
  obj_suscripciones: Yup.number().nullable().min(1, 'Mínimo 1'),
  suscripciones_minimas: Yup.number().nullable().min(0),
  plazo_inversion: Yup.number().nullable().min(1, 'Mínimo 1 mes'),
});

const EditProyectoModal: React.FC<EditProyectoModalProps> = ({ 
  open, onClose, proyecto, onSubmit, isLoading = false 
}) => {
  const theme = useTheme();

  const formik = useFormik<UpdateProyectoDto>({
    initialValues: {
      nombre_proyecto: '', descripcion: '', forma_juridica: '',
      fecha_inicio: '', fecha_cierre: '', activo: true,
      estado_proyecto: 'En Espera', latitud: undefined, longitud: undefined,
      obj_suscripciones: undefined, suscripciones_minimas: undefined, plazo_inversion: undefined,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, 
    onSubmit: async (values) => {
      if (!proyecto) return;
      
      // ✅ Limpieza de datos (vacíos a null) y conversión forzada a Number para la API
      const cleanData = Object.fromEntries(
        Object.entries(values).map(([key, val]) => {
            if (val === '') return [key, null];
            // Aseguramos que campos que deben ser números lo sean al enviar
            if (['latitud', 'longitud', 'obj_suscripciones', 'suscripciones_minimas', 'plazo_inversion'].includes(key)) {
                return [key, val !== null ? Number(val) : null];
            }
            return [key, val];
        })
      );

      try {
        await onSubmit(proyecto.id, cleanData as UpdateProyectoDto);
        onClose();
      } catch (error) {
        console.error('Error al editar:', error);
      }
    },
  });

  useEffect(() => {
    if (proyecto && open) {
      formik.setValues({
        nombre_proyecto: proyecto.nombre_proyecto || '',
        descripcion: proyecto.descripcion || '',
        forma_juridica: proyecto.forma_juridica || '',
        // Formateo de fecha seguro para input type="date"
        fecha_inicio: proyecto.fecha_inicio ? proyecto.fecha_inicio.split('T')[0] : '',
        fecha_cierre: proyecto.fecha_cierre ? proyecto.fecha_cierre.split('T')[0] : '',
        activo: proyecto.activo ?? true,
        estado_proyecto: proyecto.estado_proyecto || 'En Espera',
        
        // ✅ CORRECCIÓN DE TIPO: Conversión explícita de String (del DB) a Number (para Formik/TS)
        latitud: proyecto.latitud != null ? Number(proyecto.latitud) : undefined,
        longitud: proyecto.longitud != null ? Number(proyecto.longitud) : undefined,
        obj_suscripciones: proyecto.obj_suscripciones != null ? Number(proyecto.obj_suscripciones) : undefined,
        suscripciones_minimas: proyecto.suscripciones_minimas != null ? Number(proyecto.suscripciones_minimas) : undefined,
        plazo_inversion: proyecto.plazo_inversion != null ? Number(proyecto.plazo_inversion) : undefined,
      });
    }
  }, [proyecto, open]);

  if (!proyecto) return null;

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
    fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, 
    display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.72rem', letterSpacing: 0.5
  };

  return (
    <BaseModal
      open={open} onClose={() => { formik.resetForm(); onClose(); }} 
      title="Editar Proyecto" icon={<EditIcon />} headerColor="primary"
      confirmText="Guardar Cambios" confirmButtonIcon={<SaveIcon />} onConfirm={formik.submitForm}
      isLoading={isLoading} disableConfirm={!formik.isValid || isLoading} maxWidth="md"
      headerExtra={<Chip label={`ID: ${proyecto.id}`} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
    >
      <Stack spacing={4}>
        
        {/* 1. INFORMACIÓN PRINCIPAL */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <DescriptionIcon fontSize="inherit" /> Información del Desarrollo
            </Typography>
            
            <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth label="Nombre del Proyecto"
                        {...formik.getFieldProps('nombre_proyecto')}
                        error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                        helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                        sx={{ ...commonInputSx, flex: 2 }}
                    />
                    <TextField
                        select fullWidth label="Estado"
                        {...formik.getFieldProps('estado_proyecto')}
                        sx={{ ...commonInputSx, flex: 1 }}
                    >
                        <MenuItem value="En Espera">En Espera</MenuItem>
                        <MenuItem value="En proceso">En Proceso</MenuItem>
                        <MenuItem value="Finalizado">Finalizado</MenuItem>
                    </TextField>
                </Stack>

                <Box>
                    <TextField
                        fullWidth multiline rows={4} maxRows={10}
                        label="Descripción Comercial"
                        {...formik.getFieldProps('descripcion')}
                        error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
                        helperText={formik.errors.descripcion || `${formik.values.descripcion?.length || 0} caracteres`}
                        sx={commonInputSx}
                    />
                </Box>

                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                    <TextField
                        fullWidth label="Forma Jurídica"
                        {...formik.getFieldProps('forma_juridica')}
                        error={formik.touched.forma_juridica && Boolean(formik.errors.forma_juridica)}
                        helperText={formik.touched.forma_juridica && formik.errors.forma_juridica}
                        sx={commonInputSx}
                    />
                </Box>
            </Stack>
        </Box>

        <Divider />

        {/* 2. CRONOGRAMA */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <CalendarIcon fontSize="inherit" /> Plazos de Convocatoria
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                    fullWidth label="Fecha de Inicio" type="date" InputLabelProps={{ shrink: true }}
                    {...formik.getFieldProps('fecha_inicio')}
                    error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                    helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
                    sx={commonInputSx}
                />
                <TextField
                    fullWidth label="Fecha de Cierre" type="date" InputLabelProps={{ shrink: true }}
                    {...formik.getFieldProps('fecha_cierre')}
                    error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                    helperText={formik.touched.fecha_cierre && (formik.errors.fecha_cierre as string)}
                    sx={commonInputSx}
                />
            </Stack>
        </Box>

        {/* 3. CONFIGURACIÓN (MENSUAL) */}
        {proyecto.tipo_inversion === 'mensual' && (
            <Paper 
                elevation={0}
                sx={{ p: 2.5, border: `1px dashed ${theme.palette.primary.main}`, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}
            >
                <Typography variant="subtitle2" sx={{ ...sectionTitleSx, color: 'primary.main', mb: 2.5 }}>
                    <SavingsIcon fontSize="inherit" /> Objetivos de Suscripción
                </Typography>
                
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth label="Cupo Máximo" type="number"
                        {...formik.getFieldProps('obj_suscripciones')}
                        InputProps={{ endAdornment: <InputAdornment position="end">Planes</InputAdornment> }}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth label="Mínimo Requerido" type="number"
                        {...formik.getFieldProps('suscripciones_minimas')}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth label="Plazo Inversión" type="number"
                        {...formik.getFieldProps('plazo_inversion')}
                        InputProps={{ endAdornment: <InputAdornment position="end">Meses</InputAdornment> }}
                        sx={commonInputSx}
                    />
                </Stack>
            </Paper>
        )}

        <Divider />

        {/* 4. LOCALIZACIÓN Y VISIBILIDAD */}
        <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                <Box sx={{ flex: 1, width: '100%' }}>
                    <Typography variant="subtitle2" sx={sectionTitleSx}>
                        <LocationIcon fontSize="inherit" /> Georreferenciación
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth label="Latitud" type="number"
                            {...formik.getFieldProps('latitud')}
                            InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment> }}
                            sx={commonInputSx}
                        />
                        <TextField
                            fullWidth label="Longitud" type="number"
                            {...formik.getFieldProps('longitud')}
                            InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment> }}
                            sx={commonInputSx}
                        />
                    </Stack>
                </Box>

                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 2, minWidth: 160, textAlign: 'center', borderRadius: 2,
                        borderColor: formik.values.activo ? 'success.main' : 'divider',
                        bgcolor: formik.values.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                    }}
                >
                    <Typography variant="caption" fontWeight={800} color={formik.values.activo ? 'success.main' : 'text.disabled'} display="block" mb={1}>
                        VISIBILIDAD PÚBLICA
                    </Typography>
                    <FormControlLabel
                        control={<Switch checked={formik.values.activo} onChange={(e) => formik.setFieldValue('activo', e.target.checked)} color="success" />}
                        label={<Typography variant="body2" fontWeight={700}>{formik.values.activo ? "ACTIVO" : "OCULTO"}</Typography>}
                        labelPlacement="bottom"
                        sx={{ m: 0 }}
                    />
                </Paper>
            </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default EditProyectoModal;
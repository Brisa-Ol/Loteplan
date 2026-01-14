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

// ✅ Esquema de validación
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().required('Requerido'),
  descripcion: Yup.string().nullable(),
  forma_juridica: Yup.string().nullable(),
  estado_proyecto: Yup.string().required('Requerido'),
  fecha_inicio: Yup.string().required('Requerido'),
  fecha_cierre: Yup.string()
    .required('Requerido')
    .test('is-after', 'La fecha de cierre debe ser posterior a la de inicio', function(value) {
      const { fecha_inicio } = this.parent;
      if (!fecha_inicio || !value) return true;
      return new Date(value) > new Date(fecha_inicio);
    }),
  latitud: Yup.number().nullable().min(-90).max(90),
  longitud: Yup.number().nullable().min(-180).max(180),
  obj_suscripciones: Yup.number().nullable().min(1, 'Mínimo 1'),
  suscripciones_minimas: Yup.number().nullable().min(0, 'No puede ser negativo'),
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
      try {
        await onSubmit(proyecto.id, values);
        handleReset();
      } catch (error) {
        console.error('Error al editar:', error);
      }
    },
  });

  const handleReset = () => {
    formik.resetForm();
    onClose();
  };

  useEffect(() => {
    if (proyecto && open) {
      formik.setValues({
        nombre_proyecto: proyecto.nombre_proyecto || '',
        descripcion: proyecto.descripcion || '',
        forma_juridica: proyecto.forma_juridica || '',
        fecha_inicio: proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toISOString().slice(0, 10) : '',
        fecha_cierre: proyecto.fecha_cierre ? new Date(proyecto.fecha_cierre).toISOString().slice(0, 10) : '',
        activo: proyecto.activo ?? true,
        estado_proyecto: proyecto.estado_proyecto || 'En Espera',
        latitud: proyecto.latitud ?? undefined,
        longitud: proyecto.longitud ?? undefined,
        obj_suscripciones: proyecto.obj_suscripciones ?? undefined,
        suscripciones_minimas: proyecto.suscripciones_minimas ?? undefined,
        plazo_inversion: proyecto.plazo_inversion ?? undefined,
      });
    }
  }, [proyecto, open]);

  if (!proyecto) return null;

  // Estilos
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
    fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, 
    display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem', letterSpacing: 0.5
  };

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title="Editar Proyecto"
      subtitle={`Modificando: ${proyecto.nombre_proyecto}`}
      icon={<EditIcon />}
      headerColor="primary"
      confirmText="Guardar Cambios"
      confirmButtonIcon={<SaveIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      disableConfirm={!formik.isValid || isLoading}
      maxWidth="md"
      headerExtra={
        <Chip 
            label={`ID: ${proyecto.id}`} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={4}>
        
        {/* 1. INFORMACIÓN GENERAL */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <DescriptionIcon fontSize="inherit" /> Información General
            </Typography>
            
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 2 }}>
                        <TextField
                            fullWidth
                            id="nombre_proyecto"
                            label="Nombre del Proyecto"
                            {...formik.getFieldProps('nombre_proyecto')}
                            error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                            helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                            disabled={isLoading}
                            sx={commonInputSx}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <TextField
                            select
                            fullWidth
                            id="estado_proyecto"
                            label="Estado Actual"
                            {...formik.getFieldProps('estado_proyecto')}
                            disabled={isLoading}
                            sx={commonInputSx}
                        >
                            <MenuItem value="En Espera">En Espera</MenuItem>
                            <MenuItem value="En proceso">En Proceso</MenuItem>
                            <MenuItem value="Finalizado">Finalizado</MenuItem>
                        </TextField>
                    </Box>
                </Stack>

                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    id="descripcion"
                    label="Descripción Comercial"
                    placeholder="Breve descripción del proyecto..."
                    {...formik.getFieldProps('descripcion')}
                    disabled={isLoading}
                    sx={commonInputSx}
                />

                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                    <TextField
                        fullWidth
                        id="forma_juridica"
                        label="Forma Jurídica"
                        {...formik.getFieldProps('forma_juridica')}
                        disabled={isLoading}
                        sx={commonInputSx}
                    />
                </Box>
            </Stack>
        </Box>

        <Divider />

        {/* 2. VIGENCIA (FECHAS) */}
        <Box>
            <Typography variant="subtitle2" sx={sectionTitleSx}>
                <CalendarIcon fontSize="inherit" /> Vigencia del Proyecto
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                    fullWidth
                    id="fecha_inicio"
                    label="Fecha de Inicio"
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
                    label="Fecha de Cierre"
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

        {/* 3. CONFIGURACIÓN ESPECÍFICA (SOLO MENSUAL) */}
        {proyecto.tipo_inversion === 'mensual' && (
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
                        disabled={isLoading}
                        size="small"
                        InputProps={{ endAdornment: <InputAdornment position="end">Subs</InputAdornment> }}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth
                        id="suscripciones_minimas"
                        label="Mínimo Requerido"
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
                        disabled={isLoading}
                        size="small"
                        InputProps={{ endAdornment: <InputAdornment position="end">Meses</InputAdornment> }}
                        sx={commonInputSx}
                    />
                </Stack>
            </Paper>
        )}

        <Divider />

        {/* 4. UBICACIÓN Y ESTADO */}
        <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                
                {/* Columna Izquierda: Ubicación */}
                <Box sx={{ flex: 2, width: '100%' }}>
                    <Typography variant="subtitle2" sx={sectionTitleSx}>
                        <LocationIcon fontSize="inherit" /> Ubicación Geográfica
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            id="latitud"
                            label="Latitud"
                            type="number"
                            inputProps={{ step: "any" }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment> }}
                            {...formik.getFieldProps('latitud')}
                            disabled={isLoading}
                            sx={commonInputSx}
                        />
                        <TextField
                            fullWidth
                            id="longitud"
                            label="Longitud"
                            type="number"
                            inputProps={{ step: "any" }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment> }}
                            {...formik.getFieldProps('longitud')}
                            disabled={isLoading}
                            sx={commonInputSx}
                        />
                    </Stack>
                </Box>

                {/* Columna Derecha: Switch de Estado */}
                <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: {xs: 'flex-start', md: 'flex-end'} }}>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            width: { xs: '100%', md: 'auto' },
                            minWidth: 150,
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            borderColor: formik.values.activo ? 'success.main' : 'divider',
                            bgcolor: formik.values.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="caption" fontWeight={700} color={formik.values.activo ? 'success.main' : 'text.disabled'} gutterBottom>
                            VISIBILIDAD
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formik.values.activo}
                                    onChange={(e) => formik.setFieldValue('activo', e.target.checked)}
                                    color="success"
                                />
                            }
                            label={
                                <Typography variant="body2" fontWeight={600}>
                                    {formik.values.activo ? "Público" : "Oculto"}
                                </Typography>
                            }
                            labelPlacement="bottom"
                            sx={{ m: 0 }}
                        />
                    </Paper>
                </Box>
            </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default EditProyectoModal;
// src/components/Admin/Proyectos/Components/modals/EditProyectoModal.tsx

import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Divider, FormControlLabel, Switch, 
  useTheme, alpha, Avatar, Paper, InputAdornment
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Edit as EditIcon, 
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Savings as SavingsIcon,
  Public as WorldIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import type { UpdateProyectoDto, ProyectoDto } from '../../../../../types/dto/proyecto.dto';

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
  onSubmit: (id: number, data: UpdateProyectoDto) => Promise<void>;
  isLoading?: boolean;
}

// ✅ Esquema de validación (Mantenido igual)
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
  open, 
  onClose, 
  proyecto, 
  onSubmit, 
  isLoading = false 
}) => {
  const theme = useTheme();

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const formik = useFormik<UpdateProyectoDto>({
    initialValues: {
      nombre_proyecto: '',
      descripcion: '',
      forma_juridica: '',
      fecha_inicio: '',
      fecha_cierre: '',
      activo: true,
      estado_proyecto: 'En Espera',
      latitud: undefined,
      longitud: undefined,
      obj_suscripciones: undefined,
      suscripciones_minimas: undefined,
      plazo_inversion: undefined,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, 
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await onSubmit(proyecto.id, values);
        handleClose();
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
        fecha_inicio: proyecto.fecha_inicio || '',
        fecha_cierre: proyecto.fecha_cierre || '',
        activo: proyecto.activo ?? true,
        estado_proyecto: proyecto.estado_proyecto || 'En Espera',
        latitud: proyecto.latitud ?? undefined,
        longitud: proyecto.longitud ?? undefined,
        obj_suscripciones: proyecto.obj_suscripciones ?? undefined,
        suscripciones_minimas: proyecto.suscripciones_minimas ?? undefined,
        plazo_inversion: proyecto.plazo_inversion ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto, open]);

  return (
    <Dialog 
        open={open} 
        onClose={isLoading ? undefined : handleClose} 
        maxWidth="md" 
        fullWidth
        scroll="paper" // 👈 Activa el scroll interno
        PaperProps={{ 
            elevation: 0,
            sx: { 
                borderRadius: 3, 
                boxShadow: theme.shadows[10],
                overflow: 'hidden',
                maxHeight: '90vh' // 👈 Limita la altura para asegurar scroll
            } 
        }}
    >
      {/* HEADER ESTILIZADO */}
      <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          py: 2.5, px: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar 
            variant="rounded" 
            sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: theme.palette.primary.main,
                width: 40, height: 40
            }}
          >
            <EditIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>
              Editar Proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {proyecto?.id} • <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{proyecto?.nombre_proyecto}</Box>
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Envuelve el contenido en form con layout flex para manejar el scroll correctamente */}
      <form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={4}>
            
            {/* 1. INFORMACIÓN GENERAL */}
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon fontSize="small" /> Información General
                </Typography>
                
                <Stack spacing={2}>
                    {/* Fila 1: Nombre (2/3) y Estado (1/3) */}
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
                            >
                                <MenuItem value="En Espera">En Espera</MenuItem>
                                <MenuItem value="En proceso">En Proceso</MenuItem>
                                <MenuItem value="Finalizado">Finalizado</MenuItem>
                            </TextField>
                        </Box>
                    </Stack>

                    {/* Fila 2: Descripción (Full Width) */}
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        id="descripcion"
                        label="Descripción Comercial"
                        placeholder="Breve descripción del proyecto..."
                        {...formik.getFieldProps('descripcion')}
                        disabled={isLoading}
                    />

                    {/* Fila 3: Forma Jurídica (Mitad de ancho) */}
                    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                        <TextField
                            fullWidth
                            id="forma_juridica"
                            label="Forma Jurídica"
                            {...formik.getFieldProps('forma_juridica')}
                            disabled={isLoading}
                        />
                    </Box>
                </Stack>
            </Box>

            <Divider />

            {/* 2. VIGENCIA (FECHAS) */}
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" /> Vigencia del Proyecto
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
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
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
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
                        />
                    </Box>
                </Stack>
            </Box>

            {/* 3. CONFIGURACIÓN ESPECÍFICA (SOLO MENSUAL) */}
            {proyecto?.tipo_inversion === 'mensual' && (
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 2.5, 
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SavingsIcon fontSize="small" /> Configuración de Ahorro (Mensual)
                    </Typography>
                    
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
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
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">Subs</InputAdornment>,
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                             <TextField
                                fullWidth
                                id="suscripciones_minimas"
                                label="Mínimo Requerido"
                                type="number"
                                {...formik.getFieldProps('suscripciones_minimas')}
                                error={formik.touched.suscripciones_minimas && Boolean(formik.errors.suscripciones_minimas)}
                                helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas}
                                disabled={isLoading}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
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
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">Meses</InputAdornment>,
                                }}
                            />
                        </Box>
                    </Stack>
                </Paper>
            )}

            <Divider />

            {/* 4. UBICACIÓN Y ESTADO */}
            <Box>
                {/* Contenedor principal dividido en 2 columnas: Datos (2/3) y Estado (1/3) */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                    
                    {/* Columna Izquierda: Ubicación */}
                    <Box sx={{ flex: 2, width: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon fontSize="small" /> Ubicación Geográfica
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                id="latitud"
                                label="Latitud"
                                type="number"
                                placeholder="-32.889459"
                                inputProps={{ step: "any" }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment>,
                                }}
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
                                inputProps={{ step: "any" }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><WorldIcon fontSize='small' color="action"/></InputAdornment>,
                                }}
                                {...formik.getFieldProps('longitud')}
                                error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                                helperText={formik.touched.longitud && formik.errors.longitud}
                                disabled={isLoading}
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
                                bgcolor: formik.values.activo ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                            }}
                        >
                            <Typography variant="caption" fontWeight={600} color={formik.values.activo ? 'success.main' : 'text.disabled'} gutterBottom>
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
                                    <Typography variant="body2" fontWeight={500}>
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
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button onClick={handleClose} color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
            sx={{ px: 4 }}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProyectoModal;
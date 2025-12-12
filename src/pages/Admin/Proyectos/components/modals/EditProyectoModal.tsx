import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Divider, FormControlLabel, Switch, InputAdornment
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Importaciones
import type { UpdateProyectoDto, ProyectoDto } from '../../../../../types/dto/proyecto.dto';

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
  onSubmit: (id: number, data: UpdateProyectoDto) => Promise<void>;
  isLoading?: boolean;
}

// ✅ Esquema de validación mejorado
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().required('Requerido'),
  descripcion: Yup.string().nullable(),
  forma_juridica: Yup.string().nullable(),
  estado_proyecto: Yup.string().required('Requerido'),
  
  // Validaciones de Fechas
  fecha_inicio: Yup.string().required('Requerido'),
  fecha_cierre: Yup.string()
    .required('Requerido')
    .test('is-after', 'La fecha de cierre debe ser posterior a la de inicio', function(value) {
      const { fecha_inicio } = this.parent;
      if (!fecha_inicio || !value) return true;
      return new Date(value) > new Date(fecha_inicio);
    }),

  // Validaciones de Ubicación
  latitud: Yup.number()
    .nullable()
    .min(-90, 'Latitud inválida (-90 a 90)')
    .max(90, 'Latitud inválida (-90 a 90)'),
  longitud: Yup.number()
    .nullable()
    .min(-180, 'Longitud inválida (-180 a 180)')
    .max(180, 'Longitud inválida (-180 a 180)'),

  // Validaciones Numéricas (Solo si se ingresan)
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

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const formik = useFormik<UpdateProyectoDto>({
    // ✅ Inicializar con valores vacíos o undefined
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
    // ✅ Habilitar reinicialización al cambiar 'initialValues' (cuando carga 'proyecto')
    enableReinitialize: true, 
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await onSubmit(proyecto.id, values);
        // Nota: El cierre del modal (onClose) suele manejarse en el componente padre 
        // tras el éxito de la mutación, o puedes llamarlo aquí si prefieres:
        handleClose();
      } catch (error) {
        console.error('Error al editar:', error);
      }
    },
  });

  // ✅ Efecto para cargar los datos del proyecto en el formulario
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
        // Convertimos null a undefined para que Formik no se queje en inputs numéricos
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
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Editar Proyecto: {proyecto?.nombre_proyecto}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            
            {/* 1. Información General y Estado */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                id="nombre_proyecto"
                label="Nombre del Proyecto"
                {...formik.getFieldProps('nombre_proyecto')}
                error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                disabled={isLoading}
              />
              <TextField
                select
                sx={{ minWidth: 200 }}
                id="estado_proyecto"
                label="Estado"
                {...formik.getFieldProps('estado_proyecto')}
                disabled={isLoading}
              >
                <MenuItem value="En Espera">En Espera</MenuItem>
                <MenuItem value="En proceso">En Proceso</MenuItem>
                <MenuItem value="Finalizado">Finalizado</MenuItem>
              </TextField>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              id="descripcion"
              label="Descripción"
              {...formik.getFieldProps('descripcion')}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              id="forma_juridica"
              label="Forma Jurídica"
              {...formik.getFieldProps('forma_juridica')}
              disabled={isLoading}
            />

            <Divider />

            {/* 2. Fechas */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vigencia
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        id="fecha_inicio"
                        label="Fecha Inicio"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_inicio')}
                        error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                        helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
                        disabled={isLoading}
                    />
                    <TextField
                        fullWidth
                        id="fecha_cierre"
                        label="Fecha Cierre"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_cierre')}
                        error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                        helperText={formik.touched.fecha_cierre && (formik.errors.fecha_cierre as string)}
                        disabled={isLoading}
                    />
                </Box>
            </Box>

            {/* 3. Configuración Específica (Solo Mensual) */}
            {proyecto?.tipo_inversion === 'mensual' && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Configuración Mensual (Ahorro)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            sx={{ flex: 1 }}
                            id="obj_suscripciones"
                            label="Objetivo Suscripciones"
                            type="number"
                            {...formik.getFieldProps('obj_suscripciones')}
                            error={formik.touched.obj_suscripciones && Boolean(formik.errors.obj_suscripciones)}
                            helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones}
                            disabled={isLoading}
                        />
                         <TextField
                            sx={{ flex: 1 }}
                            id="suscripciones_minimas"
                            label="Mínimo Requerido"
                            type="number"
                            {...formik.getFieldProps('suscripciones_minimas')}
                            error={formik.touched.suscripciones_minimas && Boolean(formik.errors.suscripciones_minimas)}
                            helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas}
                            disabled={isLoading}
                        />
                        <TextField
                            sx={{ flex: 1 }}
                            id="plazo_inversion"
                            label="Plazo (Meses)"
                            type="number"
                            {...formik.getFieldProps('plazo_inversion')}
                            error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                            helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                            disabled={isLoading}
                        />
                    </Box>
                </Box>
            )}

            <Divider />

            {/* 4. Ubicación Geográfica */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    <LocationIcon fontSize="small" /> Ubicación Geográfica
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        id="latitud"
                        label="Latitud"
                        type="number"
                        placeholder="-32.889459"
                        inputProps={{ step: "any" }}
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
                        {...formik.getFieldProps('longitud')}
                        error={formik.touched.longitud && Boolean(formik.errors.longitud)}
                        helperText={formik.touched.longitud && formik.errors.longitud}
                        disabled={isLoading}
                    />
                </Box>
            </Box>

            {/* 5. Switch Activo */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={formik.values.activo}
                            onChange={(e) => formik.setFieldValue('activo', e.target.checked)}
                            color="success"
                        />
                    }
                    label={formik.values.activo ? "Proyecto Activo (Visible)" : "Proyecto Oculto"}
                />
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
            startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProyectoModal;
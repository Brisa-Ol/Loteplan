import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Divider, Alert
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { ProyectoDto, UpdateProyectoDto } from '../../../../types/dto/proyecto.dto';



interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateProyectoDto) => Promise<void>;
  proyecto: ProyectoDto | null;
  isLoading?: boolean;
}

// Esquema de validación
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().required('Requerido'),
  descripcion: Yup.string().nullable(),
  forma_juridica: Yup.string().nullable(),
  fecha_inicio: Yup.string().required('Requerido'),
  fecha_cierre: Yup.string().required('Requerido'),
  // Validaciones condicionales para mensual
  obj_suscripciones: Yup.number().nullable(),
  suscripciones_minimas: Yup.number().nullable(),
  plazo_inversion: Yup.number().nullable(),
  
  // Coordenadas
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
});

const EditProyectoModal: React.FC<EditProyectoModalProps> = ({
  open,
  onClose,
  onSubmit,
  proyecto,
  isLoading = false
}) => {

  const formik = useFormik<UpdateProyectoDto>({
    initialValues: {
      nombre_proyecto: '',
      descripcion: '',
      forma_juridica: '',
      fecha_inicio: '',
      fecha_cierre: '',
      activo: true,
      estado_proyecto: 'En Espera',
      latitud: undefined, // Usar undefined para números opcionales es más seguro con DTOs estrictos
      longitud: undefined,
      // Campos opcionales
      obj_suscripciones: 0,
      suscripciones_minimas: 0,
      plazo_inversion: 0,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await onSubmit(proyecto.id, values);
        onClose();
      } catch (error) {
        console.error('Error al editar:', error);
      }
    },
    enableReinitialize: false, 
  });

  // Cargar datos cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (proyecto && open) {
      formik.setValues({
        nombre_proyecto: proyecto.nombre_proyecto,
        descripcion: proyecto.descripcion || '',
        forma_juridica: proyecto.forma_juridica || '',
        fecha_inicio: proyecto.fecha_inicio, 
        fecha_cierre: proyecto.fecha_cierre,
        activo: proyecto.activo,
        estado_proyecto: proyecto.estado_proyecto,
        latitud: proyecto.latitud,
        longitud: proyecto.longitud,
        obj_suscripciones: proyecto.obj_suscripciones,
        suscripciones_minimas: proyecto.suscripciones_minimas,
        plazo_inversion: proyecto.plazo_inversion,
      });
    }
  }, [proyecto, open]);

  if (!proyecto) return null;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Editar Proyecto: {proyecto.nombre_proyecto}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            
            {/* --- Información Básica --- */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Información General
              </Typography>
              
              {/* Fila 1: Nombre y Forma Jurídica */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  {...formik.getFieldProps('nombre_proyecto')}
                  error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                  helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />
                <TextField
                  fullWidth
                  label="Forma Jurídica"
                  {...formik.getFieldProps('forma_juridica')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                {...formik.getFieldProps('descripcion')}
                disabled={isLoading}
              />
            </Box>

            <Divider />

            {/* --- Estados y Fechas --- */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Estado y Tiempos
              </Typography>
              
              {/* Fila 2: Estado, Inicio, Cierre */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Estado del Proyecto"
                  {...formik.getFieldProps('estado_proyecto')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="En Espera">En Espera</MenuItem>
                  <MenuItem value="En proceso">En Proceso</MenuItem>
                  <MenuItem value="Finalizado">Finalizado</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Inicio"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />

                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Cierre"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_cierre')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            {/* --- Campos específicos Ahorro Mensual --- */}
            {proyecto.tipo_inversion === 'mensual' && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                    Configuración Mensual
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Plazo (Meses)"
                      {...formik.getFieldProps('plazo_inversion')}
                      disabled={isLoading}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Obj. Suscriptores"
                      {...formik.getFieldProps('obj_suscripciones')}
                      disabled={isLoading}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Min. Suscriptores"
                      {...formik.getFieldProps('suscripciones_minimas')}
                      disabled={isLoading}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              </>
            )}

            <Divider />
             
            {/* --- Ubicación --- */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                Ubicación Geográfica
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitud"
                  {...formik.getFieldProps('latitud')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Longitud"
                  {...formik.getFieldProps('longitud')}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProyectoModal;
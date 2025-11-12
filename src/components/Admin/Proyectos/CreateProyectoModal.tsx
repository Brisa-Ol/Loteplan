// src/components/Admin/Proyectos/CreateProyectoModal.tsx
import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Alert, Autocomplete, Checkbox
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';

// 1. Importamos DTOs y Servicios necesarios
import type { CreateProyectoDTO } from '../../../types/dto/proyecto.dto';
import type { LoteDTO } from '../../../types/dto/lote.dto';
import loteService from '../../../Services/lote.service';

// 2. Definimos las Props
interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProyectoDTO) => Promise<void>;
  isLoading?: boolean;
}

// 3. Definimos la Validación con Yup
const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  descripcion: Yup.string().nullable(),
  tipo_inversion: Yup.string().oneOf(['directo', 'mensual']).required('Requerido'),
  monto_inversion: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  moneda: Yup.string().required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date().required('Requerido'),
  
  // --- Campos Condicionales ---
  plazo_inversion: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1, 'Debe ser mayor a 0').required('Requerido para tipo "mensual"'),
    otherwise: (schema) => schema.nullable(),
  }),
  obj_suscripciones: Yup.number().when('tipo_inversion', {
    is: 'mensual',
    then: (schema) => schema.min(1, 'Debe ser mayor a 0').required('Requerido para tipo "mensual"'),
    otherwise: (schema) => schema.nullable(),
  }),
  suscripciones_minimas: Yup.number().nullable(),
  
  // --- Campos Opcionales ---
  forma_juridica: Yup.string().nullable(),
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
  lotesIds: Yup.array().of(Yup.number()).nullable(),
});

// 4. Componente Principal
const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {

  // 5. Query para traer Lotes Disponibles (sin asignar)
  const { data: lotesDisponibles = [], isLoading: isLoadingLotes } = useQuery<LoteDTO[], Error>({
    queryKey: ['unassignedLotes'],
    queryFn: loteService.getUnassignedLotes,
    enabled: open, // Solo busca lotes cuando el modal está abierto
  });

  const formik = useFormik<CreateProyectoDTO>({
    initialValues: {
      nombre_proyecto: '',
      descripcion: '',
      tipo_inversion: 'mensual',
      plazo_inversion: 12,
      forma_juridica: 'Fideicomiso',
      monto_inversion: 0,
      moneda: 'ARS',
      suscripciones_minimas: 1,
      obj_suscripciones: 1,
      fecha_inicio: '',
      fecha_cierre: '',
      latitud: undefined,
      longitud: undefined,
      lotesIds: []
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        await onSubmit(values);
        formik.resetForm();
        onClose();
      } catch (error) {
        console.error('Error al crear proyecto:', error);
      }
    },
  });
  
  // Efecto para cambiar la moneda automáticamente
  useEffect(() => {
    if (formik.values.tipo_inversion === 'mensual') {
      formik.setFieldValue('moneda', 'ARS');
    } else if (formik.values.tipo_inversion === 'directo') {
      formik.setFieldValue('moneda', 'USD');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.tipo_inversion]);


  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Crear Nuevo Proyecto</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            
            {/* --- Información Básica --- */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Información Básica
              </Typography>
              <TextField
                fullWidth
                id="nombre_proyecto"
                label="Nombre del Proyecto"
                {...formik.getFieldProps('nombre_proyecto')}
                error={formik.touched.nombre_proyecto && Boolean(formik.errors.nombre_proyecto)}
                helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto}
                disabled={isLoading}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                id="descripcion"
                label="Descripción"
                sx={{ mt: 2 }}
                {...formik.getFieldProps('descripcion')}
                disabled={isLoading}
              />
            </Box>

            {/* --- Tipo de Inversión y Moneda --- */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                fullWidth
                select
                id="tipo_inversion"
                label="Tipo de Inversión"
                {...formik.getFieldProps('tipo_inversion')}
                disabled={isLoading}
                sx={{ flex: 1 }}
              >
                <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
                <MenuItem value="directo">Inversión (Directo)</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                id="moneda"
                label="Moneda"
                {...formik.getFieldProps('moneda')}
                disabled={isLoading || formik.values.tipo_inversion === 'mensual' || formik.values.tipo_inversion === 'directo'}
                sx={{ flex: 1 }}
              >
                <MenuItem value="ARS">ARS (Pesos)</MenuItem>
                <MenuItem value="USD">USD (Dólares)</MenuItem>
              </TextField>
            </Box>

            {/* --- Monto y Plazos --- */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Montos y Plazos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  id="monto_inversion"
                  label={formik.values.tipo_inversion === 'mensual' ? "Monto Base (Cuota)" : "Monto Inversión (Total)"}
                  type="number"
                  {...formik.getFieldProps('monto_inversion')}
                  error={formik.touched.monto_inversion && Boolean(formik.errors.monto_inversion)}
                  helperText={formik.touched.monto_inversion && formik.errors.monto_inversion}
                  disabled={isLoading}
                  required
                />
                <TextField
                  fullWidth
                  id="fecha_inicio"
                  label="Fecha de Inicio"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_inicio')}
                  error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                  helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio}
                  disabled={isLoading}
                  required
                />
                <TextField
                  fullWidth
                  id="fecha_cierre"
                  label="Fecha de Cierre"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...formik.getFieldProps('fecha_cierre')}
                  error={formik.touched.fecha_cierre && Boolean(formik.errors.fecha_cierre)}
                  helperText={formik.touched.fecha_cierre && formik.errors.fecha_cierre}
                  disabled={isLoading}
                  required
                />
              </Box>
            </Box>

            {/* --- CAMPOS CONDICIONALES PARA 'MENSUAL' --- */}
            {formik.values.tipo_inversion === 'mensual' && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                  Configuración de Ahorro (Mensual)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    id="plazo_inversion"
                    label="Plazo (Total Cuotas)"
                    type="number"
                    {...formik.getFieldProps('plazo_inversion')}
                    error={formik.touched.plazo_inversion && Boolean(formik.errors.plazo_inversion)}
                    helperText={formik.touched.plazo_inversion && formik.errors.plazo_inversion}
                    disabled={isLoading}
                    required
                  />
                  <TextField
                    fullWidth
                    id="obj_suscripciones"
                    label="Objetivo Suscripciones"
                    type="number"
                    {...formik.getFieldProps('obj_suscripciones')}
                    error={formik.touched.obj_suscripciones && Boolean(formik.errors.obj_suscripciones)}
                    helperText={formik.touched.obj_suscripciones && formik.errors.obj_suscripciones}
                    disabled={isLoading}
                    required
                  />
                  <TextField
                    fullWidth
                    id="suscripciones_minimas"
                    label="Suscripciones Mínimas"
                    type="number"
                    {...formik.getFieldProps('suscripciones_minimas')}
                    error={formik.touched.suscripciones_minimas && Boolean(formik.errors.suscripciones_minimas)}
                    helperText={formik.touched.suscripciones_minimas && formik.errors.suscripciones_minimas}
                    disabled={isLoading}
                  />
                </Box>
              </Box>
            )}

            {/* --- Campos Opcionales (Lotes, Jurídico, Geo) --- */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Detalles Adicionales
              </Typography>
              <TextField
                fullWidth
                id="forma_juridica"
                label="Forma Jurídica (ej. Fideicomiso)"
                {...formik.getFieldProps('forma_juridica')}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  id="latitud"
                  label="Latitud (Opcional)"
                  type="number"
                  {...formik.getFieldProps('latitud')}
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="longitud"
                  label="Longitud (Opcional)"
                  type="number"
                  {...formik.getFieldProps('longitud')}
                  disabled={isLoading}
                />
              </Box>
              
              <Autocomplete
                multiple
                id="lotesIds"
                options={lotesDisponibles}
                getOptionLabel={(option) => `(ID: ${option.id}) ${option.nombre_lote}`}
                value={lotesDisponibles.filter(lote => formik.values.lotesIds?.includes(lote.id))}
                onChange={(_, newValue) => {
                  formik.setFieldValue('lotesIds', newValue.map(lote => lote.id));
                }}
                loading={isLoadingLotes}
                disabled={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asignar Lotes Disponibles (Opcional)"
                    placeholder="Buscar lotes..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingLotes ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox style={{ marginRight: 8 }} checked={selected} />
                    {option.nombre_lote} (ID: {option.id})
                  </li>
                )}
              />
              {lotesDisponibles.length === 0 && !isLoadingLotes && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No hay lotes disponibles sin asignar. Debes crear lotes primero.
                </Alert>
              )}
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
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {isLoading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProyectoModal;
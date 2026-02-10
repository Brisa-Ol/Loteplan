import { Edit as EditIcon, Inventory as InventoryIcon, Link as LinkIcon, LocationOn, Save as SaveIcon } from '@mui/icons-material';
import { Alert, alpha, Box, Divider, InputAdornment, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useFormik } from 'formik';
import React, { useEffect } from 'react';
import * as Yup from 'yup';
import ProyectoService from '../../../../../core/api/services/proyecto.service';
import type { LoteDto, UpdateLoteDto } from '../../../../../core/types/dto/lote.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLoteDto) => Promise<void>;
  lote: LoteDto | null;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  id_proyecto: Yup.mixed().nullable(),
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
});

const EditLoteModal: React.FC<EditLoteModalProps> = ({ open, onClose, onSubmit, lote, isLoading = false }) => {
  const theme = useTheme();

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const formik = useFormik<any>({
    initialValues: {
      nombre_lote: '',
      precio_base: '', // Para edición también usamos string vacío inicial si es necesario
      id_proyecto: null,
      latitud: 0,
      longitud: 0
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!lote) return;

      const payload: UpdateLoteDto = {
        nombre_lote: values.nombre_lote,
        precio_base: String(values.precio_base),
        id_proyecto: values.id_proyecto ? Number(values.id_proyecto) : null,
        latitud: values.latitud ? Number(values.latitud) : null,
        longitud: values.longitud ? Number(values.longitud) : null,
      };

      await onSubmit(lote.id, payload);
    },
  });

  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote || '',
        precio_base: lote.precio_base, // Cargamos el precio existente
        id_proyecto: lote.id_proyecto,
        latitud: lote.latitud,
        longitud: lote.longitud,
      });
      formik.setErrors({});
      formik.setTouched({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lote, open]);

  if (!lote) return null;

  const subastaActiva = lote.estado_subasta === 'activa';
  const sectionTitleSx = { textTransform: 'uppercase', fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 };

  const formatPreview = (val: any) => {
    if (!val || isNaN(Number(val))) return '';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(val));
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Editar Lote #${lote.id}`}
      subtitle="Modifique la información básica, precio y ubicación."
      icon={<EditIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Guardar Cambios"
      confirmButtonIcon={<SaveIcon />}
      maxWidth="md"
    >
      <Stack spacing={3}>

        {/* SECCIÓN 1: INFO BÁSICA Y PRECIO (Stack Responsive) */}
        <Box>
          <Typography sx={sectionTitleSx}><InventoryIcon fontSize="inherit" /> INFORMACIÓN PRINCIPAL</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <TextField
              fullWidth label="Nombre del Lote"
              {...formik.getFieldProps('nombre_lote')}
              error={formik.touched.nombre_lote && !!formik.errors.nombre_lote}
              helperText={formik.touched.nombre_lote && (formik.errors.nombre_lote as string)}
            />
            <TextField
              fullWidth label="Precio Base" type="number"
              {...formik.getFieldProps('precio_base')}
              disabled={subastaActiva} // Bloqueado si está en subasta
              error={formik.touched.precio_base && !!formik.errors.precio_base}
              helperText={
                (formik.touched.precio_base && formik.errors.precio_base)
                  ? (formik.errors.precio_base as string)
                  : formik.values.precio_base ? `Actual: ${formatPreview(formik.values.precio_base)}` : ""
              }
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Stack>
          {subastaActiva && <Alert severity="warning" sx={{ mt: 1, py: 0 }}>El precio no se puede editar durante una subasta activa.</Alert>}
        </Box>

        <Divider />

        {/* SECCIÓN 2: ASOCIACIÓN */}
        <Box>
          <Typography sx={sectionTitleSx}><LinkIcon fontSize="inherit" /> ASOCIACIÓN</Typography>
          <TextField
            select fullWidth label="Proyecto Asociado"
            name="id_proyecto"
            value={formik.values.id_proyecto ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={lote.estado_subasta !== 'pendiente'}
            error={formik.touched.id_proyecto && !!formik.errors.id_proyecto}
            SelectProps={{
              MenuProps: { PaperProps: { sx: { maxHeight: 300, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.primary.main, 0.2), borderRadius: '4px' } } } }
            }}
          >
            <MenuItem value=""><em>Sin Asignar (General)</em></MenuItem>
            {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
          </TextField>
        </Box>

        {/* SECCIÓN 3: UBICACIÓN */}
        <Box>
          <Typography sx={sectionTitleSx}><LocationOn fontSize="inherit" /> COORDENADAS GEOGRÁFICAS</Typography>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth label="Latitud" type="number" {...formik.getFieldProps('latitud')} value={formik.values.latitud ?? ''} InputLabelProps={{ shrink: true }} inputProps={{ step: "any" }} />
            <TextField fullWidth label="Longitud" type="number" {...formik.getFieldProps('longitud')} value={formik.values.longitud ?? ''} InputLabelProps={{ shrink: true }} inputProps={{ step: "any" }} />
          </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default EditLoteModal;
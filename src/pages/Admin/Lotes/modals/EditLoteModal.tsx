// src/pages/Admin/Inventario/modals/EditLoteModal.tsx

import React, { useEffect } from 'react';
import {
  TextField, Stack, Box, Typography, MenuItem, Alert, Divider, Chip, useTheme, alpha
} from '@mui/material';
import { 
    Save as SaveIcon, 
    Edit as EditIcon,
    Inventory as InventoryIcon,
    Link as LinkIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import ProyectoService from '../../../../Services/proyecto.service';

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
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(),
  id_proyecto: Yup.mixed().nullable(),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'activa': return 'success';
    case 'finalizada': return 'info';
    case 'pendiente': return 'warning';
    default: return 'primary';
  }
};

const EditLoteModal: React.FC<EditLoteModalProps> = ({
  open, onClose, onSubmit, lote, isLoading = false,
}) => {
  const theme = useTheme();

  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<UpdateLoteDto>({
    initialValues: {
      nombre_lote: '', precio_base: 0, fecha_inicio: '', fecha_fin: '',
      id_proyecto: null, latitud: undefined, longitud: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!lote) return;
      const rawId = values.id_proyecto as unknown;
      const dataToSend: UpdateLoteDto = {
        ...values,
        fecha_inicio: values.fecha_inicio || undefined,
        fecha_fin: values.fecha_fin || undefined,
        id_proyecto: (rawId === '' || rawId === null) ? null : Number(rawId),
        latitud: values.latitud ?? null,
        longitud: values.longitud ?? null
      };
      try {
        await onSubmit(lote.id, dataToSend);
      } catch (error) {
        console.error('Error al editar lote:', error);
      }
    },
    enableReinitialize: false
  });

  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote,
        precio_base: Number(lote.precio_base),
        fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().slice(0, 16) : '',
        fecha_fin: lote.fecha_fin ? new Date(lote.fecha_fin).toISOString().slice(0, 16) : '',
        id_proyecto: lote.id_proyecto,
        latitud: lote.latitud,
        longitud: lote.longitud,
      });
    }
  }, [lote, open]);

  if (!lote) return null;

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, 
      color: 'text.secondary', fontSize: '0.7rem', mb: 1.5,
      display: 'flex', alignItems: 'center', gap: 1
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Editar Lote #${lote.id}`}
      subtitle="Modifique la información del lote existente"
      icon={<EditIcon />}
      headerColor="primary"
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Guardar Cambios"
      confirmButtonIcon={<SaveIcon />}
      disableConfirm={!formik.isValid || isLoading}
      maxWidth="md"
      headerExtra={
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={lote.estado_subasta.toUpperCase()}
            size="small"
            color={getStatusColor(lote.estado_subasta) as any}
            sx={{ fontWeight: 800, borderRadius: 1.5 }}
          />
          {lote.id_ganador && (
            <Chip 
                label={`Ganador: #${lote.id_ganador}`}
                size="small"
                variant="outlined"
                color="success"
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
          )}
        </Stack>
      }
    >
      <Stack spacing={3.5}>
        {/* Info Básica */}
        <Box>
          <Typography sx={sectionTitleSx}><InventoryIcon fontSize="inherit"/> Información Básica</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth label="Nombre del Lote"
              {...formik.getFieldProps('nombre_lote')}
              error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)}
              helperText={formik.touched.nombre_lote && formik.errors.nombre_lote}
              disabled={isLoading} sx={commonInputSx}
            />
            <TextField
              fullWidth type="number" label="Precio Base"
              {...formik.getFieldProps('precio_base')}
              disabled={isLoading || lote.estado_subasta === 'activa'}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 700 }}>$</Typography> }}
              sx={commonInputSx}
            />
          </Stack>
          {lote.estado_subasta === 'activa' && (
            <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
              No se puede modificar el precio base de una subasta activa.
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Proyecto */}
        <Box>
          <Typography sx={sectionTitleSx}><LinkIcon fontSize="inherit"/> Asociación</Typography>
          <Stack spacing={1.5}>
            <TextField
              select fullWidth label="Proyecto Asociado"
              {...formik.getFieldProps('id_proyecto')}
              value={formik.values.id_proyecto ?? ''}
              disabled={isLoading || isLoadingProyectos || lote.estado_subasta !== 'pendiente'}
              sx={commonInputSx}
            >
              <MenuItem value=""><em>Sin Asignar (Huérfano)</em></MenuItem>
              {proyectos.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
              ))}
            </TextField>
            {lote.estado_subasta !== 'pendiente' && (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                Solo se puede cambiar el proyecto de lotes en estado "pendiente".
              </Alert>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Fechas */}
        <Box>
          <Typography sx={sectionTitleSx}><TimeIcon fontSize="inherit"/> Tiempos de Subasta</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth type="datetime-local" label="Fecha de Inicio"
              InputLabelProps={{ shrink: true }}
              {...formik.getFieldProps('fecha_inicio')}
              disabled={isLoading || lote.estado_subasta !== 'pendiente'}
              sx={commonInputSx}
            />
            <TextField
              fullWidth type="datetime-local" label="Fecha de Fin"
              InputLabelProps={{ shrink: true }}
              {...formik.getFieldProps('fecha_fin')}
              disabled={isLoading || lote.estado_subasta === 'finalizada'}
              sx={commonInputSx}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Ubicación */}
        <Box>
          <Typography sx={sectionTitleSx}><LocationIcon fontSize="inherit"/> Ubicación Geográfica</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth type="number" label="Latitud"
              {...formik.getFieldProps('latitud')}
              disabled={isLoading}
              inputProps={{ step: 'any' }}
              sx={commonInputSx}
            />
            <TextField
              fullWidth type="number" label="Longitud"
              {...formik.getFieldProps('longitud')}
              disabled={isLoading}
              inputProps={{ step: 'any' }}
              sx={commonInputSx}
            />
          </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default EditLoteModal;
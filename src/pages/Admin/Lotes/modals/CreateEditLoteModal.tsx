// src/pages/Admin/Inventario/modals/CreateEditLoteModal.tsx

import React, { useEffect, useState } from 'react';
import {
  TextField, Stack, Box, Typography, MenuItem, Alert, Divider, Chip, useTheme, alpha
} from '@mui/material';
import { 
    Save as SaveIcon, 
    Edit as EditIcon,
    Inventory as InventoryIcon,
    Link as LinkIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import ProyectoService from '../../../../Services/proyecto.service';
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';

interface CreateEditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDto | UpdateLoteDto, id?: number, files?: File[]) => Promise<void>;
  loteToEdit?: LoteDto | null;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('El nombre es requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('El precio base es requerido'),
  id_proyecto: Yup.mixed().nullable(),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(), 
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

const CreateEditLoteModal: React.FC<CreateEditLoteModalProps> = ({
  open, onClose, onSubmit, loteToEdit, isLoading = false,
}) => {
  const theme = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const esEdicion = !!loteToEdit;

  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<CreateLoteDto>({
    initialValues: {
      nombre_lote: '', precio_base: 0, id_proyecto: null,
      fecha_inicio: '', fecha_fin: '', latitud: null, longitud: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      const rawId = values.id_proyecto as unknown;
      const idProyectoLimpio = (rawId === '' || rawId === null) ? null : Number(rawId);

      const payload: CreateLoteDto | UpdateLoteDto = {
        nombre_lote: values.nombre_lote,
        precio_base: Number(values.precio_base),
        id_proyecto: idProyectoLimpio,
        ...(values.fecha_inicio && { fecha_inicio: values.fecha_inicio }),
        ...(values.fecha_fin && { fecha_fin: values.fecha_fin }),
        ...(values.latitud !== null && values.latitud !== 0 && { latitud: values.latitud }),
        ...(values.longitud !== null && values.longitud !== 0 && { longitud: values.longitud }),
      };
      await onSubmit(payload, loteToEdit?.id, files);
    },
  });

  useEffect(() => {
    if (open) {
      if (loteToEdit) {
        formik.setValues({
           nombre_lote: loteToEdit.nombre_lote,
           precio_base: Number(loteToEdit.precio_base),
           id_proyecto: loteToEdit.id_proyecto,
           fecha_inicio: loteToEdit.fecha_inicio ? new Date(loteToEdit.fecha_inicio).toISOString().slice(0, 16) : '',
           fecha_fin: loteToEdit.fecha_fin ? new Date(loteToEdit.fecha_fin).toISOString().slice(0, 16) : '',
           latitud: loteToEdit.latitud || null,
           longitud: loteToEdit.longitud || null,
        });
      } else {
        formik.resetForm();
      }
      setFiles([]);
    }
  }, [open, loteToEdit]);

  const subastaActiva = loteToEdit?.estado_subasta === 'activa';
  const subastaFinalizada = loteToEdit?.estado_subasta === 'finalizada';
  const puedeEditarPrecios = !subastaActiva && !subastaFinalizada;
  const puedeEditarProyecto = !esEdicion || loteToEdit?.estado_subasta === 'pendiente';

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
      title={esEdicion ? `Editar Lote #${loteToEdit.id}` : 'Crear Nuevo Lote'}
      subtitle={esEdicion ? 'Modifique la información del lote' : 'Complete los datos para registrar un lote'}
      icon={esEdicion ? <EditIcon /> : <InventoryIcon />}
      headerColor="primary"
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText={esEdicion ? 'Guardar Cambios' : 'Crear Lote'}
      confirmButtonIcon={esEdicion ? <EditIcon /> : <SaveIcon />}
      disableConfirm={!formik.isValid || isLoading}
      maxWidth="md"
      headerExtra={esEdicion && (
        <Chip
          label={loteToEdit.estado_subasta.toUpperCase()}
          size="small"
          color={getStatusColor(loteToEdit.estado_subasta) as any}
          sx={{ fontWeight: 800, borderRadius: 1.5 }}
        />
      )}
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
              disabled={isLoading || !puedeEditarPrecios}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 700 }}>$</Typography> }}
              sx={commonInputSx}
            />
          </Stack>
          {subastaActiva && (
            <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
              No se puede modificar el precio base de una subasta activa.
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Proyecto */}
        <Box>
          <Typography sx={sectionTitleSx}><LinkIcon fontSize="inherit"/> Asociación de Proyecto</Typography>
          <TextField
            select fullWidth label="Proyecto Asociado"
            {...formik.getFieldProps('id_proyecto')}
            value={formik.values.id_proyecto ?? ''}
            disabled={isLoading || loadingProyectos || !puedeEditarProyecto}
            sx={commonInputSx}
          >
            <MenuItem value=""><em>Sin Asignar (Huérfano)</em></MenuItem>
            {proyectos.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
          </TextField>
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
              disabled={isLoading || subastaActiva}
              sx={commonInputSx}
            />
            <TextField
              fullWidth type="datetime-local" label="Fecha de Fin"
              InputLabelProps={{ shrink: true }}
              {...formik.getFieldProps('fecha_fin')}
              disabled={isLoading || subastaFinalizada}
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

        {/* Imágenes Iniciales */}
        {!esEdicion && (
          <>
            <Divider />
            <Box>
              <Typography sx={sectionTitleSx}><ImageIcon fontSize="inherit"/> Imágenes del Lote</Typography>
              <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                Suba las imágenes iniciales. Podrá gestionarlas detalladamente después desde el listado.
              </Alert>
              <ImageUploadZone 
                images={files} 
                onChange={setFiles} 
                maxFiles={5} 
                disabled={isLoading} 
              />
            </Box>
          </>
        )}
      </Stack>
    </BaseModal>
  );
};

export default CreateEditLoteModal;
// src/pages/Admin/Inventario/modals/CreateLoteModal.tsx

import React from 'react';
import { TextField, Stack, Box, Typography, MenuItem, Alert } from '@mui/material';
import { Add as AddIcon, Inventory as InventoryIcon, Link as LinkIcon, LocationOn, Info } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { CreateLoteDto } from '../../../../types/dto/lote.dto';
import ProyectoService from '../../../../services/proyecto.service';

interface CreateLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDto, files: File[]) => Promise<void>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  latitud: Yup.number().nullable(),
  longitud: Yup.number().nullable(),
});

const CreateLoteModal: React.FC<CreateLoteModalProps> = ({ open, onClose, onSubmit, isLoading = false }) => {
  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik({
    initialValues: { 
      nombre_lote: '', 
      precio_base: 0, 
      id_proyecto: '', 
      latitud: '', 
      longitud: '' 
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const payload: CreateLoteDto = {
        ...values,
        id_proyecto: values.id_proyecto ? Number(values.id_proyecto) : null,
        precio_base: Number(values.precio_base),
        latitud: values.latitud ? Number(values.latitud) : null,
        longitud: values.longitud ? Number(values.longitud) : null,
      };
      await onSubmit(payload, []); // Sin archivos en creación
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const sectionTitleSx = { 
    textTransform: 'uppercase', 
    fontWeight: 800, 
    color: 'text.secondary', 
    fontSize: '0.7rem', 
    mb: 1.5, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1 
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Crear Nuevo Lote"
      subtitle="Complete los datos básicos del lote. Las imágenes se agregan después."
      icon={<AddIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Crear Lote"
      maxWidth="md"
    >
      <Stack spacing={3}>
        {/* Información sobre imágenes */}
        <Alert severity="info" icon={<Info />}>
          Las imágenes se pueden agregar después de crear el lote usando el botón "Gestionar Imágenes"
        </Alert>

        {/* Información Básica */}
        <Box>
          <Typography sx={sectionTitleSx}>
            <InventoryIcon fontSize="inherit"/> INFORMACIÓN BÁSICA
          </Typography>
          <Stack spacing={2}>
            <TextField 
              fullWidth 
              label="Nombre del Lote" 
              {...formik.getFieldProps('nombre_lote')} 
              error={formik.touched.nombre_lote && !!formik.errors.nombre_lote}
              helperText={formik.touched.nombre_lote && formik.errors.nombre_lote}
            />
            <TextField 
              fullWidth 
              type="number" 
              label="Precio Base" 
              {...formik.getFieldProps('precio_base')}
              error={formik.touched.precio_base && !!formik.errors.precio_base}
              helperText={formik.touched.precio_base && formik.errors.precio_base}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Stack>
        </Box>

        {/* Asociación a Proyecto */}
        <Box>
          <Typography sx={sectionTitleSx}>
            <LinkIcon fontSize="inherit"/> ASOCIACIÓN A PROYECTO
          </Typography>
          <TextField 
            select 
            fullWidth 
            label="Proyecto Asociado (Opcional)" 
            {...formik.getFieldProps('id_proyecto')}
            helperText="Deje en blanco para crear un lote huérfano (sin proyecto)"
          >
            <MenuItem value="">
              <em>Sin Asignar (Lote Huérfano)</em>
            </MenuItem>
            {proyectos.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Ubicación Geográfica */}
        <Box>
          <Typography sx={sectionTitleSx}>
            <LocationOn fontSize="inherit"/> UBICACIÓN GEOGRÁFICA (OPCIONAL)
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField 
              fullWidth 
              type="number" 
              label="Latitud" 
              {...formik.getFieldProps('latitud')}
              placeholder="-32.8895"
              inputProps={{ step: "any" }}
            />
            <TextField 
              fullWidth 
              type="number" 
              label="Longitud" 
              {...formik.getFieldProps('longitud')}
              placeholder="-68.8458"
              inputProps={{ step: "any" }}
            />
          </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default CreateLoteModal;
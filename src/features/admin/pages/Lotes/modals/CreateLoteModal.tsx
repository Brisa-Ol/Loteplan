import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  MonetizationOn as MonetizationIcon,
  LocationOn
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';

import type { CreateLoteDto } from '../../../../../core/types/dto/lote.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface CreateLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDto) => Promise<void>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  precio_base: Yup.number().min(1, 'Debe ser mayor a 0').required('Requerido'),
  fecha_inicio: Yup.date().nullable(),
  fecha_fin: Yup.date().nullable()
    .when('fecha_inicio', {
        is: (val: any) => val != null,
        then: (schema) => schema.min(Yup.ref('fecha_inicio'), 'La finalización debe ser posterior al inicio')
    }),
});

const CreateLoteModal: React.FC<CreateLoteModalProps> = ({ 
  open, onClose, onSubmit, isLoading = false 
}) => {
  
  const formik = useFormik<any>({
    initialValues: {
      nombre_lote: '',
      precio_base: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      latitud: '',
      longitud: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const dataToSubmit: any = { ...values, precio_base: String(values.precio_base) };

      if (values.latitud && values.longitud) {
        dataToSubmit.latitud = Number(values.latitud);
        dataToSubmit.longitud = Number(values.longitud);
      } else {
        delete dataToSubmit.latitud;
        delete dataToSubmit.longitud;
      }

      if (!values.fecha_inicio) delete dataToSubmit.fecha_inicio;
      if (!values.fecha_fin) delete dataToSubmit.fecha_fin;
      
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === '' || dataToSubmit[key] === undefined) delete dataToSubmit[key];
      });

      await onSubmit(dataToSubmit); 
      formik.resetForm();
      onClose();
    },
  });

  const sectionTitleSx = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' };

  const formatPreview = (val: any) => {
      if (!val || isNaN(Number(val))) return '';
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(val));
  };

  return (
    <BaseModal
      open={open}
      onClose={() => { formik.resetForm(); onClose(); }}
      title="Nuevo Lote"
      subtitle="Complete los datos básicos para el inventario."
      icon={<AddIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Crear Lote"
      maxWidth="md"
    >
      <Stack spacing={3}>
        
        {/* 1. INFORMACIÓN GENERAL */}
        <Box>
          <Typography sx={sectionTitleSx}><DescriptionIcon fontSize="inherit" /> Información General</Typography>
          <Stack spacing={2}>
            <TextField 
                fullWidth label="Nombre del Lote" placeholder="Ej: Lote 45 - Sector Norte"
                {...formik.getFieldProps('nombre_lote')} 
                error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)} 
                helperText={formik.touched.nombre_lote && (formik.errors.nombre_lote as string)} 
            />
            <TextField fullWidth multiline rows={2} label="Descripción (Opcional)" {...formik.getFieldProps('descripcion')} />
          </Stack>
        </Box>

        <Divider />

        {/* 2. VALOR Y UBICACIÓN (REFACTORIZADO CON STACK) */}
        {/* Stack en row para pantallas md+, column para móviles. Gap de 3 para separación. */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            
            {/* Columna Izquierda: Precio */}
            <Box flex={1}>
                <Typography sx={sectionTitleSx}><MonetizationIcon fontSize="inherit" /> Valor Base</Typography>
                <TextField 
                    fullWidth 
                    label="Precio Base" 
                    type="number" 
                    {...formik.getFieldProps('precio_base')} 
                    error={formik.touched.precio_base && Boolean(formik.errors.precio_base)}
                    helperText={
                        (formik.touched.precio_base && formik.errors.precio_base) 
                        ? (formik.errors.precio_base as string)
                        : formik.values.precio_base ? `Vista previa: ${formatPreview(formik.values.precio_base)}` : "Ingrese el monto sin puntos"
                    }
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
            </Box>
            
            {/* Columna Derecha: Coordenadas */}
            <Box flex={1}>
                <Typography sx={sectionTitleSx}><LocationOn fontSize="inherit" /> Coordenadas (Opcional)</Typography>
                <Stack direction="row" spacing={2}>
                    <TextField 
                        fullWidth label="Latitud" type="number" size="small" placeholder="-32.xxx"
                        inputProps={{ step: "any" }}
                        {...formik.getFieldProps('latitud')} 
                    />
                    <TextField 
                        fullWidth label="Longitud" type="number" size="small" placeholder="-68.xxx"
                        inputProps={{ step: "any" }}
                        {...formik.getFieldProps('longitud')} 
                    />
                </Stack>
            </Box>
        </Stack>

        <Divider />

        {/* 3. CRONOGRAMA */}
        <Box>
          <Typography sx={sectionTitleSx}><CalendarIcon fontSize="inherit" /> Planificación de Subasta (Opcional)</Typography>
          <Alert severity="info" sx={{ mb: 2, py: 0, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>
             Si omite las fechas, el lote quedará en estado <strong>Pendiente</strong> y podrá iniciarlo manualmente luego.
          </Alert>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField 
              fullWidth type="datetime-local" label="Inicio Previsto" InputLabelProps={{ shrink: true }} 
              {...formik.getFieldProps('fecha_inicio')} 
              error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)} 
              helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
            />
            <TextField 
              fullWidth type="datetime-local" label="Cierre Previsto" InputLabelProps={{ shrink: true }} 
              {...formik.getFieldProps('fecha_fin')} 
              error={formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin)} 
              helperText={formik.touched.fecha_fin && (formik.errors.fecha_fin as string)}
            />
          </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default CreateLoteModal;
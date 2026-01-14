import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import React from 'react';
import * as Yup from 'yup';
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
        then: (schema) => schema.min(Yup.ref('fecha_inicio'), 'Debe ser posterior al inicio')
    }),
});

const CreateLoteModal: React.FC<CreateLoteModalProps> = ({ 
  open, onClose, onSubmit, isLoading = false 
}) => {
 

  // ✅ CORRECCIÓN 1: Tipamos useFormik con <Partial<CreateLoteDto>> o <any> pero casteamos abajo
  // Usamos 'any' en el generic para flexibilidad con los campos de fecha vacíos, 
  // pero castearemos los errores en el render.
  const formik = useFormik<any>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      latitud: '',
      longitud: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const dataToSubmit: any = {
        ...values,
        precio_base: Number(values.precio_base),
      };

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

  return (
    <BaseModal
      open={open}
      onClose={() => { formik.resetForm(); onClose(); }}
      title="Nuevo Lote"
      subtitle="Complete los datos básicos. La subasta se puede configurar después."
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
                fullWidth label="Nombre del Lote" 
                {...formik.getFieldProps('nombre_lote')} 
                error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)} 
                // ✅ CORRECCIÓN 2: Casteo explícito a string
                helperText={formik.touched.nombre_lote && (formik.errors.nombre_lote as string)} 
            />
            <TextField 
                fullWidth multiline rows={2} label="Descripción (Opcional)" 
                {...formik.getFieldProps('descripcion')} 
            />
          </Stack>
        </Box>

        <Divider />

        {/* 2. VALOR Y SUBASTA */}
        <Box>
          <Typography sx={sectionTitleSx}><MonetizationIcon fontSize="inherit" /> Valor Base</Typography>
          <TextField 
              fullWidth 
              label="Precio Base" 
              type="number" 
              {...formik.getFieldProps('precio_base')} 
              error={formik.touched.precio_base && Boolean(formik.errors.precio_base)}
              // ✅ CORRECCIÓN 2: Casteo explícito a string
              helperText={formik.touched.precio_base && (formik.errors.precio_base as string)}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
            />
        </Box>

        <Divider />

        {/* 3. CRONOGRAMA Y UBICACIÓN (OPCIONALES) */}
        <Box>
          <Typography sx={sectionTitleSx}><CalendarIcon fontSize="inherit" /> Cronograma y Ubicación (Opcional)</Typography>
          <Alert severity="info" sx={{ mb: 2, py: 0 }}>
             Puede dejar las fechas en blanco si la subasta iniciará manualmente luego.
          </Alert>
          
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField 
                fullWidth type="date" label="Inicio Subasta" InputLabelProps={{ shrink: true }} 
                {...formik.getFieldProps('fecha_inicio')} 
                error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)} 
                // ✅ CORRECCIÓN 2: Casteo explícito a string
                helperText={formik.touched.fecha_inicio && (formik.errors.fecha_inicio as string)}
              />
              <TextField 
                fullWidth type="date" label="Fin Subasta" InputLabelProps={{ shrink: true }} 
                {...formik.getFieldProps('fecha_fin')} 
                error={formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin)} 
                // ✅ CORRECCIÓN 2: Casteo explícito a string
                helperText={formik.touched.fecha_fin && (formik.errors.fecha_fin as string)}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Latitud" type="number" inputProps={{ step: "any" }} {...formik.getFieldProps('latitud')} placeholder="-32.8894" />
              <TextField fullWidth label="Longitud" type="number" inputProps={{ step: "any" }} {...formik.getFieldProps('longitud')} placeholder="-68.8458" />
            </Stack>
          </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default CreateLoteModal;
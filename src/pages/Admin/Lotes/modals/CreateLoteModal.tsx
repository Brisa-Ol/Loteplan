// src/components/Admin/Proyectos/Components/modals/CreateProyectoModal.tsx

import React, { useEffect } from 'react';
import {
  TextField, MenuItem, Stack, Box, Typography,
  Divider, Alert, Paper, useTheme, alpha
} from '@mui/material';
import { 
  Add as AddIcon, 
  Description as DescriptionIcon,
  MonetizationOn as MonetizationIcon,
  CalendarMonth as CalendarIcon,
  Savings as SavingsIcon,
  LocationOn as LocationIcon,
  Info
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { CreateProyectoDto } from '../../../../types/dto/proyecto.dto';
import BaseModal from '../../../../components/common/BaseModal/BaseModal';

interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProyectoDto) => Promise<void>;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_proyecto: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
  tipo_inversion: Yup.string().oneOf(['directo', 'mensual']).required('Requerido'),
  monto_inversion: Yup.number().min(1, 'Debe ser mayor a 0').required('Requerido'),
  fecha_inicio: Yup.date().required('Requerido'),
  fecha_cierre: Yup.date().required('Requerido').min(Yup.ref('fecha_inicio'), 'Debe ser posterior al inicio'),
});

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, onClose, onSubmit, isLoading = false 
}) => {
  const theme = useTheme();

  const formik = useFormik<CreateProyectoDto>({
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
    },
    validationSchema,
    onSubmit: async (values) => {
      // 🚩 ADAPTACIÓN ESTRICTA PARA EL BACKEND (JSON)
      // El backend requiere 'lotesIds' y que los números sean tipos Number reales
      const dataToSubmit: any = {
        ...values,
        monto_inversion: Number(values.monto_inversion),
        lotesIds: [], // ✅ Evita el error 400 de destructuring en el back
      };

      // Validación de coordenadas para el back: si envías una, debes enviar la otra
      if (values.latitud && values.longitud) {
        dataToSubmit.latitud = Number(values.latitud);
        dataToSubmit.longitud = Number(values.longitud);
      } else {
        delete dataToSubmit.latitud;
        delete dataToSubmit.longitud;
      }

      if (values.tipo_inversion === 'mensual') {
        dataToSubmit.obj_suscripciones = Number(values.obj_suscripciones);
        dataToSubmit.plazo_inversion = Number(values.plazo_inversion);
        dataToSubmit.suscripciones_minimas = Number(values.suscripciones_minimas || 0);
      } else {
        dataToSubmit.obj_suscripciones = 0;
      }

      // Limpiar strings vacíos para que no viajen al servidor
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === '' || dataToSubmit[key] === undefined) delete dataToSubmit[key];
      });

      await onSubmit(dataToSubmit); 
      formik.resetForm();
      onClose();
    },
  });

  useEffect(() => {
    formik.setFieldValue('moneda', formik.values.tipo_inversion === 'mensual' ? 'ARS' : 'USD');
  }, [formik.values.tipo_inversion]);

  const sectionTitleSx = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' };

  return (
    <BaseModal
      open={open}
      onClose={() => { formik.resetForm(); onClose(); }}
      title="Nuevo Proyecto"
      subtitle="Complete los datos básicos para crear la oportunidad."
      icon={<AddIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Crear Proyecto"
      maxWidth="md"
    >
      <Stack spacing={3}>
        <Alert severity="info" icon={<Info />}>
          Para evitar errores de conexión, las imágenes se gestionan desde la tabla una vez creado el proyecto.
        </Alert>

        {/* 1. INFORMACIÓN GENERAL */}
        <Box>
          <Typography sx={sectionTitleSx}><DescriptionIcon fontSize="inherit" /> Información General</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth label="Nombre del Proyecto" {...formik.getFieldProps('nombre_proyecto')} error={formik.touched.nombre_proyecto && !!formik.errors.nombre_proyecto} helperText={formik.touched.nombre_proyecto && formik.errors.nombre_proyecto} />
            <TextField fullWidth label="Forma Jurídica" {...formik.getFieldProps('forma_juridica')} />
          </Stack>
        </Box>

        <Divider />

        {/* 2. MODELO DE NEGOCIO */}
        <Box>
          <Typography sx={sectionTitleSx}><MonetizationIcon fontSize="inherit" /> Modelo de Inversión</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select fullWidth label="Tipo" {...formik.getFieldProps('tipo_inversion')}>
              <MenuItem value="mensual">Ahorro (Mensual - ARS)</MenuItem>
              <MenuItem value="directo">Inversión (Directo - USD)</MenuItem>
            </TextField>
            <TextField 
              fullWidth 
              label={formik.values.tipo_inversion === 'mensual' ? "Cuota Mensual" : "Monto Inversión"} 
              type="number" 
              {...formik.getFieldProps('monto_inversion')} 
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
            />
          </Stack>
        </Box>

        {/* 3. CONFIGURACIÓN MENSUAL */}
        {formik.values.tipo_inversion === 'mensual' && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderStyle: 'dashed' }}>
            <Typography sx={{ ...sectionTitleSx, color: 'primary.main' }}><SavingsIcon fontSize="inherit" /> Configuración de Ahorro</Typography>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" label="Objetivo Susc." type="number" {...formik.getFieldProps('obj_suscripciones')} />
              <TextField fullWidth size="small" label="Plazo (Meses)" type="number" {...formik.getFieldProps('plazo_inversion')} />
            </Stack>
          </Paper>
        )}

        <Divider />

        {/* 4. FECHAS Y UBICACIÓN */}
        <Box>
          <Typography sx={sectionTitleSx}><CalendarIcon fontSize="inherit" /> Cronograma y Ubicación</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth type="date" label="Apertura" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_inicio')} error={formik.touched.fecha_inicio && !!formik.errors.fecha_inicio} />
              <TextField fullWidth type="date" label="Cierre" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_cierre')} error={formik.touched.fecha_cierre && !!formik.errors.fecha_cierre} />
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

export default CreateProyectoModal;
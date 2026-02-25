import {
  Add as AddIcon, CalendarMonth as CalendarIcon,
  LocationOn, MonetizationOn as MonetizationIcon,
  Business as ProjectIcon
} from '@mui/icons-material';
import {
  Box, Chip, Divider, InputAdornment, MenuItem,
  Stack, TextField, Typography, alpha, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { FormikProvider, useFormik } from 'formik';
import React, { useCallback, useMemo } from 'react';
import * as Yup from 'yup';

import type { CreateLoteDto } from '@/core/types/dto/lote.dto';
import ProyectoService from '../../../../../core/api/services/proyecto.service';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';
import ImageUploadZone from '../../../../../shared/components/forms/upload/ImageUploadZone'; // 🚀 Asegúrate de esta ruta

// ============================================================================
// CONSTANTES DE ESTILO
// ============================================================================
const SECTION_TITLE_SX = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.7rem' };
const MENU_ITEM_SX = { fontSize: '0.85rem', py: 1, px: 2 };

// ============================================================================
// COMPONENTES INTERNOS MEMOIZADOS
// ============================================================================

const ProjectSection = React.memo(({ value, proyectos, isLoading, onChange, handleBlur }: any) => (
  <Box>
    <Typography sx={SECTION_TITLE_SX}><ProjectIcon fontSize="inherit" /> Proyecto Asociado</Typography>
    <TextField
      select fullWidth size="small" label="Elegir Proyecto"
      name="id_proyecto" value={value ?? ''} onChange={onChange} onBlur={handleBlur}
      disabled={isLoading}
      SelectProps={{
        MenuProps: {
          PaperProps: { sx: { maxHeight: 300, mt: 0.5, borderRadius: 2 } },
        }
      }}
    >
      <MenuItem value=""><em>Ninguno (Lote Huérfano)</em></MenuItem>
      {proyectos.map((p: any) => (
        <MenuItem key={p.id} value={p.id} sx={MENU_ITEM_SX}>
          <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
            <Typography variant="inherit" fontWeight={600}>{p.nombre_proyecto}</Typography>
            <Chip
              label={p.tipo_inversion === 'directo' ? 'DIRECTO' : 'MENSUAL'}
              size="small"
              sx={{
                height: 20, fontSize: '0.6rem', fontWeight: 900,
                bgcolor: p.tipo_inversion === 'directo' ? alpha('#0288d1', 0.1) : alpha('#ed6c02', 0.1),
                color: p.tipo_inversion === 'directo' ? '#0288d1' : '#ed6c02'
              }}
            />
          </Stack>
        </MenuItem>
      ))}
    </TextField>
  </Box>
));

const FinanceSection = React.memo(({ precio, lat, lng, touched, error, onChange, handleBlur }: any) => (
  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><MonetizationIcon fontSize="inherit" /> Valor Base</Typography>
      <TextField
        fullWidth type="number" name="precio_base" value={precio}
        onChange={onChange} onBlur={handleBlur}
        onKeyDown={(e) => (e.key === '-' || e.key === 'e' || e.key === '+') && e.preventDefault()}
        error={touched && Boolean(error)} helperText={touched && (error as string)}
        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
      />
    </Box>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><LocationOn fontSize="inherit" /> Ubicación GPS</Typography>
      <Stack direction="row" spacing={1}>
        <TextField fullWidth label="Latitud" size="small" name="latitud" value={lat} onChange={onChange} onBlur={handleBlur} />
        <TextField fullWidth label="Longitud" size="small" name="longitud" value={lng} onChange={onChange} onBlur={handleBlur} />
      </Stack>
    </Box>
  </Stack>
));

const ScheduleSection = React.memo(({ inicio, fin, touchedInicio, errorInicio, touchedFin, errorFin, onChange, handleBlur, minDate }: any) => {
  const handlePicker = (e: React.MouseEvent) => {
    const input = e.currentTarget.querySelector('input');
    if (input) input.showPicker();
  };
  return (
    <Box sx={{ bgcolor: alpha('#CC6333', 0.03), p: 2, borderRadius: 2, border: '1px solid rgba(204, 99, 51, 0.1)' }}>
      <Typography sx={SECTION_TITLE_SX}><CalendarIcon sx={{ color: '#CC6333' }} fontSize="inherit" /> Programación de Subasta</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth type="datetime-local" label="Apertura" InputLabelProps={{ shrink: true }}
          name="fecha_inicio" value={inicio} onChange={onChange} onBlur={handleBlur} onMouseDown={handlePicker}
          inputProps={{ min: minDate }} error={touchedInicio && Boolean(errorInicio)} helperText={touchedInicio && (errorInicio as string)}
        />
        <TextField
          fullWidth type="datetime-local" label="Cierre" InputLabelProps={{ shrink: true }}
          name="fecha_fin" value={fin} onChange={onChange} onBlur={handleBlur} onMouseDown={handlePicker}
          inputProps={{ min: inicio || minDate }} error={touchedFin && Boolean(errorFin)} helperText={touchedFin && (errorFin as string)}
        />
      </Stack>
    </Box>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface CreateLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoteDto, file: File | null) => Promise<void>;
  isLoading?: boolean;
}

const CreateLoteModal: React.FC<CreateLoteModalProps> = ({ open, onClose, onSubmit, isLoading = false }) => {
  const theme = useTheme();

  const validationSchema = useMemo(() => Yup.object({
    nombre_lote: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
    precio_base: Yup.number().typeError('Debe ser número').min(1, 'Mínimo 1').required('Requerido'),
    latitud: Yup.number().nullable().min(-90).max(90),
    longitud: Yup.number().nullable().min(-180).max(180),
    fecha_inicio: Yup.date().transform((v, o) => o === '' ? null : v).nullable().min(new Date(new Date().setHours(0, 0, 0, 0)), 'Pasado'),
    fecha_fin: Yup.date().transform((v, o) => o === '' ? null : v).nullable().when('fecha_inicio', {
      is: (val: any) => val instanceof Date,
      then: (schema) => schema.min(Yup.ref('fecha_inicio'), 'Posterior al inicio')
    }),
  }), []);

  const formik = useFormik({
    initialValues: {
      nombre_lote: '', precio_base: '', id_proyecto: '',
      fecha_inicio: '', fecha_fin: '', latitud: '', longitud: '',
      file: null as File | null
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      // 🚀 1. SANEAMIENTO PARA SEQUELIZE
      const dataToSubmit: any = {
        nombre_lote: values.nombre_lote,
        precio_base: values.precio_base.toString(),
        id_proyecto: values.id_proyecto === '' ? null : Number(values.id_proyecto),
      };

      // 🚀 2. REGLA "AMBAS O NINGUNA" PARA COORDENADAS
      if (values.latitud !== '' && values.longitud !== '' && values.latitud !== null) {
        dataToSubmit.latitud = Number(values.latitud);
        dataToSubmit.longitud = Number(values.longitud);
      }

      // 🚀 3. SANEAMIENTO DE FECHAS
      if (values.fecha_inicio) dataToSubmit.fecha_inicio = values.fecha_inicio;
      if (values.fecha_fin) dataToSubmit.fecha_fin = values.fecha_fin;

      await onSubmit(dataToSubmit as CreateLoteDto, values.file);
      handleModalClose();
    },
  });

  const handleModalClose = useCallback(() => {
    formik.resetForm();
    onClose();
  }, [onClose, formik]);

  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery({
    queryKey: ['proyectos-admin-list'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open
  });

  const nowForInput = useMemo(() => new Date().toISOString().slice(0, 16), [open]);

  return (
    <BaseModal
      open={open} onClose={handleModalClose} onConfirm={formik.submitForm}
      title="Nuevo Lote" icon={<AddIcon />} isLoading={isLoading}
      confirmText="Crear Lote" maxWidth="md"
    >
      <FormikProvider value={formik}>
        <Stack spacing={3}>

          <ProjectSection
            value={formik.values.id_proyecto} proyectos={proyectos}
            isLoading={isLoadingProyectos} onChange={formik.handleChange}
            handleBlur={formik.handleBlur}
          />

          <Divider />

          {/* SECCIÓN IDENTIFICACIÓN + FOTO */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box flex={1.5}>
              <Typography sx={SECTION_TITLE_SX}>Identificación</Typography>
              <TextField
                fullWidth label="Nombre del Lote" name="nombre_lote"
                value={formik.values.nombre_lote} onChange={formik.handleChange}
                onBlur={formik.handleBlur} error={formik.touched.nombre_lote && !!formik.errors.nombre_lote}
                helperText={formik.touched.nombre_lote && (formik.errors.nombre_lote as string)}
              />
            </Box>

            <Box flex={1}>
              <Typography sx={SECTION_TITLE_SX}>Imagen de Portada</Typography>
              <ImageUploadZone
                multiple={false}
                image={formik.values.file}
                onChange={(file) => formik.setFieldValue('file', file)}
                label="Foto principal"
              />
            </Box>
          </Stack>

          <Divider />

          <FinanceSection
            precio={formik.values.precio_base} lat={formik.values.latitud} lng={formik.values.longitud}
            touched={formik.touched.precio_base} error={formik.errors.precio_base}
            onChange={formik.handleChange} handleBlur={formik.handleBlur}
          />

          <ScheduleSection
            inicio={formik.values.fecha_inicio} fin={formik.values.fecha_fin}
            touchedInicio={formik.touched.fecha_inicio} errorInicio={formik.errors.fecha_inicio}
            touchedFin={formik.touched.fecha_fin} errorFin={formik.errors.fecha_fin}
            onChange={formik.handleChange} handleBlur={formik.handleBlur}
            minDate={nowForInput}
          />
        </Stack>
      </FormikProvider>
    </BaseModal>
  );
};

export default CreateLoteModal;
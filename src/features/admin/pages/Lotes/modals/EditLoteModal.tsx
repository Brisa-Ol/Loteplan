// src/features/admin/pages/Lotes/modals/EditLoteModal.tsx

import {
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  LocationOn,
  MonetizationOn as MonetizationIcon,
  Business as ProjectIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { FormikProvider, useFormik } from 'formik';
import React, { useEffect, useMemo } from 'react';
import * as Yup from 'yup';

import ProyectoService from '@/core/api/services/proyecto.service';
import type { LoteDto, UpdateLoteDto } from '@/core/types/lote.dto';
import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { BaseModal } from '@/shared';
;


// ============================================================================
// CONSTANTES Y ESTILOS (Memoizados)
// ============================================================================
const SECTION_TITLE_SX = {
  fontWeight: 800,
  color: 'text.secondary',
  textTransform: 'uppercase',
  mb: 1.5,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  fontSize: '0.65rem',
  letterSpacing: 1
};

// ============================================================================
// COMPONENTES INTERNOS
// ============================================================================

const ProjectSection = React.memo(({ value, proyectos, isLoading, onChange, onBlur, disabled }: any) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography sx={SECTION_TITLE_SX}><ProjectIcon fontSize="inherit" /> Proyecto Asociado</Typography>
      <TextField
        select fullWidth size="small" label="Cambiar Proyecto"
        name="id_proyecto" value={value ?? ''} onChange={onChange} onBlur={onBlur}
        disabled={isLoading || disabled}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        SelectProps={{
          MenuProps: {
            PaperProps: { sx: { maxHeight: 300, mt: 0.5, borderRadius: 2, boxShadow: theme.shadows[5] } },
          }
        }}
      >
        <MenuItem value=""><em>Ninguno (Lote Huérfano)</em></MenuItem>
        {proyectos.map((p: ProyectoDto) => (
          <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.85rem', py: 1 }}>
            <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
              <Typography variant="inherit" fontWeight={600}>{p.nombre_proyecto}</Typography>
              <Chip
                label={p.tipo_inversion === 'directo' ? 'DIRECTO' : 'MENSUAL'}
                size="small"
                sx={{
                  height: 18, fontSize: '0.6rem', fontWeight: 900,
                  bgcolor: p.tipo_inversion === 'directo' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                  color: p.tipo_inversion === 'directo' ? 'info.dark' : 'warning.dark'
                }}
              />
            </Stack>
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
});

const FinanceSection = React.memo(({ precio, lat, lng, touched, error, onChange, onBlur, disabled }: any) => (
  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><MonetizationIcon fontSize="inherit" /> Valor Base</Typography>
      <TextField
        fullWidth type="number" name="precio_base" value={precio}
        onChange={onChange} onBlur={onBlur} disabled={disabled}
        onKeyDown={(e) => (e.key === '-' || e.key === 'e' || e.key === '+') && e.preventDefault()}
        error={touched && Boolean(error)} helperText={touched && (error as string)}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
      />
    </Box>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><LocationOn fontSize="inherit" /> Georreferencia</Typography>
      <Stack direction="row" spacing={1}>
        <TextField fullWidth label="Lat" size="small" name="latitud" value={lat} onChange={onChange} onBlur={onBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <TextField fullWidth label="Lng" size="small" name="longitud" value={lng} onChange={onChange} onBlur={onBlur} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
      </Stack>
    </Box>
  </Stack>
));

const ScheduleSection = React.memo(({ inicio, fin, touchedInicio, errorInicio, touchedFin, errorFin, onChange, onBlur, minDate, disabled }: any) => {
  const handlePicker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const input = e.currentTarget.querySelector('input');
    if (input && 'showPicker' in input) input.showPicker();
  };

  return (
    <Box sx={{ bgcolor: alpha('#CC6333', 0.04), p: 2.5, borderRadius: 3, border: '1px dashed', borderColor: alpha('#CC6333', 0.2) }}>
      <Typography sx={SECTION_TITLE_SX}><CalendarIcon sx={{ color: '#CC6333' }} fontSize="inherit" /> Cronograma de Subasta</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth type="datetime-local" label="Apertura" InputLabelProps={{ shrink: true }}
          name="fecha_inicio" value={inicio} onChange={onChange} onBlur={onBlur}
          onMouseDown={handlePicker} disabled={disabled}
          inputProps={{ min: minDate }}
          error={touchedInicio && Boolean(errorInicio)} helperText={touchedInicio && errorInicio}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: '#CC6333', fontSize: '1.1rem' }} /></InputAdornment> }}
        />
        <TextField
          fullWidth type="datetime-local" label="Cierre" InputLabelProps={{ shrink: true }}
          name="fecha_fin" value={fin} onChange={onChange} onBlur={onBlur}
          onMouseDown={handlePicker} disabled={disabled}
          inputProps={{ min: inicio || minDate }}
          error={touchedFin && Boolean(errorFin)} helperText={touchedFin && errorFin}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: '#CC6333', fontSize: '1.1rem' }} /></InputAdornment> }}
        />
      </Stack>
    </Box>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLoteDto) => Promise<void>;
  lote: LoteDto | null;
  isLoading?: boolean;
}

const EditLoteModal: React.FC<EditLoteModalProps> = ({ open, onClose, onSubmit, lote, isLoading = false }) => {
  const theme = useTheme();

  const validationSchema = useMemo(() => Yup.object({
    nombre_lote: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
    precio_base: Yup.number().typeError('Debe ser número').min(1, 'Mínimo 1').required('Requerido'),
    fecha_inicio: Yup.date().transform((v, o) => o === '' ? null : v).nullable().min(new Date(new Date().setHours(0, 0, 0, 0)), 'Pasado'),
    fecha_fin: Yup.date().transform((v, o) => o === '' ? null : v).nullable().when('fecha_inicio', {
      is: (val: any) => val instanceof Date && !isNaN(val.getTime()),
      then: (schema) => schema.min(Yup.ref('fecha_inicio'), 'Posterior al inicio'),
    }),
  }), []);

  const formik = useFormik({
    initialValues: {
      nombre_lote: '', precio_base: '', id_proyecto: '',
      fecha_inicio: '', fecha_fin: '', latitud: '', longitud: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!lote) return;
      const payload: UpdateLoteDto = {
        nombre_lote: values.nombre_lote,
        precio_base: String(values.precio_base),
        id_proyecto: values.id_proyecto === '' ? null : Number(values.id_proyecto),
        latitud: values.latitud !== '' ? Number(values.latitud) : null,
        longitud: values.longitud !== '' ? Number(values.longitud) : null,
      };
      if (values.fecha_inicio) payload.fecha_inicio = values.fecha_inicio;
      if (values.fecha_fin) payload.fecha_fin = values.fecha_fin;

      await onSubmit(lote.id, payload);
    },
  });

  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote || '',
        precio_base: lote.precio_base ? String(lote.precio_base) : '',
        id_proyecto: lote.id_proyecto !== null ? String(lote.id_proyecto) : '',
        fecha_inicio: lote.fecha_inicio ? lote.fecha_inicio.substring(0, 16) : '',
        fecha_fin: lote.fecha_fin ? lote.fecha_fin.substring(0, 16) : '',
        latitud: lote.latitud !== null ? String(lote.latitud) : '',
        longitud: lote.longitud !== null ? String(lote.longitud) : '',
      });
    }
  }, [lote, open]);

  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open
  });

  const nowForInput = useMemo(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, [open]);

  if (!lote) return null;
  const isSubastaActiva = lote.estado_subasta === 'activa';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      onConfirm={formik.submitForm}
      title={`Editar Lote #${lote.id}`}
      subtitle="Modifique los parámetros técnicos del activo"
      icon={<EditIcon />}
      headerColor="primary"
      isLoading={isLoading}
      confirmText="Guardar Cambios"
      maxWidth="md"
    >
      <FormikProvider value={formik}>
        <Stack spacing={3.5}>
          {isSubastaActiva && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{ borderRadius: 2, borderLeft: '4px solid', bgcolor: alpha(theme.palette.info.main, 0.02) }}
            >
              <strong>Subasta en curso:</strong> Ciertos parámetros económicos y de tiempo están bloqueados para proteger la integridad de las pujas actuales.
            </Alert>
          )}

          <ProjectSection
            value={formik.values.id_proyecto} proyectos={proyectos}
            isLoading={isLoadingProyectos} onChange={formik.handleChange}
            onBlur={formik.handleBlur} disabled={isSubastaActiva}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box>
            <Typography sx={SECTION_TITLE_SX}>Identificación</Typography>
            <TextField
              fullWidth label="Nombre del Lote" name="nombre_lote"
              value={formik.values.nombre_lote} onChange={formik.handleChange}
              onBlur={formik.handleBlur} error={formik.touched.nombre_lote && !!formik.errors.nombre_lote}
              helperText={formik.touched.nombre_lote && (formik.errors.nombre_lote as string)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          <FinanceSection
            precio={formik.values.precio_base} lat={formik.values.latitud} lng={formik.values.longitud}
            touched={formik.touched.precio_base} error={formik.errors.precio_base}
            onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={isSubastaActiva}
          />

          <ScheduleSection
            inicio={formik.values.fecha_inicio} fin={formik.values.fecha_fin}
            touchedInicio={formik.touched.fecha_inicio} errorInicio={formik.errors.fecha_inicio}
            touchedFin={formik.touched.fecha_fin} errorFin={formik.errors.fecha_fin}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            minDate={nowForInput} disabled={isSubastaActiva}
          />
        </Stack>
      </FormikProvider>
    </BaseModal>
  );
};

export default EditLoteModal;
import {
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  LocationOn,
  MonetizationOn as MonetizationIcon, Business as ProjectIcon
} from '@mui/icons-material';
import {
  Alert, alpha, Box,
  Chip,
  Divider, InputAdornment, MenuItem,
  Stack, TextField, Typography, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { FormikProvider, useFormik } from 'formik';
import React, { useEffect, useMemo } from 'react';
import * as Yup from 'yup';

import ProyectoService from '../../../../../core/api/services/proyecto.service';
import type { LoteDto, UpdateLoteDto } from '../../../../../core/types/dto/lote.dto';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

// ============================================================================
// INTERFACE
// ============================================================================
interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLoteDto) => Promise<void>;
  lote: LoteDto | null;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENTES INTERNOS MEMOIZADOS (Fluidez Total)
// ============================================================================

const ProjectSection = React.memo(({ value, proyectos, isLoading, onChange, onBlur, disabled, theme }: any) => (
  <Box>
    <Typography sx={SECTION_TITLE_SX}><ProjectIcon fontSize="inherit" /> Proyecto Asociado</Typography>
    <TextField
      select fullWidth size="small" label="Elegir Proyecto"
      name="id_proyecto" value={value ?? ''} onChange={onChange} onBlur={onBlur}
      disabled={isLoading || disabled}
      SelectProps={{
        MenuProps: {
          PaperProps: { sx: { maxHeight: 300, mt: 0.5, borderRadius: 2, boxShadow: theme.shadows[5] } },
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
        }
      }}
    >
      <MenuItem value=""><em>Ninguno (Lote Huérfano)</em></MenuItem>
      {proyectos.map((p: ProyectoDto) => (
        <MenuItem key={p.id} value={p.id} sx={MENU_ITEM_SX}>
          <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
            <Typography variant="inherit" fontWeight={600}>{p.nombre_proyecto}</Typography>
            <Chip
              label={p.tipo_inversion === 'directo' ? 'DIRECTO' : 'MENSUAL'}
              size="small"
              sx={{
                height: 20, fontSize: '0.6rem', fontWeight: 900,
                bgcolor: p.tipo_inversion === 'directo' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                color: p.tipo_inversion === 'directo' ? 'info.dark' : 'warning.dark'
              }}
            />
          </Stack>
        </MenuItem>
      ))}
    </TextField>
  </Box>
));

const InfoSection = React.memo(({ nombre, touched, error, onChange, onBlur }: any) => (
  <Box>
    <Typography sx={SECTION_TITLE_SX}>Nombre del Lote</Typography>
    <TextField
      fullWidth label="Nombre" name="nombre_lote" value={nombre}
      onChange={onChange} onBlur={onBlur}
      error={touched && Boolean(error)}
      helperText={touched && (error as string)}
    />
  </Box>
));

const FinanceSection = React.memo(({ precio, lat, lng, touched, error, onChange, onBlur, disabled }: any) => (
  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><MonetizationIcon fontSize="inherit" /> Valor Base</Typography>
      <TextField
        fullWidth type="number" name="precio_base" value={precio}
        onChange={onChange} onBlur={onBlur} disabled={disabled}
        onKeyDown={(e) => (e.key === '-' || e.key === 'e' || e.key === '+') && e.preventDefault()}
        inputProps={{ min: 1 }}
        error={touched && Boolean(error)} helperText={touched && error}
        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
      />
    </Box>
    <Box flex={1}>
      <Typography sx={SECTION_TITLE_SX}><LocationOn fontSize="inherit" /> Ubicación (GPS)</Typography>
      <Stack direction="row" spacing={1}>
        <TextField fullWidth label="Lat" size="small" name="latitud" value={lat} onChange={onChange} onBlur={onBlur} InputLabelProps={{ shrink: true }} />
        <TextField fullWidth label="Lng" size="small" name="longitud" value={lng} onChange={onChange} onBlur={onBlur} InputLabelProps={{ shrink: true }} />
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
    <Box sx={{ bgcolor: alpha('#CC6333', 0.03), p: 2, borderRadius: 2, border: '1px solid rgba(204, 99, 51, 0.1)' }}>
      <Typography sx={SECTION_TITLE_SX}><CalendarIcon sx={{ color: '#CC6333' }} fontSize="inherit" /> Cronograma de Subasta</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth type="datetime-local" label="Apertura" InputLabelProps={{ shrink: true }}
          name="fecha_inicio" value={inicio} onChange={onChange} onBlur={onBlur}
          onMouseDown={handlePicker} disabled={disabled}
          inputProps={{ min: minDate }}
          error={touchedInicio && Boolean(errorInicio)} helperText={touchedInicio && errorInicio}
          InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: '#CC6333', fontSize: '1.1rem' }} /></InputAdornment> }}
        />
        <TextField
          fullWidth type="datetime-local" label="Cierre" InputLabelProps={{ shrink: true }}
          name="fecha_fin" value={fin} onChange={onChange} onBlur={onBlur}
          onMouseDown={handlePicker} disabled={disabled}
          inputProps={{ min: inicio || minDate }}
          error={touchedFin && Boolean(errorFin)} helperText={touchedFin && errorFin}
          InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ color: '#CC6333', fontSize: '1.1rem' }} /></InputAdornment> }}
        />
      </Stack>
    </Box>
  );
});

// ============================================================================
// CONSTANTES Y ESTILOS
// ============================================================================
const SECTION_TITLE_SX = { fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.7rem' };
const MENU_ITEM_SX = { fontSize: '0.85rem', py: 1, px: 2 };

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const EditLoteModal: React.FC<EditLoteModalProps> = ({ open, onClose, onSubmit, lote, isLoading = false }) => {
  const theme = useTheme();

  const validationSchema = useMemo(() => Yup.object({
    nombre_lote: Yup.string().min(5, 'Mínimo 5 caracteres').required('Requerido'),
    precio_base: Yup.number().typeError('Debe ser número').min(1, 'Mínimo 1').required('Requerido'),
    fecha_inicio: Yup.date().transform((v, o) => o === '' ? null : v).nullable().min(new Date(new Date().setHours(0, 0, 0, 0)), 'Pasado'),
    fecha_fin: Yup.date().transform((v, o) => o === '' ? null : v).nullable().when('fecha_inicio', {
      is: (val: any) => val instanceof Date && !isNaN(val.getTime()),
      then: (schema) => schema.min(Yup.ref('fecha_inicio'), 'Posterior al inicio'),
      otherwise: (schema) => schema
    }),
  }), []);

  const formik = useFormik({
    initialValues: {
      nombre_lote: '', precio_base: '', id_proyecto: '',
      fecha_inicio: '', fecha_fin: '', latitud: '', longitud: ''
    },
    validationSchema,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: true,
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
      open={open} onClose={onClose} onConfirm={formik.submitForm}
      title={`Editar Lote #${lote.id}`} icon={<EditIcon />}
      isLoading={isLoading} confirmText="Guardar Cambios" maxWidth="md"
    >
      <FormikProvider value={formik}>
        <Stack spacing={3}>

          {isSubastaActiva && (
            <Alert severity="info" variant="outlined">
              <b>Subasta activa:</b> El precio, las fechas y el proyecto están protegidos.
            </Alert>
          )}

          <ProjectSection
            value={formik.values.id_proyecto} proyectos={proyectos}
            isLoading={isLoadingProyectos} onChange={formik.handleChange}
            onBlur={formik.handleBlur} disabled={isSubastaActiva} theme={theme}
          />

          <Divider />

          <InfoSection
            nombre={formik.values.nombre_lote}
            touched={formik.touched.nombre_lote}
            error={formik.errors.nombre_lote}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          <Divider />

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
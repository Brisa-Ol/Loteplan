// src/pages/Admin/Inventario/modals/EditLoteModal.tsx

import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton,
  CircularProgress, MenuItem, Alert, Divider,
  Chip, Avatar, useTheme, alpha
} from '@mui/material';
import { 
    Close as CloseIcon, 
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

// Validación
const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(),
  id_proyecto: Yup.mixed().nullable(),
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

// Helper visual para estado
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'activa': return 'success';
    case 'finalizada': return 'info';
    case 'pendiente': return 'warning';
    default: return 'default';
  }
};

const EditLoteModal: React.FC<EditLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  lote,
  isLoading = false,
}) => {
  const theme = useTheme();

  // 1. Cargar Proyectos
  const { data: proyectos = [], isLoading: isLoadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<UpdateLoteDto>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      fecha_inicio: '',
      fecha_fin: '',
      id_proyecto: null,
      latitud: undefined,
      longitud: undefined,
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
        onClose();
      } catch (error) {
        console.error('Error al editar lote:', error);
      }
    },
    enableReinitialize: false
  });

  // Cargar datos al abrir
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

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  // Estilos reutilizables
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, 
      color: 'text.secondary', fontSize: '0.75rem', mb: 1 
  };

  return (
    <Dialog 
        open={open} 
        onClose={isLoading ? undefined : handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >

      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <EditIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                Editar Lote #{lote.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Modifique la información del lote existente
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>

            {/* Estado */}
            <Box sx={{ 
                p: 2, borderRadius: 2, 
                border: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.action.active, 0.04)
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary"><strong>ID:</strong> {lote.id}</Typography>
                <Chip
                  label={lote.estado_subasta.toUpperCase()}
                  size="small"
                  color={getStatusColor(lote.estado_subasta) as any}
                  variant="outlined"
                  sx={{ fontWeight: 800, border: '2px solid' }}
                />
                {lote.id_ganador && (
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    Ganador ID: {lote.id_ganador}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Info Básica */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <InventoryIcon color="action" fontSize="small" />
                    <Typography sx={sectionTitleSx}>Información Básica</Typography>
                </Stack>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
                            InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
                            sx={commonInputSx}
                        />
                    </Box>
                    {lote.estado_subasta === 'activa' && (
                        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                            No se puede modificar el precio base de una subasta activa.
                        </Alert>
                    )}
                </Stack>
            </Box>

            {/* Proyecto */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <LinkIcon color="action" fontSize="small" />
                    <Typography sx={sectionTitleSx}>Asociación</Typography>
                </Stack>
                <Stack spacing={1}>
                    <TextField
                        select fullWidth label="Proyecto Asociado"
                        {...formik.getFieldProps('id_proyecto')}
                        // ✅ Usamos ?? '' para manejar el null en el Select de MUI
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

            {/* Fechas */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <TimeIcon color="action" fontSize="small" />
                    <Typography sx={sectionTitleSx}>Tiempos de Subasta</Typography>
                </Stack>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                        fullWidth type="datetime-local" label="Inicio"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_inicio')}
                        disabled={isLoading || lote.estado_subasta !== 'pendiente'}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth type="datetime-local" label="Fin"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_fin')}
                        disabled={isLoading || lote.estado_subasta === 'finalizada'}
                        sx={commonInputSx}
                    />
                </Box>
            </Box>

            {/* Ubicación */}
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <LocationIcon color="action" fontSize="small" />
                    <Typography sx={sectionTitleSx}>Ubicación Geográfica</Typography>
                </Stack>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
                </Box>
            </Box>

          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button onClick={handleClose} disabled={isLoading} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditLoteModal;
// src/pages/Admin/Inventario/modals/CreateEditLoteModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton,
  CircularProgress, MenuItem, Alert, Divider, Chip, Avatar, useTheme, alpha
} from '@mui/material';
import { 
    Close as CloseIcon, 
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
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import ProyectoService from '../../../../Services/proyecto.service';
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';

interface CreateEditLoteModalProps {
  open: boolean;
  onClose: () => void;
  // Actualizamos la firma para aceptar archivos opcionales
  onSubmit: (data: CreateLoteDto | UpdateLoteDto, id?: number, files?: File[]) => Promise<void>;
  loteToEdit?: LoteDto | null;
  isLoading?: boolean;
}

// Validación
const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('El nombre es requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('El precio base es requerido'),
  id_proyecto: Yup.mixed().nullable(),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(), 
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

const CreateEditLoteModal: React.FC<CreateEditLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  loteToEdit,
  isLoading = false,
}) => {
  const theme = useTheme();
  
  // Estado local para las imágenes (solo creación)
  const [files, setFiles] = useState<File[]>([]);

  // Cargar Proyectos
  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery<ProyectoDto[]>({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<CreateLoteDto>({
    initialValues: {
      nombre_lote: '',
      precio_base: 0,
      id_proyecto: null,
      fecha_inicio: '',
      fecha_fin: '',
      latitud: null,
      longitud: null,
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

      // Pasamos los files al padre junto con el payload
      await onSubmit(payload, loteToEdit?.id, files);
    },
  });

  // Cargar datos al abrir
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
        setFiles([]); // En edición no usamos este campo
      } else {
        formik.resetForm();
        setFiles([]); // Limpiar imágenes al abrir para crear
      }
    }
  }, [open, loteToEdit]);

  const handleClose = () => {
    if (!isLoading) {
      formik.resetForm();
      setFiles([]);
      onClose();
    }
  };

  const esEdicion = !!loteToEdit;
  const subastaActiva = loteToEdit?.estado_subasta === 'activa';
  const subastaFinalizada = loteToEdit?.estado_subasta === 'finalizada';
  const puedeEditarPrecios = !subastaActiva && !subastaFinalizada;
  const puedeEditarProyecto = !esEdicion || loteToEdit?.estado_subasta === 'pendiente';

  // Estilos reutilizables
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
  const sectionTitleSx = { 
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, 
      color: 'text.secondary', fontSize: '0.75rem', mb: 1, 
      display: 'flex', alignItems: 'center', gap: 1
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
            {esEdicion ? <EditIcon /> : <SaveIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                {esEdicion ? `Editar Lote #${loteToEdit.id}` : 'Crear Nuevo Lote'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {esEdicion ? 'Modifique la información del lote' : 'Complete los datos para registrar un lote'}
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

            {/* Estado (Solo Edición) */}
            {esEdicion && (
                <Box sx={{ 
                    p: 2, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: alpha(theme.palette.action.active, 0.04)
                }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary"><strong>ID:</strong> {loteToEdit.id}</Typography>
                    <Chip
                    label={loteToEdit.estado_subasta.toUpperCase()}
                    size="small"
                    color={getStatusColor(loteToEdit.estado_subasta) as any}
                    variant="outlined"
                    sx={{ fontWeight: 800, border: '2px solid' }}
                    />
                    {loteToEdit.id_ganador && (
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                        Ganador ID: {loteToEdit.id_ganador}
                    </Typography>
                    )}
                </Stack>
                </Box>
            )}

            {/* Info Básica */}
            <Box>
                <Typography sx={sectionTitleSx}><InventoryIcon fontSize="small" color="action"/> Información Básica</Typography>
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
                            disabled={isLoading || !puedeEditarPrecios}
                            InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
                            sx={commonInputSx}
                        />
                    </Box>
                    {subastaActiva && (
                        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                            No se puede modificar el precio base de una subasta activa.
                        </Alert>
                    )}
                </Stack>
            </Box>

            <Divider />

            {/* Proyecto */}
            <Box>
                <Typography sx={sectionTitleSx}><LinkIcon fontSize="small" color="action"/> Asociación</Typography>
                <Stack spacing={1}>
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
                    {!puedeEditarProyecto && (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                            Solo se puede cambiar el proyecto de lotes en estado "pendiente".
                        </Alert>
                    )}
                </Stack>
            </Box>

            <Divider />

            {/* Fechas */}
            <Box>
                <Typography sx={sectionTitleSx}><TimeIcon fontSize="small" color="action"/> Tiempos de Subasta</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                        fullWidth type="datetime-local" label="Inicio"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_inicio')}
                        disabled={isLoading || subastaActiva}
                        sx={commonInputSx}
                    />
                    <TextField
                        fullWidth type="datetime-local" label="Fin"
                        InputLabelProps={{ shrink: true }}
                        {...formik.getFieldProps('fecha_fin')}
                        disabled={isLoading || subastaFinalizada}
                        sx={commonInputSx}
                    />
                </Box>
            </Box>

            <Divider />

            {/* Ubicación */}
            <Box>
                <Typography sx={sectionTitleSx}><LocationIcon fontSize="small" color="action"/> Ubicación Geográfica</Typography>
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

            {/* ✅ SECCIÓN: IMÁGENES (Solo visible al crear) */}
            {!esEdicion && (
                <>
                    <Divider />
                    <Box>
                        <Typography sx={sectionTitleSx}><ImageIcon fontSize="small" color="action"/> Imágenes Iniciales</Typography>
                        <Alert severity="info" variant="filled" sx={{ mb: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.dark }}>
                           Puedes subir imágenes ahora o gestionarlas después desde el listado.
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
            {isLoading ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateEditLoteModal;
import React, { useEffect, useState } from 'react'; // ✅ Importar useState
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton,
  CircularProgress, MenuItem, Alert, Divider, Chip
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Edit as EditIcon, Image as ImageIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../../types/dto/lote.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';

import { useQuery } from '@tanstack/react-query';
import ProyectoService from '../../../../Services/proyecto.service';

// ✅ Importar el componente de subida (Ajusta la ruta si es necesario)
import ImageUploadZone from '../../../../components/common/ImageUploadZone/ImageUploadZone';

interface CreateEditLoteModalProps {
  open: boolean;
  onClose: () => void;
  // ✅ Actualizamos la firma para aceptar archivos opcionales
  onSubmit: (data: CreateLoteDto | UpdateLoteDto, id?: number, files?: File[]) => Promise<void>;
  loteToEdit?: LoteDto | null;
  isLoading?: boolean;
}

// ... (El validationSchema y getStatusColor se mantienen IGUALES) ...
const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('El nombre es requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('El precio base es requerido'),
  id_proyecto: Yup.mixed().nullable(),
  fecha_inicio: Yup.string().nullable(),
  fecha_fin: Yup.string().nullable(), 
  // ... validaciones de fechas y coordenadas igual que antes ...
  latitud: Yup.number().min(-90).max(90).nullable(),
  longitud: Yup.number().min(-180).max(180).nullable(),
});

const getStatusColor = (estado: string) => { /* ... igual ... */ return 'default' };

const CreateEditLoteModal: React.FC<CreateEditLoteModalProps> = ({
  open,
  onClose,
  onSubmit,
  loteToEdit,
  isLoading = false,
}) => {
  
  // ✅ Estado local para las imágenes (solo creación)
  const [files, setFiles] = useState<File[]>([]);

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

      // ✅ Pasamos los files al padre junto con el payload
      await onSubmit(payload, loteToEdit?.id, files);
    },
  });

  useEffect(() => {
    if (open) {
      if (loteToEdit) {
        // ... (Lógica de setValues igual que antes) ...
        formik.setValues({
           nombre_lote: loteToEdit.nombre_lote,
           precio_base: Number(loteToEdit.precio_base),
           id_proyecto: loteToEdit.id_proyecto,
           fecha_inicio: loteToEdit.fecha_inicio ? new Date(loteToEdit.fecha_inicio).toISOString().slice(0, 16) : '',
           fecha_fin: loteToEdit.fecha_fin ? new Date(loteToEdit.fecha_fin).toISOString().slice(0, 16) : '',
           latitud: loteToEdit.latitud || null,
           longitud: loteToEdit.longitud || null,
        });
        setFiles([]); // En edición no usamos este campo, usamos el modal de imágenes
      } else {
        formik.resetForm();
        setFiles([]); // ✅ Limpiar imágenes al abrir para crear
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
  // ... (flags de edición iguales) ...
  const subastaActiva = loteToEdit?.estado_subasta === 'activa';
  const subastaFinalizada = loteToEdit?.estado_subasta === 'finalizada';
  const puedeEditarPrecios = !subastaActiva && !subastaFinalizada;
  const puedeEditarProyecto = !esEdicion || loteToEdit?.estado_subasta === 'pendiente';

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {esEdicion ? <EditIcon color="primary" /> : <SaveIcon color="primary" />}
          <Typography variant="h6" fontWeight="bold">
            {esEdicion ? `Editar Lote #${loteToEdit.id}` : 'Crear Nuevo Lote'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
             {/* ... (Sección Badge de Estado igual) ... */}
             {esEdicion && (
                // ... (código existente del badge) ...
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                   {/* ... contenido del badge ... */}
                   <Typography variant="body2">ID: {loteToEdit.id} - {loteToEdit.estado_subasta}</Typography>
                </Box>
             )}

            {/* ... (Inputs de Texto igual que antes) ... */}
            <Box>
                {/* ... Inputs Nombre y Precio ... */}
                 <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField 
                        fullWidth label="Nombre del Lote" 
                        {...formik.getFieldProps('nombre_lote')} 
                        error={formik.touched.nombre_lote && Boolean(formik.errors.nombre_lote)}
                        helperText={formik.touched.nombre_lote && formik.errors.nombre_lote}
                        disabled={isLoading}
                    />
                    <TextField 
                        fullWidth label="Precio Base" type="number" 
                        {...formik.getFieldProps('precio_base')} 
                        error={formik.touched.precio_base && Boolean(formik.errors.precio_base)}
                        helperText={formik.touched.precio_base && formik.errors.precio_base}
                        disabled={isLoading || !puedeEditarPrecios}
                    />
                 </Box>
            </Box>

            <Divider />

            {/* ... (Inputs de Proyecto y Fechas igual que antes) ... */}
            <TextField 
                select fullWidth label="Proyecto Asociado" 
                {...formik.getFieldProps('id_proyecto')} 
                value={formik.values.id_proyecto ?? ''}
                disabled={isLoading || loadingProyectos || !puedeEditarProyecto}
            >
                 <MenuItem value=""><em>Sin Asignar</em></MenuItem>
                 {proyectos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth type="datetime-local" label="Fecha Inicio" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_inicio')} disabled={isLoading || subastaActiva} />
                <TextField fullWidth type="datetime-local" label="Fecha Fin" InputLabelProps={{ shrink: true }} {...formik.getFieldProps('fecha_fin')} disabled={isLoading || subastaFinalizada} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth label="Latitud" type="number" inputProps={{step: 'any'}} {...formik.getFieldProps('latitud')} disabled={isLoading} />
                <TextField fullWidth label="Longitud" type="number" inputProps={{step: 'any'}} {...formik.getFieldProps('longitud')} disabled={isLoading} />
            </Box>

            {/* ✅ NUEVA SECCIÓN: IMÁGENES (Solo visible al crear) */}
            {!esEdicion && (
                <>
                    <Divider />
                    <Box>
                        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" display="flex" alignItems="center" gap={1}>
                            <ImageIcon fontSize="small"/> Imágenes Iniciales
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
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

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {isLoading ? 'Procesando...' : esEdicion ? 'Guardar Cambios' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateEditLoteModal;
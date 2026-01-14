// src/pages/Admin/Inventario/modals/EditLoteModal.tsx

import React, { useEffect } from 'react';
import { TextField, Stack, Box, Typography, MenuItem, Alert, useTheme, alpha } from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, Inventory as InventoryIcon, Link as LinkIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import type { LoteDto, UpdateLoteDto } from '../../../../../core/types/dto/lote.dto';
import ProyectoService from '../../../../../core/api/services/proyecto.service';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';


interface EditLoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLoteDto) => Promise<void>;
  lote: LoteDto | null;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  nombre_lote: Yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  precio_base: Yup.number().min(0, 'Debe ser positivo').required('Requerido'),
  id_proyecto: Yup.mixed().nullable(),
});

const EditLoteModal: React.FC<EditLoteModalProps> = ({ open, onClose, onSubmit, lote, isLoading = false }) => {
  const theme = useTheme(); // ✅ Inicializamos el tema para los colores del scroll

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    enabled: open,
  });

  const formik = useFormik<UpdateLoteDto>({
    initialValues: { nombre_lote: '', id_proyecto: null, latitud: 0, longitud: 0 },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!lote) return;
      await onSubmit(lote.id, {
        ...values,
        id_proyecto: values.id_proyecto ? Number(values.id_proyecto) : null,
      });
    },
  });

  useEffect(() => {
    if (lote && open) {
      formik.setValues({
        nombre_lote: lote.nombre_lote,
        id_proyecto: lote.id_proyecto,
        latitud: lote.latitud || 0,
        longitud: lote.longitud || 0,
      });
    }
  }, [lote, open]);

  if (!lote) return null;

  const subastaActiva = lote.estado_subasta === 'activa';
  const sectionTitleSx = { textTransform: 'uppercase', fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Editar Lote #${lote.id}`}
      subtitle="Modifique la información básica del lote."
      icon={<EditIcon />}
      onConfirm={formik.submitForm}
      isLoading={isLoading}
      confirmText="Guardar Cambios"
      confirmButtonIcon={<SaveIcon />}
      maxWidth="md"
    >
      <Stack spacing={3}>
        <Box>
          <Typography sx={sectionTitleSx}><InventoryIcon fontSize="inherit"/> INFORMACIÓN BÁSICA</Typography>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth label="Nombre" {...formik.getFieldProps('nombre_lote')} error={formik.touched.nombre_lote && !!formik.errors.nombre_lote} />
            {/* Aquí podrías agregar el campo de precio si lo necesitas, o dejarlo oculto como en tu código original */}
          </Stack>
          {subastaActiva && <Alert severity="warning" sx={{ mt: 1 }}>No se puede editar el precio en subastas activas.</Alert>}
        </Box>

        <Box>
          <Typography sx={sectionTitleSx}><LinkIcon fontSize="inherit"/> ASOCIACIÓN</Typography>
          <TextField 
            select 
            fullWidth 
            label="Proyecto" 
            {...formik.getFieldProps('id_proyecto')} 
            value={formik.values.id_proyecto ?? ''} 
            disabled={lote.estado_subasta !== 'pendiente'}
            // ✅ APLICACIÓN DEL SCROLL PERSONALIZADO
            SelectProps={{
                MenuProps: {
                    PaperProps: {
                        sx: {
                            maxHeight: 300,
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'transparent',
                            }
                        }
                    }
                }
            }}
          >
            <MenuItem value=""><em>Sin Asignar</em></MenuItem>
            {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
          </TextField>
        </Box>
        
        {/* Se eliminó la sección de fechas */}
      </Stack>
    </BaseModal>
  );
};

export default EditLoteModal;
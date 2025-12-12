import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton, CircularProgress,
  Alert,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CreditCard as CuotaIcon,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Servicios y DTOs
import type { CreateCuotaMensualDto } from '../../../../../types/dto/cuotaMensual.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';
import CuotaMensualService from '../../../../../Services/cuotaMensual.service';
import ProyectoPriceHistory from '../ProyectoPriceHistory'; 

// Las props deben coincidir con lo que envía el hook useModal (open, onClose)
interface ConfigCuotasModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const validationSchema = Yup.object({
  nombre_cemento_cemento: Yup.string().nullable(),
  valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1 unidad').required('Requerido'),
  valor_cemento: Yup.number().min(0.01, 'Debe ser mayor a 0').required('Requerido'),
  porcentaje_plan: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
  porcentaje_administrativo: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
  porcentaje_iva: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
});

const ConfigCuotasModal: React.FC<ConfigCuotasModalProps> = ({ 
  open, 
  onClose, // Esta función viene del hook useModal del padre
  proyecto 
}) => {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: CreateCuotaMensualDto) => {
      const res = await CuotaMensualService.create(data);
      return res.data;
    },
    onSuccess: () => {
      if (proyecto) {
        queryClient.invalidateQueries({ queryKey: ['cuotasByProyecto', proyecto.id] });
        queryClient.invalidateQueries({ queryKey: ['proyecto', String(proyecto.id)] });
      }
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      
      formik.resetForm();
      setShowHistory(true); 
    },
    onError: (err: any) => {
        console.error(err);
    }
  });

  const formik = useFormik<CreateCuotaMensualDto>({
    initialValues: {
      id_proyecto: proyecto?.id || 0,
      nombre_proyecto: proyecto?.nombre_proyecto || '', 
      total_cuotas_proyecto: proyecto?.plazo_inversion || 0,
      
      nombre_cemento_cemento: '',
      valor_cemento_unidades: 1,
      valor_cemento: 0,
      porcentaje_plan: 70,
      porcentaje_administrativo: 10,
      porcentaje_iva: 21,
    },
    validationSchema: validationSchema,
    enableReinitialize: true, 
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await createMutation.mutateAsync({
          ...values,
          id_proyecto: proyecto.id,
          nombre_proyecto: proyecto.nombre_proyecto,
          total_cuotas_proyecto: proyecto.plazo_inversion || 12,
        });
      } catch (error) {
        console.error('Error al crear cuota:', error);
      }
    },
  });

  // Lógica INTERNA de cierre (Limpieza)
  const handleClose = () => {
    formik.resetForm();
    setShowHistory(false);
    // IMPORTANTE: Aquí llamamos a la función del hook que nos pasó el padre
    onClose(); 
  };

  // Protección temprana: si no hay proyecto, no renderizamos nada
  if (!proyecto) return null;

  // Renderizado condicional si el tipo de inversión no es mensual
  if (proyecto.tipo_inversion !== 'mensual') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración No Disponible</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Este proyecto es de tipo <strong>Inversión (Directo)</strong> y no requiere configuración de cuotas mensuales.
          </Alert>
        </DialogContent>
        <DialogActions><Button onClick={handleClose}>Cerrar</Button></DialogActions>
      </Dialog>
    );
  }

  // Cálculos visuales
  const valorMovil = formik.values.valor_cemento_unidades * formik.values.valor_cemento;
  const totalDelPlan = valorMovil * (formik.values.porcentaje_plan / 100);
  // Evitar división por cero
  const valorMensual = totalDelPlan / (proyecto.plazo_inversion || 1); 
  const cargaAdministrativa = valorMovil * (formik.values.porcentaje_administrativo / 100);
  const ivaCarga = cargaAdministrativa * (formik.values.porcentaje_iva / 100);
  const valorMensualFinal = valorMensual + cargaAdministrativa + ivaCarga;

  return (
    <Dialog 
        open={open} 
        onClose={handleClose} // Usamos nuestro handleClose interno para limpiar antes de cerrar
        maxWidth="md" 
        fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CuotaIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Configurar Cuota Mensual</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, opacity: 0.9 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">{proyecto.nombre_proyecto}</Typography>
              <Typography variant="body2" color="primary.contrastText">Plazo: {proyecto.plazo_inversion} meses</Typography>
            </Box>

            {/* ... Resto de los campos (sin cambios) ... */}
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Datos de Configuración
              </Typography>
              
              <TextField
                fullWidth
                id="nombre_cemento_cemento"
                label="Nombre del Cemento (Opcional)"
                {...formik.getFieldProps('nombre_cemento_cemento')}
                disabled={createMutation.isPending}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  id="valor_cemento_unidades"
                  label="Cantidad de Unidades"
                  type="number"
                  {...formik.getFieldProps('valor_cemento_unidades')}
                  error={formik.touched.valor_cemento_unidades && Boolean(formik.errors.valor_cemento_unidades)}
                  helperText={formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  id="valor_cemento"
                  label="Precio por Unidad ($)"
                  type="number"
                  {...formik.getFieldProps('valor_cemento')}
                  error={formik.touched.valor_cemento && Boolean(formik.errors.valor_cemento)}
                  helperText={formik.touched.valor_cemento && formik.errors.valor_cemento}
                  disabled={createMutation.isPending}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Porcentajes de Cálculo
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  id="porcentaje_plan"
                  label="% Plan"
                  type="number"
                  {...formik.getFieldProps('porcentaje_plan')}
                  error={formik.touched.porcentaje_plan && Boolean(formik.errors.porcentaje_plan)}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  id="porcentaje_administrativo"
                  label="% Administrativo"
                  type="number"
                  {...formik.getFieldProps('porcentaje_administrativo')}
                  error={formik.touched.porcentaje_administrativo && Boolean(formik.errors.porcentaje_administrativo)}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  id="porcentaje_iva"
                  label="% IVA"
                  type="number"
                  {...formik.getFieldProps('porcentaje_iva')}
                  error={formik.touched.porcentaje_iva && Boolean(formik.errors.porcentaje_iva)}
                  disabled={createMutation.isPending}
                />
              </Box>
            </Box>

            <Alert severity="info" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Nueva Cuota Estimada:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ${valorMensualFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {proyecto.moneda}
                    </Typography>
                </Stack>
            </Alert>

            {createMutation.isError && (
              <Alert severity="error">
                ❌ Error: {(createMutation.error as any).response?.data?.error || (createMutation.error as Error).message}
              </Alert>
            )}

            {showHistory && (
               <Box mt={2}>
                  <Typography variant="h6" gutterBottom>Historial</Typography>
                  <ProyectoPriceHistory proyectoId={proyecto.id} />
               </Box>
            )}

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            startIcon={<HistoryIcon />}
            disabled={createMutation.isPending}
          >
            {showHistory ? 'Ocultar' : 'Ver'} Historial
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose} variant="outlined" disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || !formik.isValid}
            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConfigCuotasModal;
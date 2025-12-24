// src/components/Admin/Proyectos/Components/modals/ConfigCuotasModal.tsx

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton, CircularProgress,
  Alert, useTheme, alpha, Avatar, Paper, InputAdornment
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CreditCard as CuotaIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Servicios y DTOs
import type { CreateCuotaMensualDto } from '../../../../../types/dto/cuotaMensual.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';
import CuotaMensualService from '../../../../../Services/cuotaMensual.service';
import ProyectoPriceHistory from '../ProyectoPriceHistory'; 

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
  onClose, 
  proyecto 
}) => {
  const theme = useTheme();
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

  const handleClose = () => {
    formik.resetForm();
    setShowHistory(false);
    onClose(); 
  };

  if (!proyecto) return null;

  if (proyecto.tipo_inversion !== 'mensual') {
    return (
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
      >
        <DialogTitle sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            ⚠️ Configuración No Disponible
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Este proyecto es de tipo <strong>Inversión (Directo)</strong> y no requiere configuración de cuotas mensuales.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Cálculos visuales
  const valorMovil = formik.values.valor_cemento_unidades * formik.values.valor_cemento;
  const totalDelPlan = valorMovil * (formik.values.porcentaje_plan / 100);
  const valorMensual = totalDelPlan / (proyecto.plazo_inversion || 1); 
  const cargaAdministrativa = valorMovil * (formik.values.porcentaje_administrativo / 100);
  const ivaCarga = cargaAdministrativa * (formik.values.porcentaje_iva / 100);
  const valorMensualFinal = valorMensual + cargaAdministrativa + ivaCarga;

  return (
    <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
        PaperProps={{ 
            elevation: 0,
            sx: { 
                borderRadius: 3, 
                boxShadow: theme.shadows[10],
                overflow: 'hidden',
                maxHeight: '90vh'
            } 
        }}
    >
      {/* HEADER ESTILIZADO */}
      <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          py: 2.5, px: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar 
            variant="rounded" 
            sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: theme.palette.primary.main,
                width: 40, height: 40
            }}
          >
            <CuotaIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>
              Configurar Cuota Mensual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Defina los valores base para el cálculo automático de cuotas
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={4}>
            
            {/* RESUMEN DEL PROYECTO */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.08), 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="subtitle2" color="primary.main" fontWeight={700} textTransform="uppercase" gutterBottom>
                            PROYECTO SELECCIONADO
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                            {proyecto.nombre_proyecto}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            Plazo Total
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="text.primary">
                            {proyecto.plazo_inversion} Meses
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* 1. DATOS DE CONFIGURACIÓN */}
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon fontSize="small" /> Datos Base
                </Typography>
                
                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        id="nombre_cemento_cemento"
                        label="Referencia del Valor (Opcional)"
                        placeholder="Ej: Bolsa de Cemento Avellaneda 50kg"
                        {...formik.getFieldProps('nombre_cemento_cemento')}
                        disabled={createMutation.isPending}
                    />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
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
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                id="valor_cemento"
                                label="Precio por Unidad"
                                type="number"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                {...formik.getFieldProps('valor_cemento')}
                                error={formik.touched.valor_cemento && Boolean(formik.errors.valor_cemento)}
                                helperText={formik.touched.valor_cemento && formik.errors.valor_cemento}
                                disabled={createMutation.isPending}
                            />
                        </Box>
                    </Stack>
                </Stack>
            </Box>
            
            {/* 2. PORCENTAJES DE CÁLCULO */}
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalculateIcon fontSize="small" /> Porcentajes de Cálculo
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth
                        id="porcentaje_plan"
                        label="% Plan"
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        {...formik.getFieldProps('porcentaje_plan')}
                        error={formik.touched.porcentaje_plan && Boolean(formik.errors.porcentaje_plan)}
                        disabled={createMutation.isPending}
                    />
                    <TextField
                        fullWidth
                        id="porcentaje_administrativo"
                        label="% Administrativo"
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        {...formik.getFieldProps('porcentaje_administrativo')}
                        error={formik.touched.porcentaje_administrativo && Boolean(formik.errors.porcentaje_administrativo)}
                        disabled={createMutation.isPending}
                    />
                    <TextField
                        fullWidth
                        id="porcentaje_iva"
                        label="% IVA"
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        {...formik.getFieldProps('porcentaje_iva')}
                        error={formik.touched.porcentaje_iva && Boolean(formik.errors.porcentaje_iva)}
                        disabled={createMutation.isPending}
                    />
                </Stack>
            </Box>

            {/* 3. RESULTADO PRELIMINAR */}
            <Alert 
                severity="info" 
                icon={false} 
                sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    '& .MuiAlert-message': { width: '100%' } 
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="body2" color="info.main" fontWeight={600}>
                            NUEVA CUOTA ESTIMADA
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Basado en los valores ingresados
                        </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={800} color="primary.main">
                        ${valorMensualFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <Typography component="span" variant="caption" color="text.secondary">{proyecto.moneda}</Typography>
                    </Typography>
                </Stack>
            </Alert>

            {createMutation.isError && (
              <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                ❌ Error: {(createMutation.error as any).response?.data?.error || (createMutation.error as Error).message}
              </Alert>
            )}

            {showHistory && (
               <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" /> HISTORIAL DE VALORES
                  </Typography>
                  <ProyectoPriceHistory proyectoId={proyecto.id} />
               </Box>
            )}

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            startIcon={<HistoryIcon />}
            color="inherit"
            disabled={createMutation.isPending}
            sx={{ mr: 'auto', borderRadius: 2 }} 
          >
            {showHistory ? 'Ocultar' : 'Ver'} Historial
          </Button>
          
          <Button onClick={handleClose} color="inherit" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || !formik.isValid}
            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            sx={{ px: 3 }}
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConfigCuotasModal;
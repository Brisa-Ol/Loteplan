// src/components/Admin/Proyectos/Modals/ConfigCuotasModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableRow, Paper
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CreditCard as CuotaIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateCuotaMensualDto } from '../../../../types/dto/cuotaMensual.dto';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import CuotaMensualService from '../../../../Services/cuotaMensual.service';
import ProyectoPriceHistory from '../components/ProyectoPriceHistory';

interface ConfigCuotasModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const validationSchema = Yup.object({
  nombre_cemento_cemento: Yup.string().nullable(),
  valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1 unidad').required('Requerido'),
  valor_cemento: Yup.number().min(0.01, 'Debe ser mayor a 0').required('Requerido'),
  porcentaje_plan: Yup.number().min(0).max(100).required('Requerido'),
  porcentaje_administrativo: Yup.number().min(0).max(100).required('Requerido'),
  porcentaje_iva: Yup.number().min(0).max(100).required('Requerido'),
});

const ConfigCuotasModal: React.FC<ConfigCuotasModalProps> = ({ 
  open, 
  onClose, 
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
        alert("Error al guardar la configuración de cuota.");
    }
  });

  const formik = useFormik<Omit<CreateCuotaMensualDto, 'id_proyecto' | 'nombre_proyecto'>>({
    initialValues: {
      nombre_cemento_cemento: '',
      valor_cemento_unidades: 1,
      valor_cemento: 0,
      porcentaje_plan: 70,
      porcentaje_administrativo: 10,
      porcentaje_iva: 21,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        // ✅ AGREGAMOS nombre_proyecto REQUERIDO POR EL BACKEND
        await createMutation.mutateAsync({
          ...values,
          id_proyecto: proyecto.id,
          nombre_proyecto: proyecto.nombre_proyecto,
        });
      } catch (error) {
        console.error('Error al crear cuota:', error);
      }
    },
    enableReinitialize: true,
  });

  // --- LÓGICA DE CÁLCULO (Réplica exacta del Backend) ---
  const calculos = useMemo(() => {
    if (!proyecto) return null;

    // Función helper para redondear a 2 decimales (igual que backend)
    const round = (num: number) => parseFloat(num.toFixed(2));

    const unidades = Number(formik.values.valor_cemento_unidades);
    const valorUnitario = Number(formik.values.valor_cemento);
    
    const pctPlan = Number(formik.values.porcentaje_plan);
    const pctAdmin = Number(formik.values.porcentaje_administrativo);
    const pctIva = Number(formik.values.porcentaje_iva);
    
    const plazo = proyecto.plazo_inversion || 1;

    // 1. Valor Móvil
    const valorMovil = round(unidades * valorUnitario);

    // 2. Componentes
    const totalDelPlan = round(valorMovil * (pctPlan / 100));
    
    // Valor mensual base (sin cargos)
    const valorMensualPuro = round(totalDelPlan / plazo);

    const cargaAdministrativa = round(valorMovil * (pctAdmin / 100));
    const ivaCarga = round(cargaAdministrativa * (pctIva / 100));

    // 3. Final
    const valorMensualFinal = round(valorMensualPuro + cargaAdministrativa + ivaCarga);

    return {
      valorMovil,
      valorMensualPuro,
      cargaAdministrativa,
      ivaCarga,
      valorMensualFinal
    };
  }, [formik.values, proyecto]);

  const handleClose = () => {
    formik.resetForm();
    setShowHistory(false);
    onClose();
  };

  if (!proyecto) return null;

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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
            
            {/* Info del Proyecto */}
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, bgOpacity: 0.1 }}>
              <Typography variant="subtitle1" fontWeight="bold">{proyecto.nombre_proyecto}</Typography>
              <Typography variant="body2">Plazo: <strong>{proyecto.plazo_inversion} meses</strong></Typography>
            </Box>

            {/* Formulario */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Variables del Cemento
              </Typography>
              
              <TextField
                fullWidth
                size="small"
                id="nombre_cemento_cemento"
                label="Referencia / Nombre del Cemento"
                {...formik.getFieldProps('nombre_cemento_cemento')}
                disabled={createMutation.isPending}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  id="valor_cemento_unidades"
                  label="Unidades"
                  type="number"
                  {...formik.getFieldProps('valor_cemento_unidades')}
                  error={formik.touched.valor_cemento_unidades && Boolean(formik.errors.valor_cemento_unidades)}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  size="small"
                  id="valor_cemento"
                  label="Precio por Unidad ($)"
                  type="number"
                  {...formik.getFieldProps('valor_cemento')}
                  error={formik.touched.valor_cemento && Boolean(formik.errors.valor_cemento)}
                  disabled={createMutation.isPending}
                />
              </Box>
            </Box>

            {/* Porcentajes */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Estructura de Costos (%)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  id="porcentaje_plan"
                  label="% Plan"
                  type="number"
                  {...formik.getFieldProps('porcentaje_plan')}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  size="small"
                  id="porcentaje_administrativo"
                  label="% Admin"
                  type="number"
                  {...formik.getFieldProps('porcentaje_administrativo')}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  size="small"
                  id="porcentaje_iva"
                  label="% IVA"
                  type="number"
                  {...formik.getFieldProps('porcentaje_iva')}
                  disabled={createMutation.isPending}
                />
              </Box>
            </Box>

            {/* Desglose de Cálculo (Vista Previa) */}
            {calculos && (
              <Box sx={{ mt: 2 }}>
                 <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalculateIcon fontSize="small" color="action"/> Desglose de Cuota (Estimado)
                 </Typography>
                 <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell>Valor Móvil (Base)</TableCell>
                                <TableCell align="right">${calculos.valorMovil.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Cuota Pura (Plan / Plazo)</TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>${calculos.valorMensualPuro.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4, color: 'text.secondary' }}>+ Carga Administrativa</TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>${calculos.cargaAdministrativa.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4, color: 'text.secondary' }}>+ IVA s/Carga</TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>${calculos.ivaCarga.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: 'primary.50' }}>
                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>VALOR CUOTA FINAL</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                                    ${calculos.valorMensualFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                 </TableContainer>
              </Box>
            )}

            {createMutation.isError && (
              <Alert severity="error">
                ❌ Error: {(createMutation.error as Error).message}
              </Alert>
            )}

            {/* Historial (Opcional) */}
            {showHistory && (
               <Box mt={2}>
                  <Typography variant="h6" gutterBottom>Historial de Actualizaciones</Typography>
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
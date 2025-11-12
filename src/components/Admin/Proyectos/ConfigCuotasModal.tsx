// src/components/Admin/Proyectos/ConfigCuotasModal.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Box, Typography, IconButton, CircularProgress,
  Alert, Divider, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CreditCard as CuotaIcon,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { ProyectoDTO } from '../../../types/dto/proyecto.dto';
import type { CuotaMensualDTO, CreateCuotaMensualDTO } from '../../../types/dto/cuotaMensual.dto';
import cuotaMensualService from '../../../Services/cuotaMensual.service';

interface ConfigCuotasModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDTO | null;
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
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Query para obtener el historial de cuotas
  const { data: cuotasHistorial = [], isLoading: isLoadingHistory } = useQuery<CuotaMensualDTO[], Error>({
    queryKey: ['cuotasByProyecto', proyecto?.id],
    queryFn: () => cuotaMensualService.getCuotasByProyecto(proyecto!.id.toString()),
    enabled: open && !!proyecto && showHistory,
  });

  // Mutation para crear una nueva cuota
  const createMutation = useMutation({
    mutationFn: cuotaMensualService.createCuota,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuotasByProyecto', proyecto?.id] });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      formik.resetForm();
      setShowHistory(true);
    },
  });

  const formik = useFormik<CreateCuotaMensualDTO>({
    initialValues: {
      id_proyecto: proyecto?.id || 0,
      nombre_cemento_cemento: '',
      valor_cemento_unidades: 1,
      valor_cemento: 0,
      porcentaje_plan: 70, // Valores por defecto sugeridos
      porcentaje_administrativo: 10,
      porcentaje_iva: 21,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await createMutation.mutateAsync({
          ...values,
          id_proyecto: proyecto.id,
        });
      } catch (error) {
        console.error('Error al crear cuota:', error);
      }
    },
  });

  // Actualizar id_proyecto cuando cambie
  React.useEffect(() => {
    if (proyecto) {
      formik.setFieldValue('id_proyecto', proyecto.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto]);

  const handleClose = () => {
    formik.resetForm();
    setShowHistory(false);
    onClose();
  };

  if (!proyecto) return null;

  // Validar que sea un proyecto mensual
  if (proyecto.tipo_inversion !== 'mensual') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CuotaIcon color="error" />
            <Typography variant="h6">Configuración No Disponible</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Este proyecto es de tipo <strong>Inversión (Directo)</strong> y no requiere configuración de cuotas mensuales.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Calcular valores previos (estimación)
  const valorMovil = formik.values.valor_cemento_unidades * formik.values.valor_cemento;
  const totalDelPlan = valorMovil * (formik.values.porcentaje_plan / 100);
  const valorMensual = totalDelPlan / (proyecto.plazo_inversion || 1);
  const cargaAdministrativa = valorMovil * (formik.values.porcentaje_administrativo / 100);
  const ivaCarga = cargaAdministrativa * (formik.values.porcentaje_iva / 100);
  const valorMensualFinal = valorMensual + cargaAdministrativa + ivaCarga;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CuotaIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Configurar Cuota Mensual
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            
            {/* Info del Proyecto */}
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {proyecto.nombre_proyecto}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plazo: {proyecto.plazo_inversion} cuotas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monto Actual: ${proyecto.monto_inversion?.toLocaleString()} {proyecto.moneda}
              </Typography>
            </Box>

            {/* Formulario */}
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

            {/* Porcentajes */}
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
                  helperText={formik.touched.porcentaje_plan && formik.errors.porcentaje_plan}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  id="porcentaje_administrativo"
                  label="% Administrativo"
                  type="number"
                  {...formik.getFieldProps('porcentaje_administrativo')}
                  error={formik.touched.porcentaje_administrativo && Boolean(formik.errors.porcentaje_administrativo)}
                  helperText={formik.touched.porcentaje_administrativo && formik.errors.porcentaje_administrativo}
                  disabled={createMutation.isPending}
                />
                <TextField
                  fullWidth
                  id="porcentaje_iva"
                  label="% IVA"
                  type="number"
                  {...formik.getFieldProps('porcentaje_iva')}
                  error={formik.touched.porcentaje_iva && Boolean(formik.errors.porcentaje_iva)}
                  helperText={formik.touched.porcentaje_iva && formik.errors.porcentaje_iva}
                  disabled={createMutation.isPending}
                />
              </Box>
            </Box>

            <Divider />

            {/* Vista Previa del Cálculo */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Vista Previa del Cálculo
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Valor Móvil:</Typography>
                    <Typography variant="body2" fontWeight={500}>${valorMovil.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total del Plan:</Typography>
                    <Typography variant="body2" fontWeight={500}>${totalDelPlan.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Valor Mensual Base:</Typography>
                    <Typography variant="body2" fontWeight={500}>${valorMensual.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Carga Administrativa:</Typography>
                    <Typography variant="body2" fontWeight={500}>${cargaAdministrativa.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">IVA Carga:</Typography>
                    <Typography variant="body2" fontWeight={500}>${ivaCarga.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      Valor Cuota Final:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      ${valorMensualFinal.toFixed(2)} {proyecto.moneda}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              <Alert severity="info" sx={{ mt: 2 }}>
                Este valor se guardará como el <strong>monto_inversion</strong> del proyecto.
              </Alert>
            </Box>

            {/* Historial de Cuotas */}
            {showHistory && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="action" />
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                    Historial de Configuraciones
                  </Typography>
                </Box>
                {isLoadingHistory ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : cuotasHistorial.length === 0 ? (
                  <Alert severity="info">No hay configuraciones previas.</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Cemento</TableCell>
                          <TableCell align="right">Unidades</TableCell>
                          <TableCell align="right">Cuota Final</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuotasHistorial.map((cuota, index) => (
                          <TableRow key={cuota.id}>
                            <TableCell>
                              <Chip 
                                label={index === 0 ? "ACTUAL" : new Date(cuota.createdAt!).toLocaleDateString()} 
                                size="small" 
                                color={index === 0 ? "success" : "default"}
                              />
                            </TableCell>
                            <TableCell>{cuota.nombre_cemento_cemento || 'N/A'}</TableCell>
                            <TableCell align="right">{cuota.valor_cemento_unidades}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={500}>
                                ${cuota.valor_mensual_final.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {createMutation.isSuccess && (
              <Alert severity="success">
                ✅ Cuota configurada exitosamente. El monto del proyecto ha sido actualizado.
              </Alert>
            )}

            {createMutation.isError && (
              <Alert severity="error">
                ❌ Error al configurar la cuota: {(createMutation.error as Error).message}
              </Alert>
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
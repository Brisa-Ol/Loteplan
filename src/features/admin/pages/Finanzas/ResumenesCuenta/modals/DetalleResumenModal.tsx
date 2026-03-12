// src/features/admin/pages/Finanzas/modals/DetalleResumenModal.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog';

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import {
  AccountBalance,
  AddCircleOutline,
  AttachMoney,
  ExpandLess,
  ExpandMore,
  FastForward,
  Schedule,
} from '@mui/icons-material';
import {
  alpha,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

// Co-located with StatusCard since it's only used there
type PaletteColorKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface DetalleResumenModalProps {
  open: boolean;
  onClose: () => void;
  resumen: ResumenCuentaDto | null;
}

const DetalleResumenModal: React.FC<DetalleResumenModalProps> = ({ open, onClose, resumen }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const { showSuccess, showError } = useSnackbar();

  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [cantidadMeses, setCantidadMeses] = useState<number>(1);

  // Derived state
  const isCompleted = (resumen?.porcentaje_pagado ?? 0) >= 100;
  const hasOverdue = (resumen?.cuotas_vencidas ?? 0) > 0;
  const cuotasRestantes = resumen ? resumen.meses_proyecto - resumen.cuotas_pagadas : 0;
  const maxAdelantar = Math.max(0, cuotasRestantes - 1);
  const puedeAdelantar = !isCompleted && maxAdelantar > 0;

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['resumenesCuenta'] });
    refetchPagos();
  };

  // Mutation: generate advance payments
  const generatePaymentsMutation = useMutation({
    mutationFn: () =>
      PagoService.generateAdvancePayments({
        id_suscripcion: resumen!.id_suscripcion,
        cantidad_meses: cantidadMeses,
      }),
    onSuccess: () => {
      showSuccess('Cuotas adelantadas generadas con éxito.');
      setShowAdvanceForm(false);
      setShowPendingPayments(true);
      invalidateAndRefetch();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al generar pagos');
    },
  });

  // Mutation: manual payment confirmation
  const confirmManualMutation = useMutation({
    mutationFn: (idPago: number) => PagoService.confirmarManual(idPago),
    onSuccess: () => {
      showSuccess('Cobro registrado y contadores actualizados.');
      confirmDialog.close();
      invalidateAndRefetch();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'No se pudo procesar el pago');
      confirmDialog.close();
    },
  });

  // Query: pending payments (only fetched when the panel is open)
  const {
    data: pagosPendientes = [],
    isLoading: loadingPagos,
    refetch: refetchPagos,
  } = useQuery<PagoDto[]>({
    queryKey: ['pagosPendientesResumen', resumen?.id_suscripcion],
    queryFn: async () => {
      if (!resumen) return [];
      const res = await PagoService.getPendingBySubscription(resumen.id_suscripcion);
      return (res.data as any)?.data ?? [];
    },
    enabled: open && !!resumen && (showPendingPayments || showAdvanceForm),
  });

  const handleConfirmPaymentClick = (pago: PagoDto) => {
    confirmDialog.confirm('force_confirm_transaction', { id: pago.id, monto: pago.monto, mes: pago.mes });
  };

  const handleClose = () => {
    setShowAdvanceForm(false);
    setShowPendingPayments(false);
    onClose();
  };

  if (!resumen) return null;

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleClose}
        title={`Resumen de Cuenta #${resumen.id}`}
        subtitle={`Suscripción #${resumen.id_suscripcion} — ${resumen.nombre_proyecto}`}
        icon={<AccountBalance />}
        maxWidth="md"
        hideConfirmButton
        cancelText="Cerrar"
      >
        <Stack spacing={4}>

          {/* 1. PROGRESS SECTION */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                Avance del Plan: {resumen.porcentaje_pagado}%
              </Typography>
              <Chip
                label={isCompleted ? 'PLAN FINALIZADO' : hasOverdue ? 'DEUDA PENDIENTE' : 'PLAN AL DÍA'}
                color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
                size="small"
                sx={{ fontWeight: 800, borderRadius: 1.5 }}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(resumen.porcentaje_pagado, 100)}
              sx={{ height: 12, borderRadius: 6, mb: 2 }}
              color={isCompleted ? 'success' : hasOverdue ? 'warning' : 'primary'}
            />
            <Stack direction="row" spacing={2}>
              <StatusCard label="PAGADAS" value={resumen.cuotas_pagadas} color="success" />
              <StatusCard label="VENCIDAS" value={resumen.cuotas_vencidas} color={hasOverdue ? 'error' : 'default'} />
              <StatusCard label="RESTANTES" value={cuotasRestantes} color="warning" />
              <StatusCard label="TOTAL PLAN" value={resumen.meses_proyecto} color="default" />
            </Stack>
          </Box>

          {/* 2. ADVANCE PAYMENTS PANEL */}
          {puedeAdelantar && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                border: '1px dashed',
                borderColor: 'primary.main',
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.01),
              }}
            >
              <Typography
                variant="caption"
                fontWeight={900}
                color="primary.main"
                sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                Generación de Adelantos Administrativos
              </Typography>

              {!showAdvanceForm ? (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutline />}
                  onClick={() => setShowAdvanceForm(true)}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                >
                  Adelantar Próximas Cuotas
                </Button>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    type="number"
                    label="Cuotas"
                    size="small"
                    value={cantidadMeses}
                    inputProps={{ min: 1, max: maxAdelantar }}
                    onChange={(e) => setCantidadMeses(Number(e.target.value))}
                    sx={{ width: 120 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={() => generatePaymentsMutation.mutate()}
                      disabled={generatePaymentsMutation.isPending}
                    >
                      {generatePaymentsMutation.isPending
                        ? <CircularProgress size={20} color="inherit" />
                        : 'Generar'}
                    </Button>
                    <Button color="inherit" onClick={() => setShowAdvanceForm(false)}>
                      Cancelar
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Paper>
          )}

          {/* 3. PENDING PAYMENTS TABLE */}
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
              onClick={() => setShowPendingPayments((prev) => !prev)}
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Badge badgeContent={pagosPendientes.length} color="warning">
                  <Schedule color="primary" fontSize="small" />
                </Badge>
                <Typography variant="subtitle2" fontWeight={900}>
                  CRONOGRAMA DE CUOTAS POR COBRAR
                </Typography>
              </Stack>
              {showPendingPayments ? <ExpandLess /> : <ExpandMore />}
            </Box>

            <Collapse in={showPendingPayments}>
              <Divider />
              <Box sx={{ p: 1 }}>
                {loadingPagos ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : pagosPendientes.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}
                  >
                    No hay cuotas pendientes.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.05) }}>
                        {['MES', 'MONTO', 'VENCIMIENTO', 'ESTADO', 'ACCIONES'].map((header, i) => (
                          <TableCell
                            key={header}
                            align={i === 4 ? 'right' : 'left'}
                            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagosPendientes.map((pago: PagoDto) => {
                        const esAdelanto = new Date(pago.fecha_vencimiento) > new Date();
                        const isPagable = ['pendiente', 'vencido'].includes(pago.estado_pago);

                        return (
                          <TableRow key={pago.id} hover>
                            <TableCell sx={{ fontWeight: 800 }}>#{pago.mes}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {pago.fecha_vencimiento
                                  ? new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')
                                  : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={pago.estado_pago?.toUpperCase()}
                                  size="small"
                                  color={pago.estado_pago === 'vencido' ? 'error' : 'warning'}
                                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                                />
                                {esAdelanto && (
                                  <Chip
                                    icon={<FastForward style={{ fontSize: 10 }} />}
                                    label="ADELANTO"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              {isPagable && (
                                <Tooltip title="Registrar Cobro Manual (Efectivo)">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleConfirmPaymentClick(pago)}
                                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}
                                  >
                                    <AttachMoney fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Collapse>
          </Paper>

          {/* 4. QUOTA STRUCTURE */}
          <Box>
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 1.2, mb: 1.5, display: 'block' }}
            >
              Estructura de la Cuota Vigente
            </Typography>
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.action.active, 0.04),
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={1}>
                  BASE VALOR CEMENTO
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600}>
                    CEMENTO: {resumen.detalle_cuota.nombre_cemento}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="primary.dark">
                    {resumen.detalle_cuota.valor_cemento_unidades} u. × $
                    {resumen.detalle_cuota.valor_cemento.toLocaleString('es-AR')}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1.5} sx={{ p: 2.5 }}>
                <FilaDetalle label="Valor Móvil" value={resumen.detalle_cuota.valor_movil} />
                <FilaDetalle label="Valor Mensual Base" value={resumen.detalle_cuota.valor_mensual} />
                <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
                <FilaDetalle label="Carga Administrativa" value={resumen.detalle_cuota.carga_administrativa} />
                <FilaDetalle label="IVA Carga Admin." value={resumen.detalle_cuota.iva_carga_administrativa} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 2,
                    borderRadius: 1.5,
                    mt: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800}>CUOTA FINAL</Typography>
                  <Typography variant="h5" fontWeight={900}>
                    ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

        </Stack>
      </BaseModal>

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={() => confirmManualMutation.mutate(confirmDialog.data?.id)}
        isLoading={confirmManualMutation.isPending}
      />
    </>
  );
};

// --- AUXILIARY COMPONENTS ---

const FilaDetalle: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
    <Typography variant="body2" fontWeight={700}>
      ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
    </Typography>
  </Box>
);

const StatusCard: React.FC<{ label: string; value: number; color: PaletteColorKey | 'default' }> = ({
  label,
  value,
  color,
}) => {
  const theme = useTheme();
  const isDefault = color === 'default';
  const bgColor = isDefault ? 'transparent' : alpha(theme.palette[color as PaletteColorKey].main, 0.05);
  const textColor = isDefault ? theme.palette.text.primary : theme.palette[color as PaletteColorKey].main;

  return (
    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center', bgcolor: bgColor, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight={900} color={textColor}>{value}</Typography>
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
    </Paper>
  );
};

export default DetalleResumenModal;
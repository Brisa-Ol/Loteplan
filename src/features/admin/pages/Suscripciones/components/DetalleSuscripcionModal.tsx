// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx

import React, { useState } from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha,
  Button, TextField, Alert, CircularProgress, IconButton, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, Collapse
} from '@mui/material';
import {
  Person,
  AccountBalance,
  MonetizationOn,
  Token,
  CalendarToday,
  AddCircleOutline,
  PaymentOutlined,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore,
  ExpandLess,
  Receipt
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/dto/pago.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Estados para generar pagos adelantados
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [cantidadMeses, setCantidadMeses] = useState<number>(3);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para ver pagos pendientes
  const [showPendingPayments, setShowPendingPayments] = useState(false);

  // Estados para editar monto de pago
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [newMonto, setNewMonto] = useState<number>(0);

  // Query para obtener pagos pendientes de esta suscripción
  const { data: pagosPendientes = [], isLoading: loadingPagos, refetch: refetchPagos } = useQuery({
    queryKey: ['pagosPendientes', suscripcion?.id],
    queryFn: async () => {
      if (!suscripcion) return [];
      const res = await PagoService.getPendingBySubscription(suscripcion.id);
      return res.data;
    },
    enabled: open && !!suscripcion && showPendingPayments
  });

  // Mutación para generar pagos adelantados
  const generatePaymentsMutation = useMutation({
    mutationFn: async () => {
      if (!suscripcion) throw new Error('No hay suscripción seleccionada');
      return await PagoService.generateAdvancePayments({
        id_suscripcion: suscripcion.id,
        cantidad: cantidadMeses
      });
    },
    onSuccess: (res) => {
      const pagosGenerados = res.data?.pagos?.length || cantidadMeses;
      setFeedback({
        type: 'success',
        message: `✅ Se generaron ${pagosGenerados} pagos adelantados correctamente.`
      });
      setShowAdvanceForm(false);
      setCantidadMeses(3);
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
      refetchPagos();
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';
      setFeedback({ type: 'error', message: `❌ ${errorMsg}` });
    }
  });

  // Mutación para actualizar monto de un pago
  const updateMontoMutation = useMutation({
    mutationFn: async ({ pagoId, monto }: { pagoId: number, monto: number }) => {
      return await PagoService.updatePaymentAmount(pagoId, { monto });
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: '✅ Monto actualizado correctamente.' });
      setEditingPaymentId(null);
      refetchPagos();
      queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';
      setFeedback({ type: 'error', message: `❌ ${errorMsg}` });
    }
  });

  const handleClose = () => {
    setShowAdvanceForm(false);
    setShowPendingPayments(false);
    setFeedback(null);
    setCantidadMeses(3);
    setEditingPaymentId(null);
    onClose();
  };

  const handleGeneratePayments = () => {
    if (cantidadMeses < 1 || cantidadMeses > 24) {
      setFeedback({ type: 'error', message: 'La cantidad debe estar entre 1 y 24 meses.' });
      return;
    }
    setFeedback(null);
    generatePaymentsMutation.mutate();
  };

  const handleStartEditMonto = (pago: PagoDto) => {
    setEditingPaymentId(pago.id);
    setNewMonto(pago.monto);
  };

  const handleSaveMonto = (pagoId: number) => {
    if (newMonto <= 0) {
      setFeedback({ type: 'error', message: 'El monto debe ser mayor a 0.' });
      return;
    }
    updateMontoMutation.mutate({ pagoId, monto: newMonto });
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setNewMonto(0);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'vencido': return 'error';
      default: return 'default';
    }
  };

  if (!suscripcion) return null;

  const statusColor = suscripcion.activo ? 'success' : 'default';

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Detalle de Suscripción"
      subtitle={`ID Referencia: #${suscripcion.id}`}
      icon={<AccountBalance />}
      headerColor="primary"
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip
          label={suscripcion.activo ? 'ACTIVA' : 'CANCELADA'}
          color={statusColor}
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>

        {/* Feedback de acciones */}
        {feedback && (
          <Alert
            severity={feedback.type}
            onClose={() => setFeedback(null)}
            sx={{ borderRadius: 2 }}
          >
            {feedback.message}
          </Alert>
        )}

        {/* 1. Usuario y Proyecto */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>USUARIO</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {suscripcion.usuario?.nombre} {suscripcion.usuario?.apellido}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                  {suscripcion.usuario?.email}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AccountBalance color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PROYECTO</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {suscripcion.proyectoAsociado?.nombre_proyecto}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Estado del Proyecto</Typography>
                <Box mt={0.5}>
                  <Chip
                    label={suscripcion.proyectoAsociado?.estado_proyecto || 'N/A'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24, fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* 2. Resumen Financiero */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5, borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.3),
            bgcolor: alpha(theme.palette.info.main, 0.04)
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <MonetizationOn color="info" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800} color="info.main">
              RESUMEN FINANCIERO
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                MONTO TOTAL PAGADO
              </Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
                ${Number(suscripcion.monto_total_pagado).toLocaleString('es-AR')}
              </Typography>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Cuotas Pendientes</Typography>
                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                  <Typography variant="body1" fontWeight={700}>{suscripcion.meses_a_pagar}</Typography>
                  <Chip
                    label={suscripcion.meses_a_pagar > 0 ? 'Con Deuda' : 'Al Día'}
                    size="small"
                    color={suscripcion.meses_a_pagar > 0 ? 'warning' : 'success'}
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Stack>
              </Box>

              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Saldo a Favor</Typography>
                <Typography variant="body1" fontWeight={700} color="success.main">
                  ${Number(suscripcion.saldo_a_favor).toLocaleString('es-AR')}
                </Typography>
              </Box>

              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Tokens Disponibles</Typography>
                <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                  <Token color="warning" sx={{ fontSize: 18 }} />
                  <Typography variant="body1" fontWeight={700}>{suscripcion.tokens_disponibles}</Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* 3. Pagos Pendientes (Expandible) */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              p: 2,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: showPendingPayments ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
            }}
            onClick={() => setShowPendingPayments(!showPendingPayments)}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Receipt color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PAGOS PENDIENTES/VENCIDOS</Typography>
              <Chip label={pagosPendientes.length} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Stack>
            {showPendingPayments ? <ExpandLess /> : <ExpandMore />}
          </Box>

          <Collapse in={showPendingPayments}>
            <Divider />
            <Box sx={{ p: 2 }}>
              {loadingPagos ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : pagosPendientes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No hay pagos pendientes o vencidos para esta suscripción.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Mes</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Vencimiento</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagosPendientes.map((pago) => (
                      <TableRow key={pago.id} hover>
                        <TableCell>Cuota #{pago.mes}</TableCell>
                        <TableCell>
                          {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>
                          {editingPaymentId === pago.id ? (
                            <TextField
                              type="number"
                              value={newMonto}
                              onChange={(e) => setNewMonto(parseFloat(e.target.value) || 0)}
                              size="small"
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          ) : (
                            <Typography fontWeight={600} fontFamily="monospace">
                              ${Number(pago.monto).toLocaleString('es-AR')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pago.estado_pago}
                            size="small"
                            color={getEstadoColor(pago.estado_pago) as any}
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {editingPaymentId === pago.id ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Guardar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleSaveMonto(pago.id)}
                                  disabled={updateMontoMutation.isPending}
                                >
                                  {updateMontoMutation.isPending ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton size="small" onClick={handleCancelEdit}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          ) : (
                            <Tooltip title="Editar Monto">
                              <IconButton
                                size="small"
                                onClick={() => handleStartEditMonto(pago)}
                                disabled={pago.estado_pago === 'pagado'}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </Paper>

        {/* 4. Acciones Admin - Generar Pagos Adelantados */}
        {suscripcion.activo && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5, borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.default, 0.5)
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PaymentOutlined color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>
                ACCIONES ADMINISTRATIVAS
              </Typography>
            </Stack>

            {!showAdvanceForm ? (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddCircleOutline />}
                onClick={() => setShowAdvanceForm(true)}
                sx={{ borderRadius: 2 }}
              >
                Generar Pagos Adelantados
              </Button>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Genera registros de pago para los próximos meses. Los pagos se crearán en estado "pendiente".
                </Typography>

                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField
                    type="number"
                    label="Cantidad de meses"
                    value={cantidadMeses}
                    onChange={(e) => setCantidadMeses(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    size="small"
                    inputProps={{ min: 1, max: 24 }}
                    sx={{ width: 150 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGeneratePayments}
                    disabled={generatePaymentsMutation.isPending}
                    startIcon={generatePaymentsMutation.isPending ? <CircularProgress size={16} /> : <AddCircleOutline />}
                    sx={{ borderRadius: 2 }}
                  >
                    {generatePaymentsMutation.isPending ? 'Generando...' : 'Confirmar'}
                  </Button>

                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setShowAdvanceForm(false);
                      setFeedback(null);
                    }}
                    disabled={generatePaymentsMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        )}

        {/* 5. Fechas / Metadata */}
        <Box sx={{ px: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <CalendarToday fontSize="small" sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={600}>
              Fecha de Alta: {suscripcion.createdAt
                ? new Date(suscripcion.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
                : '-'}
            </Typography>
          </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default DetalleSuscripcionModal;
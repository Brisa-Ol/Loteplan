// modals/DetalleResumenModal.tsx

import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal';
import { AccountBalance, AddCircleOutline, AttachMoney } from '@mui/icons-material';
import { alpha, Box, Button, Chip, CircularProgress, Divider, LinearProgress, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useDetalleResumenModal } from './hooks/useDetalleResumenModal';
import { HistorialPagosPanel } from './SeccionPagos';
import { PendingPaymentsPanel } from './Seccionpagospendientes';


interface Props {
  open: boolean;
  onClose: () => void;
  resumen: ResumenCuentaDto | null;
}

const DetalleResumenModal: React.FC<Props> = ({ open, onClose, resumen }) => {
  const theme = useTheme();
  const h = useDetalleResumenModal(resumen, open);

  if (!resumen) return null;

  return (
    <>
      <BaseModal
        open={open} onClose={() => h.handleClose(onClose)}
        title={`Resumen de Cuenta #${resumen.id}`}
        subtitle={`Suscripción #${resumen.id_suscripcion} — ${resumen.nombre_proyecto}`}
        icon={<AccountBalance />} maxWidth="md" hideConfirmButton cancelText="Cerrar"
      >
        <Stack spacing={4}>

          {/* 1. PROGRESO */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={900} color="primary.main">
                Avance del Plan: {resumen.porcentaje_pagado}%
              </Typography>
              <Chip
                label={h.isCompleted ? 'PLAN FINALIZADO' : h.hasOverdue ? 'DEUDA PENDIENTE' : 'PLAN AL DÍA'}
                color={h.isCompleted ? 'success' : h.hasOverdue ? 'error' : 'info'}
                size="small" sx={{ fontWeight: 800, borderRadius: 1.5 }}
              />
            </Stack>
            <LinearProgress variant="determinate" value={Math.min(resumen.porcentaje_pagado, 100)}
              sx={{ height: 12, borderRadius: 6, mb: 2 }}
              color={h.isCompleted ? 'success' : h.hasOverdue ? 'warning' : 'primary'}
            />
            <Stack direction="row" spacing={2}>
              <StatusCard label="PAGADAS" value={resumen.cuotas_pagadas} color="success" />
              <StatusCard label="VENCIDAS" value={resumen.cuotas_vencidas} color={h.hasOverdue ? 'error' : 'default'} />
              <StatusCard label="RESTANTES" value={h.cuotasRestantes} color="warning" />
              <StatusCard label="TOTAL PLAN" value={resumen.meses_proyecto} color="default" />
            </Stack>
          </Box>

          {/* 2. ADELANTOS */}
          {h.puedeAdelantar && (
            <Box sx={{ p: 2.5, border: '1px dashed', borderColor: 'primary.main', borderRadius: 4 }}>
              <Typography variant="caption" fontWeight={900} color="primary.main"
                sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Generación de Adelantos Administrativos
              </Typography>
              {!h.showAdvanceForm ? (
                <Button variant="contained" color="primary" startIcon={<AddCircleOutline />}
                  onClick={() => h.setShowAdvanceForm(true)}
                  sx={{ borderRadius: 8, fontWeight: 700, textTransform: 'none', px: 3, boxShadow: 'none' }}>
                  Adelantar Próximas Cuotas
                </Button>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <TextField type="number" label="Cuotas" size="small" value={h.cantidadMeses}
                    inputProps={{ min: 1, max: h.maxAdelantar }}
                    onChange={(e) => h.setCantidadMeses(Number(e.target.value))} sx={{ width: 120 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => h.generatePaymentsMutation.mutate()}
                      disabled={h.generatePaymentsMutation.isPending || h.cantidadMeses < 1}
                      sx={{ borderRadius: 6, fontWeight: 700, boxShadow: 'none' }}>
                      {h.generatePaymentsMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Generar'}
                    </Button>
                    <Button color="inherit" onClick={() => h.setShowAdvanceForm(false)} sx={{ borderRadius: 6, fontWeight: 700 }}>
                      Cancelar
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>
          )}

          {/* 3. CUOTAS PENDIENTES */}
          <PendingPaymentsPanel
            show={h.showPendingPayments} onToggle={() => h.setShowPendingPayments(p => !p)}
            isLoading={h.loadingPagos} pagos={h.pagosPendientes}
            editingPaymentId={h.editingPaymentId} newMonto={h.newMonto}
            setNewMonto={h.setNewMonto} setEditingPaymentId={h.setEditingPaymentId}
            updateMontoMutation={h.updateMontoMutation} onForcePayment={h.handleOpenForceModal}
          />

          {/* 4. HISTORIAL */}
          <HistorialPagosPanel
            show={h.showHistory} onToggle={() => h.setShowHistory(p => !p)}
            isLoading={h.loadingHistorial} pagos={h.historialPagos}
          />

          {/* 5. ESTRUCTURA DE CUOTA */}
          <CuotaStructure resumen={resumen} />

        </Stack>
      </BaseModal>

      {/* MODAL FORZAR PAGO */}
      <BaseModal
        open={h.forcePaymentModalOpen} onClose={h.handleCloseForceModal}
        title="Forzar Pago Manual" icon={<AttachMoney />}
        headerColor="warning" maxWidth="sm"
        confirmText="Confirmar Cobro" onConfirm={h.handleSubmitForce}
        isLoading={h.forcePaymentMutation.isPending}
        disableConfirm={!h.forceMotivo.trim()} confirmButtonColor="warning"
      >
        <Box>
          <Typography variant="body2" mb={3} color="text.secondary">
            Cuota <b>#{h.selectedPagoToForce?.mes}</b> por{' '}
            <b>${Number(h.selectedPagoToForce?.monto).toLocaleString('es-AR')}</b> pasará a <b>FORZADO</b>.
          </Typography>
          <TextField autoFocus fullWidth multiline rows={3} label="Motivo o Referencia (Obligatorio)"
            value={h.forceMotivo} onChange={(e) => h.setForceMotivo(e.target.value)}
            placeholder="Ej: Pago recibido en efectivo en oficina central"
            helperText="Indica el motivo por el cual estás forzando el pago."
          />
        </Box>
      </BaseModal>
    </>
  );
};

// --- COMPONENTES AUXILIARES ---

const FilaDetalle: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
    <Typography variant="body2" fontWeight={700}>${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
  </Box>
);

type PaletteColorKey = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
const StatusCard: React.FC<{ label: string; value: number; color: PaletteColorKey | 'default' }> = ({ label, value, color }) => {
  const theme = useTheme();
  const isDefault = color === 'default';
  return (
    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: isDefault ? 'transparent' : alpha(theme.palette[color as PaletteColorKey].main, 0.05) }}>
      <Typography variant="h5" fontWeight={900} color={isDefault ? 'text.primary' : `${color}.main`}>{value}</Typography>
      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{label}</Typography>
    </Paper>
  );
};

const CuotaStructure: React.FC<{ resumen: ResumenCuentaDto }> = ({ resumen }) => {
  const theme = useTheme();
  const d = resumen.detalle_cuota;
  return (
    <Box>
      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, mb: 1.5, display: 'block' }}>
        Estructura de la Cuota Vigente
      </Typography>
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.active, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={1}>BASE VALOR INSUMO</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>INSUMO: {d.nombre_cemento || 'Bolsa de Cemento'}</Typography>
            <Typography variant="body2" fontWeight={800} color="primary.dark">
              {d.valor_cemento_unidades} u. × ${Number(d.valor_cemento).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
        <Stack spacing={1.5} sx={{ p: 2.5 }}>
          <FilaDetalle label="Valor Móvil (Insumo × Unidades)" value={Number(d.valor_movil)} />
          <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
          <FilaDetalle label={`Cuota Pura Mensual (Plan al ${d.porcentaje_plan}%)`} value={Number(d.valor_mensual)} />
          <FilaDetalle label="Carga Administrativa" value={Number(d.carga_administrativa)} />
          <FilaDetalle label="IVA Carga Admin." value={Number(d.iva_carga_administrativa)} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1.5, mt: 1 }}>
            <Typography variant="subtitle1" fontWeight={800}>CUOTA FINAL</Typography>
            <Typography variant="h5" fontWeight={900}>${Number(d.valor_mensual_final).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default DetalleResumenModal;
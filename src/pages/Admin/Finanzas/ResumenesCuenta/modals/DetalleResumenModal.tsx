// src/pages/Admin/ResumenesCuenta/modals/DetalleResumenModal.tsx

import React from 'react';
import {
  Typography, Box, Stack, Paper, Divider, Chip, LinearProgress, useTheme, alpha
} from '@mui/material';
import {
  AccountBalance,
  AccessTime,
  CheckCircle,
  ErrorOutline,
  ReceiptLong as InvoiceIcon
} from '@mui/icons-material';
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
import type { ResumenCuentaDto } from '../../../../../types/dto/resumenCuenta.dto';

interface DetalleResumenModalProps {
  open: boolean;
  onClose: () => void;
  resumen: ResumenCuentaDto | null;
}

const DetalleResumenModal: React.FC<DetalleResumenModalProps> = ({ open, onClose, resumen }) => {
  const theme = useTheme();

  if (!resumen) return null;

  const isCompleted = resumen.porcentaje_pagado >= 100;
  const hasOverdue = resumen.cuotas_vencidas > 0;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Resumen de Cuenta #${resumen.id}`}
      subtitle="Detalle financiero del plan"
      icon={<AccountBalance />}
      headerColor="primary"
      maxWidth="md"
      hideConfirmButton // Solo es un modal informativo
      cancelText="Cerrar"
    >
      <Stack spacing={3}>
        {/* 1. INFORMACIÓN PRINCIPAL DEL PROYECTO */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, borderRadius: 2, border: '1px solid', 
            borderColor: alpha(theme.palette.primary.main, 0.3),
            bgcolor: alpha(theme.palette.primary.main, 0.04) 
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>PROYECTO ASOCIADO</Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ my: 0.5 }}>
                {resumen.nombre_proyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Suscripción ID: <strong>{resumen.id_suscripcion}</strong>
              </Typography>
            </Box>
            
            <Chip
              label={isCompleted ? 'Plan Completado' : hasOverdue ? 'Con Deuda Vencida' : 'Plan Activo'}
              color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
              icon={isCompleted ? <CheckCircle /> : hasOverdue ? <ErrorOutline /> : <AccessTime />}
              sx={{ fontWeight: 'bold', px: 1 }}
            />
          </Stack>
        </Paper>

        {/* 2. PROGRESO DE PAGOS */}
        <Box>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
            Progreso del Plan
          </Typography>
          
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{resumen.cuotas_pagadas}</strong> de <strong>{resumen.meses_proyecto}</strong> cuotas pagadas
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {resumen.porcentaje_pagado.toFixed(2)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(resumen.porcentaje_pagado, 100)}
                  sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                  color={isCompleted ? 'success' : hasOverdue ? 'warning' : 'primary'}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <StatusCard label="PAGADAS" value={resumen.cuotas_pagadas} color="success" />
                <StatusCard label="VENCIDAS" value={resumen.cuotas_vencidas} color={hasOverdue ? 'error' : 'default'} />
                <StatusCard label="TOTAL" value={resumen.meses_proyecto} color="default" />
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Divider />

        {/* 3. DESGLOSE ECONÓMICO */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <InvoiceIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Estructura de la Cuota
            </Typography>
          </Stack>
          
          <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.active, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={1}>BASE DEL CÁLCULO</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={500}>Cemento ({resumen.detalle_cuota.nombre_cemento})</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {resumen.detalle_cuota.valor_cemento_unidades} u. × ${resumen.detalle_cuota.valor_cemento.toLocaleString('es-AR')}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.5} sx={{ p: 2 }}>
              <FilaDetalle label="Valor Móvil" value={resumen.detalle_cuota.valor_movil} />
              <FilaDetalle label="Valor Mensual Base" value={resumen.detalle_cuota.valor_mensual} />
              <Divider sx={{ borderStyle: 'dashed' }} />
              <FilaDetalle label="Carga Administrativa" value={resumen.detalle_cuota.carga_administrativa} />
              <FilaDetalle label="IVA Carga Admin." value={resumen.detalle_cuota.iva_carga_administrativa} />
              
              <Box sx={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: 1.5, mt: 1
              }}>
                <Typography variant="subtitle2" fontWeight="bold">CUOTA FINAL</Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </BaseModal>
  );
};

// --- COMPONENTES AUXILIARES ---

const FilaDetalle: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>
      ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
    </Typography>
  </Box>
);

const StatusCard: React.FC<{ label: string; value: number; color: 'success'|'error'|'default' }> = ({ label, value, color }) => {
  const theme = useTheme();
  const isDefault = color === 'default';

  return (
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ 
        flex: 1, p: 2, textAlign: 'center', borderRadius: 2,
        bgcolor: isDefault ? 'background.default' : alpha(theme.palette[color].main, 0.05),
        borderColor: isDefault ? 'divider' : alpha(theme.palette[color].main, 0.2)
      }}
    >
      <Typography variant="h4" fontWeight="800" color={isDefault ? 'text.primary' : `${color}.main`}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
    </Paper>
  );
};

export default DetalleResumenModal;
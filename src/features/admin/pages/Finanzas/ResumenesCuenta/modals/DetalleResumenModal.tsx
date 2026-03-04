// src/pages/Admin/ResumenesCuenta/modals/DetalleResumenModal.tsx

import React, { useMemo } from 'react';
import {
  Typography,
  Box,
  Stack,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccountBalance,
  AccessTime,
  CheckCircle,
  ErrorOutline,
  ReceiptLong as InvoiceIcon,
} from '@mui/icons-material';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';
import { BaseModal } from '@/shared/components/domain/modals';

// ============================================================================
// INTERFACE DE PROPS
// ============================================================================
interface DetalleResumenModalProps {
  open: boolean;
  onClose: () => void;
  resumen: ResumenCuentaDto | null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const DetalleResumenModal: React.FC<DetalleResumenModalProps> = ({ open, onClose, resumen }) => {
  const theme = useTheme();

  // --- Lógica de Estado ---
  const isCompleted = resumen?.porcentaje_pagado ? resumen.porcentaje_pagado >= 100 : false;
  const hasOverdue = resumen?.cuotas_vencidas ? resumen.cuotas_vencidas > 0 : false;

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    headerBox: {
      p: 2.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: alpha(theme.palette.primary.main, 0.2),
      bgcolor: alpha(theme.palette.primary.main, 0.02),
    },
    sectionTitle: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: 'text.secondary',
      fontWeight: 800,
      fontSize: '0.7rem',
      mb: 1.5,
    },
    economicPaper: {
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: theme.palette.divider,
    },
    totalFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      bgcolor: 'primary.main',
      color: 'white',
      p: 2,
      borderRadius: 1.5,
      mt: 1,
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
    }
  }), [theme]);

  if (!resumen) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Resumen de Cuenta #${resumen.id}`}
      subtitle="Detalle financiero y estado del plan"
      icon={<AccountBalance />}
      headerColor="primary"
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
    >
      <Stack spacing={4}>
        {/* 1. CABECERA DE PROYECTO */}
        <Box sx={styles.headerBox}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PROYECTO ASOCIADO</Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ mt: 0.5 }}>
                {resumen.nombre_proyecto}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Suscripción ID: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{resumen.id_suscripcion}</Box>
              </Typography>
            </Box>

            <Chip
              label={isCompleted ? 'Plan Completado' : hasOverdue ? 'Con Deuda Vencida' : 'Plan Activo'}
              color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
              icon={isCompleted ? <CheckCircle /> : hasOverdue ? <ErrorOutline /> : <AccessTime />}
              sx={{ fontWeight: 800, px: 1, borderRadius: 2 }}
            />
          </Stack>
        </Box>

        {/* 2. PROGRESO DE PAGOS */}
        <Box>
          <Typography variant="subtitle2" sx={styles.sectionTitle}>
            Progreso de Cuotas
          </Typography>

          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500}>
                    <strong>{resumen.cuotas_pagadas}</strong> de <strong>{resumen.meses_proyecto}</strong> meses cubiertos
                  </Typography>
                  <Typography variant="body2" fontWeight={900} color="primary.main">
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

        {/* 3. DESGLOSE ECONÓMICO */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <InvoiceIcon fontSize="small" sx={{ color: theme.palette.text.disabled }} />
            <Typography variant="subtitle2" sx={styles.sectionTitle} mb={0}>
              Estructura de la Cuota Vigente
            </Typography>
          </Stack>

          <Paper elevation={0} sx={styles.economicPaper}>
            {/* Header Cálculo Cemento */}
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.active, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={1}>BASE VALOR CEMENTO</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600} color="text.primary">CEMENTO: {resumen.detalle_cuota.nombre_cemento}</Typography>
                <Typography variant="body2" fontWeight={800} color="primary.dark">
                  {resumen.detalle_cuota.valor_cemento_unidades} u. × ${resumen.detalle_cuota.valor_cemento.toLocaleString('es-AR')}
                </Typography>
              </Box>
            </Box>

            {/* Listado de ítems */}
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              <FilaDetalle label="Valor Móvil" value={resumen.detalle_cuota.valor_movil} />
              <FilaDetalle label="Valor Mensual Base" value={resumen.detalle_cuota.valor_mensual} />
              <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
              <FilaDetalle label="Carga Administrativa" value={resumen.detalle_cuota.carga_administrativa} />
              <FilaDetalle label="IVA Carga Admin." value={resumen.detalle_cuota.iva_carga_administrativa} />

              <Box sx={styles.totalFooter}>
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
  );
};

// --- COMPONENTES AUXILIARES ---

const FilaDetalle: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
    <Typography variant="body2" fontWeight={700}>
      ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
    </Typography>
  </Box>
);

const StatusCard: React.FC<{ label: string; value: number; color: 'success' | 'error' | 'default' }> = ({ label, value, color }) => {
  const theme = useTheme();
  const isDefault = color === 'default';

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        flex: 1, p: 2, textAlign: 'center', borderRadius: 3,
        bgcolor: isDefault ? 'background.default' : alpha(theme.palette[color].main, 0.04),
        borderColor: isDefault ? 'divider' : alpha(theme.palette[color].main, 0.2),
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' }
      }}
    >
      <Typography variant="h4" fontWeight="900" color={isDefault ? 'text.primary' : `${color}.main`}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
    </Paper>
  );
};

export default DetalleResumenModal;
// src/pages/Admin/Pujas/modals/DetallePujaModal.tsx

import type { PujaDto } from '@/core/types/puja.dto';
import { BaseModal } from '@/shared';
import {
  CalendarToday,
  EmojiEvents,
  Gavel,
  Business as LoteIcon,
  OpenInNew,
  Person,
  Receipt,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// INTERFACE DE PROPS
// ============================================================================
interface Props {
  open: boolean;
  onClose: () => void;
  puja: PujaDto | null;
  loteName?: string;
  userName?: string;
  isHighest?: boolean | null;
  rankingPosition?: number | null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const DetallePujaModal: React.FC<Props> = ({
  open, onClose, puja, loteName, userName, isHighest, rankingPosition
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // --- Lógica de Estado y Colores ---
  const statusConfig = useMemo(() => {
    if (!puja) return { color: 'primary' as const, label: 'S/D' };
    const status = puja.estado_puja;
    switch (status) {
      case 'ganadora_pagada': return { color: 'success' as const, label: 'GANADORA PAGADA' };
      case 'ganadora_pendiente': return { color: 'warning' as const, label: 'GANADORA PENDIENTE' };
      case 'activa': return { color: 'info' as const, label: 'PUJA ACTIVA' };
      case 'ganadora_incumplimiento': return { color: 'error' as const, label: 'INCUMPLIMIENTO' };
      default: return { color: 'primary' as const, label: status.toUpperCase().replace('_', ' ') };
    }
  }, [puja]);

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    montoPaper: {
      p: 3, borderRadius: 3,
      border: '1px solid',
      borderColor: alpha(theme.palette[statusConfig.color].main, 0.3),
      bgcolor: alpha(theme.palette[statusConfig.color].main, 0.04),
      textAlign: 'center',
      boxShadow: `0 8px 20px -12px ${alpha(theme.palette[statusConfig.color].main, 0.4)}`
    },
    contextPaper: {
      flex: 1, p: 2.5, borderRadius: 3,
      border: '1px solid', borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.paper, 0.5)
    },
    labelCaption: {
      fontWeight: 800, fontSize: '0.65rem', color: 'text.disabled',
      textTransform: 'uppercase', letterSpacing: 1, mb: 0.5
    }
  }), [theme, statusConfig]);

  if (!puja) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Puja #${puja.id}`}
      subtitle="Expediente de oferta transaccional"
      icon={<Gavel />}
      headerColor={statusConfig.color}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem' }}
        />
      }
    >
      <Stack spacing={3.5}>

        {/* 🏆 CONTEXTO DE RANKING (Visualización dinámica) */}
        {puja.estado_puja === 'activa' && rankingPosition && (
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2)
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" fontWeight={900} color="info.main" display="block">RANKING DE SUBASTA</Typography>
                <Typography variant="body2" fontWeight={600}>
                  Posicionada en el puesto <Box component="span" sx={{ color: 'info.main', fontSize: '1.1rem' }}>#{rankingPosition}</Box> de este activo.
                </Typography>
              </Box>
              {isHighest && (
                <Chip
                  label="LIDERANDO"
                  color="success"
                  size="small"
                  icon={<EmojiEvents sx={{ fontSize: '1rem !important' }} />}
                  sx={{ fontWeight: 800 }}
                />
              )}
            </Stack>
          </Paper>
        )}

        {/* 💰 SECCIÓN: VALOR OFERTADO */}
        <Box sx={styles.montoPaper}>
          <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.5}>
            MONTO TOTAL DE LA OFERTA
          </Typography>
          <Typography variant="h2" fontWeight={900} color={`${statusConfig.color}.main`} sx={{ my: 0.5 }}>
            ${Number(puja.monto_puja).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontWeight={700}>
            OFERTA VINCULANTE - DIVISA: ARS
          </Typography>
        </Box>

        {/* 🔗 TRANSACCIÓN VINCULADA */}
        {puja.id_transaccion && (
          <Paper elevation={0} sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
                  <Receipt fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>ORDEN DE PAGO ASOCIADA</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Ref: #{puja.id_transaccion}</Typography>
                </Box>
              </Stack>
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNew />}
                onClick={() => navigate(`/admin/transacciones/${puja.id_transaccion}`)}
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                Auditar Pago
              </Button>
            </Stack>
          </Paper>
        )}

        {/* 👥 CONTEXTO: ACTORES Y OBJETIVO */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Paper elevation={0} sx={styles.contextPaper}>
            <Stack direction="row" spacing={1} mb={2.5} alignItems="center">
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={900}>IDENTIDAD DEL POSTOR</Typography>
            </Stack>
            <Stack spacing={2}>
              <Box>
                <Typography sx={styles.labelCaption}>TITULAR REGISTRADO</Typography>
                <Typography variant="body2" fontWeight={700}>{userName || 'No especificado'}</Typography>
              </Box>
              <Box>
                <Typography sx={styles.labelCaption}>ID INTERNO</Typography>
                <Typography variant="body2" color="primary.main" fontWeight={800}>USR-{puja.id_usuario}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={styles.contextPaper}>
            <Stack direction="row" spacing={1} mb={2.5} alignItems="center">
              <LoteIcon color="secondary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={900}>ACTIVO EN DISPUTA</Typography>
            </Stack>
            <Stack spacing={2}>
              <Box>
                <Typography sx={styles.labelCaption}>NOMENCLATURA DEL LOTE</Typography>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {loteName || puja.lote?.nombre_lote || `ID: ${puja.id_lote}`}
                </Typography>
              </Box>
              <Box>
                <Typography sx={styles.labelCaption}>REFERENCIA TÉCNICA</Typography>
                <Typography variant="body2" color="secondary.dark" fontWeight={800}>LT-{puja.id_lote}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* 🕒 CRONOLOGÍA */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider }}>
          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            <CalendarToday sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="subtitle2" fontWeight={900} color="text.secondary">AUDITORÍA DE TIEMPOS</Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography sx={styles.labelCaption}>REGISTRO DE OFERTA</Typography>
              <Typography variant="body2" fontWeight={700}>
                {new Date(puja.fecha_puja).toLocaleDateString('es-AR')} - {new Date(puja.fecha_puja).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
              <Box>
                <Typography sx={styles.labelCaption}>DEADLINE DE PAGO</Typography>
                <Typography variant="body2" color="error.main" fontWeight={900}>
                  {new Date(puja.fecha_vencimiento_pago).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* ⚠️ ALERTA CRÍTICA */}
        {puja.estado_puja === 'ganadora_incumplimiento' && (
          <Alert severity="error" variant="filled" icon={<Warning fontSize="small" />} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={900}>OPERACIÓN FALLIDA</Typography>
            <Typography variant="caption">
              Se ha detectado el incumplimiento de la liquidación de fondos dentro del plazo legal. El activo ha sido liberado para nueva subasta o adjudicado al postor secundario.
            </Typography>
          </Alert>
        )}

      </Stack>
    </BaseModal>
  );
};

export default DetallePujaModal;
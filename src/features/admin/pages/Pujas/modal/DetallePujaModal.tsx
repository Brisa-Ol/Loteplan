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
import type { ChipProps } from '@mui/material';
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
// ✅ Corregido: era 'process' (módulo Node.js nativo), ahora apunta a la config del proyecto
import { env } from '@/core/config/env';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

// Colores que existen en theme.palette (excluye 'default')
type PaletteColor = 'primary' | 'success' | 'warning' | 'info' | 'error';

interface StatusConfig {
  // Para theme.palette[paletteColor].main — nunca incluye 'default'
  paletteColor: PaletteColor;
  // Para el color prop del Chip — puede incluir 'default'
  chipColor: ChipProps['color'];
  label: string;
}

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

  // ✅ Dos campos separados: paletteColor (sin 'default') y chipColor (con 'default')
  const statusConfig = useMemo((): StatusConfig => {
    if (!puja) return { paletteColor: 'primary', chipColor: 'primary', label: 'S/D' };

    switch (puja.estado_puja) {
      case 'ganadora_pagada':
        return { paletteColor: 'success', chipColor: 'success', label: 'GANADORA PAGADA' };
      case 'ganadora_pendiente':
        return { paletteColor: 'warning', chipColor: 'warning', label: 'GANADORA PENDIENTE' };
      case 'activa':
        return { paletteColor: 'info', chipColor: 'info', label: 'PUJA ACTIVA' };
      case 'ganadora_incumplimiento':
        return { paletteColor: 'error', chipColor: 'error', label: 'INCUMPLIMIENTO' };
      case 'perdedora':
        return { paletteColor: 'primary', chipColor: 'default', label: 'PERDEDORA' };
      case 'cancelada':
        return { paletteColor: 'error', chipColor: 'error', label: 'CANCELADA' };
      case 'cubierto_por_puja':
        return { paletteColor: 'primary', chipColor: 'default', label: 'CUBIERTA' };
      default: {
        // ✅ Cast a string para evitar el error "toUpperCase does not exist on type 'never'"
        const estadoDesconocido = puja.estado_puja as string;
        return {
          paletteColor: 'primary',
          chipColor: 'primary',
          label: estadoDesconocido.toUpperCase().replaceAll('_', ' '),
        };
      }
    }
  }, [puja]);

  // ✅ Usa paletteColor — siempre válido en theme.palette
  const styles = useMemo(() => ({
    montoPaper: {
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: alpha(theme.palette[statusConfig.paletteColor].main, 0.3),
      bgcolor: alpha(theme.palette[statusConfig.paletteColor].main, 0.04),
      textAlign: 'center',
      boxShadow: `0 8px 20px -12px ${alpha(theme.palette[statusConfig.paletteColor].main, 0.4)}`,
    },
    contextPaper: {
      flex: 1,
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.paper, 0.5),
    },
    labelCaption: {
      fontWeight: 800,
      fontSize: '0.65rem',
      color: 'text.disabled',
      textTransform: 'uppercase',
      letterSpacing: 1,
      mb: 0.5,
    },
  }), [theme, statusConfig]);

  if (!puja) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Puja #${puja.id}`}
      subtitle="Expediente de oferta transaccional"
      icon={<Gavel />}
      headerColor={statusConfig.paletteColor}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        // ✅ chipColor admite 'default'
        <Chip
          label={statusConfig.label}
          color={statusConfig.chipColor}
          sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem' }}
        />
      }
    >
      <Stack spacing={3.5}>

        {/* 🏆 RANKING */}
        {puja.estado_puja === 'activa' && rankingPosition && (
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2),
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" fontWeight={900} color="info.main" display="block">
                  RANKING DE SUBASTA
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  Posicionada en el puesto{' '}
                  <Box component="span" sx={{ color: 'info.main', fontSize: '1.1rem' }}>
                    #{rankingPosition}
                  </Box>{' '}
                  de este activo.
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

        {/* 💰 VALOR OFERTADO */}
        <Box sx={styles.montoPaper}>
          <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.5}>
            MONTO TOTAL DE LA OFERTA
          </Typography>
          {/* ✅ paletteColor en color prop — nunca 'default' */}
          <Typography variant="h2" fontWeight={900} color={`${statusConfig.paletteColor}.main`} sx={{ my: 0.5 }}>
            ${Number(puja.monto_puja).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontWeight={700}>
            OFERTA VINCULANTE - DIVISA: {env.defaultCurrency}
          </Typography>
        </Box>

        {/* 🔗 TRANSACCIÓN VINCULADA */}
        {puja.id_transaccion && (
          <Paper elevation={0} sx={{
            p: 2, border: '1px dashed', borderColor: 'divider',
            borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.5),
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
                  <Receipt fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>ORDEN DE PAGO ASOCIADA</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Ref: #{puja.id_transaccion}
                  </Typography>
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

        {/* 👥 ACTORES */}
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
            </Stack>
          </Paper>

          <Paper elevation={0} sx={styles.contextPaper}>
            <Stack direction="row" spacing={1} mb={2.5} alignItems="center">
              <LoteIcon color="secondary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={900}>ACTIVO EN DISPUTA</Typography>
            </Stack>
            <Stack spacing={2}>
              <Box>
                <Typography sx={styles.labelCaption}>NOMBRE DEL LOTE</Typography>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {loteName || puja.lote?.nombre_lote || `ID: ${puja.id_lote}`}
                </Typography>
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
              {/* ✅ env.defaultLocale en todas las fechas */}
              <Typography variant="body2" fontWeight={700}>
                {new Date(puja.fecha_puja).toLocaleDateString(env.defaultLocale)} -{' '}
                {new Date(puja.fecha_puja).toLocaleTimeString(env.defaultLocale, { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
              <Box>
                <Typography sx={styles.labelCaption}>DEADLINE DE PAGO</Typography>
                <Typography variant="body2" color="error.main" fontWeight={900}>
                  {new Date(puja.fecha_vencimiento_pago).toLocaleDateString(env.defaultLocale)}
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
              Se ha detectado el incumplimiento de la liquidación de fondos dentro del plazo legal.
              El activo ha sido liberado para nueva subasta o adjudicado al postor secundario.
            </Typography>
          </Alert>
        )}

      </Stack>
    </BaseModal>
  );
};

export default DetallePujaModal;
// src/features/admin/components/modals/CancelacionPujaModal.tsx

import {
  AccountCircle,
  AttachMoney,
  Cancel,
  CheckCircle,
  ErrorOutline,
  Gavel,
  MailOutline,
  Person,
  ReportProblem,
  SwapHoriz,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';

import { env } from '@/core/config/env';
import type { PujaDto } from '@/core/types/puja.dto';

// ============================================================================
// TYPES
// ============================================================================

export interface CancelacionPujaModalProps {
  open: boolean;
  puja: PujaDto | null;
  /** Puja del segundo mejor postor (reserva), si existe */
  pujaReserva: PujaDto | null;
  isLoading?: boolean;
  onConfirm: (puja: PujaDto) => void;
  onClose: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const UserCard: React.FC<{
  label: string;
  labelColor: string;
  borderColor: string;
  usuario?: PujaDto['usuario'];
  monto?: number;
  fecha?: string;
  isWinner?: boolean;
}> = ({ label, labelColor, borderColor, usuario, monto, fecha, isWinner }) => {
  const theme = useTheme();

  if (!usuario) {
    return (
      <Box
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.action.disabledBackground, 0.04),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
        }}
      >
        <Typography variant="caption" color="text.disabled" fontStyle="italic">
          Sin postor de reserva
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        border: '2px solid',
        borderColor,
        bgcolor: alpha(borderColor, 0.04),
        position: 'relative',
      }}
    >
      <Chip
        label={label}
        size="small"
        sx={{
          position: 'absolute',
          top: -12,
          left: 12,
          fontWeight: 800,
          fontSize: '0.65rem',
          color: labelColor,
          bgcolor: 'background.paper',
          border: `1px solid ${borderColor}`,
        }}
      />

      <Stack spacing={1} mt={0.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(borderColor, 0.15),
              color: borderColor,
              fontSize: 14,
            }}
          >
            {usuario.nombre?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={800} lineHeight={1.2}>
              {usuario.nombre} {usuario.apellido}
            </Typography>
            {usuario.nombre_usuario && (
              <Typography variant="caption" color="text.disabled">
                @{usuario.nombre_usuario}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <MailOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {usuario.email}
          </Typography>
        </Stack>

        {monto !== undefined && (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Oferta
            </Typography>
            <Typography
              variant="body2"
              fontWeight={900}
              fontFamily="monospace"
              color={isWinner ? 'error.main' : 'success.main'}
              sx={{ textDecoration: isWinner ? 'line-through' : 'none' }}
            >
              ${Number(monto).toLocaleString(env.defaultLocale)}
            </Typography>
          </Stack>
        )}

        {fecha && (
          <Typography variant="caption" color="text.disabled" textAlign="right">
            {new Date(fecha).toLocaleDateString(env.defaultLocale)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

// ============================================================================
// MODAL PRINCIPAL
// ============================================================================

export const CancelacionPujaModal: React.FC<CancelacionPujaModalProps> = ({
  open,
  puja,
  pujaReserva,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const theme = useTheme();

  if (!puja) return null;

  const ganador = puja.usuario;
  const loteNombre = puja.lote?.nombre_lote ?? `Lote #${puja.id_lote}`;
  const montoGanador = Number(puja.monto_puja);
  const montoReserva = pujaReserva ? Number(pujaReserva.monto_puja) : null;

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* ── HEADER ── */}
      <DialogTitle
        sx={{
          p: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: alpha(theme.palette.error.main, 0.04),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReportProblem sx={{ color: 'error.main', fontSize: 22 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Solicitud de Cancelación
            </Typography>
            <Typography variant="caption" color="text.secondary">
              El ganador ha solicitado abandonar la puja adjudicada
            </Typography>
          </Box>
          {!isLoading && (
            <Tooltip title="Cerrar">
              <IconButton size="small" onClick={onClose}>
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </DialogTitle>

      {/* ── CONTENIDO ── */}
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>

          {/* Lote afectado */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Gavel sx={{ color: 'primary.main', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                LOTE AFECTADO
              </Typography>
              <Typography variant="body1" fontWeight={800} color="text.primary">
                {loteNombre}
              </Typography>
            </Box>
            <Box flex={1} textAlign="right">
              <Chip
                label={`ID #${puja.id_lote}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
              />
            </Box>
          </Box>

          {/* Motivo de cancelación */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="subtitle2" fontWeight={800} color="warning.main">
                MOTIVO DECLARADO POR EL USUARIO
              </Typography>
            </Stack>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.2),
                borderLeft: `4px solid ${theme.palette.warning.main}`,
              }}
            >
              <Typography
                variant="body2"
                color="text.primary"
                fontStyle={puja.motivo_cancelacion ? 'normal' : 'italic'}
                lineHeight={1.7}
              >
                {puja.motivo_cancelacion || 'El usuario no especificó un motivo.'}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Postores: ganador actual → reserva */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <SwapHoriz sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                TRANSFERENCIA DE ADJUDICACIÓN
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="stretch">
              <UserCard
                label="1° GANADOR (baja)"
                labelColor={theme.palette.error.main}
                borderColor={theme.palette.error.main}
                usuario={ganador}
                monto={montoGanador}
                fecha={puja.fecha_puja}
                isWinner
              />

              <Box display="flex" alignItems="center" justifyContent="center" px={1}>
                <Stack alignItems="center" spacing={0.5}>
                  <SwapHoriz sx={{ color: 'text.disabled', fontSize: 28 }} />
                  <Typography variant="caption" color="text.disabled" fontWeight={700}>
                    PASA A
                  </Typography>
                </Stack>
              </Box>

              <UserCard
                label="2° POSTOR (reserva)"
                labelColor={theme.palette.success.main}
                borderColor={theme.palette.success.main}
                usuario={pujaReserva?.usuario}
                monto={montoReserva ?? undefined}
                fecha={pujaReserva?.fecha_puja}
              />
            </Stack>
          </Box>

          {/* Advertencia de consecuencia */}
          {!pujaReserva && (
            <Alert
              severity="warning"
              icon={<ErrorOutline />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              No hay postor de reserva. Aprobar esta baja dejará el lote <strong>sin adjudicatario</strong>.
            </Alert>
          )}

          <Alert
            severity="error"
            icon={<ErrorOutline />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Esta acción es <strong>irreversible</strong>. El ganador actual perderá la adjudicación
            y se registrará un incumplimiento en su historial.
          </Alert>
        </Stack>
      </DialogContent>

      {/* ── ACCIONES ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isLoading}
          sx={{ fontWeight: 700, borderRadius: 2, flex: 1 }}
        >
          Rechazar solicitud
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={() => onConfirm(puja)}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <CheckCircle />
            )
          }
          sx={{
            fontWeight: 800,
            borderRadius: 2,
            flex: 1,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {isLoading ? 'Procesando...' : 'Aprobar baja'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelacionPujaModal;
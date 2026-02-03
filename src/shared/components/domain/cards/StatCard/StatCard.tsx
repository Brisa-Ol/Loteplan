import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
  type ChipProps,
} from '@mui/material';
import React from 'react';

// ============================================================================
// TIPOS COMPARTIDOS
// ============================================================================

type StatColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'in_progress'
  | 'failed'
  | 'warning'
  | 'success'
  | 'error'
  | 'info';

// ============================================================================
// COMPONENTE: STATUS BADGE
// Chip de estado reutilizable en cualquier parte de la app
// ============================================================================

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  customLabel?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; color: ChipProps['color']; variant: ChipProps['variant'] }
> = {
  active: { label: 'ACTIVO', color: 'success', variant: 'filled' },
  inactive: { label: 'INACTIVO', color: 'default', variant: 'outlined' },
  pending: { label: 'PENDIENTE', color: 'warning', variant: 'outlined' },
  approved: { label: 'APROBADO', color: 'success', variant: 'outlined' },
  rejected: { label: 'RECHAZADO', color: 'error', variant: 'outlined' },
  completed: { label: 'COMPLETADO', color: 'success', variant: 'filled' },
  in_progress: { label: 'EN PROCESO', color: 'info', variant: 'filled' },
  failed: { label: 'FALLIDO', color: 'error', variant: 'filled' },
  warning: { label: 'ADVERTENCIA', color: 'warning', variant: 'filled' },
  success: { label: 'ÉXITO', color: 'success', variant: 'filled' },
  error: { label: 'ERROR', color: 'error', variant: 'filled' },
  info: { label: 'INFO', color: 'info', variant: 'outlined' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  sx,
  ...chipProps
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <Chip
      label={customLabel || config.label}
      color={config.color}
      variant={config.variant}
      size="small"
      sx={{
        fontWeight: 800,
        fontSize: '0.65rem',
        minWidth: 90,
        ...sx,
      }}
      {...chipProps}
    />
  );
};

// ============================================================================
// COMPONENTE: STAT CARD
// Tarjeta de métrica. El badge interno delega al StatusBadge cuando se le
// pasa un `status`, o muestra un chip simple si solo se le pasa texto.
// El ancho se amolda al contenido (no se fija height ni width).
// ============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: StatColor;
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  /** Badge como texto libre → chip simple con el color de la card */
  badge?: string;
  /** Badge como estado tipado → delega a StatusBadge */
  badgeStatus?: StatusType;
  /** Etiqueta personalizada cuando se usa badgeStatus */
  badgeLabel?: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
  onClick,
  subtitle,
  trend,
  badge,
  badgeStatus,
  badgeLabel,
  compact = false,
}) => {
  const theme = useTheme();

  // Si el color es 'info' se mapea a 'primary' para evitar el azul por defecto de MUI
  const safeColor = color === 'info' ? 'primary' : color;
  const paletteColor = theme.palette[safeColor as StatColor] || theme.palette.primary;

  // ── Badge: StatusBadge tiene prioridad sobre texto libre ──────────────────
  const renderBadge = () => {
    if (loading) return null;

    if (badgeStatus) {
      return (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <StatusBadge status={badgeStatus} customLabel={badgeLabel} />
        </Box>
      );
    }

    if (badge) {
      return (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            height: 18,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: alpha(paletteColor.main, 0.1),
            color: paletteColor.main,
            borderRadius: 1,
            border: `1px solid ${alpha(paletteColor.main, 0.2)}`,
          }}
        />
      );
    }

    return null;
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: compact ? 2 : 2.5,
        // ── Sizing adaptativo al contenido ──────────────────────────────────
        width: 'fit-content',
        minWidth: compact ? 180 : 220,
        maxWidth: '100%',
        // ────────────────────────────────────────────────────────────────────
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 2,
        border: '1px solid',
        borderColor: theme.palette.secondary.main,
        bgcolor: theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',

        // Acento lateral
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: 4,
          borderRadius: '0 4px 4px 0',
          bgcolor: paletteColor.main,
          opacity: 0.8,
        },

        '&:hover': {
          borderColor: paletteColor.main,
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          '& .stat-avatar': {
            transform: 'scale(1.1) rotate(-5deg)',
            bgcolor: alpha(paletteColor.main, 0.2),
          },
        },
      }}
    >
      {renderBadge()}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
        {/* Icono */}
        <Avatar
          className="stat-avatar"
          variant="rounded"
          sx={{
            bgcolor: alpha(paletteColor.main, 0.1),
            color: paletteColor.main,
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            borderRadius: 1,
            transition: 'all 0.3s ease',
            flexShrink: 0,
            '& svg': { fontSize: compact ? '1.3rem' : '1.6rem' },
          }}
        >
          {icon}
        </Avatar>

        {/* Contenido */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Stack spacing={0.5}>
              <Skeleton variant="text" width="40%" height={15} />
              <Skeleton variant="text" width="70%" height={35} />
            </Stack>
          ) : (
            <>
              {/* Título */}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: -0.5,
                  fontSize: compact ? '0.6rem' : '0.7rem',
                  lineHeight: 1,
                }}
              >
                {title}
              </Typography>

              {/* Valor + Tendencia */}
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  color="text.primary"
                  sx={{
                    fontSize: compact ? '1.35rem' : '1.75rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value}
                </Typography>

                {trend && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.8,
                      py: 0.2,
                      borderRadius: 1,
                      bgcolor:
                        trend.isPositive === false
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.success.main, 0.1),
                      color: trend.isPositive === false ? 'error.main' : 'success.main',
                    }}
                  >
                    {trend.isPositive === false ? (
                      <TrendingDownIcon sx={{ fontSize: 12 }} />
                    ) : (
                      <TrendingUpIcon sx={{ fontSize: 12 }} />
                    )}
                    <Typography variant="caption" fontWeight={800} sx={{ ml: 0.3, fontSize: '0.7rem' }}>
                      {trend.value}%
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Subtítulo */}
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 0.5,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    '&::before': {
                      content: '""',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: paletteColor.main,
                      mr: 1,
                    },
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};
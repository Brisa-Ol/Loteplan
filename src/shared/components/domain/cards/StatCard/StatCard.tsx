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
        fontSize: { xs: '0.55rem', sm: '0.65rem' }, // Texto más pequeño en móvil
        height: { xs: 20, sm: 24 }, // Altura adaptable
        minWidth: 'auto',
        maxWidth: '100%',
        ...sx,
      }}
      {...chipProps}
    />
  );
};

// ============================================================================
// COMPONENTE: STAT CARD RESPONSIVE
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
  badge?: string;
  badgeStatus?: StatusType;
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
  const safeColor = color === 'info' ? 'primary' : color;
  const paletteColor = theme.palette[safeColor as StatColor] || theme.palette.primary;

  const renderBadge = () => {
    if (loading) return null;

    // Posicionamiento responsivo del badge
    const badgePositionSx = {
      position: 'absolute',
      top: { xs: 8, sm: 12 },
      right: { xs: 8, sm: 12 },
      zIndex: 2,
    };

    if (badgeStatus) {
      return (
        <Box sx={badgePositionSx}>
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
            ...badgePositionSx,
            height: { xs: 16, sm: 18 },
            fontSize: { xs: '0.55rem', sm: '0.65rem' },
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
        // ── RESPONSIVE PADDING ──────────────────────────────────────────────
        p: compact ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 2.5 },
        
        // ── WIDTH & HEIGHT ──────────────────────────────────────────────────
        width: '100%', // Ocupa todo el ancho del grid/padre
        height: '100%', // Para que todas las cards en una fila tengan la misma altura
        minWidth: 0, // CRÍTICO: Permite que el flexbox encoja el contenido (truncamiento)
        
        // ── LAYOUT ──────────────────────────────────────────────────────────
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        
        // ── ESTILOS VISUALES ────────────────────────────────────────────────
        borderRadius: 2,
        border: '1px solid',
        borderColor: theme.palette.divider, // Un color más neutro por defecto
        bgcolor: theme.palette.background.paper,
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
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? '0 8px 24px rgba(0, 0, 0, 0.12)' : 'none',
          '& .stat-avatar': {
            transform: 'scale(1.1) rotate(-5deg)',
            bgcolor: alpha(paletteColor.main, 0.2),
          },
        },
      }}
    >
      {renderBadge()}

      <Stack 
        direction="row" 
        spacing={{ xs: 1.5, sm: 2 }} 
        alignItems="center" 
        sx={{ width: '100%', overflow: 'hidden' }}
      >
        {/* Icono Responsive */}
        <Avatar
          className="stat-avatar"
          variant="rounded"
          sx={{
            bgcolor: alpha(paletteColor.main, 0.1),
            color: paletteColor.main,
            // Tamaño adaptativo
            width: compact ? { xs: 36, sm: 44 } : { xs: 42, sm: 52 },
            height: compact ? { xs: 36, sm: 44 } : { xs: 42, sm: 52 },
            borderRadius: { xs: 1, sm: 1.5 },
            transition: 'all 0.3s ease',
            flexShrink: 0,
            '& svg': { 
              fontSize: compact ? { xs: '1.1rem', sm: '1.3rem' } : { xs: '1.4rem', sm: '1.6rem' } 
            },
          }}
        >
          {icon}
        </Avatar>

        {/* Contenido con minWidth 0 para permitir truncate */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Stack spacing={0.5}>
              <Skeleton variant="text" width="60%" height={15} />
              <Skeleton variant="text" width="90%" height={35} />
            </Stack>
          ) : (
            <>
              {/* Título truncable */}
              <Typography
                variant="overline"
                color="text.secondary"
                noWrap // Corta el texto con "..." si es muy largo
                sx={{
                  display: 'block',
                  mb: { xs: -0.2, sm: -0.5 },
                  fontSize: compact ? { xs: '0.55rem', sm: '0.6rem' } : { xs: '0.65rem', sm: '0.7rem' },
                  lineHeight: 1.2,
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>

              {/* Valor + Tendencia */}
              <Stack 
                direction="row" 
                alignItems="baseline" 
                spacing={1} 
                sx={{ flexWrap: 'wrap', rowGap: 0.5 }} // Permite wrap si es muy estrecho
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  color="text.primary"
                  noWrap
                  sx={{
                    // Tipografía fluida
                    fontSize: compact 
                      ? { xs: '1.1rem', sm: '1.35rem' } 
                      : { xs: '1.4rem', md: '1.75rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </Typography>

                {trend && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.6,
                      py: 0.1,
                      borderRadius: 1,
                      bgcolor: trend.isPositive === false
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.success.main, 0.1),
                      color: trend.isPositive === false ? 'error.main' : 'success.main',
                      whiteSpace: 'nowrap', // El trend no debe romperse
                    }}
                  >
                    {trend.isPositive === false ? (
                      <TrendingDownIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
                    ) : (
                      <TrendingUpIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
                    )}
                    <Typography 
                      variant="caption" 
                      fontWeight={800} 
                      sx={{ ml: 0.3, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                    >
                      {trend.value}%
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Subtítulo truncable */}
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 0.5,
                    fontWeight: 500,
                    fontSize: { xs: '0.6rem', sm: '0.7rem' },
                    '&::before': {
                      content: '""',
                      flexShrink: 0, // El punto no se encoge
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
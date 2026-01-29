import React from 'react';
import { Paper, Box, Typography, Avatar, alpha, useTheme, Skeleton, Chip, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

type StatColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

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
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary', // ✅ Por defecto naranja #CC6333
  loading = false,
  onClick,
  subtitle,
  trend,
  badge,
  compact = false
}) => {
  const theme = useTheme();
  
  // ✅ Sincronización de color: Si es 'info', forzamos primary para evitar el azul de MUI
  const safeColor = color === 'info' ? 'primary' : color;
  const paletteColor = theme.palette[safeColor as StatColor] || theme.palette.primary;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: compact ? 2 : 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 2, // ✅ 16px - Sincronizado con MuiTableContainer
        border: '1px solid',
        borderColor: theme.palette.secondary.main, // #ECECEC
        bgcolor: theme.palette.background.default, // #FFFFFF
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        
        // ✅ Acento lateral con tu naranja primario
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
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', // ✅ Sincronizado con MuiCard:hover
          '& .stat-avatar': {
            transform: 'scale(1.1) rotate(-5deg)',
            bgcolor: alpha(paletteColor.main, 0.2),
          }
        }
      }}
    >
      {badge && !loading && (
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
            borderRadius: 1, // 8px
            border: `1px solid ${alpha(paletteColor.main, 0.2)}`,
          }}
        />
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
        <Avatar
          className="stat-avatar"
          variant="rounded"
          sx={{
            bgcolor: alpha(paletteColor.main, 0.1),
            color: paletteColor.main,
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            borderRadius: 1, // ✅ 8px - Sincronizado con shape.borderRadius
            transition: 'all 0.3s ease',
            flexShrink: 0,
            '& svg': { fontSize: compact ? '1.3rem' : '1.6rem' }
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Stack spacing={0.5}>
              <Skeleton variant="text" width="40%" height={15} />
              <Skeleton variant="text" width="70%" height={35} />
            </Stack>
          ) : (
            <>
              <Typography
                variant="overline" // ✅ Uso de overline definido en tu theme (Inter, 600, Uppercase)
                color="text.secondary"
                sx={{ 
                  display: 'block',
                  mb: -0.5,
                  fontSize: compact ? '0.6rem' : '0.7rem',
                  lineHeight: 1
                }}
              >
                {title}
              </Typography>

              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography 
                  variant="h4" // ✅ Inter, 600-700
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
                      bgcolor: trend.isPositive === false ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                      color: trend.isPositive === false ? 'error.main' : 'success.main',
                    }}
                  >
                    {trend.isPositive === false ? <TrendingDownIcon sx={{ fontSize: 12 }} /> : <TrendingUpIcon sx={{ fontSize: 12 }} />}
                    <Typography variant="caption" fontWeight={800} sx={{ ml: 0.3, fontSize: '0.7rem' }}>
                      {trend.value}%
                    </Typography>
                  </Box>
                )}
              </Stack>

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
                    }
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
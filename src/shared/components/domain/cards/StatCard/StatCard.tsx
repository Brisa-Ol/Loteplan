// src/components/common/StatCard/StatCard.tsx

import React from 'react';
import { Paper, Box, Typography, Avatar, alpha, useTheme, Skeleton, Chip } from '@mui/material';
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
  badge?: string; // Nuevo: Badge para destacar (ej: "Nuevo", "+10%")
  compact?: boolean; // Nuevo: Modo compacto para dashboards densos
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
  compact = false
}) => {
  const theme = useTheme();
  const paletteColor = theme.palette[color];

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: compact ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 2.5 },
        display: 'flex',
        alignItems: 'center',
        gap: compact ? { xs: 1, sm: 1.5 } : { xs: 1.5, sm: 2 },
        borderRadius: { xs: 2, sm: 2.5 },
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Más fluido
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        
        // Mejora e-commerce: Borde superior de color como en Stripe/Shopify
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${paletteColor.main}, ${paletteColor.light})`,
          opacity: 0.8,
        },

        '&:hover': onClick ? {
          borderColor: paletteColor.main,
          transform: 'translateY(-2px)', // Más sutil que -4px
          boxShadow: `0 4px 20px ${alpha(paletteColor.main, 0.15)}`, // Shadow con color del tema
          '&::before': {
            opacity: 1
          }
        } : {},

        // Gradiente de fondo sutil
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at top right, ${alpha(paletteColor.main, 0.03)}, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }
      }}
    >
      {/* Badge superior derecho (patrón e-commerce) */}
      {badge && !loading && (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            bgcolor: alpha(paletteColor.main, 0.12),
            color: paletteColor.main,
            border: `1px solid ${alpha(paletteColor.main, 0.3)}`,
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
      )}

      {/* Avatar con mejoras visuales */}
      <Avatar
        variant="rounded"
        sx={{
          bgcolor: alpha(paletteColor.main, 0.12), // Más sutil
          color: paletteColor.main,
          width: compact ? { xs: 40, sm: 48 } : { xs: 48, sm: 56 },
          height: compact ? { xs: 40, sm: 48 } : { xs: 48, sm: 56 },
          borderRadius: 2,
          border: `2px solid ${alpha(paletteColor.main, 0.2)}`, // Borde sutil
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(onClick && {
            '&:hover': {
              transform: 'scale(1.08) rotate(5deg)', // Efecto más dinámico
              bgcolor: alpha(paletteColor.main, 0.2),
            }
          }),
          // Icono responsivo
          '& svg': {
            fontSize: compact ? '1.25rem' : '1.5rem'
          }
        }}
      >
        {icon}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <Box sx={{ width: '100%' }}>
            <Skeleton 
              variant="text" 
              width="60%" 
              height={compact ? 32 : 40} 
              sx={{ mb: 0.5 }}
            />
            <Skeleton 
              variant="text" 
              width="80%" 
              height={20} 
            />
          </Box>
        ) : (
          <>
            {/* Título primero (mejor jerarquía visual) */}
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ 
                textTransform: 'uppercase', 
                letterSpacing: 0.8,
                display: 'block',
                mb: 0.5,
                fontSize: compact ? '0.625rem' : { xs: '0.6875rem', sm: '0.75rem' }
              }}
            >
              {title}
            </Typography>

            {/* Valor con tendencia en línea */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography 
                variant="h4"
                fontWeight={700} 
                color="text.primary"
                sx={{ 
                  lineHeight: 1.1,
                  fontSize: compact 
                    ? { xs: '1.25rem', sm: '1.5rem' }
                    : { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {value}
              </Typography>
              
              {/* Tendencia mejorada con iconos (patrón Stripe/Vercel) */}
              {trend && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: trend.isPositive === false 
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  {trend.isPositive === false ? (
                    <TrendingDownIcon sx={{ fontSize: '0.875rem', color: 'error.main' }} />
                  ) : (
                    <TrendingUpIcon sx={{ fontSize: '0.875rem', color: 'success.main' }} />
                  )}
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: trend.isPositive === false ? 'error.main' : 'success.main',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                    }}
                  >
                    {Math.abs(trend.value)}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Subtítulo con color del tema */}
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary" // Más sutil que usar el color del tema
                fontWeight={500}
                sx={{ 
                  display: 'block',
                  mt: 0.5,
                  fontSize: compact ? '0.625rem' : { xs: '0.6875rem', sm: '0.75rem' },
                  // Punto de color antes del texto (detalles e-commerce)
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: paletteColor.main,
                    mr: 0.5,
                    mb: 0.25,
                  }
                }}
              >
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};
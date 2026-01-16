// src/components/common/StatCard/StatCard.tsx

import React from 'react';
import { Paper, Box, Typography, Avatar, alpha, useTheme, Skeleton } from '@mui/material';

// ✅ BUENA PRÁCTICA: Type safety para colores permitidos
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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
  onClick,
  subtitle,
  trend
}) => {
  // ✅ BUENA PRÁCTICA: Acceso al tema para colores dinámicos
  const theme = useTheme();
  const paletteColor = theme.palette[color];

  return (
    <Paper
      elevation={0} // ✅ Usa el sistema de elevación del tema
      onClick={onClick}
      sx={{
        p: { xs: 2, sm: 2.5 }, // ✅ RESPONSIVE: Padding adaptable
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.5, sm: 2 }, // ✅ RESPONSIVE: Gap adaptable
        borderRadius: { xs: 2, sm: 3 }, // ✅ RESPONSIVE: Border radius adaptable
        border: '1px solid',
        borderColor: 'divider', // ✅ Usa token del tema
        bgcolor: 'background.paper', // ✅ Usa token del tema
        transition: 'all 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default', // ✅ BUENA PRÁCTICA: Cursor contextual
        userSelect: 'none',
        position: 'relative', 
        overflow: 'hidden',
        '&:hover': onClick ? {
          borderColor: paletteColor.main, // ✅ Usa color del tema dinámicamente
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4], // ✅ Usa shadow del tema
          '&::before': {
            opacity: 1
          }
        } : {},
        // ✅ BUENA PRÁCTICA: Pseudo-elemento para efecto de gradiente sutil
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, transparent 0%, ${alpha(paletteColor.main, 0.05)} 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }
      }}
    >
      {/* ✅ BUENA PRÁCTICA: Avatar con variant y colores del tema */}
      <Avatar
        variant="rounded"
        sx={{
          bgcolor: alpha(paletteColor.main, 0.1), // ✅ Usa alpha del tema
          color: paletteColor.main,
          width: { xs: 48, sm: 56 }, // ✅ RESPONSIVE
          height: { xs: 48, sm: 56 }, // ✅ RESPONSIVE
          borderRadius: 2,
          transition: 'transform 0.2s ease',
          ...(onClick && {
            '&:hover': {
              transform: 'scale(1.1)'
            }
          })
        }}
      >
        {icon}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}> {/* ✅ minWidth: 0 previene overflow */}
        {/* ✅ BUENA PRÁCTICA: Estado de carga con Skeleton */}
        {loading ? (
          <Box sx={{ width: '100%' }}>
            <Skeleton 
              variant="text" 
              width="60%" 
              height={40} 
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
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              {/* ✅ RESPONSIVE: Fuente adaptable */}
              <Typography 
                variant="h4" // ✅ Usa variant del tema
                fontWeight={700} 
                color="text.primary" // ✅ Usa token del tema
                sx={{ 
                  lineHeight: 1.2,
                  fontSize: { xs: '1.5rem', sm: '2rem' } // ✅ RESPONSIVE
                }}
              >
                {value}
              </Typography>
              
              {/* ✅ BUENA PRÁCTICA: Indicador de tendencia opcional */}
              {trend && (
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{
                    color: trend.isPositive === false 
                      ? 'error.main' // ✅ Usa token del tema
                      : 'success.main', // ✅ Usa token del tema
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25
                  }}
                >
                  {trend.isPositive === false ? '↓' : '↑'} {Math.abs(trend.value)}%
                </Typography>
              )}
            </Box>
            
            {/* ✅ RESPONSIVE: Fuente adaptable */}
            <Typography
              variant="caption" // ✅ Usa variant del tema
              fontWeight={600}
              color="text.secondary" // ✅ Usa token del tema
              noWrap
              sx={{ 
                textTransform: 'uppercase', 
                letterSpacing: 0.5,
                display: 'block',
                fontSize: { xs: '0.6875rem', sm: '0.75rem' } // ✅ RESPONSIVE
              }}
            >
              {title}
            </Typography>

            {/* ✅ BUENA PRÁCTICA: Subtítulo opcional */}
            {subtitle && (
              <Typography
                variant="caption"
                color={paletteColor.main} // ✅ Usa color dinámico del tema
                fontWeight={600}
                sx={{ 
                  display: 'block',
                  mt: 0.5,
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' } // ✅ RESPONSIVE
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
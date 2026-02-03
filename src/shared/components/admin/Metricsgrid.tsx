import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

// ============================================================================
// COMPONENTE: METRICS GRID
// Grid css-grid nativo optimizado para tarjetas de métricas
// ============================================================================

interface MetricsGridProps {
  children: React.ReactNode;
  /**
   * Número de columnas por breakpoint.
   * Default: { xs: 1, sm: 2, lg: 4 }
   */
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Multiplicador del spacing del theme (8px).
   * Default: 3 (24px)
   */
  spacing?: number;
  sx?: SxProps<Theme>;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  children,
  columns = {}, // Dejamos vacío para manejar defaults en la lógica
  spacing = 3,  // 24px se ve mejor con bordes de 12px
  sx,
}) => {
  // Configuración de defaults con estrategia Mobile-First
  // Si no se especifica un breakpoint, intenta heredar del anterior o usa el default
  const cols = {
    xs: columns.xs || 1,
    sm: columns.sm || columns.xs || 2, // Si xs es 1, sm default es 2.
    md: columns.md || columns.sm || 2,
    lg: columns.lg || columns.md || 4, // En pantallas grandes saltamos a 4
    xl: columns.xl || columns.lg || 4,
  };

  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        // La magia de CSS Grid responsive en una sola línea
        gridTemplateColumns: {
          xs: `repeat(${cols.xs}, 1fr)`,
          sm: `repeat(${cols.sm}, 1fr)`,
          md: `repeat(${cols.md}, 1fr)`,
          lg: `repeat(${cols.lg}, 1fr)`,
          xl: `repeat(${cols.xl}, 1fr)`,
        },
        // 'gap' en sx usa automáticamente theme.spacing (3 * 8px = 24px)
        gap: spacing, 
        mb: 4,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default MetricsGrid;
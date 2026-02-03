import { GridView, ViewList } from '@mui/icons-material';
import { Box, ToggleButton, ToggleButtonGroup, alpha, useTheme } from '@mui/material';
import React from 'react';

// ============================================================================
// COMPONENTE: VIEW MODE TOGGLE
// Toggle estilo "Segmented Control" consistente con el theme
// ============================================================================

export type ViewMode = 'table' | 'grid' | 'cards' | 'analytics';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  options?: Array<{ value: ViewMode; label: string; icon: React.ReactNode }>;
  size?: 'small' | 'medium';
}

const DEFAULT_OPTIONS = [
  { value: 'table' as ViewMode, label: 'Lista', icon: <ViewList fontSize="small" /> },
  { value: 'grid' as ViewMode, label: 'Mosaico', icon: <GridView fontSize="small" /> },
];

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  size = 'small',
}) => {
  const theme = useTheme();

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newMode) => newMode && onChange(newMode)}
      size={size}
      sx={{
        // Contenedor tipo "cápsula"
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        border: '1px solid',
        borderColor: 'divider',
        p: 0.5, // Padding interno para efecto "flotante"
        gap: 0.5, // Espacio entre botones
        borderRadius: '12px', // Coincide con tus Cards

        // Estilos para los botones hijos
        '& .MuiToggleButton-root': {
          border: 'none', // Quitamos bordes individuales
          borderRadius: '8px !important', // Bordes internos más pequeños
          color: 'text.secondary',
          px: 2,
          transition: 'all 0.2s ease-in-out',

          // Tipografía consistente
          textTransform: 'none',
          fontWeight: 600, // Coincide con theme.typography.button

          // ESTADO ACTIVO: Usamos el color Primario (Naranja)
          '&.Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontWeight: 700,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
            },
          },

          // Hover normal
          '&:hover': {
            bgcolor: alpha(theme.palette.text.primary, 0.05),
          },
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {/* Flexbox para alinear icono y texto verticalmente perfecto */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.icon}
            {/* Ocultamos texto en móbiles muy pequeños si es necesario, o lo dejamos */}
            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {option.label}
            </Box>
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default ViewModeToggle;
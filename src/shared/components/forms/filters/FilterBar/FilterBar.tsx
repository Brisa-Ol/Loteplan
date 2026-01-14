// src/components/common/FilterBar/FilterBar.tsx

import React from 'react';
import { 
  Paper, 
  Stack, 
  TextField, 
  useTheme, 
  alpha,
  type TextFieldProps 
} from '@mui/material';

// =============================================================================
// 1. FilterBar (Contenedor Layout)
// =============================================================================
interface FilterBarProps {
  children: React.ReactNode;
  elevation?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  children, 
  elevation = 0 
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={elevation}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.paper, 0.6)
      }}
    >
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {children}
      </Stack>
    </Paper>
  );
};

// =============================================================================
// 2. FilterSelect (Input Especializado con Scroll)
// =============================================================================
/**
 * Componente TextField pre-configurado para filtros tipo Select.
 * Incluye scroll personalizado y altura máxima para listas largas.
 */
export const FilterSelect: React.FC<TextFieldProps> = (props) => {
  const theme = useTheme();

  return (
    <TextField
      select
      variant="outlined"
      size="small"
      {...props}
      InputProps={{
        ...props.InputProps,
        sx: {
          borderRadius: 2,
          ...props.InputProps?.sx
        }
      }}
      SelectProps={{
        ...props.SelectProps,
        MenuProps: {
          ...props.SelectProps?.MenuProps,
          // ✅ CRÍTICO: Ajustar posición y comportamiento
          autoFocus: false,
          disableAutoFocusItem: true,
          PaperProps: {
            ...props.SelectProps?.MenuProps?.PaperProps,
            elevation: 8,
            sx: {
              // ✅ Altura máxima y scroll
              maxHeight: 320,
              minWidth: 220,
              borderRadius: 2,
              mt: 1,
              
              // ✅ Scrollbar personalizado (Webkit - Chrome, Safari, Edge)
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                }
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.grey[300], 0.2),
                borderRadius: 4,
              },
              
              // ✅ Scrollbar para Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: `${alpha(theme.palette.primary.main, 0.3)} ${alpha(theme.palette.grey[300], 0.2)}`,
              
              // ✅ Sombra interna para indicar scroll
              background: `
                linear-gradient(white 30%, rgba(255,255,255,0)),
                linear-gradient(rgba(255,255,255,0), white 70%) 0 100%,
                radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.12), rgba(0,0,0,0)),
                radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.12), rgba(0,0,0,0)) 0 100%
              `,
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'white',
              backgroundSize: '100% 40px, 100% 40px, 100% 14px, 100% 14px',
              backgroundAttachment: 'local, local, scroll, scroll',
              
              // Fusionar con sx externos
              ...(props.SelectProps?.MenuProps?.PaperProps?.sx || {})
            }
          }
        }
      }}
      // ✅ Estilos del campo base
      sx={{
        minWidth: { xs: '100%', sm: 200 },
        ...props.sx
      }}
    />
  );
};

// =============================================================================
// 3. FilterSearch (Input de Búsqueda Especializado)
// =============================================================================
/**
 * TextField pre-configurado para búsqueda con InputAdornment incluido
 */
interface FilterSearchProps extends Omit<TextFieldProps, 'InputProps'> {
  onSearch?: (value: string) => void;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({ 
  onSearch, 
  ...props 
}) => {
  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder="Buscar..."
      {...props}
      onChange={(e) => {
        onSearch?.(e.target.value);
        props.onChange?.(e);
      }}
      InputProps={{
        sx: {
          borderRadius: 2,
        }
      }}
      sx={{
        flexGrow: 1,
        minWidth: { xs: '100%', sm: 200 },
        ...props.sx
      }}
    />
  );
};
import React from 'react';
import { 
  Paper, 
  Stack, 
  TextField, 
  useTheme, 
  alpha,
  Box,
  InputAdornment,
  type TextFieldProps 
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// =============================================================================
// 1. FilterBar (Contenedor con efecto Glassmorphism)
// =============================================================================
interface FilterBarProps {
  children: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 3, // Bordes más suaves
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        // Efecto de cristal esmerilado
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 20px -5px ${alpha(theme.palette.common.black, 0.05)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 30px -10px ${alpha(theme.palette.common.black, 0.08)}`,
        }
      }}
    >
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2.5} // Espaciado más amplio y "aireado"
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {children}
      </Stack>
    </Paper>
  );
};

// =============================================================================
// 2. FilterSelect (Dropdown Premium con Scroll)
// =============================================================================
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
          borderRadius: 2.5,
          bgcolor: alpha(theme.palette.action.hover, 0.02),
          fontWeight: 500,
          '&:hover fieldset': { borderColor: theme.palette.primary.main },
          ...props.InputProps?.sx
        }
      }}
      SelectProps={{
        ...props.SelectProps,
        MenuProps: {
          ...props.SelectProps?.MenuProps,
          autoFocus: false,
          PaperProps: {
            elevation: 12,
            sx: {
              maxHeight: 400,
              minWidth: 240,
              borderRadius: 2.5,
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              // Scrollbar Premium
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 10,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.4) }
              },
              ...props.SelectProps?.MenuProps?.PaperProps?.sx
            }
          }
        }
      }}
      sx={{
        minWidth: { xs: '100%', sm: 220 },
        '& .MuiInputLabel-root': { fontWeight: 600, fontSize: '0.85rem' },
        ...props.sx
      }}
    />
  );
};

// =============================================================================
// 3. FilterSearch (Input con Icono Inteligente)
// =============================================================================
interface FilterSearchProps extends Omit<TextFieldProps, 'InputProps'> {
  onSearch?: (value: string) => void;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({ 
  onSearch, 
  ...props 
}) => {
  const theme = useTheme();

  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder="Buscar en la base de datos..."
      {...props}
      onChange={(e) => {
        onSearch?.(e.target.value);
        props.onChange?.(e);
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          </InputAdornment>
        ),
        sx: {
          borderRadius: 2.5,
          bgcolor: alpha(theme.palette.action.hover, 0.03),
          pr: 1,
          '& fieldset': { borderColor: alpha(theme.palette.divider, 0.15) },
          '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
          '&.Mui-focused fieldset': { borderWidth: '1.5px !important' },
        }
      }}
      sx={{
        flexGrow: 1,
        minWidth: { xs: '100%', sm: 300 },
        ...props.sx
      }}
    />
  );
};
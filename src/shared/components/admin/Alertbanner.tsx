import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Stack,
  Typography,
  alpha,
  useTheme,
  Box,
  type AlertProps,
  type PaletteColor
} from '@mui/material';

// ============================================================================
// COMPONENTE: ALERT BANNER
// Alertas prioritarias consistentes para notificaciones críticas
// ============================================================================

interface AlertBannerProps {
  severity: 'success' | 'info' | 'warning' | 'error'; // Tipado estricto para machear con tu theme
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  onClose?: () => void;
  sx?: AlertProps['sx'];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  severity = 'info',
  title,
  message,
  action,
  icon,
  onClose,
  sx,
}) => {
  const theme = useTheme();

  // Acceso seguro al color del theme
  const colorPalette = theme.palette[severity] as PaletteColor;

  return (
    <Alert
      severity={severity}
      icon={icon}
      onClose={onClose}
      sx={{
        mb: 3,
        // 1. MEJORA: Usamos '12px' para coincidir con tus Cards y Skeletons del theme
        borderRadius: '12px',
        border: '1px solid', // 2px suele ser muy grueso, 1px es más elegante
        borderColor: colorPalette.main,
        // Fondo con alpha basado en el color real del theme
        bgcolor: alpha(colorPalette.main, 0.08),
        '& .MuiAlert-message': { width: '100%' },
        // Alineación vertical centrada si hay acción
        alignItems: action ? 'center' : 'flex-start',
        ...sx,
      }}
      // Lógica: Si hay acción Y onClose, tratamos de mostrar ambos (MUI por defecto oculta onClose si hay action)
      action={
        action && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              color={severity}
              size="small"
              onClick={action.onClick}
              sx={{
                fontWeight: 600, // Coincide con tu theme.typography.button
                whiteSpace: 'nowrap',
                boxShadow: 'none',
                // Asegura contraste correcto
                color: theme.palette.getContrastText(colorPalette.main)
              }}
            >
              {action.label}
            </Button>
            {/* Si quieres mantener la X de cerrar junto al botón, descomenta esto: */}
            {/* {onClose && (
              <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )} */}
          </Box>
        )
      }
    >
      <Stack spacing={0.5}>
        <AlertTitle
          sx={{
            // 2. MEJORA: Usamos 700 para coincidir con la negrita de tu theme (h1)
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1.5,
            mb: 0.5
          }}
        >
          {title}
        </AlertTitle>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            // Asegura legibilidad sobre fondos de color
            fontWeight: 400
          }}
        >
          {message}
        </Typography>
      </Stack>
    </Alert>
  );
};

export default AlertBanner;
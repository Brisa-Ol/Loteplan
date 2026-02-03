import { Inbox } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import React from 'react';

// ============================================================================
// COMPONENTE: EMPTY STATE
// Estado vacío consistente para tablas/listas sin datos
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Sin resultados',
  message,
  action,
  variant = 'default',
}) => {
  const theme = useTheme();

  if (variant === 'compact') {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          // 1. MEJORA: Un borde sutil ayuda a definir el espacio incluso en modo compacto
          borderBottom: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, sm: 6 }, // Responsive padding
        textAlign: 'center',
        // 2. MEJORA: Usamos el fondo del theme con transparencia para consistencia
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: '1px dashed',
        // Usamos el color de borde por defecto o uno derivado del theme
        borderColor: alpha(theme.palette.text.disabled, 0.25),
        // 3. MEJORA: Radio de 12px para coincidir con MuiCard y MuiSkeleton de tu theme
        borderRadius: '12px',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            width: 64,
            height: 64,
            // Círculo perfecto está bien, pero el color debe ser consistente
            borderRadius: '50%',
            // Usamos el primary del theme con baja opacidad (igual que tu Skeleton)
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // El color del ícono debe ser el primario para dar vida, o disabled para ser sutil.
            // Dado que es un "Empty State", el primary suele llamar más la atención a la acción.
            color: theme.palette.primary.main,
          }}
        >
          {icon || <Inbox sx={{ fontSize: 32 }} />}
        </Box>

        <Box>
          <Typography
            variant="h6"
            // 4. MEJORA: fontWeight 600 coincide con tus botones, 700 era un poco grueso para h6
            fontWeight={600}
            gutterBottom
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400, mx: 'auto' }}
          >
            {message}
          </Typography>
        </Box>

        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            startIcon={action.icon}
            sx={{ mt: 1 }}
          // El botón ya hereda el borderRadius: 8 del theme automáticamente
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default EmptyState;
// src/shared/hooks/useAuctionStatus.ts
import { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material';
import type { ChipProps } from '@mui/material';

type AuctionStatus = 'activa' | 'pendiente' | 'finalizada' | 'cancelada' | string;

interface StatusConfig {
  label: string;
  color: ChipProps['color'];
  bgColor: string;
 textShadow?: string;
  hexColor: string;
}

export const useAuctionStatus = (status: AuctionStatus): StatusConfig => {
  const theme = useTheme();

  return useMemo(() => {
    const configs: Record<string, StatusConfig> = {
      activa: {
        label: 'EN SUBASTA',
        color: 'primary',
        // #CC6333 — primary.main del tema
        hexColor: theme.palette.primary.contrastText, 
        bgColor: theme.palette.primary.main,
      },
pendiente: {
        label: 'PRÓXIMAMENTE',
        color: 'warning',
        // Usamos el blanco puro que tienes en el contrastText de tu primary
        hexColor: theme.palette.primary.contrastText, 
        // Fondo naranja puro sin opacidad (o con 0.95 si quieres apenas un toque)
        bgColor: theme.palette.warning.main, 
        // Una sombra muy sutil al texto blanco para que resalte aún más
        textShadow: '0px 1px 2px rgba(0,0,0,0.3)', 
      },
finalizada: {
        label: 'FINALIZADA',
        color: 'default',
        // #333333 — text.secondary del tema
        hexColor: theme.palette.primary.contrastText, 
        bgColor: theme.palette.text.disabled, // Te sugiero usar 'disabled' o algo más claro aquí para que el texto oscuro sea legible
      },
      cancelada: {
        label: 'CANCELADA',
        color: 'error',
        // #D32F2F — error.main del tema
        hexColor: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
    };

    return configs[status] ?? {
      label: (status ?? 'DESCONOCIDO').toUpperCase(),
      color: 'default',
      hexColor: theme.palette.text.disabled,
      bgColor: alpha(theme.palette.text.disabled, 0.1),
    };
  }, [status, theme]);
};
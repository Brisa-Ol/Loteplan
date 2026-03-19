// src/shared/hooks/useAuctionStatus.ts
import { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material';
import type { ChipProps } from '@mui/material';

type AuctionStatus = 'activa' | 'pendiente' | 'finalizada' | 'cancelada' | string;

interface StatusConfig {
  label: string;
  color: ChipProps['color'];
  bgColor: string;
  // Color hexadecimal directo del tema — útil para sx customizados
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
        hexColor: theme.palette.primary.main,
        bgColor: alpha(theme.palette.primary.main, 0.1),
      },
      pendiente: {
        label: 'PRÓXIMAMENTE',
        color: 'warning',
        // #F57C00 — warning.main del tema
        hexColor: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
      },
      finalizada: {
        label: 'FINALIZADA',
        color: 'default',
        // #999999 — text.disabled del tema
        hexColor: theme.palette.text.disabled,
        bgColor: alpha(theme.palette.text.disabled, 0.1),
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
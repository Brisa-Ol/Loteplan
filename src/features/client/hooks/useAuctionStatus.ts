// src/shared/hooks/useAuctionStatus.ts

import { useMemo } from 'react';
import { useTheme, alpha } from '@mui/material';
import type { ChipProps } from '@mui/material';

type AuctionStatus = 'activa' | 'pendiente' | 'finalizada' | string;

interface StatusConfig {
  label: string;
  color: ChipProps['color'];
  icon?: React.ReactElement;
  bgColor?: string;
}

/**
 * Hook para obtener la configuración visual de un estado de subasta
 * 
 * @param status - Estado de la subasta
 * @returns Configuración de color, label e icono
 * 
 * @example
 * const statusConfig = useAuctionStatus(lote.estado_subasta);
 * 
 * <Chip 
 *   label={statusConfig.label}
 *   color={statusConfig.color}
 *   icon={statusConfig.icon}
 * />
 */
export const useAuctionStatus = (status: AuctionStatus): StatusConfig => {
  const theme = useTheme();

  return useMemo(() => {
    const configs: Record<string, StatusConfig> = {
      activa: {
        label: 'En Subasta',
        color: 'success',
        bgColor: alpha(theme.palette.success.main, 0.1),
      },
      pendiente: {
        label: 'Próximamente',
        color: 'warning',
        bgColor: alpha(theme.palette.warning.main, 0.1),
      },
      finalizada: {
        label: 'Finalizada',
        color: 'error',
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
    };

    return configs[status] || {
      label: status,
      color: 'default',
      bgColor: alpha(theme.palette.grey[700], 0.1),
    };
  }, [status, theme]);
};
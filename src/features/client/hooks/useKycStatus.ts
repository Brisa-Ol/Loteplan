// src/shared/hooks/useKycStatus.ts

import { useMemo } from 'react';
import type { ChipProps } from '@mui/material';

type KycStatus = 'APROBADA' | 'PENDIENTE' | 'RECHAZADA' | 'NO_INICIADO' | undefined;

interface KycStatusConfig {
  color: ChipProps['color'];
  label: string;
  canOperate: boolean;
  needsAction: boolean;
  actionText?: string;
}

/**
 * Hook para obtener la configuración del estado KYC
 * 
 * @param status - Estado actual del KYC
 * @returns Configuración del estado KYC
 * 
 * @example
 * const kycConfig = useKycStatus(kycData?.estado_verificacion);
 * 
 * if (!kycConfig.canOperate) {
 *   return <Alert>Necesitas verificar tu identidad</Alert>
 * }
 */
export const useKycStatus = (status: KycStatus): KycStatusConfig => {
  return useMemo(() => {
    const configs: Record<string, KycStatusConfig> = {
      APROBADA: {
        color: 'success',
        label: 'Verificado',
        canOperate: true,
        needsAction: false,
      },
      PENDIENTE: {
        color: 'warning',
        label: 'Pendiente',
        canOperate: false,
        needsAction: true,
        actionText: 'Ver Estado',
      },
      RECHAZADA: {
        color: 'error',
        label: 'Rechazada',
        canOperate: false,
        needsAction: true,
        actionText: 'Reintentar',
      },
      NO_INICIADO: {
        color: 'default',
        label: 'No Iniciado',
        canOperate: false,
        needsAction: true,
        actionText: 'Iniciar KYC',
      },
    };

    return configs[status || 'NO_INICIADO'];
  }, [status]);
};
// src/features/client/hooks/useAccountDeactivation.ts

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import UsuarioService from '@/core/api/services/usuario.service';

interface DeactivationValidation {
  canDeactivate: boolean;
  warnings: string[];
}

interface UseAccountDeactivationReturn {
  canDeactivate: boolean;
  warnings: string[];
  hasBlockers: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook para validar si una cuenta puede ser desactivada
 * 
 * Verifica:
 * - Deudas pendientes
 * - Suscripciones activas
 * - Contratos pendientes
 * 
 * @returns Estado de validación de desactivación
 * 
 * @example
 * const { canDeactivate, hasBlockers, warnings } = useAccountDeactivation();
 * 
 * if (hasBlockers) {
 *   return <Alert>{warnings.join(', ')}</Alert>
 * }
 */
export const useAccountDeactivation = (): UseAccountDeactivationReturn => {
  const { data, isLoading, error } = useQuery<DeactivationValidation>({
    queryKey: ['validateDeactivation'],
    queryFn: async () => (await UsuarioService.validateDeactivation()).data,
    retry: false,
    staleTime: 60 * 1000, // 1 minuto
  });

  const hasBlockers = useMemo(() => 
    !data?.canDeactivate,
    [data]
  );

  const warnings = useMemo(() => 
    data?.warnings || [],
    [data]
  );

  return {
    canDeactivate: data?.canDeactivate ?? false,
    warnings,
    hasBlockers,
    isLoading,
    error: error as Error | null,
  };
};
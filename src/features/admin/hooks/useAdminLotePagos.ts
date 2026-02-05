import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTheme } from '@mui/material';

import LoteService from '@/core/api/services/lote.service';
import { useSortedData } from './useSortedData';


// Helper de fechas
const calcularDiasRestantes = (fechaFin: string | null): number => {
  if (!fechaFin) return 90;
  const fechaLimite = new Date(new Date(fechaFin).getTime() + 90 * 24 * 60 * 60 * 1000);
  const diff = fechaLimite.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const useAdminLotePagos = () => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Query con auto-refetch para monitoreo en tiempo real
  const { data: lotesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminLotesPagos'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 30000, // Actualizar cada 30s
    staleTime: 10000,
  });

  // Filtramos solo los relevantes para cobranza ANTES de ordenar
  const lotesCobranza = useMemo(() => {
    return lotesRaw.filter(
      (l) => l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) > 0
    );
  }, [lotesRaw]);

  const { sortedData: lotes, highlightedId } = useSortedData(lotesCobranza);

  // Cálculos Analíticos (Memoizados)
  const analytics = useMemo(() => {
    const riesgoCriticoItems = lotes.filter((l) => (l.intentos_fallidos_pago || 0) >= 2);
    const capitalEnRiesgo = riesgoCriticoItems.reduce((acc, l) => acc + Number(l.precio_base), 0);

    const chartData = [
      { 
        name: 'Bajo (1 int.)', 
        value: lotes.filter(l => l.intentos_fallidos_pago === 1).length, 
        color: theme.palette.warning.light 
      },
      { 
        name: 'Alto (2 int.)', 
        value: lotes.filter(l => l.intentos_fallidos_pago === 2).length, 
        color: theme.palette.error.main 
      },
      { 
        name: 'Crítico (3 int.)', 
        value: lotes.filter(l => l.intentos_fallidos_pago >= 3).length, 
        color: theme.palette.error.dark 
      },
    ];

    return {
      totalPendientes: lotes.length,
      cantidadCritica: riesgoCriticoItems.length,
      capitalEnRiesgo,
      chartData,
    };
  }, [lotes, theme]);

  return {
    theme,
    // State
    viewMode,
    setViewMode,
    
    // Data
    lotes, // Lista filtrada y ordenada
    analytics,
    
    // UX
    isLoading,
    error,
    highlightedId,
    
    // Helpers
    calcularDiasRestantes
  };
};
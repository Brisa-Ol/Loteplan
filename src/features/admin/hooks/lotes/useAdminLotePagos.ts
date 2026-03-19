// src/features/admin/hooks/lotes/useAdminLotePagos.ts

import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
// ✅ Importamos PujaService — LoteService.cancelarAdjudicacion no existe
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import type { LoteDto } from '@/core/types/lote.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { useSortedData } from '../useSortedData';

// ============================================================================
// HELPERS
// ============================================================================

const calcularDiasRestantes = (fechaFin: string | null): number => {
  if (!fechaFin) return 90;
  const fechaLimite = new Date(new Date(fechaFin).getTime() + 90 * 24 * 60 * 60 * 1000);
  const diff = fechaLimite.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAdminLotePagos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const confirmDialog = useConfirmDialog();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  // ✅ selectedLote guarda el LoteDto completo — necesario para la mutación
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  // --- DATA FETCHING ---
  const { data: lotesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminLotesPagos'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: env.queryRefetchInterval || 30000,
    staleTime: env.queryStaleTime || 10000,
  });

  // --- FILTROS ---
  const lotesPendientesTotal = useMemo(() => {
    return lotesRaw.filter((l) => l.estado_subasta === 'finalizada' && l.id_ganador);
  }, [lotesRaw]);

  const lotesRiesgo = useMemo(() => {
    return lotesPendientesTotal.filter(l => (l.intentos_fallidos_pago || 0) > 0);
  }, [lotesPendientesTotal]);

  const { sortedData: lotes, highlightedId } = useSortedData(lotesRiesgo);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const riesgoCriticoItems = lotesPendientesTotal.filter((l) => (l.intentos_fallidos_pago || 0) >= 2);
    const capitalEnRiesgo = lotesPendientesTotal.reduce(
      (acc, l) => acc + Number(l.monto_ganador_lote || l.precio_base), 0
    );

    const chartData = [
      { name: 'Normal (0)', value: lotesPendientesTotal.filter(l => !l.intentos_fallidos_pago).length },
      { name: 'Bajo (1)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 1).length },
      { name: 'Alto (2)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 2).length },
      { name: 'Crítico (3+)', value: lotesPendientesTotal.filter(l => (l.intentos_fallidos_pago || 0) >= 3).length },
    ];

    return {
      totalPendientes: lotesPendientesTotal.length,
      cantidadCritica: riesgoCriticoItems.length,
      capitalEnRiesgo,
      chartData,
    };
  }, [lotesPendientesTotal]);

  // --- MUTACIÓN ---
  // ✅ Recibe el LoteDto completo para decidir qué método de PujaService usar:
  //    - Si tiene puja ganadora → cancelarGanadoraAnticipada (devuelve token)
  //    - Si no                 → manageAuctionEnd con idGanador: null (libera el lote)
  const sancionarMutation = useMutation({
    mutationFn: async (lote: LoteDto) => {
      if (lote.id_puja_mas_alta) {
        return await PujaService.cancelarGanadoraAnticipada(
          lote.id_puja_mas_alta,
          'Incumplimiento de pago — sanción administrativa'
        );
      }
      return await PujaService.manageAuctionEnd(lote.id, null);
    },
    onSuccess: (res) => {
      const msg = (res.data as any)?.message || 'Adjudicación procesada correctamente.';
      showSuccess(msg);
      queryClient.invalidateQueries({ queryKey: ['adminLotesPagos'] });
      confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al procesar la sanción.');
    },
  });

  // --- ACCIONES ---
  const handleForceFinish = (lote: LoteDto) => {
    // ✅ Guardamos el lote completo — la mutación lo necesita entero
    setSelectedLote(lote);
    confirmDialog.confirm('force_finish', lote);
  };

  const handleConfirmAction = () => {
    if (selectedLote) {
      // ✅ Pasamos el LoteDto completo a la mutación
      sancionarMutation.mutate(selectedLote);
    }
  };

  return {
    theme,
    viewMode,
    setViewMode,
    lotes,
    lotesPendientesTotal,
    analytics,
    isLoading,
    error,
    highlightedId,
    isMutating: sancionarMutation.isPending,
    handleForceFinish,
    handleConfirmAction,
    calcularDiasRestantes,
    modales: {
      confirm: confirmDialog,
    },
  };
};
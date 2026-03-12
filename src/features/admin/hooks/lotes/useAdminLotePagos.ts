// src/features/admin/hooks/lotes/useAdminLotePagos.ts

import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
import type { LoteDto } from '@/core/types/lote.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { useSortedData } from '../useSortedData';
import { env } from '@/core/config/env'; // 👈 1. Importamos env

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

  // ✅ Fix: useConfirmDialog reemplaza useModal + confirmConfig manual
  const confirmDialog = useConfirmDialog();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  // --- DATA FETCHING ---
  const { data: lotesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminLotesPagos'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    // 👈 2. Aplicamos variables de entorno con fallbacks
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
      { name: 'Normal (0)', value: lotesPendientesTotal.filter(l => !l.intentos_fallidos_pago).length, color: theme.palette.success.light },
      { name: 'Bajo (1)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 1).length, color: theme.palette.warning.light },
      { name: 'Alto (2)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 2).length, color: theme.palette.error.main },
      { name: 'Crítico (3+)', value: lotesPendientesTotal.filter(l => (l.intentos_fallidos_pago || 0) >= 3).length, color: theme.palette.error.dark },
    ];

    return {
      totalPendientes: lotesPendientesTotal.length,
      cantidadCritica: riesgoCriticoItems.length,
      capitalEnRiesgo,
      chartData
    };
  }, [lotesPendientesTotal, theme]);

  // --- MUTACIÓN ---
  const sancionarMutation = useMutation({
    mutationFn: async (loteId: number) => await LoteService.cancelarAdjudicacion(loteId),
    onSuccess: (res) => {
      showSuccess(res.data?.message || 'Adjudicación procesada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['adminLotesPagos'] });
      confirmDialog.close();
    },
    onError: (err: any) => {
      if (err.response?.status === 404) {
        showError('Error: Falta la ruta POST /lotes/:id/impago en el Backend.');
      } else {
        showError('Error al procesar la sanción.');
      }
    }
  });

  // --- ACCIONES ---
  const handleForceFinish = (lote: LoteDto) => {
    setSelectedLote(lote);
    // ✅ Usamos el sistema de confirmación unificado — 'force_finish' ya tiene config en useConfirmDialog
    confirmDialog.confirm('force_finish', { idLote: lote.id });
  };

  const handleConfirmAction = () => {
    if (selectedLote) {
      sancionarMutation.mutate(selectedLote.id);
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
      confirm: confirmDialog // ✅ Tipo correcto para ConfirmDialog
    }
  };
};
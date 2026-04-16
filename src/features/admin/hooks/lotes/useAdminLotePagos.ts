// src/features/admin/hooks/lotes/useAdminLotePagos.ts

import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import type { LoteDto } from '@/core/types/lote.dto';
import type { PujaDto } from '@/core/types/puja.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbar } from '@/shared/hooks/useSnackbar';

export const useAdminLotePagos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const confirmDialog = useConfirmDialog();
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  // --- NUEVO: ESTADO PARA EL MODAL DE CANCELACIÓN ---
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    data: PujaDto | null;
    lote: LoteDto | null;
  }>({
    isOpen: false,
    data: null,
    lote: null
  });

  // --- DATA FETCHING: LOTES ---
  const { data: lotesRaw = [], isLoading: isLoadingLotes, error: errorLotes } = useQuery({
    queryKey: ['adminLotesPagos'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: env.queryRefetchInterval || 30000,
    staleTime: env.queryStaleTime || 10000,
  });

  // --- DATA FETCHING: PUJAS (Para armar el Top 3) ---
  const { data: pujasRaw = [], isLoading: isLoadingPujas } = useQuery({
    queryKey: ['adminPujasTodas'],
    queryFn: async () => (await PujaService.getAllAdmin()).data,
    refetchInterval: env.queryRefetchInterval || 30000,
  });

  // --- AGRUPAR PUJAS POR LOTE ---
  const pujasPorLote = useMemo(() => {
    const map: Record<number, PujaDto[]> = {};
    pujasRaw.forEach(p => {
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });
    // Ordenar de mayor a menor monto en cada lote
    Object.keys(map).forEach(k => {
      map[Number(k)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });
    return map;
  }, [pujasRaw]);

  // --- FILTROS ---
  const lotesPendientesTotal = useMemo(() => {
    return lotesRaw.filter((l) => l.estado_subasta === 'finalizada' && l.id_ganador);
  }, [lotesRaw]);

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

  // --- MUTACIÓN: SANCIONAR ---
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
      queryClient.invalidateQueries({ queryKey: ['adminPujasTodas'] });
      confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al procesar la sanción.');
    },
  });

  // --- NUEVO: MUTACIÓN PARA APROBAR CANCELACIÓN ---
  const aprobarCancelacionMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      return await PujaService.cancelarGanadoraAnticipada(
        pujaId,
        'Baja aprobada por administración tras solicitud del usuario.'
      );
    },
    onSuccess: (res) => {
      const msg = (res.data as any)?.message || 'Baja aprobada correctamente.';
      showSuccess(msg);
      queryClient.invalidateQueries({ queryKey: ['adminLotesPagos'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujasTodas'] });
      handleCloseCancelModal();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al aprobar la baja.');
    },
  });

  const handleForceFinish = (lote: LoteDto) => {
    setSelectedLote(lote);
    confirmDialog.confirm('force_finish', lote);
  };

  const handleConfirmAction = () => {
    if (selectedLote) {
      sancionarMutation.mutate(selectedLote);
    }
  };

  // --- NUEVO: HANDLERS PARA EL MODAL DE CANCELACIÓN ---
  const handleOpenCancelModal = (puja: PujaDto, lote: LoteDto) => {
    setCancelModalState({ isOpen: true, data: puja, lote });
  };

  const handleCloseCancelModal = () => {
    setCancelModalState({ isOpen: false, data: null, lote: null });
  };

  const aprobarCancelacion = (pujaId?: number) => {
    if (pujaId) aprobarCancelacionMutation.mutate(pujaId);
  };

  return {
    theme,
    lotesPendientesTotal,
    pujasPorLote, 
    analytics,
    isLoading: isLoadingLotes || isLoadingPujas,
    isMutating: sancionarMutation.isPending || aprobarCancelacionMutation.isPending, // Se unificó el estado de carga
    error: errorLotes,
    handleForceFinish,
    handleConfirmAction,
    handleOpenCancelModal,
    handleCloseCancelModal,
    aprobarCancelacion,
    modales: { 
      confirm: confirmDialog,
      cancelRequest: cancelModalState // Se expone el estado al componente
    },
  };
};
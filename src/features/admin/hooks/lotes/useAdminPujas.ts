// src/features/admin/hooks/lotes/useAdminPujas.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';
import { env } from '@/core/config/env';

import type { LoteDto } from '@/core/types/lote.dto';
import type { PujaDto } from '@/core/types/puja.dto';
import type { UsuarioDto } from '@/core/types/usuario.dto';
import { useConfirmDialog, useModal, useSnackbar } from '@/shared/hooks';
import { useSortedData } from '../useSortedData';

// ─── Debounce helper ─────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAdminPujas = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // ─── Modales ───────────────────────────────────────────────────────────────

  const detallePujaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    detallePuja: detallePujaModal,
    confirmDialog,
  }), [detallePujaModal, confirmDialog]);

  // ─── Estados UI ───────────────────────────────────────────────────────────

  const [tabValue, setTabValue] = useState(0);
  const [filterLoteNombre, setFilterLoteNombre] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [pujaSeleccionada, setPujaSeleccionada] = useState<PujaDto | null>(null);

  const debouncedFilterLote = useDebouncedValue(filterLoteNombre, 300);

  // ─── Queries ──────────────────────────────────────────────────────────────

  // Usuarios — diccionario, cache agresivo
  const { data: usuarios = [] } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios', 'simple'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Lotes — polling solo en tab "En Vivo"
  const {
    data: lotesRaw = [],
    isLoading: loadingLotes,
    error: errorLotes,
  } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes', tabValue === 0 ? 'active' : 'all'],
    queryFn: async () => {
      if (tabValue === 0) return (await LoteService.getAllActive()).data;
      return (await LoteService.findAllAdmin()).data;
    },
    refetchInterval: tabValue === 0 ? 10_000 : false,
    staleTime: tabValue === 0 ? 5_000 : (env.queryStaleTime || 30_000),
  });

  // Pujas activas — solo para tab 0 (En Vivo), polling agresivo
  const {
    data: pujasActivas = [],
    isLoading: loadingPujas,
    error: errorPujas,
  } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas', 'active'],
    queryFn: async () => (await PujaService.getAllActive()).data,
    enabled: tabValue === 0,
    refetchInterval: 5_000,
  });

  // ─── Procesamiento ────────────────────────────────────────────────────────

  const usuariosMap = useMemo(() => {
    const map: Record<number, string> = {};
    usuarios.forEach(u => {
      map[u.id] = u.nombre_usuario || `${u.nombre} ${u.apellido}`;
    });
    return map;
  }, [usuarios]);

  const getUserName = useCallback(
    (id: number) => usuariosMap[id] || `ID #${id}`,
    [usuariosMap]
  );

  // Mapa de pujas por lote, ordenado por monto desc
  const pujasPorLote = useMemo(() => {
    if (tabValue !== 0) return {};
    const map: Record<number, PujaDto[]> = {};

    pujasActivas.forEach(p => {
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });

    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });

    return map;
  }, [pujasActivas, tabValue]);

  const { sortedData: filteredLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // Analytics por tab
  const analytics = useMemo(() => {
    const search = debouncedFilterLote.toLowerCase();

    const lotesFiltrados = filteredLotes.filter(l =>
      !search || l.nombre_lote.toLowerCase().includes(search)
    );

    const activos = lotesFiltrados.filter(l => l.estado_subasta === 'activa');

    const pendientesPago = lotesFiltrados.filter(l =>
      l.estado_subasta === 'finalizada' &&
      l.id_ganador &&
      (l.intentos_fallidos_pago || 0) < 3
    );

    const lotesEnRiesgo = lotesFiltrados.filter(l =>
      (l.intentos_fallidos_pago || 0) > 0
    );

    // useAdminPujas.ts — en analytics
    const dineroEnJuego = activos.reduce((acc, lote) => {
      const topPuja = pujasPorLote[lote.id]?.[0];
      // ✅ fallback a pujaMasAlta si aún no cargaron las pujasActivas
      const monto = topPuja?.monto_puja ?? lote.pujaMasAlta?.monto_puja ?? lote.precio_base;
      return acc + Number(monto);
    }, 0);

    return {
      activos,
      pendientesPago,
      lotesEnRiesgo,
      dineroEnJuego,
      totalPujas: pujasActivas.length,
    };
  }, [filteredLotes, debouncedFilterLote, pujasPorLote, pujasActivas.length]);

  // ─── Mutaciones ───────────────────────────────────────────────────────────

const endAuctionMutation = useMutation({
  mutationFn: (id: number) => LoteService.endAuction(id),
  onSuccess: (_, id) => {
    // 👇 Igual que arriba
    queryClient.refetchQueries({ queryKey: ['adminLotes'] });
    queryClient.refetchQueries({ queryKey: ['adminPujas'] });
    showSuccess('Subasta finalizada correctamente');
    modales.confirmDialog.close();
    triggerHighlight(id);
  },
  onError: () => {
    showError('Error al finalizar la subasta');
    modales.confirmDialog.close();
  },
});

  const forceFinishMutation = useMutation({
    mutationFn: ({ idLote, idGanador }: { idLote: number; idGanador: number | null }) =>
      PujaService.manageAuctionEnd(idLote, idGanador),
    onSuccess: (_, { idLote }) => {
      showSuccess('Gestión ejecutada manualmente.');
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      triggerHighlight(idLote);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(`Error: ${err.response?.data?.error || 'Datos inválidos'}`);
      modales.confirmDialog.close();
    },
  });

  const cancelarGanadoraMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      PujaService.cancelarGanadoraAnticipada(id, motivo),
    onSuccess: res => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess(`✅ ${res.data?.message || 'Adjudicación anulada y token devuelto.'}`);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al cancelar adjudicación');
      modales.confirmDialog.close();
    },
  });

  const revertirPagoMutation = useMutation({
    mutationFn: (idPuja: number) => PujaService.revertWinnerPayment(idPuja),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess('✅ Pago revertido a estado pendiente.');
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al revertir pago');
      modales.confirmDialog.close();
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Abre el modal de detalle para una puja específica.
   * Centraliza la lógica de selección + apertura de modal.
   */
  const handleOpenDetallePuja = useCallback((puja: PujaDto) => {
    setPujaSeleccionada(puja);
    modales.detallePuja.open();
  }, [modales.detallePuja]);

  const handleCloseDetallePuja = useCallback(() => {
    modales.detallePuja.close();
    // Pequeño delay para no mostrar null mientras cierra la animación
    setTimeout(() => setPujaSeleccionada(null), 300);
  }, [modales.detallePuja]);

  const handleFinalizarSubasta = useCallback((idLote: number) => {
  modales.confirmDialog.confirm('end_auction', { id: idLote });
}, [modales.confirmDialog]);

  const handleForceFinish = useCallback((lote: LoteDto) => {
    modales.confirmDialog.confirm('force_finish', {
      idLote: lote.id,
      idGanador: lote.id_ganador,
    });
  }, [modales.confirmDialog]);

  const handleRevertirPago = useCallback((lote: LoteDto) => {
    if (lote.id_puja_mas_alta) {
      modales.confirmDialog.confirm('revert_payment', { pujaId: lote.id_puja_mas_alta });
    } else {
      showError('No hay puja ganadora asociada para revertir.');
    }
  }, [modales.confirmDialog, showError]);

  const handleCancelarAdjudicacion = useCallback((lote: LoteDto) => {
    if (lote.id_puja_mas_alta) {
      modales.confirmDialog.confirm('cancel_ganadora_anticipada', {
        ...lote,
        pujaId: lote.id_puja_mas_alta,
      });
    } else {
      showError('No se pudo identificar la puja ganadora automáticamente.');
    }
  }, [modales.confirmDialog, showError]);

  // Orquestador central de confirmaciones
  const handleConfirmAction = useCallback((inputValue?: string) => {
    const { action, data } = modales.confirmDialog;
    if (!data) return;

    switch (action) {
      case 'end_auction':
        endAuctionMutation.mutate(data.id);
        break;
      case 'cancel_ganadora_anticipada':
        cancelarGanadoraMutation.mutate({
          id: data.pujaId,
          motivo: inputValue?.trim() || 'Cancelación administrativa desde el panel',
        });
        break;
      case 'force_finish':
        forceFinishMutation.mutate({ idLote: data.idLote, idGanador: data.idGanador });
        break;
      case 'revert_payment':
        revertirPagoMutation.mutate(data.pujaId);
        break;
    }
  }, [modales.confirmDialog, endAuctionMutation, cancelarGanadoraMutation, forceFinishMutation, revertirPagoMutation]);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // Estado UI
    tabValue, setTabValue,
    filterLoteNombre, setFilterLoteNombre,
    filterUserId, setFilterUserId,

    // UX
    highlightedId,

    // Loading / Error
    loading: loadingLotes || (tabValue === 0 && loadingPujas),
    error: errorLotes || (tabValue === 0 ? errorPujas : null),

    isMutating:
      endAuctionMutation.isPending ||
      forceFinishMutation.isPending ||
      cancelarGanadoraMutation.isPending ||
      revertirPagoMutation.isPending,

    // Datos
    analytics,
    pujasPorLote,
    getUserName,

    // Puja seleccionada
    pujaSeleccionada,
    setPujaSeleccionada,

    // Modales
    modales,

    // Handlers
    handleOpenDetallePuja,
    handleCloseDetallePuja,
    handleFinalizarSubasta,
    handleCancelarAdjudicacion,
    handleRevertirPago,
    handleForceFinish,
    handleConfirmAction,

    // Mutations (por si se necesitan individualmente)
    endAuctionMutation,
    forceFinishMutation,
    cancelarGanadoraMutation,
    revertirPagoMutation,
  };
};
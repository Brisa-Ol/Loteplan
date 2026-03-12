// src/features/admin/hooks/useAdminPujas.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';
import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración

import type { LoteDto } from '@/core/types/lote.dto';
import type { PujaDto } from '@/core/types/puja.dto';
import type { UsuarioDto } from '@/core/types/usuario.dto';
import { useConfirmDialog, useModal, useSnackbar } from '@/shared/hooks';
import { useSortedData } from '../useSortedData';


// ============================================================================
// DEBOUNCE HELPER
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminPujas = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES (Nivel Superior) ---
  const detallePujaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    detallePuja: detallePujaModal,
    confirmDialog: confirmDialog
  }), [detallePujaModal, confirmDialog]);

  // --- ESTADOS UI ---
  const [tabValue, setTabValue] = useState(0);
  const [filterLoteNombre, setFilterLoteNombre] = useState('');
  const [filterUserId, setFilterUserId] = useState('');

  // Selección
  const [pujaSeleccionada, setPujaSeleccionada] = useState<PujaDto | null>(null);

  // Debounce
  const debouncedFilterLote = useDebouncedValue(filterLoteNombre, 300);

  // --- QUERIES INTELIGENTES ---

  // 1. Usuarios (Cache agresivo - Es un diccionario)
  const { data: usuarios = [] } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios', 'simple'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // 2. Lotes
  const {
    data: lotesRaw = [],
    isLoading: loadingLotes,
    error: errorLotes
  } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes', tabValue === 0 ? 'active' : 'all'],
    queryFn: async () => {
      if (tabValue === 0) return (await LoteService.getAllActive()).data;
      return (await LoteService.findAllAdmin()).data;
    },
    // 👈 2. El polling del Tab 0 se mantiene en 10s, el resto no pollea.
    refetchInterval: tabValue === 0 ? 10000 : false,
    // 👈 3. Aplicamos env.queryStaleTime solo al Tab general (no en vivo)
    staleTime: tabValue === 0 ? 5000 : (env.queryStaleTime || 30000),
  });

  // 3. Pujas (SOLO para TAB 0 - En Vivo)
  const {
    data: pujasActivas = [],
    isLoading: loadingPujas,
    error: errorPujas
  } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas', 'active'],
    queryFn: async () => (await PujaService.getAllActive()).data,
    enabled: tabValue === 0,
    // 👈 4. El polling de pujas se mantiene agresivo (5s) por ser "En Vivo"
    refetchInterval: 5000,
  });

  // --- PROCESAMIENTO DE DATOS ---

  const usuariosMap = useMemo(() => {
    const map: Record<number, string> = {};
    usuarios.forEach(u => {
      map[u.id] = u.nombre_usuario || `${u.nombre} ${u.apellido}`;
    });
    return map;
  }, [usuarios]);

  // ✅ La función ahora simplemente busca en el diccionario
  const getUserName = useCallback((id: number) => {
    return usuariosMap[id] || `ID #${id}`;
  }, [usuariosMap]);

  // Mapa de Pujas
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

  // Filtrado General de Lotes
  const { sortedData: filteredLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // Analytics y Listas por Tab
  const analytics = useMemo(() => {
    const search = debouncedFilterLote.toLowerCase();

    const lotesFiltradosPorNombre = filteredLotes.filter(l =>
      !search || l.nombre_lote.toLowerCase().includes(search)
    );

    // Tab 0: Activos
    const activos = lotesFiltradosPorNombre.filter(l => l.estado_subasta === 'activa');

    // Tab 1: Gestión de Cobros
    const pendientesPago = lotesFiltradosPorNombre.filter(l =>
      l.estado_subasta === 'finalizada' &&
      l.id_ganador &&
      (l.intentos_fallidos_pago || 0) < 3
    );

    // Tab 2: Impagos / Riesgo
    const lotesEnRiesgo = lotesFiltradosPorNombre.filter(l => (l.intentos_fallidos_pago || 0) > 0);

    const dineroEnJuego = activos.reduce((acc, lote) => {
      const topPuja = pujasPorLote[lote.id]?.[0];
      return acc + (topPuja ? Number(topPuja.monto_puja) : Number(lote.precio_base));
    }, 0);

    return {
      activos,
      pendientesPago,
      lotesEnRiesgo,
      dineroEnJuego,
      totalPujas: pujasActivas.length
    };
  }, [filteredLotes, debouncedFilterLote, pujasPorLote, pujasActivas.length]);

  // --- MUTACIONES ---

  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess('Subasta finalizada correctamente');
      modales.confirmDialog.close();
      triggerHighlight(id);
    },
    onError: () => { showError('Error al finalizar'); modales.confirmDialog.close(); }
  });

  const forceFinishMutation = useMutation({
    mutationFn: ({ idLote, idGanador }: { idLote: number, idGanador: number | null }) =>
      PujaService.manageAuctionEnd(idLote, idGanador),
    onSuccess: (_, variables) => {
      showSuccess("Gestión ejecutada manualmente.");
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      triggerHighlight(variables.idLote);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(`Error: ${err.response?.data?.error || 'Datos inválidos'}`);
      modales.confirmDialog.close();
    }
  });

  const cancelarGanadoraMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      return await PujaService.cancelarGanadoraAnticipada(id, motivo);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      const msg = res.data?.message || 'Adjudicación anulada y token devuelto.';
      showSuccess(`✅ ${msg}`);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al cancelar adjudicación');
      modales.confirmDialog.close();
    }
  });

  // 🆕 Mutación para Revertir Pago
  const revertirPagoMutation = useMutation({
    mutationFn: async (idPuja: number) => {
      return await PujaService.revertWinnerPayment(idPuja);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess('✅ Pago revertido a estado pendiente.');
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al revertir pago');
      modales.confirmDialog.close();
    }
  });

  // --- HANDLERS ---

  const handleFinalizarSubasta = useCallback((lote: LoteDto) => {
    modales.confirmDialog.confirm('end_auction', lote);
  }, [modales.confirmDialog]);

  // 🆕 Handler para el botón "Sancionar/Forzar Finalización"
  const handleForceFinish = useCallback((lote: LoteDto) => {
    modales.confirmDialog.confirm('force_finish', {
      idLote: lote.id,
      idGanador: lote.id_ganador
    });
  }, [modales.confirmDialog]);

  // 🆕 Handler para el botón "Revertir Pago"
  const handleRevertirPago = useCallback((lote: LoteDto) => {
    if (lote.id_puja_mas_alta) {
      modales.confirmDialog.confirm('revert_payment', {
        pujaId: lote.id_puja_mas_alta
      });
    } else {
      showError('No hay puja ganadora asociada para revertir.');
    }
  }, [modales.confirmDialog, showError]);

  const handleCancelarAdjudicacion = useCallback(async (lote: LoteDto) => {
    try {
      if (lote.id_puja_mas_alta) {
        modales.confirmDialog.confirm('cancel_ganadora_anticipada', {
          ...lote,
          pujaId: lote.id_puja_mas_alta,
          id_ganador: lote.id_ganador
        });
      } else {
        showError('No se pudo identificar la puja ganadora automáticamente.');
      }
    } catch (e) {
      console.error(e);
      showError('Error al preparar cancelación');
    }
  }, [modales.confirmDialog, showError]);

  // ⚡ ORQUESTADOR CENTRAL DE CONFIRMACIONES
  const handleConfirmAction = useCallback((inputValue?: string) => {
    const { action, data } = modales.confirmDialog;

    if (!data) return;

    switch (action) {
      case 'end_auction':
        endAuctionMutation.mutate(data.id);
        break;
      case 'cancel_ganadora_anticipada':
        // ✅ CAMBIO 2: Si no hay inputValue, mandamos un string genérico 
        // o dejamos que pase para que el backend asigne el suyo por defecto.
        cancelarGanadoraMutation.mutate({
          id: data.pujaId,
          motivo: inputValue?.trim() || "Cancelación administrativa desde el panel"
        });
        break;
      case 'force_finish':
        forceFinishMutation.mutate({
          idLote: data.idLote,
          idGanador: data.idGanador
        });
        break;
      case 'revert_payment':
        revertirPagoMutation.mutate(data.pujaId);
        break;
    }
  }, [modales.confirmDialog, endAuctionMutation, cancelarGanadoraMutation, forceFinishMutation, revertirPagoMutation]);

  return {
    // Estado
    tabValue, setTabValue,
    filterLoteNombre, setFilterLoteNombre,
    filterUserId, setFilterUserId,

    // UX Props
    highlightedId,

    // Datos y Loading
    loading: loadingLotes || (tabValue === 0 && loadingPujas),
    error: errorLotes || (tabValue === 0 ? errorPujas : null),

    // Estado global de mutación (útil para deshabilitar botones)
    isMutating: endAuctionMutation.isPending ||
      forceFinishMutation.isPending ||
      cancelarGanadoraMutation.isPending ||
      revertirPagoMutation.isPending,

    analytics,
    pujasPorLote,
    getUserName,

    // Seleccionados
    pujaSeleccionada, setPujaSeleccionada,

    // Modales
    modales,

    // Actions (API para el Componente)
    handleFinalizarSubasta,
    handleCancelarAdjudicacion,
    handleRevertirPago, // ✅ Ahora existe
    handleForceFinish,  // ✅ Ahora existe
    handleConfirmAction,

    // Mutations (por si se necesitan individualmente)
    forceFinishMutation,
    cancelarGanadoraMutation,
    endAuctionMutation,
    revertirPagoMutation
  };
};
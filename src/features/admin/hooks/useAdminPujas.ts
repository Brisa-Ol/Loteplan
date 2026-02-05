import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../shared/hooks/useModal';
import useSnackbar from '../../../shared/hooks/useSnackbar';

import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import { useSortedData } from './useSortedData';

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

  // 1. Usuarios (Cache agresivo)
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
    error: errorLotes // 🔴 Capturamos error aquí
  } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes', tabValue === 0 ? 'active' : 'all'],
    queryFn: async () => {
      if (tabValue === 0) return (await LoteService.getAllActive()).data;
      return (await LoteService.findAllAdmin()).data;
    },
    refetchInterval: tabValue === 0 ? 10000 : false,
    staleTime: tabValue === 0 ? 5000 : 30000,
  });

  // 3. Pujas (SOLO para TAB 0 - En Vivo)
  const { 
    data: pujasActivas = [], 
    isLoading: loadingPujas,
    error: errorPujas // 🔴 Capturamos error aquí también
  } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas', 'active'],
    queryFn: async () => (await PujaService.getAllActive()).data,
    enabled: tabValue === 0,
    refetchInterval: 5000,
  });

  // --- PROCESAMIENTO DE DATOS ---

  // Helper Nombres
  const getUserName = useCallback((id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (user) return user.nombre_usuario || `${user.nombre} ${user.apellido}`;
    return `ID #${id}`;
  }, [usuarios]);

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
    },
    onError: (err: any) => showError(`Error: ${err.response?.data?.error || 'Datos inválidos'}`)
  });

  const cancelarGanadoraMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      return await PujaService.cancelarGanadoraAnticipada(id, motivo);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = res.data?.message || 'Adjudicación anulada y token devuelto.';
      showSuccess(`✅ ${msg}`);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al cancelar adjudicación');
      modales.confirmDialog.close();
    }
  });

  // --- HANDLERS ---

  const handleFinalizarSubasta = useCallback((lote: LoteDto) => {
    modales.confirmDialog.confirm('end_auction', lote);
  }, [modales.confirmDialog]);

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

  const handleConfirmAction = useCallback((inputValue?: string) => {
    const { action, data } = modales.confirmDialog;
    
    if (action === 'end_auction' && data) {
      endAuctionMutation.mutate(data.id);
    }
    if (action === 'cancel_ganadora_anticipada' && data) {
      if (!inputValue) return;
      cancelarGanadoraMutation.mutate({
        id: data.pujaId,
        motivo: inputValue
      });
    }
  }, [modales.confirmDialog, endAuctionMutation, cancelarGanadoraMutation]);

  return {
    // Estado
    tabValue, setTabValue,
    filterLoteNombre, setFilterLoteNombre,
    filterUserId, setFilterUserId,

    // UX Props
    highlightedId,

    // Datos y Loading
    loading: loadingLotes || (tabValue === 0 && loadingPujas),
    // 🟢 AQUÍ ESTÁ LA CORRECCIÓN: Devolvemos el error combinado
    error: errorLotes || (tabValue === 0 ? errorPujas : null),
    
    analytics,
    pujasPorLote,
    getUserName,

    // Seleccionados
    pujaSeleccionada, setPujaSeleccionada,

    // Modales
    modales,

    // Actions
    handleFinalizarSubasta,
    handleCancelarAdjudicacion,
    handleConfirmAction,

    // Mutations
    forceFinishMutation,
    cancelarGanadoraMutation,
    endAuctionMutation
  };
};
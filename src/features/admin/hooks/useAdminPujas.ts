import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../shared/hooks/useModal';

import useSnackbar from '../../../shared/hooks/useSnackbar';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';
import LoteService from '@/core/api/services/lote.service';
import { useSortedData } from './useSortedData';

export const useAdminPujas = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Estados UI
  const [tabValue, setTabValue] = useState(0);
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filterLoteNombre, setFilterLoteNombre] = useState('');
  const [filterUserId, setFilterUserId] = useState('');

  // Estados Selección
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);
  const [pujaSeleccionada, setPujaSeleccionada] = useState<PujaDto | null>(null);
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);

  // Modales
  const modales = {
    contactar: useModal(),
    detallePuja: useModal(),
    confirmDialog: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: lotesRaw = [], isLoading: loadingLotes, error: errorLotes } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000, 
  });

  const { data: pujasRaw = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas'],
    queryFn: async () => (await PujaService.getAllAdmin()).data,
    refetchInterval: tabValue === 0 ? 5000 : 15000,
  });

  const { data: usuarios = [] } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAllAdmins()).data,
    staleTime: 1000 * 60 * 5, 
  });

  // ✨ 1. APLICAR HOOK DE ORDENAMIENTO + HIGHLIGHT
  // Ordenamos los lotes para que los más recientes aparezcan primero en las tablas.
  const { sortedData: lotesOrdenados, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // Helpers
  const getUserName = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (user) return user.nombre_usuario || `${user.nombre} ${user.apellido}`;
    return `User #${id}`;
  };

  // --- ANALYTICS (Memoized) ---
  
  // 1. Filtrado General
  const filteredLotes = useMemo(() => {
    let result = lotesOrdenados; // Usamos la lista ya ordenada por ID desc
    if (filterLoteNombre) {
      result = result.filter(l => l.nombre_lote.toLowerCase().includes(filterLoteNombre.toLowerCase()));
    }
    return result;
  }, [lotesOrdenados, filterLoteNombre]);

  // 2. Mapeo de Pujas
  const pujasPorLote = useMemo(() => {
    const map: Record<number, PujaDto[]> = {};
    pujasRaw.forEach(p => {
      if (filterUserId && p.id_usuario.toString() !== filterUserId) return;
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });
    
    // Ordenar pujas por monto descendente (mayor oferta arriba)
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });
    return map;
  }, [pujasRaw, filterUserId]);

  // 3. Segmentación para Tabs
  const analytics = useMemo(() => {
    // Activos (En Vivo)
    const activos = filteredLotes.filter(l => l.estado_subasta === 'activa');
    
    // Pendientes de Pago (Tab 1)
    const pendientesPago = filteredLotes.filter(l => {
        const matchesUser = filterUserId ? l.id_ganador?.toString() === filterUserId : true;
        // Solo mostramos si finalizó, tiene ganador y no ha fallado 3 veces
        return l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) < 3 && matchesUser;
    });

    // En Riesgo / Impagos (Tab 2)
    const lotesEnRiesgo = filteredLotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    
    // Dinero total en juego (Suma de ofertas ganadoras actuales)
    const dineroEnJuego = activos.reduce((acc, lote) => {
        const topPuja = pujasPorLote[lote.id]?.[0];
        return acc + (topPuja ? Number(topPuja.monto_puja) : Number(lote.precio_base));
    }, 0);

    const totalPujasActivas = pujasRaw.filter(p => p.estado_puja === 'activa').length;

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: totalPujasActivas };
  }, [filteredLotes, pujasPorLote, pujasRaw, filterUserId]);

  // --- MUTACIONES ---
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      
      showSuccess('Subasta finalizada correctamente');
      modales.confirmDialog.close();
      
      // ✨ Highlight
      triggerHighlight(id);
    },
    onError: () => { showError('Error al finalizar'); modales.confirmDialog.close(); }
  });

  const enviarRecordatorioMutation = useMutation({
    mutationFn: async (loteId: number) => new Promise(resolve => setTimeout(resolve, 800)),
    onSuccess: (_, loteId) => {
        showSuccess('📧 Recordatorio enviado');
        triggerHighlight(loteId);
    },
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
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = res.data.message || (res.data as any).mensaje || 'Adjudicación anulada y token devuelto.';
      showSuccess(`✅ ${msg}`);
      modales.confirmDialog.close();

      // ✨ Highlight Lote afectado (sacamos el ID del contexto del dialogo si está disponible, o recargamos)
      // Como 'variables' tiene el ID de la PUJA, no del LOTE, aquí dependemos de que la vista se actualice.
      // Pero si tuviéramos el idLote en variables sería mejor.
    },
    onError: (err: any) => {
        showError(err.response?.data?.message || 'Error al cancelar adjudicación');
        modales.confirmDialog.close();
    }
  });

  // --- HANDLERS ---
  const handleContactar = (lote: LoteDto) => {
    const pujaGanadora = pujasRaw.find(p => p.id_lote === lote.id && (p.estado_puja === 'ganadora_pendiente' || p.estado_puja === 'ganadora_pagada'));
    const monto = pujaGanadora ? Number(pujaGanadora.monto_puja) : Number(lote.precio_base);
    setLoteSeleccionado(lote);
    setMontoSeleccionado(monto);
    modales.contactar.open();
  };

  const handleFinalizarSubasta = (lote: LoteDto) => {
      modales.confirmDialog.confirm('end_auction', lote);
  };
  
  const handleCancelarAdjudicacion = (lote: LoteDto) => {
    const puja = pujasRaw.find(p => p.id_lote === lote.id && p.estado_puja === 'ganadora_pendiente');
    if (!puja) return showError('No se encontró la puja ganadora pendiente.');

    modales.confirmDialog.confirm('cancel_ganadora_anticipada', { 
        ...lote, 
        pujaId: puja.id,
        id_ganador: lote.id_ganador 
    });
  };

  const handleConfirmAction = (inputValue?: string) => {
      if (modales.confirmDialog.action === 'end_auction' && modales.confirmDialog.data) {
          endAuctionMutation.mutate(modales.confirmDialog.data.id);
      }
      if (modales.confirmDialog.action === 'cancel_ganadora_anticipada' && modales.confirmDialog.data) {
          if (!inputValue) return;
          cancelarGanadoraMutation.mutate({ 
              id: modales.confirmDialog.data.pujaId, 
              motivo: inputValue 
          });
      }
  };

  return {
    // Estado
    tabValue, setTabValue,
    filtrosVisible, setFiltrosVisible,
    filterLoteNombre, setFilterLoteNombre,
    filterUserId, setFilterUserId,
    
    // ✨ UX Props
    highlightedId,

    // Datos y Loading
    loading: loadingLotes || loadingPujas,
    error: errorLotes,
    analytics,
    pujasPorLote,
    pujas: pujasRaw, 
    getUserName,

    // Seleccionados
    loteSeleccionado, setLoteSeleccionado,
    pujaSeleccionada, setPujaSeleccionada,
    montoSeleccionado,

    // Modales
    modales,

    // Actions
    handleContactar,
    handleFinalizarSubasta,
    handleCancelarAdjudicacion,
    handleConfirmAction,
    
    // Mutations
    enviarRecordatorioMutation,
    forceFinishMutation,
    cancelarGanadoraMutation,
    endAuctionMutation
  };
};
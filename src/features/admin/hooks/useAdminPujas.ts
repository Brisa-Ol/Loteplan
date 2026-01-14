import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../shared/hooks/useModal';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';
import LoteService from '@/core/api/services/lote.service';
import type { UsuarioDto } from '@/core/types/dto/usuario.dto';


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
  const { data: lotes = [], isLoading: loadingLotes, error: errorLotes } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 10000, 
  });

  const { data: pujas = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminPujas'],
    queryFn: async () => (await PujaService.getAllAdmin()).data,
    refetchInterval: tabValue === 0 ? 5000 : 15000,
  });

  const { data: usuarios = [] } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAllAdmins()).data,
    staleTime: 1000 * 60 * 5, 
  });

  // Helpers
  const getUserName = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (user) return user.nombre_usuario || `${user.nombre} ${user.apellido}`;
    return `User #${id}`;
  };

  // --- ANALYTICS (Memoized) ---
  const filteredLotes = useMemo(() => {
    let result = lotes;
    if (filterLoteNombre) {
      result = result.filter(l => l.nombre_lote.toLowerCase().includes(filterLoteNombre.toLowerCase()));
    }
    return result;
  }, [lotes, filterLoteNombre]);

  const pujasPorLote = useMemo(() => {
    const map: Record<number, PujaDto[]> = {};
    pujas.forEach(p => {
      if (filterUserId && p.id_usuario.toString() !== filterUserId) return;
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });
    // Ordenar pujas por monto descendente
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });
    return map;
  }, [pujas, filterUserId]);

  const analytics = useMemo(() => {
    const activos = filteredLotes.filter(l => l.estado_subasta === 'activa');
    
    const pendientesPago = filteredLotes.filter(l => {
        const matchesUser = filterUserId ? l.id_ganador?.toString() === filterUserId : true;
        return l.estado_subasta === 'finalizada' && l.id_ganador && (l.intentos_fallidos_pago || 0) < 3 && matchesUser;
    });

    const lotesEnRiesgo = filteredLotes.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    
    const dineroEnJuego = activos.reduce((acc, lote) => {
        const topPuja = pujasPorLote[lote.id]?.[0];
        return acc + (topPuja ? Number(topPuja.monto_puja) : Number(lote.precio_base));
    }, 0);

    const totalPujasActivas = pujas.filter(p => p.estado_puja === 'activa').length;

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: totalPujasActivas };
  }, [filteredLotes, pujasPorLote, pujas, filterUserId]);

  // --- MUTACIONES ---
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      showSuccess('Subasta finalizada correctamente');
      modales.confirmDialog.close();
    },
    onError: () => { showError('Error al finalizar'); modales.confirmDialog.close(); }
  });

  const enviarRecordatorioMutation = useMutation({
    mutationFn: async (_loteId: number) => new Promise(resolve => setTimeout(resolve, 800)), // Simulación
    onSuccess: () => showSuccess('📧 Recordatorio enviado'),
  });

  const forceFinishMutation = useMutation({
      mutationFn: ({ idLote, idGanador }: { idLote: number, idGanador: number | null }) => 
          PujaService.manageAuctionEnd(idLote, idGanador),
      onSuccess: () => {
          showSuccess("Gestión ejecutada manualmente.");
          queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      },
      onError: (err: any) => showError(`Error: ${err.response?.data?.error || 'Datos inválidos'}`)
  });

  const cancelarGanadoraMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      return await PujaService.cancelarGanadoraAnticipada(id, motivo);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['adminPujas'] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = res.data.message || (res.data as any).mensaje || 'Adjudicación anulada y token devuelto.';
      showSuccess(`✅ ${msg}`);
      modales.confirmDialog.close();
    },
    onError: (err: any) => {
        showError(err.response?.data?.message || 'Error al cancelar adjudicación');
        modales.confirmDialog.close();
    }
  });

  // --- HANDLERS ---
  const handleContactar = (lote: LoteDto) => {
    const pujaGanadora = pujas.find(p => p.id_lote === lote.id && (p.estado_puja === 'ganadora_pendiente' || p.estado_puja === 'ganadora_pagada'));
    const monto = pujaGanadora ? Number(pujaGanadora.monto_puja) : Number(lote.precio_base);
    setLoteSeleccionado(lote);
    setMontoSeleccionado(monto);
    modales.contactar.open();
  };

  const handleFinalizarSubasta = (lote: LoteDto) => {
      modales.confirmDialog.confirm('end_auction', lote);
  };
  
  const handleCancelarAdjudicacion = (lote: LoteDto) => {
    const puja = pujas.find(p => p.id_lote === lote.id && p.estado_puja === 'ganadora_pendiente');
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
    
    // Datos y Loading
    loading: loadingLotes || loadingPujas,
    error: errorLotes,
    analytics,
    pujasPorLote,
    pujas, // Necesario para columnasImpagos
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
    
    // Mutations (para botones en tabla)
    enviarRecordatorioMutation,
    forceFinishMutation,
    cancelarGanadoraMutation,
    endAuctionMutation
  };
};
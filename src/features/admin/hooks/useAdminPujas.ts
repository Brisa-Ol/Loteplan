import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../shared/hooks/useModal';

import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import UsuarioService from '@/core/api/services/usuario.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useSortedData } from './useSortedData';

export const useAdminPujas = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Estados UI
  const [tabValue, setTabValue] = useState(0);
  const [filterLoteNombre, setFilterLoteNombre] = useState('');
  const [filterUserId, setFilterUserId] = useState('');

  // Estados Selección (Solo para detalle de puja)
  const [pujaSeleccionada, setPujaSeleccionada] = useState<PujaDto | null>(null);

  // Modales
  const modales = {
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

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: lotesOrdenados, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // Helpers
  const getUserName = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (user) return user.nombre_usuario || `${user.nombre} ${user.apellido}`;
    return `User #${id}`;
  };

  // --- ANALYTICS (Memoized) ---
  const filteredLotes = useMemo(() => {
    let result = lotesOrdenados;
    if (filterLoteNombre) {
      result = result.filter(l => l.nombre_lote.toLowerCase().includes(filterLoteNombre.toLowerCase()));
    }
    return result;
  }, [lotesOrdenados, filterLoteNombre]);

  const pujasPorLote = useMemo(() => {
    const map: Record<number, PujaDto[]> = {};
    pujasRaw.forEach(p => {
      if (filterUserId && p.id_usuario.toString() !== filterUserId) return;
      if (!map[p.id_lote]) map[p.id_lote] = [];
      map[p.id_lote].push(p);
    });

    // Ordenar pujas por monto descendente
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja));
    });
    return map;
  }, [pujasRaw, filterUserId]);

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

    const totalPujasActivas = pujasRaw.filter(p => p.estado_puja === 'activa').length;

    return { activos, pendientesPago, lotesEnRiesgo, dineroEnJuego, totalPujas: totalPujasActivas };
  }, [filteredLotes, pujasPorLote, pujasRaw, filterUserId]);

  // --- MUTACIONES ---

  // 1. Finalizar Subasta (Manual)
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

  // 2. Gestión Admin (Sancionar/Forzar cierre)
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

  // 3. Cancelar Ganadora (Anular adjudicación)
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
    filterLoteNombre, setFilterLoteNombre,
    filterUserId, setFilterUserId,

    // UX Props
    highlightedId,

    // Datos y Loading
    loading: loadingLotes || loadingPujas,
    error: errorLotes,
    analytics,
    pujasPorLote,
    pujas: pujasRaw,
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
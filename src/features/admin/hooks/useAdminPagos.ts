import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';

import type { PagoDto } from '@/core/types/dto/pago.dto';
import UsuarioService from '@/core/api/services/usuario.service';
import PagoService from '@/core/api/services/pago.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useSortedData } from './useSortedData';

export const useAdminPagos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // Estados UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Modales
  const detalleModal = useModal();
  const [selectedPago, setSelectedPago] = useState<PagoDto | null>(null);

  // --- QUERIES ---
  
  // 1. Pagos (Data Cruda)
  const { data: pagosRaw = [], isLoading: l1, error: e1 } = useQuery({
    queryKey: ['adminPagos'],
    queryFn: async () => (await PagoService.findAll()).data,
  });

  // ✨ 2. ORDENAMIENTO + HIGHLIGHT
  // Ordenamos los pagos (más recientes primero)
  const { sortedData: pagosOrdenados, highlightedId, triggerHighlight } = useSortedData(pagosRaw);

  const today = new Date();
  const { data: metricsData, isLoading: l2, error: e2 } = useQuery({
    queryKey: ['adminPagosMetrics', today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => (await PagoService.getMonthlyMetrics(today.getMonth() + 1, today.getFullYear())).data,
  });
  const metrics = metricsData?.data;

  const { data: usuarios = [] } = useQuery({
    queryKey: ['adminUsuariosMap'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 300000,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 300000,
  });

  const isLoading = l1 || l2;
  const error = e1 || e2;

  // --- HELPERS (Memoized Maps) ---
  const usuariosMap = useMemo(() => new Map(usuarios.map(u => [u.id, u])), [usuarios]);
  const proyectosMap = useMemo(() => new Map(proyectos.map(p => [p.id, p])), [proyectos]);

  const getUserName = useCallback((id?: number) => {
    if (!id) return '-';
    const u = usuariosMap.get(id);
    return u ? `${u.nombre} ${u.apellido}` : `ID ${id}`;
  }, [usuariosMap]);

  const getProjectName = useCallback((id?: number) => {
    if (!id) return '-';
    const p = proyectosMap.get(id);
    return p ? p.nombre_proyecto : `ID ${id}`;
  }, [proyectosMap]);

  // --- CÁLCULOS Y FILTROS ---
  const alerts = useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const dueSoon = pagosOrdenados.filter(p => {
      const d = new Date(p.fecha_vencimiento);
      return p.estado_pago === 'pendiente' && d >= now && d <= threeDaysLater;
    });

    const veryOverdue = pagosOrdenados.filter(p => {
      const d = new Date(p.fecha_vencimiento);
      return (p.estado_pago === 'vencido' || (p.estado_pago === 'pendiente' && d < now)) && d < thirtyDaysAgo;
    });

    return { dueSoon, veryOverdue };
  }, [pagosOrdenados]);

  const globalStats = useMemo(() => {
    const totalPendiente = pagosOrdenados
      .filter(p => p.estado_pago === 'pendiente')
      .reduce((sum, p) => sum + Number(p.monto), 0);
    return { totalPendiente };
  }, [pagosOrdenados]);

  const filteredPagos = useMemo(() => {
    return pagosOrdenados.filter(pago => {
      const uName = getUserName(pago.id_usuario).toLowerCase();
      const pName = getProjectName(pago.id_proyecto).toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = 
        uName.includes(term) || 
        pName.includes(term) || 
        pago.id.toString().includes(term);

      const matchesState = filterState === 'all' || pago.estado_pago === filterState;

      let matchesDate = true;
      if (dateStart || dateEnd) {
        const pDate = new Date(pago.fecha_vencimiento);
        if (dateStart && pDate < new Date(dateStart)) matchesDate = false;
        if (dateEnd) {
          const endDate = new Date(dateEnd);
          endDate.setHours(23, 59, 59);
          if (pDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesState && matchesDate;
    });
  }, [pagosOrdenados, searchTerm, filterState, dateStart, dateEnd, getUserName, getProjectName]);

  // --- HANDLERS ---
  const handleUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
    queryClient.invalidateQueries({ queryKey: ['adminPagosMetrics'] });
    
    // ✨ Highlight Automático
    if (selectedPago?.id) {
        triggerHighlight(selectedPago.id);
    }
    
    showSuccess('Estado de pago actualizado correctamente');
  }, [queryClient, selectedPago, showSuccess, triggerHighlight]);

  const handleVerDetalle = useCallback((pago: PagoDto) => {
    setSelectedPago(pago);
    detalleModal.open();
  }, [detalleModal]);

  const handleCloseDetalle = useCallback(() => {
    detalleModal.close();
    setTimeout(() => setSelectedPago(null), 300);
  }, [detalleModal]);

  return {
    theme,
    // State
    searchTerm, setSearchTerm,
    filterState, setFilterState,
    dateStart, setDateStart,
    dateEnd, setDateEnd,
    
    // ✨ UX Props
    highlightedId,
    
    selectedPago,

    // Data
    pagos: pagosOrdenados, // Exportamos la lista ordenada
    filteredPagos,
    metrics,
    alerts,
    globalStats,
    
    // Loading
    isLoading,
    error,

    // Helpers
    getUserName,
    getProjectName,

    // Modales
    detalleModal,

    // Handlers
    handleUpdate,
    handleVerDetalle,
    handleCloseDetalle
  };
};
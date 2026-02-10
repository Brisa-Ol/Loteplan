import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useSortedData } from './useSortedData';

// ============================================================================
// HOOK DE DEBOUNCE (Inline para consistencia)
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// HOOK PRINCIPAL - ULTRA OPTIMIZADO
// ============================================================================
export const useAdminSuscripciones = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES (CORREGIDO: Hooks llamados en nivel superior) ---
  const detailModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Agrupamos en useMemo
  const modales = useMemo(() => ({
    detail: detailModal,
    confirm: confirmDialog
  }), [detailModal, confirmDialog]);

  // --- ESTADOS UI ---
  const [tabIndex, setTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');

  // Selección
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

  // ✨ DEBOUNCE del search term
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERIES CON CACHE OPTIMIZADO ---
  const { data: suscripcionesRaw = [], isLoading: l1, error } = useQuery({
    queryKey: ['adminSuscripciones', filterStatus],
    queryFn: async () => {
      // Optimizamos la llamada según el filtro para traer menos data del back si es posible
      if (filterStatus === 'activas') {
        return (await SuscripcionService.findAllActivas()).data;
      }
      return (await SuscripcionService.findAll()).data;
    },
    staleTime: 30000,        // 30 segundos de frescura
    gcTime: 5 * 60 * 1000,   // 5 minutos en memoria
    refetchOnWindowFocus: false,
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: suscripcionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(suscripcionesRaw);

  // Selectores auxiliares (Proyectos)
  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  });

  // Métricas
  const { data: morosidadStats, isLoading: l2 } = useQuery({
    queryKey: ['metricsMorosidad'],
    queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data,
    staleTime: 30000,
  });

  const { data: cancelacionStats, isLoading: l3 } = useQuery({
    queryKey: ['metricsCancelacionMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
    staleTime: 30000,
  });

  const isLoading = l1 || l2 || l3;

  // Filtrado (Sobre data ordenada + Debounce)
  const filteredSuscripciones = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return suscripcionesOrdenadas.filter(suscripcion => {
      // ✨ Short-circuit en búsqueda
      const matchesSearch = !term || (
        suscripcion.usuario?.nombre.toLowerCase().includes(term) ||
        suscripcion.usuario?.apellido.toLowerCase().includes(term) ||
        suscripcion.usuario?.email.toLowerCase().includes(term) ||
        suscripcion.proyectoAsociado?.nombre_proyecto.toLowerCase().includes(term) ||
        suscripcion.id.toString().includes(term)
      );

      let matchesProject = true;
      if (filterProject !== 'all') {
        matchesProject = suscripcion.id_proyecto === Number(filterProject);
      }

      let matchesStatus = true;
      // Nota: El filtro de estado ya viene pre-filtrado por la query si usas el endpoint findAllActivas,
      // pero mantenemos esto por si usas findAll y filtras en cliente.
      if (filterStatus === 'activas') matchesStatus = suscripcion.activo === true;
      if (filterStatus === 'inactivas') matchesStatus = suscripcion.activo === false;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [suscripcionesOrdenadas, debouncedSearchTerm, filterProject, filterStatus]);

  // Cálculos Stats
  const stats = useMemo(() => {
    const totalSuscripciones = Number(cancelacionStats?.total_suscripciones || 0);
    const totalCanceladas = Number(cancelacionStats?.total_canceladas || 0);
    return {
      totalSuscripciones,
      totalCanceladas,
      totalActivas: Math.max(0, totalSuscripciones - totalCanceladas),
      tasaCancelacion: Number(cancelacionStats?.tasa_cancelacion || 0),
      tasaMorosidad: Number(morosidadStats?.tasa_morosidad || 0),
      totalEnRiesgo: Number(morosidadStats?.total_en_riesgo || 0),
      totalGenerado: Number(morosidadStats?.total_pagos_generados || 0)
    };
  }, [cancelacionStats, morosidadStats]);

  // --- MUTACIONES ---
  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
    onSuccess: (_, id) => {
      // Invalida todo lo relacionado para recalcular métricas y listas
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });

      modales.confirm.close();

      // ✨ Highlight Automático
      triggerHighlight(id);
      showSuccess('Suscripción cancelada correctamente.');
    },
    onError: (err: any) => {
      modales.confirm.close();
      const msg = err.response?.data?.error || 'Error al cancelar la suscripción.';
      showError(msg);
    }
  });

  // --- HANDLERS (Callbacks Estables) ---
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  }, []);

  const handleCancelarClick = useCallback((suscripcion: SuscripcionDto) => {
    if (!suscripcion.activo) return;
    modales.confirm.confirm('admin_cancel_subscription', suscripcion);
  }, [modales.confirm]);

  const handleConfirmAction = useCallback(() => {
    if (modales.confirm.action === 'admin_cancel_subscription' && modales.confirm.data) {
      cancelarMutation.mutate(modales.confirm.data.id);
    }
  }, [modales.confirm, cancelarMutation]);

  const handleVerDetalle = useCallback((s: SuscripcionDto) => {
    setSelectedSuscripcion(s);
    modales.detail.open();
  }, [modales.detail]);

  const handleCerrarModal = useCallback(() => {
    modales.detail.close();
    setTimeout(() => setSelectedSuscripcion(null), 300);
  }, [modales.detail]);

  return {
    theme,
    // State
    tabIndex,
    setTabIndex, // Exportado para uso en alertas
    handleTabChange,
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedSuscripcion,

    // ✨ UX Props
    highlightedId,

    // Data & Stats
    stats,
    proyectos,
    filteredSuscripciones,

    // Loading
    isLoading,
    isLoadingStats: l2 || l3,
    isCancelling: cancelarMutation.isPending,
    error,

    // Modales
    modales,

    // Handlers
    handleCancelarClick,
    handleConfirmAction,
    handleVerDetalle,
    handleCerrarModal
  };
};
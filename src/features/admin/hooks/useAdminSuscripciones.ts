import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useSortedData } from './useSortedData';

export const useAdminSuscripciones = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();

  // Estados UI
  const [tabIndex, setTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');
  
  // Selección
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

  // Modales
  const modales = {
    detail: useModal(),
    confirm: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: suscripcionesRaw = [], isLoading: l1, error } = useQuery({
    queryKey: ['adminSuscripciones', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'activas') {
        return (await SuscripcionService.findAllActivas()).data;
      }
      return (await SuscripcionService.findAll()).data;
    },
    refetchInterval: 30000,
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: suscripcionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(suscripcionesRaw);

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000,
  });

  const { data: morosidadStats, isLoading: l2 } = useQuery({
    queryKey: ['metricsMorosidad'],
    queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data,
  });

  const { data: cancelacionStats, isLoading: l3 } = useQuery({
    queryKey: ['metricsCancelacionMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  const isLoading = l1 || l2 || l3;

  // Filtrado (Sobre data ordenada)
  const filteredSuscripciones = useMemo(() => {
    return suscripcionesOrdenadas.filter(suscripcion => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        suscripcion.usuario?.nombre.toLowerCase().includes(term) ||
        suscripcion.usuario?.apellido.toLowerCase().includes(term) ||
        suscripcion.usuario?.email.toLowerCase().includes(term) ||
        suscripcion.proyectoAsociado?.nombre_proyecto.toLowerCase().includes(term) ||
        suscripcion.id.toString().includes(term);

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
  }, [suscripcionesOrdenadas, searchTerm, filterProject, filterStatus]);

  // Cálculos Stats
  const stats = useMemo(() => {
      // CORRECCIÓN: Convertir todo a Number explícitamente para evitar error de operador '>'
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
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });

      modales.confirm.close();
      
      // ✨ Highlight Automático (Visualizar qué se canceló)
      triggerHighlight(id);
      showSuccess('Suscripción cancelada correctamente.');
    },
    onError: (err: any) => {
        modales.confirm.close();
        const msg = err.response?.data?.error || 'Error al cancelar la suscripción.';
        showError(msg);
    }
  });

  // --- HANDLERS ---
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);

  const handleCancelarClick = (suscripcion: SuscripcionDto) => {
    if (!suscripcion.activo) return;
    modales.confirm.confirm('admin_cancel_subscription', suscripcion);
  };

  const handleConfirmAction = () => {
    if (modales.confirm.action === 'admin_cancel_subscription' && modales.confirm.data) {
      cancelarMutation.mutate(modales.confirm.data.id);
    }
  };

  const handleVerDetalle = (s: SuscripcionDto) => {
    setSelectedSuscripcion(s);
    modales.detail.open();
  };

  const handleCerrarModal = () => {
    modales.detail.close();
    setTimeout(() => setSelectedSuscripcion(null), 300);
  };

  return {
    theme,
    // State
    tabIndex, 
    setTabIndex, // CORRECCIÓN: Exportado para poder usarlo en el componente
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
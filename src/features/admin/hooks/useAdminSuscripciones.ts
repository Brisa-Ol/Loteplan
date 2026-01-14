import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useModal } from '@/shared/hooks/useModal';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import ProyectoService from '@/core/api/services/proyecto.service';


export const useAdminSuscripciones = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();

  // Estados UI
  const [tabIndex, setTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');
  
  // Selección y Feedback
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Modales
  const modales = {
    detail: useModal(),
    confirm: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: suscripciones = [], isLoading: loadingSuscripciones, error } = useQuery({
    queryKey: ['adminSuscripciones', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'activas') {
        return (await SuscripcionService.findAllActivas()).data;
      }
      return (await SuscripcionService.findAll()).data;
    },
    refetchInterval: 30000,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000,
  });

  const { data: morosidadStats, isLoading: loadMorosidad } = useQuery({
    queryKey: ['metricsMorosidad'],
    queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data,
  });

  const { data: cancelacionStats, isLoading: loadCancelacion } = useQuery({
    queryKey: ['metricsCancelacionMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  // Cálculos Stats
  const stats = useMemo(() => {
      const totalSuscripciones = cancelacionStats?.total_suscripciones || 0;
      const totalCanceladas = cancelacionStats?.total_canceladas || 0;
      return {
          totalSuscripciones,
          totalCanceladas,
          totalActivas: Math.max(0, totalSuscripciones - totalCanceladas),
          tasaCancelacion: cancelacionStats?.tasa_cancelacion || 0,
          tasaMorosidad: morosidadStats?.tasa_morosidad || 0,
          totalEnRiesgo: morosidadStats?.total_en_riesgo || 0,
          totalGenerado: morosidadStats?.total_pagos_generados || 0
      };
  }, [cancelacionStats, morosidadStats]);

  // Filtrado
  const filteredSuscripciones = useMemo(() => {
    return suscripciones.filter(suscripcion => {
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
      if (filterStatus === 'activas') matchesStatus = suscripcion.activo === true;
      if (filterStatus === 'inactivas') matchesStatus = suscripcion.activo === false;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [suscripciones, searchTerm, filterProject, filterStatus]);

  // --- MUTACIONES ---
  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });

      modales.confirm.close();
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 2500);
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
    tabIndex, handleTabChange,
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedSuscripcion,
    highlightedId,
    
    // Data & Stats
    stats,
    proyectos,
    filteredSuscripciones,
    
    // Loading
    isLoading: loadingSuscripciones,
    isLoadingStats: loadMorosidad || loadCancelacion,
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
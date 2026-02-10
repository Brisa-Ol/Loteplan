import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import LoteService from '@/core/api/services/lote.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '@/core/types/dto/lote.dto';

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
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

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export const useAdminLotes = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- MODALES (Nivel Superior) ---
  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    create: createModal,
    edit: editModal,
    images: imagesModal,
    auction: auctionModal,
    confirm: confirmDialog
  }), [createModal, editModal, imagesModal, auctionModal, confirmDialog]);

  // --- ESTADOS UI ---
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Inicializar filtro desde URL
  const [filterProject, setFilterProject] = useState<string>(searchParams.get('proyecto') || 'all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Sincronizar URL con filtro
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filterProject === 'all' || filterProject === 'huerfano') {
      params.delete('proyecto');
    } else {
      params.set('proyecto', filterProject);
    }
    setSearchParams(params, { replace: true });
  }, [filterProject, setSearchParams]);

  // --- QUERIES OPTIMIZADAS ---
  const { data: lotesRaw = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    staleTime: 30000,      // 30s Fresh
    gcTime: 5 * 60 * 1000, // 5m Cache
    refetchOnWindowFocus: false,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000, // Los proyectos cambian menos frecuente
  });

  // Ordenamiento
  const { sortedData: sortedLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // --- FILTRADO (Memoizado) ---
  const filteredLotes = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return sortedLotes.filter((lote) => {
      // 1. Buscador texto
      const matchesSearch = !term ||
        lote.nombre_lote.toLowerCase().includes(term) ||
        lote.id.toString().includes(term);

      // 2. Filtro Proyecto
      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);

      return matchesSearch && matchesProject;
    });
  }, [sortedLotes, debouncedSearchTerm, filterProject]);

  // --- STATS ---
  const stats = useMemo(() => ({
    total: lotesRaw.length,
    enSubasta: lotesRaw.filter((l) => l.estado_subasta === 'activa').length,
    finalizados: lotesRaw.filter((l) => l.estado_subasta === 'finalizada').length,
    huerfanos: lotesRaw.filter((l) => !l.id_proyecto).length,
  }), [lotesRaw]);

  // --- HELPERS ---
  const checkIsSubastable = useCallback((lote: LoteDto) => {
    if (!lote.id_proyecto) return { allowed: false, reason: 'Sin proyecto asignado' };
    const proyecto = proyectos.find((p) => p.id === lote.id_proyecto);
    if (proyecto?.tipo_inversion === 'directo') {
      return { allowed: false, reason: 'Proyecto de Inversión Directa (No Subastable)' };
    }
    return { allowed: true, reason: '' };
  }, [proyectos]);

  // --- MUTACIONES ---
  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number }) => {
      if (payload.id) return await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      return await LoteService.create(payload.dto as CreateLoteDto);
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      handleCloseAllModals();
      const targetId = variables.id || response.data.id;
      if (targetId) triggerHighlight(targetId);
      showSuccess(variables.id ? 'Lote actualizado' : 'Lote creado exitosamente');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al guardar'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) =>
      await LoteService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      modales.confirm.close();
      triggerHighlight(variables.id);
      showSuccess(variables.activo ? 'Lote visible' : 'Lote ocultado');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'Error al cambiar estado');
      modales.confirm.close();
    },
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      modales.auction.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta iniciada');
    },
    onError: () => showError('Error al iniciar subasta'),
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      modales.auction.close();
      triggerHighlight(id);
      showSuccess('✅ Subasta finalizada');
    },
    onError: () => showError('Error al finalizar subasta'),
  });

  // --- HANDLERS ---
  const handleCloseAllModals = useCallback(() => {
    modales.create.close();
    modales.edit.close();
    modales.images.close();
    modales.auction.close();
    setTimeout(() => setSelectedLote(null), 300);
  }, [modales]);

  const handleOpenCreate = useCallback(() => {
    setSelectedLote(null);
    modales.create.open();
  }, [modales.create]);

  const handleOpenEdit = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    modales.edit.open();
  }, [modales.edit]);

  const handleManageImages = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    modales.images.open();
  }, [modales.images]);

  const handleAuctionClick = useCallback((lote: LoteDto) => {
    setSelectedLote(lote);
    modales.auction.open();
  }, [modales.auction]);

  const handleToggleActive = useCallback((lote: LoteDto) => {
    modales.confirm.confirm('toggle_lote_visibility', lote);
  }, [modales.confirm]);

  const handleConfirmAction = useCallback(() => {
    if (modales.confirm.action === 'toggle_lote_visibility' && modales.confirm.data) {
      toggleActiveMutation.mutate({
        id: modales.confirm.data.id,
        activo: !modales.confirm.data.activo,
      });
    }
  }, [modales.confirm, toggleActiveMutation]);

  return {
    theme,
    // State
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    viewMode, setViewMode,
    selectedLote,

    // Data
    filteredLotes,
    proyectos,
    stats,
    highlightedId,

    // Loading
    loadingLotes,
    error,
    isToggling: toggleActiveMutation.isPending,
    isSaving: saveMutation.isPending,
    isAuctionLoading: startAuction.isPending || endAuction.isPending,

    // Helpers
    checkIsSubastable,

    // Modales
    modales,

    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleManageImages,
    handleAuctionClick,
    handleToggleActive,
    handleConfirmAction,

    // Mutations (Exposed functions)
    saveLote: saveMutation.mutateAsync,
    startAuctionFn: startAuction.mutate,
    endAuctionFn: endAuction.mutate
  };
};
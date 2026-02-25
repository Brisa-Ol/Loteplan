// src/features/admin/hooks/lotes/useAdminLotes.ts

import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import LoteService from '@/core/api/services/lote.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import PujaService from '@/core/api/services/puja.service';
import ImagenService from '@/core/api/services/imagen.service'; // 👈 Asegurar este import

import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '@/core/types/dto/lote.dto';

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useSortedData } from '../useSortedData';

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminLotes = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- MODALES ---
  const createModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const auctionModal = useModal();
  const overviewModal = useModal(); 
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    create: createModal,
    edit: editModal,
    images: imagesModal,
    auction: auctionModal,
    overview: overviewModal,
    confirm: confirmDialog
  }), [createModal, editModal, imagesModal, auctionModal, overviewModal, confirmDialog]);

  // --- ESTADOS UI ---
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>(searchParams.get('proyecto') || 'all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filterEstadoSubasta, setFilterEstadoSubasta] = useState<string>('all');
  const [filterTipoInversion, setFilterTipoInversion] = useState<string>('all');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Sincronizar URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filterProject === 'all' || filterProject === 'huerfano') params.delete('proyecto');
    else params.set('proyecto', filterProject);
    setSearchParams(params, { replace: true });
  }, [filterProject, setSearchParams]);

  // --- QUERIES ---
  const { data: lotesRaw = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000,
  });

  const { sortedData: sortedLotes, highlightedId, triggerHighlight } = useSortedData(lotesRaw);

  // --- FILTRADO ---
  const filteredLotes = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return sortedLotes.filter((lote) => {
      const matchesSearch = !term || lote.nombre_lote.toLowerCase().includes(term) || lote.id.toString().includes(term);
      let matchesProject = true;
      if (filterProject === 'huerfano') matchesProject = !lote.id_proyecto;
      else if (filterProject !== 'all') matchesProject = lote.id_proyecto === Number(filterProject);
      
      const matchesEstado = filterEstadoSubasta === 'all' || lote.estado_subasta === filterEstadoSubasta;
      
      let matchesTipo = true;
      if (filterTipoInversion !== 'all') {
        const p = proyectos.find(proj => proj.id === lote.id_proyecto);
        matchesTipo = p ? p.tipo_inversion === filterTipoInversion : false;
      }

      return matchesSearch && matchesProject && matchesEstado && matchesTipo;
    });
  }, [sortedLotes, debouncedSearchTerm, filterProject, filterEstadoSubasta, filterTipoInversion, proyectos]);

  const stats = useMemo(() => ({
    total: lotesRaw.length,
    enSubasta: lotesRaw.filter((l) => l.estado_subasta === 'activa').length,
    finalizados: lotesRaw.filter((l) => l.estado_subasta === 'finalizada').length,
    huerfanos: lotesRaw.filter((l) => !l.id_proyecto).length,
  }), [lotesRaw]);

  const checkIsSubastable = useCallback((lote: LoteDto) => {
    if (!lote.id_proyecto) return { allowed: false, reason: 'Sin proyecto asignado' };
    const proyecto = proyectos.find((p) => p.id === lote.id_proyecto);
    return proyecto?.tipo_inversion === 'directo' 
      ? { allowed: false, reason: 'Inversión Directa (No Subastable)' } 
      : { allowed: true, reason: '' };
  }, [proyectos]);

  // --- 🚀 MUTACIÓN DE GUARDADO (ACTUALIZADA) ---
  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number; file?: File | null }) => {
      let response;
      
      if (payload.id) {
        // ACTUALIZACIÓN
        response = await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      } else {
        // CREACIÓN: Primero el Lote para obtener el ID
        response = await LoteService.create(payload.dto as CreateLoteDto);
        
        const newLote = response.data;

        // 📸 SUBIDA DE IMAGEN: Solo si el lote se creó y hay un archivo físico
        if (newLote?.id && payload.file) {
          await ImagenService.create({
            file: payload.file,
            id_lote: newLote.id, // 👈 Vinculación automática con el ID real
            descripcion: `Foto principal de ${newLote.nombre_lote}`
          });
        }
      }
      return response;
    },
    onSuccess: (response, variables) => {
      // Forzamos el refresco de las listas para mostrar la nueva foto/datos
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      queryClient.invalidateQueries({ queryKey: ['loteImages'] }); 
      
      handleCloseAllModals();
      
      const targetId = variables.id || response.data.id;
      if (targetId) triggerHighlight(targetId);
      
      showSuccess(variables.id ? 'Cambios guardados correctamente' : 'Lote creado con su imagen');
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al procesar el lote'),
  });

  // --- OTRAS MUTACIONES ---
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => await LoteService.update(id, { activo }),
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ['adminLotes'] }); modales.confirm.close(); triggerHighlight(v.id); showSuccess(v.activo ? 'Lote visible' : 'Lote oculto'); },
    onError: (err: any) => { showError(err.response?.data?.error || 'Error'); modales.confirm.close(); }
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ['adminLotes'] }); modales.auction.close(); triggerHighlight(id); showSuccess('Subasta iniciada'); },
    onError: () => showError('Error al iniciar subasta'),
  });

  const endAuction = useMutation({
    mutationFn: async (id: number) => await PujaService.manageAuctionEnd(id, null),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ['adminLotes'] }); modales.auction.close(); triggerHighlight(id); showSuccess('Subasta finalizada'); },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al finalizar'),
  });

  // --- HANDLERS ---
  const handleCloseAllModals = useCallback(() => {
    modales.create.close(); modales.edit.close(); modales.images.close(); modales.auction.close(); modales.overview.close();
    setTimeout(() => setSelectedLote(null), 300);
  }, [modales]);

  const handleOpenCreate = useCallback(() => { setSelectedLote(null); modales.create.open(); }, [modales.create]);
  const handleOpenEdit = useCallback((lote: LoteDto) => { setSelectedLote(lote); modales.edit.open(); }, [modales.edit]);
  const handleManageImages = useCallback((lote: LoteDto) => { setSelectedLote(lote); modales.images.open(); }, [modales.images]);
  const handleAuctionClick = useCallback((lote: LoteDto) => { setSelectedLote(lote); modales.auction.open(); }, [modales.auction]);
  const handleOpenOverview = useCallback((lote: LoteDto) => { setSelectedLote(lote); modales.overview.open(); }, [modales.overview]);
  const handleToggleActive = useCallback((lote: LoteDto) => { modales.confirm.confirm('toggle_lote_visibility', lote); }, [modales.confirm]);

  const handleConfirmAction = useCallback(() => {
    if (modales.confirm.action === 'toggle_lote_visibility' && modales.confirm.data) {
      toggleActiveMutation.mutate({ id: modales.confirm.data.id, activo: !modales.confirm.data.activo });
    }
  }, [modales.confirm, toggleActiveMutation]);

  return {
    theme,
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    viewMode, setViewMode,
    selectedLote,
    filterEstadoSubasta, setFilterEstadoSubasta,
    filterTipoInversion, setFilterTipoInversion,
    filteredLotes,
    proyectos,
    stats,
    highlightedId,
    loadingLotes,
    error,
    isToggling: toggleActiveMutation.isPending,
    isSaving: saveMutation.isPending,
    isAuctionLoading: startAuction.isPending || endAuction.isPending,
    checkIsSubastable,
    modales,
    handleOpenCreate,
    handleOpenEdit,
    handleManageImages,
    handleAuctionClick,
    handleOpenOverview,
    handleToggleActive,
    handleConfirmAction,
    saveLote: saveMutation.mutateAsync,
    startAuctionFn: startAuction.mutate,
    endAuctionFn: endAuction.mutate
  };
};
import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import type { ContratoPlantillaDto } from '@/core/types/dto/contrato-plantilla.dto';

import { downloadSecureFile } from '@/shared/utils/fileUtils';
import { useSortedData } from '../useSortedData';

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

export const useAdminPlantillas = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES (Nivel Superior) ---
  const createModal = useModal();
  const updatePdfModal = useModal();
  const updateMetaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    create: createModal,
    updatePdf: updatePdfModal,
    updateMeta: updateMetaModal,
    confirmDialog: confirmDialog
  }), [createModal, updatePdfModal, updateMetaModal, confirmDialog]);

  // --- ESTADOS UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [plantillaSelected, setPlantillaSelected] = useState<ContratoPlantillaDto | null>(null);

  // ✨ Debounce
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Efecto URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // --- QUERIES ---
  const { data: plantillasRaw = [], isLoading: l1, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: proyectos = [], isLoading: l2 } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 1000 * 60 * 10,
  });

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: plantillasOrdenadas, highlightedId, triggerHighlight } = useSortedData(plantillasRaw);

  const isLoading = l1 || l2;

  // --- FILTRADO DE PLANTILLAS (Memoizado + Debounce) ---
const filteredPlantillas = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return plantillasOrdenadas.filter(plantilla => {
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      
      // ✨ Lógica de filtro de proyecto actualizada
      let matchesProject = true;
      if (filterProject !== 'all') {
        if (filterProject === 'global') {
          // Filtra los que NO tienen proyecto (Huérfanos/Globales)
          matchesProject = plantilla.id_proyecto === null;
        } else {
          // Filtra por ID de proyecto específico
          matchesProject = plantilla.id_proyecto === Number(filterProject);
        }
      }

      return matchesSearch && matchesProject;
    });
  }, [plantillasOrdenadas, debouncedSearchTerm, filterProject]);

  // ✨ NUEVO: FILTRADO DE PROYECTOS DISPONIBLES (Sin plantilla)
  const proyectosDisponibles = useMemo(() => {
    // 1. Obtenemos los IDs de los proyectos que ya están vinculados a una plantilla
    const proyectosConPlantilla = new Set(
      plantillasRaw
        .filter(plantilla => plantilla.id_proyecto !== null)
        .map(plantilla => plantilla.id_proyecto)
    );

    // 2. Devolvemos solo los proyectos que NO están en ese Set
    return proyectos.filter(proyecto => !proyectosConPlantilla.has(proyecto.id));
  }, [proyectos, plantillasRaw]);

  // --- MUTACIONES ---
  const handleSuccess = (msg: string, modalClose?: () => void, updatedId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    if (modalClose) modalClose();
    setPlantillaSelected(null);
    if (updatedId) triggerHighlight(updatedId);
    showSuccess(msg);
  };

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: (res) => {
      const payload = res.data as any;
      const newId = payload.plantilla?.id || payload.data?.id || payload.id;
      handleSuccess('Plantilla creada correctamente.', modales.create.close, newId);
    },
    onError: () => showError('Error al crear la plantilla.')
  });

  const updatePdfMutation = useMutation({
    mutationFn: ContratoPlantillaService.updatePdf,
    onSuccess: (_, vars) => handleSuccess('PDF actualizado y hash recalculado.', modales.updatePdf.close, vars.id),
    onError: () => showError('Error al actualizar el PDF.')
  });

  const updateMetaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ContratoPlantillaDto> }) =>
      ContratoPlantillaService.update(id, data),
    onSuccess: (_, vars) => handleSuccess('Datos actualizados.', modales.updateMeta.close, vars.id),
    onError: () => showError('Error al actualizar metadatos.')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (plantilla: ContratoPlantillaDto) =>
      ContratoPlantillaService.toggleActive(plantilla.id, !plantilla.activo),
    onSuccess: (_, plantilla) => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      modales.confirmDialog.close();
      triggerHighlight(plantilla.id);
      showSuccess(plantilla.activo ? 'Plantilla ocultada' : 'Plantilla activada');
    },
    onError: () => {
      modales.confirmDialog.close();
      showError('Error al cambiar estado.');
    }
  });

  const softDeleteMutation = useMutation({
    mutationFn: ContratoPlantillaService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      modales.confirmDialog.close();
      showSuccess('Plantilla eliminada (enviada a papelera).');
    },
    onError: () => {
      modales.confirmDialog.close();
      showError('Error al eliminar.');
    }
  });

  // --- HANDLERS ---
  const handleToggleActive = useCallback((plantilla: ContratoPlantillaDto) => {
    modales.confirmDialog.confirm('toggle_plantilla_status', plantilla);
  }, [modales.confirmDialog]);

  const handleDelete = useCallback((plantilla: ContratoPlantillaDto) => {
    modales.confirmDialog.confirm('delete_plantilla', plantilla);
  }, [modales.confirmDialog]);

  const handleDownload = useCallback(async (plantilla: ContratoPlantillaDto) => {
    if (plantilla.url_archivo) {
      try {
        await downloadSecureFile(plantilla.url_archivo, plantilla.nombre_archivo);
      } catch (e) {
        showError('Error al descargar el archivo.');
      }
    } else {
      showError('La plantilla no tiene un archivo asociado.');
    }
  }, [showError]);

  const handleConfirmAction = useCallback(() => {
    if (!modales.confirmDialog.data) return;

    if (modales.confirmDialog.action === 'toggle_plantilla_status') {
      toggleActiveMutation.mutate(modales.confirmDialog.data);
    }
    else if (modales.confirmDialog.action === 'delete_plantilla') {
      softDeleteMutation.mutate(modales.confirmDialog.data.id);
    }
  }, [modales.confirmDialog, toggleActiveMutation, softDeleteMutation]);

  const handleOpenUpdatePdf = useCallback((row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    modales.updatePdf.open();
  }, [modales.updatePdf]);

  const handleOpenUpdateMeta = useCallback((row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    modales.updateMeta.open();
  }, [modales.updateMeta]);

  return {
    theme,
    // State
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    plantillaSelected, setPlantillaSelected,

    // UX
    highlightedId,

    // Data
    filteredPlantillas,
    proyectos,             // <-- La lista completa sigue exportándose por si la necesitas
    proyectosDisponibles,  // ✨ <-- ¡La nueva lista filtrada, lista para el Modal!
    isLoading,
    error,

    // Modales
    modales,

    // Handlers
    handleToggleActive,
    handleDelete,
    handleConfirmAction,
    handleOpenUpdatePdf,
    handleOpenUpdateMeta,
    handleDownload,

    // Mutations Status
    isCreating: createMutation.isPending,
    isUpdatingPdf: updatePdfMutation.isPending,
    isUpdatingMeta: updateMetaMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isDeleting: softDeleteMutation.isPending,

    // Mutation Runners
    createMutation,
    updatePdfMutation,
    updateMetaMutation
  };
};
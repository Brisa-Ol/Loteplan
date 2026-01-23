import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { ContratoPlantillaDto } from '@/core/types/dto/contrato-plantilla.dto';
import { useModal } from '@/shared/hooks/useModal';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSortedData } from './useSortedData';


export const useAdminPlantillas = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // 1. Estados UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [plantillaSelected, setPlantillaSelected] = useState<ContratoPlantillaDto | null>(null);

  // 2. Modales
  const modales = {
    create: useModal(),
    updatePdf: useModal(),
    updateMeta: useModal(),
    confirmDialog: useConfirmDialog()
  };

  // Efecto URL (para entrar filtrando por proyecto desde otra página)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // 3. Queries
  const { data: plantillasRaw = [], isLoading: l1, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    staleTime: 1000 * 60 * 2 
  });

  const { data: proyectos = [], isLoading: l2 } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 1000 * 60 * 30 
  });

  // ✨ 4. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: plantillasOrdenadas, highlightedId, triggerHighlight } = useSortedData(plantillasRaw);

  const isLoading = l1 || l2;

  // 5. Filtrado (Sobre data ordenada)
  const filteredPlantillas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return plantillasOrdenadas.filter(plantilla => {
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      const matchesProject = filterProject === 'all' || plantilla.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });
  }, [plantillasOrdenadas, searchTerm, filterProject]);

  // 6. Mutaciones
  const handleSuccess = (msg: string, modalClose?: () => void, updatedId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    if (modalClose) modalClose();
    setPlantillaSelected(null);
    
    // ✨ Highlight
    if (updatedId) triggerHighlight(updatedId);

    showSuccess(msg);
  };

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: (data) => {
        const newItem = (data as any).data; 
        handleSuccess('Plantilla creada correctamente.', modales.create.close, newItem?.id);
    },
  });

  const updatePdfMutation = useMutation({
    mutationFn: ContratoPlantillaService.updatePdf,
    onSuccess: (_, variables) => handleSuccess('PDF actualizado y hash recalculado.', modales.updatePdf.close, variables.id),
  });

  const updateMetaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ContratoPlantillaDto> }) => 
      ContratoPlantillaService.update(id, data),
    onSuccess: (_, variables) => handleSuccess('Datos actualizados.', modales.updateMeta.close, variables.id),
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
    onError: () => modales.confirmDialog.close()
  });

  const softDeleteMutation = useMutation({
    mutationFn: ContratoPlantillaService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      modales.confirmDialog.close();
      showSuccess('Plantilla eliminada (enviada a papelera).');
    },
    onError: () => modales.confirmDialog.close()
  });

  // Handlers
  const handleToggleActive = useCallback((plantilla: ContratoPlantillaDto) => {
    modales.confirmDialog.confirm('toggle_plantilla_status', plantilla);
  }, [modales.confirmDialog]);

  const handleDelete = useCallback((plantilla: ContratoPlantillaDto) => {
    modales.confirmDialog.confirm('delete_plantilla', plantilla);
  }, [modales.confirmDialog]);

  const handleConfirmAction = () => {
    if (!modales.confirmDialog.data) return;
    
    if (modales.confirmDialog.action === 'toggle_plantilla_status') {
        toggleActiveMutation.mutate(modales.confirmDialog.data);
    }
    else if (modales.confirmDialog.action === 'delete_plantilla') {
        softDeleteMutation.mutate(modales.confirmDialog.data.id);
    }
  };

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
    
    // ✨ UX
    highlightedId,

    // Data
    filteredPlantillas,
    proyectos,
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

    // Mutations Status
    isCreating: createMutation.isPending,
    isUpdatingPdf: updatePdfMutation.isPending,
    isUpdatingMeta: updateMetaMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isDeleting: softDeleteMutation.isPending,
    
    // Mutation Runners (para pasar a los modales)
    createMutation,
    updatePdfMutation,
    updateMetaMutation
  };
};
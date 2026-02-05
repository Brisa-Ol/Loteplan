import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Servicios
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import ImagenService from '@/core/api/services/imagen.service';
import ProyectoService from '@/core/api/services/proyecto.service';

// Hooks y Tipos
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useSortedData } from './useSortedData';


export type TipoInversionFilter = 'all' | 'mensual' | 'directo';

// ============================================================================
// HOOK DE DEBOUNCE
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// HOOK PRINCIPAL - ULTRA OPTIMIZADO
// ============================================================================
export const useAdminProyectos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useSnackbar();

  // --- ESTADOS LOCALES ---
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  // ✨ DEBOUNCE del search term para reducir re-renders durante escritura
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- MODALES (CORREGIDO: Hooks llamados en el nivel superior) ---
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Ahora sí podemos agruparlos (Memoizamos el objeto contenedor)
  const modales = useMemo(() => ({
    create: createModal,
    cuotas: cuotasModal,
    lotes: lotesModal,
    edit: editModal,
    images: imagesModal,
    confirmDialog: confirmDialog
  }), [createModal, cuotasModal, lotesModal, editModal, imagesModal, confirmDialog]);

  // --- QUERIES CON CACHE OPTIMIZADO ---
  const { data: proyectosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 30000,        // ✨ Cache de 30 segundos
    gcTime: 5 * 60 * 1000,   // ✨ Mantener en cache 5 minutos
    refetchOnWindowFocus: false, // ✨ No refetch al volver a la pestaña
  });

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: proyectosOrdenados, highlightedId, triggerHighlight } = useSortedData(proyectosRaw);

  // --- MUTACIONES CON OPTIMISTIC UPDATES ---

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['adminProyectos'] });
      const previousProyectos = queryClient.getQueryData(['adminProyectos']);

      queryClient.setQueryData(['adminProyectos'], (old: ProyectoDto[] = []) =>
        old.map(p => p.id === id ? { ...p, ...data } : p)
      );

      return { previousProyectos };
    },
    onError: (err, variables, context) => {
      if (context?.previousProyectos) {
        queryClient.setQueryData(['adminProyectos'], context.previousProyectos);
      }
      showError('Error al actualizar proyecto');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.edit.close();
      setTimeout(() => setSelectedProject(null), 300);

      triggerHighlight(variables.id);
      showSuccess('Proyecto actualizado correctamente');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onMutate: async ({ id, activo }) => {
      await queryClient.cancelQueries({ queryKey: ['adminProyectos'] });
      const previousProyectos = queryClient.getQueryData(['adminProyectos']);

      // ✨ Actualización INSTANTÁNEA en la UI
      queryClient.setQueryData(['adminProyectos'], (old: ProyectoDto[] = []) =>
        old.map(p => p.id === id ? { ...p, activo } : p)
      );

      return { previousProyectos };
    },
    onError: (err, variables, context) => {
      if (context?.previousProyectos) {
        queryClient.setQueryData(['adminProyectos'], context.previousProyectos);
      }
      showError('Error al actualizar visibilidad');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();

      triggerHighlight(variables.id);
      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado');
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['adminProyectos'] });
      const previousProyectos = queryClient.getQueryData(['adminProyectos']);

      // Actualización optimista del estado del proyecto
      queryClient.setQueryData(['adminProyectos'], (old: ProyectoDto[] = []) =>
        old.map(p => p.id === id ? { ...p, estado_proyecto: 'En Proceso' } : p)
      );

      return { previousProyectos };
    },
    onError: (err, variables, context) => {
      if (context?.previousProyectos) {
        queryClient.setQueryData(['adminProyectos'], context.previousProyectos);
      }
      showError('Error al iniciar proceso');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();

      triggerHighlight(id);
      showSuccess('Proceso de cobros iniciado');
    }
  });

  // --- HANDLERS (Callbacks estables) ---

  const handleCreateSubmit = useCallback(async (data: any, image: File | null) => {
    try {
      const proyectoData: CreateProyectoDto = { ...data };
      const resProyecto = await ProyectoService.create(proyectoData);

      const nuevoProyecto = resProyecto.data;
      const nuevoId = nuevoProyecto.id;

      if (data.tipo_inversion === 'mensual') {
        await CuotaMensualService.create({
          id_proyecto: nuevoId,
          nombre_proyecto: data.nombre_proyecto,
          total_cuotas_proyecto: data.plazo_inversion,
          nombre_cemento_cemento: data.nombre_cemento_cemento,
          valor_cemento_unidades: data.valor_cemento_unidades,
          valor_cemento: data.valor_cemento,
          porcentaje_plan: data.porcentaje_plan,
          porcentaje_administrativo: data.porcentaje_administrativo / 100,
          porcentaje_iva: data.porcentaje_iva / 100
        });
      }

      if (image) {
        try {
          await ImagenService.create({
            file: image,
            descripcion: 'Portada del Proyecto',
            id_proyecto: nuevoId,
            id_lote: null
          });
        } catch (imgError) {
          console.error("Error al subir imagen inicial:", imgError);
          showWarning('El proyecto se creó, pero hubo un error al subir la imagen.');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.create.close();

      triggerHighlight(nuevoId);

      if (!image) {
        showSuccess('Proyecto creado exitosamente.');
      } else {
        showSuccess('Proyecto e imagen creados exitosamente.');
      }

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al crear el proyecto';
      showError(msg);
    }
  }, [modales.create, queryClient, showSuccess, showError, showWarning, triggerHighlight]);

  const handleUpdateSubmit = useCallback(async (id: number, data: UpdateProyectoDto) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleAction = useCallback((proyecto: ProyectoDto, action: 'edit' | 'images' | 'cuotas' | 'lotes', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProject(proyecto);

    if (action === 'edit') modales.edit.open();
    else if (action === 'images') modales.images.open();
    else if (action === 'cuotas') modales.cuotas.open();
    else if (action === 'lotes') modales.lotes.open();
  }, [modales]);

  const handleConfirmAction = useCallback(() => {
    if (!modales.confirmDialog.data) return;
    const project = modales.confirmDialog.data as ProyectoDto;

    if (modales.confirmDialog.action === 'start_project_process') {
      startMutation.mutate(project.id);
    }
    else if (modales.confirmDialog.action === 'toggle_project_visibility') {
      toggleActiveMutation.mutate({ id: project.id, activo: !project.activo });
    }
  }, [modales.confirmDialog, startMutation, toggleActiveMutation]);

  // --- FILTRADO ULTRA OPTIMIZADO ---
  const filteredProyectos = useMemo(() => {
    // ✨ Usar el valor debounceed para evitar filtrado en cada tecla
    const search = debouncedSearchTerm.toLowerCase();

    return proyectosOrdenados.filter(p => {
      // ✨ Short-circuit: si no hay search term, skip la comparación
      const matchesSearch = !search || p.nombre_proyecto.toLowerCase().includes(search);
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectosOrdenados, debouncedSearchTerm, filterTipo]);

  return {
    theme,
    // Estado
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    selectedProject,
    setSelectedProject,

    // Highlight
    highlightedId,

    // Data
    filteredProyectos,
    isLoading,
    error,

    // Modales
    modales,

    // Handlers
    handleCreateSubmit,
    handleUpdateSubmit,
    handleAction,
    handleConfirmAction,

    // Loading states
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isStarting: startMutation.isPending
  };
};
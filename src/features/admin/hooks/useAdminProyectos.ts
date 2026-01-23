import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

// Servicios
import ProyectoService from '@/core/api/services/proyecto.service';
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import ImagenService from '@/core/api/services/imagen.service';

// Hooks y Tipos
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';

import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useSortedData } from './useSortedData';


export type TipoInversionFilter = 'all' | 'mensual' | 'directo';

export const useAdminProyectos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useSnackbar();

  // --- ESTADOS LOCALES ---
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');
  
  // --- MODALES ---
  const modales = {
    create: useModal(),
    cuotas: useModal(),
    lotes: useModal(),
    edit: useModal(),
    images: useModal(),
    confirmDialog: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: proyectosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  // useSortedData se encarga de ordenar por ID desc y manejar el efecto visual
  const { sortedData: proyectosOrdenados, highlightedId, triggerHighlight } = useSortedData(proyectosRaw);

  // --- MUTACIONES ---
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.edit.close(); 
      setTimeout(() => setSelectedProject(null), 300);
      
      // ✨ Activar Highlight
      triggerHighlight(variables.id); 
      showSuccess('Proyecto actualizado correctamente');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();
      
      // ✨ Activar Highlight
      triggerHighlight(variables.id);
      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado');
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();
      
      // ✨ Activar Highlight
      triggerHighlight(id);
      showSuccess('Proceso de cobros iniciado');
    }
  });

  // --- HANDLERS ---

  const handleCreateSubmit = useCallback(async (data: any, image: File | null) => {
    try {
        // 1. Crear el Proyecto
        const proyectoData: CreateProyectoDto = { ...data };
        const resProyecto = await ProyectoService.create(proyectoData);
        
        const nuevoProyecto = resProyecto.data;
        const nuevoId = nuevoProyecto.id;

        // 2. Configurar Cuota (Solo para mensuales)
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

        // 3. Subir Imagen
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

        // 4. Finalizar
        queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
        modales.create.close();
        
        // ✨ Activar Highlight
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

  // --- FILTRADO (Sobre la data ya ordenada por useSortedData) ---
  const filteredProyectos = useMemo(() => {
    return proyectosOrdenados.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectosOrdenados, searchTerm, filterTipo]);

  return {
    theme,
    // Estado
    searchTerm, setSearchTerm,
    filterTipo, setFilterTipo,
    selectedProject, setSelectedProject,
    
    // ✨ Exportamos el Highlight ID para la tabla
    highlightedId,
    
    // Data (Ya filtrada y ordenada)
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

    // Loading status
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isStarting: startMutation.isPending
  };
};
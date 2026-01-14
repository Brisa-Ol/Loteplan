import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '@/core/types/dto/proyecto.dto';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';



export type TipoInversionFilter = 'all' | 'mensual' | 'directo';

export const useAdminProyectos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS LOCALES ---
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');
  const initialStatusRef = useRef<Record<number, boolean>>({});

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
  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  useEffect(() => {
    if (proyectos.length > 0) {
      proyectos.forEach(p => {
        if (initialStatusRef.current[p.id] === undefined) {
          initialStatusRef.current[p.id] = p.activo;
        }
      });
    }
  }, [proyectos]);

  // --- MUTACIONES ---
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.edit.close(); 
      setTimeout(() => setSelectedProject(null), 300);
      setHighlightedId(variables.id); 
      showSuccess('Proyecto actualizado correctamente');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado');
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      modales.confirmDialog.close();
      showSuccess('Proceso de cobros iniciado');
    }
  });

  // --- HANDLERS ---
  const handleCreateSubmit = useCallback(async (data: any, image: File | null) => {
    try {
        const proyectoData: CreateProyectoDto = { ...data };
        const resProyecto = await ProyectoService.create(proyectoData);
        const nuevoId = resProyecto.data.id;

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

        // if (image) await ImagenService.uploadProyectoImagen(nuevoId, image);

        queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
        modales.create.close();
        setHighlightedId(nuevoId);
        showSuccess('Proyecto creado y configurado exitosamente.');

    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || 'Error al crear el proyecto';
        showError(msg);
    }
  }, [modales.create, queryClient, showSuccess, showError]);

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

  // --- FILTRADO (Memo) ---
  const filteredProyectos = useMemo(() => {
    return proyectos.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);

  return {
    theme,
    // Estado
    searchTerm, setSearchTerm,
    filterTipo, setFilterTipo,
    selectedProject, setSelectedProject,
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

    // Loading status
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isStarting: startMutation.isPending
  };
};
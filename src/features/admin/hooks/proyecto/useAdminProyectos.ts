import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Servicios
import CuotaMensualService from '@/core/api/services/cuotaMensual.service';
import ImagenService from '@/core/api/services/imagen.service';
import ProyectoService from '@/core/api/services/proyecto.service';

// Hooks y Tipos
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useSortedData } from '../useSortedData';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';


export type TipoInversionFilter = 'all' | 'mensual' | 'directo';

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminProyectos = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useSnackbar();

  // --- ESTADOS ---
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- MODALES ---
  const create = useModal();
  const cuotas = useModal();
  const lotes = useModal();
  const edit = useModal();
  const images = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    create, cuotas, lotes, edit, images, confirmDialog
  }), [create, cuotas, lotes, edit, images, confirmDialog]);

  // --- QUERIES ---
  const { data: proyectosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 30000,
  });

  const { sortedData: proyectosOrdenados, highlightedId, triggerHighlight } = useSortedData(proyectosRaw);

  // --- LOGICA REUTILIZABLE DE MUTACIONES ---
  const handleMutationOptimistic = async () => {
    await queryClient.cancelQueries({ queryKey: ['adminProyectos'] });
    return queryClient.getQueryData<ProyectoDto[]>(['adminProyectos']);
  };

  const handleMutationError = (context: any) => {
    if (context?.previousProyectos) {
      queryClient.setQueryData(['adminProyectos'], context.previousProyectos);
    }
    showError('Error al procesar la solicitud');
  };

  const handleMutationSuccess = (id: number, message: string) => {
    queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
    triggerHighlight(id);
    showSuccess(message);
    confirmDialog.close();
  };

  // --- MUTACIONES ---
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onMutate: handleMutationOptimistic,
    onError: (_, __, ctx) => handleMutationError(ctx),
    onSuccess: (_, vars) => {
      handleMutationSuccess(vars.id, 'Proyecto actualizado correctamente');
      edit.close();
      setSelectedProject(null);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onMutate: handleMutationOptimistic,
    onError: (_, __, ctx) => handleMutationError(ctx),
    onSuccess: (_, vars) => handleMutationSuccess(vars.id, vars.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado')
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onMutate: handleMutationOptimistic,
    onError: (_, __, ctx) => handleMutationError(ctx),
    onSuccess: (_, id) => handleMutationSuccess(id, 'Proceso de cobros iniciado')
  });

  const revertMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.revertProcess(id),
    onMutate: handleMutationOptimistic,
    onError: (_, __, ctx) => handleMutationError(ctx),
    onSuccess: (_, id) => handleMutationSuccess(id, 'Proyecto revertido a "En Espera" correctamente')
  });

  // --- HANDLERS ---

  // 🆕 Actualizamos la firma de handleCreateSubmit para recibir el contrato
const handleCreateSubmit = useCallback(async (data: any, image: File | null, contrato: File | null, nombreContrato: string) => {
    try {
      // 1. Crear Proyecto
      const resProyecto = await ProyectoService.create(data as CreateProyectoDto);
      const nuevoId = resProyecto.data.id;

      // 2. Crear Cuotas si aplica
      if (data.tipo_inversion === 'mensual') {
        await CuotaMensualService.create({
          id_proyecto: nuevoId,
          nombre_proyecto: data.nombre_proyecto,
          total_cuotas_proyecto: data.plazo_inversion,
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
          await ImagenService.create({ file: image, descripcion: 'Portada', id_proyecto: nuevoId, id_lote: null });
        } catch {
          showWarning('Proyecto creado, pero la imagen falló al subirse.');
        }
      }

      // 4. 🆕 Subir Contrato Plantilla (si el usuario adjuntó uno)
if (contrato) {
          try {
              await ContratoPlantillaService.create({
                  file: contrato,
                  // Usamos el nombre que puso el usuario, o un fallback de seguridad
                  nombre_archivo: nombreContrato.trim() || `Contrato - ${data.nombre_proyecto}`,
                  version: 1,
                  id_proyecto: nuevoId
              });
          } catch (err) {
              showWarning('Proyecto creado, pero la plantilla del contrato falló al subirse.');
          }
      }

      // 5. Refrescar interfaz
queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      create.close();
      triggerHighlight(nuevoId);
      showSuccess('Proyecto creado exitosamente.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al crear el proyecto');
    }
  }, [queryClient, create, triggerHighlight, showSuccess, showError, showWarning]);

  const handleUpdateSubmit = async (id: number, data: UpdateProyectoDto) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleAction = useCallback((proyecto: ProyectoDto, action: keyof typeof modales, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProject(proyecto);
    (modales[action] as any).open();
  }, [modales]);

  const handleConfirmAction = useCallback(() => {
    const project = confirmDialog.data as ProyectoDto;
    if (!project) return;

    if (confirmDialog.action === 'start_project_process') {
      startMutation.mutate(project.id);
    } else if (confirmDialog.action === 'toggle_project_visibility') {
      toggleActiveMutation.mutate({ id: project.id, activo: !project.activo });
    } else if (confirmDialog.action === 'revert_project_process') {
      revertMutation.mutate(project.id);
    }
  }, [confirmDialog, startMutation, toggleActiveMutation, revertMutation]);

  // --- FILTRADO ---
const filteredProyectos = useMemo(() => {
    const search = debouncedSearchTerm.toLowerCase();
    return proyectosOrdenados.filter(p => {
      // 1. Filtro por búsqueda
      const matchesSearch = !search || p.nombre_proyecto.toLowerCase().includes(search);
      
      // 2. Filtro por Tipo de Inversión
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      
      // 3. ✨ Filtro por Estado
      const matchesEstado = filterEstado === 'all' || p.estado_proyecto === filterEstado;

      return matchesSearch && matchesType && matchesEstado;
    });
  }, [proyectosOrdenados, debouncedSearchTerm, filterTipo, filterEstado]); // 👈 Añadir filterEstado a dependencias

  return {
    searchTerm, setSearchTerm,
    filterTipo, setFilterTipo,
    selectedProject,
    filterEstado, setFilterEstado,
    highlightedId,
    filteredProyectos,
    isLoading, error,
    modales,

    handleCreateSubmit,
    handleUpdateSubmit,
    handleAction,
    handleConfirmAction,

    // Status
    isUpdating: updateMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isStarting: startMutation.isPending,
    isReverting: revertMutation.isPending
  };
};
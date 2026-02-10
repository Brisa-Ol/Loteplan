import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModal } from '@/shared/hooks/useModal';
import type { InversionDto } from '@/core/types/dto/inversion.dto';

import InversionService from '@/core/api/services/inversion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import UsuarioService from '@/core/api/services/usuario.service';
import { useSortedData } from './useSortedData';

// Hook auxiliar para debounce
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminInversiones = () => {
  const detailModal = useModal();

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'pagado' | 'fallido'>('all');
  const [selectedInversion, setSelectedInversion] = useState<InversionDto | null>(null);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERIES ---
  const { data: inversionesRaw = [], isLoading: l1, error } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => (await InversionService.findAll()).data,
    staleTime: 30000,
  });

  const { data: liquidezData, isLoading: l2 } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data,
    staleTime: 60000,
  });

  const { data: topInvestors = [], isLoading: l3 } = useQuery({
    queryKey: ['adminTopInvestors'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data.data,
    staleTime: 60000,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['adminUsuariosMap'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 600000,
  });

  const { data: allProyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 600000,
  });

  const isLoading = l1 || l2 || l3;

  // --- MAPAS PARA ACCESO RÁPIDO ---
  const usuariosMap = useMemo(() => new Map(usuarios.map(u => [u.id, u])), [usuarios]);
  const proyectosMap = useMemo(() => new Map(allProyectos.map(p => [p.id, p])), [allProyectos]);

  const getUserInfo = useCallback((id: number) => {
    const user = usuariosMap.get(id);
    return user 
      ? { name: `${user.nombre} ${user.apellido}`, email: user.email } 
      : { name: `Usuario #${id}`, email: 'Sin datos' };
  }, [usuariosMap]);

  const getProjectName = useCallback((id: number) => {
    return proyectosMap.get(id)?.nombre_proyecto ?? `Proyecto #${id}`;
  }, [proyectosMap]);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const { sortedData: inversionesOrdenadas, highlightedId } = useSortedData(inversionesRaw);

  const filteredInversiones = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return inversionesOrdenadas.filter(inv => {
      const matchProject = filterProject === 'all' || inv.id_proyecto === Number(filterProject);
      const matchStatus = filterStatus === 'all' || inv.estado === filterStatus;
      
      if (!matchProject || !matchStatus) return false;
      if (!term) return true;

      const userInfo = getUserInfo(inv.id_usuario);
      const projName = getProjectName(inv.id_proyecto);

      return (
        userInfo.name.toLowerCase().includes(term) ||
        userInfo.email.toLowerCase().includes(term) ||
        projName.toLowerCase().includes(term) ||
        inv.id.toString().includes(term)
      );
    });
  }, [inversionesOrdenadas, debouncedSearchTerm, filterProject, filterStatus, getUserInfo, getProjectName]);

  // --- DATA PARA GRÁFICOS ---
  const chartData = useMemo(() => {
    return topInvestors.slice(0, 10).map(item => ({
      name: getUserInfo(item.id_usuario).name,
      monto: Number(item.monto_total_invertido),
    }));
  }, [topInvestors, getUserInfo]);

  const trendData = useMemo(() => {
    if (!inversionesRaw.length) return [];

    const validas = inversionesRaw
      .filter(i => !['fallido', 'reembolsado'].includes(i.estado))
      .sort((a, b) => new Date(a.fecha_inversion).getTime() - new Date(b.fecha_inversion).getTime());

    let acumulado = 0;
    const historial: Map<string, number> = new Map();

    validas.forEach(inv => {
      acumulado += Number(inv.monto);
      const fecha = new Date(inv.fecha_inversion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      historial.set(fecha, acumulado);
    });

    return Array.from(historial, ([fecha, monto]) => ({ fecha, monto })).slice(-20);
  }, [inversionesRaw]);

  // --- HANDLERS ---
  const handleViewDetails = useCallback((inv: InversionDto) => {
    setSelectedInversion(inv);
    detailModal.open();
  }, [detailModal]);

  const handleCloseModal = useCallback(() => {
    detailModal.close();
    setTimeout(() => setSelectedInversion(null), 300);
  }, [detailModal]);

  return {
    // Estados y Filtros
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedInversion,
    highlightedId,
    
    // Data procesada
    filteredInversiones,
    chartData,
    trendData,
    liquidezData,
    proyectos: useMemo(() => allProyectos.filter(p => p.tipo_inversion === 'directo'), [allProyectos]),
    
    // Info Helpers
    isLoading,
    error,
    getUserInfo,
    getProjectName,
    
    // Modales y Handlers
    modales: { detail: detailModal },
    handleViewDetails,
    handleCloseModal
  };
};
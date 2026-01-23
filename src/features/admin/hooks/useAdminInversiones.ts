import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModal } from '@/shared/hooks/useModal';

import type { InversionDto } from '@/core/types/dto/inversion.dto';
import InversionService from '@/core/api/services/inversion.service';
import UsuarioService from '@/core/api/services/usuario.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import { useSortedData } from './useSortedData';


export const useAdminInversiones = () => {
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'pagado' | 'fallido'>('all');
  
  // Modales y Selección
  const detailModal = useModal();
  const [selectedInversion, setSelectedInversion] = useState<InversionDto | null>(null);

  // --- QUERIES ---
  const { data: inversionesRaw = [], isLoading: l1, error: e1 } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => (await InversionService.findAll()).data,
  });

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: inversionesOrdenadas, highlightedId } = useSortedData(inversionesRaw);

  const { data: liquidezData, isLoading: l2, error: e2 } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data,
  });

  const { data: topInvestors = [], isLoading: l3, error: e3 } = useQuery({
    queryKey: ['adminTopInvestors'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data.data,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['adminUsuariosMap'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 300000, 
  });

  // Traemos TODOS los proyectos
  const { data: allProyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 300000,
  });

  const isLoading = l1 || l2 || l3;
  const error = e1 || e2 || e3;

  // --- HELPERS (Memoized) ---
  const usuariosMap = useMemo(() => new Map(usuarios.map(u => [u.id, u])), [usuarios]);
  const proyectosMap = useMemo(() => new Map(allProyectos.map(p => [p.id, p])), [allProyectos]);

  const getUserInfo = useCallback((id: number) => {
    const user = usuariosMap.get(id);
    return user ? { name: `${user.nombre} ${user.apellido}`, email: user.email } : { name: `Usuario #${id}`, email: 'Sin datos' };
  }, [usuariosMap]);

  const getProjectName = useCallback((id: number) => {
    const proj = proyectosMap.get(id);
    return proj ? proj.nombre_proyecto : `Proyecto #${id}`;
  }, [proyectosMap]);

  // --- 🔍 FILTRO CLAVE: Proyectos de Inversión ---
  // Filtramos aquí para que el Select del frontend solo muestre proyectos 'directo'
  const proyectosInversion = useMemo(() => {
    return allProyectos.filter(p => p.tipo_inversion === 'directo');
  }, [allProyectos]);

  // --- DATA PROCESSING ---
  const chartData = useMemo(() => {
    if (!Array.isArray(topInvestors)) return [];
    return topInvestors
      .map((item) => {
        const info = getUserInfo(item.id_usuario);
        return {
            name: info.name,
            monto: parseFloat(item.monto_total_invertido.toString()),
        };
      })
      .slice(0, 10);
  }, [topInvestors, getUserInfo]);

  const filteredInversiones = useMemo(() => {
    return inversionesOrdenadas.filter(inv => {
      const userInfo = getUserInfo(inv.id_usuario);
      const projName = getProjectName(inv.id_proyecto);
      const term = searchTerm.toLowerCase();

      // Buscador general
      const matchesSearch = 
        userInfo.name.toLowerCase().includes(term) ||
        userInfo.email.toLowerCase().includes(term) ||
        projName.toLowerCase().includes(term) ||
        inv.id.toString().includes(term);

      // Filtro de Proyecto
      const matchesProject = filterProject === 'all' || inv.id_proyecto === Number(filterProject);
      
      // Filtro de Estado
      const matchesStatus = filterStatus === 'all' || inv.estado === filterStatus;

      // Opcional: Si quieres que la tabla TAMBIÉN oculte inversiones que no sean directas
      // (por si hay basura en la BD), descomenta la siguiente línea:
      // const isDirectProject = proyectosMap.get(inv.id_proyecto)?.tipo_inversion === 'directo';

      return matchesSearch && matchesProject && matchesStatus; 
    });
  }, [inversionesOrdenadas, searchTerm, filterProject, filterStatus, getUserInfo, getProjectName]);

  // Handlers
  const handleViewDetails = (inv: InversionDto) => {
    setSelectedInversion(inv);
    detailModal.open();
  };

  const handleCloseModal = () => {
    detailModal.close();
    setTimeout(() => setSelectedInversion(null), 300);
  };

  return {
    // State
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedInversion,
    
    // ✨ Data & UX
    highlightedId,
    liquidezData,
    filteredInversiones,
    chartData,
    
    // ✅ AQUÍ ESTÁ EL CAMBIO: Exportamos la lista filtrada
    proyectos: proyectosInversion, 
    
    // Loading
    isLoading,
    error,

    // Helpers
    getUserInfo,
    getProjectName,

    // Modales
    detailModal,
    handleViewDetails,
    handleCloseModal
  };
};
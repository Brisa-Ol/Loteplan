import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModal } from '@/shared/hooks/useModal';
import type { InversionDto } from '@/core/types/dto/inversion.dto';
import InversionService from '@/core/api/services/inversion.service';
import UsuarioService from '@/core/api/services/usuario.service';
import ProyectoService from '@/core/api/services/proyecto.service';



export const useAdminInversiones = () => {
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'pagado' | 'fallido'>('all');
  
  // Modales y Selección
  const detailModal = useModal();
  const [selectedInversion, setSelectedInversion] = useState<InversionDto | null>(null);

  // --- QUERIES ---
  
  // 1. Todas las Inversiones
  const { data: inversiones = [], isLoading: loadingInv, error } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => (await InversionService.findAll()).data,
  });

  // 2. Métricas de Liquidez
  const { data: liquidezData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data,
  });

  // 3. Top Investors (Backend Aggregation)
  const { data: topInvestors = [] } = useQuery({
    queryKey: ['adminTopInvestors'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data.data,
  });

  // 4. Mapas Auxiliares (Usuarios y Proyectos)
  const { data: usuarios = [] } = useQuery({
    queryKey: ['adminUsuariosMap'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 300000, // 5 min cache
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 300000,
  });

  // --- HELPERS (Memoized) ---
  
  const usuariosMap = useMemo(() => new Map(usuarios.map(u => [u.id, u])), [usuarios]);
  const proyectosMap = useMemo(() => new Map(proyectos.map(p => [p.id, p])), [proyectos]);

  const getUserInfo = useCallback((id: number) => {
    const user = usuariosMap.get(id);
    return user ? { name: `${user.nombre} ${user.apellido}`, email: user.email } : { name: `Usuario #${id}`, email: 'Sin datos' };
  }, [usuariosMap]);

  const getProjectName = useCallback((id: number) => {
    const proj = proyectosMap.get(id);
    return proj ? proj.nombre_proyecto : `Proyecto #${id}`;
  }, [proyectosMap]);

  // --- DATA PROCESSING ---

  // Chart Data
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
      .slice(0, 10); // Top 10
  }, [topInvestors, getUserInfo]);

  // Filter Logic
  const filteredInversiones = useMemo(() => {
    return inversiones.filter(inv => {
      const userInfo = getUserInfo(inv.id_usuario);
      const projName = getProjectName(inv.id_proyecto);
      const term = searchTerm.toLowerCase();

      const matchesSearch = 
        userInfo.name.toLowerCase().includes(term) ||
        userInfo.email.toLowerCase().includes(term) ||
        projName.toLowerCase().includes(term) ||
        inv.id.toString().includes(term);

      const matchesProject = filterProject === 'all' || inv.id_proyecto === Number(filterProject);
      const matchesStatus = filterStatus === 'all' || inv.estado === filterStatus;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [inversiones, searchTerm, filterProject, filterStatus, getUserInfo, getProjectName]);

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
    
    // Data
    liquidezData,
    filteredInversiones,
    chartData,
    proyectos, // Para el select
    
    // Loading
    isLoading: loadingInv || loadingMetrics,
    error,

    // Helpers
    getUserInfo,
    getProjectName,

    // Modals
    detailModal,
    handleViewDetails,
    handleCloseModal
  };
};
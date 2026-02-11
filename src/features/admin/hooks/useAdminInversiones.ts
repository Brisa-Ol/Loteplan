import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useModal } from '@/shared/hooks/useModal';
import type { InversionDto } from '@/core/types/dto/inversion.dto';
import InversionService from '@/core/api/services/inversion.service';
import { useSortedData } from './useSortedData';

// --- HELPERS ---
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
  
  // 1. Listado de Inversiones (Retorno directo del array según controlador)
  const { data: inversionesRaw = [], isLoading: loadingInv, error } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => {
      const response = await InversionService.findAll();
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 30000,
  });

  // 2. Métricas de Liquidez (Wrapper .data.data)
  const { data: liquidezData, isLoading: loadingLiq } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data,
    staleTime: 60000,
  });

  // 3. Top Inversores Agregados (Wrapper .data.data)
  const { data: topInvestors = [], isLoading: loadingTop } = useQuery({
    queryKey: ['adminTopInvestors'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data.data,
    staleTime: 60000,
  });

  const isLoading = loadingInv || loadingLiq || loadingTop;

  // --- PROCESAMIENTO DE DERIVADOS ---

  // Proyectos únicos para el filtro (derivado de las inversiones cargadas)
const proyectosUnicos = useMemo(() => {
    const map = new Map();
    inversionesRaw.forEach(inv => {
        // ✅ CORRECCIÓN: Usar el nombre exacto del DTO/Backend
        const proj = inv.proyectoInvertido; 
        if (proj) map.set(proj.id, proj);
    });
    return Array.from(map.values());
  }, [inversionesRaw]);

  // Ordenamiento base
  const { sortedData: inversionesOrdenadas, highlightedId } = useSortedData(inversionesRaw);

  // --- FILTRADO OPTIMIZADO ---
  const filteredInversiones = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();

    return inversionesOrdenadas.filter(inv => {
      // A. Filtros de Categoría
      const matchProject = filterProject === 'all' || inv.id_proyecto === Number(filterProject);
      const matchStatus = filterStatus === 'all' || inv.estado.toLowerCase() === filterStatus.toLowerCase();
      
      if (!matchProject || !matchStatus) return false;
      if (!term) return true;

      // B. Filtros de Búsqueda
      const inversor = (inv as any).inversor;
      const proyecto = inv.proyectoInvertido;

      const userName = inversor ? `${inversor.nombre} ${inversor.apellido}`.toLowerCase() : '';
      const userEmail = inversor?.email?.toLowerCase() || '';
      const projName = (proyecto?.nombre_proyecto || '').toLowerCase();

      return userName.includes(term) || userEmail.includes(term) || projName.includes(term) || inv.id.toString().includes(term);
    });
  }, [inversionesOrdenadas, debouncedSearchTerm, filterProject, filterStatus]);

  // --- DATA PARA GRÁFICOS (RECHARTS) ---
  
  const chartData = useMemo(() => {
    return topInvestors.slice(0, 10).map(item => {
      const foundInv = inversionesRaw.find(inv => inv.id_usuario === item.id_usuario);
      const user = (foundInv as any)?.inversor;
      return {
        name: user ? `${user.nombre} ${user.apellido}` : `ID #${item.id_usuario}`,
        monto: Number(item.monto_total_invertido),
      };
    });
  }, [topInvestors, inversionesRaw]);

  const trendData = useMemo(() => {
    if (inversionesRaw.length === 0) return [];

    const historyMap: Map<string, number> = new Map();
    let acumulado = 0;

    [...inversionesRaw]
      .filter(i => i.estado === 'pagado' || i.estado === 'pendiente')
      .map(i => ({ ...i, date: new Date(i.fecha_inversion || (i as any).createdAt || Date.now()) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(inv => {
        acumulado += Number(inv.monto);
        const label = inv.date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        historyMap.set(label, acumulado);
      });

    return Array.from(historyMap, ([fecha, monto]) => ({ fecha, monto })).slice(-20);
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
    // UI State
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedInversion,
    highlightedId,
    
    // Data
    filteredInversiones,
    chartData,
    trendData,
    liquidezData,
    proyectos: proyectosUnicos,
    
    // Helpers
    isLoading,
    error,
    
    // Modal Bridge
    modales: { detail: detailModal },
    handleViewDetails,
    handleCloseModal
  };
};
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { InversionDto } from '@/core/types/dto/inversion.dto';

import InversionService from '@/core/api/services/inversion.service';
import ProyectoService from '@/core/api/services/proyecto.service';
import UsuarioService from '@/core/api/services/usuario.service';
import { useSortedData } from './useSortedData';

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminInversiones = () => {
  const { showError } = useSnackbar();
  const detailModal = useModal();

  const modales = useMemo(() => ({ detail: detailModal }), [detailModal]);

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
    gcTime: 5 * 60 * 1000,
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
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const { data: allProyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const isLoading = l1 || l2 || l3;

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

  const { sortedData: inversionesOrdenadas, highlightedId } = useSortedData(inversionesRaw);

  const filteredInversiones = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return inversionesOrdenadas.filter(inv => {
      if (filterProject !== 'all' && inv.id_proyecto !== Number(filterProject)) return false;
      if (filterStatus !== 'all' && inv.estado !== filterStatus) return false;
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

  const proyectosInversion = useMemo(() => {
    return allProyectos.filter(p => p.tipo_inversion === 'directo');
  }, [allProyectos]);

  // ✨ CÁLCULO REAL DE TENDENCIAS
  // Agrupa por fecha y suma acumulativamente el capital
  const trendData = useMemo(() => {
    if (!inversionesRaw.length) return [];

    // 1. Filtramos: ¿Qué quieres ver? 
    // Si quieres ver "Intentos de pago", quitamos solo los fallidos/reembolsados.
    // Si quieres ver "Capital Real", filtra por estado === 'pagado'.
    // Aquí mostraré todo lo que no sea fallido/reembolsado para que veas tus intentos.
    const validas = inversionesRaw.filter(i => i.estado !== 'fallido' && i.estado !== 'reembolsado');

    // 2. Ordenar por fecha
    validas.sort((a, b) => new Date(a.fecha_inversion).getTime() - new Date(b.fecha_inversion).getTime());

    // 3. Acumular
    let acumulado = 0;
    const puntos: { fecha: string; monto: number }[] = [];

    validas.forEach(inv => {
      acumulado += Number(inv.monto);
      const fecha = new Date(inv.fecha_inversion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

      // Si ya existe la fecha, actualizamos el último punto, sino creamos uno nuevo
      const ultimoPunto = puntos[puntos.length - 1];
      if (ultimoPunto && ultimoPunto.fecha === fecha) {
        ultimoPunto.monto = acumulado;
      } else {
        puntos.push({ fecha, monto: acumulado });
      }
    });

    // Tomar solo los últimos X puntos si son muchos
    return puntos.slice(-20);
  }, [inversionesRaw]);

  const handleViewDetails = useCallback((inv: InversionDto) => {
    setSelectedInversion(inv);
    modales.detail.open();
  }, [modales.detail]);

  const handleCloseModal = useCallback(() => {
    modales.detail.close();
    setTimeout(() => setSelectedInversion(null), 300);
  }, [modales.detail]);

  return {
    searchTerm, setSearchTerm,
    filterProject, setFilterProject,
    filterStatus, setFilterStatus,
    selectedInversion,
    highlightedId,
    liquidezData,
    filteredInversiones,
    chartData,

    // ✨ Ahora exportamos data real
    trendData,

    proyectos: proyectosInversion,
    isLoading,
    error,
    getUserInfo,
    getProjectName,
    modales,
    handleViewDetails,
    handleCloseModal
  };
};
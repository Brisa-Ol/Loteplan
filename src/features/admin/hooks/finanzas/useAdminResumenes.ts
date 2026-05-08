// src/features/admin/hooks/finanzas/useAdminResumenes.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import { useModal } from '@/shared/hooks/useModal';
import { useSortedData } from '../useSortedData';
import { env } from '@/core/config/env';

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const useAdminResumenes = () => {
  const detalleModal = useModal();

  const [searchTerm, setSearchTerm] = useState('');
  // 🆕 Agregamos 'inactive' a los tipos permitidos
  const [filterState, setFilterState] = useState<'all' | 'active' | 'completed' | 'overdue' | 'pending' | 'inactive'>('all');
  const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { data: resumenesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminResumenes'],
    queryFn: async () => (await ResumenCuentaService.findAll()).data,
    staleTime: env.queryStaleTime || 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { sortedData: resumenesOrdenados, highlightedId } = useSortedData(resumenesRaw);

  const filteredResumenes = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return resumenesOrdenados.filter(resumen => {
      let matchesState = true;
      const esActiva = resumen.suscripcion?.activo !== false; // Considera true si es undefined por seguridad

      // 🆕 2. Filtramos considerando el estado inactivo
      if (filterState === 'active') {
        matchesState = esActiva && resumen.porcentaje_pagado < 100 && resumen.cuotas_vencidas === 0;
      } else if (filterState === 'completed') {
        matchesState = resumen.porcentaje_pagado >= 100;
      } else if (filterState === 'overdue') {
        matchesState = esActiva && resumen.cuotas_vencidas > 0;
      } else if (filterState === 'pending') {
        const cuotasPendientes = resumen.meses_proyecto - resumen.cuotas_pagadas - resumen.cuotas_vencidas;
        matchesState = esActiva && cuotasPendientes > 0 && resumen.porcentaje_pagado < 100 && resumen.cuotas_vencidas === 0;
      } else if (filterState === 'inactive') {
        matchesState = !esActiva; // Solo los que tienen activo === false
      }

      if (!matchesState) return false;

      if (!term) return true;

      const nombreProyecto = (resumen.suscripcion?.proyectoAsociado?.nombre_proyecto || resumen.nombre_proyecto).toLowerCase();
      const nombreUsuario = resumen.suscripcion?.usuario?.nombre?.toLowerCase() || '';
      const apellidoUsuario = resumen.suscripcion?.usuario?.apellido?.toLowerCase() || '';
      const emailUsuario = resumen.suscripcion?.usuario?.email?.toLowerCase() || '';
      const nombreCompleto = `${nombreUsuario} ${apellidoUsuario}`.trim();

      return (
        nombreProyecto.includes(term) ||
        nombreCompleto.includes(term) ||
        emailUsuario.includes(term) ||
        resumen.id.toString().includes(term) ||
        resumen.id_suscripcion.toString().includes(term)
      );
    });
  }, [resumenesOrdenados, debouncedSearchTerm, filterState]);

  const handleVerDetalle = useCallback((resumen: ResumenCuentaDto) => {
    setSelectedResumen(resumen);
    detalleModal.open();
  }, [detalleModal]);

  const handleCloseModal = useCallback(() => {
    detalleModal.close();
    setTimeout(() => setSelectedResumen(null), 300);
  }, [detalleModal]);

  return {
    searchTerm, setSearchTerm,
    filterState, setFilterState,
    selectedResumen,
    highlightedId,
    filteredResumenes,
    isLoading,
    error,
    detalleModal,
    handleVerDetalle,
    handleCloseModal
  };
};
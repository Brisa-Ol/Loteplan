import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import { useModal } from '@/shared/hooks/useModal';
import { useSortedData } from '../useSortedData';

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export const useAdminResumenes = () => {
  // --- MODALES (Nivel Superior) ---
  const detalleModal = useModal();

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

  // ✨ Debounce
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERY OPTIMIZADA ---
  const { data: resumenesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminResumenes'],
    queryFn: async () => (await ResumenCuentaService.findAll()).data,
    staleTime: 30000,      // 30 segundos de frescura
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
    refetchOnWindowFocus: false,
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: resumenesOrdenados, highlightedId } = useSortedData(resumenesRaw);

  // --- FILTRADO (Memoizado + Debounce) ---
  const filteredResumenes = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return resumenesOrdenados.filter(resumen => {
      // 1. Filtro de Estado (Rápido)
      let matchesState = true;
      if (filterState === 'active') {
        matchesState = resumen.porcentaje_pagado < 100 && resumen.cuotas_vencidas === 0;
      } else if (filterState === 'completed') {
        matchesState = resumen.porcentaje_pagado >= 100;
      } else if (filterState === 'overdue') {
        matchesState = resumen.cuotas_vencidas > 0;
      }

      if (!matchesState) return false;

      // 2. Filtro de Texto (🚨 AHORA BUSCA POR USUARIO)
      if (!term) return true;

      // Extracción segura de datos para la búsqueda
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

  // --- HANDLERS ---
  const handleVerDetalle = useCallback((resumen: ResumenCuentaDto) => {
    setSelectedResumen(resumen);
    detalleModal.open();
  }, [detalleModal]);

  const handleCloseModal = useCallback(() => {
    detalleModal.close();
    setTimeout(() => setSelectedResumen(null), 300);
  }, [detalleModal]);

  return {
    // State
    searchTerm, setSearchTerm,
    filterState, setFilterState,
    selectedResumen,

    // ✨ UX
    highlightedId,

    // Data
    filteredResumenes,
    isLoading,
    error,

    // Modales
    detalleModal,

    // Handlers
    handleVerDetalle,
    handleCloseModal
  };
};
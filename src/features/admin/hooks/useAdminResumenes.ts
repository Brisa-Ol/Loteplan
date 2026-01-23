import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import { useModal } from '@/shared/hooks/useModal';
import { useSortedData } from './useSortedData';


export const useAdminResumenes = () => {
  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  // Hooks
  const detalleModal = useModal();
  const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

  // --- QUERY ---
  const { data: resumenesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminResumenes'],
    queryFn: async () => {
      const response = await ResumenCuentaService.findAll();
      return response.data;
    },
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  // Aunque aquí no creamos items, el ordenamiento descendente por ID es útil
  const { sortedData: resumenesOrdenados, highlightedId } = useSortedData(resumenesRaw);

  // --- FILTRADO (Sobre data ordenada) ---
  const filteredResumenes = useMemo(() => {
    return resumenesOrdenados.filter(resumen => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        resumen.nombre_proyecto.toLowerCase().includes(term) ||
        resumen.id.toString().includes(term) ||
        resumen.id_suscripcion.toString().includes(term);

      let matchesState = true;
      if (filterState === 'active') {
        matchesState = resumen.porcentaje_pagado < 100 && resumen.cuotas_vencidas === 0;
      } else if (filterState === 'completed') {
        matchesState = resumen.porcentaje_pagado >= 100;
      } else if (filterState === 'overdue') {
        matchesState = resumen.cuotas_vencidas > 0;
      }

      return matchesSearch && matchesState;
    });
  }, [resumenesOrdenados, searchTerm, filterState]);

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
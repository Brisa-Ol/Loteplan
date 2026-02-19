import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

import TransaccionService from '@/core/api/services/transaccion.service';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';
import { useConfirmDialog, useModal, useSnackbar } from '@/shared/hooks';
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

export const useAdminTransacciones = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES (Nivel Superior) ---
  const detailModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    detail: detailModal,
    confirm: confirmDialog
  }), [detailModal, confirmDialog]);

  // --- ESTADOS UI Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 🆕 Filtro por Tipo (Inversión, Suscripción, etc.)
  const [dateFrom, setDateFrom] = useState('');        // 🆕 Filtro Fecha Desde
  const [dateTo, setDateTo] = useState('');            // 🆕 Filtro Fecha Hasta
  
  const [selectedTransaccion, setSelectedTransaccion] = useState<TransaccionDto | null>(null);

  // ✨ Debounce para búsqueda en grandes volúmenes de datos
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERIES ---
  const { data: transaccionesRaw = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => (await TransaccionService.findAll()).data,
    staleTime: 30000,      // 30 segundos fresh
    gcTime: 5 * 60 * 1000, // 5 minutos en memoria
    refetchOnWindowFocus: false,
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: transaccionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(transaccionesRaw);

  // --- FILTRADO (Optimizado con Debounce y Múltiples Criterios) ---
  const filteredData = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return transaccionesOrdenadas.filter(t => {
      // 1. Filtro rápido de Estado
      if (filterStatus !== 'all' && t.estado_transaccion !== filterStatus) {
        return false;
      }

      // 2. 🆕 Filtro de Tipo de Transacción
      if (filterType !== 'all' && t.tipo_transaccion !== filterType) {
        return false;
      }

      // 3. 🆕 Filtro de Rango de Fechas
      if (dateFrom || dateTo) {
        const txDate = new Date(t.fecha_transaccion);
        // Ajustamos la hora para que cubra todo el día seleccionado
        if (dateFrom && txDate < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && txDate > new Date(`${dateTo}T23:59:59`)) return false;
      }

      // 4. Filtro de Texto (Más costoso, ejecutar al final)
      if (!term) return true;

      const nombreUsuario = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}`.toLowerCase() : '';
      const emailUsuario = t.usuario?.email.toLowerCase() || '';
      const nombreProyecto = t.proyectoTransaccion?.nombre_proyecto.toLowerCase() || '';

      const refPasarela = t.pagoPasarela?.id_transaccion_pasarela?.toLowerCase() ||
        t.id_pago_pasarela?.toString() ||
        '';

      return (
        t.id.toString().includes(term) ||
        nombreUsuario.includes(term) ||
        emailUsuario.includes(term) ||
        nombreProyecto.includes(term) ||
        refPasarela.includes(term)
      );
    });
  }, [transaccionesOrdenadas, debouncedSearchTerm, filterStatus, filterType, dateFrom, dateTo]);

  // --- MUTACIONES ---
  const confirmMutation = useMutation({
    mutationFn: (id: number) => TransaccionService.forceConfirm(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransacciones'] });
      triggerHighlight(id);
      showSuccess(`✅ Éxito: ${response.data.mensaje}`);
      if (modales.detail.isOpen) handleCloseModal();
      modales.confirm.close();
    },
    onError: (err: any) => {
      modales.confirm.close();
      showError(err.response?.data?.message || 'Error al confirmar transacción');
    }
  });

  // --- HANDLERS ---
  const handleForceConfirmClick = useCallback((id: number) => {
    const tx = transaccionesRaw.find(t => t.id === id);
    modales.confirm.confirm('force_confirm_transaction', tx || { id });
  }, [modales.confirm, transaccionesRaw]);

  const handleConfirmAction = useCallback(() => {
    if (modales.confirm.action === 'force_confirm_transaction' && modales.confirm.data) {
      confirmMutation.mutate(modales.confirm.data.id);
    }
  }, [modales.confirm, confirmMutation]);

  const handleViewDetails = useCallback((row: TransaccionDto) => {
    setSelectedTransaccion(row);
    modales.detail.open();
  }, [modales.detail]);

  const handleCloseModal = useCallback(() => {
    modales.detail.close();
    setTimeout(() => setSelectedTransaccion(null), 300);
  }, [modales.detail]);

  return {
    theme,
    // State
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterType, setFilterType, // 🆕
    dateFrom, setDateFrom,     // 🆕
    dateTo, setDateTo,         // 🆕

    // UX Props
    highlightedId,
    selectedTransaccion,

    // Data
    filteredData,

    // Loading
    isLoading,
    isConfirming: confirmMutation.isPending,
    error,

    // Modales
    modales,

    // Handlers
    handleForceConfirmClick,
    handleConfirmAction,
    handleViewDetails,
    handleCloseModal
  };
};
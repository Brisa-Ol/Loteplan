import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';

import TransaccionService from '@/core/api/services/transaccion.service';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';
import { useSortedData } from './useSortedData';

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

  // --- ESTADOS UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // --- FILTRADO (Optimizado con Debounce) ---
  const filteredData = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return transaccionesOrdenadas.filter(t => {
      // 1. Filtro rápido de estado
      if (filterStatus !== 'all' && t.estado_transaccion !== filterStatus) {
        return false;
      }

      // 2. Filtro de texto (Más costoso, ejecutar al final)
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
  }, [transaccionesOrdenadas, debouncedSearchTerm, filterStatus]);

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
    // Intentamos buscar la transacción completa para pasar datos al diálogo
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
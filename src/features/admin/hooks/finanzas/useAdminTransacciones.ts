// src/features/admin/hooks/useAdminTransacciones.ts

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

import TransaccionService from '@/core/api/services/transaccion.service';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';

import { useSortedData } from '../useSortedData';
import { useConfirmDialog, useModal, useSnackbar } from '@/shared/hooks';
import { env } from '@/core/config/env'; // 👈 1. Importamos env

// Extendemos el tipo para incluir la auditoría visual en el admin
export type AdminTransaction = TransaccionDto & {
  tieneDiscrepancia?: boolean;
};

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

  // --- MODALES ---
  const detailModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    detail: detailModal,
    confirm: confirmDialog
  }), [detailModal, confirmDialog]);

  // --- ESTADOS UI Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); 
  const [dateFrom, setDateFrom] = useState('');        
  const [dateTo, setDateTo] = useState('');            
  
  const [selectedTransaccion, setSelectedTransaccion] = useState<AdminTransaction | null>(null);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERIES ---
  const { data: transaccionesRaw = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => (await TransaccionService.findAll()).data,
    staleTime: env.queryStaleTime || 30000, // 👈 2. Aplicamos la variable global
  });

  // --- ORDENAMIENTO + HIGHLIGHT ---
  const { sortedData: transaccionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(transaccionesRaw);

  // --- FILTRADO Y AUDITORÍA (Integrado) ---
  const filteredData = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return (transaccionesOrdenadas as AdminTransaction[]).filter(t => {
      // 1. Filtros de Estado y Tipo
      if (filterStatus !== 'all' && t.estado_transaccion !== filterStatus) return false;
      if (filterType !== 'all' && t.tipo_transaccion !== filterType) return false;

      // 2. Filtro de Rango de Fechas
      if (dateFrom || dateTo) {
        const txDate = new Date(t.fecha_transaccion);
        if (dateFrom && txDate < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && txDate > new Date(`${dateTo}T23:59:59`)) return false;
      }

      // 3. LÓGICA DE AUDITORÍA: Detección de Discrepancia (Centavos)
      // Comparamos el monto de la transacción vs el monto del pago original esperado
      const montoTx = parseFloat(t.monto.toString());
      const montoOriginal = t.pagoMensual 
        ? parseFloat(t.pagoMensual.monto.toString()) 
        : t.inversion 
          ? parseFloat(t.inversion.monto.toString()) 
          : montoTx;

      t.tieneDiscrepancia = Math.abs(montoTx - montoOriginal) > 0.01;

      // 4. Búsqueda Extendida (Texto)
      if (!term) return true;

      const nombreCompleto = `${t.usuario?.nombre} ${t.usuario?.apellido}`.toLowerCase();
      const dni = t.usuario?.dni?.toLowerCase() || '';
      const email = t.usuario?.email.toLowerCase() || '';
      const proyecto = t.proyectoTransaccion?.nombre_proyecto.toLowerCase() || '';
      
      // Búsqueda por referencia Mercado Pago e ID interno
      const refMP = t.pagoPasarela?.id_transaccion_pasarela?.toLowerCase() || '';
      const transaccionId = t.id.toString();

      return (
        transaccionId.includes(term) ||
        nombreCompleto.includes(term) ||
        dni.includes(term) ||
        email.includes(term) ||
        proyecto.includes(term) ||
        refMP.includes(term)
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

  const handleViewDetails = useCallback((row: AdminTransaction) => {
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
    filterType, setFilterType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,

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
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';


import TransaccionService from '@/core/api/services/transaccion.service';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';
import { useSortedData } from './useSortedData';

export const useAdminTransacciones = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Estados UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaccion, setSelectedTransaccion] = useState<TransaccionDto | null>(null);

  // Modales
  const modales = {
    detail: useModal(),
    confirm: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: transaccionesRaw = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => (await TransaccionService.findAll()).data,
    refetchInterval: 30000, 
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT AUTOMÁTICO
  const { sortedData: transaccionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(transaccionesRaw);

  // --- MUTACIONES ---
  const confirmMutation = useMutation({
    mutationFn: (id: number) => TransaccionService.forceConfirm(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransacciones'] });
      
      triggerHighlight(id); // ✨ Highlight
      
      showSuccess(`✅ Éxito: ${response.data.mensaje}`);
      
      if (modales.detail.isOpen) handleCloseModal();
      modales.confirm.close();
    },
    onError: (err: any) => {
        modales.confirm.close();
        showError(err.response?.data?.message || 'Error al confirmar transacción');
    }
  });

  // --- FILTRADO ---
  const filteredData = useMemo(() => {
    return transaccionesOrdenadas.filter(t => {
      const term = searchTerm.toLowerCase();
      
      const nombreUsuario = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}`.toLowerCase() : '';
      const emailUsuario = t.usuario?.email.toLowerCase() || '';
      const nombreProyecto = t.proyectoTransaccion?.nombre_proyecto.toLowerCase() || '';
      
      // ✅ CORRECCIÓN: Eliminada la propiedad inexistente y búsqueda segura
      const refPasarela = t.pagoPasarela?.id_transaccion_pasarela?.toLowerCase() || 
                          t.id_pago_pasarela?.toString() || 
                          '';

      const matchesSearch = 
        t.id.toString().includes(term) || 
        nombreUsuario.includes(term) ||
        emailUsuario.includes(term) ||
        nombreProyecto.includes(term) ||
        refPasarela.includes(term);

      const matchesStatus = filterStatus === 'all' ? true : t.estado_transaccion === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transaccionesOrdenadas, searchTerm, filterStatus]);

  // --- HANDLERS ---
  const handleForceConfirmClick = useCallback((id: number) => {
    // Intentamos buscar la transacción completa para pasar datos al diálogo
    const tx = transaccionesRaw.find(t => t.id === id);
    modales.confirm.confirm('force_confirm_transaction', tx || { id });
  }, [modales.confirm, transaccionesRaw]);

  const handleConfirmAction = () => {
      if (modales.confirm.action === 'force_confirm_transaction' && modales.confirm.data) {
          confirmMutation.mutate(modales.confirm.data.id);
      }
  };

  const handleViewDetails = useCallback((row: TransaccionDto) => {
    setSelectedTransaccion(row);
    modales.detail.open();
  }, [modales.detail]);

  const handleCloseModal = useCallback(() => {
    modales.detail.close();
    setTimeout(() => setSelectedTransaccion(null), 300);
  }, [modales.detail]);

  // Helper de colores
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'fallido': 
      case 'rechazado_por_capacidad':
      case 'rechazado_proyecto_cerrado':
      case 'expirado':
        return 'error';
      default: return 'default';
    }
  };

  return {
    theme,
    // State
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    
    // ✨ UX Props
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

    // Helpers
    getStatusColor,

    // Handlers
    handleForceConfirmClick,
    handleConfirmAction,
    handleViewDetails,
    handleCloseModal
  };
};
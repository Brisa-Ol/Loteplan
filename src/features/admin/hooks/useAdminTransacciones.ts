import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material';

import useSnackbar from '../../../shared/hooks/useSnackbar';

import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import TransaccionService from '@/core/api/services/transaccion.service';
import type { TransaccionDto } from '@/core/types/dto/transaccion.dto';



export const useAdminTransacciones = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // Estados UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [selectedTransaccion, setSelectedTransaccion] = useState<TransaccionDto | null>(null);

  // Modales
  const modales = {
    detail: useModal(),
    confirm: useConfirmDialog()
  };

  // --- QUERIES ---
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => (await TransaccionService.findAll()).data,
    staleTime: 30000,
  });

  // --- MUTACIONES ---
  const confirmMutation = useMutation({
    mutationFn: (id: number) => TransaccionService.forceConfirm(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransacciones'] });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess(`✅ Éxito: ${response.data.mensaje}`);
      if (modales.detail.isOpen) handleCloseModal();
      modales.confirm.close();
    },
    onError: () => modales.confirm.close()
  });

  // --- FILTRADO ---
  const filteredData = useMemo(() => {
    return transacciones.filter(t => {
      const term = searchTerm.toLowerCase();
      
      const nombreUsuario = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}`.toLowerCase() : '';
      const emailUsuario = t.usuario?.email.toLowerCase() || '';
      const nombreProyecto = t.proyectoTransaccion?.nombre_proyecto.toLowerCase() || '';
      const refPasarela = t.pagoPasarela?.id_transaccion_pasarela || t.id_pago_pasarela?.toString() || '';

      const matchesSearch = 
        t.id.toString().includes(term) || 
        nombreUsuario.includes(term) ||
        emailUsuario.includes(term) ||
        nombreProyecto.includes(term) ||
        refPasarela.includes(term);

      const matchesStatus = filterStatus === 'all' ? true : t.estado_transaccion === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transacciones, searchTerm, filterStatus]);

  // --- HANDLERS ---
  const handleForceConfirmClick = useCallback((id: number) => {
    modales.confirm.confirm('force_confirm_transaction', { id });
  }, [modales.confirm]);

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

  // Helper de colores (lo movemos aquí o lo exportamos)
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
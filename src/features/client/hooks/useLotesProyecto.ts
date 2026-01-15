// src/hooks/useLotesProyecto.ts

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';

import useSnackbar from '../../../shared/hooks/useSnackbar'; 
import type { LoteDto } from '@/core/types/dto/lote.dto';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import LoteService from '@/core/api/services/lote.service';
import FavoritoService from '@/core/api/services/favorito.service';

export const useLotesProyecto = (idProyecto: number, isAuthenticated: boolean) => {
  const queryClient = useQueryClient();
  
  // Inicializamos el Snackbar
  const { showSuccess, showError, showWarning, snackbar, handleClose: closeSnackbar } = useSnackbar();
  
  // Estados y Modales
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();

  // 1. Query: Obtener Lotes
  const { data: lotes, isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesProyecto', idProyecto],
    queryFn: async () => {
      const res = await LoteService.getAllActive();
      const allLotes = Array.isArray(res.data) ? res.data : [];
      return allLotes.filter(lote => lote.id_proyecto === idProyecto);
    },
    enabled: !!idProyecto, 
    retry: 1
  });

  // 2. Query: Verificar Suscripción
  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !!idProyecto,
    staleTime: 1000 * 60 * 5, // Cache de 5 min
  });

  // 3. Validación de Suscripción (Memoizada)
  const isSubscribed = useMemo(() => {
    if (!misSuscripciones) return false;
    return misSuscripciones.some(s => s.id_proyecto === idProyecto && s.activo === true);
  }, [misSuscripciones, idProyecto]);

  // Mutation: Favoritos
  const unfavMutation = useMutation({
    mutationFn: (loteId: number) => FavoritoService.toggle(loteId),
    onSuccess: (_, loteId) => {
      queryClient.setQueryData(['checkFavorito', loteId], { es_favorito: false });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      confirmDialog.close();
      showSuccess('Eliminado de favoritos');
    },
    onError: () => {
      showError('Error al quitar de favoritos');
      confirmDialog.close();
    }
  });

  // --- HANDLERS OPTIMIZADOS CON USECALLBACK ---

  // ✅ Envuelto en useCallback para evitar re-renderizados de la lista al hacer click
  const handleOpenPujar = useCallback((lote: LoteDto) => {
    // A. Validar Login
    if (!isAuthenticated) {
        showWarning('Debes iniciar sesión para realizar una oferta.');
        return; 
    }

    // B. Validar Suscripción
    if (!isSubscribed) {
        showWarning('Para participar de la subasta necesitas estar suscripto al proyecto.');
        return;
    }

    // C. Todo OK -> Abrir Modal
    setSelectedLote(lote);
    pujarModal.open();
  }, [isAuthenticated, isSubscribed, showWarning, pujarModal]);

  const handleRequestUnfav = useCallback((loteId: number) => {
    confirmDialog.confirm('remove_favorite', loteId);
  }, [confirmDialog]);

  const executeUnfav = useCallback(() => {
    if (confirmDialog.data) unfavMutation.mutate(confirmDialog.data);
  }, [confirmDialog.data, unfavMutation]);

  const closePujarModal = useCallback(() => {
    pujarModal.close();
    setSelectedLote(null);
  }, [pujarModal]);

  return {
    lotes,
    isLoading,
    error,
    selectedLote,
    pujarModal,
    confirmDialog,
    unfavPending: unfavMutation.isPending,
    isSubscribed,
    // Exportamos el estado del snackbar para que la vista lo pinte
    snackbar, 
    closeSnackbar,
    handleOpenPujar,
    handleRequestUnfav,
    executeUnfav,
    closePujarModal
  };
};
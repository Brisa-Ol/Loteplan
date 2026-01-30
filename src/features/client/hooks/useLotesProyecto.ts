// src/features/client/hooks/useLotesProyecto.ts
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
  const { showSuccess, showError, showWarning, snackbar, handleClose: closeSnackbar } = useSnackbar();
  
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();

  // 1. Query: Obtener Lotes
  const { data: lotes = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesActivos'],
    queryFn: async () => {
      const res = await LoteService.getAllActive();
      return res.data || [];
    },
    select: (allLotes) => {
      return allLotes.filter(lote => Number(lote.id_proyecto) === Number(idProyecto));
    },
    enabled: !!idProyecto && isAuthenticated,
    staleTime: 1000 * 60, 
  });

  // 2. Query: Verificar Suscripción
  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !!idProyecto,
    staleTime: 1000 * 60 * 2, // ✅ Reducido (tokens cambian)
  });

  // ✅ 3. VALIDACIÓN CORRECTA: Suscripción + Tokens
  const { isSubscribed, hasTokens, tokensDisponibles } = useMemo(() => {
    if (!misSuscripciones || !isAuthenticated) {
      return { isSubscribed: false, hasTokens: false, tokensDisponibles: 0 };
    }

    const suscripcion = misSuscripciones.find(
      s => Number(s.id_proyecto) === Number(idProyecto) && s.activo === true
    );

    if (!suscripcion) {
      return { isSubscribed: false, hasTokens: false, tokensDisponibles: 0 };
    }

    const tokens = suscripcion.tokens_disponibles || 0;
    
    return { 
      isSubscribed: true, 
      hasTokens: tokens > 0,
      tokensDisponibles: tokens
    };
  }, [misSuscripciones, idProyecto, isAuthenticated]);

  // Mutation: Favoritos
  const unfavMutation = useMutation({
    mutationFn: (loteId: number) => FavoritoService.toggle(loteId),
    onSuccess: (response, loteId) => {
      const esAhoraFavorito = response.data.agregado; 
      queryClient.setQueryData(['checkFavorito', loteId], { es_favorito: esAhoraFavorito });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      confirmDialog.close();
      if (esAhoraFavorito) showSuccess('Añadido a favoritos');
      else showSuccess('Eliminado de favoritos');
    },
    onError: () => {
      showError('Error al actualizar favoritos');
      confirmDialog.close();
    }
  });

  // ✅ HANDLER MEJORADO: Validar tokens
  const handleOpenPujar = useCallback((lote: LoteDto) => {
    if (!isAuthenticated) {
      showWarning('Debes iniciar sesión para realizar una oferta.');
      return; 
    }
    
    if (!isSubscribed) {
      showWarning('Para participar debes estar suscripto al proyecto.');
      return;
    }

    // ✅ VALIDACIÓN DE TOKENS
    if (!hasTokens) {
      showWarning('Ya utilizaste tu token de subasta en este proyecto. Gana o espera la próxima ronda de lotes.');
      return;
    }

    setSelectedLote(lote);
    pujarModal.open();
  }, [isAuthenticated, isSubscribed, hasTokens, showWarning, pujarModal]);

  const handleRequestUnfav = useCallback((loteId: number) => {
    confirmDialog.confirm('remove_favorite', loteId);
  }, [confirmDialog]);

  const executeUnfav = useCallback(() => {
    if (confirmDialog.data) unfavMutation.mutate(confirmDialog.data);
  }, [confirmDialog.data, unfavMutation]);

  const closePujarModal = useCallback(() => {
    pujarModal.close();
    setTimeout(() => setSelectedLote(null), 300);
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
    hasTokens, // ✅ NUEVO
    tokensDisponibles, // ✅ NUEVO
    snackbar, 
    closeSnackbar,
    handleOpenPujar,
    handleRequestUnfav,
    executeUnfav,
    closePujarModal
  };
};
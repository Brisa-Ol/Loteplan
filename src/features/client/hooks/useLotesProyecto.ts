// src/features/client/hooks/useLotesProyecto.ts
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import FavoritoService from '@/core/api/services/favorito.service';
import { ROUTES } from '@/routes';

// ✅ NUEVO: Importamos el auth context para saber el ID del usuario
import { useAuth } from '@/core/context/AuthContext';

export const useLotesProyecto = (idProyecto: number, isAuthenticated: boolean) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useSnackbar();
  
  // ✅ Obtenemos el usuario actual
  const { user } = useAuth();

  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();

  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyectoConLotes', idProyecto],
    queryFn: async () => {
      const res = await ProyectoService.getByIdActive(idProyecto);
      return res.data;
    },
    enabled: !!idProyecto,
    staleTime: 1000 * 60 * 5, 
  });

  const lotes = useMemo(() => {
    return proyecto?.lotes || [];
  }, [proyecto]);

  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !!idProyecto,
    staleTime: 1000 * 60 * 2,
  });

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

  // ✅ HANDLERS CORREGIDOS
  const handleOpenPujar = useCallback((lote: any) => { // Usamos any o extendemos LoteDto si typescript se queja de ultima_puja
    if (!isAuthenticated) {
      return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    }

    if (!isSubscribed) {
      showWarning('Para participar debes estar suscripto al proyecto.');
      return;
    }

    // ✅ LÓGICA DE GANADOR: Verificamos si este usuario va ganando ESTE lote en particular
    const esGanadorActual = lote.estado_subasta === 'activa' 
      ? lote.ultima_puja?.id_usuario === user?.id 
      : lote.id_ganador === user?.id;

    // ✅ CONDICIÓN CORREGIDA: Si NO tiene tokens Y TAMPOCO es el ganador, lo bloqueamos.
    // Si es el ganador, la condición es falsa y lo deja pasar a defender su puja.
    if (!hasTokens && !esGanadorActual) {
      showWarning('Ya utilizaste tu token de subasta en este proyecto.');
      return;
    }

    setSelectedLote(lote);
    pujarModal.open();
  }, [isAuthenticated, isSubscribed, hasTokens, user?.id, navigate, location.pathname, showWarning, pujarModal]);

  const handleRequestUnfav = useCallback((loteId: number) => {
    if (!isAuthenticated) {
      return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    }
    confirmDialog.confirm('remove_favorite', loteId);
  }, [isAuthenticated, navigate, location.pathname, confirmDialog]);

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
    hasTokens,
    tokensDisponibles,
    handleOpenPujar,
    handleRequestUnfav,
    executeUnfav,
    closePujarModal
  };
};
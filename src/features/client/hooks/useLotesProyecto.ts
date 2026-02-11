// src/features/client/hooks/useLotesProyecto.ts
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import type { LoteDto } from '@/core/types/dto/lote.dto';
// ✅ Importamos ProyectoService
import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import FavoritoService from '@/core/api/services/favorito.service';
import { ROUTES } from '@/routes';

export const useLotesProyecto = (idProyecto: number, isAuthenticated: boolean) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useSnackbar();

  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  const pujarModal = useModal();
  const confirmDialog = useConfirmDialog();

  // ✅ CORRECCIÓN CLAVE:
  // En lugar de llamar a LoteService (que da 403 o requiere filtrar todo),
  // llamamos al Proyecto, el cual YA INCLUYE la lista de lotes en su respuesta.
  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyectoConLotes', idProyecto],
    queryFn: async () => {
      // Usamos el endpoint: /proyectos/:id/activo
      const res = await ProyectoService.getByIdActive(idProyecto);
      return res.data;
    },
    // Este endpoint es público en tu backend, así que siempre podemos cargar los datos
    // aunque validamos que exista el ID.
    enabled: !!idProyecto,
    staleTime: 1000 * 60 * 5, // Cacheamos 5 minutos
  });

  // ✅ Extraemos los lotes directamente del proyecto
  // Si proyecto.lotes viene undefined, usamos un array vacío.
  const lotes = useMemo(() => {
    return proyecto?.lotes || [];
  }, [proyecto]);

  // -----------------------------------------------------------
  // El resto del hook se mantiene igual para manejar la lógica de usuario
  // -----------------------------------------------------------

  // QUERY PRIVADA: Verifica suscripción (Solo si está logueado)
  const { data: misSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !!idProyecto,
    staleTime: 1000 * 60 * 2,
  });

  // ESTADOS DE PARTICIPACIÓN
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

  // HANDLERS
  const handleOpenPujar = useCallback((lote: LoteDto) => {
    if (!isAuthenticated) {
      return navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
    }

    if (!isSubscribed) {
      showWarning('Para participar debes estar suscripto al proyecto.');
      return;
    }

    if (!hasTokens) {
      showWarning('Ya utilizaste tu token de subasta en este proyecto.');
      return;
    }

    setSelectedLote(lote);
    pujarModal.open();
  }, [isAuthenticated, isSubscribed, hasTokens, navigate, location.pathname, showWarning, pujarModal]);

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
    lotes, // ✅ Retorna los lotes extraídos del proyecto
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
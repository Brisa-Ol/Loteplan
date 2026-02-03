// src/shared/components/ui/buttons/FavoritoButton.tsx

import FavoritoService from '@/core/api/services/favorito.service';
import LoteService from '@/core/api/services/lote.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context/AuthContext';
import type { CheckFavoritoResponseDto } from '@/core/types/dto/favorito.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { IconButton, Tooltip, Zoom } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

interface FavoritoButtonProps {
  loteId: number;
  size?: 'small' | 'medium' | 'large';
  onRemoveRequest?: (id: number) => void;
}

export const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  loteId,
  size = 'medium',
  onRemoveRequest
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showError } = useSnackbar();

  // CLAVE: Query Key consistente
  const QUERY_KEY = ['favorito', loteId];

  // 1. ESTADO ACTUAL (Desde Cache)
  const { data: status } = useQuery<CheckFavoritoResponseDto>({
    queryKey: QUERY_KEY,
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const isFavorite = status?.es_favorito ?? false;

  // 2. DATOS AUXILIARES (Para validaciones de negocio)
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    enabled: isAuthenticated && !isFavorite,
    staleTime: 1000 * 60 * 10
  });

  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !isFavorite && !!lote?.id_proyecto,
    staleTime: 1000 * 60 * 2
  });

  // 3. MUTACIÓN OPTIMISTA (La magia ocurre aquí)
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),

    // ✨ SE EJECUTA ANTES DE IR AL SERVIDOR
    onMutate: async () => {
      // 1. Cancelar queries en vuelo para que no sobrescriban nuestro estado optimista
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // 2. Guardar el estado anterior (snapshot) por si hay error
      const previousStatus = queryClient.getQueryData<CheckFavoritoResponseDto>(QUERY_KEY);

      // 3. ACTUALIZAR UI INMEDIATAMENTE (Lo ponemos como queremos que se vea)
      const nuevoEstado = !isFavorite;

      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, (old) => ({
        es_favorito: nuevoEstado // Forzamos el cambio visual
      }));

      // Feedback visual instantáneo (opcional, pero se siente bien)
      if (nuevoEstado) {
        // showSuccess('Añadido a favoritos'); // A veces es mejor esperar al success real para el toast
      }

      return { previousStatus };
    },

    // ✅ SI EL SERVIDOR RESPONDE OK
    onSuccess: (response) => {
      const serverState = response.data.agregado;

      // Sincronizamos con la verdad del servidor (por si acaso difiere)
      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, { es_favorito: serverState });

      // Actualizamos la lista de "Mis Favoritos" en segundo plano
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });

      // Feedback al usuario
      if (serverState) {
        showSuccess('Guardado en tu lista de seguimiento');
      } else {
        showInfo('Dejaste de seguir este lote');
      }
    },

    // ❌ SI HAY ERROR
    onError: (_err, _variables, context) => {
      // Revertimos al estado anterior (Rollback)
      if (context?.previousStatus) {
        queryClient.setQueryData(QUERY_KEY, context.previousStatus);
      }
      showError('No se pudo actualizar favoritos');
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      showInfo('Inicia sesión para guardar favoritos');
      return;
    }

    // Validaciones de negocio (Suscripción requerida)
    if (!isFavorite && lote && lote.id_proyecto) {
      const tieneSuscripcion = suscripciones?.some(
        s => s.id_proyecto === lote.id_proyecto && s.activo
      );
      const validacion = FavoritoService.puedeAgregarFavorito(lote, !!tieneSuscripcion);
      if (!validacion.puede) {
        showInfo(`🔒 ${validacion.razon}`);
        return;
      }
    }

    mutation.mutate();
  };

  return (
    <Tooltip
      title={isFavorite ? "Dejar de seguir" : "Guardar en favoritos"}
      TransitionComponent={Zoom}
      arrow
    >
      <IconButton
        onClick={handleClick}
        // Eliminamos disabled={mutation.isPending} para permitir clicks rápidos (debounce natural)
        size={size}
        sx={{
          // Color dinámico basado en estado optimista
          color: isFavorite ? 'error.main' : 'action.disabled',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

          // Animación de escala al activar
          transform: isFavorite ? 'scale(1.1)' : 'scale(1)',

          '&:hover': {
            color: isFavorite ? 'error.dark' : 'error.main',
            transform: 'scale(1.2)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,0,0,0.04)'
          },
          '&:active': {
            transform: 'scale(0.9)'
          }
        }}
      >
        {isFavorite ? <Favorite fontSize="inherit" /> : <FavoriteBorder fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};
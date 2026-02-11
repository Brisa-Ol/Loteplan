// src/shared/components/ui/buttons/FavoritoButton.tsx

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconButton, Tooltip, Zoom } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';

// Servicios y Contexto
import FavoritoService from '@/core/api/services/favorito.service';
import LoteService from '@/core/api/services/lote.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context/AuthContext';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { CheckFavoritoResponseDto } from '@/core/types/dto/favorito.dto';

interface FavoritoButtonProps {
  loteId: number;
  size?: 'small' | 'medium' | 'large';
}

export const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  loteId,
  size = 'medium',
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showError } = useSnackbar();

  const QUERY_KEY = ['favorito', loteId];

  // 1. ESTADO ACTUAL
  const { data: status } = useQuery<CheckFavoritoResponseDto>({
    queryKey: QUERY_KEY,
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 300000, // 5 minutos
  });

  const isFavorite = status?.es_favorito ?? false;

  // 2. DATOS AUXILIARES
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    enabled: isAuthenticated && !isFavorite,
    staleTime: 600000 // 10 minutos
  });

  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !isFavorite && !!lote?.id_proyecto,
    staleTime: 120000 // 2 minutos
  });

  // 3. MUTACIÓN OPTIMISTA
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousStatus = queryClient.getQueryData<CheckFavoritoResponseDto>(QUERY_KEY);

      // Optimistic Update
      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, { es_favorito: !isFavorite });

      return { previousStatus };
    },
    onSuccess: (response) => {
      const serverState = response.data.agregado;
      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, { es_favorito: serverState });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });

      if (serverState) showSuccess('Guardado en tu lista de seguimiento');
      else showInfo('Dejaste de seguir este lote');
    },
    onError: (_err, _variables, context) => {
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

    if (!isFavorite && lote && lote.id_proyecto) {
      const tieneSuscripcion = suscripciones?.some(s => s.id_proyecto === lote.id_proyecto && s.activo);
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
        size={size}
        sx={{
          color: isFavorite ? 'error.main' : 'action.disabled',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFavorite ? 'scale(1.1)' : 'scale(1)',
          '&:hover': {
            color: isFavorite ? 'error.dark' : 'error.main',
            transform: 'scale(1.2)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,0,0,0.04)'
          },
          '&:active': { transform: 'scale(0.9)' }
        }}
      >
        {isFavorite ? <Favorite fontSize="inherit" /> : <FavoriteBorder fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};
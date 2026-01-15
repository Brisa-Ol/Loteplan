// src/components/common/BotonFavorito/BotonFavorito.tsx

import React from 'react';
import { IconButton, Tooltip, CircularProgress, Zoom } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/context/AuthContext';
import useSnackbar from '@/shared/hooks/useSnackbar';
import FavoritoService from '@/core/api/services/favorito.service';
import type { CheckFavoritoResponseDto } from '@/core/types/dto/favorito.dto';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import LoteService from '@/core/api/services/lote.service';



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
  const { showSuccess, showInfo } = useSnackbar();

  // =========================================================
  // 1. ESTADO ACTUAL
  // =========================================================
  const { data: status, isLoading: loadingStatus } = useQuery<CheckFavoritoResponseDto>({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, 
    retry: false
  });

  const isFavorite = status?.es_favorito ?? false;

  // =========================================================
  // 2. DATOS PARA VALIDACIÓN
  // =========================================================
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

  // =========================================================
  // 3. MUTACIÓN (Toggle)
  // =========================================================
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorito', loteId] });
      const previousStatus = queryClient.getQueryData(['favorito', loteId]);

      queryClient.setQueryData(['favorito', loteId], (old: any) => ({
        es_favorito: !old?.es_favorito
      }));

      return { previousStatus };
    },
    onSuccess: (response) => {
      const fueAgregado = response.data.agregado;
      
      queryClient.setQueryData(['favorito', loteId], { es_favorito: fueAgregado });
      
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] }); 
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });

      if (fueAgregado) {
          showSuccess('Añadido a tus favoritos');
      } else {
          showInfo('Eliminado de tus favoritos');
      }
    },
    // ✅ CORRECCIÓN AQUÍ:
    // Eliminamos 'err' y 'newTodo' porque no se usan.
    // Solo dejamos 'context' que sí se usa para el rollback.
    onError: (_err, _newTodo, context: any) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['favorito', loteId], context.previousStatus);
      }
    }
  });

  // =========================================================
  // 4. HANDLER
  // =========================================================
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
        showInfo('Inicia sesión para guardar favoritos');
        return;
    }

    if (isFavorite && onRemoveRequest) {
      onRemoveRequest(loteId);
      return;
    }

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

  if (loadingStatus) return <CircularProgress size={20} color="inherit" thickness={5} />;

  return (
    <Tooltip 
        title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"} 
        TransitionComponent={Zoom}
        arrow
    >
      <IconButton 
        onClick={handleClick}
        disabled={mutation.isPending}
        size={size}
        sx={{ 
          color: isFavorite ? 'error.main' : 'action.disabled',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            color: isFavorite ? 'error.dark' : 'error.light',
            transform: 'scale(1.15)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        {isFavorite ? <Favorite fontSize="inherit" /> : <FavoriteBorder fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};
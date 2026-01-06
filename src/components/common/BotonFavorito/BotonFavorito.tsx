import React from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Servicios y Tipos
import FavoritoService from '../../../services/favorito.service';
import SuscripcionService from '../../../services/suscripcion.service';
import LoteService from '../../../services/lote.service';
import { useAuth } from '../../../context/AuthContext';
import type { CheckFavoritoResponseDto } from '../../../types/dto/favorito.dto';

// ✅ Hook Global
import { useSnackbar } from '../../../context/SnackbarContext';

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
  
  // ✅ Usamos el sistema de notificaciones global
  const { showSuccess, showInfo } = useSnackbar();

  // 1. Estado Actual
  const { data: status, isLoading: loadingStatus } = useQuery<CheckFavoritoResponseDto>({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, 
  });

  // 2. Datos para validación (Lote y Suscripciones)
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    enabled: isAuthenticated && !status?.es_favorito 
  });

  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !status?.es_favorito
  });

  // 3. Mutación
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onSuccess: (response) => {
      const fueAgregado = response.data.agregado;
      
      // Actualizamos cache local optimista
      queryClient.setQueryData(['favorito', loteId], { es_favorito: fueAgregado });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });

      // ✅ Feedback visual sutil
      showSuccess(fueAgregado ? 'Añadido a favoritos' : 'Eliminado de favoritos');
    },
    // ❌ onError ELIMINADO: El interceptor global maneja el error HTTP.
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    const esFavoritoActualmente = status?.es_favorito;

    // Caso especial: Si el padre maneja la eliminación (ej: lista de favoritos)
    if (esFavoritoActualmente && onRemoveRequest) {
      onRemoveRequest(loteId);
      return;
    }

    // Validación de Negocio (Lotes Privados)
    if (!esFavoritoActualmente && lote && lote.id_proyecto) {
        const tieneSuscripcion = suscripciones?.some(
            s => s.id_proyecto === lote.id_proyecto && s.activo
        );
        
        const validacion = FavoritoService.puedeAgregarFavorito(lote, !!tieneSuscripcion);
        
        if (!validacion.puede) {
            // ✅ Reemplazo de alert() por notificación global (Info/Warning)
            showInfo(`Restringido: ${validacion.razon}`);
            return;
        }
    }

    mutation.mutate();
  };

  if (loadingStatus) return <CircularProgress size={20} color="inherit" />;

  const isFavorite = status?.es_favorito;

  return (
    <Tooltip title={isFavorite ? "Quitar de favoritos" : "Guardar lote"}>
      <IconButton 
        onClick={handleClick}
        disabled={mutation.isPending}
        size={size}
        sx={{ 
          color: isFavorite ? 'error.main' : 'action.disabled',
          transition: 'transform 0.2s',
          '&:hover': { 
            color: isFavorite ? 'error.dark' : 'error.light',
            transform: 'scale(1.1)' 
          }
        }}
      >
        {isFavorite ? <Favorite /> : <FavoriteBorder />}
      </IconButton>
    </Tooltip>
  );
};
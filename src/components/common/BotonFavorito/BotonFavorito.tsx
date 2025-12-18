import React from 'react';
import { IconButton, Tooltip, CircularProgress, Zoom } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FavoritoService from '../../../Services/favorito.service';
import { useAuth } from '../../../context/AuthContext';

interface FavoritoButtonProps {
  loteId: number;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  // 🆕 Nueva prop opcional: Función para manejar la eliminación manualmente (abrir modal)
  onRemoveRequest?: (loteId: number) => void;
}

export const FavoritoButton: React.FC<FavoritoButtonProps> = ({ 
  loteId, 
  size = 'medium',
  showTooltip = true,
  onRemoveRequest // 👈 Recibimos la función
}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 1. Consultar estado
  const { data: favoritoData, isLoading } = useQuery({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, 
  });

  const isFavorito = favoritoData?.es_favorito || false;

  // 2. Mutación estándar
  const toggleMutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onSuccess: (response) => {
      const { agregado } = response.data;
      // Actualizamos caché local
      queryClient.setQueryData(['favorito', loteId], { es_favorito: agregado });
      // Invalidamos lista general de favoritos y la de proyectos para refrescar UI
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] });
    },
    onError: (error: any) => {
      console.error("Error toggle favorito:", error);
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if (!isAuthenticated) {
      // Aquí podrías redirigir al login si quisieras
      return;
    }

    // 🚀 LÓGICA DE INTERCEPCIÓN
    // Si ya es favorito Y el padre nos dio una función para manejar la eliminación...
    if (isFavorito && onRemoveRequest) {
      onRemoveRequest(loteId); // ...llamamos al padre (abrir modal)
    } else {
      // Si no es favorito (es agregar) O no hay handler especial, ejecutamos directo
      toggleMutation.mutate(); 
    }
  };

  if (!isAuthenticated) return null;

  const buttonContent = (
    <IconButton
      onClick={handleClick}
      disabled={toggleMutation.isPending || isLoading}
      sx={{
        color: isFavorito ? 'error.main' : 'action.disabled',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          color: 'error.main',
          transform: 'scale(1.15)',
          bgcolor: 'rgba(211, 47, 47, 0.08)' 
        }
      }}
      size={size}
    >
      {toggleMutation.isPending ? (
        <CircularProgress size={size === 'small' ? 16 : 24} color="inherit" />
      ) : (
        <Zoom in={true} key={isFavorito ? 'fav' : 'not-fav'}>
           {isFavorito ? <Favorite /> : <FavoriteBorder />}
        </Zoom>
      )}
    </IconButton>
  );

  return showTooltip ? (
    <Tooltip title={isFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
      {buttonContent}
    </Tooltip>
  ) : buttonContent;
};
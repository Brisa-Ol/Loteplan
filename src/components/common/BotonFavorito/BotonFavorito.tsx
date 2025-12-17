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
}

export const FavoritoButton: React.FC<FavoritoButtonProps> = ({ 
  loteId, 
  size = 'medium',
  showTooltip = true 
}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 1. Consultar estado inicial (Solo si está logueado)
  const { data: favoritoData, isLoading } = useQuery({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  const isFavorito = favoritoData?.es_favorito || false;

  // 2. Mutación para toggle
  const toggleMutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onSuccess: (response) => {
      // El backend devuelve { agregado: boolean, mensaje: string }
      const { agregado, mensaje } = response.data;
      
      // Actualizamos la caché local optimistamente o invalidamos
      queryClient.setQueryData(['favorito', loteId], { es_favorito: agregado });
      
      // Invalidamos la lista general de favoritos
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
      
      // Opcional: Podrías usar 'mensaje' para un Toast notification
      console.log(mensaje); 
    },
    onError: (error: any) => {
      console.error("Error toggle favorito:", error);
      // Aquí podrías disparar un Toast de error
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita navegación si está dentro de un Link/Card
    e.stopPropagation(); 
    
    if (!isAuthenticated) {
      // Manejar redirección al login o abrir modal
      alert('Debes iniciar sesión para guardar favoritos');
      return;
    }
    toggleMutation.mutate();
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
          bgcolor: 'error.lighter' // Asegúrate de tener este color o usa rgba
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
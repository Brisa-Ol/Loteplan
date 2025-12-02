// src/components/common/FavoritoButton/FavoritoButton.tsx
import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
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

  // Consultar estado inicial
  const { data: favoritoData } = useQuery({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated // Solo si está autenticado
  });

  const isFavorito = favoritoData?.es_favorito || false;

  // Mutación para toggle
  const toggleMutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['favorito', loteId] });
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Error al gestionar favorito');
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que active navegación del card
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para guardar favoritos');
      return;
    }
    toggleMutation.mutate();
  };

  if (!isAuthenticated) return null; // No mostrar si no está logueado

  const button = (
    <IconButton
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      sx={{
        color: isFavorito ? '#CC6333' : '#CCCCCC',
        transition: 'all 0.2s',
        '&:hover': {
          color: '#CC6333',
          transform: 'scale(1.1)',
          bgcolor: 'rgba(204, 99, 51, 0.08)'
        }
      }}
      size={size}
    >
      {toggleMutation.isPending ? (
        <CircularProgress size={size === 'small' ? 16 : 24} sx={{ color: '#CC6333' }} />
      ) : isFavorito ? (
        <Favorite />
      ) : (
        <FavoriteBorder />
      )}
    </IconButton>
  );

  return showTooltip ? (
    <Tooltip title={isFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
      {button}
    </Tooltip>
  ) : button;
};
import React from 'react';
import { IconButton, Tooltip, CircularProgress, useTheme } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Servicios y Tipos
import FavoritoService from '../../../Services/favorito.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import LoteService from '../../../Services/lote.service';
import { useAuth } from '../../../context/AuthContext';
import type { CheckFavoritoResponseDto } from '../../../types/dto/favorito.dto';

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
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // 1. Estado Actual (Query Key: ['favorito', id])
  const { data: status, isLoading: loadingStatus } = useQuery<CheckFavoritoResponseDto>({
    queryKey: ['favorito', loteId],
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache por 5 mins
  });

  // 2. Datos para validación (Lote y Suscripciones)
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    enabled: isAuthenticated && !status?.es_favorito // Solo si vamos a intentar agregar
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
      // ✅ CORRECCIÓN CLAVE: Mapeamos 'agregado' (del toggle) a 'es_favorito' (de la caché)
      const nuevoEstado = response.data.agregado;
      
      // Actualizamos la caché optimísticamente
      queryClient.setQueryData(['favorito', loteId], { es_favorito: nuevoEstado });
      
      // Invalidamos la lista global
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al actualizar favorito';
      alert(msg); // O usar un snackbar global
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return; // O redirigir a login

    const esFavoritoActualmente = status?.es_favorito;

    // Si ya es favorito y hay handler de remover (ej: en pantalla MisFavoritos), usalo
    if (esFavoritoActualmente && onRemoveRequest) {
      onRemoveRequest(loteId);
      return;
    }

    // Validación de Negocio (Solo al intentar AGREGAR)
    if (!esFavoritoActualmente && lote && lote.id_proyecto) {
        const tieneSuscripcion = suscripciones?.some(
            s => s.id_proyecto === lote.id_proyecto && s.activo
        );
        
        // Usamos el helper del servicio
        const validacion = FavoritoService.puedeAgregarFavorito(lote, !!tieneSuscripcion);
        
        if (!validacion.puede) {
            alert(`🚫 Acceso Restringido: ${validacion.razon}`);
            return;
        }
    }

    // Si pasa validaciones, ejecutamos
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
import React from 'react';
import { IconButton, Tooltip, CircularProgress, Zoom } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Servicios y Tipos
import FavoritoService from '../../../services/favorito.service';
import SuscripcionService from '../../../services/suscripcion.service';
import LoteService from '../../../services/lote.service';
import { useAuth } from '../../../context/AuthContext';
import type { CheckFavoritoResponseDto } from '../../../types/dto/favorito.dto';

// Hook Global
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
  const { showSuccess, showInfo } = useSnackbar();

  // =========================================================
  // 1. ESTADO ACTUAL (Cache Key: ['favorito', loteId])
  // =========================================================
  const { data: status, isLoading: loadingStatus } = useQuery<CheckFavoritoResponseDto>({
    queryKey: ['favorito', loteId], // ⚠️ IMPORTANTE: Esta key debe ser la misma en toda la app
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
    retry: false
  });

  const isFavorite = status?.es_favorito ?? false;

  // =========================================================
  // 2. DATOS PARA VALIDACIÓN (Solo si NO es favorito y queremos agregar)
  // =========================================================
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    // Solo cargamos el lote si estamos logueados, NO es favorito aún, y vamos a intentar agregarlo
    enabled: isAuthenticated && !isFavorite,
    staleTime: 1000 * 60 * 10
  });

  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    // Igual que arriba: validación de negocio
    enabled: isAuthenticated && !isFavorite && !!lote?.id_proyecto,
    staleTime: 1000 * 60 * 2
  });

  // =========================================================
  // 3. MUTACIÓN (Toggle)
  // =========================================================
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onMutate: async () => {
      // Optimistic UI: Cancelar queries salientes
      await queryClient.cancelQueries({ queryKey: ['favorito', loteId] });

      // Guardar estado anterior
      const previousStatus = queryClient.getQueryData(['favorito', loteId]);

      // Actualizar UI inmediatamente
      queryClient.setQueryData(['favorito', loteId], (old: any) => ({
        es_favorito: !old?.es_favorito
      }));

      return { previousStatus };
    },
    onSuccess: (response) => {
      const fueAgregado = response.data.agregado;
      
      // Confirmar estado real desde el backend
      queryClient.setQueryData(['favorito', loteId], { es_favorito: fueAgregado });
      
      // Invalidar listas que dependen de esto (ej: "Mis Favoritos" en dashboard)
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] }); 
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] }); // Refrescar estadísticas si es admin

      // Feedback
      if (fueAgregado) {
          showSuccess('Añadido a tus favoritos');
      } else {
          showInfo('Eliminado de tus favoritos');
      }
    },
    onError: (err, newTodo, context: any) => {
      // Revertir si falla
      queryClient.setQueryData(['favorito', loteId], context.previousStatus);
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

    // A) Si ya es favorito y el padre maneja la eliminación (ej: Vista de Lista de Favoritos)
    if (isFavorite && onRemoveRequest) {
      onRemoveRequest(loteId);
      return;
    }

    // B) Si queremos AGREGARLO, validamos reglas de negocio (Lotes Exclusivos)
    if (!isFavorite && lote && lote.id_proyecto) {
        const tieneSuscripcion = suscripciones?.some(
            s => s.id_proyecto === lote.id_proyecto && s.activo
        );
        
        const validacion = FavoritoService.puedeAgregarFavorito(lote, !!tieneSuscripcion);
        
        if (!validacion.puede) {
            // Mostramos por qué no puede (ej: "Requiere suscripción")
            showInfo(`🔒 ${validacion.razon}`);
            return;
        }
    }

    // C) Ejecutar toggle
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
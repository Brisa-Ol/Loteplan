// src/shared/components/ui/buttons/FavoritoButton.tsx

import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { IconButton, Tooltip, Zoom,alpha } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

// Servicios y Contexto
import FavoritoService from '@/core/api/services/favorito.service';
import LoteService from '@/core/api/services/lote.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context/AuthContext';
import type { CheckFavoritoResponseDto } from '@/core/types/favorito.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { env } from '@/core/config/env'; // 👈 1. Importación de env

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

  // 1. ESTADO ACTUAL (Check de favorito)
  const { data: status } = useQuery<CheckFavoritoResponseDto>({
    queryKey: QUERY_KEY,
    queryFn: async () => (await FavoritoService.checkEsFavorito(loteId)).data,
    enabled: isAuthenticated,
    // 👈 2. Usamos el estándar global para estados de UI rápidos
    staleTime: env.queryStaleTime || 300000, 
  });

  const isFavorite = status?.es_favorito ?? false;

  // 2. DATOS AUXILIARES (Para validación de negocio al intentar agregar)
  const { data: lote } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: async () => (await LoteService.getByIdActive(loteId)).data,
    enabled: isAuthenticated && !isFavorite,
    // 👈 3. Datos de lote son más estáticos: duplicamos el staleTime
    staleTime: (env.queryStaleTime || 300000) * 2 
  });

  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    enabled: isAuthenticated && !isFavorite && !!lote?.id_proyecto,
    // 👈 4. Las suscripciones pueden cambiar: usamos la mitad del tiempo estándar
    staleTime: (env.queryStaleTime || 300000) / 2
  });

  // 3. MUTACIÓN OPTIMISTA
  // Se encarga de cambiar el icono al instante sin esperar al servidor
  
  const mutation = useMutation({
    mutationFn: () => FavoritoService.toggle(loteId),
    onMutate: async () => {
      // Cancelamos cualquier refetch en curso para no sobrescribir nuestro cambio optimista
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Guardamos el estado anterior para el rollback en caso de error
      const previousStatus = queryClient.getQueryData<CheckFavoritoResponseDto>(QUERY_KEY);

      // Actualizamos el cache instantáneamente
      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, { es_favorito: !isFavorite });

      return { previousStatus };
    },
    onSuccess: (response) => {
      const serverState = response.data.agregado;
      // Sincronizamos con la realidad del servidor
      queryClient.setQueryData<CheckFavoritoResponseDto>(QUERY_KEY, { es_favorito: serverState });
      
      // Invalidamos listas globales de favoritos para que se refresquen en segundo plano
      queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });

      if (serverState) showSuccess('Guardado en tu lista de seguimiento');
      else showInfo('Dejaste de seguir este lote');
    },
    onError: (_err, _variables, context) => {
      // Si falla la API, volvemos al estado anterior (Rollback)
      if (context?.previousStatus) {
        queryClient.setQueryData(QUERY_KEY, context.previousStatus);
      }
      showError('No se pudo actualizar favoritos');
    }
  });

  // 4. CONTROLADOR DE CLIC CON VALIDACIÓN DE NEGOCIO
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      showInfo('Inicia sesión para guardar favoritos');
      return;
    }

    // Validar si el usuario cumple los requisitos para seguir este lote específico
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
            bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? alpha(theme.palette.common.white, 0.05) 
                : alpha(theme.palette.error.main, 0.04)
          },
          '&:active': { transform: 'scale(0.9)' }
        }}
      >
        {isFavorite ? <Favorite fontSize="inherit" /> : <FavoriteBorder fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};
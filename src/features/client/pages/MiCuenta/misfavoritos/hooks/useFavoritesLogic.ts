import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FavoritoService from '@/core/api/services/favorito.service';
import { ROUTES } from '@/routes';
import { useConfirmDialog, useSnackbar } from '@/shared';
import type { LoteDto } from '@/core/types/lote.dto';

export const useFavoritesLogic = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const confirmDialog = useConfirmDialog();
    const { showSuccess } = useSnackbar();

    // 1. Cargar favoritos con manejo de diferentes estructuras de respuesta
    const { data: favoritos = [], isLoading, error } = useQuery<LoteDto[]>({
        queryKey: ['misFavoritos'],
        queryFn: async () => {
            const res = await FavoritoService.getMisFavoritos();
            const responseData = res.data as any;
            if (Array.isArray(responseData)) return responseData;
            if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
            if (responseData?.favorites && Array.isArray(responseData.favorites)) return responseData.favorites;
            return [];
        },
        staleTime: 120_000,
    });

    // 2. Mutación para eliminar
    const removeMutation = useMutation({
        mutationFn: (idLote: number) => FavoritoService.toggle(idLote),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misFavoritos'] });
            confirmDialog.close();
            showSuccess('Lote eliminado de tus favoritos');
        },
        onError: () => confirmDialog.close(),
    });

    const handleConfirmDelete = useCallback(() => {
        if (confirmDialog.data != null) {
            removeMutation.mutate(confirmDialog.data as number);
        }
    }, [confirmDialog.data, removeMutation]);

    const handleVerDetalle = useCallback((id: number) => {
        navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id)));
    }, [navigate]);

    const handleExplorar = useCallback(() => {
        navigate(ROUTES.PROYECTOS.SELECCION_ROL);
    }, [navigate]);

    return {
        favoritos,
        isLoading,
        error,
        confirmDialog,
        isRemoving: removeMutation.isPending,
        handleConfirmDelete,
        handleVerDetalle,
        handleExplorar
    };
};
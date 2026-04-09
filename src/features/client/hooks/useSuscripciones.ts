// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import type { ApiError } from '@/core/api/httpService';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context'; // ✅ Importamos el hook de auth
import type { SuscripcionCanceladaDto, SuscripcionDto } from '@/core/types/suscripcion.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const useSuscripciones = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    // ✅ Obtenemos el estado de autenticación
    const { isAuthenticated } = useAuth();

    // 1. Carga de Datos (Combina Activas y Canceladas)
    const { data, isLoading, error } = useQuery({
        queryKey: ['misSuscripcionesFull'],
        queryFn: async () => {
            const [resActivas, resCanceladas] = await Promise.all([
                SuscripcionService.getMisSuscripciones(),
                SuscripcionService.getMisCanceladas()
            ]);

            return {
                activas: (resActivas.data as any).data || resActivas.data || [],
                canceladas: (resCanceladas.data as any).data || resCanceladas.data || []
            };
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const suscripciones = (data?.activas as SuscripcionDto[]) || [];
    const canceladas = (data?.canceladas as SuscripcionCanceladaDto[]) || [];

    // 2. Stats Calculados
    const stats = useMemo(() => {
        const totalActivasMonto = suscripciones.reduce(
            (acc, s) => acc + Number(s.monto_total_pagado || 0),
            0
        );

        const totalCanceladasMonto = canceladas.reduce(
            (acc, c) => acc + Number(c.monto_pagado_total || 0),
            0
        );

        return {
            activas: suscripciones.length,
            canceladas: canceladas.length,
            totalPagado: totalActivasMonto + totalCanceladasMonto
        };
    }, [suscripciones, canceladas]);

    // 3. Mutación Cancelar (No necesita enabled porque solo se dispara por acción del usuario)
    const cancelMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await SuscripcionService.cancelarMiSuscripcion(id);
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            showSuccess('Plan de ahorro detenido correctamente.');
            setHighlightedId(id);
            setTimeout(() => setHighlightedId(null), 2500);
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al cancelar el plan de ahorro.');
        }
    });

    return {
        suscripciones,
        canceladas,
        stats,
        isLoading: isAuthenticated ? isLoading : false,
        error,
        cancelarSuscripcion: cancelMutation.mutateAsync,
        isCancelling: cancelMutation.isPending,
        highlightedId
    };
};
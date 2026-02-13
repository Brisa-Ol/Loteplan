// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import type { ApiError } from '@/core/api/httpService'; 
import SuscripcionService from '@/core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto, SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const useSuscripciones = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

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
        staleTime: 1000 * 60 * 5,
    });

    const suscripciones = (data?.activas as SuscripcionDto[]) || [];
    const canceladas = (data?.canceladas as SuscripcionCanceladaDto[]) || [];

    // 2. Stats Calculados (Sincronizados con el historial real)
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

    // 3. Mutación Cancelar
    const cancelMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await SuscripcionService.cancelar(id);
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            showSuccess('Plan de ahorro detenido correctamente.');
            setHighlightedId(id);
            setTimeout(() => setHighlightedId(null), 2500);
        },
        // ✅ CORREGIDO: Usamos directamente apiError.message
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al cancelar el plan de ahorro.');
        }
    });

    return {
        suscripciones,
        canceladas,
        stats,
        isLoading,
        error,
        cancelarSuscripcion: cancelMutation.mutateAsync,
        isCancelling: cancelMutation.isPending,
        highlightedId
    };
};
// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { SuscripcionDto, SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';

export const useSuscripciones = () => {
    const queryClient = useQueryClient();
    const { showSuccess } = useSnackbar();
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
    // 1. Sumar capital de planes vigentes
    const totalActivasMonto = suscripciones.reduce(
        (acc, s) => acc + Number(s.monto_total_pagado || 0), 
        0
    );

    // 2. Sumar capital de planes cancelados (del historial)
    const totalCanceladasMonto = canceladas.reduce(
        (acc, c) => acc + Number(c.monto_pagado_total || 0), 
        0
    );

    return {
        activas: suscripciones.length,
        canceladas: canceladas.length,
        // ✅ Este es el valor que consumen las Cards
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
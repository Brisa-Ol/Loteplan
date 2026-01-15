// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import useSnackbar from '@/shared/hooks/useSnackbar';


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
                activas: resActivas.data,
                canceladas: resCanceladas.data
            };
        }
    });

    const suscripciones = data?.activas || [];
    const canceladas = data?.canceladas || [];

    // 2. Stats Calculados
    const stats = useMemo(() => ({
        activas: suscripciones.length,
        canceladas: canceladas.length,
        totalPagado: suscripciones.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0)
    }), [suscripciones, canceladas]);

    // 3. Mutación Cancelar
    const cancelMutation = useMutation({
        mutationFn: async (id: number) => await SuscripcionService.cancelar(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            showSuccess('Suscripción cancelada correctamente.');
            
            // Efecto visual de feedback
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
        cancelarSuscripcion: cancelMutation.mutateAsync, // Exponemos mutateAsync por si el dialog lo necesita
        isCancelling: cancelMutation.isPending,
        highlightedId
    };
};
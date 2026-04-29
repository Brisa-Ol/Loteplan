// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import type { ApiError } from '@/core/api/httpService';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { cancelarAdhesion, getAllAdhesionsByUser } from '@/core/api/services/adhesion.service'; // ✅ Importados
import { useAuth } from '@/core/context';
import type { SuscripcionCanceladaDto, SuscripcionDto } from '@/core/types/suscripcion.dto';
import type { AdhesionDto } from '@/core/types/adhesion.dto'; // ✅ Importado
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const useSuscripciones = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const { isAuthenticated } = useAuth();

    // 1. Carga de Datos (Combina Activas, Canceladas y Adhesiones)
    const { data, isLoading, error } = useQuery({
        queryKey: ['misSuscripcionesFull'],
        queryFn: async () => {
            const [resActivas, resCanceladas, resAdhesiones] = await Promise.all([
                SuscripcionService.getMisSuscripciones(),
                SuscripcionService.getMisCanceladas(),
                getAllAdhesionsByUser() // ✅ Fetch de adhesiones
            ]);

            return {
                activas: (resActivas.data as any).data || resActivas.data || [],
                canceladas: (resCanceladas.data as any).data || resCanceladas.data || [],
                adhesiones: resAdhesiones.data.data || [] // ✅ Guardamos adhesiones
            };
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const suscripciones = (data?.activas as SuscripcionDto[]) || [];
    const canceladas = (data?.canceladas as SuscripcionCanceladaDto[]) || [];
    const adhesiones = (data?.adhesiones as AdhesionDto[]) || []; // ✅ Extraemos adhesiones

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

    // 3. Mutación Cancelar Suscripción
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

    // ✅ 4. Mutación Cancelar Adhesión
    const cancelAdhesionMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await cancelarAdhesion(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            showSuccess('Adhesión cancelada correctamente.');
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al cancelar la adhesión.');
        }
    });

    return {
        suscripciones,
        canceladas,
        adhesiones, // ✅ Expuesto
        stats,
        isLoading: isAuthenticated ? isLoading : false,
        error,
        cancelarSuscripcion: cancelMutation.mutateAsync,
        isCancelling: cancelMutation.isPending,
        cancelarAdhesionObj: cancelAdhesionMutation.mutateAsync, // ✅ Expuesto
        isCancellingAdhesion: cancelAdhesionMutation.isPending, // ✅ Expuesto
        highlightedId
    };
};
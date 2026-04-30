// src/pages/User/Suscripciones/hooks/useSuscripciones.ts
import type { ApiError } from '@/core/api/httpService';
// ✅ Importamos las nuevas funciones del servicio
import { iniciarCancelacionAdhesion, confirmarCancelacionAdhesion, getAllAdhesionsByUser } from '@/core/api/services/adhesion.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { useAuth } from '@/core/context';
import type { AdhesionDto } from '@/core/types/adhesion.dto';
import type { SuscripcionCanceladaDto, SuscripcionDto } from '@/core/types/suscripcion.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const useSuscripciones = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useSnackbar();
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const { isAuthenticated } = useAuth();

    // 1. Carga de Datos
    const { data, isLoading, error } = useQuery({
        queryKey: ['misSuscripcionesFull'],
        queryFn: async () => {
            const [resActivas, resCanceladas, resAdhesiones] = await Promise.all([
                SuscripcionService.getMisSuscripciones(),
                SuscripcionService.getMisCanceladas(),
                getAllAdhesionsByUser()
            ]);

            return {
                activas: (resActivas.data as any).data || resActivas.data || [],
                canceladas: (resCanceladas.data as any).data || resCanceladas.data || [],
                adhesiones: resAdhesiones.data.data || []
            };
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const suscripciones = (data?.activas as SuscripcionDto[]) || [];
    const canceladas = (data?.canceladas as SuscripcionCanceladaDto[]) || [];
    const adhesiones = (data?.adhesiones as AdhesionDto[]) || [];

    // 2. Stats Calculados
    const stats = useMemo(() => {
        const totalActivasMonto = suscripciones.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0);
        const totalCanceladasMonto = canceladas.reduce((acc, c) => acc + Number(c.monto_pagado_total || 0), 0);

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
            // ✅ Forzamos a que se recargue la lista de proyectos y se actualice el cupo
            queryClient.invalidateQueries({ queryKey: ['proyectos'] }); 
            
            showSuccess('Plan de ahorro detenido correctamente.');
            setHighlightedId(id);
            setTimeout(() => setHighlightedId(null), 2500);
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al cancelar el plan de ahorro.');
        }
    });

    const iniciarCancelSuscripcionMutation = useMutation({
        mutationFn: async (payload: { id: number, motivo: string }) => {
            const response = await SuscripcionService.startCancelationSuscription(payload.id, payload.motivo);
            return response;
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al procesar la solicitud de baja.');
        }
    });

    const confirmarCancelSuscripcionMutation = useMutation({
        mutationFn: async (payload: { suscripcionId: number; codigo_2fa: string, motivo?: string }) => {
            const response = await SuscripcionService.confirmCancelationSuscription(payload);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            // ✅ Forzamos a que se recargue la lista de proyectos aquí también
            queryClient.invalidateQueries({ queryKey: ['proyectos'] }); 

            showSuccess('Suscripcion cancelada de forma segura.');
        }
    })

    // ✅ 4. Mutación INICIAR Cancelación Adhesión (Paso 1)
    const iniciarCancelAdhesionMutation = useMutation({
        mutationFn: (id: number) => iniciarCancelacionAdhesion(id),
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            showError(apiError.message || 'Error al procesar la solicitud de baja.');
        }
    });

    // ✅ 5. Mutación CONFIRMAR Cancelación Adhesión (Paso 2)
const confirmarCancelAdhesionMutation = useMutation({
        mutationFn: (payload: { adhesionId: number, codigo_2fa: string }) => confirmarCancelacionAdhesion(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misSuscripcionesFull'] });
            // ✅ Forzamos a que se recargue la lista de proyectos aquí también
            queryClient.invalidateQueries({ queryKey: ['proyectos'] }); 

            showSuccess('Adhesión cancelada de forma segura.');
        }
    });

    return {
        suscripciones,
        canceladas,
        adhesiones,
        stats,
        isLoading: isAuthenticated ? isLoading : false,
        error,
        cancelarSuscripcion: cancelMutation.mutate,
        isCancelling: cancelMutation.isPending,

        iniciarCancelSuscripcion: iniciarCancelSuscripcionMutation.mutate,
        isInitiatingCancelSuscription: iniciarCancelSuscripcionMutation.isPending,
        confirmarCancelSuscripcion: confirmarCancelSuscripcionMutation.mutate,
        isConfirmingCancelSuscripcion: confirmarCancelSuscripcionMutation.isPending,

        // ✅ Exportamos el nuevo flujo de 2 pasos
        iniciarCancelAdhesion: iniciarCancelAdhesionMutation.mutate,
        isInitiatingCancel: iniciarCancelAdhesionMutation.isPending,
        confirmarCancelAdhesion: confirmarCancelAdhesionMutation.mutate,
        isConfirmingCancel: confirmarCancelAdhesionMutation.isPending,
        
        highlightedId
    };
};
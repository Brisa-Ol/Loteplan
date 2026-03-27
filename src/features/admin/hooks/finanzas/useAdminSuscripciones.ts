// src/features/admin/pages/Suscripciones/hooks/finanzas/useAdminSuscripciones.ts

import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import ProyectoService from '@/core/api/services/proyecto.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import { env } from '@/core/config/env';
import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { useSortedData } from '../useSortedData';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export const useAdminSuscripciones = () => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const { showSuccess, showError } = useSnackbar();

    // --- MODALES ---
    const detailModal = useModal();
    const confirmDialog = useConfirmDialog();

    const modales = useMemo(() => ({
        detail: detailModal,
        confirm: confirmDialog
    }), [detailModal, confirmDialog]);

    // --- ESTADOS UI ---
    const [tabIndex, setTabIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProject, setFilterProject] = useState<string>('all');

    // Selección
    const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

    // --- QUERIES CON CACHE OPTIMIZADO ---

    // 1. Solo traemos las ACTIVAS (Las inactivas se manejan en la pestaña de bajas)
    const { data: suscripcionesRaw = [], isLoading: l1, error } = useQuery({
        queryKey: ['adminSuscripcionesActivas'],
        queryFn: async () => (await SuscripcionService.findAllActivas()).data,
        staleTime: env.queryStaleTime || 30000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const { sortedData: suscripcionesOrdenadas, highlightedId, triggerHighlight } = useSortedData(suscripcionesRaw);

    // Selectores auxiliares (Proyectos)
    const { data: proyectos = [] } = useQuery({
        queryKey: ['adminProyectosSelect'],
        queryFn: async () => (await ProyectoService.getAllAdmin()).data,
        staleTime: 60000,
        gcTime: 10 * 60 * 1000,
    });

    // Métricas
    const { data: morosidadStats, isLoading: l2 } = useQuery({
        queryKey: ['metricsMorosidad'],
        queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data,
        staleTime: env.queryStaleTime || 30000,
    });

    const { data: cancelacionStats, isLoading: l3 } = useQuery({
        queryKey: ['metricsCancelacionMetrics'],
        queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
        staleTime: env.queryStaleTime || 30000,
    });

    const isLoading = l1 || l2 || l3;

    // --- FILTRADO OPTIMIZADO ---
    const filteredSuscripciones = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return suscripcionesOrdenadas.filter(suscripcion => {
            // 1. Filtro de Texto
            const matchesSearch = !term || (
                suscripcion.usuario?.nombre.toLowerCase().includes(term) ||
                suscripcion.usuario?.apellido.toLowerCase().includes(term) ||
                suscripcion.usuario?.email.toLowerCase().includes(term) ||
                suscripcion.proyectoAsociado?.nombre_proyecto.toLowerCase().includes(term) ||
                suscripcion.id.toString().includes(term)
            );

            // 2. Filtro de Proyecto
            const matchesProject = filterProject === 'all' || suscripcion.id_proyecto === Number(filterProject);

            return matchesSearch && matchesProject;
        });
    }, [suscripcionesOrdenadas, searchTerm, filterProject]);

    // Cálculos Stats
    const stats = useMemo(() => {
        const totalSuscripciones = Number(cancelacionStats?.total_suscripciones || 0);
        const totalCanceladas = Number(cancelacionStats?.total_canceladas || 0);
        return {
            totalSuscripciones,
            totalCanceladas,
            totalActivas: Math.max(0, totalSuscripciones - totalCanceladas),
            tasaCancelacion: Number(cancelacionStats?.tasa_cancelacion || 0),
            tasaMorosidad: Number(morosidadStats?.tasa_morosidad || 0),
            totalEnRiesgo: Number(morosidadStats?.total_en_riesgo || 0),
            totalGenerado: Number(morosidadStats?.total_pagos_generados || 0)
        };
    }, [cancelacionStats, morosidadStats]);

    // --- MUTACIONES ---
    const cancelarMutation = useMutation({
        mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['adminSuscripcionesActivas'] });
            queryClient.invalidateQueries({ queryKey: ['metricsCancelacionMetrics'] });
            queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });
            // Invalida también las canceladas para que la otra pestaña se actualice
            queryClient.invalidateQueries({ queryKey: ['adminCancelaciones'] });

            modales.confirm.close();
            triggerHighlight(id);
            showSuccess('Suscripción cancelada correctamente.');
        },
        onError: (err: any) => {
            modales.confirm.close();
            const msg = err.response?.data?.error || 'Error al cancelar la suscripción.';
            showError(msg);
        }
    });

    // --- HANDLERS ---
    const handleCancelarClick = useCallback((suscripcion: SuscripcionDto) => {
        if (!suscripcion.activo) return;
        modales.confirm.confirm('admin_cancel_subscription', suscripcion);
    }, [modales.confirm]);

    const handleConfirmAction = useCallback(() => {
        if (modales.confirm.action === 'admin_cancel_subscription' && modales.confirm.data) {
            cancelarMutation.mutate(modales.confirm.data.id);
        }
    }, [modales.confirm, cancelarMutation]);

    const handleVerDetalle = useCallback((s: SuscripcionDto) => {
        setSelectedSuscripcion(s);
        modales.detail.open();
    }, [modales.detail]);

    const handleCerrarModal = useCallback(() => {
        modales.detail.close();
        setTimeout(() => setSelectedSuscripcion(null), 300);
    }, [modales.detail]);

    return {
        theme,
        // State
        tabIndex,
        setTabIndex,
        searchTerm, setSearchTerm,
        filterProject, setFilterProject,
        selectedSuscripcion,

        // UX Props
        highlightedId,

        // Data & Stats
        stats,
        proyectos,
        filteredSuscripciones,

        // Loading
        isLoading,
        isLoadingStats: l2 || l3,
        isCancelling: cancelarMutation.isPending,
        error,

        // Modales
        modales,

        // Handlers
        handleCancelarClick,
        handleConfirmAction,
        handleVerDetalle,
        handleCerrarModal
    };
};
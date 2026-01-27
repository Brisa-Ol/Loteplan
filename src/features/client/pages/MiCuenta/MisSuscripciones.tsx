// src/components/domain/suscripciones/MisSuscripciones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { Box, Tabs, Tab, Paper, useTheme } from '@mui/material';
import { CheckCircle, History as HistoryIcon, MonetizationOn, EventBusy, PlayCircleFilled } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';
import { env } from '@/core/config/env';

// Componentes Shared
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
// ✅ USO DE PAGE HEADER (Consistencia con MisInversiones)
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useSuscripciones } from '../../hooks/useSuscripciones';
import { getActiveColumns, getCanceledColumns } from '../config/suscripcionColumns';

const MisSuscripciones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const confirmDialog = useConfirmDialog();

    // 1. Hook Principal
    const { 
        suscripciones, canceladas, stats, isLoading, error, 
        cancelarSuscripcion, isCancelling, highlightedId 
    } = useSuscripciones();

    // 2. UI State
    const [tabValue, setTabValue] = useState(0);

    // 3. Handlers
    const handleOpenCancelDialog = useCallback((suscripcion: SuscripcionDto) => {
        confirmDialog.confirm('cancel_subscription', suscripcion);
    }, [confirmDialog]);

    const handleConfirmCancel = async () => {
        if (confirmDialog.data) {
            await cancelarSuscripcion(confirmDialog.data.id);
            confirmDialog.close();
        }
    };

    // 4. Columnas
    const activeCols = useMemo(() => getActiveColumns(theme, {
        onView: (projectId) => navigate(`/proyectos/${projectId}`),
        onCancel: handleOpenCancelDialog
    }), [theme, navigate, handleOpenCancelDialog]);

    const canceledCols = useMemo(() => getCanceledColumns(theme), [theme]);

    const formatMoney = (val: number) => 
        new Intl.NumberFormat(env.defaultLocale, { style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 }).format(val);

    return (
        <PageContainer maxWidth="lg">
            
            {/* ✅ HEADER ESTANDARIZADO */}
            <PageHeader 
                title="Mis Planes de Ahorro" 
                subtitle="Sigue el progreso de tus metas y mantén tus cuotas al día."
                // No pasamos 'action' porque aquí no hay botón de refrescar explícito por ahora,
                // pero si quisieras agregarlo, iría aquí igual que en Inversiones.
            />

            {/* KPI SUMMARY (Terminología de Ahorro) */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2} mb={4}>
                <StatCard 
                    title="Planes Activos" 
                    value={stats.activas.toString()} 
                    icon={<PlayCircleFilled />} 
                    color="success" 
                    loading={isLoading} 
                    subtitle="Ahorros en curso" 
                />
                <StatCard 
                    title="Capital Ahorrado" 
                    value={formatMoney(stats.totalPagado)} 
                    icon={<MonetizationOn />} 
                    color="primary" 
                    loading={isLoading} 
                    subtitle="Total acumulado" 
                />
                <StatCard 
                    title="Bajas Históricas" 
                    value={stats.canceladas.toString()} 
                    icon={<EventBusy />} 
                    color="error" 
                    loading={isLoading} 
                    subtitle="Planes descontinuados" 
                />
            </Box>

            {/* TABS & TABLE */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
                    <Tab label="Planes Activos" icon={<CheckCircle />} iconPosition="start" />
                    <Tab label="Historial de Bajas" icon={<HistoryIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    boxShadow: theme.shadows[1] 
                }}>
                    {tabValue === 0 ? (
                        <DataTable
                            columns={activeCols}
                            data={suscripciones}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={5}
                            emptyMessage="No tienes planes de ahorro activos."
                            highlightedRowId={highlightedId}
                        />
                    ) : (
                        <DataTable
                            columns={canceledCols}
                            data={canceladas}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={5}
                            emptyMessage="No tienes historial de cancelaciones."
                            isRowActive={() => false}
                        />
                    )}
                </Paper>
            </QueryHandler>

            {/* DIALOGS */}
            <ConfirmDialog 
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                title="¿Detener plan de ahorro?"
                description="Esta acción pausará tus aportes futuros. Podrás reactivarlo si hay cupo disponible, pero podrías perder beneficios de constancia."
            />
        </PageContainer>
    );
};

export default MisSuscripciones;
// src/components/domain/suscripciones/MisSuscripciones.optimized.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { Box, Tabs, Tab, Paper, useTheme } from '@mui/material';
import { 
    CheckCircle, 
    History as HistoryIcon, 
    MonetizationOn, 
    EventBusy, 
    PlayCircleFilled,
    Token as TokenIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';


// Componentes
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// Hooks y tipos
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useSuscripciones } from '../../hooks/useSuscripciones';
import { getActiveColumns, getCanceledColumns } from '../config/suscripcionColumns';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisSuscripciones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const confirmDialog = useConfirmDialog();
    const formatCurrency = useCurrencyFormatter(); // ✅ OPTIMIZACIÓN: Hook de formateo

    // ✅ OPTIMIZACIÓN 1: Hook principal con lógica centralizada
    const { 
        suscripciones, 
        canceladas, 
        stats, 
        isLoading, 
        error, 
        cancelarSuscripcion, 
        isCancelling, 
        highlightedId 
    } = useSuscripciones();

    // ✅ OPTIMIZACIÓN 2: Estado local mínimo
    const [tabValue, setTabValue] = useState(0);

    // ✅ OPTIMIZACIÓN 3: Memoizar cálculo de tokens
    const totalTokens = useMemo(() => 
        suscripciones.reduce((acc, curr) => acc + (curr.tokens_disponibles || 0), 0),
        [suscripciones]
    );

    // ✅ OPTIMIZACIÓN 4: Handlers estables con useCallback
    const handleOpenCancelDialog = useCallback((suscripcion: SuscripcionDto) => {
        confirmDialog.confirm('cancel_subscription', suscripcion);
    }, [confirmDialog]);

    const handleConfirmCancel = useCallback(async () => {
        if (confirmDialog.data) {
            await cancelarSuscripcion(confirmDialog.data.id);
            confirmDialog.close();
        }
    }, [confirmDialog.data, cancelarSuscripcion, confirmDialog]);

    const handleNavigateToProject = useCallback((projectId: number) => {
        navigate(`/proyectos/${projectId}`);
    }, [navigate]);

    // ✅ OPTIMIZACIÓN 5: Memoizar columnas
    const activeCols = useMemo(() => 
        getActiveColumns(theme, {
            onView: handleNavigateToProject,
            onCancel: handleOpenCancelDialog
        }), 
        [theme, handleNavigateToProject, handleOpenCancelDialog]
    );

    const canceledCols = useMemo(() => 
        getCanceledColumns(theme), 
        [theme]
    );

    return (
        <PageContainer maxWidth="lg">
            
            <PageHeader 
                title="Mis Planes de Ahorro" 
                subtitle="Seguimiento de tus suscripciones y capital acumulado."
            />

            {/* KPI SUMMARY */}
            <Box 
                display="grid" 
                gridTemplateColumns={{ 
                    xs: '1fr', 
                    sm: 'repeat(2, 1fr)', 
                    md: 'repeat(4, 1fr)' 
                }} 
                gap={2} 
                mb={4}
            >
                <StatCard 
                    title="Planes Activos" 
                    value={stats.activas.toString()} 
                    icon={<PlayCircleFilled />} 
                    color="success" 
                    loading={isLoading} 
                    subtitle="Ahorros en curso" 
                />

                <StatCard 
                    title="Poder de Oferta" 
                    value={`${totalTokens} Tokens`} 
                    icon={<TokenIcon />} 
                    color="warning" 
                    loading={isLoading} 
                    subtitle="Disponibles para pujar" 
                />

                <StatCard 
                    title="Capital Ahorrado" 
                    value={formatCurrency(stats.totalPagado)}
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
                    subtitle="Planes finalizados" 
                />
            </Box>

            {/* TABS */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(_, v) => setTabValue(v)} 
                    textColor="primary" 
                    indicatorColor="primary"
                >
                    <Tab 
                        label="Planes Activos" 
                        icon={<CheckCircle />} 
                        iconPosition="start" 
                    />
                    <Tab 
                        label="Historial de Bajas" 
                        icon={<HistoryIcon />} 
                        iconPosition="start" 
                    />
                </Tabs>
            </Box>

            {/* TABLE */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper 
                    elevation={0} 
                    sx={{ 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 3, 
                        overflow: 'hidden', 
                        boxShadow: theme.shadows[1] 
                    }}
                >
                    {tabValue === 0 ? (
                        <DataTable
                            columns={activeCols}
                            data={suscripciones}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No tienes planes de ahorro activos."
                            highlightedRowId={highlightedId}
                        />
                    ) : (
                        <DataTable
                            columns={canceledCols}
                            data={canceladas}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No tienes historial de cancelaciones."
                            isRowActive={() => false}
                        />
                    )}
                </Paper>
            </QueryHandler>

            {/* CONFIRM DIALOG */}
            <ConfirmDialog 
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                title="¿Detener plan de ahorro?"
                description="Esta acción pausará tus aportes futuros. Podrás reactivarlo si hay cupo disponible."
            />
        </PageContainer>
    );
};

export default MisSuscripciones;
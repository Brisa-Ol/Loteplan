// src/pages/User/ResumenesCuenta/MisResumenes.optimized.tsx

import React, { useMemo } from 'react';
import { Box, Paper, alpha, useTheme } from '@mui/material';
import { Business, Percent, Warning, MonetizationOn } from '@mui/icons-material';

// Components
import { DetalleCuotaModal } from './components/DetalleCuotaModal';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { useResumenesCuenta } from '../../hooks/useResumenesCuenta';
import { getResumenColumns } from '../config/resumenColumns';

const MisResumenes: React.FC = () => {
    const theme = useTheme();

    // ✅ OPTIMIZACIÓN 1: Hook con toda la lógica centralizada
    const { 
        resumenes, 
        isLoading, 
        error, 
        stats,
        selectedResumen, 
        openModal, 
        closeModal, 
        isModalOpen
    } = useResumenesCuenta();

    // ✅ OPTIMIZACIÓN 2: Memoizar configuración de columnas
    const columns = useMemo(() => 
        getResumenColumns(theme, {
            onViewDetail: openModal
        }), 
        [theme, openModal]
    );

    // ✅ OPTIMIZACIÓN 3: Memoizar función de estilo de fila
    const getRowSx = useMemo(() => (row: any) => ({
        bgcolor: row.cuotas_vencidas > 0 
            ? alpha(theme.palette.error.main, 0.05) 
            : 'inherit',
        transition: 'background-color 0.2s',
        '&:hover': {
            bgcolor: row.cuotas_vencidas > 0 
                ? alpha(theme.palette.error.main, 0.1) 
                : alpha(theme.palette.primary.main, 0.02)
        }
    }), [theme]);

    // ✅ OPTIMIZACIÓN 4: Memoizar función isRowActive
    const isRowActive = useMemo(() => (row: any) => row.porcentaje_pagado < 100, []);

    return (
        <PageContainer maxWidth="lg">
            
            <PageHeader
                title="Resumen de Cuenta"
                subtitle="Analiza el estado de tus planes y tu progreso financiero."
            />

            {/* KPI SECTION - Grid Responsivo */}
            <Box 
                mb={4} 
                display="grid" 
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} 
                gap={3}
            >
                <StatCard
                    title="Total Planes" 
                    value={stats.totalPlanes.toString()}
                    icon={<Business />} 
                    color="primary" 
                    loading={isLoading} 
                    subtitle="Planes Activos"
                />
                <StatCard
                    title="Avance Promedio" 
                    value={`${stats.promedioAvance.toFixed(0)}%`}
                    icon={<Percent />} 
                    color="info" 
                    loading={isLoading} 
                    subtitle="Avance Global"
                />
                <StatCard
                    title={stats.cuotasVencidasTotal > 0 ? "Cuotas Vencidas" : "Estado Deuda"}
                    value={stats.cuotasVencidasTotal.toString()}
                    icon={stats.cuotasVencidasTotal > 0 ? <Warning /> : <MonetizationOn />}
                    color={stats.cuotasVencidasTotal > 0 ? "error" : "success"}
                    loading={isLoading}
                    subtitle={stats.cuotasVencidasTotal > 0 ? "Requiere atención" : "Todo al día"}
                />
            </Box>

            {/* TABLE SECTION */}
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
                    <DataTable
                        columns={columns}
                        data={resumenes}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        emptyMessage="No tienes planes activos actualmente."
                        isRowActive={isRowActive}
                        getRowSx={getRowSx}
                    />
                </Paper>
            </QueryHandler>

            {/* MODAL */}
            <DetalleCuotaModal
                open={isModalOpen}
                onClose={closeModal}
                resumen={selectedResumen}
            />
        </PageContainer>
    );
};

export default MisResumenes;
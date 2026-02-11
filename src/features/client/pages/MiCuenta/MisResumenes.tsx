// src/pages/User/ResumenesCuenta/MisResumenes.optimized.tsx

import React, { useMemo } from 'react';
import { Box, Paper, alpha, useTheme, Typography, Stack, LinearProgress, IconButton, Tooltip, Chip } from '@mui/material';
import { Business, Percent, Warning, MonetizationOn, Visibility, CheckCircle } from '@mui/icons-material';

// Components
import { DetalleCuotaModal } from './components/DetalleCuotaModal';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

// Hooks y DTOs
import { useResumenesCuenta } from '../../hooks/useResumenesCuenta';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

const MisResumenes: React.FC = () => {
    const theme = useTheme();
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

    // ✅ DEFINICIÓN DE COLUMNAS INTEGRADA (Resuelve el error de importación)
    const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Plan',
            minWidth: 200,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {row.nombre_proyecto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ID Suscripción: #{row.id_suscripcion}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'progreso',
            label: 'Avance del Plan',
            minWidth: 180,
            render: (row) => {
                const isComplete = row.porcentaje_pagado >= 100;
                return (
                    <Box sx={{ width: '100%', mr: 1 }}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight={700} color={isComplete ? 'success.main' : 'text.primary'}>
                                {row.cuotas_pagadas} / {row.meses_proyecto} Cuotas
                            </Typography>
                            <Typography variant="caption" fontWeight={800}>
                                {row.porcentaje_pagado.toFixed(1)}%
                            </Typography>
                        </Stack>
                        <LinearProgress 
                            variant="determinate" 
                            value={Math.min(row.porcentaje_pagado, 100)} 
                            color={isComplete ? "success" : "primary"}
                            sx={{ height: 6, borderRadius: 3 }}
                        />
                    </Box>
                );
            }
        },
        {
            id: 'estado',
            label: 'Estado de Deuda',
            align: 'center',
            render: (row) => (
                row.cuotas_vencidas > 0 ? (
                    <Chip 
                        icon={<Warning sx={{ fontSize: '14px !important' }} />}
                        label={`${row.cuotas_vencidas} Vencidas`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                ) : (
                    <Chip 
                        icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                        label="Al día"
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                )
            )
        },
        {
            id: 'acciones',
            label: 'Detalles',
            align: 'right',
            render: (row) => (
                <Tooltip title="Ver desglose de cuota">
                    <IconButton 
                        size="small" 
                        onClick={() => openModal(row)}
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                        <Visibility fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            )
        }
    ], [theme, openModal]);

    // ✅ Estilo dinámico de fila para morosos
    const getRowSx = (row: ResumenCuentaDto) => ({
        bgcolor: row.cuotas_vencidas > 0 ? alpha(theme.palette.error.main, 0.02) : 'inherit',
        '&:hover': {
            bgcolor: row.cuotas_vencidas > 0 
                ? alpha(theme.palette.error.main, 0.05) 
                : alpha(theme.palette.primary.main, 0.02)
        }
    });

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Resumen de Cuenta"
                subtitle="Analiza el estado de tus planes y tu progreso financiero."
            />

            {/* KPI SECTION */}
            <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
                <StatCard 
                    title="Total Planes" value={stats.totalPlanes.toString()} 
                    icon={<Business />} color="primary" loading={isLoading} 
                />
                <StatCard 
                    title="Avance Promedio" value={`${stats.promedioAvance.toFixed(0)}%`} 
                    icon={<Percent />} color="info" loading={isLoading} 
                />
                <StatCard 
                    title={stats.cuotasVencidasTotal > 0 ? "Cuotas Vencidas" : "Estado Global"} 
                    value={stats.cuotasVencidasTotal.toString()} 
                    icon={stats.cuotasVencidasTotal > 0 ? <Warning /> : <MonetizationOn />} 
                    color={stats.cuotasVencidasTotal > 0 ? "error" : "success"} 
                    loading={isLoading} 
                    subtitle={stats.cuotasVencidasTotal > 0 ? "Atención requerida" : "Sin deuda pendiente"}
                />
            </Box>

            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columns}
                        data={resumenes}
                        getRowKey={(row: ResumenCuentaDto) => row.id}
                        pagination
                        getRowSx={getRowSx}
                        emptyMessage="No tienes planes activos actualmente."
                    />
                </Paper>
            </QueryHandler>

            <DetalleCuotaModal
                open={isModalOpen}
                onClose={closeModal}
                resumen={selectedResumen}
            />
        </PageContainer>
    );
};

export default MisResumenes;
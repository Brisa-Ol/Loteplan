// src/components/domain/suscripciones/MisSuscripciones.optimized.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
    Box, Tabs, Tab, Paper, useTheme, Typography, 
    Stack, Chip, alpha, IconButton, Tooltip 
} from '@mui/material';
import {
    CheckCircle,
    History as HistoryIcon,
    MonetizationOn,
    EventBusy,
    PlayCircleFilled,
    Token as TokenIcon,
    Visibility,
    Cancel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Componentes Compartidos
import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// Hooks y tipos
import type { SuscripcionDto, SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
import { useSuscripciones } from '../../hooks/useSuscripciones';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisSuscripciones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const confirmDialog = useConfirmDialog();
    const formatCurrency = useCurrencyFormatter();

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

    const [tabValue, setTabValue] = useState(0);

    // ✅ CORRECCIÓN: Cálculo de Capital Total Unificado
    // Sumamos lo activo (monto_total_pagado) + lo cancelado (monto_pagado_total)
    const capitalHistoricoTotal = useMemo(() => {
        const activo = suscripciones.reduce((acc, curr) => acc + Number(curr.monto_total_pagado || 0), 0);
        const historico = canceladas.reduce((acc, curr) => acc + Number(curr.monto_pagado_total || 0), 0);
        return activo + historico;
    }, [suscripciones, canceladas]);

    // --- CÁLCULOS ---
    const totalTokens = useMemo(() =>
        suscripciones.reduce((acc, curr) => acc + (curr.tokens_disponibles || 0), 0),
        [suscripciones]
    );

    // --- HANDLERS ---
    const handleConfirmCancel = useCallback(async () => {
        if (confirmDialog.data) {
            await cancelarSuscripcion(confirmDialog.data.id);
            confirmDialog.close();
        }
    }, [confirmDialog.data, cancelarSuscripcion, confirmDialog]);

    // --- COLUMNAS PARA SUSCRIPCIONES ACTIVAS ---
    const activeCols = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Referencia',
            minWidth: 240,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {row.proyectoAsociado?.nombre_proyecto ?? 'Cargando Proyecto...'}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                        <Chip 
                            label={`REF: #${row.id}`} 
                            size="small" 
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, fontFamily: 'monospace', bgcolor: alpha(theme.palette.primary.main, 0.08) }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                            ID Proj: {row.id_proyecto}
                        </Typography>
                    </Stack>
                </Box>
            )
        },
       {
    id: 'monto',
    label: 'Capital Ahorrado',
    render: (row: SuscripcionDto) => {
        // Forzamos la conversión a número y manejamos nulos
        const monto = Number(row.monto_total_pagado || 0);
        
        return (
            <Typography 
                variant="body2" 
                fontWeight={700} 
                color={monto > 0 ? "primary.main" : "text.disabled"}
            >
                {formatCurrency(monto)}
            </Typography>
        );
    }
},
        {
            id: 'tokens',
            label: 'Tokens',
            align: 'center',
            render: (row) => (
                <Chip 
                    icon={<TokenIcon sx={{ fontSize: '14px !important' }} />}
                    label={row.tokens_disponibles || 0}
                    size="small"
                    variant="outlined"
                    color="warning"
                    sx={{ fontWeight: 800 }}
                />
            )
        },
        {
            id: 'acciones',
            label: 'Gestión',
            align: 'right',
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver Proyecto">
                        <IconButton size="small" onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Baja de Plan">
                        <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => confirmDialog.confirm('cancel_subscription', row)}
                            sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
                        >
                            <Cancel fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ], [navigate, formatCurrency, confirmDialog, theme]);

    // --- COLUMNAS PARA HISTORIAL (CANCELADAS) ---
    const canceledCols = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto',
            minWidth: 240,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        {row.proyectoCancelado?.nombre_proyecto || 'Desarrollo Finalizado'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Original REF: #{row.id_suscripcion_original}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'monto',
            label: 'Monto Liquidado',
            render: (row) => (
                <Typography variant="body2" fontWeight={700} color="error.main">
                    {formatCurrency(row.monto_pagado_total)}
                </Typography>
            )
        },
        {
            id: 'fecha',
            label: 'Fecha Baja',
            render: (row) => (
                <Typography variant="body2" color="text.secondary">
                    {new Date(row.fecha_cancelacion).toLocaleDateString()}
                </Typography>
            )
        }
    ], [formatCurrency]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Planes de Ahorro"
                subtitle="Seguimiento de tus suscripciones y capital acumulado."
            />

            {/* KPI SUMMARY CARDS */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                gap: 2, 
                mb: 4 
            }}>
                <StatCard title="Planes Activos" value={stats.activas.toString()} icon={<PlayCircleFilled />} color="success" loading={isLoading} />
                <StatCard title="Poder de Oferta" value={`${totalTokens} Tokens`} icon={<TokenIcon />} color="warning" loading={isLoading} />
                
                {/* ✅ KPI CORREGIDO: Muestra la suma histórico-total */}
                <StatCard 
                    title="Capital Ahorrado" 
                    value={formatCurrency(capitalHistoricoTotal)} 
                    icon={<MonetizationOn />} 
                    color="primary" 
                    loading={isLoading} 
                    subtitle="Total histórico"
                />

                <StatCard title="Bajas Históricas" value={stats.canceladas.toString()} icon={<EventBusy />} color="error" loading={isLoading} />
            </Box>

            {/* TABS SELECTOR */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Planes Activos" icon={<CheckCircle />} iconPosition="start" sx={{ fontWeight: 700 }} />
                    <Tab label="Historial de Bajas" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
                </Tabs>
            </Box>

            {/* MAIN TABLE SECTION */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    {tabValue === 0 ? (
                        <DataTable
                            columns={activeCols}
                            data={suscripciones}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            highlightedRowId={highlightedId}
                            emptyMessage="No tienes planes de ahorro activos."
                        />
                    ) : (
                        <DataTable
                            columns={canceledCols}
                            data={canceladas}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No hay registros en el historial de bajas."
                            isRowActive={() => false}
                        />
                    )}
                </Paper>
            </QueryHandler>

            {/* CONFIRMATION MODAL */}
            <ConfirmDialog
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                title="¿Detener plan de ahorro?"
                description="Al cancelar este plan, dejarás de acumular tokens para pujas. El capital ahorrado quedará registrado para su liquidación según los términos del contrato."
            />
        </PageContainer>
    );
};

export default MisSuscripciones;
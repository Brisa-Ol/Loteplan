// src/components/domain/suscripciones/MisSuscripciones.optimized.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
    Box, Tabs, Tab, Paper, useTheme, Typography, 
    Stack, IconButton, Tooltip 
} from '@mui/material';
import {
    CheckCircle,
    History as HistoryIcon,
    MonetizationOn,
    EventBusy,
    PlayCircleFilled,
    Token as TokenIcon,
    Visibility,
    Cancel,
    CalendarMonth
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

    // ✅ CAPITAL UNIFICADO: Suma total histórica (Activo + Cancelado)
    const capitalHistoricoTotal = useMemo(() => {
        const activo = suscripciones.reduce((acc, curr) => acc + Number(curr.monto_total_pagado || 0), 0);
        const historico = canceladas.reduce((acc, curr) => acc + Number(curr.monto_pagado_total || 0), 0);
        return activo + historico;
    }, [suscripciones, canceladas]);

    const totalTokens = useMemo(() =>
        suscripciones.reduce((acc, curr) => acc + (curr.tokens_disponibles || 0), 0),
        [suscripciones]
    );

    const handleConfirmCancel = useCallback(async () => {
        if (confirmDialog.data) {
            await cancelarSuscripcion(confirmDialog.data.id);
            confirmDialog.close();
        }
    }, [confirmDialog.data, cancelarSuscripcion, confirmDialog]);

    // ── COLUMNAS: PLANES ACTIVOS (Nombres de proyectos resaltados) ──
    const activeCols = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto',
            minWidth: 320,
            render: (row) => (
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    {row.proyectoAsociado?.nombre_proyecto || 'Cargando nombre...'}
                </Typography>
            )
        },
{
    id: 'monto',
    label: 'Capital Ahorrado',
    render: (row: SuscripcionDto) => {
        // Convertimos el string "0.00" a número de forma segura
        const monto = Number(row.monto_total_pagado || 0);
        
        return (
            <Typography 
                variant="body2" 
                fontWeight={700} 
                color={monto > 0 ? "primary.main" : "text.secondary"}
            >
                {formatCurrency(monto)}
            </Typography>
        );
    }
},
        {
            id: 'tokens',
            label: 'Tokens Disponibles',
            align: 'center',
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <TokenIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight={900}>
                        {row.tokens_disponibles || 0}
                    </Typography>
                </Stack>
            )
        },
        {
            id: 'acciones',
            label: 'Gestión',
            align: 'right',
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver detalles del proyecto">
                        <IconButton size="small" onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Solicitar baja del plan">
                        <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => confirmDialog.confirm('cancel_subscription', row)}
                        >
                            <Cancel fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ], [navigate, formatCurrency, confirmDialog]);

    // ── COLUMNAS: HISTORIAL DE BAJAS (Sin IDs, solo nombres) ──
    const canceledCols = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto',
            minWidth: 320,
            render: (row) => (
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                    {row.proyectoCancelado?.nombre_proyecto || 'Proyecto Finalizado'}
                </Typography>
            )
        },
        {
            id: 'monto',
            label: 'Monto en Liquidación',
            render: (row) => (
                <Typography variant="body2" fontWeight={700} color="text.disabled">
                    {formatCurrency(Number(row.monto_pagado_total || 0))}
                </Typography>
            )
        },
        {
            id: 'fecha',
            label: 'Fecha de Egreso',
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">
                        {new Date(row.fecha_cancelacion).toLocaleDateString()}
                    </Typography>
                </Box>
            )
        }
    ], [formatCurrency]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Planes de Ahorro"
                subtitle="Administra tu capital acumulado y tus tokens de participación."
            />

            {/* RESUMEN DE ESTADÍSTICAS */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                gap: 2, 
                mb: 4 
            }}>
                <StatCard title="Planes Activos" value={stats.activas.toString()} icon={<PlayCircleFilled />} color="success" loading={isLoading} />
                <StatCard title="Poder de Oferta" value={`${totalTokens} Tokens`} icon={<TokenIcon />} color="warning" loading={isLoading} />
                
                <StatCard 
                    title="Capital Total" 
                    value={formatCurrency(capitalHistoricoTotal)} 
                    icon={<MonetizationOn />} 
                    color="primary" 
                    loading={isLoading} 
                    subtitle="Acumulado histórico"
                />

                <StatCard title="Bajas Realizadas" value={stats.canceladas.toString()} icon={<EventBusy />} color="error" loading={isLoading} />
            </Box>

            {/* SELECTOR DE PESTAÑAS */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Planes Vigentes" icon={<CheckCircle />} iconPosition="start" sx={{ fontWeight: 700 }} />
                    <Tab label="Historial de Salidas" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
                </Tabs>
            </Box>

            {/* TABLA PRINCIPAL */}
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
                            emptyMessage="No tienes planes vigentes en este momento."
                        />
                    ) : (
                        <DataTable
                            columns={canceledCols}
                            data={canceladas}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No hay registros en el historial de bajas."
                        />
                    )}
                </Paper>
            </QueryHandler>

            {/* MODAL DE CONFIRMACIÓN */}
            <ConfirmDialog
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                title="¿Confirmas la baja del plan?"
                description="Al cancelar tu participación en este proyecto, tu capital acumulado pasará a proceso de liquidación."
            />
        </PageContainer>
    );
};

export default MisSuscripciones;
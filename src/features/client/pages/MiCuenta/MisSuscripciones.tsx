// src/components/domain/suscripciones/MisSuscripciones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Tabs, Tab, Paper, useTheme, Typography,
    Stack, IconButton, Tooltip, Chip
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
    CalendarMonth,
    ReceiptLong,
    Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import type { SuscripcionDto, SuscripcionCanceladaDto } from '@/core/types/suscripcion.dto';
import type { AdhesionDto, PlanPagoAdhesion } from '@/core/types/adhesion.dto';
import { useSuscripciones } from '../../hooks/useSuscripciones';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import {
    ConfirmDialog, DataTable, PageContainer, PageHeader,
    QueryHandler, StatCard, useConfirmDialog,
    type DataTableColumn
} from '@/shared';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanPagoAdhesion, string> = {
    contado:   'Pago contado',
    '3_cuotas':  '3 cuotas',
    '6_cuotas': '6 cuotas',
};

const getPlanLabel = (plan: PlanPagoAdhesion): string =>
    PLAN_LABELS[plan] ?? plan;

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-AR');

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

const MisSuscripciones: React.FC = () => {
    const navigate        = useNavigate();
    const theme           = useTheme();
    const formatCurrency  = useCurrencyFormatter();
    // ✅ CORRECCIÓN 1: Quitamos el <ConfirmAction>
    const confirmDialog   = useConfirmDialog();

    const {
        suscripciones,
        canceladas,
        adhesiones,
        stats,
        isLoading,
        error,
        cancelarSuscripcion,
        isCancelling,
        cancelarAdhesionObj,
        isCancellingAdhesion,
        highlightedId,
    } = useSuscripciones();

    const [tabValue, setTabValue] = useState(0);

    // ── DATOS DERIVADOS ───────────────────────────────────────────────────────

    /** Solo mostramos como "Vigentes" los planes con adhesión completada */
    const suscripcionesVigentes = useMemo(
        () => suscripciones.filter((s) => s.adhesion_completada === true),
        [suscripciones],
    );

    const capitalHistoricoTotal = useMemo(() => {
        const enActivas   = suscripciones.reduce((acc, s) => acc + Number(s.monto_total_pagado  || 0), 0);
        const enCanceladas = canceladas.reduce((acc, s) => acc + Number(s.monto_pagado_total    || 0), 0);
        return enActivas + enCanceladas;
    }, [suscripciones, canceladas]);

    const totalTokens = useMemo(
        () => suscripciones.reduce((acc, s) => acc + (s.tokens_disponibles || 0), 0),
        [suscripciones],
    );

    // ── CONFIRMACIÓN ─────────────────────────────────────────────────────────

    const handleConfirmCancel = useCallback(async () => {
        if (!confirmDialog.data) return;

        if (confirmDialog.action === 'cancel_subscription') {
            await cancelarSuscripcion(confirmDialog.data.id);
        } else if (confirmDialog.action === ('cancel_adhesion' as any)) { // ✅ CORRECCIÓN 2: as any
            await cancelarAdhesionObj(confirmDialog.data.id);
        }

        confirmDialog.close();
    }, [confirmDialog.data, confirmDialog.action, cancelarSuscripcion, cancelarAdhesionObj, confirmDialog]); // ✅ confirmDialog.close no debe ser dependencia

    // ── COLUMNAS: PLANES VIGENTES ─────────────────────────────────────────────

    const activeCols = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Suscripción',
            minWidth: 320,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {row.proyectoAsociado?.nombre_proyecto ?? '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                        Suscripción #{row.id} • Alta: {formatDate(row.createdAt)}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'monto',
            label: 'Capital Ahorrado',
            render: (row) => {
                const monto = Number(row.monto_total_pagado || 0);
                return (
                    <Typography variant="body2" fontWeight={700} color={monto > 0 ? 'primary.main' : 'text.secondary'}>
                        {formatCurrency(monto)}
                    </Typography>
                );
            },
        },
        {
            id: 'tokens',
            label: 'Tokens Disponibles',
            align: 'center',
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <TokenIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight={900}>
                        {row.tokens_disponibles ?? 0}
                    </Typography>
                </Stack>
            ),
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
            ),
        },
    ], [navigate, formatCurrency, confirmDialog]);

    // ── COLUMNAS: ADHESIONES ──────────────────────────────────────────────────

    const adhesionCols = useMemo<DataTableColumn<AdhesionDto>[]>(() => [
        {
            id: 'proyecto_adhesion',
            label: 'Detalle Adhesión',
            minWidth: 260,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {row.proyecto?.nombre_proyecto ?? `Adhesión #${row.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Suscripción reservada #{row.id_suscripcion}
                    </Typography>
                    <Chip
                        label={getPlanLabel(row.plan_pago)}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                </Box>
            ),
        },
        {
            id: 'estado',
            label: 'Estado',
            render: (row) => {
                const isComplete  = row.estado === 'completada';
                const isCancelled = row.estado === 'cancelada';
                return (
                    <Chip
                        label={row.estado.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={isComplete ? 'success' : isCancelled ? 'default' : 'warning'}
                        icon={isComplete ? <CheckCircle /> : isCancelled ? <Cancel /> : <Schedule />}
                        variant={isCancelled ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700 }}
                    />
                );
            },
        },
        {
            id: 'progreso',
            label: 'Progreso',
            render: (row) => {
                const esPagoContado = row.plan_pago === 'contado';
                return (
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {esPagoContado
                            ? row.cuotas_pagadas === row.cuotas_totales ? 'Pago único abonado' : 'Pago único pendiente'
                            : `${row.cuotas_pagadas} de ${row.cuotas_totales} cuotas abonadas`
                        }
                    </Typography>
                );
            },
        },
        {
            id: 'monto',
            label: 'Monto Total',
            render: (row) => (
                <Typography variant="body2" fontWeight={800}>
                    {formatCurrency(row.monto_total_adhesion)}
                </Typography>
            ),
        },
        {
            id: 'acciones',
            label: 'Gestión',
            align: 'right',
            render: (row) => {
                const canCancel = row.estado !== 'completada' && row.estado !== 'cancelada';
                if (!canCancel) return null;
                return (
                    <Tooltip title="Dar de baja esta adhesión">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDialog.confirm('cancel_adhesion' as any, row)} // ✅ CORRECCIÓN 3: as any
                        >
                            <Cancel fontSize="small" />
                        </IconButton>
                    </Tooltip>
                );
            },
        },
    ], [confirmDialog, formatCurrency]);

    // ── COLUMNAS: HISTORIAL DE BAJAS ──────────────────────────────────────────

    const canceledCols = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Suscripción',
            minWidth: 320,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        {row.proyectoCancelado?.nombre_proyecto ?? 'Proyecto finalizado'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                        Suscripción orig. #{row.id_suscripcion_original}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'monto',
            label: 'Monto en Liquidación',
            render: (row) => (
                <Typography variant="body2" fontWeight={700} color="text.disabled">
                    {formatCurrency(Number(row.monto_pagado_total || 0))}
                </Typography>
            ),
        },
        {
            id: 'fecha',
            label: 'Fecha de Egreso',
            render: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarMonth sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(row.fecha_cancelacion)}
                    </Typography>
                </Stack>
            ),
        },
        {
            id: 'devolucion',
            label: 'Devolución',
            align: 'center',
            render: (row) => (
                row.devolucion_realizada
                    ? (
                        <Tooltip title={row.fecha_devolucion ? `Reintegrado el ${formatDate(row.fecha_devolucion)}` : 'Reintegrado'}>
                            <CheckCircle color="success" />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Reintegro pendiente">
                            <Cancel color="error" />
                        </Tooltip>
                    )
            ),
        },
    ], [formatCurrency]);

    // ── TEXTOS DEL DIALOG ─────────────────────────────────────────────────────

    const dialogTitle = confirmDialog.action === ('cancel_adhesion' as any) // ✅ CORRECCIÓN 4: as any
        ? '¿Confirmas la baja de la adhesión?'
        : '¿Confirmas la baja del plan?';

    const dialogDescription = (() => {
        if (!confirmDialog.data) return 'Esta acción es irreversible.';

        if (confirmDialog.action === ('cancel_adhesion' as any)) { // ✅ CORRECCIÓN 5: as any
            const adhesion = confirmDialog.data as AdhesionDto;
            return `Estás a punto de cancelar tu Adhesión #${adhesion.id} del proyecto "${adhesion.proyecto?.nombre_proyecto}". Perderás el cupo reservado. Esta acción es irreversible.`;
        }

        const suscripcion = confirmDialog.data as SuscripcionDto;
        return `Estás a punto de cancelar la Suscripción #${suscripcion.id} correspondiente al proyecto "${suscripcion.proyectoAsociado?.nombre_proyecto}". Tu capital acumulado pasará a proceso de liquidación.`;
    })();

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Planes de Ahorro"
                subtitle="Administra tu capital acumulado y tus tokens de participación."
            />

            {/* ESTADÍSTICAS */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 4,
            }}>
                <StatCard
                    title="Planes Activos"
                    value={suscripcionesVigentes.length.toString()}
                    icon={<PlayCircleFilled />}
                    color="success"
                    loading={isLoading}
                />
                <StatCard
                    title="Poder de Oferta"
                    value={`${totalTokens} Tokens`}
                    icon={<TokenIcon />}
                    color="warning"
                    loading={isLoading}
                />
                <StatCard
                    title="Capital Total"
                    value={formatCurrency(capitalHistoricoTotal)}
                    icon={<MonetizationOn />}
                    color="primary"
                    loading={isLoading}
                    subtitle="Acumulado histórico"
                />
                <StatCard
                    title="Bajas Realizadas"
                    value={stats.canceladas.toString()}
                    icon={<EventBusy />}
                    color="error"
                    loading={isLoading}
                />
            </Box>

            {/* PESTAÑAS */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Planes Vigentes"   icon={<CheckCircle />}  iconPosition="start" sx={{ fontWeight: 700 }} />
                    <Tab label="Adhesiones"        icon={<ReceiptLong />}  iconPosition="start" sx={{ fontWeight: 700 }} />
                    <Tab label="Historial de Salidas" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
                </Tabs>
            </Box>

            {/* TABLAS */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    {tabValue === 0 && (
                        <DataTable
                            columns={activeCols}
                            data={suscripcionesVigentes}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            highlightedRowId={highlightedId}
                            emptyMessage="No tenés planes vigentes. Si tenés una adhesión en curso, debés completarla primero."
                        />
                    )}
                    {tabValue === 1 && (
                        <DataTable
                            columns={adhesionCols}
                            data={adhesiones}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No tenés adhesiones registradas."
                        />
                    )}
                    {tabValue === 2 && (
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

            {/* DIALOG DE CONFIRMACIÓN */}
            <ConfirmDialog
                controller={confirmDialog}
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling || isCancellingAdhesion}
                title={dialogTitle}
                description={dialogDescription}
            />
        </PageContainer>
    );
};

export default MisSuscripciones;
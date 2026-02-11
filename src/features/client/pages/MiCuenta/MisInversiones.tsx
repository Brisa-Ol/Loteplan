// src/components/domain/inversiones/MisInversiones.tsx

import {
    MonetizationOn, Payment, PieChart, TrendingUp, Visibility
} from '@mui/icons-material';
import {
    alpha,
    Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Compartidos
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '@/shared/components/layout/headers/PageHeader';

// Servicios y Tipos
import InversionService from '@/core/api/services/inversion.service';
import { env } from '@/core/config/env';
import type { InversionDto } from '@/core/types/dto/inversion.dto';

// Utils & Hooks
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useInversionPayment } from '../../hooks/useInversionPayment';
import { getStatusConfig } from '../utils/inversionStatus';

const MisInversiones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const formatCurrency = useCurrencyFormatter();

    const {
        iniciarPago, isIniciandoPago, selectedInversionId,
        confirmar2FA, isConfirmando2FA, twoFAError, setTwoFAError,
        is2FAOpen, close2FA
    } = useInversionPayment();

    // --- QUERIES ---
    const { data: inversiones = [], isLoading, error } = useQuery<InversionDto[]>({
        queryKey: ['misInversiones'],
        queryFn: async () => {
            const response = await InversionService.getMisInversiones();
            // Adaptación segura para el wrapper de datos { data: [...] } o array directo
            return (response.data as any).data ?? response.data ?? [];
        },
        retry: 1,
        staleTime: 1000 * 60 * 5
    });

    // --- LÓGICA DE NEGOCIO (KPIs) ---
    const stats = useMemo(() => {
        if (!inversiones.length) return { total: 0, pagadas: 0, monto: 0 };

        return inversiones.reduce((acc, inv) => {
            const montoNum = Number(inv.monto) || 0;
            const esValida = !['fallido', 'reembolsado'].includes(inv.estado);

            return {
                total: acc.total + 1,
                pagadas: inv.estado === 'pagado' ? acc.pagadas + 1 : acc.pagadas,
                monto: esValida ? acc.monto + montoNum : acc.monto
            };
        }, { total: 0, pagadas: 0, monto: 0 });
    }, [inversiones]);

    // --- COLUMNAS DE LA TABLA ---
    const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Referencia',
            minWidth: 220,
            render: (row) => {
                const proyecto = row.proyectoInvertido || (row as any).proyecto;
                return (
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {proyecto?.nombre_proyecto ?? 'Proyecto Directo'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            REF: #{row.id}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            id: 'fecha',
            label: 'Fecha Solicitud',
            minWidth: 120,
            render: (row) => (
                <Typography variant="body2" color="text.secondary">
                    {new Date(row.fecha_inversion).toLocaleDateString(env.defaultLocale, {
                        day: '2-digit', month: 'short', year: 'numeric'
                    })}
                </Typography>
            )
        },
        {
            id: 'monto',
            label: 'Capital',
            minWidth: 150,
            render: (row) => (
                <Typography variant="body2" fontWeight={700} color="success.main" fontSize="1rem">
                    {formatCurrency(row.monto)}
                </Typography>
            )
        },
        {
            id: 'estado',
            label: 'Estado',
            minWidth: 140,
            render: (row) => {
                const { label, color, icon } = getStatusConfig(row.estado);
                return (
                    <Chip
                        label={label}
                        color={color}
                        icon={icon as React.ReactElement}
                        size="small"
                        variant={row.estado === 'pagado' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, minWidth: 110, justifyContent: 'flex-start' }}
                    />
                );
            }
        },
        {
            id: 'acciones',
            label: 'Acciones',
            align: 'right',
            minWidth: 180,
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver Detalles">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                            sx={{ border: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {row.estado === 'pendiente' && (
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={isIniciandoPago}
                            onClick={() => iniciarPago(row.id)}
                            startIcon={isIniciandoPago && selectedInversionId === row.id ? null : <Payment />}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                        >
                            {isIniciandoPago && selectedInversionId === row.id ? 'Cargando...' : 'Pagar'}
                        </Button>
                    )}
                </Stack>
            )
        }
    ], [theme, isIniciandoPago, selectedInversionId, navigate, iniciarPago, formatCurrency]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Inversiones"
                subtitle="Monitorea el rendimiento de tu capital y diversifica tu cartera."
            />

            {/* KPI Cards Layout */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2,
                    mb: 4
                }}
            >
                <StatCard
                    title="Capital Invertido"
                    value={formatCurrency(stats.monto)}
                    icon={<MonetizationOn />}
                    color="primary"
                    loading={isLoading}
                    subtitle="Total acumulado"
                    compact
                />
                <StatCard
                    title="Proyectos"
                    value={stats.total.toString()}
                    icon={<PieChart />}
                    color="warning"
                    loading={isLoading}
                    subtitle="Inversiones registradas"
                    compact
                />
                <StatCard
                    title="Retornos Exitosos"
                    value={stats.pagadas.toString()}
                    icon={<TrendingUp />}
                    color="success"
                    loading={isLoading}
                    subtitle="Confirmadas por el sistema"
                    compact
                />
            </Box>

            {/* Main Content Table */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper
                    elevation={0}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 4,
                        overflow: 'hidden'
                    }}
                >
                    <DataTable
                        columns={columns}
                        data={inversiones}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        highlightedRowId={selectedInversionId}
                        isRowActive={(row) => !['fallido', 'reembolsado'].includes(row.estado)}
                        emptyMessage="No tienes inversiones registradas actualmente."
                    />
                </Paper>
            </QueryHandler>

            <TwoFactorAuthModal
                open={is2FAOpen}
                onClose={() => { close2FA(); setTwoFAError(null); }}
                onSubmit={confirmar2FA}
                isLoading={isConfirmando2FA}
                error={twoFAError}
                title="Verificación de Inversión"
                description="Ingresa el código de 6 dígitos de tu aplicación de autenticación para proceder con el pago."
            />
        </PageContainer>
    );
};

export default MisInversiones;
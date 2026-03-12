// src/components/domain/inversiones/MisInversiones.tsx

import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Material UI Components
import {
    Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography, useTheme
} from '@mui/material';

// Material UI Icons
import InversionService from '@/core/api/services/inversion.service';
import type { InversionDto } from '@/core/types/inversion.dto';
import { PageContainer, PageHeader, StatCard } from '@/shared';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import {
    AccountBalanceWallet, CheckCircle, ErrorOutline, HelpOutline,
    HourglassEmpty, MonetizationOn, Payment, PieChart,
    Schedule,
    Visibility
} from '@mui/icons-material';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useInversionPayment } from '../../hooks/useInversionPayment';

// ============================================================================
// HELPER: Configuración de Estados
// ============================================================================
const getStatusConfig = (estado: string) => {
    const configs: Record<string, any> = {
        pagado: { label: 'Pagado', color: 'success', icon: <CheckCircle fontSize="small" /> },
        cubierto_por_puja: { label: 'Cubierto', color: 'success', icon: <AccountBalanceWallet fontSize="small" /> },
        pendiente: { label: 'Pendiente', color: 'info', icon: <Schedule fontSize="small" /> },
        en_proceso: { label: 'En Proceso', color: 'warning', icon: <HourglassEmpty fontSize="small" /> },
        fallido: { label: 'Fallido', color: 'error', icon: <ErrorOutline fontSize="small" /> },
    };
    return configs[estado] || { label: estado, color: 'default', icon: <HelpOutline fontSize="small" /> };
};

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
            // Mapeo seguro según la estructura de tu backend
            return (response.data as any).data ?? response.data ?? [];
        }
    });

    // --- LÓGICA DE NEGOCIO (KPIs) ---
    // ✅ CORRECCIÓN: Usamos Number(inv.monto) para evitar el cero
    const stats = useMemo(() => {
        return inversiones.reduce((acc, inv) => {
            const montoNum = Number(inv.monto) || 0;
            const esValida = !['fallido', 'reembolsado'].includes(inv.estado);

            return {
                total: acc.total + 1,
                exitosas: inv.estado === 'pagado' ? acc.exitosas + 1 : acc.exitosas,
                montoTotal: esValida ? acc.montoTotal + montoNum : acc.montoTotal
            };
        }, { total: 0, exitosas: 0, montoTotal: 0 });
    }, [inversiones]);

    // --- COLUMNAS (Sin IDs, solo nombres) ---
    const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto',
            minWidth: 280,
            render: (row) => (
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    {row.proyectoInvertido?.nombre_proyecto ?? 'Inversión Directa'}
                </Typography>
            )
        },
        {
            id: 'monto',
            label: 'Capital Invertido',
            minWidth: 150,
            render: (row) => (
                <Typography variant="body2" fontWeight={700}>
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
                        icon={icon}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                );
            }
        },
        {
            id: 'fecha',
            label: 'Fecha',
            minWidth: 120,
            render: (row) => (
                <Typography variant="body2" color="text.secondary">
                    {new Date(row.fecha_inversion).toLocaleDateString()}
                </Typography>
            )
        },
        {
            id: 'acciones',
            label: 'Gestión',
            align: 'right',
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver Detalles">
                        <IconButton size="small" onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {row.estado === 'pendiente' && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => iniciarPago(row.id)}
                            disabled={isIniciandoPago}
                            startIcon={<Payment />}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        >
                            Pagar
                        </Button>
                    )}
                </Stack>
            )
        }
    ], [navigate, formatCurrency, iniciarPago, isIniciandoPago]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Inversiones"
                subtitle="Seguimiento de tu capital y rendimiento en proyectos directos."
            />

            {/* KPI SUMMARY */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2, mb: 4
            }}>
                <StatCard
                    title="Capital en Cartera"
                    value={formatCurrency(stats.montoTotal)}
                    icon={<MonetizationOn />}
                    color="primary"
                    loading={isLoading}
                />
                <StatCard
                    title="Total Proyectos"
                    value={stats.total.toString()}
                    icon={<PieChart />}
                    color="warning"
                    loading={isLoading}
                />
                <StatCard
                    title="Inversiones Pagadas"
                    value={stats.exitosas.toString()}
                    icon={<CheckCircle />}
                    color="success"
                    loading={isLoading}
                />
            </Box>

            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columns}
                        data={inversiones}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        emptyMessage="No tienes inversiones registradas."
                    />
                </Paper>
            </QueryHandler>

            <TwoFactorAuthModal
                open={is2FAOpen}
                onClose={() => { close2FA(); setTwoFAError(null); }}
                onSubmit={confirmar2FA}
                isLoading={isConfirmando2FA}
                error={twoFAError}
                title="Confirmar Pago de Inversión"
            />
        </PageContainer>
    );
};

export default MisInversiones;
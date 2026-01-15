import React, { useMemo } from 'react';
import { Box, Paper, Stack, Chip, Button, Tooltip, useTheme, alpha, IconButton } from '@mui/material';
import { Visibility, Payment, TrendingUp, MonetizationOn, CheckCircle, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Componentes y Hooks compartidos
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';

// Servicios y Tipos
import InversionService from '@/core/api/services/inversion.service';
import type { InversionDto } from '@/core/types/dto/inversion.dto';
import { env } from '@/core/config/env';

// Utils Locales & Hooks
import { getStatusConfig } from '../utils/inversionStatus';
import { useInversionPayment } from '../../hooks/useInversionPayment';

const MisInversiones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    // 1. Hook de Pagos (Lógica extraída)
    const { 
        iniciarPago, isIniciandoPago, selectedInversionId,
        confirmar2FA, isConfirmando2FA, twoFAError, setTwoFAError,
        is2FAOpen, close2FA 
    } = useInversionPayment();

    // 2. Data Fetching
    const { data: inversiones = [], isLoading, error, refetch } = useQuery<InversionDto[]>({
        queryKey: ['misInversiones'],
        queryFn: async () => (await InversionService.getMisInversiones()).data,
        retry: 1
    });

    // 3. Stats (Optimizados)
    const stats = useMemo(() => {
        if (!inversiones.length) return { total: 0, pagadas: 0, monto: 0 };
        return {
            total: inversiones.length,
            pagadas: inversiones.filter(i => i.estado === 'pagado').length,
            monto: inversiones.reduce((acc, inv) => acc + Number(inv.monto), 0)
        };
    }, [inversiones]);

    // Formatters (Podrían ir a un utils global si se usan mucho)
    const formatCurrency = (val: number) => new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

    const formatDate = (date: string) => new Date(date).toLocaleDateString(env.defaultLocale, { 
        day: '2-digit', month: 'short', year: 'numeric' 
    });

    // 4. Definición de Columnas
    const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: 'proyecto', label: 'Proyecto / ID', minWidth: 200,
            render: (row) => (
                <Box>
                    <Box component="span" sx={{ display: 'block', fontWeight: 600, color: 'text.primary' }}>
                        {row.proyecto?.nombre_proyecto || 'Proyecto no disponible'}
                    </Box>
                    <Box component="span" sx={{ fontFamily: 'monospace', opacity: 0.8, fontSize: '0.75rem', color: 'text.secondary' }}>
                        ID: #{row.id}
                    </Box>
                </Box>
            )
        },
        {
            id: 'fecha', label: 'Fecha', minWidth: 120,
            render: (row) => <Box sx={{ color: 'text.secondary' }}>{formatDate(row.fecha_inversion)}</Box>
        },
        {
            id: 'monto', label: 'Monto', minWidth: 150,
            render: (row) => (
                <Box sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(Number(row.monto))}
                </Box>
            )
        },
        {
            id: 'estado', label: 'Estado', minWidth: 140,
            render: (row) => {
                const { label, color, icon } = getStatusConfig(row.estado);
                return (
                    <Chip
                        label={label}
                        color={color}
                        icon={icon as React.ReactElement} // Type casting seguro
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, borderWidth: 1 }}
                    />
                );
            }
        },
        {
            id: 'acciones', label: 'Acciones', align: 'right', minWidth: 180,
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver detalles">
                        <Button
                            variant="outlined" color="inherit" size="small"
                            startIcon={<Visibility fontSize="small" />}
                            onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                            sx={{
                                borderColor: theme.palette.divider,
                                color: 'text.secondary',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    color: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                                }
                            }}
                        >
                            Ver
                        </Button>
                    </Tooltip>

                    {row.estado === 'pendiente' && (
                        <Tooltip title="Pagar con MercadoPago">
                            <Button
                                variant="contained" color="primary" size="small"
                                startIcon={<Payment fontSize="small" />}
                                onClick={() => iniciarPago(row.id)}
                                disabled={isIniciandoPago}
                                disableElevation
                                sx={{ fontWeight: 600 }}
                            >
                                {isIniciandoPago && selectedInversionId === row.id ? '...' : 'Pagar'}
                            </Button>
                        </Tooltip>
                    )}
                </Stack>
            )
        }
    ], [theme, isIniciandoPago, selectedInversionId, navigate, iniciarPago]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Historial de Inversiones"
                subtitle="Gestiona tus participaciones y pagos pendientes"
                action={
                    <Tooltip title="Actualizar lista">
                        <IconButton onClick={() => refetch()} disabled={isLoading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                }
            />

            {/* KPI CARDS */}
            <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                <StatCard 
                    title="Capital Total" value={formatCurrency(stats.monto)} 
                    icon={<MonetizationOn />} color="primary" loading={isLoading} 
                    subtitle="Inversión acumulada" 
                />
                <StatCard 
                    title="Participaciones" value={stats.total.toString()} 
                    icon={<TrendingUp />} color="secondary" loading={isLoading} 
                    subtitle="Total histórico" 
                />
                <StatCard 
                    title="Finalizadas" value={stats.pagadas.toString()} 
                    icon={<CheckCircle />} color="success" loading={isLoading} 
                    subtitle="Pagos completados" 
                />
            </Box>

            {/* TABLE */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    boxShadow: theme.shadows[2] 
                }}>
                    <DataTable
                        columns={columns}
                        data={inversiones}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        highlightedRowId={selectedInversionId} // Usamos el ID seleccionado por el hook
                        isRowActive={(row) => !['fallido', 'reembolsado'].includes(row.estado)}
                        emptyMessage="Aún no tienes inversiones registradas."
                    />
                </Paper>
            </QueryHandler>

            {/* MODAL 2FA */}
            <TwoFactorAuthModal
                open={is2FAOpen}
                onClose={() => { close2FA(); setTwoFAError(null); }}
                onSubmit={(code) => confirmar2FA(code)}
                isLoading={isConfirmando2FA}
                error={twoFAError}
                title="Seguridad Requerida"
                description="Confirma tu pago ingresando el código de autenticación."
            />
        </PageContainer>
    );
};

export default MisInversiones;
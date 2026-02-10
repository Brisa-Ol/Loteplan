// src/components/domain/inversiones/MisInversiones.tsx

import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Stack, 
  Chip, 
  Button, 
  Tooltip, 
  useTheme, 
  alpha, 
  IconButton, 
  Typography 
} from '@mui/material';
import { 
  Visibility, 
  Payment, 
  TrendingUp, 
  MonetizationOn, 
  PieChart 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Componentes Compartidos
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { PageHeader } from '@/shared/components/layout/headers/PageHeader';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';

// Servicios y Tipos
import InversionService from '@/core/api/services/inversion.service';
import type { InversionDto } from '@/core/types/dto/inversion.dto';
import { env } from '@/core/config/env';

// Utils & Hooks
import { getStatusConfig } from '../utils/inversionStatus';
import { useInversionPayment } from '../../hooks/useInversionPayment';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisInversiones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const formatCurrency = useCurrencyFormatter();

    const { 
        iniciarPago, isIniciandoPago, selectedInversionId,
        confirmar2FA, isConfirmando2FA, twoFAError, setTwoFAError,
        is2FAOpen, close2FA 
    } = useInversionPayment();

    const { data: inversiones = [], isLoading, error } = useQuery<InversionDto[]>({
        queryKey: ['misInversiones'],
        queryFn: async () => (await InversionService.getMisInversiones()).data,
        retry: 1,
        staleTime: 1000 * 60 * 5 
    });

    const stats = useMemo(() => {
        if (!inversiones.length) return { total: 0, pagadas: 0, monto: 0 };
        return {
            total: inversiones.length,
            pagadas: inversiones.filter(i => i.estado === 'pagado').length,
            monto: inversiones.reduce((acc, inv) => acc + Number(inv.monto), 0)
        };
    }, [inversiones]);

    const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: 'proyecto',
            label: 'Proyecto / Referencia',
            minWidth: 220,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {row.proyecto?.nombre_proyecto ?? 'Proyecto Desconocido'}
                    </Typography>
                    <Stack direction="row" mt={0.5}>
                        <Chip 
                            label={`REF: #${row.id}`} 
                            size="small" 
                            sx={{ 
                                height: 20, 
                                fontSize: '0.65rem', 
                                fontFamily: 'monospace',
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.dark
                            }} 
                        />
                    </Stack>
                </Box>
            )
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
                        sx={{ fontWeight: 600, minWidth: 100, justifyContent: 'flex-start' }}
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
                    <Tooltip title="Ver Proyecto">
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                            sx={{ 
                                border: `1px solid ${theme.palette.divider}`,
                                '&:hover': { color: 'primary.main', borderColor: 'primary.main' }
                            }}
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
                            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 100 }}
                        >
                            {isIniciandoPago && selectedInversionId === row.id ? '...' : 'Pagar'}
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

            {/* ✅ LAYOUT OPTIMIZADO CON CSS GRID (Sin Grid Component)
               Se alinea perfectamente al ancho del contenedor 'lg'.
            */}
            <Box 
                sx={{
                    display: 'grid',
                    // Responsive: 1 columna en movil, 3 en desktop
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                    gap: 2, // Espacio de 16px entre tarjetas
                    mb: 3,  // Margen inferior para separar de la tabla
                    width: '100%'
                }}
            >
                <StatCard 
                    title="Capital Invertido"
                    value={formatCurrency(stats.monto)} 
                    icon={<MonetizationOn />} 
                    color="primary" 
                    loading={isLoading} 
                    subtitle="Total en cartera"
                    compact
                />
                <StatCard 
                    title="Proyectos Activos"
                    value={stats.total.toString()} 
                    icon={<PieChart />}
                    color="warning" 
                    loading={isLoading} 
                    subtitle="Diversificación actual"
                    compact
                />
                <StatCard 
                    title="Retornos Completados"
                    value={stats.pagadas.toString()} 
                    icon={<TrendingUp />}
                    color="success" 
                    loading={isLoading} 
                    subtitle="Inversiones finalizadas"
                    compact
                />
            </Box>

            {/* TABLA DE DATOS */}
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
                        data={inversiones}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        highlightedRowId={selectedInversionId}
                        isRowActive={(row) => !['fallido', 'reembolsado'].includes(row.estado)}
                        emptyMessage="Aún no has comenzado a invertir. ¡Explora los proyectos disponibles!"
                    />
                </Paper>
            </QueryHandler>

            <TwoFactorAuthModal
                open={is2FAOpen}
                onClose={() => { close2FA(); setTwoFAError(null); }}
                onSubmit={(code) => confirmar2FA(code)}
                isLoading={isConfirmando2FA}
                error={twoFAError}
                title="Confirmar Inversión"
                description="Para asegurar tu inversión, ingresa el código de seguridad de tu autenticador."
            />
        </PageContainer>
    );
};

export default MisInversiones;
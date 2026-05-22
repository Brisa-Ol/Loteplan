// src/components/domain/inversiones/MisInversiones.tsx

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// MUI
import {
    Box, Button, Chip, Divider, Paper, Stack, Tab, Tabs, Tooltip, Typography, alpha, useTheme
} from '@mui/material';

// Icons
import {
    AccountBalanceWallet, BusinessCenter, CalendarMonth, Cancel, CheckCircle,
    History as HistoryIcon, HelpOutline, MonetizationOn, Payment,
    PieChart, Replay, Schedule, Visibility
} from '@mui/icons-material';

// Core & Shared
import InversionService from '@/core/api/services/inversion.service';
import type { InversionDto } from '@/core/types/inversion.dto';
import { PageContainer, PageHeader, StatCard, DataTable, type DataTableColumn } from '@/shared';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useInversionPayment } from '../../hooks/useInversionPayment';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (iso?: string | null): string => {
    if (!iso) return "—";
    const dateStr = iso.includes("T") ? iso : `${iso}T00:00:00`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return format(date, "dd/MM/yyyy", { locale: es });
};

const getStatusConfig = (estado: InversionDto['estado']) => {
    const configs: Record<InversionDto['estado'], any> = {
        pagado: { label: 'Inversión Activa', color: 'success', icon: <CheckCircle fontSize="small" /> },
        pendiente: { label: 'Pago Pendiente', color: 'warning', icon: <Schedule fontSize="small" /> },
        fallido: { label: 'Pago Fallido', color: 'error', icon: <Cancel fontSize="small" /> },
        reembolsado: { label: 'Reembolsado', color: 'default', icon: <Replay fontSize="small" /> },
    };
    return configs[estado] || { label: estado, color: 'default', icon: <HelpOutline fontSize="small" /> };
};

// ── Celda de métrica reutilizable (Idéntica a MisSuscripciones) ──
interface MetricCellProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueColor?: string;
    tooltip?: string;
}

const MetricCell: React.FC<MetricCellProps> = ({ icon, label, value, valueColor = "text.primary", tooltip }) => {
    const cell = (
        <Box sx={{ flex: 1, px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box sx={{ color: "text.disabled", flexShrink: 0, display: "flex" }}>
                {icon}
            </Box>
            <Box minWidth={0}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.4, display: "block", lineHeight: 1.3, mb: 0.25 }}
                >
                    {label}
                </Typography>
                {typeof value === "string" || typeof value === "number" ? (
                    <Typography variant="body2" fontWeight={800} color={valueColor}>
                        {value}
                    </Typography>
                ) : (
                    value
                )}
            </Box>
        </Box>
    );
    return tooltip ? <Tooltip title={tooltip}>{cell}</Tooltip> : cell;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: CARD DE INVERSIÓN ACTIVA
// ─────────────────────────────────────────────────────────────────────────────

interface InversionActivaCardProps {
    inversion: InversionDto;
    formatCurrency: (val: number) => string;
    onViewProject: () => void;
}

const InversionActivaCard: React.FC<InversionActivaCardProps> = ({ inversion: inv, formatCurrency, onViewProject }) => {
    const theme = useTheme();
    const proyecto = inv.proyectoInvertido;

    // Si el proyecto está "Finalizado", es un dato crucial porque significa que se aproxima la liquidación.
    const isProjectFinished = proyecto?.estado_proyecto?.toLowerCase() === 'finalizado';

    return (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: "hidden",
                transition: "box-shadow 0.2s",
                "&:hover": {
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
            }}
        >
            {/* ── HEADER ── */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="primary.main" lineHeight={1.3}>
                            {proyecto?.nombre_proyecto ?? "Inversión Directa"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Inversión #{inv.id} · Ingreso: {formatDate(inv.fecha_inversion)}
                        </Typography>
                    </Box>

                    {/* Chips de estado imitando MisSuscripciones */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {proyecto?.tipo_inversion && (
                            <Chip
                                label={`Tipo: ${proyecto.tipo_inversion}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                    fontSize: "0.68rem", fontWeight: 700, height: 22, textTransform: 'capitalize',
                                    borderColor: alpha(theme.palette.text.secondary, 0.3), color: "text.secondary",
                                }}
                            />
                        )}
                        <Chip
                            icon={<CheckCircle sx={{ fontSize: "13px !important" }} />}
                            label="Pago Confirmado"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.68rem", fontWeight: 700, height: 22 }}
                        />
                    </Stack>
                </Stack>
            </Box>

            {/* ── MÉTRICAS ── */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />}
                sx={{ px: 0 }}
            >
                {/* 1. Capital Invertido */}
                <MetricCell
                    icon={<MonetizationOn fontSize="small" />}
                    label="Capital Invertido"
                    value={formatCurrency(Number(inv.monto))}
                    valueColor="success.main"
                    tooltip="Monto total ingresado y confirmado en este proyecto"
                />
                
                {/* 2. Estado del Proyecto (Aporta mucho valor saber si la plata sigue trabajando o si el proyecto cerró) */}
                <MetricCell
                    icon={<BusinessCenter fontSize="small" />}
                    label="Fase del Proyecto"
                    value={proyecto?.estado_proyecto ?? "Desarrollo"}
                    valueColor={isProjectFinished ? "warning.main" : "text.primary"}
                    tooltip={isProjectFinished ? "El proyecto ha finalizado. A la espera de liquidación de retornos." : "El proyecto se encuentra activo y tu capital está trabajando."}
                />
            </Stack>

            <Divider />

            {/* ── ACCIONES ── */}
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 2, py: 1.25 }}>
                <Button
                    size="small"
                    variant="text"
                    startIcon={<Visibility fontSize="small" />}
                    onClick={onViewProject}
                    sx={{
                        fontWeight: 600, fontSize: "0.78rem", color: "text.secondary",
                        "&:hover": { bgcolor: alpha(theme.palette.text.secondary, 0.06) },
                    }}
                >
                    Ver detalle del proyecto
                </Button>
            </Stack>
        </Paper>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const MisInversiones: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const formatCurrency = useCurrencyFormatter();

    const [tabValue, setTabValue] = useState(0);

    const {
        iniciarPago, isIniciandoPago, confirmar2FA, isConfirmando2FA,
        twoFAError, setTwoFAError, is2FAOpen, close2FA
    } = useInversionPayment();

    // --- QUERIES ---
    const { data: inversiones = [], isLoading, error } = useQuery<InversionDto[]>({
        queryKey: ['misInversiones'],
        queryFn: async () => {
            const response = await InversionService.getMisInversiones();
            return (response.data as any).data ?? response.data ?? [];
        }
    });

    // --- DATOS DERIVADOS ---
    const inversionesActivas = useMemo(() => inversiones.filter(i => i.estado === 'pagado'), [inversiones]);
    const inversionesPendientes = useMemo(() => inversiones.filter(i => ['pendiente', 'fallido'].includes(i.estado)), [inversiones]);
    const inversionesHistorial = useMemo(() => inversiones.filter(i => i.estado === 'reembolsado'), [inversiones]);

    const stats = useMemo(() => {
        return inversionesActivas.reduce((acc, inv) => {
            return {
                capital: acc.capital + (Number(inv.monto) || 0),
                proyectos: new Set([...acc.proyectos, inv.id_proyecto])
            };
        }, { capital: 0, proyectos: new Set<number>() });
    }, [inversionesActivas]);

    // ── COLUMNAS: PENDIENTES / FALLIDAS ──────────────────────────────────────
    const pendingCols = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: "proyecto",
            label: "Detalle de Inversión",
            minWidth: 260,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {row.proyectoInvertido?.nombre_proyecto ?? `Inversión #${row.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Intento de ingreso: {formatDate(row.fecha_inversion)}
                    </Typography>
                </Box>
            ),
        },
        {
            id: "estado",
            label: "Estado",
            render: (row) => {
                const config = getStatusConfig(row.estado);
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        color={config.color}
                        icon={config.icon}
                        variant={row.estado === 'fallido' ? "filled" : "outlined"}
                        sx={{ fontWeight: 700 }}
                    />
                );
            },
        },
        {
            id: "monto",
            label: "Monto",
            render: (row) => (
                <Typography variant="body2" fontWeight={800}>
                    {formatCurrency(Number(row.monto))}
                </Typography>
            ),
        },
        {
            id: "acciones",
            label: "Gestión",
            align: "right",
            render: (row) => {
                if (row.estado !== 'fallido') return null;
                return (
                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Payment fontSize="small" />}
                        onClick={() => iniciarPago(row.id)}
                        disabled={isIniciandoPago}
                        sx={{ fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
                    >
                        Reintentar Pago
                    </Button>
                );
            },
        },
    ], [formatCurrency, iniciarPago, isIniciandoPago]);

    // ── COLUMNAS: HISTORIAL ──────────────────────────────────────────────────
    const historyCols = useMemo<DataTableColumn<InversionDto>[]>(() => [
        {
            id: "proyecto",
            label: "Proyecto / Inversión",
            minWidth: 320,
            render: (row) => (
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        {row.proyectoInvertido?.nombre_proyecto ?? "Proyecto liquidado"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ display: "block", mt: 0.5 }}>
                        Inversión original #{row.id}
                    </Typography>
                </Box>
            ),
        },
        {
            id: "monto",
            label: "Capital Devuelto",
            render: (row) => (
                <Typography variant="body2" fontWeight={700} color="text.disabled">
                    {formatCurrency(Number(row.monto))}
                </Typography>
            ),
        },
        {
            id: "fecha",
            label: "Fecha de Reembolso",
            render: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarMonth sx={{ fontSize: 16, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(row.updatedAt)}
                    </Typography>
                </Stack>
            ),
        },
    ], [formatCurrency]);

    return (
        <PageContainer maxWidth="lg">
            <PageHeader
                title="Mis Inversiones"
                subtitle="Monitorea el capital que tienes trabajando y el estado de tus proyectos."
            />

            {/* ── ESTADÍSTICAS ── */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                    mb: 4,
                }}
            >
                <StatCard
                    title="Inversiones Activas"
                    value={inversionesActivas.length.toString()}
                    icon={<CheckCircle />}
                    color="success"
                    loading={isLoading}
                />
                <StatCard
                    title="Proyectos en Cartera"
                    value={stats.proyectos.size.toString()}
                    icon={<PieChart />}
                    color="info"
                    loading={isLoading}
                />
                <StatCard
                    title="Capital Trabajando"
                    value={formatCurrency(stats.capital)}
                    icon={<MonetizationOn />}
                    color="primary"
                    loading={isLoading}
                    subtitle="Aportes ingresados con éxito"
                />
            </Box>

            {/* ── PESTAÑAS ── */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label={`Inversiones Activas${inversionesActivas.length > 0 ? ` (${inversionesActivas.length})` : ""}`}
                        icon={<CheckCircle />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                    <Tab
                        label={`Pendientes / Fallidas${inversionesPendientes.length > 0 ? ` (${inversionesPendientes.length})` : ""}`}
                        icon={<Schedule />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                    <Tab
                        label={`Historial de Liquidaciones${inversionesHistorial.length > 0 ? ` (${inversionesHistorial.length})` : ""}`}
                        icon={<HistoryIcon />}
                        iconPosition="start"
                        sx={{ fontWeight: 700 }}
                    />
                </Tabs>
            </Box>

            {/* ── CONTENIDO POR PESTAÑA ── */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                
                {/* ── Tab 0: Inversiones Activas (Cards) ── */}
                {tabValue === 0 && (
                    <>
                        {inversionesActivas.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    p: 6,
                                    textAlign: "center",
                                }}
                            >
                                <AccountBalanceWallet
                                    sx={{
                                        fontSize: 48,
                                        color: alpha(theme.palette.text.disabled, 0.4),
                                        mb: 2,
                                    }}
                                />
                                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                                    No tenés inversiones directas activas.
                                </Typography>
                                <Typography variant="body2" color="text.disabled" mt={0.5}>
                                    El capital ingresado se reflejará aquí una vez que el pago se confirme.
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={2}>
                                {inversionesActivas.map((inv) => (
                                    <InversionActivaCard
                                        key={inv.id}
                                        inversion={inv}
                                        formatCurrency={formatCurrency}
                                        onViewProject={() => navigate(`/proyectos/${inv.id_proyecto}`)}
                                    />
                                ))}
                            </Stack>
                        )}
                    </>
                )}

                {/* ── Tab 1: Pendientes / Fallidas (Tabla) ── */}
                {tabValue === 1 && (
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <DataTable
                            columns={pendingCols}
                            data={inversionesPendientes}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="No tenés ingresos pendientes ni fallidos."
                        />
                    </Paper>
                )}

                {/* ── Tab 2: Historial (Tabla) ── */}
                {tabValue === 2 && (
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            overflow: "hidden",
                        }}
                    >
                        <DataTable
                            columns={historyCols}
                            data={inversionesHistorial}
                            getRowKey={(row) => row.id}
                            pagination
                            defaultRowsPerPage={10}
                            emptyMessage="Aún no tienes liquidaciones ni retornos registrados."
                        />
                    </Paper>
                )}
            </QueryHandler>

            {/* ── MODALES ── */}
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
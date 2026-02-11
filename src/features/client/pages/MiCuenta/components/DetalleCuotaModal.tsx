// src/pages/User/ResumenesCuenta/components/DetalleCuotaModal.tsx

import React, { useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
    Button, Stack, Paper, Divider, IconButton, Avatar, alpha, useTheme, Tooltip
} from '@mui/material';
import { Close, ReceiptLong, LocalShipping, Calculate, TrendingUp, Savings, InfoOutlined } from '@mui/icons-material';

import { env } from '@/core/config/env';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

interface Props {
    open: boolean;
    onClose: () => void;
    resumen: ResumenCuentaDto | null;
}

export const DetalleCuotaModal: React.FC<Props> = ({ open, onClose, resumen }) => {
    const theme = useTheme();

    // --- HELPERS DE FORMATO ---
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(env.defaultLocale, {
            style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 2
        }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat(env.defaultLocale, { maximumFractionDigits: 2 }).format(val);

    // Helper para visualizar el porcentaje (ej: 0.19 -> "19%")
    const formatPercent = (decimalVal: number) => {
        // Asumimos que si calculamos 0.19 es 19%
        const percent = Math.round(decimalVal * 100);
        return `${percent}%`;
    };

    // --- CÁLCULOS DERIVADOS ---
    const stats = useMemo(() => {
        if (!resumen) return null;
        const { detalle_cuota: d, cuotas_pagadas, meses_proyecto } = resumen;

        // 1. Proyecciones Macro
        const inversionTotalEstimada = d.valor_mensual_final * meses_proyecto;
        const saldoRestanteEstimado = d.valor_mensual_final * (meses_proyecto - cuotas_pagadas);
        const capitalAcumuladoUnidades = d.valor_cemento_unidades * cuotas_pagadas;

        // 2. Desglose Micro (Capital)
        const valorCapital = d.valor_mensual_final - d.carga_administrativa - d.iva_carga_administrativa;

        // 3. 🧮 CÁLCULO INVERSO DE PORCENTAJES (Ya que no están en el DTO)

        // Base Teórica Mensual (Valor Móvil / Plazo)
        const baseMensualFull = d.valor_movil / meses_proyecto;

        // % Admin = Carga / Base
        const pctAdminCalculado = baseMensualFull > 0
            ? (d.carga_administrativa / baseMensualFull)
            : 0;

        // % IVA = IVA / Carga
        const pctIvaCalculado = d.carga_administrativa > 0
            ? (d.iva_carga_administrativa / d.carga_administrativa)
            : 0;

        return {
            inversionTotalEstimada,
            saldoRestanteEstimado,
            capitalAcumuladoUnidades,
            cuotasRestantes: meses_proyecto - cuotas_pagadas,
            valorCapital,
            // Porcentajes calculados para UI
            pctAdminCalculado,
            pctIvaCalculado
        };
    }, [resumen]);

    if (!resumen || !stats) return null;

    const { detalle_cuota: data } = resumen;

    return (
        <Dialog
            open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            {/* HEADER */}
            <DialogTitle display="flex" justifyContent="space-between" alignItems="center"
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <ReceiptLong />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                            Análisis Financiero
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {resumen.nombre_proyecto} • Cuota actual
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>

                    {/* --- COLUMNA IZQUIERDA: DESGLOSE DE CUOTA --- */}
                    <Box sx={{ flex: 7, width: '100%' }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                            Composición de la Cuota
                        </Typography>

                        {/* Tarjeta Ingredientes */}
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <LocalShipping fontSize="small" color="info" />
                                <Typography variant="subtitle2" fontWeight={600}>Valor de Referencia (Total)</Typography>
                            </Box>

                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                <Box textAlign="center">
                                    <Typography variant="h6" fontWeight={700}>{data.valor_cemento_unidades}</Typography>
                                    <Typography variant="caption" color="text.secondary">Unidades</Typography>
                                </Box>
                                <Typography variant="h6" color="text.secondary">×</Typography>
                                <Box textAlign="center">
                                    <Typography variant="h6" fontWeight={700}>${data.valor_cemento}</Typography>
                                    <Typography variant="caption" color="text.secondary">Precio Unit.</Typography>
                                </Box>
                                <Typography variant="h6" color="text.secondary">=</Typography>
                                <Box textAlign="right">
                                    <Typography variant="h6" fontWeight={700} color="info.main">
                                        {formatCurrency(data.valor_movil)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Valor Móvil Total</Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Lista Sumatoria */}
                        <Stack spacing={2} sx={{ mb: 2 }}>
                            {/* Capital */}
                            <RowItem
                                label="Cuota Pura (Capital)"
                                value={formatCurrency(stats.valorCapital)}
                                bold
                                tooltip="La parte de tu cuota que va directamente a tu ahorro."
                            />

                            {/* Gastos Admin (Usamos el % calculado en stats) */}
                            <RowItem
                                label={`Carga Admin (~${formatPercent(stats.pctAdminCalculado)})`}
                                value={`+ ${formatCurrency(data.carga_administrativa)}`}
                                tooltip="Gastos operativos y de gestión del proyecto."
                            />

                            {/* IVA (Usamos el % calculado en stats) */}
                            <RowItem
                                label={`IVA (~${formatPercent(stats.pctIvaCalculado)} s/ Admin)`}
                                value={`+ ${formatCurrency(data.iva_carga_administrativa)}`}
                            />

                            <Divider sx={{ borderStyle: 'dashed' }} />

                            {/* Total */}
                            <Box display="flex" justifyContent="space-between" alignItems="center"
                                sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2, borderRadius: 2, boxShadow: theme.shadows[3] }}>
                                <Typography variant="subtitle1" fontWeight={600}>Total a Pagar</Typography>
                                <Typography variant="h5" fontWeight={700}>{formatCurrency(data.valor_mensual_final)}</Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* --- COLUMNA DERECHA: PROYECCIONES --- */}
                    <Box sx={{ flex: 5, width: '100%' }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                            Proyección de Inversión
                        </Typography>

                        <Stack spacing={2} mt={1}>
                            <InfoCard
                                icon={<Calculate fontSize="small" />}
                                title="Inversión Total Estimada"
                                value={formatCurrency(stats.inversionTotalEstimada)}
                                subtitle={`Valor proyectado a ${resumen.meses_proyecto} cuotas`}
                                color="primary"
                            />

                            <InfoCard
                                icon={<TrendingUp fontSize="small" />}
                                title="Saldo Restante Estimado"
                                value={formatCurrency(stats.saldoRestanteEstimado)}
                                subtitle={`${stats.cuotasRestantes} cuotas pendientes`}
                                color="warning"
                            />

                            <InfoCard
                                icon={<Savings fontSize="small" />}
                                title="Capital Acumulado"
                                value={`${formatNumber(stats.capitalAcumuladoUnidades)} Unidades`}
                                subtitle={`Ahorrado en ${resumen.cuotas_pagadas} cuotas`}
                                color="success"
                            />
                        </Stack>

                        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                                <InfoOutlined fontSize="small" />
                                Nota: Los valores proyectados se ajustan automáticamente según el valor de mercado del producto base.
                            </Typography>
                        </Box>
                    </Box>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

// --- SUB-COMPONENTES ---

const RowItem = ({ label, value, bold = false, tooltip }: { label: string, value: string, bold?: boolean, tooltip?: string }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2" color="text.secondary" fontWeight={bold ? 700 : 400}>
                {label}
            </Typography>
            {tooltip && (
                <Tooltip title={tooltip} arrow>
                    <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
            )}
        </Box>
        <Typography variant="body2" fontWeight={bold ? 700 : 500} color={bold ? 'text.primary' : 'text.secondary'}>
            {value}
        </Typography>
    </Box>
);

const InfoCard = ({ icon, title, value, subtitle, color }: any) => {
    const theme = useTheme();
    // @ts-ignore
    const mainColor = theme.palette[color]?.main || theme.palette.primary.main;
    const bgColor = alpha(mainColor, 0.08);

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: bgColor, borderRadius: 2, border: `1px solid ${alpha(mainColor, 0.2)}` }}>
            <Box display="flex" gap={2}>
                <Box sx={{ color: mainColor, mt: 0.5 }}>{icon}</Box>
                <Box>
                    <Typography variant="caption" fontWeight={700} color={mainColor} textTransform="uppercase">
                        {title}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" lineHeight={1}>
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};
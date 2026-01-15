// src/pages/User/ResumenesCuenta/config/resumenColumns.tsx
import { Box, Stack, Avatar, Typography, LinearProgress, Chip, Button, alpha } from '@mui/material';
import { Business, Warning, CheckCircle, TrendingUp, Assessment } from '@mui/icons-material';

import { env } from '@/core/config/env';
import type { DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

// Helper local
const formatCurrency = (val: number) =>
    new Intl.NumberFormat(env.defaultLocale, { style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 }).format(val);

interface Actions {
    onViewDetail: (row: ResumenCuentaDto) => void;
}

export const getResumenColumns = (theme: any, actions: Actions): DataTableColumn<ResumenCuentaDto>[] => [
    {
        id: 'proyecto', label: 'Proyecto / Plan', minWidth: 220,
        render: (row) => (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                    <Business fontSize="small" />
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {row.proyecto_info?.nombre_proyecto || row.nombre_proyecto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Plan de {row.meses_proyecto} cuotas
                    </Typography>
                </Box>
            </Stack>
        )
    },
    {
        id: 'progreso', label: 'Progreso', minWidth: 200,
        render: (row) => (
            <Box sx={{ width: '100%' }}>
                <Box display="flex" justifyContent="space-between" mb={0.5} alignItems="center">
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {row.cuotas_pagadas} / {row.meses_proyecto}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                        {row.porcentaje_pagado.toFixed(1)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={row.porcentaje_pagado}
                    sx={{
                        height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: row.porcentaje_pagado >= 100 ? theme.palette.success.main : theme.palette.primary.main
                        }
                    }}
                />
            </Box>
        )
    },
    {
        id: 'estado', label: 'Estado', minWidth: 140,
        render: (row) => (
            <Stack direction="row" spacing={1}>
                {row.cuotas_vencidas > 0 ? (
                    <Chip icon={<Warning fontSize="small" />} label={`${row.cuotas_vencidas} Vencidas`} size="small" color="error" variant="filled" sx={{ fontWeight: 600 }} />
                ) : row.porcentaje_pagado >= 100 ? (
                    <Chip icon={<CheckCircle fontSize="small" />} label="Completado" size="small" color="success" variant="filled" sx={{ fontWeight: 600 }} />
                ) : (
                    <Chip label="Al día" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, borderColor: theme.palette.success.main, color: theme.palette.success.dark }} />
                )}
            </Stack>
        )
    },
    {
        id: 'valor_actual', label: 'Valor Actual', minWidth: 140,
        render: (row) => (
            <Stack alignItems="flex-end">
                <Typography variant="body2" fontWeight={800} color="text.primary">
                    {formatCurrency(row.detalle_cuota.valor_mensual_final)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 12, color: 'info.main' }} /> Actualizado
                </Typography>
            </Stack>
        )
    },
    {
        id: 'acciones', label: 'Acción', align: 'right', minWidth: 120,
        render: (row) => (
            <Button
                size="small" variant="outlined" startIcon={<Assessment />}
                onClick={() => actions.onViewDetail(row)}
                sx={{
                    borderRadius: 2, textTransform: 'none', color: 'text.secondary', borderColor: theme.palette.divider,
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
            >
                Detalle
            </Button>
        )
    }
];
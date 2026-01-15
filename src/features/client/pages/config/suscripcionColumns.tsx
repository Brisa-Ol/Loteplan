// src/pages/User/Suscripciones/config/suscripcionColumns.tsx
import { Box, Stack, Avatar, Typography, Chip, Tooltip, IconButton, Button, alpha } from '@mui/material';
import { Business, Token, EventRepeat, Visibility as VisibilityIcon, Cancel as CancelIcon, CheckCircle, EventBusy } from '@mui/icons-material';

import { env } from '@/core/config/env';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import type { DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';

// Helpers de formato locales (o impórtalos de un utils global)
const formatCurrency = (val: number) => new Intl.NumberFormat(env.defaultLocale, { style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 }).format(val);
const formatDate = (date: string) => new Date(date).toLocaleDateString(env.defaultLocale, { day: '2-digit', month: 'short', year: 'numeric' });

interface ActionsProps {
    onView: (id: number) => void;
    onCancel: (row: SuscripcionDto) => void;
}

// 1. Columnas Activas
export const getActiveColumns = (theme: any, actions: ActionsProps): DataTableColumn<SuscripcionDto>[] => [
    {
        id: 'proyecto', label: 'Proyecto', minWidth: 220,
        render: (row) => (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                    <Business fontSize="small" />
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                        {row.proyectoAsociado?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        ID: {row.id}
                    </Typography>
                </Box>
            </Stack>
        )
    },
    {
        id: 'tokens', label: 'Tokens', minWidth: 120,
        render: (row) => (
            <Chip 
                icon={<Token sx={{ fontSize: '14px !important' }} />} 
                label={`${row.tokens_disponibles ?? 0} Tokens`} size="small" variant="outlined" 
                sx={{ borderColor: theme.palette.info.main, color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.05), fontWeight: 600 }} 
            />
        )
    },
    {
        id: 'progreso', label: 'Progreso', minWidth: 150,
        render: (row) => (
            <Stack direction="row" alignItems="center" spacing={1}>
                <EventRepeat fontSize="small" color="action" />
                <Typography variant="body2">{row.meses_a_pagar} pendientes</Typography>
            </Stack>
        )
    },
    {
        id: 'total_pagado', label: 'Total Pagado', minWidth: 150,
        render: (row) => (
            <Box>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                    {formatCurrency(Number(row.monto_total_pagado))}
                </Typography>
                {Number(row.saldo_a_favor) > 0 && (
                    <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                        +{formatCurrency(Number(row.saldo_a_favor))} favor
                    </Typography>
                )}
            </Box>
        )
    },
    {
        id: 'estado', label: 'Estado', minWidth: 100,
        render: () => <Chip label="Activa" color="success" size="small" variant="filled" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ fontWeight: 600 }} />
    },
    {
        id: 'acciones', label: 'Acciones', align: 'right', minWidth: 180,
        render: (row) => (
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Ver detalle">
                    <IconButton size="small" onClick={() => actions.onView(row.id_proyecto)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar suscripción">
                    <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon fontSize="small" />} onClick={() => actions.onCancel(row)} sx={{ fontWeight: 600, textTransform: 'none' }}>
                        Cancelar
                    </Button>
                </Tooltip>
            </Stack>
        )
    }
];

// 2. Columnas Canceladas
export const getCanceledColumns = (theme: any): DataTableColumn<any>[] => [
    {
        id: 'proyecto', label: 'Proyecto', minWidth: 200,
        render: (row) => (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.text.disabled, 0.1), color: 'text.disabled' }}>
                    <Business fontSize="small" />
                </Avatar>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {row.proyecto?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
                </Typography>
            </Stack>
        )
    },
    {
        id: 'fecha_cancelacion', label: 'Fecha Baja', minWidth: 120,
        render: (row) => <Typography variant="body2" color="text.secondary">{formatDate(row.fecha_cancelacion)}</Typography>
    },
    {
        id: 'total_liquidado', label: 'Liquidado Total', minWidth: 150,
        render: (row) => (
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {formatCurrency(Number(row.monto_pagado_total))}
            </Typography>
        )
    },
    {
        id: 'estado', label: 'Estado', minWidth: 100,
        render: () => <Chip label="Cancelada" size="small" variant="outlined" icon={<EventBusy sx={{ fontSize: '14px !important' }} />} sx={{ borderColor: theme.palette.text.disabled, color: theme.palette.text.disabled, fontWeight: 500 }} />
    }
];
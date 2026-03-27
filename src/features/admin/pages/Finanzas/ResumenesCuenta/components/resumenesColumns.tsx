// src/features/admin/pages/Finanzas/resumenesColumns.tsx
import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import type { DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { StatusBadge } from '@/shared/components/domain/cards/StatCard';
import { Visibility } from '@mui/icons-material';
import { alpha, Avatar, Box, IconButton, LinearProgress, Stack, Tooltip, Typography, type Theme } from '@mui/material';

export const getResumenesColumns = (
    theme: Theme,
    isMobile: boolean,
    onVerDetalle: (resumen: ResumenCuentaDto) => void
): DataTableColumn<ResumenCuentaDto>[] => {
    const baseColumns: DataTableColumn<ResumenCuentaDto>[] = [
        {
            id: 'inversor',
            label: 'Inversor',
            minWidth: isMobile ? 160 : 250,
            render: (resumen) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        sx={{
                            width: isMobile ? 28 : 36,
                            height: isMobile ? 28 : 36,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontWeight: 800,
                            fontSize: isMobile ? '0.75rem' : '1rem',
                        }}
                    >
                        {resumen.suscripcion?.usuario?.nombre.charAt(0) ?? '?'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={800} noWrap>
                            {resumen.suscripcion?.usuario?.nombre} {resumen.suscripcion?.usuario?.apellido}
                        </Typography>
                        {!isMobile && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {resumen.suscripcion?.usuario?.email}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            ),
        },
        {
            id: 'porcentaje',
            label: '% Pagado',
            align: 'center',
            render: (resumen) => (
                <Stack spacing={0.5} alignItems="center">
                    <Typography variant="body2" fontWeight={800} color="primary.main">
                        {resumen.porcentaje_pagado.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(resumen.porcentaje_pagado, 100)}
                        sx={{ width: isMobile ? 40 : 60, height: 4, borderRadius: 2 }}
                    />
                </Stack>
            ),
        },
        {
            id: 'estado',
            label: 'Estado',
            render: (resumen) => {
                if (resumen.porcentaje_pagado >= 100) return <StatusBadge status="completed" customLabel="FINALIZADO" />;
                if (resumen.cuotas_vencidas > 0) return <StatusBadge status="failed" customLabel="CON DEUDA" />;
                return <StatusBadge status="in_progress" customLabel="EN CURSO" />;
            },
        },
        {
            id: 'acciones',
            label: '',
            align: 'right',
            render: (resumen) => (
                <Tooltip title="Ver Detalle">
                    <IconButton
                        size="small"
                        onClick={() => onVerDetalle(resumen)}
                        sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                    >
                        <Visibility fontSize="small" />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    // Agregamos la columna de proyecto solo si NO es móvil
    if (!isMobile) {
        baseColumns.splice(1, 0, {
            id: 'proyecto',
            label: 'Proyecto',
            render: (resumen: ResumenCuentaDto) => (
                <Box>
                    <Typography variant="body2" fontWeight={700} noWrap>{resumen.nombre_proyecto}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Plan {resumen.meses_proyecto} meses
                    </Typography>
                </Box>
            ),
        });
    }

    return baseColumns;
};
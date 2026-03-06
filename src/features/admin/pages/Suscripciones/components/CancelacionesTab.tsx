// src/pages/Admin/Suscripciones/components/CancelacionesTab.tsx

import {
    Cancel,
    Clear as ClearIcon,
    DateRange as DateIcon,
    MoneyOff,
    TrendingDown
} from '@mui/icons-material';
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';

// Servicios y Tipos
import SuscripcionService from '@/core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
// Sub-componentes locales
import { DataTable, FilterBar, FilterSearch, QueryHandler, StatCard, useModal, type DataTableColumn } from '@/shared';
import DetalleCancelacionModal from '../modals/DetalleCancelacionModal';

const CancelacionesTab: React.FC = () => {
    const theme = useTheme();

    // 1. Estados de Filtro
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState<string>(''); // Formato YYYY-MM-DD
    const [endDate, setEndDate] = useState<string>('');     // Formato YYYY-MM-DD

    // 2. Estado de Modal y Selección
    const detailModal = useModal();
    const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

    // 3. Queries
    const { data: cancelaciones = [], isLoading, error } = useQuery({
        queryKey: ['adminCancelaciones'],
        queryFn: async () => {
            const res = await SuscripcionService.getAllCanceladas();
            return ((res.data as any).data || res.data || []) as SuscripcionCanceladaDto[];
        },
    });

    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['adminCancelacionesMetrics'],
        queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
    });

    // 4. Cálculos (Aplicando los filtros de texto y fechas)
    const filteredCancelaciones = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        return cancelaciones.filter((item: SuscripcionCanceladaDto) => {
            // A. Filtro de Texto
            const user = item.usuarioCancelador;
            const userName = user ? `${user.nombre} ${user.apellido}`.toLowerCase() : '';
            const projName = (item.proyectoCancelado?.nombre_proyecto || '').toLowerCase();
            const matchesSearch = !term ||
                userName.includes(term) ||
                projName.includes(term) ||
                item.id.toString().includes(term) ||
                (user?.email?.toLowerCase() || '').includes(term);

            // B. Filtro de Rango de Fechas
            let matchesDate = true;
            if (item.fecha_cancelacion) {
                // Extraemos solo la porción YYYY-MM-DD para comparar correctamente
                const itemDateStr = new Date(item.fecha_cancelacion).toISOString().split('T')[0];

                if (startDate && itemDateStr < startDate) matchesDate = false;
                if (endDate && itemDateStr > endDate) matchesDate = false;
            }

            return matchesSearch && matchesDate;
        });
    }, [cancelaciones, searchTerm, startDate, endDate]);

    // 5. Recalcular KPIs basados en lo que se está viendo en pantalla
    const totalMontoLiquidado = useMemo(() => {
        return filteredCancelaciones.reduce((acc: number, curr: SuscripcionCanceladaDto) => {
            return acc + Number(curr.monto_pagado_total || 0);
        }, 0);
    }, [filteredCancelaciones]);

    const handleVerDetalle = useCallback((item: SuscripcionCanceladaDto) => {
        setSelectedCancelacion(item);
        detailModal.open();
    }, [detailModal]);

    // Lógica para el título dinámico de la tarjeta de liquidación
    const tituloMontoLiquidado = useMemo(() => {
        if (startDate && endDate) return `Liquidado (${new Date(startDate).toLocaleDateString('es-AR')} - ${new Date(endDate).toLocaleDateString('es-AR')})`;
        if (startDate) return `Liquidado (Desde ${new Date(startDate).toLocaleDateString('es-AR')})`;
        if (endDate) return `Liquidado (Hasta ${new Date(endDate).toLocaleDateString('es-AR')})`;
        return "Total Liquidado (Histórico)";
    }, [startDate, endDate]);

    const columns = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
        {
            id: 'id',
            label: 'ID / Fecha Baja',
            minWidth: 160,
            render: (item) => (
                <Box>
                    <Typography variant="body2" fontWeight={800}>#{item.id}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <DateIcon sx={{ fontSize: 14, color: 'error.main' }} />
                        <Typography variant="caption" color="error.main" fontWeight={800}>
                            {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </Typography>
                    </Stack>
                </Box>
            )
        },
        {
            id: 'usuario',
            label: 'Ex-Titular',
            minWidth: 200,
            render: (item) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                        {item.usuarioCancelador?.nombre?.charAt(0)}
                    </Avatar>
                    <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                            {item.usuarioCancelador?.nombre} {item.usuarioCancelador?.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            @{item.usuarioCancelador?.nombre_usuario}
                        </Typography>
                    </Box>
                </Stack>
            )
        },
        {
            id: 'proyecto',
            label: 'Permanencia',
            minWidth: 180,
            render: (item) => (
                <Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                        {item.proyectoCancelado?.nombre_proyecto}
                    </Typography>
                    <Chip
                        label={`${item.meses_pagados} meses pagados`} // Campo: meses_pagados
                        size="small"
                        sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 800 }}
                    />
                </Box>
            )
        },
        {
            id: 'monto',
            label: 'Liquidación Final',
            render: (item) => (
                <Typography variant="body2" fontWeight={800} color="error.main" sx={{ fontFamily: 'monospace' }}>
                    ${Number(item.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
            )
        }
    ], [theme, handleVerDetalle]);

    return (
        <Box>
            {/* KPIs */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                gap: 2, mb: 4
            }}>
                <StatCard
                    title="Bajas Filtradas"
                    value={(!startDate && !endDate && !searchTerm) ? (metrics?.total_canceladas || 0) : filteredCancelaciones.length}
                    color="error"
                    icon={<Cancel />}
                    loading={loadingMetrics}
                />
                <StatCard
                    title="Tasa de Churn"
                    value={`${metrics?.tasa_cancelacion || 0}%`}
                    color="warning"
                    icon={<TrendingDown />}
                    loading={loadingMetrics}
                />
                <StatCard
                    title={tituloMontoLiquidado}
                    value={`$${totalMontoLiquidado.toLocaleString('es-AR')}`}
                    color="info"
                    icon={<MoneyOff />}
                    loading={isLoading}
                />
            </Box>

            {/* BARRA DE FILTROS ACTUALIZADA */}
            <FilterBar>
                <FilterSearch
                    placeholder="Buscar por ex-titular, proyecto o ID..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    sx={{ minWidth: { xs: '100%', md: 300 } }}
                />

                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: { xs: 2, md: 0 } }}>
                    <TextField
                        label="Desde"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <TextField
                        label="Hasta"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        inputProps={{ min: startDate }} // Bloquea seleccionar una fecha fin menor a la de inicio
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    {(startDate || endDate) && (
                        <Button
                            color="error"
                            size="small"
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            startIcon={<ClearIcon />}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Limpiar Fechas
                        </Button>
                    )}
                </Stack>
            </FilterBar>

            {/* TABLA */}
            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columns}
                        data={filteredCancelaciones}
                        getRowKey={(row) => row.id}
                        pagination
                        defaultRowsPerPage={10}
                        emptyMessage="No se encontraron registros de cancelaciones para los filtros seleccionados."
                    />
                </Paper>
            </QueryHandler>

            <DetalleCancelacionModal
                open={detailModal.isOpen}
                onClose={detailModal.close}
                cancelacion={selectedCancelacion}
            />
        </Box>
    );
};

export default CancelacionesTab;
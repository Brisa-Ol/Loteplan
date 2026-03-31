// src/features/admin/pages/Suscripciones/components/CancelacionesTab.tsx

import SuscripcionService from '@/core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto } from '@/core/types/suscripcion.dto';
import { BaseModal, DataTable, FilterBar, FilterSearch, QueryHandler, StatCard, useModal, type DataTableColumn } from '@/shared';
import { Cancel, CheckCircle, Clear as ClearIcon, MoneyOff, ReportProblem, TrendingDown, Visibility } from '@mui/icons-material';
import { alpha, Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import useCancelacionesColumns from '../hooks/useCancelacionesColumns';
import DetalleCancelacionModal from '../modals/DetalleCancelacionModal/DetalleCancelacionModal';

// Estilos compartidos para los inputs de fecha (ícono del calendario en naranja #CC6333)
const dateInputStyles = {
    width: { xs: '50%', sm: 140 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    '& input::-webkit-calendar-picker-indicator': {
        cursor: 'pointer',
        filter: 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)'
    }
};

const CancelacionesTab: React.FC = () => {
    const theme = useTheme();
    const detailModal = useModal();
    const baseColumns = useCancelacionesColumns();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

    // Estados para el modal de confirmación de devolución
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [refundTargetId, setRefundTargetId] = useState<number | null>(null);

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

    // Mutación para marcar la devolución
    const { mutate: marcarDevolucion, isPending: isMutating } = useMutation({
        mutationFn: (id: number) => SuscripcionService.marcarDevolucion(id),
        onSuccess: () => {
            setRefundModalOpen(false);
            setRefundTargetId(null);
            window.location.reload();
        },
    });

    const filteredCancelaciones = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return cancelaciones.filter((item) => {
            const user = item.usuarioCancelador;
            const userName = user ? `${user.nombre} ${user.apellido}`.toLowerCase() : '';
            const projName = (item.proyectoCancelado?.nombre_proyecto || '').toLowerCase();
            const matchesSearch = !term || userName.includes(term) || projName.includes(term) || item.id.toString().includes(term) || (user?.email?.toLowerCase() || '').includes(term);

            let matchesDate = true;
            if (item.fecha_cancelacion) {
                const itemDateStr = new Date(item.fecha_cancelacion).toISOString().split('T')[0];
                if (startDate && itemDateStr < startDate) matchesDate = false;
                if (endDate && itemDateStr > endDate) matchesDate = false;
            }
            return matchesSearch && matchesDate;
        });
    }, [cancelaciones, searchTerm, startDate, endDate]);

    const totalMontoLiquidado = useMemo(() =>
        filteredCancelaciones.reduce((acc, curr) => acc + Number(curr.monto_pagado_total || 0), 0),
        [filteredCancelaciones]
    );

    const tituloMontoLiquidado = useMemo(() => {
        if (startDate && endDate) return `Liquidado (${new Date(startDate).toLocaleDateString('es-AR')} - ${new Date(endDate).toLocaleDateString('es-AR')})`;
        if (startDate) return `Liquidado (Desde ${new Date(startDate).toLocaleDateString('es-AR')})`;
        if (endDate) return `Liquidado (Hasta ${new Date(endDate).toLocaleDateString('es-AR')})`;
        return 'Total Liquidado (Histórico)';
    }, [startDate, endDate]);

    const handleVerDetalle = useCallback((item: SuscripcionCanceladaDto) => {
        setSelectedCancelacion(item);
        detailModal.open();
    }, [detailModal]);


    // ✅ SEPARACIÓN DE COLUMNAS: ID Y FECHA BAJA SIN NEGRITA
    const columnsWithDevolucion = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => {
        const filteredColumns = baseColumns.filter(c => c.id !== 'id' && c.id !== 'fecha_cancelacion');

        return [
            {
                id: 'id',
                label: 'ID',
                minWidth: 70,
                render: (row) => (
                    <Typography variant="body1" fontWeight={800} color="text.primary">
                        #{row.id}
                    </Typography>
                )
            },
            {
                id: 'fecha_cancelacion',
                label: 'Fecha Baja',
                minWidth: 120,
                render: (row) => {
                    if (!row.fecha_cancelacion) {
                        return <Typography variant="body2" color="text.secondary">---</Typography>;
                    }
                    const dateObj = new Date(row.fecha_cancelacion);
                    return (
                        <Box>
                            {/* 👇 Aquí le quitamos el fontWeight 800 para que se vea normal */}
                            <Typography variant="body2" color="text.primary" fontWeight={500}>
                                {dateObj.toLocaleDateString('es-AR')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.8rem' }}>
                                {dateObj.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </Typography>
                        </Box>
                    );
                }
            },
            ...filteredColumns,
            {
                id: 'devolucion',
                label: 'Devolución',
                render: (row: SuscripcionCanceladaDto) => {
                    if (row.devolucion_realizada) {
                        return (
                            <Chip
                                icon={<CheckCircle />}
                                label="Devuelto"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        );
                    }

                    return (
                        <Button
                            variant="contained"
                            size="small"
                            disabled={isMutating}
                            onClick={(e) => {
                                e.stopPropagation();
                                setRefundTargetId(row.id);
                                setRefundModalOpen(true);
                            }}
                            sx={{ bgcolor: '#CC6333', color: 'white', '&:hover': { bgcolor: '#b5582e' }, fontWeight: 600, boxShadow: 'none' }}
                        >
                            Reintegrar
                        </Button>
                    );
                },
            },
            {
                id: 'acciones',
                label: '',
                align: 'right' as const,
                render: (row: SuscripcionCanceladaDto) => (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVerDetalle(row);
                        }}
                        size="small"
                        sx={{ color: '#CC6333', bgcolor: alpha('#CC6333', 0.08), ml: 1 }}
                    >
                        <Visibility fontSize="small" />
                    </IconButton>
                )
            }
        ];
    }, [baseColumns, isMutating, handleVerDetalle, theme]);

    const isFiltered = !!(startDate || endDate || searchTerm);

    return (
        <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
                <StatCard title="Bajas Filtradas" value={!isFiltered ? (metrics?.total_canceladas || 0) : filteredCancelaciones.length} color="error" icon={<Cancel />} loading={loadingMetrics} />
                <StatCard title="Tasa de Churn" value={`${metrics?.tasa_cancelacion || 0}%`} color="warning" icon={<TrendingDown />} loading={loadingMetrics} />
                <StatCard title={tituloMontoLiquidado} value={`$${totalMontoLiquidado.toLocaleString('es-AR')}`} color="info" icon={<MoneyOff />} loading={isLoading} />
            </Box>

            <FilterBar sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>
                    
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
                        <FilterSearch
                            placeholder="Buscar por ex-titular, proyecto o ID..."
                            value={searchTerm} 
                            onSearch={setSearchTerm}
                            fullWidth
                        />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', lg: 'flex-end' } }}>
                        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <TextField 
                                label="Desde" 
                                type="date" 
                                size="small" 
                                InputLabelProps={{ shrink: true }}
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                sx={dateInputStyles}
                            />
                            <TextField 
                                label="Hasta" 
                                type="date" 
                                size="small" 
                                InputLabelProps={{ shrink: true }}
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                inputProps={{ min: startDate }} 
                                sx={dateInputStyles}
                            />
                        </Stack>

                        <Tooltip title="Limpiar filtros">
                            <IconButton 
                                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }} 
                                size="small" 
                                sx={{ 
                                    bgcolor: alpha(theme.palette.error.main, 0.08), 
                                    color: 'error.main', 
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) },
                                    height: 40, width: 40
                                }}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </FilterBar>

            <QueryHandler isLoading={isLoading} error={error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columnsWithDevolucion}
                        data={filteredCancelaciones}
                        getRowKey={(row) => row.id}
                        onRowClick={handleVerDetalle}
                        pagination defaultRowsPerPage={10}
                        emptyMessage="No se encontraron registros de cancelaciones para los filtros seleccionados."
                    />
                </Paper>
            </QueryHandler>

            <DetalleCancelacionModal
                open={detailModal.isOpen}
                onClose={detailModal.close}
                cancelacion={selectedCancelacion}
            />

            <BaseModal
                open={refundModalOpen}
                onClose={() => !isMutating && setRefundModalOpen(false)}
                title="Confirmar Reintegro"
                subtitle="Registro definitivo de devolución"
                icon={<ReportProblem />}
                headerColor="warning"
                confirmText="Confirmar Devolución"
                confirmButtonColor="warning"
                onConfirm={() => refundTargetId && marcarDevolucion(refundTargetId)}
                isLoading={isMutating}
                disableConfirm={isMutating}
                maxWidth="sm"
            >
                <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                    ¿Estás seguro de que deseas marcar esta suscripción como devuelta? Esta acción registrará de manera permanente que el dinero ya fue transferido al cliente y <strong>no se puede deshacer</strong>.
                </Typography>
            </BaseModal>
        </Box>
    );
};

export default CancelacionesTab;
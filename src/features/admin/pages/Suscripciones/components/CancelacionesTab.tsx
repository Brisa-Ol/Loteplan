// src/features/admin/pages/Suscripciones/components/CancelacionesTab.tsx

import SuscripcionService from '@/core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto } from '@/core/types/suscripcion.dto';
import { BaseModal, DataTable, FilterBar, FilterSearch, QueryHandler, StatCard, useModal } from '@/shared';
import { Cancel, CheckCircle, Clear as ClearIcon, MoneyOff, ReportProblem, TrendingDown } from '@mui/icons-material';
import { Box, Button, Chip, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import useCancelacionesColumns from '../hooks/useCancelacionesColumns';
import DetalleCancelacionModal from '../modals/DetalleCancelacionModal/DetalleCancelacionModal';

const CancelacionesTab: React.FC = () => {
    const theme = useTheme();
    const detailModal = useModal();
    const baseColumns = useCancelacionesColumns();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

    // ✅ Estados para el modal de confirmación de devolución
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

    // ✅ Mutación para marcar la devolución (ACTUALIZADA PARA RECARGAR LA PÁGINA)
    const { mutate: marcarDevolucion, isPending: isMutating } = useMutation({
        mutationFn: (id: number) => SuscripcionService.marcarDevolucion(id),
        onSuccess: () => {
            setRefundModalOpen(false);
            setRefundTargetId(null);
            window.location.reload(); // <-- Aquí recarga la página al confirmar
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

    // ✅ Columnas extendidas con Botón / Check
    const columnsWithDevolucion = useMemo(() => [
        ...baseColumns,
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
                        color="primary"
                        size="small"
                        disabled={isMutating}
                        onClick={(e) => {
                            e.stopPropagation(); // Evita que se abra el modal de detalle de la fila
                            setRefundTargetId(row.id);
                            setRefundModalOpen(true);
                        }}
                    >
                        Reintegrar
                    </Button>
                );
            },
        }
    ], [baseColumns, isMutating]);

    const isFiltered = !!(startDate || endDate || searchTerm);

    return (
        <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
                <StatCard title="Bajas Filtradas" value={!isFiltered ? (metrics?.total_canceladas || 0) : filteredCancelaciones.length} color="error" icon={<Cancel />} loading={loadingMetrics} />
                <StatCard title="Tasa de Churn" value={`${metrics?.tasa_cancelacion || 0}%`} color="warning" icon={<TrendingDown />} loading={loadingMetrics} />
                <StatCard title={tituloMontoLiquidado} value={`$${totalMontoLiquidado.toLocaleString('es-AR')}`} color="info" icon={<MoneyOff />} loading={isLoading} />
            </Box>

            <FilterBar>
                <FilterSearch
                    placeholder="Buscar por ex-titular, proyecto o ID..."
                    value={searchTerm} onSearch={setSearchTerm}
                    sx={{ minWidth: { xs: '100%', md: 300 } }}
                />
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: { xs: 2, md: 0 } }}>
                    <TextField label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }}
                        value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <TextField label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }}
                        value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        inputProps={{ min: startDate }} sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    {(startDate || endDate) && (
                        <Button color="error" size="small" startIcon={<ClearIcon />}
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Limpiar Fechas
                        </Button>
                    )}
                </Stack>
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

            {/* ✅ BaseModal implementado para la Confirmación de Devolución */}
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
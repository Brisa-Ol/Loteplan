// src/pages/Admin/Suscripciones/components/CancelacionesTab.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Avatar, Stack, IconButton, useTheme, alpha,
    Paper
} from '@mui/material';
import {
    Visibility, TrendingDown, MoneyOff, Cancel,
    DateRange as DateIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Servicios y Tipos
import SuscripcionService from '@/core/api/services/suscripcion.service';
import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';

// Componentes Shared e Hooks
import { useModal } from '@/shared/hooks/useModal';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSearch } from '@/shared/components/forms/filters/FilterBar';

// Sub-componentes locales
import DetalleCancelacionModal from './DetalleCancelacionModal';

const CancelacionesTab: React.FC = () => {
    const theme = useTheme();

    // 1. Estados de Filtro
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Estado de Modal y Selección
    const detailModal = useModal();
    const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

    // 3. Queries
    const { data: cancelaciones = [], isLoading, error } = useQuery({
        queryKey: ['adminCancelaciones'],
        queryFn: async () => {
            const res = await SuscripcionService.getAllCanceladas();
            // Adaptación de respuesta para asegurar que sea un array de SuscripcionCanceladaDto
            return ((res.data as any).data || res.data || []) as SuscripcionCanceladaDto[];
        },
    });

    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['adminCancelacionesMetrics'],
        queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
    });

    // 4. Cálculos ✅ TIPADO: (acc: number, curr: SuscripcionCanceladaDto)
    const totalMontoLiquidado = useMemo(() => {
        return cancelaciones.reduce((acc: number, curr: SuscripcionCanceladaDto) => {
            return acc + Number(curr.monto_pagado_total || 0);
        }, 0);
    }, [cancelaciones]);

    // ✅ TIPADO: item: SuscripcionCanceladaDto
    const filteredCancelaciones = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return cancelaciones;

        return cancelaciones.filter((item: SuscripcionCanceladaDto) => {
            const user = item.usuarioCancelador;
            const userName = user ? `${user.nombre} ${user.apellido}` : '';
            const projName = item.proyectoCancelado?.nombre_proyecto || '';
            
            return userName.toLowerCase().includes(term) || 
                   projName.toLowerCase().includes(term) || 
                   item.id.toString().includes(term) ||
                   user?.email?.toLowerCase().includes(term);
        });
    }, [cancelaciones, searchTerm]);

    const handleVerDetalle = useCallback((item: SuscripcionCanceladaDto) => {
        setSelectedCancelacion(item);
        detailModal.open();
    }, [detailModal]);

    // 5. Columnas ✅ TIPADO: (item: SuscripcionCanceladaDto)
    const columns = useMemo<DataTableColumn<SuscripcionCanceladaDto>[]>(() => [
        {
            id: 'id',
            label: 'ID / Fecha',
            minWidth: 140,
            render: (item: SuscripcionCanceladaDto) => (
                <Box>
                    <Typography variant="body2" fontWeight={800}>#{item.id}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR')}
                        </Typography>
                    </Stack>
                </Box>
            )
        },
        {
            id: 'usuario',
            label: 'Ex-Titular',
            minWidth: 220,
            render: (item: SuscripcionCanceladaDto) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ 
                        width: 32, height: 32, 
                        bgcolor: alpha(theme.palette.error.main, 0.1), 
                        color: 'error.main',
                        fontSize: 12, fontWeight: 700
                    }}>
                        {item.usuarioCancelador?.nombre?.charAt(0) || 'U'}
                    </Avatar>
                    <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                            {item.usuarioCancelador ? `${item.usuarioCancelador.nombre} ${item.usuarioCancelador.apellido}` : 'Usuario Eliminado'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {item.usuarioCancelador?.email || `ID: ${item.id_usuario}`}
                        </Typography>
                    </Box>
                </Stack>
            )
        },
        {
            id: 'proyecto',
            label: 'Proyecto',
            render: (item: SuscripcionCanceladaDto) => (
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {item.proyectoCancelado?.nombre_proyecto || 'Desconocido'}
                </Typography>
            )
        },
        {
            id: 'monto',
            label: 'Liquidación',
            render: (item: SuscripcionCanceladaDto) => (
                <Typography variant="body2" fontWeight={800} color="error.main" sx={{ fontFamily: 'monospace' }}>
                    ${Number(item.monto_pagado_total).toLocaleString('es-AR')}
                </Typography>
            )
        },
        {
            id: 'acciones',
            label: '',
            align: 'right',
            render: (item: SuscripcionCanceladaDto) => (
                <IconButton 
                    size="small" 
                    onClick={() => handleVerDetalle(item)}
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                >
                    <Visibility fontSize="small" color="primary" />
                </IconButton>
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
                    title="Bajas Totales" 
                    value={metrics?.total_canceladas || 0} 
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
                    title="Total Liquidado" 
                    value={`$${totalMontoLiquidado.toLocaleString('es-AR')}`} 
                    color="info" 
                    icon={<MoneyOff />} 
                    loading={isLoading} 
                />
            </Box>

            {/* BARRA DE FILTROS */}
            <FilterBar>
                <FilterSearch 
                    placeholder="Buscar por ex-titular, proyecto o ID de baja..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                />
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
                        emptyMessage="No se encontraron registros de cancelaciones."
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
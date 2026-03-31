// src/features/admin/pages/Suscripciones/components/SuscripcionesActiveTab.tsx

import type { useAdminSuscripciones } from '@/features/admin/hooks/finanzas/useAdminSuscripciones';
import {
    ConfirmDialog, DataTable, FilterBar, FilterSearch,
    FilterSelect, MetricsGrid, QueryHandler, StatCard,
} from '@/shared';
import {
    CheckCircle, Groups, TrendingDown, WarningAmber
} from '@mui/icons-material';
import { Box, MenuItem, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';

import useSuscripcionesColumns from '../hooks/useSuscripcionesColumns';
import DetalleSuscripcionModal from '../modals/DetalleSuscripcionModal/DetalleSuscripcionModal';


const dateInputStyles = {
    width: { xs: '50%', sm: 140 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    '& input::-webkit-calendar-picker-indicator': {
        cursor: 'pointer',
        filter: 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)'
    }
};

const PROYECTO_MENU_PROPS = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    disableScrollLock: true,
    PaperProps: {
        sx: {
            mt: 1.4, maxHeight: 300, borderRadius: '12px', minWidth: 280,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': { fontSize: '0.85rem', py: 1 },
        },
    },
};

interface Props {
    logic: ReturnType<typeof useAdminSuscripciones>;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
}

const SuscripcionesActiveTab: React.FC<Props> = ({
    logic,
    startDate,
    setStartDate,
    endDate,
    setEndDate
}) => {
    const theme = useTheme();
    const columns = useSuscripcionesColumns(logic);

    const suscripcionesSoloActivas = useMemo(() => {
        return logic.filteredSuscripciones.filter((s) => s.activo === true);
    }, [logic.filteredSuscripciones]);

    // Función para limpiar filtros
    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        logic.setSearchTerm('');
        logic.setFilterProject('all');
    };

    return (
        <Box>
            <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
                <StatCard title="Total Registros" value={logic.stats.totalSuscripciones} icon={<Groups />} color="primary" loading={logic.isLoadingStats} />
                <StatCard title="Activas" value={logic.stats.totalActivas} icon={<CheckCircle />} color="success" loading={logic.isLoadingStats} />
                <StatCard title="Morosidad" value={`${logic.stats.tasaMorosidad}%`} icon={<WarningAmber />} color="error" loading={logic.isLoadingStats} />
                <StatCard title="Churn Rate" value={`${logic.stats.tasaCancelacion}%`} icon={<TrendingDown />} color="warning" loading={logic.isLoadingStats} />
            </MetricsGrid>

            {/* Ajustamos el FilterBar para que sea completamente responsivo */}
            <FilterBar sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>

                    {/* Buscador: Ocupa el espacio restante en desktop */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
                        <FilterSearch
                            placeholder="Buscar por titular, email o proyecto..."
                            value={logic.searchTerm}
                            onSearch={logic.setSearchTerm}
                            fullWidth
                        />
                    </Box>

                    {/* Controles de fecha, selector y botón limpiar */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', lg: 'flex-end' } }}>

                        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <TextField
                                type="date"
                                label="Desde"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                sx={dateInputStyles}
                            />
                            <TextField
                                type="date"
                                label="Hasta"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                sx={dateInputStyles}
                            />
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, alignItems: 'center' }}>
                            <FilterSelect
                                label="Proyecto"
                                value={logic.filterProject}
                                onChange={(e: any) => logic.setFilterProject(e.target.value)}
                                SelectProps={{ MenuProps: PROYECTO_MENU_PROPS }}
                                sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}
                            >
                                <MenuItem value="all">Todos los proyectos</MenuItem>
                                {logic.proyectos
                                    .filter((p: any) => p.tipo_inversion === 'mensual')
                                    .map((p: any) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%">
                                                <Typography variant="body2">{p.nombre_proyecto}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                            </FilterSelect>

                        </Box>
                    </Box>
                </Box>
            </FilterBar>

            <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columns}
                        // ✅ Usamos la lista filtrada que solo tiene activas (y que ya viene filtrada por fecha desde el padre)
                        data={suscripcionesSoloActivas}
                        getRowKey={(s) => s.id}
                        highlightedRowId={logic.highlightedId}
                        emptyMessage="No se encontraron suscripciones activas."
                        pagination
                    />
                </Paper>
            </QueryHandler>

            <DetalleSuscripcionModal
                open={logic.modales.detail.isOpen}
                onClose={logic.handleCerrarModal}
                suscripcion={logic.selectedSuscripcion}
            />
            <ConfirmDialog
                controller={logic.modales.confirm}
                onConfirm={logic.handleConfirmAction}
                isLoading={logic.isCancelling}
            />
        </Box>
    );
};

export default SuscripcionesActiveTab;
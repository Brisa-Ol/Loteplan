// src/features/admin/pages/Suscripciones/components/SuscripcionesActiveTab.tsx

import type { useAdminSuscripciones } from '@/features/admin/hooks/finanzas/useAdminSuscripciones';
import {
    ConfirmDialog, DataTable, FilterBar, FilterSearch,
    FilterSelect, MetricsGrid, QueryHandler, StatCard,
} from '@/shared';
import {
    CheckCircle, Groups, TrendingDown, WarningAmber,
} from '@mui/icons-material';
import { Box, MenuItem, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

import useSuscripcionesColumns from '../hooks/useSuscripcionesColumns';
import DetalleSuscripcionModal from '../modals/DetalleSuscripcionModal/DetalleSuscripcionModal';

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
}

const SuscripcionesActiveTab: React.FC<Props> = ({ logic }) => {
    const theme = useTheme();
    const columns = useSuscripcionesColumns(logic);

    return (
        <Box>
            <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
                <StatCard title="Total Registros" value={logic.stats.totalSuscripciones} icon={<Groups />} color="primary" loading={logic.isLoadingStats} />
                <StatCard title="Activas" value={logic.stats.totalActivas} icon={<CheckCircle />} color="success" loading={logic.isLoadingStats} />
                <StatCard title="Morosidad" value={`${logic.stats.tasaMorosidad}%`} icon={<WarningAmber />} color="error" loading={logic.isLoadingStats} />
                <StatCard title="Churn Rate" value={`${logic.stats.tasaCancelacion}%`} icon={<TrendingDown />} color="warning" loading={logic.isLoadingStats} />
            </MetricsGrid>

            <FilterBar>
                <FilterSearch
                    placeholder="Buscar por titular, email o proyecto..."
                    value={logic.searchTerm}
                    onSearch={logic.setSearchTerm}
                />
                <FilterSelect
                    label="Proyecto"
                    value={logic.filterProject}
                    onChange={(e: any) => logic.setFilterProject(e.target.value)}
                    SelectProps={{ MenuProps: PROYECTO_MENU_PROPS }}
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
            </FilterBar>

            <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <DataTable
                        columns={columns}
                        data={logic.filteredSuscripciones}
                        getRowKey={(s) => s.id}
                        isRowActive={(s) => !!s.activo}
                        showInactiveToggle={false}
                        highlightedRowId={logic.highlightedId}
                        emptyMessage="No se encontraron registros activos."
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
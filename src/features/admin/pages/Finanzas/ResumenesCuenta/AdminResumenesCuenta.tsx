// src/features/admin/pages/Finanzas/AdminResumenesCuenta.tsx
import { Assignment as AssignmentIcon, AttachMoney, Schedule, Warning } from '@mui/icons-material';
import { Box, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import React, { useMemo } from 'react';

import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import { useAdminResumenes } from '@/features/admin/hooks/finanzas/useAdminResumenes';
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/FilterBar';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { getResumenesColumns } from './components/resumenesColumns';
import DetalleResumenModal from './modals/DetalleResumenModal';

// Derived stats from filtered data
const useResumenStats = (data: ResumenCuentaDto[]) =>
  useMemo(() => ({
    totalCuentas: data.length,
    cuentasVencidas: data.filter((r) => r.cuotas_vencidas > 0 && r.porcentaje_pagado < 100).length,
    deudaEstimada: data.reduce((acc, r) => acc + r.cuotas_vencidas * r.detalle_cuota.valor_mensual_final, 0),
    cuentasConAdelantos: data.filter((r) => (r.meses_proyecto - r.cuotas_pagadas - r.cuotas_vencidas > 0) && r.porcentaje_pagado < 100).length,
  }), [data]);

const AdminResumenesCuenta: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const logic = useAdminResumenes();
  const stats = useResumenStats(logic.filteredResumenes);

  // Las columnas ahora se generan con una sola línea
  const columns = useMemo(() => getResumenesColumns(theme, isMobile, logic.handleVerDetalle), [theme, isMobile, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      <AdminPageHeader
        title="Resúmenes de Cuenta"
        subtitle="Control de progreso de cobranza y estado financiero."
      />

      <MetricsGrid columns={{ xs: 2, sm: 2, lg: 4 }}>
        <StatCard title="Total Cuentas" value={stats.totalCuentas} icon={<AssignmentIcon />} color="primary" loading={logic.isLoading} />
        <StatCard title="Deuda Estimada" value={`$${stats.deudaEstimada.toLocaleString('es-AR')}`} icon={<AttachMoney />} color="error" loading={logic.isLoading} />
        <StatCard title="Cuentas Vencidas" value={stats.cuentasVencidas} icon={<Warning />} color="warning" loading={logic.isLoading} />
        <StatCard title="Con Adelantos" value={stats.cuentasConAdelantos} icon={<Schedule />} color="info" loading={logic.isLoading} />
      </MetricsGrid>

      {/* 4. CONTROLES Y FILTROS Estandarizados */}
      <Box sx={{ mt: 4, mb: 3 }}>
        <FilterBar sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: '100%' }}>
            
            {/* Buscador */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}>
              <FilterSearch 
                placeholder="Buscar..." 
                value={logic.searchTerm} 
                onSearch={logic.setSearchTerm} 
                fullWidth
              />
            </Box>

            {/* Select de Estado */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
              <FilterSelect 
                label="Estado" 
                value={logic.filterState} 
                onChange={(e) => logic.setFilterState(e.target.value as any)}
                sx={{ minWidth: 200, flex: { xs: 1, sm: 'none' } }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="overdue">Con Deuda</MenuItem>
                <MenuItem value="completed">Completados</MenuItem>
                <MenuItem value="pending">Con Adelantos</MenuItem>
              </FilterSelect>
            </Box>

          </Box>
        </FilterBar>
      </Box>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable columns={columns} data={logic.filteredResumenes} getRowKey={(row) => row.id} pagination />
      </QueryHandler>

      {logic.selectedResumen && (
        <DetalleResumenModal open={logic.detalleModal.isOpen} onClose={logic.handleCloseModal} resumen={logic.selectedResumen} />
      )}
    </PageContainer>
  );
};

export default AdminResumenesCuenta;
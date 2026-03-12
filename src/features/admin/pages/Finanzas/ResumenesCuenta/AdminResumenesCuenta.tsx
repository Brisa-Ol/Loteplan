// src/features/admin/pages/Finanzas/AdminResumenesCuenta.tsx
import {
  Assignment as AssignmentIcon,
  AttachMoney,
  Schedule,
  ViewList,
  Visibility,
  Warning,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import { useAdminResumenes } from '@/features/admin/hooks/finanzas/useAdminResumenes';
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/FilterBar';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import DetalleResumenModal from './modals/DetalleResumenModal';

// Derived stats from filtered data
const useResumenStats = (data: ResumenCuentaDto[]) =>
  useMemo(() => ({
    totalCuentas: data.length,
    cuentasVencidas: data.filter(
      (r) => r.cuotas_vencidas > 0 && r.porcentaje_pagado < 100
    ).length,
    deudaEstimada: data.reduce(
      (acc, r) => acc + r.cuotas_vencidas * r.detalle_cuota.valor_mensual_final,
      0
    ),
    cuentasConAdelantos: data.filter(
      (r) =>
        r.meses_proyecto - r.cuotas_pagadas - r.cuotas_vencidas > 0 &&
        r.porcentaje_pagado < 100
    ).length,
  }), [data]);

const AdminResumenesCuenta: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const logic = useAdminResumenes();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const stats = useResumenStats(logic.filteredResumenes);

  const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
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
    // Hidden on mobile — info collapses into the detail modal
    ...(!isMobile ? [{
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
    }] : []),
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
        if (resumen.porcentaje_pagado >= 100)
          return <StatusBadge status="completed" customLabel="FINALIZADO" />;
        if (resumen.cuotas_vencidas > 0)
          return <StatusBadge status="failed" customLabel="CON DEUDA" />;
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
            onClick={() => logic.handleVerDetalle(resumen)}
            sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [theme, isMobile, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      <AdminPageHeader
        title="Resúmenes de Cuenta"
        subtitle="Control de progreso de cobranza y estado financiero."
      />

      <MetricsGrid columns={{ xs: 2, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Cuentas"
          value={stats.totalCuentas}
          icon={<AssignmentIcon />}
          color="primary"
          loading={logic.isLoading}
        />
        <StatCard
          title="Deuda Estimada"
          value={`$${stats.deudaEstimada.toLocaleString('es-AR')}`}
          icon={<AttachMoney />}
          color="error"
          loading={logic.isLoading}
        />
        <StatCard
          title="Cuentas Vencidas"
          value={stats.cuentasVencidas}
          icon={<Warning />}
          color="warning"
          loading={logic.isLoading}
        />
        <StatCard
          title="Con Adelantos"
          value={stats.cuentasConAdelantos}
          icon={<Schedule />}
          color="info"
          loading={logic.isLoading}
        />
      </MetricsGrid>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mt: 3, mb: 3 }}
      >
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          options={[{ value: 'table', label: 'Tabla', icon: <ViewList fontSize="small" /> }]}
        />
        <FilterBar sx={{ flex: 1 }}>
          <FilterSearch
            placeholder="Buscar..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
          />
          <FilterSelect
            label="Estado"
            value={logic.filterState}
            onChange={(e) => logic.setFilterState(e.target.value as any)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="overdue">Con Deuda</MenuItem>
            <MenuItem value="completed">Completados</MenuItem>
            <MenuItem value="pending">Con Adelantos</MenuItem>
          </FilterSelect>
        </FilterBar>
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.filteredResumenes}
          getRowKey={(row) => row.id}
          pagination
        />
      </QueryHandler>

      {logic.selectedResumen && (
        <DetalleResumenModal
          open={logic.detalleModal.isOpen}
          onClose={logic.handleCloseModal}
          resumen={logic.selectedResumen}
        />
      )}
    </PageContainer>
  );
};

export default AdminResumenesCuenta;
import {
  AccessTime, AccountBalanceWallet, Assignment as AssignmentIcon,
  AttachMoney, BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ViewList,
  Visibility,
  Warning
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, IconButton, LinearProgress, MenuItem,
  Stack, Tooltip, Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';


import type { ResumenCuentaDto } from '@/core/types/dto/resumenCuenta.dto';

// Componentes Compartidos
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { useAdminResumenes } from '@/features/admin/hooks/useAdminResumenes';
import DetalleResumenModal from './modals/DetalleResumenModal';


// ============================================================================
// SUB-COMPONENTE: ANALYTICS (Memoizado)
// ============================================================================
const ResumenAnalytics = React.memo<{ data: ResumenCuentaDto[] }>(({ data }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    let active = 0, overdue = 0, completed = 0;

    data.forEach(r => {
      if (r.porcentaje_pagado >= 100) completed++;
      else if (r.cuotas_vencidas > 0) overdue++;
      else active++;
    });

    return [
      { name: 'Al Día', value: active, color: theme.palette.info.main },
      { name: 'Con Deuda', value: overdue, color: theme.palette.error.main },
      { name: 'Completados', value: completed, color: theme.palette.success.main },
    ];
  }, [data, theme]);

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={800} mb={3}>Estado de Cartera</Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" tick={{ fill: theme.palette.text.secondary, fontWeight: 600 }} width={100} axisLine={false} />
          <RechartsTooltip
            cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
          />
          <Bar dataKey="value" name="Cantidad" radius={[0, 4, 4, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

ResumenAnalytics.displayName = 'ResumenAnalytics';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminResumenesCuenta: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminResumenes();

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS (Memoizado)
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const data = logic.filteredResumenes;
    const totalCuentas = data.length;
    const cuentasVencidas = data.filter(r => r.cuotas_vencidas > 0 && r.porcentaje_pagado < 100).length;
    const totalCompletados = data.filter(r => r.porcentaje_pagado >= 100).length;
    const deudaEstimada = data.reduce((acc, curr) => acc + (curr.cuotas_vencidas * curr.detalle_cuota.valor_mensual_final), 0);

    return {
      totalCuentas,
      cuentasVencidas,
      tasaCumplimiento: totalCuentas ? (((totalCuentas - cuentasVencidas) / totalCuentas) * 100).toFixed(1) : 0,
      deudaEstimada,
      totalCompletados
    };
  }, [logic.filteredResumenes]);

  // --------------------------------------------------------------------------
  // COLUMNAS
  // --------------------------------------------------------------------------
  const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
    {
      id: 'id',
      label: 'Resumen / Ref',
      minWidth: 120,
      render: (resumen) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <AssignmentIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>#{resumen.id}</Typography>
            <Typography variant="caption" color="text.secondary">Susc. #{resumen.id_suscripcion}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto / Plan',
      minWidth: 200,
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {resumen.nombre_proyecto}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
            <AccessTime sx={{ fontSize: 12 }} />
            <Typography variant="caption" fontWeight={500}>Plan {resumen.meses_proyecto} meses</Typography>
          </Stack>
        </Box>
      )
    },
    {
      id: 'cuotas',
      label: 'Progreso de Pago',
      minWidth: 180,
      render: (resumen) => {
        const isCompleted = resumen.porcentaje_pagado >= 100;
        const hasOverdue = resumen.cuotas_vencidas > 0;

        return (
          <Stack spacing={0.8} sx={{ pr: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" fontWeight={800} color={isCompleted ? 'success.main' : 'text.primary'}>
                {resumen.cuotas_pagadas} DE {resumen.meses_proyecto} CUOTAS
              </Typography>
              {hasOverdue && (
                <Typography variant="caption" fontWeight={900} color="error.main" sx={{ fontSize: '0.6rem' }}>
                  {resumen.cuotas_vencidas} VENC.
                </Typography>
              )}
            </Stack>

            <LinearProgress
              variant="determinate"
              value={Math.min(resumen.porcentaje_pagado, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[400], 0.2),
                '& .MuiLinearProgress-bar': {
                  bgcolor: isCompleted
                    ? theme.palette.success.main
                    : hasOverdue ? theme.palette.error.main : theme.palette.primary.main
                }
              }}
            />
          </Stack>
        );
      }
    },
    {
      id: 'porcentaje',
      label: '%',
      align: 'center',
      render: (resumen) => (
        <Typography variant="body2" fontWeight={800} color={resumen.porcentaje_pagado >= 100 ? 'success.main' : 'text.secondary'}>
          {resumen.porcentaje_pagado.toFixed(0)}%
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (resumen) => {
        const isCompleted = resumen.porcentaje_pagado >= 100;
        const hasOverdue = resumen.cuotas_vencidas > 0;

        let statusType: any = 'in_progress';
        let label = 'AL DÍA';

        if (isCompleted) {
          statusType = 'completed';
          label = 'COMPLETADO';
        } else if (hasOverdue) {
          statusType = 'failed';
          label = 'CON DEUDA';
        }

        return <StatusBadge status={statusType} customLabel={label} />;
      }
    },
    {
      id: 'cuota_mensual',
      label: 'Valor Cuota',
      render: (resumen) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <AccountBalanceWallet sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
            ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (resumen) => (
        <Tooltip title="Ver Detalle">
          <IconButton
            size="small"
            onClick={() => logic.handleVerDetalle(resumen)}
            sx={{
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER */}
      <AdminPageHeader
        title="Resúmenes de Cuenta"
        subtitle="Control de progreso de cobranza y estado financiero de suscripciones."
      />

      {/* 2. ERRORES */}
      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de Carga"
          message={(logic.error as Error).message || "No se pudo obtener la información."}
        />
      )}

      {/* 3. KPIS GRID */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Cuentas"
          value={stats.totalCuentas}
          subtitle="Planes activos e históricos"
          icon={<AssignmentIcon />}
          color="primary"
          loading={logic.isLoading}
        />
        <StatCard
          title="Deuda Estimada"
          value={`$${stats.deudaEstimada.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Acumulado vencido"
          icon={<AttachMoney />}
          color="error"
          loading={logic.isLoading}
        />
        <StatCard
          title="Cuentas Vencidas"
          value={stats.cuentasVencidas}
          subtitle="Requieren gestión"
          icon={<Warning />}
          color="warning"
          loading={logic.isLoading}
        />
        <StatCard
          title="Cumplimiento"
          value={`${stats.tasaCumplimiento}%`}
          subtitle="Cartera al día"
          icon={<PieChartIcon />}
          color="success"
          loading={logic.isLoading}
        />
      </MetricsGrid>

      {/* 4. CONTROLES Y FILTROS */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
        spacing={2}
      >
        <ViewModeToggle
          value={viewMode}
          onChange={(newMode) => setViewMode(newMode)}
          options={[
            { value: 'table', label: 'Tabla', icon: <ViewList fontSize="small" /> },
            { value: 'analytics', label: 'Analítica', icon: <BarChartIcon fontSize="small" /> }
          ]}
        />

        <FilterBar sx={{ flex: 1, maxWidth: { sm: 700 } }}>
          <FilterSearch
            placeholder="Buscar por proyecto o ID..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
            sx={{ flexGrow: 1 }}
          />

          <FilterSelect
            label="Estado"
            value={logic.filterState}
            onChange={(e) => logic.setFilterState(e.target.value as any)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Activos (Al día)</MenuItem>
            <MenuItem value="overdue">Con Deuda</MenuItem>
            <MenuItem value="completed">Completados</MenuItem>
          </FilterSelect>
        </FilterBar>
      </Stack>

      {/* 5. CONTENIDO CONDICIONAL */}
      {viewMode === 'analytics' ? (
        <ResumenAnalytics data={logic.filteredResumenes} />
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
          <DataTable
            columns={columns}
            data={logic.filteredResumenes}
            getRowKey={(row) => row.id}
            isRowActive={(row) => row.porcentaje_pagado < 100}
            // 🔥 CORRECCIÓN: false para respetar filtros
            showInactiveToggle={false} 
            inactiveLabel="Ver Completados"
            highlightedRowId={logic.highlightedId}
            emptyMessage="No se encontraron resúmenes de cuenta registrados."
            pagination={true}
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}

      {/* 6. MODALES */}
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
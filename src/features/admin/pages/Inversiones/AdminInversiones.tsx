import {
  AccountBalanceWallet, AttachMoney,
  BarChart as BarChartIcon,
  MonetizationOn, Search,
  ShowChart, ViewList
} from '@mui/icons-material';
import {
  alpha, Box, Card, CardContent, Chip, IconButton,
  MenuItem, Skeleton, Stack, Tooltip, Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

// Tipos
import type { InversionDto } from '@/core/types/dto/inversion.dto';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';

// Componentes Compartidos
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

// Hooks y Modales
import { useAdminInversiones } from '../../hooks/useAdminInversiones';
import DetalleInversionModal from './components/DetalleInversionModal';

// ============================================================================
// SUB-COMPONENTE: GRÁFICO DE TENDENCIAS
// ============================================================================
const TrendChart: React.FC<{
  data: Array<{ fecha: string; monto: number }>;
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />;
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Evolución de Capital</Typography>
            <Typography variant="caption" color="text.secondary">
              Últimos 30 días - Tendencia consolidada
            </Typography>
          </Box>
          <Chip
            icon={<ShowChart />}
            label="+12.4%"
            size="small"
            color="success"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="fecha"
              axisLine={false}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            />
            <YAxis
              axisLine={false}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip
              formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Monto']}
              contentStyle={{
                borderRadius: 8,
                border: 'none',
                boxShadow: theme.shadows[4],
              }}
            />
            <Line
              type="monotone"
              dataKey="monto"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ fill: theme.palette.primary.main, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SUB-COMPONENTE: TOP INVERSORES
// ============================================================================
const TopInversoresCard: React.FC<{
  data: Array<{ name: string; monto: number }>;
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />;
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} mb={3}>
          Top 10 Inversores
        </Typography>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
              <XAxis
                type="number"
                hide
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.primary }}
                width={100}
              />
              <RechartsTooltip
                formatter={(val: number) => [`$${val.toLocaleString('es-AR')}`, 'Invertido']}
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: theme.shadows[4],
                }}
              />
              <Bar dataKey="monto" radius={[0, 6, 6, 0]} barSize={24}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index < 3 ? theme.palette.warning.main : theme.palette.primary.main}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Stack height={270} alignItems="center" justifyContent="center">
            <Typography color="text.secondary" variant="body2">
              No hay datos disponibles
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminInversiones: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminInversiones();

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Mock data para tendencias
  const trendData = useMemo(() => [
    { fecha: '01/02', monto: 45000 },
    { fecha: '05/02', monto: 52000 },
    { fecha: '10/02', monto: 48000 },
    { fecha: '15/02', monto: 61000 },
    { fecha: '20/02', monto: 58000 },
    { fecha: '25/02', monto: 67000 },
    { fecha: '01/03', monto: 72000 },
  ], []);

  // --------------------------------------------------------------------------
  // COLUMNAS
  // --------------------------------------------------------------------------
  const columns = useMemo<DataTableColumn<InversionDto>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 60,
        render: (inv) => (
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            #{inv.id}
          </Typography>
        ),
      },
      {
        id: 'usuario',
        label: 'Inversor',
        minWidth: 200,
        render: (inv) => {
          const user = logic.getUserInfo(inv.id_usuario);
          return (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {user.name.charAt(0) || 'U'}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 140,
        render: (inv) => (
          <Typography variant="body2" fontWeight={500} noWrap>
            {logic.getProjectName(inv.id_proyecto)}
          </Typography>
        ),
      },
      {
        id: 'monto',
        label: 'Monto',
        render: (inv) => (
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ fontFamily: 'monospace', color: 'primary.main' }}
          >
            ${Number(inv.monto).toLocaleString('es-AR')}
          </Typography>
        ),
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (inv) => {
          const getStatusType = (status: string): any => {
            switch (status) {
              case 'pagado': return 'success';
              case 'pendiente': return 'pending';
              case 'fallido': return 'failed';
              case 'reembolsado': return 'info';
              default: return 'warning';
            }
          };

          return (
            <StatusBadge
              status={getStatusType(inv.estado)}
              customLabel={inv.estado.toUpperCase()}
            />
          );
        },
      },
      {
        id: 'fecha',
        label: 'Fecha',
        render: (inv) => {
          const dateObj = new Date(inv.fecha_inversion || inv.fecha_creacion || '');
          return (
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {dateObj.toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          );
        },
      },
      {
        id: 'acciones',
        label: '',
        align: 'right',
        render: (inv) => (
          <Tooltip title="Ver Detalle">
            <IconButton
              color="primary"
              onClick={() => logic.handleViewDetails(inv)}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
              }}
            >
              <Search fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [theme, logic]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER */}
      <AdminPageHeader
        title="Gestión de Inversiones"
        subtitle="Monitoreo de capital y análisis de conversión"
      />

      {/* 2. ERRORES */}
      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de carga"
          message={(logic.error as Error).message || "No se pudieron cargar las inversiones."}
        />
      )}

      {/* 3. GRID DE MÉTRICAS */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Registrado"
          value={`$${Number(logic.liquidezData?.total_invertido_registrado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Intención de inversión"
          color="info"
          icon={<AttachMoney />}
          loading={logic.isLoading}
        />
        <StatCard
          title="Capital Consolidado"
          value={`$${Number(logic.liquidezData?.total_pagado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Cobros efectivos"
          color="success"
          icon={<MonetizationOn />}
          loading={logic.isLoading}
        />
        <StatCard
          title="Tasa de Liquidez"
          value={`${logic.liquidezData?.tasa_liquidez || 0}%`}
          subtitle="Conversión de pagos"
          color="warning"
          icon={<ShowChart />}
          loading={logic.isLoading}
        />
        <StatCard
          title="Transacciones"
          value={logic.filteredInversiones.length.toString()}
          subtitle="Volumen filtrado"
          color="primary"
          icon={<AccountBalanceWallet />}
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
            { value: 'table', label: 'Tabla de Datos', icon: <ViewList fontSize="small" /> },
            { value: 'analytics', label: 'Analítica Visual', icon: <BarChartIcon fontSize="small" /> },
          ]}
        />

        {viewMode === 'table' && (
          <FilterBar sx={{ flex: 1, maxWidth: { sm: 600 } }}>
            <FilterSearch
              placeholder="Buscar inversor, ID, proyecto..."
              value={logic.searchTerm}
              onSearch={logic.setSearchTerm}
              sx={{ flexGrow: 1 }}
            />

            <FilterSelect
              label="Estado"
              value={logic.filterStatus}
              onChange={(e) => logic.setFilterStatus(e.target.value as any)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="pagado">Pagado</MenuItem>
              <MenuItem value="fallido">Fallido</MenuItem>
            </FilterSelect>

            <FilterSelect
              label="Proyecto"
              value={logic.filterProject}
              onChange={(e) => logic.setFilterProject(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              {logic.proyectos.map((p: ProyectoDto) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre_proyecto}
                </MenuItem>
              ))}
            </FilterSelect>
          </FilterBar>
        )}
      </Stack>

      {/* 5. CONTENIDO CONDICIONAL */}
      {viewMode === 'analytics' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <TrendChart data={trendData} isLoading={logic.isLoading} />
          <TopInversoresCard data={logic.chartData} isLoading={logic.isLoading} />
        </Box>
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable
            columns={columns}
            data={logic.filteredInversiones}
            getRowKey={(row) => row.id}
            isRowActive={(row) => row.estado !== 'fallido'}
            showInactiveToggle={true}
            inactiveLabel="Fallidas"
            emptyMessage="No se encontraron registros de inversión."
            pagination
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}

      {/* 6. MODALES */}
      {logic.selectedInversion && (
        <DetalleInversionModal
          open={logic.detailModal.isOpen}
          onClose={logic.handleCloseModal}
          inversion={logic.selectedInversion}
          userName={logic.getUserInfo(logic.selectedInversion.id_usuario).name}
          userEmail={logic.getUserInfo(logic.selectedInversion.id_usuario).email}
          projectName={logic.getProjectName(logic.selectedInversion.id_proyecto)}
        />
      )}
    </PageContainer>
  );
};

export default AdminInversiones;
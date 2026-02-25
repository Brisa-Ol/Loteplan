// src/features/admin/pages/Inversiones/AdminInversiones.tsx

import {
  AccountBalanceWallet, AttachMoney,
  BarChart as BarChartIcon,
  Clear as ClearIcon,
  DateRange as DateIcon,
  MonetizationOn, Search,
  ShowChart, ViewList
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box, Card, CardContent, Chip, IconButton,
  MenuItem, Skeleton, Stack,
  TextField,
  Tooltip, Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

import type { InversionDto } from '@/core/types/dto/inversion.dto';
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import { useAdminInversiones } from '../../hooks/finanzas/useAdminInversiones';
import DetalleInversionModal from './components/DetalleInversionModal';

// ============================================================================
// SUB-COMPONENTES PARA GRÁFICOS
// ============================================================================

const TrendChart = React.memo<{
  data: Array<{ fecha: string; monto: number }>;
  isLoading?: boolean;
}>(({ data, isLoading }) => {
  const theme = useTheme();
  if (isLoading) return <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Evolución de Capital</Typography>
            <Typography variant="caption" color="text.secondary">Acumulado histórico</Typography>
          </Box>
          <Chip icon={<ShowChart />} label="En Vivo" size="small" color="success" sx={{ fontWeight: 700 }} />
        </Stack>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="fecha" axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
              <YAxis axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Monto']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[4] }} />
              <Line type="monotone" dataKey="monto" stroke={theme.palette.primary.main} strokeWidth={3} dot={{ fill: theme.palette.primary.main, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Stack height={250} alignItems="center" justifyContent="center">
            <Typography color="text.secondary">No hay movimientos registrados</Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
});

const TopInversoresCard = React.memo<{
  data: Array<{ name: string; monto: number }>;
  isLoading?: boolean;
}>(({ data, isLoading }) => {
  const theme = useTheme();
  if (isLoading) return <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Top 10 Inversores</Typography>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.primary }} width={100} />
              <RechartsTooltip formatter={(val: number) => [`$${val.toLocaleString('es-AR')}`, 'Invertido']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[4] }} />
              <Bar dataKey="monto" radius={[0, 6, 6, 0]} barSize={24}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? theme.palette.warning.main : theme.palette.primary.main} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Stack height={270} alignItems="center" justifyContent="center">
            <Typography color="text.secondary" variant="body2">No hay datos disponibles</Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminInversiones: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const logic = useAdminInversiones();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  // 🆕 Estados para filtro de fechas
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 🆕 Aplicamos el filtro de fecha a los datos que provienen de `logic`
  const filteredByDateInversiones = useMemo(() => {
    return logic.filteredInversiones.filter(inv => {
      let matchesDate = true;
      const dateStr = inv.fecha_inversion ? new Date(inv.fecha_inversion).toISOString().split('T')[0] : null;

      if (dateStr) {
        if (startDate && dateStr < startDate) matchesDate = false;
        if (endDate && dateStr > endDate) matchesDate = false;
      }
      return matchesDate;
    });
  }, [logic.filteredInversiones, startDate, endDate]);

  // 🆕 Recalculamos los KPIs en base a los datos filtrados en pantalla
  const currentMetrics = useMemo(() => {
    let registrado = 0;
    let consolidado = 0;

    filteredByDateInversiones.forEach(inv => {
      const montoNum = Number(inv.monto) || 0;
      registrado += montoNum;
      if (inv.estado === 'pagado') {
        consolidado += montoNum;
      }
    });

    const tasa = registrado > 0 ? ((consolidado / registrado) * 100).toFixed(1) : 0;

    return { registrado, consolidado, tasa };
  }, [filteredByDateInversiones]);


  const columns = useMemo<DataTableColumn<InversionDto>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 60,
        render: (inv) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{inv.id}</Typography>,
      },
      {
        id: 'usuario',
        label: 'Inversor',
        minWidth: 200,
        render: (inv) => {
          const user = inv.inversor;
          const userName = user?.nombre_usuario || `ID #${inv.id_usuario}`;
          const fullName = user ? `${user.nombre} ${user.apellido}` : 'Cargando...';

          return (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700, fontSize: 14 }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  @{userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fullName}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: 'proyecto',
        label: 'Proyecto / Referencia',
        minWidth: 220,
        render: (row) => {
          const proyecto = row.proyectoInvertido;
          return (
            <Box
              sx={{
                cursor: 'pointer',
                '&:hover .proj-name': { color: 'primary.main' }
              }}
              onClick={() => navigate(`/admin/proyectos?highlight=${row.id_proyecto}`)}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                className="proj-name"
                sx={{ transition: 'color 0.2s' }}
              >
                {proyecto?.nombre_proyecto ?? 'Proyecto Desconocido'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                REF: #{row.id} • ID Proj: {row.id_proyecto}
              </Typography>
            </Box>
          );
        }
      },
      {
        id: 'monto',
        label: 'Monto',
        render: (inv) => (
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
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
          return <StatusBadge status={getStatusType(inv.estado)} customLabel={inv.estado.toUpperCase()} />;
        },
      },
      {
        id: 'fecha',
        label: 'Fecha',
        render: (inv) => {
          const dateObj = new Date(inv.fecha_inversion || (inv as any).createdAt || new Date());
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Stack>
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
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}
            >
              <Search fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [theme, logic, navigate]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader title="Gestión de Inversiones Directas" subtitle="Monitoreo de capital y análisis de conversión" />

      {logic.error && (
        <AlertBanner severity="error" title="Error de carga" message={(logic.error as Error).message || "No se pudieron cargar las inversiones."} />
      )}

      {/* 🆕 KPIs Actualizados dinámicamente según la pantalla */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title={(startDate || endDate) ? "Registrado en Periodo" : "Total Registrado"}
          value={`$${currentMetrics.registrado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Intención de inversión" color="info" icon={<AttachMoney />} loading={logic.isLoading}
        />
        <StatCard
          title={(startDate || endDate) ? "Consolidado en Periodo" : "Capital Consolidado"}
          value={`$${currentMetrics.consolidado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Cobros efectivos" color="success" icon={<MonetizationOn />} loading={logic.isLoading}
        />
        <StatCard title="Tasa de Liquidez" value={`${currentMetrics.tasa}%`} subtitle="Conversión de pagos" color="warning" icon={<ShowChart />} loading={logic.isLoading} />
        <StatCard title="Transacciones" value={filteredByDateInversiones.length.toString()} subtitle="Volumen filtrado" color="primary" icon={<AccountBalanceWallet />} loading={logic.isLoading} />
      </MetricsGrid>

      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} mb={3} spacing={2}>
        <ViewModeToggle value={viewMode} onChange={(newMode) => setViewMode(newMode)} options={[{ value: 'table', label: 'Tabla de Datos', icon: <ViewList fontSize="small" /> }, { value: 'analytics', label: 'Analítica Visual', icon: <BarChartIcon fontSize="small" /> }]} />

        {viewMode === 'table' && (
          <FilterBar sx={{ flex: 1, width: '100%', flexWrap: 'wrap' }}>
            <FilterSearch placeholder="Buscar inversor, ID, proyecto..." value={logic.searchTerm} onSearch={logic.setSearchTerm} sx={{ flexGrow: 1, minWidth: 200 }} />

            {/* 🆕 FILTROS DE FECHAS */}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                type="date" size="small"
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                sx={{ bgcolor: 'background.paper', borderRadius: 1, width: 140 }}
              />
              <Typography variant="body2" color="text.secondary">-</Typography>
              <TextField
                type="date" size="small"
                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                inputProps={{ min: startDate }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1, width: 140 }}
              />
            </Stack>

            <FilterSelect label="Estado" value={logic.filterStatus} onChange={(e) => logic.setFilterStatus(e.target.value as any)} sx={{ minWidth: 120 }}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="pagado">Pagado</MenuItem>
              <MenuItem value="fallido">Fallido</MenuItem>
            </FilterSelect>
            <FilterSelect label="Proyecto" value={logic.filterProject} onChange={(e) => logic.setFilterProject(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="all">Todos</MenuItem>
              {logic.proyectos.filter((p: any) => p.tipo_inversion === 'directo').map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
            </FilterSelect>

            {/* 🆕 Botón para limpiar si hay filtros activos */}
            {(startDate || endDate || logic.searchTerm || logic.filterStatus !== 'all' || logic.filterProject !== 'all') && (
              <IconButton color="error" onClick={() => {
                setStartDate(''); setEndDate(''); logic.setSearchTerm(''); logic.setFilterStatus('all'); logic.setFilterProject('all');
              }}>
                <ClearIcon />
              </IconButton>
            )}
          </FilterBar>
        )}
      </Stack>

      {viewMode === 'analytics' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <TrendChart data={logic.trendData} isLoading={logic.isLoading} />
          <TopInversoresCard data={logic.chartData} isLoading={logic.isLoading} />
        </Box>
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable
            columns={columns}
            data={filteredByDateInversiones}
            getRowKey={(row) => row.id}
            isRowActive={(row) => row.estado === 'pagado' || row.estado === 'pendiente'}
            highlightedRowId={logic.highlightedId}
            showInactiveToggle={true}
            emptyMessage="No se encontraron registros de inversión con los filtros aplicados."
            pagination
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}

      {logic.selectedInversion && (
        <DetalleInversionModal
          open={logic.modales.detail.isOpen}
          onClose={logic.handleCloseModal}
          inversion={logic.selectedInversion}
          userName={logic.selectedInversion.inversor ? `@${logic.selectedInversion.inversor.nombre_usuario}` : `Usuario #${logic.selectedInversion.id_usuario}`}
          userEmail={logic.selectedInversion.inversor?.email}
          projectName={logic.selectedInversion.proyectoInvertido?.nombre_proyecto || 'Proyecto'}
        />
      )}
    </PageContainer>
  );
};

export default AdminInversiones;
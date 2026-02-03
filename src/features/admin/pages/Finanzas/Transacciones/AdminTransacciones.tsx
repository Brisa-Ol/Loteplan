import {
  BarChart as BarChartIcon,
  Bolt, CheckCircle, ErrorOutline,
  MonetizationOn, Person, ReceiptLong,
  ViewList,
  Visibility
} from '@mui/icons-material';
import {
  Avatar, Box, IconButton, MenuItem, Stack, Tooltip, Typography, alpha, useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

// Hooks y DTOs
import type { TransaccionDto } from '../../../../../core/types/dto/transaccion.dto';
import { useAdminTransacciones } from '../../../hooks/useAdminTransacciones';

// Componentes Compartidos (Legacy)
import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '../../../../../shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';



// Modales
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import ModalDetalleTransaccion from './modal/ModalDetalleTransaccion';

// ============================================================================
// SUB-COMPONENTE: ANALYTICS (Gráfico de Transacciones)
// ============================================================================
const TransactionAnalytics: React.FC<{ data: TransaccionDto[] }> = ({ data }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const type = curr.tipo_transaccion || 'Otros';
      if (!acc[type]) acc[type] = { name: type, monto: 0, cantidad: 0 };
      acc[type].monto += Number(curr.monto);
      acc[type].cantidad += 1;
      return acc;
    }, {} as Record<string, any>);

    const labels: Record<string, string> = {
      pago_suscripcion_inicial: 'Suscripción',
      directo: 'Inversión',
      mensual: 'Cuota Mensual'
    };

    return Object.values(grouped).map((item: any) => ({
      ...item,
      displayName: labels[item.name] || item.name
    }));
  }, [data]);

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={800} mb={3}>Distribución de Volumen por Tipo</Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
          <XAxis dataKey="displayName" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} />
          <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} />
          <RechartsTooltip
            cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
            formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Volumen Total']}
          />
          <Legend />
          <Bar dataKey="monto" name="Volumen ($)" radius={[4, 4, 0, 0]} barSize={50}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminTransacciones: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminTransacciones();

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const data = logic.filteredData;
    const totalVolumen = data.reduce((acc, curr) => acc + (curr.estado_transaccion === 'pagado' ? Number(curr.monto) : 0), 0);
    const totalExitosas = data.filter(t => t.estado_transaccion === 'pagado').length;
    const totalFallidas = data.filter(t => ['fallido', 'rechazado'].includes(t.estado_transaccion)).length;

    return {
      totalRegistros: data.length,
      volumenExitoso: totalVolumen,
      tasaExito: data.length ? ((totalExitosas / data.length) * 100).toFixed(1) : 0,
      fallidas: totalFallidas
    };
  }, [logic.filteredData]);

  // --------------------------------------------------------------------------
  // COLUMNAS
  // --------------------------------------------------------------------------
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 60,
      render: (row) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'usuario', label: 'Usuario / Cliente', minWidth: 240,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 32, height: 32,
            fontSize: '0.85rem',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            fontWeight: 700
          }}>
            {row.usuario?.nombre?.[0]?.toUpperCase() || <Person fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {row.usuario ? `${row.usuario.nombre} ${row.usuario.apellido}` : `ID: ${row.id_usuario}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {row.usuario?.email || 'Sin correo registrado'}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto', label: 'Tipo / Origen', minWidth: 200,
      render: (row) => {
        const labels: Record<string, string> = {
          pago_suscripcion_inicial: 'Suscripción Inicial',
          directo: 'Inversión Directa',
          mensual: 'Cuota Mensual'
        };
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {labels[row.tipo_transaccion] || row.tipo_transaccion}
            </Typography>
            <Typography variant="caption" color="primary.main" fontWeight={700}>
              {row.proyectoTransaccion?.nombre_proyecto || 'Sin proyecto asignado'}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'monto', label: 'Monto',
      render: (row) => (
        <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontFamily: 'monospace' }}>
          ${Number(row.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado', align: 'center',
      render: (row) => {
        const getStatusType = (status: string): any => {
          if (status === 'pagado') return 'success';
          if (status === 'pendiente') return 'pending';
          if (['fallido', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado'].includes(status)) return 'error';
          if (status === 'expirado') return 'warning';
          return 'default';
        };

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            <StatusBadge
              status={getStatusType(row.estado_transaccion)}
              customLabel={row.estado_transaccion.replace(/_/g, ' ').toUpperCase()}
            />
            {row.error_detalle && (
              <Tooltip title={row.error_detalle}>
                <ErrorOutline color="error" sx={{ fontSize: 18 }} />
              </Tooltip>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'fecha', label: 'Fecha / Hora',
      render: (row) => (
        <Box>
          <Typography variant="body2" color="text.primary">
            {row.fecha_transaccion ? format(new Date(row.fecha_transaccion), 'dd/MM/yyyy', { locale: es }) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.fecha_transaccion ? format(new Date(row.fecha_transaccion), 'HH:mm', { locale: es }) : ''} hs
          </Typography>
        </Box>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Ver Detalles">
            <IconButton
              size="small"
              onClick={() => logic.handleViewDetails(row)}
              sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {row.estado_transaccion !== 'pagado' && (
            <Tooltip title="Forzar Confirmación">
              <IconButton
                size="small"
                onClick={() => logic.handleForceConfirmClick(row.id)}
                disabled={logic.isConfirming}
                sx={{ color: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.15) } }}
              >
                <Bolt fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER */}
      <AdminPageHeader
        title="Auditoría Financiera"
        subtitle="Monitoreo de transacciones, pasarelas de pago y conciliación."
      />

      {/* 2. ERRORES */}
      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de Sistema"
          message={(logic.error as Error).message || "No se pudieron cargar las transacciones."}
        />
      )}

      {/* 3. GRID DE KPIS */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Transacciones"
          value={stats.totalRegistros}
          subtitle="Volumen filtrado"
          icon={<ReceiptLong />}
          color="primary"
          loading={logic.isLoading}
        />
        <StatCard
          title="Volumen Procesado"
          value={`$${stats.volumenExitoso.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Total montos pagados"
          icon={<MonetizationOn />}
          color="success"
          loading={logic.isLoading}
        />
        <StatCard
          title="Tasa de Éxito"
          value={`${stats.tasaExito}%`}
          subtitle="Conversión efectiva"
          icon={<CheckCircle />}
          color="info"
          loading={logic.isLoading}
        />
        <StatCard
          title="Errores / Rechazos"
          value={stats.fallidas}
          subtitle="Requieren revisión"
          icon={<ErrorOutline />}
          color="error"
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
            { value: 'analytics', label: 'Métricas', icon: <BarChartIcon fontSize="small" /> }
          ]}
        />

        <FilterBar sx={{ flex: 1, maxWidth: { sm: 600 } }}>
          <FilterSearch
            placeholder="Buscar por cliente, proyecto..."
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />

          <FilterSelect
            label="Estado"
            value={logic.filterStatus}
            onChange={(e) => logic.setFilterStatus(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pagado">Completados</MenuItem>
            <MenuItem value="pendiente">Pendientes</MenuItem>
            <MenuItem value="fallido">Fallidos</MenuItem>
          </FilterSelect>
        </FilterBar>
      </Stack>

      {/* 5. CONTENIDO CONDICIONAL */}
      {viewMode === 'analytics' ? (
        <TransactionAnalytics data={logic.filteredData} />
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable
            columns={columns}
            data={logic.filteredData}
            getRowKey={(row) => row.id}
            isRowActive={(row) => !['fallido', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(row.estado_transaccion)}
            showInactiveToggle={true}
            inactiveLabel="Mostrar Fallidas"
            highlightedRowId={logic.highlightedId}
            emptyMessage="No se encontraron transacciones registradas."
            pagination={true}
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}

      {/* 6. MODALES */}
      <ModalDetalleTransaccion
        open={logic.modales.detail.isOpen}
        transaccion={logic.selectedTransaccion}
        onClose={logic.handleCloseModal}
        onForceConfirm={logic.handleForceConfirmClick}
        isConfirming={logic.isConfirming}
      />

      <ConfirmDialog
        controller={logic.modales.confirm}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isConfirming}
      />
    </PageContainer>
  );
};

export default AdminTransacciones;
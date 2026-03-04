// src/features/admin/pages/Inversiones/AdminInversiones.tsx

import React, { useMemo, useState } from 'react';
import {
  AccountBalance,
  AttachMoney,
  RestartAlt as ClearIcon, // Icono para limpiar filtros
  CalendarMonth as DateIcon,
  ReceiptLong,
  Search,
  TrendingUp
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader'; // ✅ Componente estandarizado
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import type { InversionDto } from '@/core/types/dto/inversion.dto';
import { useAdminInversiones } from '../../hooks/finanzas/useAdminInversiones';
import DetalleInversionModal from './modals/DetalleInversionModal';

const AdminInversiones: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminInversiones();

  // ── ESTADOS PARA FILTRO DE FECHAS ──────────────────────────────────────────
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // ── LÓGICA DE FILTRADO POR FECHA (LOCAL) ──────────────────────────────────
  const filteredData = useMemo(() => {
    return logic.filteredInversiones.filter((inv) => {
      const fechaBase = inv.fecha_inversion || inv.createdAt;
      if (!fechaBase) return true;

      const invDate = new Date(fechaBase).toISOString().split('T')[0];

      if (startDate && invDate < startDate) return false;
      if (endDate && invDate > endDate) return false;

      return true;
    });
  }, [logic.filteredInversiones, startDate, endDate]);

  // ── KPIs DINÁMICOS BASADOS EN EL FILTRO ────────────────────────────────────
  const metrics = useMemo(() => {
    const data = filteredData;
    const total = data.reduce((acc, curr) => acc + Number(curr.monto), 0);
    const pagado = data.filter(i => i.estado === 'pagado').reduce((acc, curr) => acc + Number(curr.monto), 0);
    const transacciones = data.length;
    const conversion = total > 0 ? (pagado / total) * 100 : 0;

    return { total, pagado, transacciones, conversion };
  }, [filteredData]);

  const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
    {
      id: 'inversor',
      label: 'Inversor',
      minWidth: 250,
      render: (inv) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 32, height: 32, fontSize: '0.85rem', fontWeight: 800,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main'
            }}
          >
            {inv.inversor?.nombre_usuario?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={700} noWrap>
              @{inv.inversor?.nombre_usuario}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {inv.inversor?.nombre} {inv.inversor?.apellido}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'proyecto',
      label: 'Proyecto Destino',
      minWidth: 250,
      render: (inv) => (
        <Box>
          <Typography variant="body2" fontWeight={600} noWrap>
            {inv.proyectoInvertido?.nombre_proyecto}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ID Proyecto: {inv.id_proyecto}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'monto',
      label: 'Monto Invertido',
      align: 'right',
      minWidth: 150,
      render: (inv) => (
        <Box textAlign="right">
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 800,
              color: inv.estado === 'pagado' ? 'success.main' : 'text.primary'
            }}
          >
            ${Number(inv.monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.disabled">ARS</Typography>
        </Box>
      ),
    },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      minWidth: 140,
      render: (inv) => {
        const statusMap: any = {
          pagado: 'success', pendiente: 'pending', fallido: 'failed', reembolsado: 'info'
        };
        return <StatusBadge status={statusMap[inv.estado]} customLabel={inv.estado.toUpperCase()} />;
      },
    },
    {
      id: 'fecha',
      label: 'Fecha Operación',
      minWidth: 180,
      render: (inv) => {
        const date = new Date(inv.fecha_inversion || inv.createdAt);
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <DateIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Box>
              <Typography variant="caption" fontWeight={700} display="block">
                {date.toLocaleDateString('es-AR')}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
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
      minWidth: 80,
      render: (inv) => (
        <Tooltip title="Detalle Transaccional">
          <IconButton size="small" onClick={() => logic.handleViewDetails(inv)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Search fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [theme, logic]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    logic.setSearchTerm('');
    logic.setFilterStatus('all');
    logic.setFilterProject('all');
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER ESTANDARIZADO */}
      <AdminPageHeader
        title="Auditoría de Inversiones"
        subtitle="Registro histórico de ingresos y capital directo."
      />

      {/* 2. KPIs */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 3 }}>
        <StatCard
          title="Capital Total"
          value={`$${metrics.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle={startDate || endDate ? "En periodo seleccionado" : "Registrado en sistema"}
          color="primary" icon={<AttachMoney />} loading={logic.isLoading}
        />
        <StatCard
          title="Consolidado"
          value={`$${metrics.pagado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          subtitle="Cobros efectivos" color="success" icon={<AccountBalance />} loading={logic.isLoading}
        />
        <StatCard
          title="Efectividad"
          value={`${metrics.conversion.toFixed(1)}%`}
          subtitle="Tasa de pago" color="warning" icon={<TrendingUp />} loading={logic.isLoading}
        />
        <StatCard
          title="Tickets"
          value={metrics.transacciones.toString()}
          subtitle="Operaciones encontradas" color="info" icon={<ReceiptLong />} loading={logic.isLoading}
        />
      </MetricsGrid>

      {/* 3. FILTROS */}
      <FilterBar sx={{ mb: 3, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', lg: 'center' },
            width: '100%',
          }}
        >
          {/* BÚSQUEDA */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
            <FilterSearch
              placeholder="Buscar inversor o proyecto..."
              value={logic.searchTerm}
              onSearch={logic.setSearchTerm}
              fullWidth
            />
          </Box>

          {/* CONTENEDOR DE FILTROS ESPECÍFICOS */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: { xs: 'center', lg: 'flex-end' },
            }}
          >
            {/* GRUPO FECHAS */}
            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                type="date"
                label="Desde"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ width: { xs: '50%', sm: 140 } }}
              />
              <TextField
                type="date"
                label="Hasta"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ width: { xs: '50%', sm: 140 } }}
              />
            </Stack>

            {/* GRUPO SELECTORES */}
            <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              <FilterSelect
                label="Estado"
                value={logic.filterStatus}
                onChange={(e) => logic.setFilterStatus(e.target.value as any)}
                sx={{ flex: 1, minWidth: 120 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pendiente">Pendientes</MenuItem>
                <MenuItem value="pagado">Pagados</MenuItem>
                <MenuItem value="fallido">Fallidos</MenuItem>
              </FilterSelect>

              <FilterSelect
                label="Proyecto"
                value={logic.filterProject}
                onChange={(e) => logic.setFilterProject(e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              >
                <MenuItem value="all">Todos los Proyectos</MenuItem>
                {logic.proyectos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                ))}
              </FilterSelect>
            </Box>

            {/* BOTÓN LIMPIAR */}
            <Tooltip title="Limpiar filtros">
              <IconButton
                onClick={handleClearFilters}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  color: theme.palette.error.main,
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) },
                  ml: { sm: 'auto', lg: 0 }
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </FilterBar>

      {/* 4. TABLA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={filteredData} // Usamos la data filtrada localmente
          getRowKey={(row) => row.id}
          isRowActive={(row) => row.activo}
          pagination
        />
      </QueryHandler>

      {/* 5. MODALES */}
      {logic.selectedInversion && (
        <DetalleInversionModal
          open={logic.modales.detail.isOpen}
          onClose={logic.handleCloseModal}
          inversion={logic.selectedInversion}
        />
      )}
    </PageContainer>
  );
};

export default AdminInversiones;
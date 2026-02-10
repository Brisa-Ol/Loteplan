import React, { useMemo } from 'react';
import {
  Box, Typography, TextField, MenuItem,
  InputAdornment, Chip, IconButton, Tooltip, Stack,
  Alert, AlertTitle, Avatar, alpha, useTheme
} from '@mui/material';
import {
  Search, Visibility, AttachMoney, TrendingDown,
  Warning, AccessTime, DateRange, Person as PersonIcon
} from '@mui/icons-material';

import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader';
import { StatCard } from '../../../../../shared/components/domain/cards/StatCard/StatCard';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { FilterBar, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar';

import DetallePagoModal from './components/DetallePagoModal';
import { useAdminPagos } from '../../../hooks/useAdminPagos';
import type { PagoDto } from '../../../../../core/types/dto/pago.dto';

const AdminPagos: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminPagos();

  // DEFINICIÓN DE COLUMNAS
  const columns = useMemo<DataTableColumn<PagoDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 60,
      render: (p) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{p.id}</Typography>
    },
    {
      id: 'usuario', label: 'Usuario / Cliente', minWidth: 220,
      render: (p) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{
            width: 32, height: 32,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            fontSize: 14, fontWeight: 800
          }}>
            {logic.getUserName(p.id_usuario).charAt(0) || <PersonIcon fontSize="small" />}
          </Avatar>
          <Typography variant="body2" fontWeight={700}>
            {logic.getUserName(p.id_usuario)}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 180,
      render: (p) => (
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {logic.getProjectName(p.id_proyecto)}
        </Typography>
      )
    },
    {
      id: 'mes', label: 'Cuota', align: 'center',
      render: (p) => (
        <Chip
          label={`MES ${p.mes}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 800, fontSize: '0.65rem', borderStyle: 'dashed' }}
        />
      )
    },
    {
      id: 'monto', label: 'Monto',
      render: (p) => (
        <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontFamily: 'monospace' }}>
          ${Number(p.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'vencimiento', label: 'Vencimiento',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <AccessTime sx={{ fontSize: 14, color: p.estado_pago === 'vencido' ? 'error.main' : 'text.disabled' }} />
          <Typography variant="body2" fontWeight={500}>
            {new Date(p.fecha_vencimiento).toLocaleDateString('es-AR')}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'estado', label: 'Estado', align: 'center',
      render: (p) => {
        const configs: Record<string, { color: any, variant: any }> = {
          pagado: { color: 'success', variant: 'filled' },
          vencido: { color: 'error', variant: 'filled' },
          pendiente: { color: 'warning', variant: 'outlined' },
          cancelado: { color: 'default', variant: 'outlined' },
          cubierto_por_puja: { color: 'info', variant: 'outlined' }
        };
        const config = configs[p.estado_pago] || configs.pendiente;

        return (
          <Chip
            label={p.estado_pago.replace(/_/g, ' ').toUpperCase()}
            size="small"
            color={config.color}
            variant={config.variant}
            sx={{ fontWeight: 800, fontSize: '0.6rem', minWidth: 90 }}
          />
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (p) => (
        <Tooltip title="Gestionar Pago">
          <IconButton
            size="small"
            onClick={() => logic.handleVerDetalle(p)}
            sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Control de Pagos"
        subtitle="Gestión y conciliación de cuotas mensuales de inversores."
      />

      {/* ALERTAS DE GESTIÓN */}
      <Stack spacing={2} mb={4}>
        {logic.alerts.veryOverdue.length > 0 && (
          <Alert severity="error" variant="outlined" icon={<Warning />} sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
            <AlertTitle sx={{ fontWeight: 800 }}>Alta Morosidad Detectada</AlertTitle>
            Existen <b>{logic.alerts.veryOverdue.length} cuotas</b> con más de 30 días de retraso.
          </Alert>
        )}
        {logic.alerts.dueSoon.length > 0 && (
          <Alert severity="info" variant="outlined" icon={<DateRange />} sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
            Hay <b>{logic.alerts.dueSoon.length} pagos</b> próximos a vencer esta semana.
          </Alert>
        )}
      </Stack>

      {/* KPIs FINANCIEROS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Pendiente Global" value={`$${logic.globalStats.totalPendiente.toLocaleString('es-AR')}`} subtitle="Capital a recaudar" color="warning" icon={<AccessTime />} loading={logic.isLoading} />
        <StatCard title="Recaudado (Mes)" value={`$${Number(logic.metrics?.total_recaudado || 0).toLocaleString('es-AR')}`} subtitle="Cobros efectivos" color="success" icon={<AttachMoney />} loading={logic.isLoading} />
        <StatCard title="Cuotas Vencidas" value={logic.metrics?.total_pagos_vencidos || 0} subtitle="Sin pago confirmado" color="error" icon={<Warning />} loading={logic.isLoading} />
        <StatCard title="Índice Mora" value={`${logic.metrics?.tasa_morosidad || '0'}%`} subtitle="Sobre mes actual" color="info" icon={<TrendingDown />} loading={logic.isLoading} />
      </Box>

      {/* FILTROS AVANZADOS */}
      <FilterBar>
        <TextField
          placeholder="Buscar cliente o proyecto..." size="small"
          sx={{ flexGrow: 1 }}
          value={logic.searchTerm}
          onChange={(e) => logic.setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
        />

        <FilterSelect label="Estado de Cuota" value={logic.filterState} onChange={(e) => logic.setFilterState(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">Todos los registros</MenuItem>
          <MenuItem value="pendiente">Pendientes</MenuItem>
          <MenuItem value="pagado">Pagados</MenuItem>
          <MenuItem value="vencido">Vencidos</MenuItem>
          <MenuItem value="cubierto_por_puja">Cubiertos por Puja</MenuItem>
        </FilterSelect>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField type="date" size="small" label="Desde" value={logic.dateStart} onChange={(e) => logic.setDateStart(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="Hasta" value={logic.dateEnd} onChange={(e) => logic.setDateEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Stack>
      </FilterBar>

      {/* TABLA PRINCIPAL */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
          columns={columns}
          data={logic.filteredPagos}
          getRowKey={(p) => p.id}

          // ✅ INTEGRACIÓN: Definimos como activos los pagos que requieren gestión real
          isRowActive={(p) => !['cancelado', 'cubierto_por_puja'].includes(p.estado_pago)}
          showInactiveToggle={true}
          inactiveLabel="Históricos"

          highlightedRowId={logic.highlightedId}
          emptyMessage="No se encontraron registros de cuotas."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* MODAL DETALLE */}
      <DetallePagoModal
        open={logic.detalleModal.isOpen}
        onClose={logic.handleCloseDetalle}
        pago={logic.selectedPago}
        userName={logic.selectedPago ? logic.getUserName(logic.selectedPago.id_usuario) : ''}
        projectName={logic.selectedPago ? logic.getProjectName(logic.selectedPago.id_proyecto) : ''}
        onUpdate={logic.handleUpdate}
      />
    </PageContainer>
  );
};

export default AdminPagos;
import React, { useMemo } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip,
  Stack, TextField, MenuItem, InputAdornment, Avatar, Divider, alpha, Tabs, Tab
} from '@mui/material';
import {
  CheckCircle, Cancel, Search, Visibility,
  MonetizationOn, TrendingDown, Warning, Groups,
} from '@mui/icons-material';

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { FilterBar, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';
import CancelacionesTab from './components/CancelacionesTab';

import { useAdminSuscripciones } from '../../hooks/useAdminSuscripciones';
import type { SuscripcionDto } from '../../../../core/types/dto/suscripcion.dto';

const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();

  const columns = useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
    {
      id: 'usuario', label: 'ID / Usuario', minWidth: 240,
      render: (s) => (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ opacity: s.activo ? 1 : 0.6 }}>
          <Avatar sx={{
            width: 36, height: 36,
            bgcolor: s.activo ? alpha(logic.theme.palette.primary.main, 0.1) : logic.theme.palette.action.disabledBackground,
            color: s.activo ? 'primary.main' : 'text.disabled',
            fontSize: 14, fontWeight: 'bold'
          }}>
            {s.usuario?.nombre?.charAt(0) || '#'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {s.usuario?.nombre} {s.usuario?.apellido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.usuario?.email || 'Sin email'} • ID: {s.id}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 150,
      render: (s) => <Typography variant="body2" fontWeight={500} sx={{ opacity: s.activo ? 1 : 0.6 }}>{s.proyectoAsociado?.nombre_proyecto}</Typography>
    },
    {
      id: 'deuda', label: 'Estado Deuda',
      render: (s) => {
        let color: 'success' | 'warning' | 'error' = 'success';
        if (s.meses_a_pagar > 0) color = 'warning';
        if (s.meses_a_pagar >= 3) color = 'error';

        return (
          <Chip
            label={s.meses_a_pagar === 0 ? 'Al día' : `${s.meses_a_pagar} cuota(s) pend.`}
            size="small" color={color} variant={s.meses_a_pagar > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, borderColor: 'divider', opacity: s.activo ? 1 : 0.6 }}
          />
        );
      }
    },
    {
      id: 'pagado', label: 'Monto Pagado',
      render: (s) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', opacity: s.activo ? 1 : 0.6 }}>
          ${Number(s.monto_total_pagado).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'tokens', label: 'Tokens',
      render: (s) => <Chip label={s.tokens_disponibles} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider', opacity: s.activo ? 1 : 0.6 }} />
    },
    {
      id: 'estado', label: 'Estado',
      render: (s) => (
        <Chip
          label={s.activo ? 'Activa' : 'Cancelada'}
          size="small"
          color={s.activo ? 'success' : 'default'}
          variant={s.activo ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, opacity: s.activo ? 1 : 0.7 }}
        />
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (s) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Ver Detalle">
            <IconButton
              onClick={() => logic.handleVerDetalle(s)}
              size="small"
              sx={{ color: 'primary.main', bgcolor: alpha(logic.theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(logic.theme.palette.primary.main, 0.2) } }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {s.activo && (
            <Tooltip title="Cancelar Suscripción (Admin)">
              <IconButton
                onClick={() => logic.handleCancelarClick(s)}
                disabled={logic.isCancelling}
                size="small"
                sx={{ color: 'error.main', bgcolor: alpha(logic.theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(logic.theme.palette.error.main, 0.2) } }}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ], [logic]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader title="Gestión de Suscripciones" subtitle="Monitor de suscripciones activas, canceladas y métricas clave" />

      <Tabs value={logic.tabIndex} onChange={logic.handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Suscripciones Activas" />
        <Tab label="Historial Cancelaciones" />
      </Tabs>

      {/* --- TAB 0: ACTIVAS Y GESTIÓN --- */}
      <div role="tabpanel" hidden={logic.tabIndex !== 0}>
        {logic.tabIndex === 0 && (
          <Box>
            {/* KPIs */}
            <Stack spacing={2} mb={4}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <StatCard title="Total Histórico" value={logic.stats.totalSuscripciones} icon={<Groups />} color="primary" loading={logic.isLoadingStats} subtitle="Todas las suscripciones" />
                <StatCard title="Activas Hoy" value={logic.stats.totalActivas} icon={<CheckCircle />} color="success" loading={logic.isLoadingStats} subtitle="En curso actualmente" />
                <StatCard title="Canceladas" value={logic.stats.totalCanceladas} icon={<Cancel />} color="error" loading={logic.isLoadingStats} subtitle="Bajas totales" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <StatCard title="Tasa Cancelación" value={`${logic.stats.tasaCancelacion}%`} icon={<TrendingDown />} color="warning" loading={logic.isLoadingStats} subtitle="Churn Rate Global" />
                <StatCard title="Tasa Morosidad" value={`${logic.stats.tasaMorosidad}%`} icon={<Warning />} color="error" loading={logic.isLoadingStats} subtitle={`$${Number(logic.stats.totalEnRiesgo).toLocaleString()} en riesgo`} />
                <StatCard title="Total Generado" value={`$${Number(logic.stats.totalGenerado).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={<MonetizationOn />} color="info" loading={logic.isLoadingStats} subtitle="Ingresos brutos acumulados" />
              </Box>
            </Stack>

            {/* FILTROS */}
            <FilterBar>
              <TextField
                placeholder="Buscar por usuario, email o ID..."
                size="small" sx={{ flexGrow: 1 }}
                value={logic.searchTerm} onChange={(e) => logic.setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }}
              />
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

              <FilterSelect
                label="Proyecto" value={logic.filterProject}
                onChange={(e) => logic.setFilterProject(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {logic.proyectos.filter((p: any) => p.tipo_inversion === 'mensual').map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Estado" value={logic.filterStatus}
                onChange={(e) => logic.setFilterStatus(e.target.value as any)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="activas">Solo Activas</MenuItem>
                <MenuItem value="inactivas">Solo Canceladas</MenuItem>
                <MenuItem value="all">Todas</MenuItem>
              </FilterSelect>
            </FilterBar>

            {/* TABLA */}
            <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
              <DataTable
                columns={columns}
                // ✨ Datos Ordenados
                data={logic.filteredSuscripciones}
                getRowKey={(s) => s.id}

                // ✨ UX Props
                highlightedRowId={logic.highlightedId}
                isRowActive={(s) => s.activo}

                emptyMessage="No se encontraron suscripciones con los filtros actuales."
                pagination={true}
                defaultRowsPerPage={10}
              />
            </QueryHandler>

            {/* MODALES */}
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
        )}
      </div>

      {/* --- TAB 1: HISTORIAL CANCELACIONES --- */}
      <div role="tabpanel" hidden={logic.tabIndex !== 1}>
        {logic.tabIndex === 1 && <CancelacionesTab />}
      </div>

    </PageContainer>
  );
};

export default AdminSuscripciones;
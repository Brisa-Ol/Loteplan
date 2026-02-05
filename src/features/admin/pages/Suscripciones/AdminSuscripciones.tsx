import React, { useMemo } from 'react';
import {
  Avatar, Box, Chip, IconButton, InputAdornment,
  MenuItem, Stack, TextField, Tooltip, Typography, alpha
} from '@mui/material';
import {
  Cancel, CheckCircle, Groups, MonetizationOn,
  Search, TrendingDown, Visibility, Warning
} from '@mui/icons-material';

import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';
import CancelacionesTab from './components/CancelacionesTab';

import { useAdminSuscripciones } from '../../hooks/useAdminSuscripciones';
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';

// ============================================================================
// SUB-COMPONENTE: UserCell (Memoizado para performance)
// ============================================================================
const UserCell = React.memo<{ suscripcion: SuscripcionDto; theme: any }>(
  ({ suscripcion, theme }) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: suscripcion.activo
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.grey[500], 0.1),
          color: suscripcion.activo ? 'primary.main' : 'text.disabled',
          fontSize: 14,
          fontWeight: 'bold',
        }}
      >
        {suscripcion.usuario?.nombre?.charAt(0) || '#'}
      </Avatar>
      <Box minWidth={0} flex={1}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {suscripcion.usuario?.nombre} {suscripcion.usuario?.apellido}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {suscripcion.usuario?.email || 'Sin email'}
        </Typography>
      </Box>
    </Stack>
  )
);

UserCell.displayName = 'UserCell';

// ============================================================================
// SUB-COMPONENTE: DebtStatusChip (Memoizado)
// ============================================================================
const DebtStatusChip = React.memo<{ mesesAPagar: number }>(({ mesesAPagar }) => {
  const getDebtConfig = (meses: number) => {
    if (meses === 0)
      return { color: 'success' as const, label: 'Al día', variant: 'outlined' as const };
    if (meses >= 3)
      return { color: 'error' as const, label: `${meses} cuotas pend.`, variant: 'filled' as const };
    return { color: 'warning' as const, label: `${meses} cuotas pend.`, variant: 'filled' as const };
  };

  const config = getDebtConfig(mesesAPagar);

  return (
    <Chip
      label={config.label}
      size="small"
      color={config.color}
      variant={config.variant}
      sx={{ fontWeight: 800, fontSize: '0.65rem', minWidth: 100 }}
    />
  );
});

DebtStatusChip.displayName = 'DebtStatusChip';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();

  // ============================================================================
  // ALERTAS CRÍTICAS DINÁMICAS
  // ============================================================================
  const criticalAlerts = useMemo(() => {
    const alerts = [];

    // Alerta de Morosidad Alta
    if (logic.stats.tasaMorosidad > 15) {
      alerts.push({
        severity: 'error' as const,
        title: 'Morosidad Crítica',
        message: `La tasa de morosidad es del ${logic.stats.tasaMorosidad}% (${logic.stats.totalEnRiesgo.toLocaleString()} ARS en riesgo). Requiere acción inmediata.`,
        action: {
          label: 'Ver Morosos',
          onClick: () => logic.setFilterStatus('inactivas'), // Asume que inactivos incluye morosos en este contexto de filtro
        },
      });
    }

    // Alerta de Churn Rate Alto
    if (logic.stats.tasaCancelacion > 20) {
      alerts.push({
        severity: 'warning' as const,
        title: 'Alta Tasa de Cancelación',
        message: `El churn rate es del ${logic.stats.tasaCancelacion}%. Considera revisar la satisfacción del cliente.`,
        action: {
          label: 'Ver Cancelaciones',
          onClick: () => logic.setTabIndex(1),
        },
      });
    }

    return alerts;
  }, [logic.stats, logic.setFilterStatus, logic.setTabIndex]);

  // ============================================================================
  // COLUMNAS DE TABLA (Memoizado para performance)
  // ============================================================================
  const columns = useMemo<DataTableColumn<SuscripcionDto>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 60,
        render: (s) => (
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            #{s.id}
          </Typography>
        ),
      },
      {
        id: 'usuario',
        label: 'Usuario',
        minWidth: 220,
        render: (s) => <UserCell suscripcion={s} theme={logic.theme} />,
      },
      {
        id: 'proyecto',
        label: 'Proyecto',
        minWidth: 150,
        render: (s) => (
          <Typography variant="body2" fontWeight={600} color="primary.main" noWrap>
            {s.proyectoAsociado?.nombre_proyecto || 'Sin proyecto'}
          </Typography>
        ),
      },
      {
        id: 'deuda',
        label: 'Estado',
        minWidth: 130,
        render: (s) => <DebtStatusChip mesesAPagar={s.meses_a_pagar} />,
      },
      {
        id: 'pagado',
        label: 'Total Pagado',
        render: (s) => (
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
            ${Number(s.monto_total_pagado).toLocaleString('es-AR')}
          </Typography>
        ),
      },
      {
        id: 'tokens',
        label: 'Tokens',
        render: (s) => (
          <Chip
            label={`${s.tokens_disponibles}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.65rem', minWidth: 50 }}
          />
        ),
      },
      {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        render: (s) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Ver Detalle">
              <IconButton
                onClick={() => logic.handleVerDetalle(s)}
                size="small"
                sx={{
                  color: 'primary.main',
                  bgcolor: alpha(logic.theme.palette.primary.main, 0.05),
                  '&:hover': { bgcolor: alpha(logic.theme.palette.primary.main, 0.15) },
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>

            {s.activo && (
              <Tooltip title="Cancelar Suscripción">
                <IconButton
                  onClick={() => logic.handleCancelarClick(s)}
                  disabled={logic.isCancelling}
                  size="small"
                  sx={{
                    color: 'error.main',
                    bgcolor: alpha(logic.theme.palette.error.main, 0.05),
                    '&:hover': { bgcolor: alpha(logic.theme.palette.error.main, 0.15) },
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [logic.theme, logic.handleVerDetalle, logic.handleCancelarClick, logic.isCancelling]
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* HEADER */}
      <AdminPageHeader
        title="Gestión de Suscripciones"
        subtitle="Monitoreo de recaudación, morosidad y estados de planes mensuales"
      />

      {/* ALERTAS CRÍTICAS */}
      {criticalAlerts.map((alert, index) => (
        <AlertBanner key={index} {...alert} />
      ))}

      {/* TABS DE NAVEGACIÓN */}
      <Box
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={0}>
          <Box
            onClick={() => logic.setTabIndex(0)}
            sx={{
              px: 3,
              py: 1.5,
              cursor: 'pointer',
              fontWeight: 700,
              borderBottom: logic.tabIndex === 0 ? 2 : 0,
              borderColor: 'primary.main',
              color: logic.tabIndex === 0 ? 'primary.main' : 'text.secondary',
              '&:hover': {
                bgcolor: alpha(logic.theme.palette.primary.main, 0.05),
              },
            }}
          >
            Suscripciones Activas
          </Box>
          <Box
            onClick={() => logic.setTabIndex(1)}
            sx={{
              px: 3,
              py: 1.5,
              cursor: 'pointer',
              fontWeight: 700,
              borderBottom: logic.tabIndex === 1 ? 2 : 0,
              borderColor: 'primary.main',
              color: logic.tabIndex === 1 ? 'primary.main' : 'text.secondary',
              '&:hover': {
                bgcolor: alpha(logic.theme.palette.primary.main, 0.05),
              },
            }}
          >
            Historial de Cancelaciones
          </Box>
        </Stack>
      </Box>

      {/* TAB 0: GESTIÓN PRINCIPAL */}
      {logic.tabIndex === 0 && (
        <Box>
          {/* KPIs EN GRID OPTIMIZADO */}
          <MetricsGrid columns={{ xs: 1, sm: 2, lg: 3 }}>
            <StatCard
              title="Total Histórico"
              value={logic.stats.totalSuscripciones}
              icon={<Groups />}
              color="primary"
              loading={logic.isLoadingStats}
              subtitle="Registro global"
            />
            <StatCard
              title="Activas"
              value={logic.stats.totalActivas}
              icon={<CheckCircle />}
              color="success"
              loading={logic.isLoadingStats}
              subtitle="Generando ingresos"
            />
            <StatCard
              title="Canceladas"
              value={logic.stats.totalCanceladas}
              icon={<Cancel />}
              color="error"
              loading={logic.isLoadingStats}
              subtitle="Bajas acumuladas"
            />
          </MetricsGrid>

          <MetricsGrid columns={{ xs: 1, sm: 2, lg: 3 }} sx={{ mb: 3 }}>
            <StatCard
              title="Churn Rate"
              value={`${logic.stats.tasaCancelacion}%`}
              icon={<TrendingDown />}
              color="warning"
              loading={logic.isLoadingStats}
              subtitle="Tasa de cancelación"
            />
            <StatCard
              title="Morosidad"
              value={`${logic.stats.tasaMorosidad}%`}
              icon={<Warning />}
              color="error"
              loading={logic.isLoadingStats}
              subtitle={`$${Number(logic.stats.totalEnRiesgo).toLocaleString()} en mora`}
            />
            <StatCard
              title="Recaudación Total"
              value={`$${Number(logic.stats.totalGenerado).toLocaleString('es-AR', {
                maximumFractionDigits: 0,
              })}`}
              icon={<MonetizationOn />}
              color="info"
              loading={logic.isLoadingStats}
              subtitle="Ingresos acumulados"
            />
          </MetricsGrid>

          {/* FILTROS */}
          <FilterBar sx={{ mb: 3 }}>
            <TextField
              placeholder="Buscar por usuario o email..."
              size="small"
              sx={{ flexGrow: 1 }}
              value={logic.searchTerm}
              onChange={(e) => logic.setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FilterSelect
              label="Proyecto"
              value={logic.filterProject}
              onChange={(e) => logic.setFilterProject(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {logic.proyectos
                .filter((p: any) => p.tipo_inversion === 'mensual')
                .map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre_proyecto}
                  </MenuItem>
                ))}
            </FilterSelect>

            <FilterSelect
              label="Estado"
              value={logic.filterStatus}
              onChange={(e) => logic.setFilterStatus(e.target.value as any)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="activas">Solo Activas</MenuItem>
              <MenuItem value="inactivas">Canceladas</MenuItem>
            </FilterSelect>
          </FilterBar>

          {/* TABLA DE DATOS */}
          <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
            <DataTable
              columns={columns}
              data={logic.filteredSuscripciones}
              getRowKey={(s) => s.id}
              isRowActive={(s) => s.activo}
              // 🔥 CORRECCIÓN: false para respetar el filtro del select "Estado"
              showInactiveToggle={false}
              inactiveLabel="Canceladas"
              highlightedRowId={logic.highlightedId}
              emptyMessage="No se encontraron suscripciones que coincidan con los filtros."
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

      {/* TAB 1: HISTORIAL DE CANCELACIONES */}
      {logic.tabIndex === 1 && <CancelacionesTab />}
    </PageContainer>
  );
};

export default AdminSuscripciones;
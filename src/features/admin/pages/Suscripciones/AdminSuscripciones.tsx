// src/features/admin/pages/Suscripciones/AdminSuscripciones.tsx

import {
  Cancel, CheckCircle, Groups,
  Token,
  TrendingDown, Visibility,
  WarningAmber
} from '@mui/icons-material';
import {
  Avatar, Box, Chip, IconButton,
  MenuItem,
  Paper,
  Stack,
  Typography, alpha, useTheme
} from '@mui/material';
import React, { useMemo } from 'react';

// Componentes Shared
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader'; // ✅ Componente aplicado
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

// Componentes de Filtrado Premium
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';

// Importaciones de Sub-componentes
import CancelacionesTab from './components/CancelacionesTab';
import DetalleSuscripcionModal from './modals/DetalleSuscripcionModal';

// Hooks y tipos
import type { SuscripcionDto } from '@/core/types/dto/suscripcion.dto';
import { useAdminSuscripciones } from '../../hooks/finanzas/useAdminSuscripciones';

// ============================================================================
// SUB-COMPONENTE: UserCell
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
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {suscripcion.usuario?.email || 'Sin email'}
        </Typography>
      </Box>
    </Stack>
  )
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();
  const theme = useTheme();

  const proyectoMenuProps = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    disableScrollLock: true,
    PaperProps: {
      sx: {
        mt: 1.4, 
        maxHeight: 300,
        borderRadius: '12px',
        minWidth: 280,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        '& .MuiMenuItem-root': { fontSize: '0.85rem', py: 1 },
      }
    }
  };

  const criticalAlerts = useMemo(() => {
    const alerts = [];
    if (logic.stats.tasaMorosidad > 15) {
      alerts.push({
        severity: 'error' as const,
        title: 'Morosidad Crítica',
        message: `La tasa de morosidad es del ${logic.stats.tasaMorosidad}% ($${Number(logic.stats.totalEnRiesgo).toLocaleString()} en riesgo).`,
        action: { label: 'Ver Morosos', onClick: () => logic.setFilterStatus('inactivas') },
      });
    }
    return alerts;
  }, [logic]);

  const columns = useMemo<DataTableColumn<SuscripcionDto>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 60,
        render: (s) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{s.id}</Typography>,
      },
      {
        id: 'usuario',
        label: 'Titular',
        minWidth: 200,
        render: (s) => <UserCell suscripcion={s} theme={theme} />,
      },
      {
        id: 'proyecto',
        label: 'Proyecto & Estado',
        minWidth: 220,
        render: (s) => (
          <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
              {s.proyectoAsociado?.nombre_proyecto || 'S/D'}
            </Typography>
            <Stack direction="row" spacing={1} mt={0.5}>
              <Chip
                label={s.proyectoAsociado?.estado_proyecto?.toUpperCase()}
                size="small"
                variant="outlined"
                color={s.proyectoAsociado?.estado_proyecto === 'En proceso' ? 'success' : 'default'}
                sx={{ fontSize: '0.6rem', height: 18, fontWeight: 800 }}
              />
              <Typography variant="caption" color="text.disabled">
                {s.proyectoAsociado?.suscripciones_actuales}/{s.proyectoAsociado?.obj_suscripciones} cupos
              </Typography>
            </Stack>
          </Box>
        ),
      },
      {
        id: 'progreso',
        label: 'Plan y Tokens',
        minWidth: 160,
        align: 'center',
        render: (s) => (
          <Stack alignItems="center" spacing={0.5}>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                icon={<Token sx={{ fontSize: '14px !important' }} />}
                label={`${s.tokens_disponibles} Tkn`} 
                color={s.tokens_disponibles > 0 ? "warning" : "default"}
                variant="filled"
                sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }}
              />
              <Chip
                label={`${s.meses_a_pagar} cuotas`} 
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Plazo total: {s.proyectoAsociado?.plazo_inversion} meses
            </Typography>
          </Stack>
        )
      },
      {
        id: 'finanzas',
        label: 'Saldos',
        minWidth: 160,
        render: (s) => (
          <Box>
            <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
              Pagado: ${Number(s.monto_total_pagado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            {Number(s.saldo_a_favor) > 0 && (
              <Typography variant="caption" color="success.main" fontWeight={800} display="block">
                A favor: +${Number(s.saldo_a_favor).toLocaleString('es-AR')}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        id: 'auditoria',
        label: 'Registro',
        minWidth: 150,
        render: (s) => (
          <Box>
            <Typography variant="caption" display="block" fontWeight={600} color="text.primary">
              Alta: {new Date(s.createdAt).toLocaleDateString('es-AR')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hora: {new Date(s.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        )
      },
      {
        id: 'acciones',
        label: '',
        align: 'right',
        render: (s) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton onClick={() => logic.handleVerDetalle(s)} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Visibility fontSize="small" />
            </IconButton>
            {s.activo && (
              <IconButton onClick={() => logic.handleCancelarClick(s)} size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                <Cancel fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ),
      },
    ],
    [theme, logic]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* ✅ HEADER ESTANDARIZADO APLICADO */}
      <AdminPageHeader
        title="Gestión de Planes de Ahorro"
        subtitle="Monitoreo de recaudación, morosidad y estados de planes"
      />

      {criticalAlerts.map((alert, index) => <AlertBanner key={index} {...alert} />)}

      {/* SELECTOR DE PESTAÑAS */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Stack direction="row" spacing={1}>
          <Chip
            label="Suscripciones Activas"
            onClick={() => logic.setTabIndex(0)}
            color={logic.tabIndex === 0 ? "primary" : "default"}
            variant={logic.tabIndex === 0 ? "filled" : "outlined"}
            sx={{ fontWeight: 700, px: 1 }}
          />
          <Chip
            label="Historial de Bajas"
            onClick={() => logic.setTabIndex(1)}
            color={logic.tabIndex === 1 ? "primary" : "default"}
            variant={logic.tabIndex === 1 ? "filled" : "outlined"}
            sx={{ fontWeight: 700, px: 1 }}
          />
        </Stack>
      </Box>

      {logic.tabIndex === 0 ? (
        <Box>
          <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
            <StatCard title="Total Registros" value={logic.stats.totalSuscripciones} icon={<Groups />} color="primary" loading={logic.isLoadingStats} />
            <StatCard title="Activas" value={logic.stats.totalActivas} icon={<CheckCircle />} color="success" loading={logic.isLoadingStats} />
            <StatCard title="Morosidad" value={`${logic.stats.tasaMorosidad}%`} icon={<WarningAmber />} color="error" loading={logic.isLoadingStats} />
            <StatCard title="Churn Rate" value={`${logic.stats.tasaCancelacion}%`} icon={<TrendingDown />} color="warning" loading={logic.isLoadingStats} />
          </MetricsGrid>

          {/* BARRA DE FILTROS */}
          <FilterBar>
            <FilterSearch
              placeholder="Buscar por titular, email o proyecto..."
              value={logic.searchTerm}
              onSearch={logic.setSearchTerm}
            />
            <FilterSelect
              label="Proyecto"
              value={logic.filterProject}
              onChange={(e: any) => logic.setFilterProject(e.target.value)}
              SelectProps={{
                MenuProps: proyectoMenuProps 
              }}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {logic.proyectos
                .filter((p: any) => p.tipo_inversion === 'mensual')
                .map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="body2">{p.nombre_proyecto}</Typography>
                    </Stack>
                  </MenuItem>
                ))
              }
            </FilterSelect>
          </FilterBar>

          <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
              <DataTable
                columns={columns}
                data={logic.filteredSuscripciones}
                getRowKey={(s) => s.id}
                isRowActive={(s) => !!s.activo}
                showInactiveToggle={false}
                highlightedRowId={logic.highlightedId}
                emptyMessage="No se encontraron registros activos."
                pagination
              />
            </Paper>
          </QueryHandler>

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
      ) : (
        <CancelacionesTab />
      )}
    </PageContainer>
  );
};

export default AdminSuscripciones;
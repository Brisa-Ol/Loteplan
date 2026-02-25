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
  Stack, Tooltip, Typography, alpha, useTheme
} from '@mui/material';
import React, { useMemo } from 'react';

// Componentes Shared
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
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
import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';

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
        mt: 1.4, // 🚀 Baja el menú para no tapar el label
        maxHeight: 300,
        borderRadius: '12px',
        minWidth: 280,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        '& .MuiMenuItem-root': { fontSize: '0.85rem', py: 1 }, // 🚀 Letra más chica
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
        action: { label: 'Ver Morosos', onClick: () => logic.setFilterStatus('inactivas') }, // Ajustar filtro si existe uno de morosos
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
        label: 'Usuario / Inversor',
        minWidth: 220,
        render: (s) => <UserCell suscripcion={s} theme={theme} />,
      },
      {
        id: 'proyecto',
        label: 'Proyecto Asociado',
        minWidth: 200,
        render: (s) => (
          <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
              {s.proyectoAsociado?.nombre_proyecto || 'Cargando...'}
            </Typography>
            <Typography variant="caption" color="text.secondary">ID: #{s.id_proyecto}</Typography>
          </Box>
        ),
      },
      // 🆕 NUEVA COLUMNA: Progreso y Tokens
      {
        id: 'progreso',
        label: 'Estado del Plan',
        align: 'center',
        render: (s) => (
          <Stack alignItems="center">
            <Chip
              size="small"
              icon={<Token sx={{ fontSize: '14px !important' }} />}
              label={`${s.tokens_disponibles} Tokens`}
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, mb: 0.5, height: 20, fontSize: '0.65rem' }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {s.meses_a_pagar} cuotas rest.
            </Typography>
          </Stack>
        )
      },
      // 🆕 COLUMNA ACTUALIZADA: Finanzas
      {
        id: 'finanzas',
        label: 'Finanzas',
        render: (s) => (
          <Box>
            <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
              ${Number(s.monto_total_pagado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            {Number(s.saldo_a_favor) > 0 && (
              <Typography variant="caption" color="success.main" fontWeight={800} sx={{ display: 'block' }}>
                + ${Number(s.saldo_a_favor).toLocaleString('es-AR')} a favor
              </Typography>
            )}
          </Box>
        ),
      },
      {
        id: 'acciones',
        label: '',
        align: 'right',
        render: (s) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Ver Detalles y Cronograma">
              <IconButton onClick={() => logic.handleVerDetalle(s)} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            {s.activo && (
              <Tooltip title="Dar de Baja / Cancelar">
                <IconButton onClick={() => logic.handleCancelarClick(s)} disabled={logic.isCancelling} size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [theme, logic]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
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
          {/* 🆕 SE AGREGÓ EL KPI DE MOROSIDAD (Cambiado a 4 columnas) */}
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
                MenuProps: proyectoMenuProps // 👈 Usamos la config con apertura inferior y letra chica
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
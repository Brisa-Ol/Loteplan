import React, { useMemo } from 'react';
import {
  AccessTime,
  AccountBalanceWallet,
  CheckCircle,
  ErrorOutline,
  Visibility,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Chip, IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  Avatar
} from '@mui/material';

import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar';

import DetalleResumenModal from './modals/DetalleResumenModal';

import type { ResumenCuentaDto } from '../../../../../core/types/dto/resumenCuenta.dto';
import { useAdminResumenes } from '@/features/admin/hooks/useAdminResumenes';

const AdminResumenesCuenta: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminResumenes();

  // --- DEFINICIÓN DE COLUMNAS ---
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

        return (
          <Chip
            label={isCompleted ? 'COMPLETADO' : hasOverdue ? 'CON DEUDA' : 'AL DÍA'}
            color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
            size="small"
            variant={isCompleted || hasOverdue ? 'filled' : 'outlined'}
            icon={
                isCompleted ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : 
                hasOverdue ? <ErrorOutline sx={{ fontSize: '14px !important' }} /> : 
                undefined
            }
            sx={{ fontWeight: 800, fontSize: '0.65rem', minWidth: 100 }}
          />
        );
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

      <PageHeader
        title="Resúmenes de Cuenta"
        subtitle="Control de progreso de cobranza y estado financiero de suscripciones activas."
      />

      {/* Barra de Filtros */}
      <FilterBar>
        <FilterSearch
          placeholder="Buscar por proyecto o ID..."
          value={logic.searchTerm} 
          onSearch={logic.setSearchTerm} 
          sx={{ flexGrow: 1 }}
        />

        <FilterSelect
          label="Filtrar Estado"
          value={logic.filterState}
          onChange={(e) => logic.setFilterState(e.target.value as any)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">Todos los Estados</MenuItem>
          <MenuItem value="active">Activos (Al día)</MenuItem>
          <MenuItem value="overdue">Con Cuotas Vencidas</MenuItem>
          <MenuItem value="completed">Planes Completados</MenuItem>
        </FilterSelect>
      </FilterBar>

      {/* Tabla Principal */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.filteredResumenes}
          getRowKey={(row) => row.id} 
          
          // ✅ INTEGRACIÓN: Consideramos "Inactivo" a lo que ya está pagado al 100%
          isRowActive={(row) => row.porcentaje_pagado < 100} 
          showInactiveToggle={true}
          inactiveLabel="Completados"
          
          highlightedRowId={logic.highlightedId} 
          emptyMessage="No se encontraron resúmenes de cuenta registrados."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modal Detalle */}
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
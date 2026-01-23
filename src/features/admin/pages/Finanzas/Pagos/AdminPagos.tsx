import React, { useMemo } from 'react';
import { 
  Box, Typography, TextField, MenuItem, 
  InputAdornment, Chip, IconButton, Tooltip, Stack, 
  Alert, AlertTitle, Avatar, alpha 
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
import { FilterBar, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar/FilterBar';

import DetallePagoModal from './components/DetallePagoModal';
import { useAdminPagos } from '../../../hooks/useAdminPagos';
import type { PagoDto } from '../../../../../core/types/dto/pago.dto';

const AdminPagos: React.FC = () => {
  const logic = useAdminPagos(); 

  const columns = useMemo<DataTableColumn<PagoDto>[]>(() => [
    { 
      id: 'id', label: 'ID', minWidth: 50,
      render: (p) => <Typography variant="body2" color="text.secondary">#{p.id}</Typography>
    },
    { 
      id: 'usuario', label: 'Usuario', minWidth: 200,
      render: (p) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ 
                width: 28, height: 28, 
                bgcolor: alpha(logic.theme.palette.primary.main, 0.1), 
                color: 'primary.main', 
                fontSize: 12, fontWeight: 'bold'
            }}>
                <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>
                {logic.getUserName(p.id_usuario)}
            </Typography>
        </Stack>
      )
    },
    { 
      id: 'proyecto', label: 'Proyecto', minWidth: 150,
      render: (p) => <Typography variant="body2" fontWeight={500}>{logic.getProjectName(p.id_proyecto)}</Typography>
    },
    { 
      id: 'mes', label: 'Cuota', 
      render: (p) => <Chip label={`Mes ${p.mes}`} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />
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
        <Typography variant="body2">
            {new Date(p.fecha_vencimiento).toLocaleDateString('es-AR')}
        </Typography>
      )
    },
    { 
      id: 'estado', label: 'Estado', 
      render: (p) => (
        <Chip 
            label={p.estado_pago.replace('_', ' ')} 
            size="small" 
            color={
                p.estado_pago === 'pagado' ? 'success' : 
                p.estado_pago === 'vencido' ? 'error' : 
                p.estado_pago === 'pendiente' ? 'warning' : 'default'
            } 
            variant={p.estado_pago === 'pagado' ? 'filled' : 'outlined'}
            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      )
    },
    { 
      id: 'acciones', label: 'Acciones', align: 'right', 
      render: (p) => (
        <Tooltip title="Ver Detalle / Gestionar">
            <IconButton 
                size="small" 
                color="primary" 
                onClick={() => logic.handleVerDetalle(p)}
                sx={{ bgcolor: alpha(logic.theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(logic.theme.palette.primary.main, 0.2) } }}
            >
                <Visibility fontSize="small" />
            </IconButton>
        </Tooltip>
      )
    }
  ], [logic]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
         title="Control de Pagos"
         subtitle="Gestión centralizada de cuotas y recaudación."
      />

      {/* ALERTAS */}
      <Stack spacing={2} mb={4}>
        {logic.alerts.veryOverdue.length > 0 && (
          <Alert severity="error" icon={<Warning />} sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Atención: Alta Morosidad</AlertTitle>
            Hay <strong>{logic.alerts.veryOverdue.length} pagos</strong> vencidos hace más de 30 días. Revise los filtros.
          </Alert>
        )}
        {logic.alerts.dueSoon.length > 0 && (
          <Alert severity="info" icon={<AccessTime />} sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Recordatorio</AlertTitle>
            Hay <strong>{logic.alerts.dueSoon.length} pagos</strong> próximos a vencer en los siguientes 7 días.
          </Alert>
        )}
      </Stack>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Total Pendiente (Global)" value={`$${logic.globalStats.totalPendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} subtitle="Acumulado histórico" color="warning" icon={<AccessTime />} loading={logic.isLoading} />
        <StatCard title="Recaudado (Mes Actual)" value={`$${Number(logic.metrics?.total_recaudado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} subtitle={`${logic.metrics?.total_pagos_pagados || 0} pagos procesados`} color="success" icon={<AttachMoney />} loading={logic.isLoading} />
        <StatCard title="Pagos Vencidos (Mes)" value={logic.metrics?.total_pagos_vencidos.toString() || '0'} subtitle="Requieren seguimiento" color="error" icon={<Warning />} loading={logic.isLoading} />
        <StatCard title="Tasa de Morosidad" value={`${logic.metrics?.tasa_morosidad || '0'}%`} subtitle="Mes Actual" color="info" icon={<TrendingDown />} loading={logic.isLoading} />
      </Box>

      {/* FILTROS */}
      <FilterBar>
        <TextField 
          placeholder="Buscar (Usuario, Proyecto, ID...)" size="small" 
          sx={{ flexGrow: 2, minWidth: 200 }}
          value={logic.searchTerm} onChange={(e) => logic.setSearchTerm(e.target.value)} 
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>, sx: { borderRadius: 2 } }}
        />
        
        <FilterSelect label="Estado" value={logic.filterState} onChange={(e) => logic.setFilterState(e.target.value)} sx={{ flexGrow: 1, minWidth: 150 }}>
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="pagado">Pagado</MenuItem>
          <MenuItem value="vencido">Vencido</MenuItem>
          <MenuItem value="cubierto_por_puja">Cubierto por Puja</MenuItem>
          <MenuItem value="cancelado">Cancelado</MenuItem>
        </FilterSelect>
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
          <DateRange color="action" />
          <TextField type="date" size="small" value={logic.dateStart} onChange={(e) => logic.setDateStart(e.target.value)} InputProps={{ sx: { borderRadius: 2 } }} />
          <TextField type="date" size="small" value={logic.dateEnd} onChange={(e) => logic.setDateEnd(e.target.value)} InputProps={{ sx: { borderRadius: 2 } }} />
        </Stack>
      </FilterBar>

      {/* TABLA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
            columns={columns}
            // ✨ Datos ordenados
            data={logic.filteredPagos}
            getRowKey={(p) => p.id}
            
            // ✨ Highlight visual
            highlightedRowId={logic.highlightedId}
            
            isRowActive={(p) => p.estado_pago !== 'cancelado' && p.estado_pago !== 'cubierto_por_puja'}
            emptyMessage="No se encontraron pagos con estos filtros."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

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
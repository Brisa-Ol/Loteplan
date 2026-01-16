import React, { useMemo } from 'react';
import { 
  Box, Typography, Chip, IconButton, Tooltip, 
  MenuItem, Avatar, Stack, alpha 
} from '@mui/material';
import { 
  Visibility, ErrorOutline, Bolt, Person 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import ModalDetalleTransaccion from './modal/ModalDetalleTransaccion';
import { useAdminTransacciones } from '../../../hooks/useAdminTransacciones';

import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../../shared/components/layout/headers/PageHeader';

import { QueryHandler } from '../../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import type { TransaccionDto } from '../../../../../core/types/dto/transaccion.dto';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';


const AdminTransacciones: React.FC = () => {
  const logic = useAdminTransacciones(); // Hook

  // Columnas (Memoizadas aquí para acceder a theme y handlers)
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 50,
      render: (row) => <Typography variant="body2" color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'usuario', label: 'Usuario', minWidth: 220,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: alpha(logic.theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                {row.usuario?.nombre?.[0]?.toUpperCase() || <Person fontSize="small" />}
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={600}>
                    {row.usuario ? `${row.usuario.nombre} ${row.usuario.apellido}` : `ID: ${row.id_usuario}`}
                </Typography>
                {row.usuario?.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        {row.usuario.email}
                    </Typography>
                )}
            </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto', label: 'Proyecto / Detalle', minWidth: 180,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={500}>
                {row.tipo_transaccion === 'pago_suscripcion_inicial' ? 'Suscripción Inicial' : 
                 row.tipo_transaccion === 'directo' ? 'Inversión Directa' : 
                 row.tipo_transaccion === 'mensual' ? 'Cuota Mensual' :
                 row.tipo_transaccion}
            </Typography>
            {row.proyectoTransaccion?.nombre_proyecto ? (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                    {row.proyectoTransaccion.nombre_proyecto}
                </Typography>
            ) : (
                <Typography variant="caption" color="text.disabled">Sin proyecto asignado</Typography>
            )}
        </Box>
      )
    },
    {
      id: 'monto', label: 'Monto',
      render: (row) => (
        <Typography fontWeight={700} color="success.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(row.monto).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
            <Chip 
                label={row.estado_transaccion} 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                color={logic.getStatusColor(row.estado_transaccion) as any} 
                size="small" 
                variant={row.estado_transaccion === 'pagado' ? 'filled' : 'outlined'}
                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
            />
            {row.error_detalle && (
                <Tooltip title={row.error_detalle}>
                    <ErrorOutline color="error" fontSize="small" />
                </Tooltip>
            )}
        </Box>
      )
    },
    {
      id: 'fecha', label: 'Fecha',
      render: (row) => (
        <Typography variant="caption" color="text.secondary">
            {row.fecha_transaccion ? format(new Date(row.fecha_transaccion), 'dd/MM HH:mm', { locale: es }) : '-'}
        </Typography>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Ver Detalles">
                <IconButton 
                    size="small"
                    onClick={() => logic.handleViewDetails(row)} 
                    sx={{ color: 'primary.main', bgcolor: alpha(logic.theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(logic.theme.palette.primary.main, 0.2) } }}
                >
                    <Visibility fontSize="small" />
                </IconButton>
            </Tooltip>

            {row.estado_transaccion !== 'pagado' && (
                <Tooltip title="Forzar Confirmación (Manual)">
                    <IconButton 
                        size="small"
                        onClick={() => logic.handleForceConfirmClick(row.id)} 
                        disabled={logic.isConfirming}
                        sx={{ color: 'warning.main', bgcolor: alpha(logic.theme.palette.warning.main, 0.1), '&:hover': { bgcolor: alpha(logic.theme.palette.warning.main, 0.2) } }}
                    >
                        <Bolt fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
      )
    }
  ], [logic]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Auditoría de Transacciones" subtitle="Control financiero y estado de pagos." />

      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por Usuario, Proyecto, ID o Pasarela..." 
            value={logic.searchTerm} 
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            sx={{ flexGrow: 2 }}
        />
        
        <FilterSelect
          label="Estado"
          value={logic.filterStatus}
          onChange={(e) => logic.setFilterStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pagado">Pagados</MenuItem>
          <MenuItem value="pendiente">Pendientes</MenuItem>
          <MenuItem value="fallido">Fallidos</MenuItem>
        </FilterSelect>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
            columns={columns}
            data={logic.filteredData}
            getRowKey={(row) => row.id}
            highlightedRowId={logic.highlightedId}
            isRowActive={(row) => !['fallido', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(row.estado_transaccion)}
            emptyMessage="No se encontraron transacciones."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales */}
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
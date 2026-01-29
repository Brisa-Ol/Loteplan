import React, { useMemo } from 'react';
import { 
  Box, Typography, Chip, IconButton, Tooltip, 
  MenuItem, Avatar, Stack, alpha, useTheme
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
import { FilterBar, FilterSearch, FilterSelect } from '../../../../../shared/components/forms/filters/FilterBar';
import { ConfirmDialog } from '../../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

const AdminTransacciones: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminTransacciones();

  // DEFINICIÓN DE COLUMNAS
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
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            <Chip 
                label={row.estado_transaccion.toUpperCase()} 
                color={logic.getStatusColor(row.estado_transaccion) as any} 
                size="small" 
                variant={row.estado_transaccion === 'pagado' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, fontSize: '0.65rem' }}
            />
            {row.error_detalle && (
                <Tooltip title={row.error_detalle}>
                    <ErrorOutline color="error" sx={{ fontSize: 18 }} />
                </Tooltip>
            )}
        </Stack>
      )
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
        <Stack direction="row" spacing={1} justifyContent="flex-end">
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
      <PageHeader 
        title="Auditoría Financiera" 
        subtitle="Monitoreo de transacciones, pasarelas de pago y conciliación manual." 
      />

      {/* FILTROS */}
      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por cliente, proyecto o ID..." 
            value={logic.searchTerm} 
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
        />
        
        <FilterSelect
          label="Estado de Pago"
          value={logic.filterStatus}
          onChange={(e) => logic.setFilterStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todos los registros</MenuItem>
          <MenuItem value="pagado">Completados</MenuItem>
          <MenuItem value="pendiente">Pendientes</MenuItem>
          <MenuItem value="fallido">Fallidos/Rechazados</MenuItem>
        </FilterSelect>
      </FilterBar>

      {/* TABLA DE DATOS */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
            columns={columns}
            data={logic.filteredData}
            getRowKey={(row) => row.id}
            
            // ✅ Sincronización con DataTable: Fila "Activa" si no es un error terminal
            isRowActive={(row) => !['fallido', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(row.estado_transaccion)}
            showInactiveToggle={true}
            inactiveLabel="Fallidas"
            
            highlightedRowId={logic.highlightedId}
            emptyMessage="No se encontraron transacciones registradas."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* MODALES */}
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
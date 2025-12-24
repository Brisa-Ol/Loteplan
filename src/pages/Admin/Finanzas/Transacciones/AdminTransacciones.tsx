// src/pages/Admin/Transacciones/AdminTransacciones.tsx

import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  TextField, MenuItem, InputAdornment, Avatar, Stack, useTheme, alpha
} from '@mui/material';
import { 
  Search, Visibility, ErrorOutline, Bolt, Person 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import ModalDetalleTransaccion from './modal/ModalDetalleTransaccion';

// Import DataTable
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable';
import TransaccionService from '../../../../Services/transaccion.service';

// Import Hook
import { useModal } from '../../../../hooks/useModal';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pagado': return 'success';
    case 'pendiente': return 'warning';
    case 'fallido': 
    case 'rechazado_por_capacidad':
    case 'rechazado_proyecto_cerrado':
    case 'expirado':
      return 'error';
    default: return 'default';
  }
};

const AdminTransacciones: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal Hooks
  const detailModal = useModal();
  const [selectedTransaccion, setSelectedTransaccion] = useState<TransaccionDto | null>(null);

  // --- QUERIES ---
  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => {
        const res = await TransaccionService.findAll();
        return res.data; 
    },
    staleTime: 0,
    refetchOnMount: true
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => TransaccionService.forceConfirm(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransacciones'] });
      alert(`✅ Éxito: ${response.data.mensaje}`);
      if (detailModal.isOpen) {
        handleCloseModal();
      }
    },
    onError: (err: any) => {
      alert(`❌ Error al confirmar: ${err.response?.data?.error || err.message}`);
    }
  });

  const filteredData = useMemo(() => {
    return transacciones.filter(t => {
      const term = searchTerm.toLowerCase();
      
      const nombreUsuario = t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}`.toLowerCase() : '';
      const emailUsuario = t.usuario?.email.toLowerCase() || '';
      const nombreProyecto = t.proyectoTransaccion?.nombre_proyecto.toLowerCase() || '';
      const refPasarela = t.pagoPasarela?.id_transaccion_pasarela || t.id_pago_pasarela?.toString() || '';

      const matchesSearch = 
        t.id.toString().includes(term) || 
        nombreUsuario.includes(term) ||
        emailUsuario.includes(term) ||
        nombreProyecto.includes(term) ||
        refPasarela.includes(term);

      const matchesStatus = filterStatus === 'all' ? true : t.estado_transaccion === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transacciones, searchTerm, filterStatus]);

  // --- HANDLERS ---
  const handleForceConfirm = (id: number) => {
    if (window.confirm(`⚠️ ¿Forzar confirmación de transacción #${id}?`)) {
      confirmMutation.mutate(id);
    }
  };

  const handleViewDetails = (row: TransaccionDto) => {
    setSelectedTransaccion(row);
    detailModal.open();
  };

  const handleCloseModal = () => {
    detailModal.close();
    setTimeout(() => setSelectedTransaccion(null), 300);
  };

  // ========================================================================
  // ⚙️ COLUMNS DEFINITION
  // ========================================================================
  const columns = useMemo<DataTableColumn<TransaccionDto>[]>(() => [
    {
      id: 'id',
      label: 'ID',
      minWidth: 50,
      render: (row) => <Typography variant="body2" color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'usuario',
      label: 'Usuario',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
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
      id: 'proyecto',
      label: 'Proyecto / Detalle',
      minWidth: 180,
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
      id: 'monto',
      label: 'Monto',
      render: (row) => (
        <Typography fontWeight={700} color="success.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(row.monto).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => (
        <Box display="flex" alignItems="center" gap={1}>
            <Chip 
                label={row.estado_transaccion} 
                color={getStatusColor(row.estado_transaccion) as any} 
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
      id: 'fecha',
      label: 'Fecha',
      render: (row) => (
        <Typography variant="caption" color="text.secondary">
            {row.fecha_transaccion ? format(new Date(row.fecha_transaccion), 'dd/MM HH:mm', { locale: es }) : '-'}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Ver Detalles">
                <IconButton 
                    size="small"
                    onClick={() => handleViewDetails(row)} 
                    sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                >
                    <Visibility fontSize="small" />
                </IconButton>
            </Tooltip>

            {(row.estado_transaccion === 'pendiente' || row.estado_transaccion === 'fallido') && (
                <Tooltip title="Forzar Confirmación">
                    <IconButton 
                        size="small"
                        onClick={() => handleForceConfirm(row.id)} 
                        sx={{ color: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) } }}
                    >
                        <Bolt fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
      )
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
         title="Auditoría de Transacciones"
         subtitle="Control financiero y estado de pagos."
      />

      {/* Toolbar */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, mb: 3, 
            display: 'flex', gap: 2, alignItems: 'center',
            borderRadius: 2, 
            border: '1px solid', borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.6)
        }} 
      >
        <TextField 
          placeholder="Buscar por Usuario, Proyecto, ID o Pasarela..." 
          size="small" 
          sx={{ flexGrow: 1 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
              sx: { borderRadius: 2 }
          }}
        />
        <TextField
          select label="Estado" size="small" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 180 }}
          InputProps={{ sx: { borderRadius: 2 } }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pagado">Pagados</MenuItem>
          <MenuItem value="pendiente">Pendientes</MenuItem>
          <MenuItem value="fallido">Fallidos</MenuItem>
        </TextField>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredData}
            getRowKey={(row) => row.id}
            emptyMessage="No se encontraron transacciones."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modal */}
      <ModalDetalleTransaccion 
        open={detailModal.isOpen}
        transaccion={selectedTransaccion}
        onClose={handleCloseModal}
        onForceConfirm={handleForceConfirm}
        isConfirming={confirmMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminTransacciones;
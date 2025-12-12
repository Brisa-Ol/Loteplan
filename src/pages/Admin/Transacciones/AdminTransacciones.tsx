// src/pages/Admin/Transacciones/AdminTransacciones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  TextField, MenuItem, InputAdornment, Avatar, Stack
} from '@mui/material';
import { 
  Search, Visibility, ErrorOutline, Bolt, Person 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { TransaccionDto } from '../../../types/dto/transaccion.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import ModalDetalleTransaccion from './modal/ModalDetalleTransaccion';

// 👇 Import DataTable
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import TransaccionService from '../../../Services/transaccion.service';

// ✅ 1. Import Hook
import { useModal } from '../../../hooks/useModal';

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
  const queryClient = useQueryClient();
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ✅ 2. Use hook for Modal visibility
  const detailModal = useModal();
  // We keep this state to store DATA, not visibility
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
      // Close modal if it was open with this transaction
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

  // ✅ 3. Updated Handlers for Modal
  const handleViewDetails = (row: TransaccionDto) => {
    setSelectedTransaccion(row);
    detailModal.open();
  };

  const handleCloseModal = () => {
    detailModal.close();
    setSelectedTransaccion(null);
  };

  // ========================================================================
  // ⚙️ COLUMNS DEFINITION
  // ========================================================================
  const columns: DataTableColumn<TransaccionDto>[] = [
    {
      id: 'id',
      label: 'ID',
      minWidth: 50,
      render: (row) => <Typography variant="body2" color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'usuario',
      label: 'Usuario',
      minWidth: 200,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
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
        <Typography fontWeight="bold" color="success.main">
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
                sx={{ textTransform: 'capitalize' }}
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
        <Typography variant="caption">
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
                    color="primary" 
                    // ✅ Use new handler
                    onClick={() => handleViewDetails(row)} 
                    size="small"
                >
                    <Visibility fontSize="small" />
                </IconButton>
            </Tooltip>

            {(row.estado_transaccion === 'pendiente' || row.estado_transaccion === 'fallido') && (
                <Tooltip title="Forzar Confirmación">
                    <IconButton color="warning" onClick={() => handleForceConfirm(row.id)} size="small">
                        <Bolt fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
         title="Auditoría de Transacciones"
         subtitle="Control financiero y estado de pagos."
      />

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar por Usuario, Proyecto, ID o Pasarela..." 
          size="small" 
          sx={{ flexGrow: 1 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
        />
        <TextField
          select label="Estado" size="small" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}
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

      {/* ✅ Modal Controlled by Hook */}
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
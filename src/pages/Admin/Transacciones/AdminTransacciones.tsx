import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  TextField, MenuItem, InputAdornment, Avatar, Stack
} from '@mui/material';
import { 
  Search, Visibility, ErrorOutline, Bolt, Person 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import TransaccionService from '../../../Services/transaccion.service';
import type { TransaccionDto } from '../../../types/dto/transaccion.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import ModalDetalleTransaccion from './modal/ModalDetalleTransaccion';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';


// Ajusta la ruta de importación del Modal si es necesario (ej: './modals/ModalDetalleTransaccion')

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaccion, setSelectedTransaccion] = useState<TransaccionDto | null>(null);

  const { data: transacciones = [], isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['adminTransacciones'],
    queryFn: async () => {
        const res = await TransaccionService.findAll();
        // Puedes descomentar para debug
        // console.log("Datos:", res.data);
        return res.data; 
    },
    // Desactivar caché para ver cambios al instante (útil para administradores)
    staleTime: 0,
    refetchOnMount: true
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => TransaccionService.forceConfirm(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminTransacciones'] });
      alert(`✅ Éxito: ${response.data.mensaje}`);
      setSelectedTransaccion(null);
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
      
      // ⚡ ALIAS CORRECTO: proyectoTransaccion
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

  const handleForceConfirm = (id: number) => {
    if (window.confirm(`⚠️ ¿Forzar confirmación de transacción #${id}?`)) {
      confirmMutation.mutate(id);
    }
  };

  return (
    <PageContainer maxWidth="xl">

<PageHeader
              title="Auditoría de Transacciones"
              subtitle=" Control financiero y estado de pagos."
            />
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar por Usuario, Proyecto, ID o Pasarela..." 
          size="small" 
          sx={{ flexGrow: 1 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
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
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Proyecto / Detalle</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fecha</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => {
                // Preparar datos visuales
                const nombreUsuario = row.usuario 
                  ? `${row.usuario.nombre} ${row.usuario.apellido}`
                  : `ID: ${row.id_usuario}`;
                
                const usuarioEmail = row.usuario?.email;

                // ⚡ ALIAS CORRECTO: proyectoTransaccion
                const nombreProyecto = row.proyectoTransaccion?.nombre_proyecto;

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    
                    {/* USUARIO */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                          {row.usuario?.nombre?.[0]?.toUpperCase() || <Person fontSize="small" />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {nombreUsuario}
                          </Typography>
                          {usuarioEmail && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                              {usuarioEmail}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    
                    {/* CONTEXTO */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.tipo_transaccion === 'pago_suscripcion_inicial' ? 'Suscripción Inicial' : 
                         row.tipo_transaccion === 'directo' ? 'Inversión Directa' : 
                         row.tipo_transaccion === 'mensual' ? 'Cuota Mensual' :
                         row.tipo_transaccion}
                      </Typography>
                      {nombreProyecto ? (
                        <Typography variant="caption" color="primary.main" fontWeight={600}>
                          {nombreProyecto}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">Sin proyecto asignado</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight="bold" color="success.main">
                        ${Number(row.monto).toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={row.estado_transaccion} 
                            color={getStatusColor(row.estado_transaccion) as any} 
                            size="small" 
                          />
                          {row.error_detalle && (
                            <Tooltip title={row.error_detalle}>
                              <ErrorOutline color="error" fontSize="small" />
                            </Tooltip>
                          )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {row.fecha_transaccion ? format(new Date(row.fecha_transaccion), 'dd/MM HH:mm') : '-'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Ver Detalles">
                        <IconButton color="primary" onClick={() => setSelectedTransaccion(row)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>

                      {(row.estado_transaccion === 'pendiente' || row.estado_transaccion === 'fallido') && (
                        <Tooltip title="Forzar Confirmación">
                          <IconButton color="warning" onClick={() => handleForceConfirm(row.id)}>
                            <Bolt />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredData.length === 0 && (
                 <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No se encontraron transacciones.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      <ModalDetalleTransaccion 
        open={!!selectedTransaccion}
        transaccion={selectedTransaccion}
        onClose={() => setSelectedTransaccion(null)}
        onForceConfirm={handleForceConfirm}
        isConfirming={confirmMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminTransacciones;
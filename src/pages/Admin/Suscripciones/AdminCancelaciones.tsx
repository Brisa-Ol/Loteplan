// src/pages/Admin/Cancelaciones/AdminCancelaciones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Tooltip, Stack 
} from '@mui/material';
import { 
  Search, Visibility, TrendingDown, MoneyOff, Cancel 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import type { SuscripcionCanceladaDto } from '../../../types/dto/suscripcion.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import DetalleCancelacionModal from './components/DetalleCancelacionModal';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';


// --- COMPONENTE KPI ---
const KpiCard: React.FC<{ title: string; value: string; sub?: string; color: string; icon: React.ReactNode }> = ({ title, value, sub, color, icon }) => (
  <Paper elevation={0} sx={{ 
    p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, 
    height: '100%', display: 'flex', alignItems: 'center', gap: 2 
  }}>
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
      {sub && <Typography variant="caption" color={color + '.main'} fontWeight="bold">{sub}</Typography>}
    </Box>
  </Paper>
);

const AdminCancelaciones: React.FC = () => {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedCancelacion, setSelectedCancelacion] = useState<SuscripcionCanceladaDto | null>(null);

  // --- QUERIES ---
  
  // 1. Obtener lista de cancelaciones (Endpoint: /suscripcionesCanceladas/canceladas)
  const { data: cancelaciones = [], isLoading, error } = useQuery({
    queryKey: ['adminCancelaciones'],
    queryFn: async () => (await SuscripcionService.getAllCanceladas()).data,
  });

  // 2. Obtener métricas de KPI (Endpoint: /suscripciones/metrics/cancelacion)
  const { data: metrics } = useQuery({
    queryKey: ['adminCancelacionesMetrics'],
    queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data,
  });

  // --- CÁLCULOS (FRONTEND) ---
  
  // Calculamos el monto total liquidado sumando la lista, ya que el KPI del back no lo trae aún.
  const totalMontoLiquidado = useMemo(() => {
    return cancelaciones.reduce((acc, curr) => acc + Number(curr.monto_pagado_total), 0);
  }, [cancelaciones]);

  const filteredCancelaciones = useMemo(() => {
    return cancelaciones.filter(item => {
      const term = searchTerm.toLowerCase();
      // Búsqueda segura (verifica si existen los objetos anidados)
      const userName = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '';
      const userEmail = item.usuario?.email || '';
      const projectName = item.proyecto?.nombre_proyecto || '';
      
      const matchesSearch = 
        userName.toLowerCase().includes(term) ||
        userEmail.toLowerCase().includes(term) ||
        projectName.toLowerCase().includes(term) ||
        item.id.toString().includes(term);

      let matchesDate = true;
      if (dateStart || dateEnd) {
        const itemDate = new Date(item.fecha_cancelacion);
        if (dateStart && itemDate < new Date(dateStart)) matchesDate = false;
        if (dateEnd) {
          const endDate = new Date(dateEnd);
          endDate.setHours(23, 59, 59);
          if (itemDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [cancelaciones, searchTerm, dateStart, dateEnd]);

  return (
    <PageContainer maxWidth="xl">
     
<PageHeader
              title="Historial de Cancelaciones"
              subtitle=" Monitor de bajas, devoluciones y métricas de retención "
            />
      {/* ========== 1. KPIs ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, 
        gap: 2, mb: 4 
      }}>
        <KpiCard 
          title="Total Cancelaciones" 
          value={metrics?.total_canceladas.toString() || '0'} 
          sub={`De ${metrics?.total_suscripciones || 0} totales`}
          color="error" icon={<Cancel />}
        />
        <KpiCard 
          title="Tasa de Cancelación (Churn)" 
          value={`${metrics?.tasa_cancelacion || '0'}%`} 
          color="warning" icon={<TrendingDown />}
        />
        <KpiCard 
          title="Monto Total a Liquidar" 
          // Calculado en Front
          value={`$${totalMontoLiquidado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="info" icon={<MoneyOff />}
        />
      </Box>

      {/* ========== 2. FILTROS ========== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField 
            placeholder="Buscar (Usuario, Proyecto, ID...)" size="small" 
            sx={{ flex: 2 }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
            <TextField 
              type="date" size="small" fullWidth 
              label="Desde" InputLabelProps={{ shrink: true }}
              value={dateStart} onChange={(e) => setDateStart(e.target.value)} 
            />
            <TextField 
              type="date" size="small" fullWidth 
              label="Hasta" InputLabelProps={{ shrink: true }}
              value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} 
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ========== 3. TABLA ========== */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Baja</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ex-Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Meses Pagados</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monto Liquidación</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCancelaciones.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>#{item.id}</TableCell>
                  <TableCell>
                    {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : `ID: ${item.id_usuario}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.usuario?.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.proyecto?.nombre_proyecto || `ID: ${item.id_proyecto}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${item.meses_pagados} cuotas`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      ${Number(item.monto_pagado_total).toLocaleString('es-AR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver Detalle">
                      <IconButton size="small" color="primary" onClick={() => setSelectedCancelacion(item)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCancelaciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No se encontraron cancelaciones.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* ========== MODAL ========== */}
      <DetalleCancelacionModal 
        open={!!selectedCancelacion}
        onClose={() => setSelectedCancelacion(null)}
        cancelacion={selectedCancelacion}
      />
    </PageContainer>
  );
};

export default AdminCancelaciones;
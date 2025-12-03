import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, MenuItem, 
  InputAdornment, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Tooltip, Stack, 
  Alert, AlertTitle, Grid, TablePagination // 👈 IMPORTANTE: Importar TablePagination
} from '@mui/material';
import { 
  Search, Visibility, AttachMoney, TrendingDown, 
  Warning, AccessTime, DateRange 
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- SERVICIOS ---
import PagoService from '../../../Services/pago.service';
import UsuarioService from '../../../Services/usuario.service';
import ProyectoService from '../../../Services/proyecto.service';
import type { PagoDto } from '../../../types/dto/pago.dto';

// --- COMPONENTES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import DetallePagoModal from './components/DetallePagoModal';

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

const AdminPagos: React.FC = () => {
  const queryClient = useQueryClient();

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // --- ESTADOS DE PAGINACIÓN (NUEVO) ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- ESTADO MODAL ---
  const [selectedPago, setSelectedPago] = useState<PagoDto | null>(null);

  // --- QUERIES ---
  const { data: pagos = [], isLoading: loadingPagos, error } = useQuery({
    queryKey: ['adminPagos'],
    queryFn: async () => (await PagoService.findAll()).data,
  });

  const today = new Date();
  const { data: metricsData } = useQuery({
    queryKey: ['adminPagosMetrics', today.getMonth() + 1, today.getFullYear()],
    queryFn: async () => (await PagoService.getMonthlyMetrics(today.getMonth() + 1, today.getFullYear())).data,
  });
  const metrics = metricsData?.data;

  const { data: usuarios = [] } = useQuery({
    queryKey: ['adminUsuariosMap'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 300000,
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosMap'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 300000,
  });

  // --- HELPERS ---
  const getUserName = (id?: number) => {
    if (!id) return '-';
    const u = usuarios.find(u => u.id === id);
    return u ? `${u.nombre} ${u.apellido}` : `ID ${id}`;
  };

  const getProjectName = (id?: number) => {
    if (!id) return '-';
    const p = proyectos.find(proj => proj.id === id);
    return p ? p.nombre_proyecto : `ID ${id}`;
  };

  // --- CALCULOS Y FILTROS ---
  const alerts = useMemo(() => {
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const dueSoon = pagos.filter(p => {
      const d = new Date(p.fecha_vencimiento);
      return p.estado_pago === 'pendiente' && d >= now && d <= threeDaysLater;
    });

    const veryOverdue = pagos.filter(p => {
      const d = new Date(p.fecha_vencimiento);
      return (p.estado_pago === 'vencido' || (p.estado_pago === 'pendiente' && d < now)) && d < thirtyDaysAgo;
    });

    return { dueSoon, veryOverdue };
  }, [pagos]);

  const globalStats = useMemo(() => {
    const totalPendiente = pagos
      .filter(p => p.estado_pago === 'pendiente')
      .reduce((sum, p) => sum + Number(p.monto), 0);
    return { totalPendiente };
  }, [pagos]);

  // Filtro Principal
  const filteredPagos = useMemo(() => {
    // Si cambian los filtros, reseteamos la página a 0 para no quedar en una página vacía
    if (page !== 0 && (searchTerm || filterState !== 'all' || dateStart || dateEnd)) {
        setPage(0);
    }

    return pagos.filter(pago => {
      const uName = getUserName(pago.id_usuario).toLowerCase();
      const pName = getProjectName(pago.id_proyecto).toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = 
        uName.includes(term) || 
        pName.includes(term) || 
        pago.id.toString().includes(term);

      const matchesState = filterState === 'all' || pago.estado_pago === filterState;

      let matchesDate = true;
      if (dateStart || dateEnd) {
        const pDate = new Date(pago.fecha_vencimiento);
        if (dateStart && pDate < new Date(dateStart)) matchesDate = false;
        if (dateEnd) {
          const endDate = new Date(dateEnd);
          endDate.setHours(23, 59, 59);
          if (pDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesState && matchesDate;
    });
  }, [pagos, searchTerm, filterState, dateStart, dateEnd, usuarios, proyectos, page]); // Agregué 'page' solo para el reset logic, aunque idealmente se hace en el onChange del input

  // --- LÓGICA DE PAGINACIÓN (CLIENT SIDE) ---
  const paginatedPagos = useMemo(() => {
    return filteredPagos.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredPagos, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
    queryClient.invalidateQueries({ queryKey: ['adminPagosMetrics'] });
  };

  return (
    <PageContainer maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">Control de Pagos</Typography>
        <Typography variant="body1" color="text.secondary">Gestión centralizada de cuotas y recaudación.</Typography>
      </Box>

      {/* ========== 1. ALERTAS ========== */}
      <Stack spacing={2} mb={4}>
        {alerts.veryOverdue.length > 0 && (
          <Alert severity="error" icon={<Warning />}>
            <AlertTitle>Atención: Alta Morosidad</AlertTitle>
            Hay <strong>{alerts.veryOverdue.length} pagos</strong> vencidos hace más de 30 días. Revise los filtros.
          </Alert>
        )}
        {alerts.dueSoon.length > 0 && (
          <Alert severity="info" icon={<AccessTime />}>
            Hay <strong>{alerts.dueSoon.length} pagos</strong> próximos a vencer en los siguientes 7 días.
          </Alert>
        )}
      </Stack>

      {/* ========== 2. KPIs ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 2, mb: 4 
      }}>
        <KpiCard 
          title="Total Pendiente (Global)" 
          value={`$${globalStats.totalPendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="warning" icon={<AccessTime />}
        />
        <KpiCard 
          title="Recaudado (Mes Actual)" 
          value={`$${Number(metrics?.total_recaudado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          sub={`${metrics?.total_pagos_pagados || 0} pagos`}
          color="success" icon={<AttachMoney />}
        />
        <KpiCard 
          title="Pagos Vencidos (Mes)" 
          value={metrics?.total_pagos_vencidos.toString() || '0'} 
          color="error" icon={<Warning />}
        />
        <KpiCard 
          title="Tasa de Morosidad" 
          value={`${metrics?.tasa_morosidad || '0'}%`} 
          sub="Mes Actual"
          color="info" icon={<TrendingDown />}
        />
      </Box>

      {/* ========== 3. FILTROS ========== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <TextField 
            placeholder="Buscar (Usuario, Proyecto, ID...)" size="small" 
            sx={{ flex: 2 }}
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} // Reset página al buscar
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <TextField
            select label="Estado" size="small" sx={{ flex: 1 }}
            value={filterState} 
            onChange={(e) => { setFilterState(e.target.value); setPage(0); }} // Reset página al filtrar
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="pagado">Pagado</MenuItem>
            <MenuItem value="vencido">Vencido</MenuItem>
            <MenuItem value="cubierto_por_puja">Cubierto por Puja</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </TextField>
          
          <Stack direction="row" spacing={1} sx={{ flex: 1 }} alignItems="center">
            <DateRange color="action" />
            <TextField 
              type="date" size="small" fullWidth 
              value={dateStart} onChange={(e) => { setDateStart(e.target.value); setPage(0); }} 
            />
            <TextField 
              type="date" size="small" fullWidth 
              value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); setPage(0); }} 
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ========== 4. TABLA CON PAGINACIÓN ========== */}
      <QueryHandler isLoading={loadingPagos} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cuota</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vencimiento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPagos.map((pago) => {
                const uName = getUserName(pago.id_usuario);
                const pName = getProjectName(pago.id_proyecto);
                
                return (
                  <TableRow key={pago.id} hover>
                    <TableCell>#{pago.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{uName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{pName}</Typography>
                    </TableCell>
                    <TableCell>Mes {pago.mes}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ${Number(pago.monto).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pago.estado_pago.replace('_', ' ')} 
                        size="small" 
                        color={
                          pago.estado_pago === 'pagado' ? 'success' : 
                          pago.estado_pago === 'vencido' ? 'error' : 
                          pago.estado_pago === 'pendiente' ? 'warning' : 'default'
                        } 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalle">
                        <IconButton size="small" color="primary" onClick={() => setSelectedPago(pago)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedPagos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No se encontraron pagos con estos filtros.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* COMPONENTE DE PAGINACIÓN */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredPagos.length} // Total de items filtrados
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por pág:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </TableContainer>
      </QueryHandler>

      {/* ========== MODAL ========== */}
      <DetallePagoModal 
        open={!!selectedPago}
        onClose={() => setSelectedPago(null)}
        pago={selectedPago}
        userName={selectedPago ? getUserName(selectedPago.id_usuario) : ''}
        projectName={selectedPago ? getProjectName(selectedPago.id_proyecto) : ''}
        onUpdate={handleUpdate}
      />
    </PageContainer>
  );
};

export default AdminPagos;
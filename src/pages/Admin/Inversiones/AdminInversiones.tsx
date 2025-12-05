// src/pages/Admin/Inversiones/AdminInversiones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, MenuItem, 
  InputAdornment, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Tooltip, Stack, 
  Divider
} from '@mui/material';
import { 
  Search, Visibility, MonetizationOn, ShowChart, 
  AttachMoney, AccountBalanceWallet 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';

// --- SERVICIOS ---
import InversionService from '../../../Services/inversion.service';
import ProyectoService from '../../../Services/proyecto.service';
import UsuarioService from '../../../Services/usuario.service';
import type { InversionDto } from '../../../types/dto/inversion.dto';

// --- COMPONENTES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import DetalleInversionModal from './components/DetalleInversionModal';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';


// --- COMPONENTE KPI (Sin Grid) ---
const KpiCard: React.FC<{ title: string; value: string; sub?: string; color: string; icon: React.ReactNode }> = ({ title, value, sub, color, icon }) => (
  <Paper elevation={0} sx={{ 
    p: 2, 
    border: '1px solid', 
    borderColor: 'divider', 
    borderRadius: 2, 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2 
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

const AdminInversiones: React.FC = () => {
  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'pagado' | 'fallido'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // --- ESTADO MODAL ---
  const [selectedInversion, setSelectedInversion] = useState<InversionDto | null>(null);

  // --- QUERIES ---
  const { data: inversiones = [], isLoading: loadingInv, error } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => (await InversionService.findAll()).data,
  });

  const { data: liquidezData } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data,
  });

  const { data: topInvestorsRaw = [] } = useQuery({
    queryKey: ['adminTopInvestorsRaw'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data.data,
  });

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

  // --- LÓGICA DE DATOS ---
  const getUserInfo = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    return user ? { name: `${user.nombre} ${user.apellido}`, email: user.email } : { name: `Usuario #${id}`, email: '' };
  };

  const getProjectName = (id: number) => {
    const proj = proyectos.find(p => p.id === id);
    return proj ? proj.nombre_proyecto : `Proyecto #${id}`;
  };

  const chartData = useMemo(() => {
    return topInvestorsRaw
      .map(item => ({
        name: getUserInfo(item.id_usuario).name,
        monto: parseFloat(item.monto_total_invertido),
      }))
      .slice(0, 10);
  }, [topInvestorsRaw, usuarios]);

  const filteredInversiones = useMemo(() => {
    return inversiones.filter(inv => {
      const userInfo = getUserInfo(inv.id_usuario);
      const projName = getProjectName(inv.id_proyecto);
      const term = searchTerm.toLowerCase();

      const matchesSearch = 
        userInfo.name.toLowerCase().includes(term) ||
        userInfo.email.toLowerCase().includes(term) ||
        projName.toLowerCase().includes(term) ||
        inv.id.toString().includes(term);

      const matchesProject = filterProject === 'all' || inv.id_proyecto === Number(filterProject);
      const matchesStatus = filterStatus === 'all' || inv.estado === filterStatus;

      let matchesDate = true;
      if (dateStart || dateEnd) {
        const invDate = new Date(inv.fecha_inversion || inv.createdAt || '');
        if (dateStart && invDate < new Date(dateStart)) matchesDate = false;
        if (dateEnd) {
          const endDate = new Date(dateEnd);
          endDate.setHours(23, 59, 59);
          if (invDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesProject && matchesStatus && matchesDate;
    });
  }, [inversiones, searchTerm, filterProject, filterStatus, dateStart, dateEnd, usuarios, proyectos]);

  return (
    <PageContainer maxWidth="xl">

<PageHeader
              title="Inversiones Directas"
              subtitle=" Gestión y monitoreo de capital ingresado "
            />
      {/* ========== 1. KPIs (Usando CSS GRID nativo en Box) ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 4 
      }}>
        <KpiCard 
          title="Total Registradas" 
          value={`$${Number(liquidezData?.total_invertido_registrado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="info" icon={<AttachMoney />}
        />
        <KpiCard 
          title="Total Pagadas" 
          value={`$${Number(liquidezData?.total_pagado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="success" icon={<MonetizationOn />}
        />
        <KpiCard 
          title="Tasa de Liquidez" 
          value={`${liquidezData?.tasa_liquidez || 0}%`} 
          sub="Conversión Pago"
          color="warning" icon={<ShowChart />}
        />
        <KpiCard 
          title="Inversiones Totales" 
          value={filteredInversiones.length.toString()} 
          sub="Transacciones"
          color="primary" icon={<AccountBalanceWallet />}
        />
      </Box>

      {/* ========== 2. GRÁFICO Y FILTROS (Usando Stack) ========== */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={4}>
        
        {/* Lado Izquierdo: Gráfico */}
        <Box sx={{ flex: 2, minWidth: 0 }}> 
          <Paper sx={{ p: 3, borderRadius: 2, height: 400 }} variant="outlined">
            <Typography variant="h6" fontWeight="bold" mb={2}>Top 10 Inversores (Acumulado)</Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} />
                  <YAxis type="category" dataKey="name" width={120} style={{ fontSize: '12px' }} />
                  <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Total Invertido']} />
                  <Bar dataKey="monto" fill="#0288d1" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index < 3 ? '#ed6c02' : '#0288d1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">Insuficientes datos para el gráfico</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Lado Derecho: Filtros */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }} variant="outlined">
            <Typography variant="h6" fontWeight="bold" mb={2}>Filtros Avanzados</Typography>
            <Stack spacing={2}>
              <TextField 
                placeholder="Buscar (Usuario, ID...)" size="small" fullWidth
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
              <TextField
                select label="Estado" size="small" fullWidth
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="fallido">Fallido</MenuItem>
              </TextField>
              <TextField
                select label="Proyecto" size="small" fullWidth
                value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
              >
                <MenuItem value="all">Todos los proyectos</MenuItem>
                {proyectos.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                ))}
              </TextField>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="caption" fontWeight="bold">Rango de Fechas</Typography>
              <Stack direction="row" spacing={1}>
                <TextField type="date" size="small" fullWidth value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                <TextField type="date" size="small" fullWidth value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
              </Stack>
            </Stack>
          </Paper>
        </Box>

      </Stack>

      {/* ========== 3. TABLA DE INVERSIONES ========== */}
      <QueryHandler isLoading={loadingInv} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Inversor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInversiones.map((inv) => {
                const user = getUserInfo(inv.id_usuario);
                const project = getProjectName(inv.id_proyecto);
                return (
                  <TableRow key={inv.id} hover>
                    <TableCell>#{inv.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{project}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ${Number(inv.monto).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                       <Chip 
                        label={inv.estado} size="small" 
                        color={inv.estado === 'pagado' ? 'success' : inv.estado === 'pendiente' ? 'warning' : 'error'} 
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(inv.fecha_inversion || inv.createdAt || '').toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalle">
                        <IconButton color="primary" onClick={() => setSelectedInversion(inv)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredInversiones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No se encontraron inversiones con estos filtros.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* ========== MODAL ========== */}
      <DetalleInversionModal 
        open={!!selectedInversion}
        onClose={() => setSelectedInversion(null)}
        inversion={selectedInversion}
        userName={selectedInversion ? getUserInfo(selectedInversion.id_usuario).name : ''}
        userEmail={selectedInversion ? getUserInfo(selectedInversion.id_usuario).email : ''}
        projectName={selectedInversion ? getProjectName(selectedInversion.id_proyecto) : ''}
      />
    </PageContainer>
  );
};

export default AdminInversiones;
// src/pages/Admin/Inversiones/AdminInversiones.tsx

import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, MenuItem, 
  InputAdornment, Stack, Divider, Avatar, LinearProgress, IconButton, Tooltip, Chip, useTheme, alpha
} from '@mui/material';
import { 
  Search, Visibility, MonetizationOn, ShowChart, 
  AttachMoney, AccountBalanceWallet,
  Person as PersonIcon,
  CalendarMonth
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';

import type { InversionDto } from '../../../types/dto/inversion.dto';

// --- COMPONENTS ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import DetalleInversionModal from './components/DetalleInversionModal';

// Servicios
import InversionService from '../../../Services/inversion.service';
import UsuarioService from '../../../Services/usuario.service';
import ProyectoService from '../../../Services/proyecto.service';

// Hooks
import { useModal } from '../../../hooks/useModal';

// --- KPI COMPONENT (Estandarizado) ---
const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  sub?: string; 
  color: string; 
  icon: React.ReactNode; 
  loading?: boolean;
}> = ({ title, value, sub, color, icon, loading }) => {
  const theme = useTheme();
  // Obtener color del theme de forma segura
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2, 
        flex: 1, 
        minWidth: 0, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: paletteColor.main,
            transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ bgcolor: alpha(paletteColor.main, 0.1), color: paletteColor.main, p: 1.5, borderRadius: '50%', display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ width: '100%' }}>
        {loading ? (
          <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
        ) : (
          <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
        )}
        <Typography variant="body2" color="text.secondary" fontWeight={600}>{title}</Typography>
        {sub && <Typography variant="caption" color={paletteColor.main} fontWeight="bold">{sub}</Typography>}
      </Box>
    </Paper>
  );
};

const AdminInversiones: React.FC = () => {
  const theme = useTheme();

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'pagado' | 'fallido'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Hooks
  const detailModal = useModal();
  const [selectedInversion, setSelectedInversion] = useState<InversionDto | null>(null);

  // --- QUERIES ---
  const { data: inversiones = [], isLoading: loadingInv, error } = useQuery({
    queryKey: ['adminInversiones'],
    queryFn: async () => (await InversionService.findAll()).data,
  });

  const { data: liquidezData, isLoading: loadingMetrics } = useQuery({
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

  // --- DATA LOGIC ---
  const getUserInfo = (id: number) => {
    const user = usuarios.find(u => u.id === id);
    return user ? { name: `${user.nombre} ${user.apellido}`, email: user.email } : { name: `Usuario #${id}`, email: 'Sin datos' };
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

  // Handlers
  const handleViewDetails = (inv: InversionDto) => {
    setSelectedInversion(inv);
    detailModal.open();
  };

  const handleCloseModal = () => {
    detailModal.close();
    // Timeout para limpieza suave
    setTimeout(() => setSelectedInversion(null), 300);
  };

  // Columns Definition (Memoized)
  const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
    {
      id: 'id',
      label: 'ID',
      minWidth: 60,
      render: (inv) => <Typography variant="body2" fontWeight={700}>#{inv.id}</Typography>
    },
    {
      id: 'usuario',
      label: 'Inversor',
      minWidth: 220,
      render: (inv) => {
        const user = getUserInfo(inv.id_usuario);
        return (
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 36, height: 36, fontSize: 14, fontWeight: 'bold' }}>
                    {user.name.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
            </Stack>
        );
      }
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 150,
      render: (inv) => (
        <Typography variant="body2" fontWeight={500}>
            {getProjectName(inv.id_proyecto)}
        </Typography>
      )
    },
    {
      id: 'monto',
      label: 'Monto',
      render: (inv) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            ${Number(inv.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (inv) => (
        <Chip 
            label={inv.estado} 
            size="small" 
            color={inv.estado === 'pagado' ? 'success' : inv.estado === 'pendiente' ? 'warning' : 'error'} 
            variant={inv.estado === 'pagado' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        />
      )
    },
    {
      id: 'fecha',
      label: 'Fecha',
      render: (inv) => (
        <Box>
            <Typography variant="body2">
                {new Date(inv.fecha_inversion || inv.createdAt || '').toLocaleDateString('es-AR')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {new Date(inv.fecha_inversion || inv.createdAt || '').toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' })}
            </Typography>
        </Box>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (inv) => (
        <Tooltip title="Ver Detalle">
            <IconButton 
                color="primary" 
                onClick={() => handleViewDetails(inv)} 
                size="small"
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
            >
                <Visibility fontSize="small" />
            </IconButton>
        </Tooltip>
      )
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>

      <PageHeader
        title="Inversiones Directas"
        subtitle="Gestión y monitoreo de capital ingresado y flujo de caja."
      />

      {/* ========== 1. KPIs ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 4 
      }}>
        <StatCard 
          title="Total Registradas" 
          value={`$${Number(liquidezData?.total_invertido_registrado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="info" icon={<AttachMoney />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Total Pagadas" 
          value={`$${Number(liquidezData?.total_pagado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="success" icon={<MonetizationOn />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Tasa de Liquidez" 
          value={`${liquidezData?.tasa_liquidez || 0}%`} 
          sub="Conversión Pago"
          color="warning" icon={<ShowChart />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Inversiones Totales" 
          value={filteredInversiones.length.toString()} 
          sub="Transacciones"
          color="primary" icon={<AccountBalanceWallet />}
          loading={loadingInv}
        />
      </Box>

      {/* ========== 2. CHART & FILTERS ========== */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={4}>
        
        {/* Left: Chart */}
        <Box sx={{ flex: 2, minWidth: 0 }}> 
          <Paper 
            sx={{ 
                p: 3, borderRadius: 2, height: 420, 
                border: '1px solid', borderColor: 'divider' 
            }} 
            elevation={0}
          >
            <Typography variant="h6" fontWeight="bold" mb={2} color="text.primary">Top 10 Inversores (Acumulado)</Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme.palette.divider} />
                  <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: theme.palette.text.secondary }} />
                  <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px', fontWeight: 500, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Total Invertido']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: theme.shadows[4] }}
                  />
                  <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={index < 3 ? theme.palette.warning.main : theme.palette.primary.main} />
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

        {/* Right: Filters */}
        <Box sx={{ flex: 1 }}>
          <Paper 
            elevation={0}
            sx={{ 
                p: 3, borderRadius: 2, height: '100%', 
                display: 'flex', flexDirection: 'column', gap: 2,
                border: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.6)
            }} 
          >
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
                <Search color="action" />
                <Typography variant="h6" fontWeight="bold">Filtros Avanzados</Typography>
            </Stack>
            
            <TextField 
              placeholder="Buscar (Usuario, ID...)" size="small" fullWidth
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            
            <TextField
              select label="Estado" size="small" fullWidth
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="pagado">Pagado</MenuItem>
              <MenuItem value="fallido">Fallido</MenuItem>
            </TextField>
            
            <TextField
              select label="Proyecto" size="small" fullWidth
              value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {proyectos.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
              ))}
            </TextField>
            
            <Divider sx={{ my: 1 }} />
            
            <Stack direction="row" alignItems="center" gap={1}>
                <CalendarMonth color="action" fontSize="small" />
                <Typography variant="caption" fontWeight="bold">Rango de Fechas</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField type="date" size="small" fullWidth value={dateStart} onChange={(e) => setDateStart(e.target.value)} InputProps={{ sx: { borderRadius: 2 } }} />
              <TextField type="date" size="small" fullWidth value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} InputProps={{ sx: { borderRadius: 2 } }} />
            </Stack>
          </Paper>
        </Box>

      </Stack>

      {/* ========== 3. DATA TABLE ========== */}
      <QueryHandler isLoading={loadingInv} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredInversiones}
            getRowKey={(row) => row.id}
            emptyMessage="No se encontraron inversiones con estos filtros."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== MODAL CON HOOK ========== */}
      <DetalleInversionModal 
        open={detailModal.isOpen} 
        onClose={handleCloseModal} 
        inversion={selectedInversion}
        userName={selectedInversion ? getUserInfo(selectedInversion.id_usuario).name : ''}
        userEmail={selectedInversion ? getUserInfo(selectedInversion.id_usuario).email : ''}
        projectName={selectedInversion ? getProjectName(selectedInversion.id_proyecto) : ''}
      />
    </PageContainer>
  );
};

export default AdminInversiones;
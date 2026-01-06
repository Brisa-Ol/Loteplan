// src/pages/Admin/Inversiones/AdminInversiones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Paper, TextField, MenuItem, 
  Stack, Divider, Avatar, LinearProgress, IconButton, Tooltip, Chip, useTheme, alpha
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
import InversionService from '../../../services/inversion.service';
import UsuarioService from '../../../services/usuario.service';
import ProyectoService from '../../../services/proyecto.service';

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
        {sub && <Typography variant="caption" color={paletteColor.main} fontWeight="bold" display="block">{sub}</Typography>}
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

  const { data: liquidezRes, isLoading: loadingMetrics } = useQuery({
    queryKey: ['adminInversionesLiquidez'],
    queryFn: async () => (await InversionService.getLiquidityMetrics()).data,
  });
  const liquidezData = liquidezRes?.data; // Acceso corregido según DTO

  const { data: topInvestorsRes } = useQuery({
    queryKey: ['adminTopInvestorsRaw'],
    queryFn: async () => (await InversionService.getAggregatedMetrics()).data,
  });
  const topInvestorsRaw = topInvestorsRes?.data || [];

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
  const getUserInfo = useCallback((id: number) => {
    const user = usuarios.find(u => u.id === id);
    return user ? { name: `${user.nombre} ${user.apellido}`, email: user.email } : { name: `Usuario #${id}`, email: 'Sin datos' };
  }, [usuarios]);

  const getProjectName = useCallback((id: number) => {
    const proj = proyectos.find(p => p.id === id);
    return proj ? proj.nombre_proyecto : `Proyecto #${id}`;
  }, [proyectos]);

  const chartData = useMemo(() => {
    return topInvestorsRaw
      .map(item => {
        const info = getUserInfo(item.id_usuario);
        return {
            name: info.name,
            monto: parseFloat(item.monto_total_invertido),
        };
      })
      .slice(0, 8); // Limitamos a 8 para mejor visualización
  }, [topInvestorsRaw, getUserInfo]);

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
      const invDate = new Date(inv.fecha_inversion || inv.createdAt || '');
      if (dateStart && invDate < new Date(dateStart)) matchesDate = false;
      if (dateEnd) {
          const limitDate = new Date(dateEnd);
          limitDate.setHours(23, 59, 59, 999);
          if (invDate > limitDate) matchesDate = false;
      }

      return matchesSearch && matchesProject && matchesStatus && matchesDate;
    });
  }, [inversiones, searchTerm, filterProject, filterStatus, dateStart, dateEnd, getUserInfo, getProjectName]);

  // Handlers
  const handleViewDetails = useCallback((inv: InversionDto) => {
    setSelectedInversion(inv);
    detailModal.open();
  }, [detailModal]);

  const handleCloseModal = useCallback(() => {
    detailModal.close();
    setTimeout(() => setSelectedInversion(null), 300);
  }, [detailModal]);

  // Columns Definition
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
                <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: 'primary.main', 
                    width: 36, height: 36, 
                    fontSize: 14, fontWeight: 'bold' 
                }}>
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
      render: (inv) => {
        const color = inv.estado === 'pagado' ? 'success' : inv.estado === 'pendiente' ? 'warning' : 'error';
        return (
            <Chip 
                label={inv.estado.toUpperCase()} 
                size="small" 
                color={color as any} 
                variant={inv.estado === 'pagado' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
            />
        );
      }
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
  ], [theme, getUserInfo, getProjectName, handleViewDetails]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>

      <PageHeader
        title="Gestión de Inversiones"
        subtitle="Monitoreo de capital ingresado y rendimiento de inversores."
      />

      {/* ========== 1. KPIs ========== */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 2, 
        mb: 4 
      }}>
        <StatCard 
          title="Total Registrado" 
          value={`$${Number(liquidezData?.total_invertido_registrado || 0).toLocaleString('es-AR')}`} 
          color="info" icon={<AttachMoney />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Total Cobrado" 
          value={`$${Number(liquidezData?.total_pagado || 0).toLocaleString('es-AR')}`} 
          color="success" icon={<MonetizationOn />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Tasa de Liquidez" 
          value={`${liquidezData?.tasa_liquidez || 0}%`} 
          sub="Efectividad de Cobro"
          color="warning" icon={<ShowChart />}
          loading={loadingMetrics}
        />
        <StatCard 
          title="Participaciones" 
          value={inversiones.length.toString()} 
          sub="Transacciones totales"
          color="primary" icon={<AccountBalanceWallet />}
          loading={loadingInv}
        />
      </Box>

      {/* ========== 2. CHART & FILTERS ========== */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={4}>
        
        {/* Gráfico */}
        <Box sx={{ flex: 2, minWidth: 0 }}> 
          <Paper sx={{ p: 3, borderRadius: 2, height: 420, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <Typography variant="h6" fontWeight={700} mb={3}>Top 10 Inversores</Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val) => [`$${val.toLocaleString()}`, 'Invertido']} />
                    <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={index < 3 ? theme.palette.warning.main : theme.palette.primary.main} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Typography color="text.secondary" textAlign="center">Cargando datos del gráfico...</Typography>}
            </Box>
          </Paper>
        </Box>

        {/* Filtros */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6) }} elevation={0}>
            <Typography variant="h6" fontWeight={700} mb={1}>Filtros</Typography>
            <TextField placeholder="Buscar inversor o proyecto..." size="small" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <TextField select label="Estado" size="small" fullWidth value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
              <MenuItem value="all">Todos los estados</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="pagado">Pagado</MenuItem>
              <MenuItem value="fallido">Fallido</MenuItem>
            </TextField>
            <TextField select label="Proyecto" size="small" fullWidth value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
            </TextField>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1}>
              <TextField type="date" size="small" label="Desde" fullWidth value={dateStart} onChange={(e) => setDateStart(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" size="small" label="Hasta" fullWidth value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
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
            isRowActive={(row) => row.estado !== 'fallido'}
            emptyMessage="No se encontraron registros."
            pagination
        />
      </QueryHandler>

      <DetalleInversionModal 
        open={detailModal.isOpen} onClose={handleCloseModal} inversion={selectedInversion}
        userName={selectedInversion ? getUserInfo(selectedInversion.id_usuario).name : ''}
        userEmail={selectedInversion ? getUserInfo(selectedInversion.id_usuario).email : ''}
        projectName={selectedInversion ? getProjectName(selectedInversion.id_proyecto) : ''}
      />
    </PageContainer>
  );
};

export default AdminInversiones;
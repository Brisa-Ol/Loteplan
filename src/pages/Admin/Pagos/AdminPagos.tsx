import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, MenuItem, 
  InputAdornment, Chip, IconButton, Tooltip, Stack, 
  Alert, AlertTitle, LinearProgress, Avatar
} from '@mui/material';
import { 
  Search, Visibility, AttachMoney, TrendingDown, 
  Warning, AccessTime, DateRange, Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { PagoDto } from '../../../types/dto/pago.dto';

// --- COMPONENTES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import DetallePagoModal from './components/DetallePagoModal';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// 👇 Importamos DataTable
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import UsuarioService from '../../../Services/usuario.service';
import PagoService from '../../../Services/pago.service';
import ProyectoService from '../../../Services/proyecto.service';

// ✅ 1. Importamos el hook
import { useModal } from '../../../hooks/useModal';

// --- COMPONENTE KPI ---
const StatCard: React.FC<{ title: string; value: string; sub?: string; color: string; icon: React.ReactNode }> = ({ title, value, sub, color, icon }) => (
  <Paper elevation={0} sx={{ 
    p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, 
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 2 
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
  
  // ✅ 2. Hook useModal
  const detalleModal = useModal();
  // Mantenemos el estado de DATOS separado de la visibilidad
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
  }, [pagos, searchTerm, filterState, dateStart, dateEnd, usuarios, proyectos]);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminPagos'] });
    queryClient.invalidateQueries({ queryKey: ['adminPagosMetrics'] });
  };

  // ✅ 3. Handlers para el Modal
  const handleVerDetalle = (pago: PagoDto) => {
    setSelectedPago(pago);
    detalleModal.open();
  };

  const handleCloseDetalle = () => {
    detalleModal.close();
    setSelectedPago(null);
  };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ========================================================================
  const columns: DataTableColumn<PagoDto>[] = [
    { 
      id: 'id', 
      label: 'ID', 
      minWidth: 50,
      render: (p) => <Typography variant="body2" color="text.secondary">#{p.id}</Typography>
    },
    { 
      id: 'usuario', 
      label: 'Usuario', 
      minWidth: 200,
      render: (p) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: 12 }}>
                <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>
                {getUserName(p.id_usuario)}
            </Typography>
        </Stack>
      )
    },
    { 
      id: 'proyecto', 
      label: 'Proyecto', 
      minWidth: 150,
      render: (p) => (
        <Typography variant="body2">{getProjectName(p.id_proyecto)}</Typography>
      )
    },
    { 
      id: 'mes', 
      label: 'Cuota', 
      render: (p) => <Typography variant="body2">Mes {p.mes}</Typography>
    },
    { 
      id: 'monto', 
      label: 'Monto', 
      render: (p) => (
        <Typography variant="body2" fontWeight={600}>
            ${Number(p.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    { 
      id: 'vencimiento', 
      label: 'Vencimiento', 
      render: (p) => (
        <Typography variant="body2">
            {new Date(p.fecha_vencimiento).toLocaleDateString('es-AR')}
        </Typography>
      )
    },
    { 
      id: 'estado', 
      label: 'Estado', 
      render: (p) => (
        <Chip 
            label={p.estado_pago.replace('_', ' ')} 
            size="small" 
            color={
                p.estado_pago === 'pagado' ? 'success' : 
                p.estado_pago === 'vencido' ? 'error' : 
                p.estado_pago === 'pendiente' ? 'warning' : 'default'
            } 
            sx={{ textTransform: 'capitalize', fontWeight: 500 }}
        />
      )
    },
    { 
      id: 'acciones', 
      label: 'Acciones', 
      align: 'right', 
      render: (p) => (
        <Tooltip title="Ver Detalle">
            <IconButton 
                size="small" 
                color="primary" 
                // ✅ Usar el handler
                onClick={() => handleVerDetalle(p)}
            >
                <Visibility />
            </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
         title="Control de Pagos"
         subtitle="Gestión centralizada de cuotas y recaudación."
      />

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
        <StatCard 
          title="Total Pendiente (Global)" 
          value={`$${globalStats.totalPendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          color="warning" icon={<AccessTime />}
        />
        <StatCard 
          title="Recaudado (Mes Actual)" 
          value={`$${Number(metrics?.total_recaudado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          sub={`${metrics?.total_pagos_pagados || 0} pagos`}
          color="success" icon={<AttachMoney />}
        />
        <StatCard 
          title="Pagos Vencidos (Mes)" 
          value={metrics?.total_pagos_vencidos.toString() || '0'} 
          color="error" icon={<Warning />}
        />
        <StatCard 
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
            onChange={(e) => setSearchTerm(e.target.value)} 
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment> }}
          />
          <TextField
            select label="Estado" size="small" sx={{ flex: 1 }}
            value={filterState} 
            onChange={(e) => setFilterState(e.target.value)} 
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
              value={dateStart} onChange={(e) => setDateStart(e.target.value)} 
            />
            <TextField 
              type="date" size="small" fullWidth 
              value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} 
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ========== 4. TABLA (Datatable) ========== */}
      <QueryHandler isLoading={loadingPagos} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredPagos}
            getRowKey={(p) => p.id}
            emptyMessage="No se encontraron pagos con estos filtros."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== MODAL CON USEMODAL ========== */}
      <DetallePagoModal 
        open={detalleModal.isOpen} // ✅
        onClose={handleCloseDetalle} // ✅
        pago={selectedPago}
        userName={selectedPago ? getUserName(selectedPago.id_usuario) : ''}
        projectName={selectedPago ? getProjectName(selectedPago.id_proyecto) : ''}
        onUpdate={handleUpdate}
      />
    </PageContainer>
  );
};

export default AdminPagos;
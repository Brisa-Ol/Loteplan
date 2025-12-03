// src/pages/Admin/Suscripciones/AdminSuscripciones.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  Stack, TextField, MenuItem, InputAdornment, LinearProgress
} from '@mui/material';
import { 
  CheckCircle, Cancel, Search, Visibility, 
  MonetizationOn, TrendingDown, Warning, Groups
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- SERVICIOS Y TIPOS ---
import SuscripcionService from '../../../Services/suscripcion.service';
import ProyectoService from '../../../Services/proyecto.service';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import DetalleSuscripcionModal from './components/DetalleSuscripcionModal';



// ========== Componente de Tarjeta (KPIs) ==========
const StatCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
  loading?: boolean;
}> = ({ title, value, icon, color, loading }) => (
  <Paper elevation={0} sx={{ 
    p: 2, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2, 
    bgcolor: 'background.paper', 
    borderRadius: 2, 
    border: '1px solid', 
    borderColor: 'divider',
    flex: 1,
    minWidth: 0
  }}>
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box sx={{ width: '100%' }}>
      {loading ? (
        <LinearProgress color="inherit" sx={{ width: '60%', mb: 1 }} />
      ) : (
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
    </Box>
  </Paper>
);

const AdminSuscripciones: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activas' | 'inactivas'>('activas');
  
  // ✅ Estado para controlar el Modal
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionDto | null>(null);

  // ========== 1. CARGA DE DATOS (Queries) ==========

  // A. Suscripciones
  const { data: suscripciones = [], isLoading: loadingSuscripciones, error } = useQuery({
    queryKey: ['adminSuscripciones', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'activas') {
        const res = await SuscripcionService.findAllActivas();
        return res.data;
      }
      const res = await SuscripcionService.findAll();
      return res.data;
    },
    refetchInterval: 30000, 
  });

  // B. Proyectos (Filtro)
  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => {
      const res = await ProyectoService.getAllAdmin();
      return res.data;
    },
    staleTime: 60000,
  });

  // C. KPIs Morosidad
  const { data: morosidadStats, isLoading: loadMorosidad } = useQuery({
    queryKey: ['metricsMorosidad'],
    queryFn: async () => {
      const res = await SuscripcionService.getMorosityMetrics();
      return res.data; 
    },
  });

  // D. KPIs Cancelación
  const { data: cancelacionStats, isLoading: loadCancelacion } = useQuery({
    queryKey: ['metricsCancelacion'],
    queryFn: async () => {
      const res = await SuscripcionService.getCancellationMetrics();
      return res.data;
    },
  });

  // ========== 2. LÓGICA DE DATOS ==========
  
  // Cálculo de activas para los KPIs
  const totalSuscripciones = cancelacionStats?.total_suscripciones || 0;
  const totalCanceladas = cancelacionStats?.total_canceladas || 0;
  const totalActivas = totalSuscripciones - totalCanceladas;

  // Filtrado de la tabla
  const filteredSuscripciones = useMemo(() => {
    return suscripciones.filter(suscripcion => {
      const term = searchTerm.toLowerCase();
      
      const matchesSearch = 
        suscripcion.usuario?.nombre.toLowerCase().includes(term) ||
        suscripcion.usuario?.apellido.toLowerCase().includes(term) ||
        suscripcion.usuario?.email.toLowerCase().includes(term) ||
        suscripcion.proyectoAsociado?.nombre_proyecto.toLowerCase().includes(term) ||
        suscripcion.id.toString().includes(term);

      let matchesProject = true;
      if (filterProject !== 'all') {
        matchesProject = suscripcion.id_proyecto === Number(filterProject);
      }

      let matchesStatus = true;
      if (filterStatus === 'activas') matchesStatus = suscripcion.activo === true;
      if (filterStatus === 'inactivas') matchesStatus = suscripcion.activo === false;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [suscripciones, searchTerm, filterProject, filterStatus]);

  // ========== 3. ACCIONES ==========
  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => await SuscripcionService.cancelarAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSuscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['metricsCancelacion'] });
      queryClient.invalidateQueries({ queryKey: ['metricsMorosidad'] });
      alert('✅ Suscripción cancelada correctamente.');
    },
    onError: (err: any) => {
      const backendError = err.response?.data?.error || 'Error desconocido';
      alert(`❌ No se pudo cancelar:\n${backendError}`);
    }
  });

  const handleCancelar = (suscripcion: SuscripcionDto) => {
    if (!suscripcion.activo) return;
    if (window.confirm(`¿Confirmar cancelación de la suscripción #${suscripcion.id}? Esto generará una deuda y anulará el acceso al lote.`)) {
      cancelarMutation.mutate(suscripcion.id);
    }
  };

  return (
    <PageContainer maxWidth="xl">
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Gestión de Suscripciones
        </Typography>
      </Box>

      {/* ========== SECCIÓN DE KPIs ========== */}
      <Stack spacing={2} mb={4}>
        {/* FILA 1: Totales */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <StatCard 
            title="Total Histórico" 
            value={totalSuscripciones} 
            icon={<Groups />} color="primary" loading={loadCancelacion}
          />
          <StatCard 
            title="Activas Hoy" 
            value={totalActivas} 
            icon={<CheckCircle />} color="success" loading={loadCancelacion}
          />
          <StatCard 
            title="Canceladas" 
            value={totalCanceladas} 
            icon={<Cancel />} color="error" loading={loadCancelacion}
          />
        </Stack>

        {/* FILA 2: Financiero */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <StatCard 
            title="Tasa Cancelación" 
            value={`${cancelacionStats?.tasa_cancelacion || 0}%`} 
            icon={<TrendingDown />} color="warning" loading={loadCancelacion}
          />
          <StatCard 
            title="Tasa Morosidad" 
            value={`${morosidadStats?.tasa_morosidad || 0}%`} 
            icon={<Warning />} color="error" loading={loadMorosidad}
          />
          <StatCard 
            title="Total Generado" 
            value={`$${Number(morosidadStats?.total_pagos_generados || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
            icon={<MonetizationOn />} color="info" loading={loadMorosidad}
          />
        </Stack>
      </Stack>

      {/* ========== FILTROS ========== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar por usuario o ID..." 
            size="small" fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action"/></InputAdornment>) }}
          />
          <TextField
            select label="Proyecto" size="small" fullWidth
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {proyectos.filter(p => p.tipo_inversion === 'mensual').map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Estado" size="small" fullWidth
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="activas">Solo Activas</MenuItem>
            <MenuItem value="inactivas">Solo Canceladas</MenuItem>
            <MenuItem value="all">Todas</MenuItem>
          </TextField>
          
          {/* BOTÓN LIMPIAR ELIMINADO SEGÚN REQUERIMIENTO */}
        </Stack>
      </Paper>

      {/* ========== TABLA ========== */}
      <QueryHandler isLoading={loadingSuscripciones} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cuotas Pendientes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monto Pagado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tokens</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuscripciones.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>#{s.id}</TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {s.usuario?.nombre} {s.usuario?.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.usuario?.email}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{s.proyectoAsociado?.nombre_proyecto}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={s.meses_a_pagar === 0 ? 'Al día' : `${s.meses_a_pagar} pendientes`}
                      size="small"
                      color={s.meses_a_pagar > 0 ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      ${Number(s.monto_total_pagado).toLocaleString('es-AR')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                     <Chip label={s.tokens_disponibles} size="small" />
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={s.activo ? 'Activa' : 'Cancelada'} 
                      size="small" 
                      color={s.activo ? 'success' : 'default'}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Ver Detalle">
                      <IconButton color="primary" onClick={() => setSelectedSuscripcion(s)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    {s.activo && (
                      <Tooltip title="Cancelar Suscripción">
                        <IconButton 
                          color="error" 
                          onClick={() => handleCancelar(s)}
                          disabled={cancelarMutation.isPending}
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredSuscripciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No se encontraron suscripciones.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* ✅ MODAL INTEGRADO */}
      <DetalleSuscripcionModal 
        open={!!selectedSuscripcion}
        onClose={() => setSelectedSuscripcion(null)}
        suscripcion={selectedSuscripcion}
      />

    </PageContainer>
  );
};

export default AdminSuscripciones;
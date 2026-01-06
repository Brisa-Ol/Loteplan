import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Card, CardContent, Avatar, Stack, Alert,
  useTheme, Button, Tabs, Tab, Chip, CardHeader, Divider, alpha, LinearProgress
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon, Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon, AttachMoney as MoneyIcon, 
  AccountBalance as AccountBalanceIcon, Warning as WarningIcon, 
  Cancel as CancelIcon, Star as StarIcon, Gavel as GavelIcon,
  ReceiptLong, ArrowForward as ArrowForwardIcon,
  Person as PersonIcon, Landscape as LandscapeIcon, Handyman as HandymanIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// DTOs e Interfaces
import type { CompletionRateDTO, MonthlyProgressItem, ProyectoDto } from '../../../types/dto/proyecto.dto';
import type { InversionPorUsuarioDTO, LiquidityRateDTO } from '../../../types/dto/inversion.dto';
import type { CancelacionDTO, MorosidadDTO } from '../../../types/dto/suscripcion.dto';
import type { PopularidadLoteDTO } from '../../../types/dto/favorito.dto';
import type { KycDTO } from '../../../types/dto/kyc.dto';
import type { PujaDto } from '../../../types/dto/puja.dto';

// Componentes y Servicios
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable } from '../../../components/common/DataTable/DataTable';
import kycService from '../../../services/kyc.service';
import proyectoService from '../../../services/proyecto.service';
import inversionService from '../../../services/inversion.service';
import suscripcionService from '../../../services/suscripcion.service';
import favoritoService from '../../../services/favorito.service';
import pujaService from '../../../services/puja.service';

// --- INTERFACES ---
interface DashboardStats {
  pendingKYC: number;
  totalInvertido: string;
  totalPagado: string;
  tasaLiquidez: string;
  tasaMorosidad: string;
  tasaCancelacion: string;
  proyectosEnProceso: number;
  proyectosEnEspera: number;
  totalFinalizados: number;
  subastasActivas: number;
  cobrosPendientes: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onClick }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: theme.palette.divider,
        borderRadius: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: color } : {},
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{subtitle}</Typography>}
          </Box>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: alpha(color, 0.1), color: color, width: 56, height: 56, borderRadius: 2 }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // =================================================
  // 🎯 QUERIES
  // =================================================
  const { data: pendingKYC = [], isLoading: loadingKYC } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: async () => {
      const res = await kycService.getPendingVerifications();
      return (res as any).data || res;
    },
  });

  const { data: completionRate, isLoading: loadingCompletion } = useQuery<CompletionRateDTO>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate
  });

  const { data: monthlyProgress = [], isLoading: loadingProgress } = useQuery<MonthlyProgressItem[]>({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMonthlyProgress
  });

  const { data: liquidityRate, isLoading: loadingLiquidity } = useQuery<LiquidityRateDTO>({
    queryKey: ['liquidityRate'],
    queryFn: async () => (await inversionService.getLiquidityMetrics() as any).data || await inversionService.getLiquidityMetrics(),
  });

  const { data: inversionesPorUsuario = [], isLoading: loadingInversiones } = useQuery<InversionPorUsuarioDTO[]>({
    queryKey: ['inversionesPorUsuario'],
    queryFn: async () => {
      const res = await inversionService.getAggregatedMetrics();
      const data = (res as any).data || res;
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  const { data: morosidad, isLoading: loadingMorosidad } = useQuery<MorosidadDTO>({
    queryKey: ['morosidad'],
    queryFn: async () => (await suscripcionService.getMorosityMetrics() as any).data || await suscripcionService.getMorosityMetrics(),
  });

  const { data: cancelacion, isLoading: loadingCancelacion } = useQuery<CancelacionDTO>({
    queryKey: ['cancelacion'],
    queryFn: async () => (await suscripcionService.getCancellationMetrics() as any).data || await suscripcionService.getCancellationMetrics(),
  });

  const { data: proyectosActivos = [] } = useQuery<ProyectoDto[]>({
    queryKey: ['proyectosActivos'],
    queryFn: async () => (await proyectoService.getAllActive()).data,
  });

  const defaultProyectoId = proyectosActivos[0]?.id;

  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery<PopularidadLoteDTO[]>({
    queryKey: ['popularidadLotes', defaultProyectoId],
    queryFn: () => favoritoService.getPopularidadLotes(defaultProyectoId!),
    enabled: !!defaultProyectoId
  });

  const { data: allPujas = [], isLoading: loadingPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminAllPujas'],
    queryFn: async () => (await pujaService.findAll()).data,
  });

  const isLoading = loadingKYC || loadingCompletion || loadingProgress || loadingLiquidity || loadingInversiones || loadingMorosidad || loadingCancelacion || loadingPopularidad || loadingPujas;

  // =================================================
  // 📊 DATOS PROCESADOS
  // =================================================
  const RECHART_COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main];

  const stats: DashboardStats = useMemo(() => ({
    pendingKYC: pendingKYC.length,
    totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
    totalPagado: liquidityRate?.total_pagado ?? '0',
    tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
    tasaMorosidad: morosidad?.tasa_morosidad ?? '0',
    tasaCancelacion: cancelacion?.tasa_cancelacion ?? '0',
    proyectosEnProceso: monthlyProgress.filter(p => p.estado === 'En proceso').length,
    proyectosEnEspera: monthlyProgress.filter(p => p.estado === 'En Espera').length,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
    subastasActivas: allPujas.filter(p => p.estado_puja === 'activa').length,
    cobrosPendientes: allPujas.filter(p => p.estado_puja === 'ganadora_pendiente').length,
  }), [pendingKYC, liquidityRate, morosidad, cancelacion, monthlyProgress, completionRate, allPujas]);

  const chartDataSuscripciones = useMemo(() => monthlyProgress.map(p => ({
    nombre: p.nombre.length > 15 ? `${p.nombre.substring(0, 15)}...` : p.nombre,
    avance: parseFloat(p.porcentaje_avance),
  })), [monthlyProgress]);

  const estadosData = useMemo(() => [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter(item => item.value > 0), [stats]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Panel de Administración" subtitle="Visión general del rendimiento de la plataforma" />

      {/* Accesos Rápidos */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">Accesos Directos:</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            {[
              { label: 'Usuarios', icon: <PersonIcon />, path: '/admin/usuarios' },
              { label: 'Proyectos', icon: <HandymanIcon />, path: '/admin/proyectos' },
              { label: 'Lotes', icon: <LandscapeIcon />, path: '/admin/lotes' },
              { label: 'Subastas', icon: <GavelIcon />, path: '/admin/subastas' },
              { label: 'Contratos', icon: <AssessmentIcon />, path: '/admin/plantillas' },
            ].map(btn => (
              <Button key={btn.label} variant="outlined" size="small" startIcon={btn.icon} onClick={() => navigate(btn.path)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {btn.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard title="KYC Pendientes" value={stats.pendingKYC} icon={<PendingActionsIcon />} color={theme.palette.error.main} onClick={() => navigate('/Admin/Usuarios/AdminKYC')} />
        <StatCard title="Total Invertido" value={`$${parseFloat(stats.totalInvertido).toLocaleString()}`} icon={<MoneyIcon />} color={theme.palette.success.main} />
        <StatCard title="Liquidez Actual" value={`${stats.tasaLiquidez}%`} subtitle={`$${parseFloat(stats.totalPagado).toLocaleString()} pagados`} icon={<AccountBalanceIcon />} color={theme.palette.primary.main} />
        <StatCard title="Subastas Activas" value={stats.subastasActivas} subtitle={`${stats.cobrosPendientes} por cobrar`} icon={<GavelIcon />} color={theme.palette.warning.main} onClick={() => navigate('/admin/subastas')} />
      </Box>

      <QueryHandler isLoading={isLoading} error={null} fullHeight>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" textColor="primary" indicatorColor="primary">
            {['Proyectos', 'Suscripciones', 'Inversiones', 'Popularidad', 'Subastas'].map((label, i) => (
              <Tab key={label} label={label} icon={i === 4 ? <GavelIcon fontSize="small" /> : undefined} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {/* TAB CONTENIDO */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'success.main', color: 'white' }}><TrendingUpIcon fontSize="large" /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color="success.dark">{completionRate?.tasa_culminacion ?? '0'}%</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>Tasa Global de Culminación de Proyectos</Typography>
                  <Typography variant="body2" color="text.secondary">{stats.totalFinalizados} proyectos completados.</Typography>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              <Card elevation={0} sx={{ flex: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardHeader title="Avance de Suscripciones" avatar={<AssessmentIcon color="primary" />} />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartDataSuscripciones}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nombre" axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(v: any) => [`${v}%`, 'Avance']} />
                      <Bar dataKey="avance" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardHeader title="Distribución de Estados" />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={estadosData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {estadosData.map((_, index) => <Cell key={`cell-${index}`} fill={RECHART_COLORS[index % RECHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}

        {activeTab === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 64, height: 64 }}><WarningIcon fontSize="large" /></Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="error.main">{stats.tasaMorosidad}%</Typography>
                  <Typography variant="h6">Tasa de Morosidad</Typography>
                  <Chip label={`$${parseFloat(morosidad?.total_en_riesgo ?? '0').toLocaleString()} en riesgo`} color="error" size="small" variant="outlined" sx={{ mt: 1 }} />
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 64, height: 64 }}><CancelIcon fontSize="large" /></Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="warning.main">{stats.tasaCancelacion}%</Typography>
                  <Typography variant="h6">Tasa de Cancelación</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{cancelacion?.total_canceladas} suscripciones canceladas.</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader title="Top 5 Inversores" action={<Button endIcon={<ArrowForwardIcon />} size="small">Ver todos</Button>} />
            <Divider />
            <DataTable
              columns={[
                { id: 'nombre_usuario', label: 'Usuario', render: (row: InversionPorUsuarioDTO) => (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{row.nombre_usuario.charAt(0).toUpperCase()}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{row.nombre_usuario}</Typography>
                  </Stack>
                )},
                { id: 'email', label: 'Email' },
                { id: 'monto_total_invertido', label: 'Monto Total', align: 'right', format: (v) => `$${parseFloat(v as string).toLocaleString()}` },
                { id: 'cantidad_inversiones', label: 'Inversiones', align: 'right' },
              ]}
              data={inversionesPorUsuario.slice(0, 5)}
              getRowKey={row => row.id_usuario}
              pagination={false}
            />
          </Card>
        )}

        {activeTab === 3 && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader title="Lotes Más Populares" subheader={defaultProyectoId ? `Proyecto Actual` : "Seleccione un proyecto"} avatar={<StarIcon color="warning" />} />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                {popularidadLotes.slice(0, 5).map((lote, index) => (
                  <Paper key={lote.id_lote} variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, borderColor: index === 0 ? 'primary.main' : 'divider', bgcolor: index === 0 ? alpha(theme.palette.primary.main, 0.04) : 'transparent' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: index === 0 ? 'warning.main' : 'action.disabledBackground', color: 'white' }}><StarIcon fontSize="small" /></Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{lote.nombre_lote}</Typography>
                        <Typography variant="caption" color="text.secondary">Base: {favoritoService.formatPrecio(lote.precio_base)}</Typography>
                      </Box>
                    </Stack>
                    <Box textAlign="right" sx={{ minWidth: 100 }}>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">{lote.cantidad_favoritos}</Typography>
                      <LinearProgress variant="determinate" value={lote.porcentaje_popularidad} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {activeTab === 4 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 64, height: 64 }}><TrendingUpIcon fontSize="large" /></Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={700}>{stats.subastasActivas}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">Subastas en Curso</Typography>
                  <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={() => navigate('/admin/subastas')}>Ir a Sala</Button>
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 64, height: 64 }}><ReceiptLong fontSize="large" /></Avatar>
                <Box>
                  <Typography variant="h3" fontWeight={700}>{stats.cobrosPendientes}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">Adjudicaciones por Cobrar</Typography>
                  <Typography variant="caption" color="error" fontWeight={600}>Gestión administrativa requerida</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Stack,
  Snackbar,
  Alert,
  LinearProgress,
  useTheme,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import PersonIcon from '@mui/icons-material/Person';
import HandymanIcon from '@mui/icons-material/Handyman';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Servicios
import proyectoService from '../../../Services/proyecto.service';
import inversionService from '../../../Services/inversion.service';
import suscripcionService from '../../../Services/suscripcion.service';
import favoritoService from '../../../Services/favorito.service';
import kycService from '../../../Services/kyc.service';
import usuarioService from '../../../Services/usuario.service'; // Asegúrate de importar esto

// DTOs
import type { CompletionRateDTO, MonthlyProgressItem, ProyectoDto } from '../../../types/dto/proyecto.dto';
import type { UserStatsDTO } from '../../../types/dto/usuario.dto';
import type { InversionPorUsuarioDTO, LiquidityRateDTO } from '../../../types/dto/inversion.dto';
import type { CancelacionDTO, MorosidadDTO } from '../../../types/dto/suscripcion.dto';
import type { PopularidadLoteDTO } from '../../../types/dto/favorito.dto';
import type { KycDTO } from '../../../types/dto/kyc.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// ... (Interfaces DashboardStats y StatCardProps se mantienen igual) ...
interface DashboardStats {
  pendingKYC: number;
  nuevosUsuarios: number;
  totalInvertido: string;
  totalPagado: string;
  tasaLiquidez: string;
  tasaMorosidad: string;
  tasaCancelacion: string;
  proyectosEnProceso: number;
  proyectosEnEspera: number;
  totalFinalizados: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onClick }) => (
  <Card
    elevation={2}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
      transition: 'all 0.2s ease-in-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}
    onClick={onClick}
  >
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // =================================================
  // QUERIES
  // =================================================

  // 0. QUERY AUXILIAR: Obtener un proyecto activo para pedir sus estadísticas
  // (Esto es necesario porque tu backend exige un ID de proyecto)
  const { data: proyectosActivos = [] } = useQuery<ProyectoDto[]>({
    queryKey: ['proyectosActivos'],
    queryFn: async () => {
      const res = await proyectoService.getAllActive();
      return res.data;
    }
  });

  // ID del primer proyecto activo (fallback para estadísticas)
  const defaultProyectoId = proyectosActivos.length > 0 ? proyectosActivos[0].id : undefined;

  // 1. KYC
  const { data: pendingKYC = [], isLoading: loadingKYC } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: async () => {
       const res = await kycService.getPendingVerifications();
       const data = (res as any).data || res; // Adaptador por si varía la respuesta
       return Array.isArray(data) ? data : []; 
    },
  });

  // 2. Completion Rate
  const { data: completionRate, isLoading: loadingCompletion } = useQuery<CompletionRateDTO>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate
  });

  // 3. Monthly Progress
  const { data: monthlyProgress = [], isLoading: loadingProgress } = useQuery<MonthlyProgressItem[]>({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
        const data = await proyectoService.getMonthlyProgress();
        return Array.isArray(data) ? data : [];
    }
  });

  // 4. User Stats (Mocked en servicio o aquí)
  const { data: userStats, isLoading: loadingUserStats } = useQuery<UserStatsDTO>({
    queryKey: ['userStats'],
    queryFn: async () => {
      // Mock seguro si el servicio no está listo
      return { nuevos_ultimos_7_dias: 0, total_usuarios: 0, activos: 0, inactivos: 0 };
    },
  });

  // 5. Liquidity
  const { data: liquidityRate, isLoading: loadingLiquidity } = useQuery<LiquidityRateDTO>({
    queryKey: ['liquidityRate'],
    queryFn: async () => {
      const response = await inversionService.getLiquidityMetrics();
      const responseData = response.data as any;
      return responseData.data || responseData; 
    },
  });

  // 6. Inversiones
  const { data: inversionesPorUsuario = [], isLoading: loadingInversiones } = useQuery<InversionPorUsuarioDTO[]>({
    queryKey: ['inversionesPorUsuario'],
    queryFn: async () => {
      const response = await inversionService.getAggregatedMetrics();
      const responseData = response.data as any;
      const arrayData = Array.isArray(responseData) ? responseData : (responseData.data || []);
      return Array.isArray(arrayData) ? arrayData : [];
    },
  });

  // 7. Morosidad
  const { data: morosidad, isLoading: loadingMorosidad } = useQuery<MorosidadDTO>({
    queryKey: ['morosidad'],
    queryFn: async () => {
      const response = await suscripcionService.getMorosityMetrics();
      const responseData = response.data as any;
      return responseData.data || responseData;
    },
  });

  // 8. Cancelación
  const { data: cancelacion, isLoading: loadingCancelacion } = useQuery<CancelacionDTO>({
    queryKey: ['cancelacion'],
    queryFn: async () => {
      const response = await suscripcionService.getCancellationMetrics();
      const responseData = response.data as any;
      return responseData.data || responseData;
    },
  });

  // 9. Popularidad (CORREGIDO: Usa el ID del proyecto si existe)
  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery<PopularidadLoteDTO[]>({
    queryKey: ['popularidadLotes', defaultProyectoId], // Refetch si cambia el ID
    queryFn: async () => {
      // El servicio ahora maneja la lógica de adaptación y cálculo de %
      return await favoritoService.getPopularidadLotes(defaultProyectoId);
    },
    enabled: !!defaultProyectoId // Solo ejecuta si hay un proyecto activo detectado
  });

  const isLoading =
    loadingKYC ||
    loadingCompletion ||
    loadingProgress ||
    loadingUserStats ||
    loadingLiquidity ||
    loadingInversiones ||
    loadingMorosidad ||
    loadingCancelacion;
    // No bloqueamos por popularidad si no hay ID

  // =================================================
  // DATOS PROCESADOS
  // =================================================

  const RECHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const stats: DashboardStats = useMemo(() => ({
    pendingKYC: Array.isArray(pendingKYC) ? pendingKYC.length : 0,
    nuevosUsuarios: userStats?.nuevos_ultimos_7_dias ?? 0,
    totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
    totalPagado: liquidityRate?.total_pagado ?? '0',
    tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
    tasaMorosidad: morosidad?.tasa_morosidad ?? '0',
    tasaCancelacion: cancelacion?.tasa_cancelacion ?? '0',
    proyectosEnProceso: Array.isArray(monthlyProgress) ? monthlyProgress.filter((p) => p.estado === 'En proceso').length : 0,
    proyectosEnEspera: Array.isArray(monthlyProgress) ? monthlyProgress.filter((p) => p.estado === 'En Espera').length : 0,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
  }), [pendingKYC, userStats, liquidityRate, morosidad, cancelacion, monthlyProgress, completionRate]);

  const chartDataSuscripciones = useMemo(() => {
    if (!Array.isArray(monthlyProgress)) return [];
    return monthlyProgress.map((p) => ({
      nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
      avance: parseFloat(p.porcentaje_avance),
      meta: p.meta_suscripciones,
      actuales: p.suscripciones_actuales,
    }));
  }, [monthlyProgress]);

  const estadosData = [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter((item) => item.value > 0);

  const topInversores = Array.isArray(inversionesPorUsuario) ? inversionesPorUsuario.slice(0, 5) : [];
  const topLotes = Array.isArray(popularidadLotes) ? popularidadLotes.slice(0, 5) : [];

  // =================================================
  // RENDER
  // =================================================

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Panel de Administración"
        subtitle="Métricas de KPIs, Proyectos y Usuarios"
      />

      {/* Accesos Rápidos */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Accesos Rápidos
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 2 }}>
          <Button variant="outlined" startIcon={<PersonIcon/>} onClick={() => navigate('/admin/usuarios')}>Usuarios</Button>
          <Button variant="outlined" startIcon={<HandymanIcon/>} onClick={() => navigate('/admin/proyectos')}>Proyectos</Button>
          <Button variant="outlined" startIcon={<LandscapeIcon/>} onClick={() => navigate('/admin/lotes')}>Lotes</Button>
          <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => navigate('/admin/contracts')}>Subir Contrato</Button>
        </Stack>
      </Paper>

      {/* Tarjetas de Estadísticas Principales */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 4 
        }}
      >
        <StatCard title="KYC Pendientes" value={stats.pendingKYC} icon={<PendingActionsIcon />} color={theme.palette.error.main} onClick={() => navigate('/Admin/Usuarios/AdminKYC')} />
        <StatCard title="Nuevos Usuarios" value={stats.nuevosUsuarios} subtitle="Últimos 7 días" icon={<PeopleIcon />} color={theme.palette.info.main} />
        <StatCard title="Total Invertido" value={`$${parseFloat(stats.totalInvertido).toLocaleString()}`} subtitle="Registrado" icon={<MoneyIcon />} color={theme.palette.success.main} />
        <StatCard title="Total Pagado" value={`$${parseFloat(stats.totalPagado).toLocaleString()}`} subtitle={`Liquidez: ${stats.tasaLiquidez}%`} icon={<AccountBalanceIcon />} color={theme.palette.primary.main} />
      </Box>

      <QueryHandler isLoading={isLoading} error={null} fullHeight>
        {/* Tabs de Métricas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Proyectos" />
            <Tab label="Suscripciones" />
            <Tab label="Inversiones" />
            <Tab label="Popularidad" />
          </Tabs>
        </Box>

        {/* TAB 0: PROYECTOS */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">{completionRate?.tasa_culminacion ?? '0'}%</Typography>
                      <Typography variant="body2" color="text.secondary">Tasa de Culminación</Typography>
                      <Typography variant="caption" color="text.secondary">{completionRate?.total_finalizados ?? 0}/{completionRate?.total_iniciados ?? 0} proyectos</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 2 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Avance de Suscripciones (KPI 5)</Typography>
                  </Box>
                  {monthlyProgress.length === 0 ? <Alert severity="info">No hay proyectos mensuales activos.</Alert> : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartDataSuscripciones}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="avance" fill={theme.palette.primary.main} name="% Avance" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Distribución de Estados</Typography>
                  </Box>
                  {estadosData.length === 0 ? <Alert severity="info">No hay datos disponibles.</Alert> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={estadosData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                          {estadosData.map((entry, index) => <Cell key={`cell-${index}`} fill={RECHART_COLORS[index % RECHART_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Box>
            </Box>
          </Stack>
        )}

        {/* TAB 1: SUSCRIPCIONES */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <WarningIcon color="error" fontSize="large" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">{morosidad?.tasa_morosidad ?? '0'}%</Typography>
                      <Typography variant="body2" color="text.secondary">Tasa de Morosidad</Typography>
                      <Typography variant="caption" color="text.secondary">${parseFloat(morosidad?.monto_en_riesgo ?? '0').toLocaleString()} en riesgo</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CancelIcon color="warning" fontSize="large" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">{cancelacion?.tasa_cancelacion ?? '0'}%</Typography>
                      <Typography variant="body2" color="text.secondary">Tasa de Cancelación</Typography>
                      <Typography variant="caption" color="text.secondary">{cancelacion?.total_canceladas}/{cancelacion?.total_suscripciones} canceladas</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}

        {/* TAB 2: INVERSIONES */}
        {activeTab === 2 && (
          <Stack spacing={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Top 5 Inversores</Typography>
              {topInversores.length === 0 ? <Alert severity="info">No hay datos de inversiones disponibles.</Alert> : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Usuario</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell align="right"><strong>Monto Total</strong></TableCell>
                        <TableCell align="right"><strong>Inversiones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topInversores.map((inv) => (
                        <TableRow key={inv.id_usuario}>
                          <TableCell>{inv.nombre_usuario}</TableCell>
                          <TableCell>{inv.email}</TableCell>
                          <TableCell align="right">${parseFloat(inv.monto_total_invertido).toLocaleString()}</TableCell>
                          <TableCell align="right">{inv.cantidad_inversiones}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Stack>
        )}

        {/* TAB 3: POPULARIDAD */}
        {activeTab === 3 && (
          <Stack spacing={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Top 5 Lotes Más Populares {defaultProyectoId ? `(Proyecto #${defaultProyectoId})` : ''}</Typography>
              
              {!defaultProyectoId && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Mostrando datos vacíos porque no se detectaron proyectos activos para filtrar.
                </Alert>
              )}

              {topLotes.length === 0 ? <Alert severity="info">No hay datos de favoritos disponibles.</Alert> : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {topLotes.map((lote, index) => (
                    <Box key={lote.id_lote} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: index === 0 ? 'action.selected' : 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: RECHART_COLORS[index % RECHART_COLORS.length] }}><StarIcon /></Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>{lote.nombre_lote}</Typography>
                          <Typography variant="caption" color="text.secondary">{lote.cantidad_favoritos} usuarios lo marcaron como favorito</Typography>
                        </Box>
                      </Stack>
                      <Chip label={`${lote.porcentaje_popularidad}%`} color="primary" size="small" />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </QueryHandler>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminDashboard;
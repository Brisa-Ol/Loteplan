import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Avatar, Stack, Snackbar, Alert,
  useTheme, Chip, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, Tab,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon, Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon, 
  AttachMoney as MoneyIcon, AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon, Cancel as CancelIcon, Star as StarIcon,
} from '@mui/icons-material';
import LandscapeIcon from '@mui/icons-material/Landscape';
import PersonIcon from '@mui/icons-material/Person';
import HandymanIcon from '@mui/icons-material/Handyman';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// Servicios
import proyectoService from '../../../Services/proyecto.service';
import inversionService from '../../../Services/inversion.service';
import suscripcionService from '../../../Services/suscripcion.service';
import favoritoService from '../../../Services/favorito.service';
import kycService from '../../../Services/kyc.service';

// DTOs
import type { CompletionRateDTO, MonthlyProgressItem, ProyectoDto } from '../../../types/dto/proyecto.dto';
import type { InversionPorUsuarioDTO, LiquidityRateDTO } from '../../../types/dto/inversion.dto';
import type { CancelacionDTO, MorosidadDTO } from '../../../types/dto/suscripcion.dto';
import type { PopularidadLoteDTO } from '../../../types/dto/favorito.dto';
import type { KycDTO } from '../../../types/dto/kyc.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// --- MODIFICACIÓN: Se eliminó 'nuevosUsuarios' de la interfaz ---
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
  // 🎯 QUERIES OPTIMIZADAS
  // =================================================

  // 1. KYC Pendientes
  const { data: pendingKYC = [], isLoading: loadingKYC } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: async () => {
      const res = await kycService.getPendingVerifications();
      const data = (res as any).data || res;
      return Array.isArray(data) ? data : [];
    },
  });

  // 2. ✅ KPI 4: Tasa de Culminación (CORRECTO)
  const { data: completionRate, isLoading: loadingCompletion } = useQuery<CompletionRateDTO>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate // Ya extrae .data.data
  });

  // 3. ✅ KPI 5: Avance Mensual (CORRECTO)
  const { data: monthlyProgress = [], isLoading: loadingProgress } = useQuery<MonthlyProgressItem[]>({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
      const data = await proyectoService.getMonthlyProgress(); // Ya extrae .data.data
      return Array.isArray(data) ? data : [];
    }
  });


  // 5. Liquidez
  const { data: liquidityRate, isLoading: loadingLiquidity } = useQuery<LiquidityRateDTO>({
    queryKey: ['liquidityRate'],
    queryFn: async () => {
      const response = await inversionService.getLiquidityMetrics();
      const responseData = response.data as any;
      return responseData.data || responseData;
    },
  });

  // 6. Inversiones Agregadas
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

  // 9. Proyectos Activos (para popularidad)
  const { data: proyectosActivos = [] } = useQuery<ProyectoDto[]>({
    queryKey: ['proyectosActivos'],
    queryFn: async () => {
      const res = await proyectoService.getAllActive();
      return res.data;
    }
  });

  const defaultProyectoId = proyectosActivos.length > 0 ? proyectosActivos[0].id : undefined;

  // 10. Popularidad Lotes
  const { data: popularidadLotes = [], isLoading: loadingPopularidad } = useQuery<PopularidadLoteDTO[]>({
    queryKey: ['popularidadLotes', defaultProyectoId],
    queryFn: async () => {
      return await favoritoService.getPopularidadLotes(defaultProyectoId);
    },
    enabled: !!defaultProyectoId
  });

  const isLoading = loadingKYC || loadingCompletion || loadingProgress 
                    || loadingLiquidity || loadingInversiones || 
                    loadingMorosidad || loadingCancelacion;

  // =================================================
  // 📊 DATOS PROCESADOS
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
    // nuevosUsuarios eliminado de aquí
    totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
    totalPagado: liquidityRate?.total_pagado ?? '0',
    tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
    tasaMorosidad: morosidad?.tasa_morosidad ?? '0',
    tasaCancelacion: cancelacion?.tasa_cancelacion ?? '0',
    proyectosEnProceso: monthlyProgress.filter((p) => p.estado === 'En proceso').length,
    proyectosEnEspera: monthlyProgress.filter((p) => p.estado === 'En Espera').length,
    totalFinalizados: completionRate?.total_finalizados ?? 0,
  }), [pendingKYC, liquidityRate, morosidad, cancelacion, monthlyProgress, completionRate]);

  // ✅ KPI 5: Datos del gráfico de barras (OPTIMIZADO)
  const chartDataSuscripciones = useMemo(() => {
    return monthlyProgress.map((p) => ({
      nombre: p.nombre.length > 15 ? `${p.nombre.substring(0, 15)}...` : p.nombre,
      avance: parseFloat(p.porcentaje_avance),
      meta: p.meta_suscripciones,
      actuales: p.suscripciones_actuales,
    }));
  }, [monthlyProgress]);

  // Distribución de estados (Pie Chart)
  const estadosData = useMemo(() => [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter((item) => item.value > 0), [stats]);

  const topInversores = useMemo(() => 
    inversionesPorUsuario.slice(0, 5), 
    [inversionesPorUsuario]
  );

  const topLotes = useMemo(() => 
    popularidadLotes.slice(0, 5), 
    [popularidadLotes]
  );

  // =================================================
  // 🎨 RENDER
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
          <Button variant="outlined" startIcon={<PersonIcon/>} onClick={() => navigate('/admin/usuarios')}>
            Usuarios
          </Button>
          <Button variant="outlined" startIcon={<HandymanIcon/>} onClick={() => navigate('/admin/proyectos')}>
            Proyectos
          </Button>
          <Button variant="outlined" startIcon={<LandscapeIcon/>} onClick={() => navigate('/admin/lotes')}>
            Lotes
          </Button>
          <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => navigate('/admin/contracts')}>
            Subir Contrato
          </Button>
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
        <StatCard 
          title="KYC Pendientes" 
          value={stats.pendingKYC} 
          icon={<PendingActionsIcon />} 
          color={theme.palette.error.main} 
          onClick={() => navigate('/Admin/Usuarios/AdminKYC')} 
        />

        <StatCard 
          title="Total Invertido" 
          value={`$${parseFloat(stats.totalInvertido).toLocaleString()}`} 
          subtitle="Registrado" 
          icon={<MoneyIcon />} 
          color={theme.palette.success.main} 
        />
        <StatCard 
          title="Total Pagado" 
          value={`$${parseFloat(stats.totalPagado).toLocaleString()}`} 
          subtitle={`Liquidez: ${stats.tasaLiquidez}%`} 
          icon={<AccountBalanceIcon />} 
          color={theme.palette.primary.main} 
        />
        {/* Aquí iría la tarjeta de nuevos usuarios, ahora eliminada para que cuadre el grid de 4 */}
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
            {/* ✅ KPI 4: Tasa de Culminación */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {completionRate?.tasa_culminacion ?? '0'}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Culminación (KPI 4)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {completionRate?.total_finalizados ?? 0} de {completionRate?.total_iniciados ?? 0} finalizados
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              {/* ✅ KPI 5: Gráfico de Avance de Suscripciones */}
              <Box sx={{ flex: 2 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Avance de Suscripciones (KPI 5)
                    </Typography>
                  </Box>
                  {monthlyProgress.length === 0 ? (
                    <Alert severity="info">No hay proyectos mensuales activos.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartDataSuscripciones}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis label={{ value: '% Avance', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip 
                          formatter={(value: any, name: string) => {
                            if (name === 'avance') return [`${value}%`, '% Avance'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="avance" fill={theme.palette.primary.main} name="% Avance" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Box>

              {/* Distribución de Estados */}
              <Box sx={{ flex: 1 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Distribución de Estados
                    </Typography>
                  </Box>
                  {estadosData.length === 0 ? (
                    <Alert severity="info">No hay datos disponibles.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie 
                          data={estadosData} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} 
                          outerRadius={80} 
                          dataKey="value"
                        >
                          {estadosData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={RECHART_COLORS[index % RECHART_COLORS.length]} />
                          ))}
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
                      <Typography variant="h5" fontWeight="bold">
                        {morosidad?.tasa_morosidad ?? '0'}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Morosidad
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${parseFloat(morosidad?.total_en_riesgo ?? '0').toLocaleString()} en riesgo
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CancelIcon color="warning" fontSize="large" />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {cancelacion?.tasa_cancelacion ?? '0'}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Cancelación
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cancelacion?.total_canceladas}/{cancelacion?.total_suscripciones} canceladas
                      </Typography>
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
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 5 Inversores
              </Typography>
              {topInversores.length === 0 ? (
                <Alert severity="info">No hay datos de inversiones disponibles.</Alert>
              ) : (
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
                          <TableCell align="right">
                            ${parseFloat(inv.monto_total_invertido).toLocaleString()}
                          </TableCell>
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
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 5 Lotes Más Populares {defaultProyectoId && `(Proyecto #${defaultProyectoId})`}
              </Typography>
              
              {!defaultProyectoId && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No se detectaron proyectos activos para mostrar popularidad.
                </Alert>
              )}

              {topLotes.length === 0 ? (
                <Alert severity="info">No hay datos de favoritos disponibles.</Alert>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {topLotes.map((lote, index) => (
                    <Box 
                      key={lote.id_lote} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        p: 2, 
                        bgcolor: index === 0 ? 'action.selected' : 'background.paper', 
                        borderRadius: 1, 
                        border: 1, 
                        borderColor: 'divider' 
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: RECHART_COLORS[index % RECHART_COLORS.length] }}>
                          <StarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {lote.nombre_lote}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {lote.cantidad_favoritos} usuarios lo marcaron como favorito
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={`${lote.porcentaje_popularidad}%`} 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </QueryHandler>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminDashboard;
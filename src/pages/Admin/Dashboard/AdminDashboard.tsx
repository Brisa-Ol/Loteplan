import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Avatar, Stack, Alert,
  useTheme, Button, Tabs, Tab, Chip, CardHeader, Divider, alpha,
  LinearProgress
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon, Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon, AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon, Cancel as CancelIcon, Star as StarIcon,
  Gavel as GavelIcon,
  ReceiptLong,
  ArrowForward as ArrowForwardIcon
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
import kycService from '../../../Services/kyc.service';
import proyectoService from '../../../Services/proyecto.service';
import inversionService from '../../../Services/inversion.service';
import suscripcionService from '../../../Services/suscripcion.service';
import favoritoService from '../../../Services/favorito.service';
import pujaService from '../../../Services/puja.service';
import FavoritoService from '../../../Services/favorito.service';

// --- INTERFACES LOCALES ---
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
  color: string; // Esperamos un color hexadecimal o del theme
  onClick?: () => void;
}

// --- COMPONENTE TARJETA DE ESTADÍSTICA (THEMED) ---
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
        borderRadius: 3, // Bordes más redondeados
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          borderColor: color
        } : {},
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {/* Avatar con fondo suave del color del tema */}
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56,
              borderRadius: 2
            }}
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
  // 🎯 QUERIES (Sin cambios lógicos, solo estructura)
  // =================================================
  const { data: pendingKYC = [], isLoading: loadingKYC, error: errorKYC } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: async () => {
      const res = await kycService.getPendingVerifications();
      return Array.isArray((res as any).data || res) ? (res as any).data || res : [];
    },
  });

  const { data: completionRate, isLoading: loadingCompletion, error: errorCompletion } = useQuery<CompletionRateDTO>({
    queryKey: ['completionRate'],
    queryFn: proyectoService.getCompletionRate
  });

  const { data: monthlyProgress = [], isLoading: loadingProgress, error: errorProgress } = useQuery<MonthlyProgressItem[]>({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
      const data = await proyectoService.getMonthlyProgress();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: liquidityRate, isLoading: loadingLiquidity, error: errorLiquidity } = useQuery<LiquidityRateDTO>({
    queryKey: ['liquidityRate'],
    queryFn: async () => {
      const response = await inversionService.getLiquidityMetrics();
      return (response as any).data || (response.data ? response.data : response);
    },
  });

  const { data: inversionesPorUsuario = [], isLoading: loadingInversiones, error: errorInversiones } = useQuery<InversionPorUsuarioDTO[]>({
    queryKey: ['inversionesPorUsuario'],
    queryFn: async () => {
      const response = await inversionService.getAggregatedMetrics();
      const data = (response as any).data || response;
      return Array.isArray(data) ? data : (data.data || []);
    },
  });

  const { data: morosidad, isLoading: loadingMorosidad, error: errorMorosidad } = useQuery<MorosidadDTO>({
    queryKey: ['morosidad'],
    queryFn: async () => ((await suscripcionService.getMorosityMetrics()) as any).data || await suscripcionService.getMorosityMetrics(),
  });

  const { data: cancelacion, isLoading: loadingCancelacion, error: errorCancelacion } = useQuery<CancelacionDTO>({
    queryKey: ['cancelacion'],
    queryFn: async () => ((await suscripcionService.getCancellationMetrics()) as any).data || await suscripcionService.getCancellationMetrics(),
  });

  const { data: proyectosActivos = [] } = useQuery<ProyectoDto[]>({
    queryKey: ['proyectosActivos'],
    queryFn: async () => (await proyectoService.getAllActive()).data,
  });

  const defaultProyectoId = proyectosActivos.length > 0 ? proyectosActivos[0].id : undefined;

  const { data: popularidadLotes = [], isLoading: loadingPopularidad, error: errorPopularidad } = useQuery<PopularidadLoteDTO[]>({
    queryKey: ['popularidadLotes', defaultProyectoId],
    queryFn: async () => defaultProyectoId ? await favoritoService.getPopularidadLotes(defaultProyectoId) : [],
    enabled: !!defaultProyectoId
  });

  const { data: allPujas = [], isLoading: loadingPujas, error: errorPujas } = useQuery<PujaDto[]>({
    queryKey: ['adminAllPujas'],
    queryFn: async () => (await pujaService.findAll()).data,
  });

  // Gestión de carga y errores combinada
  const isLoading = loadingKYC || loadingCompletion || loadingProgress || loadingLiquidity || loadingInversiones || loadingMorosidad || loadingCancelacion || loadingPopularidad || loadingPujas;
  const error = errorKYC || errorCompletion || errorProgress || errorLiquidity || errorInversiones || errorMorosidad || errorCancelacion || errorPopularidad || errorPujas;

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

  const stats: DashboardStats = useMemo(() => {
    const activas = allPujas.filter(p => p.estado_puja === 'activa').length;
    const pendientesCobro = allPujas.filter(p => p.estado_puja === 'ganadora_pendiente').length;

    return {
      pendingKYC: Array.isArray(pendingKYC) ? pendingKYC.length : 0,
      totalInvertido: liquidityRate?.total_invertido_registrado ?? '0',
      totalPagado: liquidityRate?.total_pagado ?? '0',
      tasaLiquidez: liquidityRate?.tasa_liquidez ?? '0',
      tasaMorosidad: morosidad?.tasa_morosidad ?? '0',
      tasaCancelacion: cancelacion?.tasa_cancelacion ?? '0',
      proyectosEnProceso: monthlyProgress.filter((p) => p.estado === 'En proceso').length,
      proyectosEnEspera: monthlyProgress.filter((p) => p.estado === 'En Espera').length,
      totalFinalizados: completionRate?.total_finalizados ?? 0,
      subastasActivas: activas,
      cobrosPendientes: pendientesCobro,
    };
  }, [pendingKYC, liquidityRate, morosidad, cancelacion, monthlyProgress, completionRate, allPujas]);

  const chartDataSuscripciones = useMemo(() => monthlyProgress.map((p) => ({
    nombre: p.nombre.length > 15 ? `${p.nombre.substring(0, 15)}...` : p.nombre,
    avance: parseFloat(p.porcentaje_avance),
    meta: p.meta_suscripciones,
    actuales: p.suscripciones_actuales,
  })), [monthlyProgress]);

  const estadosData = useMemo(() => [
    { name: 'En Proceso', value: stats.proyectosEnProceso },
    { name: 'En Espera', value: stats.proyectosEnEspera },
    { name: 'Finalizados', value: stats.totalFinalizados },
  ].filter((item) => item.value > 0), [stats]);

  const topInversores = useMemo(() => inversionesPorUsuario.slice(0, 5), [inversionesPorUsuario]);
  const topLotes = useMemo(() => popularidadLotes.slice(0, 5), [popularidadLotes]);

  // =================================================
  // 🎨 RENDER
  // =================================================

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Panel de Administración"
        subtitle="Visión general del rendimiento de la plataforma"
      />

      {/* Accesos Rápidos - Estilo Moderno */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.6) 
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
            Accesos Directos:
          </Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            {[
              { label: 'Usuarios', icon: <PersonIcon />, path: '/admin/usuarios' },
              { label: 'Proyectos', icon: <HandymanIcon />, path: '/admin/proyectos' },
              { label: 'Lotes', icon: <LandscapeIcon />, path: '/admin/lotes' },
              { label: 'Subastas', icon: <GavelIcon />, path: '/admin/subastas' },
              { label: 'Contratos', icon: <AssessmentIcon />, path: '/admin/plantillas' },
            ].map((btn) => (
              <Button
                key={btn.label}
                variant="outlined"
                size="small"
                startIcon={btn.icon}
                onClick={() => navigate(btn.path)}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Tarjetas de Estadísticas Principales */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 3,
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
          subtitle="Capital registrado"
          icon={<MoneyIcon />}
          color={theme.palette.success.main}
        />
        <StatCard
          title="Liquidez Actual"
          value={`${stats.tasaLiquidez}%`}
          subtitle={`$${parseFloat(stats.totalPagado).toLocaleString()} pagados`}
          icon={<AccountBalanceIcon />}
          color={theme.palette.primary.main}
        />
        <StatCard
          title="Subastas Activas"
          value={stats.subastasActivas}
          subtitle={`${stats.cobrosPendientes} cobros pendientes`}
          icon={<GavelIcon />}
          color={theme.palette.warning.main}
          onClick={() => navigate('/admin/subastas')}
        />
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error} fullHeight>
        
        {/* Navegación por Pestañas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)} 
            variant="scrollable" 
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Proyectos" />
            <Tab label="Suscripciones" />
            <Tab label="Inversiones" />
            <Tab label="Popularidad" />
            <Tab label="Estado Subastas" icon={<GavelIcon fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* TAB 0: PROYECTOS */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* KPI Tasa de Culminación - Diseño destacado */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'success.main', color: 'white' }}>
                  <TrendingUpIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color="success.dark">
                    {completionRate?.tasa_culminacion ?? '0'}%
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Tasa Global de Culminación de Proyectos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completionRate?.total_finalizados ?? 0} proyectos han sido completados exitosamente.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              {/* Gráfico Barras */}
              <Card elevation={0} sx={{ flex: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardHeader 
                  title="Avance de Suscripciones" 
                  subheader="Comparativa por proyecto"
                  avatar={<AssessmentIcon color="primary" />}
                />
                <Divider />
                <CardContent>
                  {monthlyProgress.length === 0 ? <Alert severity="info">No hay proyectos mensuales.</Alert> : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartDataSuscripciones} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8, boxShadow: theme.shadows[3], border: 'none' }}
                          formatter={(value: any, name: string) => name === 'avance' ? [`${value}%`, '% Avance'] : [value, name]} 
                        />
                        <Legend />
                        <Bar dataKey="avance" fill={theme.palette.primary.main} name="% Avance" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico Torta */}
              <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardHeader title="Distribución de Estados" />
                <Divider />
                <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {estadosData.length === 0 ? <Alert severity="info">No hay datos.</Alert> : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie 
                          data={estadosData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60} 
                          outerRadius={90} 
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {estadosData.map((entry, index) => <Cell key={`cell-${index}`} fill={RECHART_COLORS[index % RECHART_COLORS.length]} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}

        {/* TAB 1: SUSCRIPCIONES */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Card Morosidad */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 64, height: 64 }}>
                       <WarningIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="error.main">{morosidad?.tasa_morosidad ?? '0'}%</Typography>
                      <Typography variant="h6" color="text.primary">Tasa de Morosidad</Typography>
                      <Chip 
                        label={`$${parseFloat(morosidad?.total_en_riesgo ?? '0').toLocaleString()} en riesgo`} 
                        color="error" 
                        size="small" 
                        variant="outlined" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Card Cancelación */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 64, height: 64 }}>
                       <CancelIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h3" fontWeight={700} color="warning.main">{cancelacion?.tasa_cancelacion ?? '0'}%</Typography>
                      <Typography variant="h6" color="text.primary">Tasa de Cancelación</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total de {cancelacion?.total_canceladas} suscripciones canceladas.
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
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardHeader 
              title="Top 5 Inversores" 
              subheader="Usuarios con mayor volumen de inversión"
              action={<Button endIcon={<ArrowForwardIcon />} size="small">Ver todos</Button>}
            />
            <Divider />
            {topInversores.length === 0 ? <Box p={3}><Alert severity="info">No hay datos.</Alert></Box> : (
              <DataTable
                columns={[
                  { 
                    id: 'nombre_usuario', 
                    label: 'Usuario', 
                    // CORRECCIÓN AQUÍ: Usamos solo (row) en lugar de (val, row)
                    render: (row: InversionPorUsuarioDTO) => (
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {String(row.nombre_usuario).charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{row.nombre_usuario}</Typography>
                      </Stack>
                    )
                  },
                  { id: 'email', label: 'Email' },
                  { 
                    id: 'monto_total_invertido', 
                    label: 'Monto Total', 
                    align: 'right', 
                    format: (value) => (
                      <Typography fontWeight={700} color="success.main">
                         ${parseFloat(value).toLocaleString()}
                      </Typography>
                    )
                  },
                  { id: 'cantidad_inversiones', label: 'Inversiones', align: 'right' },
                ]}
                data={topInversores}
                getRowKey={(row) => row.id_usuario}
                elevation={0}
                pagination={false}
              />
            )}
          </Card>
        )}

        {/* TAB 3: POPULARIDAD */}
        {activeTab === 3 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardHeader
              title="Lotes Más Populares"
              subheader={defaultProyectoId ? `Proyecto: ${proyectosActivos.find(p => p.id === defaultProyectoId)?.nombre_proyecto}` : "Seleccione un proyecto"}
              avatar={<StarIcon color="warning" />}
            />
            <Divider />
            <CardContent>
              {!defaultProyectoId ? <Alert severity="warning">Se requiere al menos un proyecto activo.</Alert> : topLotes.length === 0 ? <Alert severity="info">Aún no hay favoritos.</Alert> : (
                <Stack spacing={2}>
                  {topLotes.map((lote, index) => (
                    <Paper
                      key={lote.id_lote}
                      elevation={0}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        // Resaltar el top 1 con el color primario del tema
                        borderColor: index === 0 ? 'primary.main' : 'divider',
                        bgcolor: index === 0 ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.01)' }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: index === 0 ? 'warning.main' : theme.palette.action.disabledBackground,
                            color: index === 0 ? 'white' : 'text.secondary',
                            width: 40, height: 40
                          }}
                        >
                          <StarIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} color={index === 0 ? 'primary.main' : 'text.primary'}>
                            {lote.nombre_lote}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Base: {FavoritoService.formatPrecio(lote.precio_base)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box textAlign="right" sx={{ minWidth: 100 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">{lote.cantidad_favoritos}</Typography>
                        <Typography variant="caption" display="block">votos</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={lote.porcentaje_popularidad} 
                          sx={{ height: 6, borderRadius: 3, mt: 0.5, bgcolor: 'grey.200' }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: ESTADO SUBASTAS */}
        {activeTab === 4 && (
          <Stack spacing={3}>
            <Alert 
              severity="info" 
              variant="standard" 
              icon={<GavelIcon />}
              sx={{ border: '1px solid', borderColor: 'info.main' }}
            >
              Este panel muestra métricas rápidas. Para administrar pujas en tiempo real, utilice la <strong>Sala de Subastas</strong>.
            </Alert>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Card Subastas Activas */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                     <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 64, height: 64 }}>
                        <TrendingUpIcon fontSize="large" />
                     </Avatar>
                    <Box flex={1}>
                      <Typography variant="h3" fontWeight={700} color="text.primary">{stats.subastasActivas}</Typography>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>Subastas en Curso</Typography>
                      <Button variant="contained" size="small" onClick={() => navigate('/admin/subastas')} startIcon={<GavelIcon />}>
                        Ir a Sala
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Card Cobros Pendientes */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 64, height: 64 }}>
                        <ReceiptLong fontSize="large" />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h3" fontWeight={700} color="text.primary">{stats.cobrosPendientes}</Typography>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>Adjudicaciones por Cobrar</Typography>
                      <Typography variant="caption" color="error" fontWeight={600}>Requiere gestión administrativa</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        )}

      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
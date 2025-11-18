// src/pages/Admin/Dashboard/AdminDashboard.tsx (COMPLETO)
import React, { useState } from 'react';
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
  useTheme,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  PendingActions as PendingActionsIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Terrain as TerrainIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
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
import type { KycDTO } from '../../../types/dto/kyc.dto';
import { kycService } from '../../../Services/kyc.service';
import { proyectoService } from '../../../Services/proyecto.service';
import { usuarioService } from '../../../Services/usuario.service';
import { getMetricasLiquidez, getInversionAgregadaPorUsuario } from '../../../Services/inversion.service';
import { suscripcionProyectoService } from '../../../Services/suscripcionproyecto.service';
import { getMetricasRecaudoMensual, getTasaPagosATiempo } from '../../../Services/pago.service';
import { getEstadisticasFavoritos } from '../../../Services/favorito.service';
import type { 
  MetricasCulminacionDto,
  MetricasAvanceMensualDto,
  ProyectoDTO,
} from '../../../types/dto/proyecto.dto';
import type { MetricasLiquidezDto, InversionAgregadaPorUsuarioDto } from '../../../types/dto/inversion.dto';
import type { MetricasMorosidadDto, MetricasCancelacionDto } from '../../../types/dto/suscripcionProyecto.dto';
import type { MetricasRecaudoMensualDto, TasaPagosATiempoDto } from '../../../types/dto/pago.dto';
import type { EstadisticasFavoritoDTO } from '../../../types/dto/favorito.dto';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedProyectoFavoritos, setSelectedProyectoFavoritos] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [alertasOpen, setAlertasOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // ══════════════════════════════════════════════════════════
  // QUERIES - VISTA GENERAL
  // ══════════════════════════════════════════════════════════

  const {
    data: pendingKYC = [],
    isLoading: loadingKYC,
    error: kycError,
  } = useQuery<KycDTO[], Error>({
    queryKey: ['pendingKYC'],
    queryFn: kycService.getPendingVerifications,
  });

  const {
    data: nuevosUsuarios,
    isLoading: loadingNuevosUsuarios,
  } = useQuery<{ hoy: number; ultimos_dias: number }, Error>({
    queryKey: ['nuevosUsuarios'],
    queryFn: () => usuarioService.getNuevosUsuarios(7),
  });

  const {
    data: metricasLiquidez,
    isLoading: loadingLiquidez,
  } = useQuery<MetricasLiquidezDto, Error>({
    queryKey: ['metricasLiquidez'],
    queryFn: getMetricasLiquidez,
  });

  // ══════════════════════════════════════════════════════════
  // QUERIES - KPIs
  // ══════════════════════════════════════════════════════════

  // KPI 1: Avance de Proyectos Mensuales (Tarea 1)
  const {
    data: monthlyProgress = [],
    isLoading: isLoadingProgress,
    error: errorProgress,
  } = useQuery<MetricasAvanceMensualDto, Error>({
    queryKey: ['monthlyProgress'],
    queryFn: proyectoService.getMetricasAvanceMensual,
  });

  // KPI 2: Tasa de Culminación (Tarea 2)
  const {
    data: completionRate,
    isLoading: isLoadingCompletion,
    error: errorCompletion,
  } = useQuery<MetricasCulminacionDto, Error>({
    queryKey: ['MetricasCulminacion'],
    queryFn: proyectoService.getMetricasCulminacion,
  });

  // KPI 3: Popularidad de Lotes (Tarea 3)
  const {
    data: estadisticasFavoritos = [],
    isLoading: loadingFavoritos,
  } = useQuery<EstadisticasFavoritoDTO[], Error>({
    queryKey: ['estadisticasFavoritos', selectedProyectoFavoritos],
    queryFn: () => getEstadisticasFavoritos(selectedProyectoFavoritos || undefined),
    enabled: true,
  });

  // KPI 4: Tasa de Liquidez (Tarea 4) - Ya cargado arriba

  // KPI 5: Inversión Agregada por Usuario (Tarea 5)
  const {
    data: inversionPorUsuario = [],
    isLoading: loadingInversionUsuario,
  } = useQuery<InversionAgregadaPorUsuarioDto[], Error>({
    queryKey: ['inversionAgregadaPorUsuario'],
    queryFn: getInversionAgregadaPorUsuario,
  });

  // KPI 6: Tasa de Morosidad (Tarea 6)
  const {
    data: metricasMorosidad,
    isLoading: loadingMorosidad,
  } = useQuery<MetricasMorosidadDto, Error>({
    queryKey: ['metricasMorosidad'],
    queryFn: suscripcionProyectoService.getMetricasMorosidad,
  });

  // KPI 7: Tasa de Cancelación (Tarea 7)
  const {
    data: metricasCancelacion,
    isLoading: loadingCancelacion,
  } = useQuery<MetricasCancelacionDto, Error>({
    queryKey: ['metricasCancelacion'],
    queryFn: suscripcionProyectoService.getMetricasCancelacion,
  });

  // KPI 8: Métricas de Recaudo Mensual (Tarea 8)
  const {
    data: recaudoMensual,
    isLoading: loadingRecaudo,
  } = useQuery<MetricasRecaudoMensualDto, Error>({
    queryKey: ['recaudoMensual', selectedMes, selectedAnio],
    queryFn: () => getMetricasRecaudoMensual(selectedMes, selectedAnio),
  });

  // KPI 9: Tasa de Pagos a Tiempo (Tarea 9)
  const {
    data: tasaPagosATiempo,
    isLoading: loadingTasaPagos,
  } = useQuery<TasaPagosATiempoDto, Error>({
    queryKey: ['tasaPagosATiempo', selectedMes, selectedAnio],
    queryFn: () => getTasaPagosATiempo(selectedMes, selectedAnio),
  });

  // Query para obtener proyectos para el selector de favoritos
  const {
    data: proyectos = [],
  } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos,
  });

  const isLoading =
    loadingKYC || loadingNuevosUsuarios || loadingLiquidez ||
    isLoadingCompletion || isLoadingProgress || loadingFavoritos ||
    loadingInversionUsuario || loadingMorosidad || loadingCancelacion ||
    loadingRecaudo || loadingTasaPagos;

  const queryError = kycError || errorCompletion || errorProgress;

  // ══════════════════════════════════════════════════════════
  // DATOS PROCESADOS
  // ══════════════════════════════════════════════════════════


  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Panel de Administración"
        subtitle="Dashboard Principal, Reportes y Alertas"
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* 1. VISTA GENERAL - Estadísticas Clave */}
      {/* ════════════════════════════════════════════════════════ */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Vista General
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {/* Nuevos Usuarios */}
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {nuevosUsuarios?.hoy ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nuevos Usuarios (Hoy)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {nuevosUsuarios?.ultimos_dias ?? 0} últimos 7 días
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Inversiones Totales Pagadas */}
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      ${metricasLiquidez?.total_pagado?.toLocaleString() ?? '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inversiones Pagadas
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Monto Total Transaccionado */}
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      ${metricasLiquidez?.total_invertido_registrado?.toLocaleString() ?? '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Transaccionado
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* KYC Pendientes */}
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
            <Card
              elevation={2}
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
              }}
              onClick={() => navigate('/admin/kyc')}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <PendingActionsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {pendingKYC.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      KYC Pendientes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Botones de Acceso Directo */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Accesos Directos
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/admin/usuarios')}
            >
              Buscar Usuario
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/proyectos')}
            >
              Crear Nuevo Proyecto
            </Button>
            <Button
              variant="contained"
              startIcon={<TerrainIcon />}
              onClick={() => navigate('/admin/lotes')}
            >
              Crear Nuevo Lote
            </Button>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/admin/proyectos')}
            >
              Definir Nueva Cuota Mensual
            </Button>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/admin/contratos/plantillas')}
            >
              Subir Plantilla de Contrato
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* ════════════════════════════════════════════════════════ */}
      {/* 2. MÓDULO: REPORTES Y MÉTRICAS (KPIs) */}
      {/* ════════════════════════════════════════════════════════ */}
      <QueryHandler
        isLoading={isLoading}
        error={queryError as Error | null}
        fullHeight={false}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Reportes y Métricas (KPIs)
            </Typography>
            <IconButton
              color="primary"
              onClick={() => setAlertasOpen(true)}
              sx={{ position: 'relative' }}
            >
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* TAREA 1 y 2: Lado a lado */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              {/* TAREA 1: Avance de Proyectos Mensuales */}
              <Box sx={{ width: { xs: '100%', lg: 'calc(66.66% - 12px)' } }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Tarea 1: Avance de Proyectos Mensuales
                    </Typography>
                  </Box>
                  {monthlyProgress.length === 0 ? (
                    <Alert severity="info">No hay proyectos mensuales activos.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyProgress.map((p) => ({
                        nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
                        avance: parseFloat(p.porcentaje_avance),
                        meta: p.meta_suscripciones,
                        actuales: p.suscripciones_actuales,
                      }))}>
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

              {/* TAREA 2: Tasa de Culminación */}
              <Box sx={{ width: { xs: '100%', lg: 'calc(33.33% - 12px)' } }}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 2: Tasa de Culminación
                  </Typography>
                </Box>
                {completionRate ? (
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="primary" align="center">
                      {parseFloat(completionRate.tasa_culminacion).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      {completionRate.total_finalizados} / {completionRate.total_iniciados} proyectos
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Finalizados', value: completionRate.total_finalizados },
                              { name: 'En Proceso', value: completionRate.total_iniciados - completionRate.total_finalizados },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            <Cell fill={theme.palette.success.main} />
                            <Cell fill={theme.palette.warning.main} />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">No hay datos disponibles.</Alert>
                )}
              </Paper>
              </Box>
            </Box>

            {/* TAREA 3: Popularidad de Lotes */}
            <Box sx={{ width: '100%' }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 3: Popularidad de Lotes
                  </Typography>
                </Box>
                <FormControl sx={{ minWidth: 200, mb: 2 }}>
                  <InputLabel>Filtrar por Proyecto</InputLabel>
                  <Select
                    value={selectedProyectoFavoritos || ''}
                    label="Filtrar por Proyecto"
                    onChange={(e) => setSelectedProyectoFavoritos(e.target.value as number | null)}
                  >
                    <MenuItem value="">Todos los Proyectos</MenuItem>
                    {proyectos.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nombre_proyecto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {estadisticasFavoritos.length === 0 ? (
                  <Alert severity="info">No hay datos de favoritos disponibles.</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Lote ID</TableCell>
                          <TableCell>Nombre del Lote</TableCell>
                          <TableCell align="right">Total de Favoritos</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estadisticasFavoritos
                          .sort((a, b) => b.total_favoritos - a.total_favoritos)
                          .map((stat) => (
                            <TableRow key={stat.lote.id}>
                              <TableCell>{stat.lote.id}</TableCell>
                              <TableCell>{stat.lote.nombre_lote || 'Sin nombre'}</TableCell>
                              <TableCell align="right">
                                <Chip label={stat.total_favoritos} color="primary" />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>

            {/* TAREA 4 y 5: Lado a lado */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* TAREA 4: Tasa de Liquidez */}
              <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 12px)' } }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Tarea 4: Tasa de Liquidez
                    </Typography>
                  </Box>
                  {metricasLiquidez ? (
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary" align="center">
                        {parseFloat(metricasLiquidez.tasa_liquidez).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        ${metricasLiquidez.total_pagado.toLocaleString()} / ${metricasLiquidez.total_invertido_registrado.toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Alert severity="info">No hay datos disponibles.</Alert>
                  )}
                </Paper>
              </Box>

              {/* TAREA 5: Inversión Agregada por Usuario */}
              <Box sx={{ width: { xs: '100%', md: 'calc(66.66% - 12px)' } }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 5: Inversión Agregada por Usuario
                  </Typography>
                </Box>
                {inversionPorUsuario.length === 0 ? (
                  <Alert severity="info">No hay datos de inversiones disponibles.</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Usuario</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="right">Monto Total Invertido</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inversionPorUsuario
                          .sort((a, b) => b.monto_total_invertido - a.monto_total_invertido)
                          .slice(0, 10)
                          .map((item) => (
                            <TableRow key={item.id_usuario}>
                              <TableCell>{item.nombre_usuario}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell align="right">
                                ${item.monto_total_invertido.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
              </Box>
            </Box>

            {/* TAREA 6 y 7: Lado a lado */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* TAREA 6: Tasa de Morosidad */}
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6" fontWeight="bold">
                      Tarea 6: Tasa de Morosidad
                    </Typography>
                  </Box>
                  {metricasMorosidad ? (
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="warning.main" align="center">
                        {parseFloat(metricasMorosidad.tasa_morosidad).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        ${parseFloat(metricasMorosidad.total_en_riesgo).toLocaleString()} en riesgo
                      </Typography>
                    </Box>
                  ) : (
                    <Alert severity="info">No hay datos disponibles.</Alert>
                  )}
                </Paper>
              </Box>

              {/* TAREA 7: Tasa de Cancelación */}
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 7: Tasa de Cancelación
                  </Typography>
                </Box>
                {metricasCancelacion ? (
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="error.main" align="center">
                      {parseFloat(metricasCancelacion.tasa_cancelacion).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      {metricasCancelacion.total_canceladas} / {metricasCancelacion.total_suscripciones} canceladas
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">No hay datos disponibles.</Alert>
                )}
              </Paper>
              </Box>
            </Box>

            {/* TAREA 8 y 9: Recaudo Mensual y Tasa de Pagos a Tiempo */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 8: Recaudo Mensual
                  </Typography>
                </Box>
                <Stack spacing={2} sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Mes</InputLabel>
                    <Select
                      value={selectedMes}
                      label="Mes"
                      onChange={(e) => setSelectedMes(e.target.value as number)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <MenuItem key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('es-AR', { month: 'long' })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Año"
                    value={selectedAnio}
                    onChange={(e) => setSelectedAnio(parseInt(e.target.value))}
                  />
                </Stack>
                {recaudoMensual ? (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      ${recaudoMensual.recaudo_total.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Recaudo Total
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      ${recaudoMensual.monto_vencido.toLocaleString()} vencido
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">No hay datos disponibles.</Alert>
                )}
              </Paper>
            </Box>

            {/* TAREA 9: Tasa de Pagos a Tiempo */}
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6" fontWeight="bold">
                    Tarea 9: Tasa de Pagos a Tiempo
                  </Typography>
                </Box>
                {tasaPagosATiempo ? (
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="success.main" align="center">
                      {parseFloat(tasaPagosATiempo.tasa_pagos_a_tiempo).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      {tasaPagosATiempo.pagos_a_tiempo} / {tasaPagosATiempo.total_pagos} pagos
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">No hay datos disponibles.</Alert>
                )}
              </Paper>
            </Box>
            </Box>
          </Box>
        </Box>
      </QueryHandler>

      {/* ════════════════════════════════════════════════════════ */}
      {/* 3. BANDEJA DE ALERTAS (Mensajería del Sistema) */}
      {/* ════════════════════════════════════════════════════════ */}
      <Dialog
        open={alertasOpen}
        onClose={() => setAlertasOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Bandeja de Alertas del Sistema
            </Typography>
            <IconButton onClick={() => setAlertasOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            <Alert severity="info" sx={{ mb: 2 }}>
              Las alertas del sistema aparecerán aquí cuando ocurran eventos automáticos:
            </Alert>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Proyecto mensual pausado automáticamente"
                secondary="Se detectó que un proyecto cayó bajo el mínimo de suscriptores"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Proyecto mensual finalizado"
                secondary="Un proyecto completó su plazo (meses_restantes = 0)"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <ErrorIcon color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Lote reseteado para reingreso"
                secondary="Un lote agotó sus 3 intentos de pago"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <ErrorIcon color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Reembolso automático fallido"
                secondary="Requiere intervención manual del administrador"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Nota: Esta funcionalidad requiere implementación en el backend para enviar notificaciones automáticas.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertasOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

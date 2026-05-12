import {
  AccountBalance,
  Assessment,
  AssignmentTurnedIn,
  AttachMoney,
  CalendarMonth,
  CheckCircle,
  EventAvailable,
  Gavel,
  Handyman,
  InfoOutlined,
  Landscape,
  Person,
  QueryStats,
  Receipt,
  ReceiptLong,
  RocketLaunch,
  Schedule,
  Security,
  Speed,
  Star,
  Timeline,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis
} from 'recharts';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

// ===========================================================================
// UTILIDADES
// ===========================================================================

const toNumber = (val: unknown): number => parseFloat(String(val || 0)) || 0;

const formatearMoneda = (val: unknown): string =>
  `$${toNumber(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

// ===========================================================================
// SUB-COMPONENTES
// ===========================================================================

interface AlertaPrioritariaProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  severity: 'error' | 'warning' | 'success' | 'info';
  actionLabel: string;
  onAction: () => void;
}

const AlertaPrioritaria = React.memo<AlertaPrioritariaProps>(({
  title, value, description, icon, severity, actionLabel, onAction
}) => {
  const theme = useTheme();
  const colorBase = theme.palette[severity].main;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3, border: `2px solid ${colorBase}`, borderRadius: 3,
        bgcolor: alpha(colorBase, 0.04), position: 'relative', overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column'
      }}
    >
      <Box sx={{ position: 'absolute', right: -15, top: -15, opacity: 0.08, fontSize: 100, color: colorBase }}>
        {icon}
      </Box>

      <Stack spacing={2} sx={{ position: 'relative', flexGrow: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: colorBase, color: 'white', width: 48, height: 48, borderRadius: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="subtitle2">{title}</Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, minHeight: 40 }}>
          {description}
        </Typography>

        <Button
          variant="contained"
          color={severity}
          onClick={onAction}
          fullWidth
          sx={{ borderRadius: 2, fontWeight: 700, mt: 'auto' }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
});

// ===========================================================================
// COMPONENTE PRINCIPAL
// ===========================================================================

const AdminDashboard: React.FC = () => {
  const logic = useAdminDashboard();
  const theme = useTheme();
  const navigate = useNavigate();

  const accionesRapidas = useMemo(() => [
    { label: 'Usuarios', icon: <Person fontSize="small" />, path: '/admin/usuarios' },
    { label: 'Proyectos', icon: <Handyman fontSize="small" />, path: '/admin/proyectos' },
    { label: 'Lotes', icon: <Landscape fontSize="small" />, path: '/admin/lotes' },
    { label: 'Subastas', icon: <Gavel fontSize="small" />, path: '/admin/pujas' },
    { label: 'Contratos', icon: <Assessment fontSize="small" />, path: '/admin/plantillas' },
  ], []);

  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: string | null,
  ) => {
    if (newPeriod !== null) {
      logic.setFiltroPeriodo(newPeriod);
      if (newPeriod !== 'personalizado') {
        logic.setCustomStartDate('');
        logic.setCustomEndDate('');
      }
    }
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>

      {/* 1. ENCABEZADO Y ACCESOS RÁPIDOS */}
      <Box sx={{ mb: 3 }}>
        <AdminPageHeader
          title="Panel de Administración"
          subtitle="Monitoreo de activos y cumplimiento operativo."
          action={
            <Chip icon={<Speed />} label="Sistema activo" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
          }
        />
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {accionesRapidas.map((btn) => (
            <Button
              key={btn.label} variant="outlined" size="small" startIcon={btn.icon}
              onClick={() => logic.navigate(btn.path)}
              sx={{ borderRadius: 50, textTransform: 'none', color: 'text.secondary', borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              {btn.label}
            </Button>
          ))}
        </Stack>
      </Box>

      <QueryHandler isLoading={logic.isLoading} error={null} fullHeight>
        <Stack spacing={4}>

          

          {/* 3. ATENCIÓN REQUERIDA */}
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              <AlertaPrioritaria
                title="KYC pendientes"
                value={logic.stats.pendingKYC}
                description={logic.stats.pendingKYC > 0 ? `Existen ${logic.stats.pendingKYC} solicitudes de identidad esperando revisión manual.` : 'Sin documentos pendientes de validación.'}
                icon={<Security />}
                severity={logic.stats.pendingKYC > 0 ? 'error' : 'success'}
                actionLabel="Ir a Verificaciones"
                onAction={() => logic.navigate('/admin/kyc')}
              />
              <AlertaPrioritaria
                title="Cobros subasta"
                value={logic.stats.cobrosPendientes}
                description={logic.stats.cobrosPendientes > 0 ? "Lotes adjudicados que requieren confirmación de pago por parte del ganador." : "Adjudicados sin pendientes de pago."}
                icon={<ReceiptLong />}
                severity={logic.stats.cobrosPendientes > 0 ? 'warning' : 'success'}
                actionLabel="Ver Adjudicaciones"
                onAction={() => logic.navigate('/admin/pujas')}
              />
              <AlertaPrioritaria
                title="Proyectos listos"
                value={logic.stats.proyectosListosParaIniciar || 0}
                description={
                  logic.stats.proyectosListosParaIniciar > 0
                    ? "Han alcanzado su meta de suscriptores y esperan autorización."
                    : "Sin proyectos pendientes de iniciarse."
                }
                icon={<RocketLaunch />}
                severity={logic.stats.proyectosListosParaIniciar > 0 ? 'info' : 'success'}
                actionLabel="Ir a Proyectos"
                onAction={() => logic.navigate('/admin/proyectos')}
              />
            </Box>
          </Box>
{/* 2. BARRA DE FILTRO (FILA PROPIA) */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
            <Stack spacing={2.5}>

              {/* Toggle Periodo */}
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                  <CalendarMonth fontSize="small" color="action" /> Seleccionar período para métricas y análisis:
                </Typography>
                <ToggleButtonGroup
                  value={logic.filtroPeriodo}
                  exclusive
                  onChange={handlePeriodChange}
                  size="small"
                  color="primary"
                  sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '8px !important', bgcolor: 'background.paper', '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } } } }}
                >
                  <ToggleButton value="este_mes" sx={{ border: '1px solid', borderColor: 'divider' }}>Este mes</ToggleButton>
                  <ToggleButton value="ultimo_trimestre" sx={{ border: '1px solid', borderColor: 'divider' }}>Último trimestre</ToggleButton>
                  <ToggleButton value="este_anio" sx={{ border: '1px solid', borderColor: 'divider' }}>Este año</ToggleButton>
                  <ToggleButton value="historico" sx={{ border: '1px solid', borderColor: 'divider' }}>Histórico</ToggleButton>
                  <ToggleButton value="personalizado" sx={{ border: '1px solid', borderColor: 'divider' }}>Personalizado</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {/* Rango Personalizado */}
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  o rango personalizado
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    type="date"
                    size="small"
                    disabled={logic.filtroPeriodo !== 'personalizado'}
                    value={logic.customStartDate}
                    onChange={(e) => logic.setCustomStartDate(e.target.value)}
                    sx={{
                      width: 145,
                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: logic.filtroPeriodo === 'personalizado' ? 'background.paper' : 'action.hover' },
                      '& input::-webkit-calendar-picker-indicator': {
                        cursor: logic.filtroPeriodo === 'personalizado' ? 'pointer' : 'default',
                        filter: logic.filtroPeriodo === 'personalizado' ? 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)' : 'none'
                      }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">→</Typography>
                  <TextField
                    type="date"
                    size="small"
                    disabled={logic.filtroPeriodo !== 'personalizado'}
                    value={logic.customEndDate}
                    onChange={(e) => logic.setCustomEndDate(e.target.value)}
                    sx={{
                      width: 145,
                      '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: logic.filtroPeriodo === 'personalizado' ? 'background.paper' : 'action.hover' },
                      '& input::-webkit-calendar-picker-indicator': {
                        cursor: logic.filtroPeriodo === 'personalizado' ? 'pointer' : 'default',
                        filter: logic.filtroPeriodo === 'personalizado' ? 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)' : 'none'
                      }
                    }}
                  />
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoOutlined fontSize="inherit" /> El selector de fechas exactas solo se activa al elegir "Personalizado"
              </Typography>

            </Stack>
          </Paper>
          {/* 4. KPIs - DIVIDIDOS EN DOS GRUPOS CON ETIQUETA */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* Grupo 1: Métricas del período */}
            <Box>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                <TrendingUp fontSize="small" /> Métricas del período seleccionado
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                <StatCard title="Capital invertido" value={formatearMoneda(logic.stats.totalInvertido)} icon={<AttachMoney />} color="success" />
                <StatCard title="Recaudo del período" value={formatearMoneda(logic.recaudoMensual?.total_recaudado || 0)} subtitle="Efectivamente pagado" icon={<AccountBalance />} color="primary" />
                <StatCard title="Éxito de proyectos" value={`${toNumber(logic.completionRate?.tasa_culminacion)}%`} subtitle="Tasa de finalización" icon={<AssignmentTurnedIn />} color="info" />
                <StatCard title="Subastas activas" value={logic.stats.subastasActivas} icon={<Gavel />} color="warning" />
              </Box>
            </Box>

            {/* Grupo 2: Adhesiones y cobranza */}
            <Box>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                <Receipt fontSize="small" /> Adhesiones y cobranza
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                <StatCard
                  title="A cobrar"
                  subtitle="Próximos vencimientos"
                  value={`$${Number(logic.stats.adhesionesPendienteCobro).toLocaleString('es-AR')}`}
                  icon={<Schedule />}
                  color="info"
                />
                <StatCard
                  title="Vencidas"
                  subtitle="Deuda atrasada"
                  value={`$${Number(logic.stats.adhesionesVencidas).toLocaleString('es-AR')}`}
                  icon={<Warning />}
                  color="error"
                />
                <StatCard
                  title="Tasa cobranza"
                  subtitle="Efectividad inicial"
                  value={`${logic.stats.adhesionesTasaCobranza}%`}
                  icon={<CheckCircle />}
                  color="success"
                />
                <StatCard title="Tasa de liquidez" value={`${toNumber(logic.stats.tasaLiquidez)}%`} subtitle="Sobre capital comprometido" icon={<Timeline />} color="primary" />
              </Box>
            </Box>

          </Box>

          {/* 5. ANÁLISIS - TABS */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
              <Tabs value={logic.activeTab} onChange={(_, v) => logic.setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<Timeline />} iconPosition="start" label="Progreso" sx={{ textTransform: 'none', minHeight: 64 }} />
                <Tab icon={<QueryStats />} iconPosition="start" label="Riesgo y Eficiencia" sx={{ textTransform: 'none', minHeight: 64 }} />
                <Tab icon={<Star />} iconPosition="start" label="Popularidad" sx={{ textTransform: 'none', minHeight: 64 }} />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* TAB 0: PROGRESO */}
              {logic.activeTab === 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Avance de capital por proyecto</Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={logic.chartDataSuscripciones}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                        <XAxis dataKey="nombre" axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                        <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} />
                        <Bar dataKey="avance" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box>
                    <Typography variant="h6" gutterBottom>Distribución de lotes</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={logic.estadosData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          {logic.estadosData.map((_, i) => <Cell key={i} fill={logic.RECHART_COLORS[i % logic.RECHART_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* TAB 1: RIESGO Y EFICIENCIA */}
              {logic.activeTab === 1 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '2px solid', borderColor: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                    <Stack spacing={2} alignItems="center">
                      <Typography variant="h3" color="warning.dark">
                        {toNumber(logic.morosidad?.tasa_morosidad)}%
                      </Typography>
                      <Typography variant="h6">Tasa de Morosidad</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Representa {formatearMoneda(logic.morosidad?.total_en_riesgo)} en cuotas vencidas actuales.
                      </Typography>
                      <Button
                        variant="outlined" color="warning" size="small"
                        sx={{ mt: 1, borderRadius: 2, fontWeight: 'bold' }}
                        onClick={() => {
                          sessionStorage.setItem('resumenesFilter', 'overdue');
                          navigate('/admin/resumenes');
                        }}
                      >
                        Ver Morosos
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '2px solid', borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                    <Stack spacing={1} alignItems="center">
                      <Typography variant="h3" color="error.dark">
                        {toNumber(logic.cancelacion?.tasa_cancelacion)}%
                      </Typography>
                      <Typography variant="h6">Tasa de Cancelación</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Total de {logic.cancelacion?.total_canceladas ?? 0} suscripciones dadas de baja.
                      </Typography>
                      <Button
                        variant="outlined" color="error" size="small"
                        sx={{ mt: 1, borderRadius: 2, fontWeight: 'bold' }}
                        onClick={() => {
                          sessionStorage.setItem('adminSuscripcionesTab', '2');
                          navigate('/admin/suscripciones');
                        }}
                      >
                        Ver Canceladas
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '2px solid', borderColor: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                    <Stack spacing={1} alignItems="center">
                      <Typography variant="h3" color="success.dark">
                        {toNumber(logic.pagosATiempo?.tasa_pagos_a_tiempo)}%
                      </Typography>
                      <Typography variant="h6">Pagos a Tiempo</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        De {logic.pagosATiempo?.total_pagados || 0} pagos, {logic.pagosATiempo?.pagos_a_tiempo || 0} fueron antes del vencimiento.
                      </Typography>
                      <Button
                        variant="outlined" color="success" size="small"
                        startIcon={<EventAvailable />}
                        sx={{ mt: 1, borderRadius: 2, fontWeight: 'bold' }}
                        onClick={() => navigate('/admin/resumenes')}
                      >
                        Auditar Pagos
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              )}

              {/* TAB 2: POPULARIDAD */}
              {logic.activeTab === 2 && (
                <Stack spacing={4}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Ranking de interés por lote</Typography>
                    <Select size="small" value={logic.selectedPopularidadProject ?? ''} onChange={(e) => logic.setSelectedPopularidadProject(Number(e.target.value))} sx={{ minWidth: 220, borderRadius: 2 }}>
                      {logic.proyectosActivos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
                    </Select>
                  </Stack>
                  <Box sx={{ height: Math.max(400, logic.topLotes.length * 60), transition: 'height 0.3s ease', overflowX: 'hidden' }}>
                    <QueryHandler isLoading={logic.loadingPopularidad} error={null}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={logic.topLotes} layout="vertical" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="nombre_lote" axisLine={false} tick={{ fontSize: 12, fontWeight: 600 }} width={100} interval={0} />
                          <RechartsTooltip cursor={{ fill: alpha(theme.palette.warning.main, 0.05) }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: theme.shadows[3] }} />
                          <Bar dataKey="total_favoritos" name="Favoritos" fill={theme.palette.warning.main} radius={[0, 6, 6, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </QueryHandler>
                  </Box>
                </Stack>
              )}

            </CardContent>
          </Card>
        </Stack>
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
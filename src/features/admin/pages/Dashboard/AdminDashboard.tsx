import {
  AccountBalance, Assessment, AssignmentTurnedIn, AttachMoney, CalendarMonth, CheckCircle,
  EventAvailable, Gavel, Handyman, InfoOutlined, Landscape, Person, QueryStats, Receipt,
  ReceiptLong, RocketLaunch, Schedule, Security, Speed, Star, Timeline, TrendingUp, VisibilityOff, Warning
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, MenuItem, Paper, Select,
  Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useTheme,
  type Theme
} from '@mui/material';
import React, { useMemo } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

const formatForDateInput = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
};

const toNumber = (val: unknown): number => parseFloat(String(val || 0)) || 0;
const formatearMoneda = (val: unknown): string => `$${toNumber(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

interface AlertaPrioritariaProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  severity: 'error' | 'warning' | 'success' | 'info';
  actionLabel: string;
  onAction: () => void;
}

interface CustomDatePickerProps {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}

interface TabProgresoProps {
  chartDataSuscripciones: any[];
  estadosData: any[];
  RECHART_COLORS: string[];
  theme: Theme;
}

interface TabRiesgoEficienciaProps {
  morosidad: any;
  cancelacion: any;
  pagosATiempo: any;
  navigate: NavigateFunction;
  theme: Theme;
}

interface TabPopularidadProps {
  proyectosActivos: any[];
  selectedPopularidadProject: number | null;
  setSelectedPopularidadProject: (val: number) => void;
  loadingPopularidad: boolean;
  topLotes: any[];
  theme: Theme;
  onToggleExcluir: (idLote: number) => void;
  togglingLoteId: number | null;
}

const AlertaPrioritaria = React.memo(({ title, value, description, icon, severity, actionLabel, onAction }: AlertaPrioritariaProps) => {
  const theme = useTheme();
  const colorBase = theme.palette[severity].main;
  const colorContrast = theme.palette[severity].contrastText;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `2px solid ${alpha(colorBase, 0.3)}`,
        bgcolor: alpha(colorBase, 0.05),
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ position: 'absolute', right: -15, top: -15, opacity: 0.08, fontSize: 100, color: colorBase }}>{icon}</Box>
      <Stack spacing={2} sx={{ position: 'relative', flexGrow: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: colorBase, color: colorContrast, width: 48, height: 48, borderRadius: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" color={`${severity}.dark`}>{value}</Typography>
            <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
          </Box>
        </Stack>
        <Typography variant="body2" color="text.primary" sx={{ flexGrow: 1, minHeight: 40 }}>{description}</Typography>
        <Button variant="contained" color={severity} onClick={onAction} fullWidth>
          {actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
});

const CustomDatePicker = ({ disabled, value, onChange, min }: CustomDatePickerProps) => (
  <TextField
    type="date"
    size="small"
    disabled={disabled}
    value={formatForDateInput(value)}
    onChange={(e) => onChange(e.target.value)}
    inputProps={{ min: min ? formatForDateInput(min) : undefined }}
    sx={{
      width: 145,
      '& .MuiOutlinedInput-root': {
        bgcolor: !disabled ? 'background.default' : 'action.hover'
      },
      '& input::-webkit-calendar-picker-indicator': {
        cursor: !disabled ? 'pointer' : 'default',
        filter: !disabled ? 'invert(45%) sepia(50%) saturate(830%) hue-rotate(345deg) brightness(95%) contrast(90%)' : 'none'
      }
    }}
  />
);

const TabProgreso = ({ chartDataSuscripciones, estadosData, RECHART_COLORS, theme }: TabProgresoProps) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
    <Box>
      <Typography variant="h6" gutterBottom>Avance de capital por proyecto</Typography>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartDataSuscripciones}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
          <XAxis dataKey="nombre" axisLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
          <YAxis axisLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickFormatter={(v) => `${v}%`} />
          <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} />
          <Bar dataKey="avance" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
    <Box>
      <Typography variant="h6" gutterBottom>Distribución de lotes</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={estadosData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
            {estadosData.map((_: unknown, i: number) => <Cell key={i} fill={RECHART_COLORS[i % RECHART_COLORS.length]} />)}
          </Pie>
          <RechartsTooltip />
          <Legend wrapperStyle={{ fontSize: '12px', color: theme.palette.text.secondary }} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const TabRiesgoEficiencia = ({ morosidad, cancelacion, pagosATiempo, navigate, theme }: TabRiesgoEficienciaProps) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
    <Paper variant="outlined" sx={{ p: 4, borderColor: 'warning.main', bgcolor: alpha(theme.palette.warning.light, 0.3) }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2" color="warning.dark">{toNumber(morosidad?.tasa_morosidad)}%</Typography>
        <Typography variant="h5">Tasa de Morosidad</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Representa {formatearMoneda(morosidad?.total_en_riesgo)} en cuotas vencidas actuales.
        </Typography>
        <Button variant="outlined" color="warning" size="small" sx={{ mt: 1 }} onClick={() => { sessionStorage.setItem('resumenesFilter', 'overdue'); navigate('/admin/resumenes'); }}>
          Ver Morosos
        </Button>
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 4, borderColor: 'error.main', bgcolor: alpha(theme.palette.error.light, 0.3) }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2" color="error.main">{toNumber(cancelacion?.tasa_cancelacion)}%</Typography>
        <Typography variant="h5">Tasa de Cancelación</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Total de {toNumber(cancelacion?.total_canceladas)} suscripciones dadas de baja.
        </Typography>
        <Button variant="outlined" color="error" size="small" sx={{ mt: 1 }} onClick={() => { sessionStorage.setItem('adminSuscripcionesTab', '2'); navigate('/admin/suscripciones'); }}>
          Ver Canceladas
        </Button>
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 4, borderColor: 'success.main', bgcolor: alpha(theme.palette.success.light, 0.3) }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h2" color="success.main">{toNumber(pagosATiempo?.tasa_pagos_a_tiempo)}%</Typography>
        <Typography variant="h5">Pagos a Tiempo</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          De {toNumber(pagosATiempo?.total_pagados)} pagos, {toNumber(pagosATiempo?.pagos_a_tiempo)} fueron antes del vencimiento.
        </Typography>
        <Button variant="outlined" color="success" size="small" startIcon={<EventAvailable />} sx={{ mt: 1 }} onClick={() => navigate('/admin/resumenes')}>
          Auditar Pagos
        </Button>
      </Stack>
    </Paper>
  </Box>
);

const TabPopularidad = ({
  proyectosActivos,
  selectedPopularidadProject,
  setSelectedPopularidadProject,
  loadingPopularidad,
  topLotes,
  theme,
  onToggleExcluir,
  togglingLoteId,
}: TabPopularidadProps) => (
  <Stack spacing={4}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">Ranking de interés por lote</Typography>
      <Select
        size="small"
        value={selectedPopularidadProject ?? ''}
        onChange={(e) => setSelectedPopularidadProject(Number(e.target.value))}
        sx={{ minWidth: 220, bgcolor: 'background.default' }}
        MenuProps={{ PaperProps: { style: { maxHeight: 250 } } }}
      >
        {proyectosActivos.map((p: any) => (
          <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
        ))}
      </Select>
    </Stack>

    <Box sx={{ height: Math.max(400, topLotes.length * 60), transition: 'height 0.3s ease' }}>
      <QueryHandler isLoading={loadingPopularidad} error={null}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topLotes} layout="vertical" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="nombre_lote" axisLine={false}
              tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }}
              width={100} interval={0} />
            <RechartsTooltip
              cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
            <Bar dataKey="total_favoritos" name="Favoritos"
              fill={theme.palette.primary.light} radius={[0, 6, 6, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </QueryHandler>
    </Box>

    {!loadingPopularidad && topLotes.length > 0 && (
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Gestión de visibilidad en estadísticas
        </Typography>
        {topLotes.map((lote: any) => (
          <Stack
            key={lote.id_lote}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2, py: 1,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.default',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Landscape fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>{lote.nombre_lote}</Typography>
              <Chip
                label={`${lote.total_favoritos} ❤️`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Stack>
            {/* Tooltip de MUI — NO de recharts */}
            <Tooltip title="Ocultar de estadísticas" placement="left">
              <span>
                <IconButton
                  size="small"
                  color="warning"
                  disabled={togglingLoteId === lote.id_lote}
                  onClick={() => onToggleExcluir(lote.id_lote)}
                >
                  {togglingLoteId === lote.id_lote
                    ? <CircularProgress size={18} color="inherit" />
                    : <VisibilityOff fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ))}
      </Stack>
    )}
  </Stack>
);

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const {
    stats, activeTab, setActiveTab, filtroPeriodo, setFiltroPeriodo,
    customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
    recaudoMensual, pagosATiempo, completionRate, morosidad, cancelacion,
    proyectosActivos, selectedPopularidadProject, setSelectedPopularidadProject,
    loadingPopularidad, topLotes, chartDataSuscripciones, estadosData,
    RECHART_COLORS, isLoading, error, togglingLoteId, toggleExcluir,
  } = useAdminDashboard();

  const accionesRapidas = useMemo(() => [
    { label: 'Usuarios', icon: <Person fontSize="small" />, path: '/admin/usuarios' },
    { label: 'Proyectos', icon: <Handyman fontSize="small" />, path: '/admin/proyectos' },
    { label: 'Lotes', icon: <Landscape fontSize="small" />, path: '/admin/lotes' },
    { label: 'Subastas', icon: <Gavel fontSize="small" />, path: '/admin/pujas' },
    { label: 'Contratos', icon: <Assessment fontSize="small" />, path: '/admin/plantillas' },
  ], []);

  const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: string | null) => {
    if (newPeriod !== null) {
      setFiltroPeriodo(newPeriod);
      if (newPeriod !== 'personalizado') {
        setCustomStartDate('');
        setCustomEndDate('');
      }
    }
  };

  const isCustomDate = filtroPeriodo === 'personalizado';

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <AdminPageHeader
          title="Panel de Administración"
          subtitle="Monitoreo de activos y cumplimiento operativo."
          action={<Chip icon={<Speed />} label="Sistema activo" color="success" variant="filled" />}
        />
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
          {accionesRapidas.map((btn) => (
            <Button
              key={btn.label} variant="outlined" size="small" startIcon={btn.icon} onClick={() => navigate(btn.path)}
              sx={{ bgcolor: 'background.default' }}
            >
              {btn.label}
            </Button>
          ))}
        </Stack>
      </Box>

      <QueryHandler isLoading={isLoading} error={error} fullHeight skeletonVariant="card" useSkeleton>
        <Stack spacing={4}>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <AlertaPrioritaria
              title="KYC pendientes"
              value={stats.pendingKYC}
              description={stats.pendingKYC > 0 ? `Existen ${stats.pendingKYC} solicitudes esperando revisión.` : 'Sin documentos pendientes.'}
              icon={<Security />}
              severity={stats.pendingKYC > 0 ? 'error' : 'success'}
              actionLabel="Verificaciones"
              onAction={() => navigate('/admin/kyc')}
            />
            <AlertaPrioritaria
              title="Cobros subasta"
              value={stats.cobrosPendientes}
              description={stats.cobrosPendientes > 0 ? "Adjudicados que requieren confirmación de pago." : "Sin adjudicaciones pendientes."}
              icon={<ReceiptLong />}
              severity={stats.cobrosPendientes > 0 ? 'warning' : 'success'}
              actionLabel="Adjudicaciones"
              onAction={() => navigate('/admin/pujas')}
            />
            <AlertaPrioritaria
              title="Proyectos listos"
              value={stats.proyectosListosParaIniciar}
              description={stats.proyectosListosParaIniciar > 0 ? "Alcanzaron su meta y esperan autorización." : "Sin proyectos pendientes."}
              icon={<RocketLaunch />}
              severity={stats.proyectosListosParaIniciar > 0 ? 'info' : 'success'}
              actionLabel="Ver Proyectos"
              onAction={() => navigate('/admin/proyectos')}
            />
          </Box>

          <Card sx={{ p: 3, bgcolor: 'background.default' }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth fontSize="small" color="primary" /> Seleccionar período:
                </Typography>
                <ToggleButtonGroup
                  value={filtroPeriodo} exclusive onChange={handlePeriodChange} size="small" color="primary"
                  sx={{
                    flexWrap: 'wrap', gap: 1,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px !important',
                      bgcolor: 'background.paper',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }
                    }
                  }}
                >
                  <ToggleButton value="este_mes">Este mes</ToggleButton>
                  <ToggleButton value="ultimo_trimestre">Último trimestre</ToggleButton>
                  <ToggleButton value="este_anio">Este año</ToggleButton>
                  <ToggleButton value="historico">Histórico</ToggleButton>
                  <ToggleButton value="personalizado">Personalizado</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>o rango personalizado</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CustomDatePicker disabled={!isCustomDate} value={customStartDate} onChange={setCustomStartDate} />
                  <Typography variant="body2" color="text.secondary">→</Typography>
                  <CustomDatePicker disabled={!isCustomDate} value={customEndDate} onChange={setCustomEndDate} min={customStartDate} />
                </Stack>
              </Stack>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoOutlined fontSize="inherit" /> Las fechas exactas solo se activan al elegir "Personalizado"
              </Typography>
            </Stack>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                <TrendingUp fontSize="small" /> Métricas del período seleccionado
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                <StatCard title="Capital invertido" value={formatearMoneda(stats.totalInvertido)} icon={<AttachMoney />} color="success" />
                <StatCard title="Recaudo del período" value={formatearMoneda(recaudoMensual?.total_recaudado)} subtitle="Efectivamente pagado" icon={<AccountBalance />} color="primary" />
                <StatCard title="Éxito de proyectos" value={`${toNumber(completionRate?.tasa_culminacion)}%`} subtitle="Tasa de finalización" icon={<AssignmentTurnedIn />} color="info" />
                <StatCard title="Subastas activas" value={stats.subastasActivas} icon={<Gavel />} color="warning" />
              </Box>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                <Receipt fontSize="small" /> Adhesiones y cobranza
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                <StatCard title="A cobrar" subtitle="Próximos vencimientos" value={`$${toNumber(stats.adhesionesPendienteCobro).toLocaleString('es-AR')}`} icon={<Schedule />} color="info" />
                <StatCard title="Vencidas" subtitle="Deuda atrasada" value={`$${toNumber(stats.adhesionesVencidas).toLocaleString('es-AR')}`} icon={<Warning />} color="error" />
                <StatCard title="Tasa cobranza" subtitle="Efectividad inicial" value={`${toNumber(stats.adhesionesTasaCobranza)}%`} icon={<CheckCircle />} color="success" />
                <StatCard title="Tasa de liquidez" value={`${toNumber(stats.tasaLiquidez)}%`} subtitle="Sobre capital comprometido" icon={<Timeline />} color="primary" />
              </Box>
            </Box>
          </Box>

          <Card sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_: React.SyntheticEvent, v: number) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab icon={<Timeline />} iconPosition="start" label="Progreso" sx={{ textTransform: 'none', minHeight: 64, fontWeight: 600 }} />
                <Tab icon={<QueryStats />} iconPosition="start" label="Riesgo y Eficiencia" sx={{ textTransform: 'none', minHeight: 64, fontWeight: 600 }} />
                <Tab icon={<Star />} iconPosition="start" label="Popularidad" sx={{ textTransform: 'none', minHeight: 64, fontWeight: 600 }} />
              </Tabs>
            </Box>
            <CardContent sx={{ p: 4 }}>
              {activeTab === 0 && (
                <TabProgreso chartDataSuscripciones={chartDataSuscripciones} estadosData={estadosData} RECHART_COLORS={RECHART_COLORS} theme={theme} />
              )}
              {activeTab === 1 && (
                <TabRiesgoEficiencia morosidad={morosidad} cancelacion={cancelacion} pagosATiempo={pagosATiempo} navigate={navigate} theme={theme} />
              )}
              {activeTab === 2 && (
                <TabPopularidad
                  proyectosActivos={proyectosActivos}
                  selectedPopularidadProject={selectedPopularidadProject}
                  setSelectedPopularidadProject={setSelectedPopularidadProject}
                  loadingPopularidad={loadingPopularidad}
                  topLotes={topLotes}
                  theme={theme}
                  onToggleExcluir={toggleExcluir}
                  togglingLoteId={togglingLoteId}
                />
              )}
            </CardContent>
          </Card>

        </Stack>
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
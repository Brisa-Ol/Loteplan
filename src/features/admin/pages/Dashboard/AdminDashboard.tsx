import React, { useMemo, useCallback } from 'react';
import {
  AccountBalance, Gavel, AttachMoney, ReceiptLong,
  AssignmentTurnedIn, Person, Handyman, Landscape,
  Assessment, Timeline, Speed, QueryStats, Star, Security
} from '@mui/icons-material';
import {
  alpha, Box, Button, Card, CardContent, Paper,
  Stack, Tab, Tabs, Typography, useTheme, Chip, Avatar, MenuItem, Select
} from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis
} from 'recharts';

// Componentes Compartidos
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';

// Hook de Lógica
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
  severity: 'error' | 'warning' | 'success';
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
        p: 3, border: '2px solid', borderColor: colorBase, borderRadius: 3,
        bgcolor: alpha(colorBase, 0.04), position: 'relative', overflow: 'hidden', height: '100%',
      }}
    >
      <Box sx={{ position: 'absolute', right: -15, top: -15, opacity: 0.08, fontSize: 100, color: colorBase }}>
        {icon}
      </Box>

      <Stack spacing={2} sx={{ position: 'relative' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: colorBase, color: 'white', width: 48, height: 48, borderRadius: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="subtitle2">{title}</Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
          {description}
        </Typography>

        <Button
          variant="contained"
          color={severity}
          onClick={onAction}
          fullWidth
          sx={{ borderRadius: 2 }}
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

  const accionesRapidas = useMemo(() => [
    { label: 'Usuarios',   icon: <Person fontSize="small" />,     path: '/admin/usuarios' },
    { label: 'Proyectos',  icon: <Handyman fontSize="small" />,    path: '/admin/proyectos' },
    { label: 'Lotes',      icon: <Landscape fontSize="small" />,   path: '/admin/lotes' },
    { label: 'Subastas',   icon: <Gavel fontSize="small" />,      path: '/admin/pujas' },
    { label: 'Contratos',  icon: <Assessment fontSize="small" />,  path: '/admin/plantillas' },
  ], []);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>

      {/* 1. CABECERA */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h1">Panel de Administración</Typography>
          <Typography variant="subtitle1" color="text.secondary">Monitoreo de activos y cumplimiento operativo.</Typography>
        </Box>
        <Chip
          icon={<Speed />}
          label="Sincronización en Tiempo Real"
          color="success"
          variant="outlined"
        />
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={null} fullHeight>
        <Stack spacing={4}>

          {/* 2. ACCESOS RÁPIDOS */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {accionesRapidas.map((btn) => (
              <Button
                key={btn.label}
                variant="outlined"
                size="small"
                startIcon={btn.icon}
                onClick={() => logic.navigate(btn.path)}
                sx={{
                  borderRadius: 50, textTransform: 'none',
                  color: 'text.secondary', borderColor: 'divider',
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Stack>

          {/* 3. ALERTAS PRIORITARIAS */}
          <Box>
            <Typography variant="overline" color="error.main" sx={{ mb: 1, display: 'block', ml: 1 }}>
              Atención Requerida
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <AlertaPrioritaria
                title="Identidades por Validar (KYC)"
                value={logic.stats.pendingKYC}
                description={
                  logic.stats.pendingKYC > 0
                    ? `Existen ${logic.stats.pendingKYC} solicitudes de identidad esperando revisión manual.`
                    : 'No hay documentos pendientes de validación.'
                }
                icon={<Security />}
                severity={logic.stats.pendingKYC > 0 ? 'error' : 'success'}
                actionLabel="Ir a Verificaciones"
                onAction={() => logic.navigate('/admin/kyc')}
              />
              <AlertaPrioritaria
                title="Cobros de Subasta Pendientes"
                value={logic.stats.cobrosPendientes}
                description="Lotes adjudicados que requieren confirmación de pago por parte del ganador."
                icon={<ReceiptLong />}
                severity="warning"
                actionLabel="Ver Adjudicaciones"
                onAction={() => logic.navigate('/admin/pujas')}
              />
            </Box>
          </Box>

          {/* 4. KPIs FINANCIEROS */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            <StatCard
              title="Capital Total"
              value={formatearMoneda(logic.stats.totalInvertido)}
              icon={<AttachMoney />}
              color="success"
            />
            <StatCard
              title="Tasa de Cobro"
              value={`${toNumber(logic.stats.tasaLiquidez)}%`}
              subtitle={`${formatearMoneda(logic.stats.totalPagado)} recaudados`}
              icon={<AccountBalance />}
              color="primary"
            />
            <StatCard
              title="Éxito de Proyectos"
              value={`${toNumber(logic.completionRate?.tasa_culminacion)}%`}
              subtitle="Tasa de finalización"
              icon={<AssignmentTurnedIn />}
              color="info"
            />
            <StatCard
              title="Subastas Activas"
              value={logic.stats.subastasActivas}
              icon={<Gavel />}
              color="warning"
            />
          </Box>

          {/* 5. TABS DE ANÁLISIS DETALLADO */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
              <Tabs
                value={logic.activeTab}
                onChange={(_, v) => logic.setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<Timeline />}   iconPosition="start" label="Progreso"    sx={{ textTransform: 'none', minHeight: 64 }} />
                <Tab icon={<QueryStats />} iconPosition="start" label="Riesgo"      sx={{ textTransform: 'none', minHeight: 64 }} />
                <Tab icon={<Star />}       iconPosition="start" label="Popularidad"  sx={{ textTransform: 'none', minHeight: 64 }} />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 4 }}>

              {/* TAB 0: PROGRESO */}
              {logic.activeTab === 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>Avance de Capital por Proyecto</Typography>
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
                    <Typography variant="h5" gutterBottom>Distribución de Lotes</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={logic.estadosData}
                          cx="50%" cy="50%"
                          innerRadius={70} outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {logic.estadosData.map((_, i) => (
                            <Cell key={i} fill={logic.RECHART_COLORS[i % logic.RECHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* TAB 1: RIESGO */}
              {logic.activeTab === 1 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '2px solid', borderColor: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                    <Stack spacing={2}>
                      <Typography variant="h3" color="warning.dark">{toNumber(logic.morosidad?.tasa_morosidad)}%</Typography>
                      <Typography variant="h6">Tasa de Morosidad</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Representa {formatearMoneda(logic.morosidad?.total_en_riesgo)} en cuotas vencidas actuales.
                      </Typography>
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '2px solid', borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                    <Stack spacing={2}>
                      <Typography variant="h3" color="error.dark">{toNumber(logic.cancelacion?.tasa_cancelacion)}%</Typography>
                      <Typography variant="h6">Tasa de Cancelación (Churn)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de {logic.cancelacion?.total_canceladas ?? 0} suscripciones dadas de baja.
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>
              )}

              {/* TAB 2: POPULARIDAD */}
              {logic.activeTab === 2 && (
                <Stack spacing={4}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">
                      Ranking de Interés por Lote (Favoritos)
                    </Typography>

                    <Select
                      size="small"
                      value={logic.selectedPopularidadProject ?? ''}
                      onChange={(e) => logic.setSelectedPopularidadProject(Number(e.target.value))}
                      sx={{ minWidth: 220, borderRadius: 2 }}
                    >
                      {logic.proyectosActivos.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <Box sx={{ height: 400 }}>
                    <QueryHandler isLoading={logic.loadingPopularidad} error={null}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={logic.topLotes} layout="vertical" margin={{ left: 50, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="nombre_lote"
                            axisLine={false}
                            tick={{ fontSize: 12, fontWeight: 600 }}
                            width={100}
                          />
                          <RechartsTooltip
                            cursor={{ fill: alpha(theme.palette.warning.main, 0.05) }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: theme.shadows[3] }}
                          />
                          <Bar
                            dataKey="total_pujas"
                            name="Favoritos"
                            fill={theme.palette.warning.main}
                            radius={[0, 6, 6, 0]}
                            maxBarSize={30}
                          />
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
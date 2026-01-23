import React from 'react';
import {
  AccountBalance as AccountBalanceIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
  FilterAlt as FilterIcon,
  Gavel as GavelIcon,
  Handyman as HandymanIcon,
  Landscape as LandscapeIcon,
  AttachMoney as MoneyIcon,
  PendingActions as PendingActionsIcon,
  Person as PersonIcon,
  ReceiptLong,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  alpha, Box, Button, Card, CardContent, CardHeader,
  CircularProgress, Divider, LinearProgress, MenuItem, Paper, Stack,
  Tab, Tabs, TextField, Typography, Avatar
} from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis,
} from 'recharts';

import { DataTable } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import favoritoService from '../../../../core/api/services/favorito.service';

const AdminDashboard: React.FC = () => {
  const logic = useAdminDashboard(); // Hook

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Panel de Administración" subtitle="Visión general del rendimiento de la plataforma" />

      {/* Accesos Rápidos */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(logic.theme.palette.background.paper, 0.6) }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">Accesos Directos:</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            {[
              { label: 'Usuarios', icon: <PersonIcon />, path: '/admin/usuarios' },
              { label: 'Proyectos', icon: <HandymanIcon />, path: '/admin/proyectos' },
              { label: 'Lotes', icon: <LandscapeIcon />, path: '/admin/lotes' },
              { label: 'Subastas', icon: <GavelIcon />, path: '/admin/pujas' },
              { label: 'Contratos', icon: <AssessmentIcon />, path: '/admin/plantillas' },
            ].map(btn => (
              <Button key={btn.label} variant="outlined" size="small" startIcon={btn.icon} onClick={() => logic.navigate(btn.path)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {btn.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* KPI Cards Principales */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard 
            title="KYC Pendientes" 
            value={logic.stats.pendingKYC} 
            icon={<PendingActionsIcon />} 
            color="error" 
            loading={logic.isLoading}
            onClick={() => logic.navigate('/admin/kyc')} 
        />
        <StatCard 
            title="Total Invertido" 
            value={`$${parseFloat(logic.stats.totalInvertido).toLocaleString()}`} 
            icon={<MoneyIcon />} 
            color="success"
            loading={logic.isLoading}
        />
        <StatCard 
            title="Liquidez Actual" 
            value={`${logic.stats.tasaLiquidez}%`} 
            subtitle={`$${parseFloat(logic.stats.totalPagado).toLocaleString()} pagados`} 
            icon={<AccountBalanceIcon />} 
            color="primary"
            loading={logic.isLoading}
        />
        <StatCard 
            title="Subastas Activas" 
            value={logic.stats.subastasActivas} 
            subtitle={`${logic.stats.cobrosPendientes} por cobrar`} 
            icon={<GavelIcon />} 
            color="warning" 
            loading={logic.isLoading}
            onClick={() => logic.navigate('/admin/pujas')} 
        />
      </Box>

      <QueryHandler isLoading={logic.isLoading} error={null} fullHeight>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={logic.activeTab} onChange={(_, v) => logic.setActiveTab(v)} variant="scrollable" textColor="primary" indicatorColor="primary">
            {['Proyectos', 'Suscripciones', 'Inversiones', 'Popularidad', 'Subastas'].map((label, i) => (
              <Tab key={label} label={label} icon={i === 4 ? <GavelIcon fontSize="small" /> : undefined} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {/* TAB 0: PROYECTOS */}
        {logic.activeTab === 0 && (
          <Stack spacing={3}>
            <StatCard 
                title="Tasa Global de Culminación de Proyectos"
                value={`${logic.completionRate?.tasa_culminacion ?? '0'}%`}
                subtitle={`${logic.stats.totalFinalizados} proyectos completados`}
                icon={<TrendingUpIcon />}
                color="success"
                loading={logic.isLoading}
            />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              <Card elevation={0} sx={{ flex: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardHeader title="Avance de Suscripciones" avatar={<AssessmentIcon color="primary" />} />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={logic.chartDataSuscripciones}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nombre" axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tick={{ fontSize: 12 }} />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <RechartsTooltip formatter={(v: any) => [`${v}%`, 'Avance']} />
                      <Bar dataKey="avance" fill={logic.theme.palette.primary.main} radius={[4, 4, 0, 0]} barSize={40} />
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
                      <Pie data={logic.estadosData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {logic.estadosData.map((_, index) => <Cell key={`cell-${index}`} fill={logic.RECHART_COLORS[index % logic.RECHART_COLORS.length]} />)}
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

        {/* TAB 1: SUSCRIPCIONES */}
        {logic.activeTab === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <StatCard 
                title="Tasa de Morosidad"
                value={`${logic.stats.tasaMorosidad}%`}
                subtitle={`$${parseFloat(logic.morosidad?.total_en_riesgo ?? '0').toLocaleString()} en riesgo`}
                icon={<WarningIcon />}
                color="error"
                loading={logic.isLoading}
            />
            <StatCard 
                title="Tasa de Cancelación"
                value={`${logic.stats.tasaCancelacion}%`}
                subtitle={`${logic.cancelacion?.total_canceladas} suscripciones canceladas`}
                icon={<CancelIcon />}
                color="warning"
                loading={logic.isLoading}
            />
          </Box>
        )}

        {/* TAB 2: INVERSIONES (TOP 5) */}
        {logic.activeTab === 2 && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader 
                title="Top 5 Inversores (Capital Consolidado)" 
                action={<Button endIcon={<ArrowForwardIcon />} size="small" onClick={() => logic.navigate('/admin/inversiones')}>Ver detalle</Button>} 
            />
            <Divider />
            <DataTable
              columns={[
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { id: 'nombre_usuario', label: 'Usuario', render: (row: any) => (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{row.nombre_usuario.charAt(0).toUpperCase()}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{row.nombre_usuario}</Typography>
                  </Stack>
                )},
                { id: 'email', label: 'Email' },
                { id: 'monto_total_invertido', label: 'Monto Total', align: 'right', format: (v) => `$${parseFloat(v as string).toLocaleString()}` },
                { id: 'cantidad_inversiones', label: 'Inversiones', align: 'right' },
              ]}
              data={logic.inversionesPorUsuario.slice(0, 5)}
              getRowKey={row => row.id_usuario}
              pagination={false}
            />
          </Card>
        )}

        {/* TAB 3: POPULARIDAD */}
        {logic.activeTab === 3 && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader 
                title="Lotes Más Populares" 
                avatar={<StarIcon color="warning" />}
                action={
                    <TextField
                        select
                        size="small"
                        value={logic.selectedPopularidadProject}
                        onChange={(e) => logic.setSelectedPopularidadProject(Number(e.target.value))}
                        sx={{ minWidth: 200 }}
                        label="Filtrar por Proyecto"
                        InputProps={{ startAdornment: <FilterIcon fontSize="small" sx={{mr:1, color:'action.active'}}/> }}
                    >
                        {logic.proyectosActivos.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                        ))}
                    </TextField>
                }
            />
            <Divider />
            <CardContent>
              {/* Se podría refactorizar esto a un subcomponente si crece más */}
              {logic.loadingPopularidad ? (
                  <Stack alignItems="center" py={4}><CircularProgress /></Stack>
              ) : logic.popularidadLotes.length > 0 ? (
                  <Stack spacing={2}>
                    {logic.popularidadLotes.slice(0, 5).map((lote, index) => (
                      <Paper key={lote.id_lote} variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, borderColor: index === 0 ? 'primary.main' : 'divider', bgcolor: index === 0 ? alpha(logic.theme.palette.primary.main, 0.04) : 'transparent' }}>
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
              ) : (
                  <Box p={3} textAlign="center">
                      <Typography color="text.secondary">No hay lotes marcados como favoritos en el proyecto seleccionado.</Typography>
                  </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: SUBASTAS */}
        {logic.activeTab === 4 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <StatCard 
                title="Subastas en Curso"
                value={logic.stats.subastasActivas}
                icon={<TrendingUpIcon />}
                color="success"
                loading={logic.isLoading}
                onClick={() => logic.navigate('/admin/pujas')}
                subtitle="Haga click para ir a sala"
            />
            <StatCard 
                title="Adjudicaciones por Cobrar"
                value={logic.stats.cobrosPendientes}
                subtitle="Gestión administrativa requerida"
                icon={<ReceiptLong />}
                color="warning"
                loading={logic.isLoading}
            />
          </Box>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminDashboard;
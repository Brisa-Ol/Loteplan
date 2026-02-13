import {
  AttachMoney, Block, CancelScheduleSend,
  Dashboard as DashboardIcon,
  ErrorOutline,
  Image as ImageIcon,
  ListAlt as ListIcon,
  Person, Timeline,
  TrendingUp, Warning
} from '@mui/icons-material';
import {
  Alert, Avatar, Box, Card, CardContent, Chip,
  Divider, IconButton, LinearProgress, Paper, Stack, Tab, Tabs, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography, alpha, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAdminLotePagos } from '../../hooks/lotes/useAdminLotePagos';


// ... (Los subcomponentes Chart y Card siguen igual, no cambian) ...
const RiskDistributionChart = React.memo<{ data: any[]; theme: any }>(({ data, theme }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
    {/* ... Mismo código del Chart ... */}
    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6">Distribución de Riesgo</Typography>
          <Typography variant="caption" color="text.secondary">Nivel de mora actual</Typography>
        </Box>
        <Chip icon={<TrendingUp />} label="En vivo" size="small" color="success" variant="outlined" />
      </Stack>
      <Box flex={1} minHeight={200}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="name" axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
            <YAxis axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
            <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </CardContent>
  </Card>
));
RiskDistributionChart.displayName = 'RiskDistributionChart';

const RiskLoteCard = React.memo<{ lote: LoteDto; theme: any; diasRestantes: number }>(({ lote, theme, diasRestantes }) => {
  const intentos = lote.intentos_fallidos_pago || 0;
  const isCritical = intentos >= 2;
  // ... Mismo código de RiskLoteCard ...
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: isCritical ? 'error.main' : 'warning.main', borderRadius: 3, bgcolor: alpha(isCritical ? theme.palette.error.main : theme.palette.warning.main, 0.02), transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Avatar src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined} variant="rounded" sx={{ width: 50, height: 50, bgcolor: alpha(theme.palette.primary.main, 0.1) }}><ImageIcon sx={{ color: theme.palette.primary.main }} /></Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>{lote.nombre_lote}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Person sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">Ganador #{lote.id_ganador}</Typography>
            </Stack>
          </Box>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={700} color={isCritical ? 'error.main' : 'warning.main'}>{intentos}/3 INTENTOS FALLIDOS</Typography>
              <Typography variant="caption" color="text.secondary">{Math.round((intentos / 3) * 100)}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={(intentos / 3) * 100} color={isCritical ? 'error' : 'warning'} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.grey[500], 0.1) }} />
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" display="block" color="text.secondary">Deuda</Typography>
              <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace' }}>${Number(lote.precio_base).toLocaleString('es-AR')}</Typography>
            </Box>
            <Chip label={`${diasRestantes} días`} size="small" color={diasRestantes <= 10 ? 'error' : diasRestantes <= 30 ? 'warning' : 'success'} variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});
RiskLoteCard.displayName = 'RiskLoteCard';

const AdminLotePagos: React.FC = () => {
  const logic = useAdminLotePagos();
  const theme = useTheme();

  const [tabIndex, setTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const columnsCobros = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote', label: 'Lote / ID', minWidth: 220, render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={imagenService.resolveImageUrl(l.imagenes?.[0]?.url || '')} variant="rounded" sx={{ width: 40, height: 40 }}><ImageIcon /></Avatar>
          <Box>
            <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'ganador', label: 'Deudor', minWidth: 180, render: (l) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}><Person fontSize="inherit" /></Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{l.id_ganador ? `Usuario #${l.id_ganador}` : '-'}</Typography>
            <Typography variant="caption" color="text.secondary">Adjudicado</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'estado', label: 'Situación', render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        if (intentos >= 3) return <StatusBadge status="failed" customLabel="IMPAGO / SANCIONAR" />;
        if (intentos > 0) return <StatusBadge status="warning" customLabel={`${intentos}/3 INTENTOS`} />;
        return <Chip label="Pendiente Pago" color="info" size="small" variant="outlined" />;
      }
    },
    {
      id: 'monto', label: 'Monto', render: (l) => (
        <Typography fontWeight={700} fontFamily="monospace">${Number(l.monto_ganador_lote || l.precio_base).toLocaleString()}</Typography>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {/* Solo mostramos la acción de Sancionar/Impago que sí soporta el back */}
          <Tooltip title={l.intentos_fallidos_pago >= 3 ? "Sancionar y Liberar Lote" : "Procesar Intento Fallido (+1)"}>
            <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }} onClick={() => logic.handleForceFinish?.(l)} disabled={logic.isMutating}>
              {l.intentos_fallidos_pago >= 3 ? <Block fontSize="small" /> : <CancelScheduleSend fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h1">Monitor de Cobranza</Typography>
          <Typography variant="subtitle1" color="text.secondary">Seguimiento de lotes adjudicados, impagos y gestión de riesgo.</Typography>
        </Box>
      </Stack>

      {/* METRICS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <StatCard title="Lotes en Mora" value={logic.analytics.totalPendientes} icon={<Timeline />} color="warning" loading={logic.isLoading} subtitle="Total incidencias" />
        <StatCard title="Riesgo Crítico" value={logic.analytics.cantidadCritica} icon={<ErrorOutline />} color="error" loading={logic.isLoading} subtitle="Liberación inminente" />
        <StatCard title="Capital Afectado" value={`$${logic.analytics.capitalEnRiesgo.toLocaleString('es-AR', { notation: 'compact' })}`} icon={<AttachMoney />} color="info" loading={logic.isLoading} subtitle="Monto total pendiente" />
      </Box>

      {/* TABS DE NAVEGACIÓN */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} indicatorColor="primary" textColor="primary">
            <Tab icon={<DashboardIcon />} label="Dashboard de Riesgo" iconPosition="start" />
            <Tab icon={<ListIcon />} label="Gestión de Cobros" iconPosition="start" />
          </Tabs>
        </Paper>

        {tabIndex === 0 && (
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small">
            <ToggleButton value="table">Tabla</ToggleButton>
            <ToggleButton value="cards">Tarjetas</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>

        {/* VISTA 1: DASHBOARD (Solo Lotes con Intentos > 0) */}
        {tabIndex === 0 && (
          <Box>
            <Box sx={{ height: 300, mb: 4 }}>
              <RiskDistributionChart data={logic.analytics.chartData} theme={logic.theme} />
            </Box>
            {logic.analytics.cantidadCritica > 0 && (
              <Alert severity="error" variant="outlined" icon={<Warning />} sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                <Typography variant="subtitle2" fontWeight={700}>ATENCIÓN REQUERIDA</Typography>
                {logic.analytics.cantidadCritica} lotes han superado el umbral de seguridad.
              </Alert>
            )}
            {viewMode === 'cards' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
                {logic.lotes.map(lote => (
                  <RiskLoteCard key={lote.id} lote={lote} theme={logic.theme} diasRestantes={logic.calcularDiasRestantes(lote.fecha_fin)} />
                ))}
              </Box>
            ) : (
              <DataTable columns={columnsCobros} data={logic.lotes} getRowKey={row => row.id} showInactiveToggle={false} pagination defaultRowsPerPage={10} />
            )}
          </Box>
        )}

        {/* VISTA 2: GESTIÓN (Todos los adjudicados, incluso los que van al día) */}
        {tabIndex === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Lista completa de lotes adjudicados. Usa el botón "Procesar Intento Fallido" para registrar mora o anular la adjudicación tras 3 fallos.
            </Alert>
            <DataTable
              columns={columnsCobros}
              data={logic.lotesPendientesTotal}
              getRowKey={row => row.id}
              showInactiveToggle={false}
              emptyMessage="No hay gestiones pendientes."
              pagination
              defaultRowsPerPage={10}
            />
          </Box>
        )}
      </QueryHandler>

      <ConfirmDialog
        controller={logic.modales?.confirm}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isMutating}
        {...logic.confirmConfig}
      />
    </PageContainer>
  );
};

export default AdminLotePagos;
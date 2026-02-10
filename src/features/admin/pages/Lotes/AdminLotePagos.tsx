import {
  AttachMoney, CheckCircle, ErrorOutline,
  Image as ImageIcon, Info, Person,
  Timeline, TrendingUp, Warning
} from '@mui/icons-material';
import {
  Alert, Avatar, Box, Card, CardContent, Chip,
  Divider, IconButton, LinearProgress, Paper, Stack, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography, alpha
} from '@mui/material';
import React, { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useAdminLotePagos } from '../../hooks/useAdminLotePagos';

// ============================================================================
// COMPONENTE: GRÁFICO (Memoizado)
// ============================================================================
const RiskDistributionChart = React.memo<{
  data: Array<{ name: string; value: number; color: string }>;
  theme: any;
}>(({ data, theme }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
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
            <RechartsTooltip
              cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </CardContent>
  </Card>
));

RiskDistributionChart.displayName = 'RiskDistributionChart';

// ============================================================================
// COMPONENTE: CARD DE RIESGO (Memoizado)
// ============================================================================
const RiskLoteCard = React.memo<{ lote: LoteDto; theme: any; diasRestantes: number }>(
  ({ lote, theme, diasRestantes }) => {
    const intentos = lote.intentos_fallidos_pago || 0;
    const isCritical = intentos >= 2;

    return (
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: isCritical ? 'error.main' : 'warning.main',
          borderRadius: 3,
          bgcolor: alpha(isCritical ? theme.palette.error.main : theme.palette.warning.main, 0.02),
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} mb={2}>
            <Avatar
              src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
              variant="rounded"
              sx={{ width: 50, height: 50, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <ImageIcon sx={{ color: theme.palette.primary.main }} />
            </Avatar>
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
                <Typography variant="caption" fontWeight={700} color={isCritical ? 'error.main' : 'warning.main'}>
                  {intentos}/3 INTENTOS FALLIDOS
                </Typography>
                <Typography variant="caption" color="text.secondary">{Math.round((intentos / 3) * 100)}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(intentos / 3) * 100}
                color={isCritical ? 'error' : 'warning'}
                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.grey[500], 0.1) }}
              />
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">Deuda</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                  ${Number(lote.precio_base).toLocaleString('es-AR')}
                </Typography>
              </Box>
              <Chip
                label={`${diasRestantes} días`}
                size="small"
                color={diasRestantes <= 10 ? 'error' : diasRestantes <= 30 ? 'warning' : 'success'}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }
);

RiskLoteCard.displayName = 'RiskLoteCard';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminLotePagos: React.FC = () => {
  const logic = useAdminLotePagos();

  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote',
      label: 'Lote',
      minWidth: 200,
      render: (l) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined}
            sx={{ width: 36, height: 36, bgcolor: alpha(logic.theme.palette.primary.main, 0.1) }}
          >
            <ImageIcon sx={{ fontSize: 20, color: logic.theme.palette.primary.main }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{l.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'ganador',
      label: 'Deudor',
      render: (l) => (
        <Chip
          avatar={<Avatar sx={{ bgcolor: 'transparent' }}><Person sx={{ color: 'text.secondary' }} /></Avatar>}
          label={`Usuario #${l.id_ganador}`}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      id: 'riesgo',
      label: 'Nivel de Riesgo',
      minWidth: 150,
      render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        return (
          <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={700} color={intentos >= 2 ? 'error.main' : 'warning.main'}>
                {intentos === 1 ? 'BAJO' : intentos === 2 ? 'ALTO' : 'CRÍTICO'}
              </Typography>
              <Typography variant="caption">{intentos}/3</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(intentos / 3) * 100}
              color={intentos >= 2 ? 'error' : 'warning'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        );
      }
    },
    {
      id: 'monto',
      label: 'Capital',
      align: 'right',
      render: (l) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
          ${Number(l.precio_base).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Estado',
      align: 'center',
      render: (l) => (
        <Tooltip title={l.intentos_fallidos_pago >= 2 ? 'Acción requerida' : 'Monitoreando'}>
          <IconButton size="small" color={l.intentos_fallidos_pago >= 2 ? 'error' : 'default'}>
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [logic.theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* HEADER */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h1">Monitor de Cobranza</Typography>
          <Typography variant="subtitle1" color="text.secondary">Seguimiento de lotes adjudicados con pagos pendientes</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
        </Stack>
      </Stack>

      {/* METRICS & CHART */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3, mb: 4 }}>
        {/* KPIs Verticales */}
        <Stack spacing={2}>
          <StatCard
            title="Lotes en Mora"
            value={logic.analytics.totalPendientes}
            icon={<Timeline />}
            color="warning"
            loading={logic.isLoading}
            subtitle="Total incidencias"
          />
          <StatCard
            title="Riesgo Crítico"
            value={logic.analytics.cantidadCritica}
            icon={<ErrorOutline />}
            color="error"
            loading={logic.isLoading}
            subtitle="Liberación inminente"
          />
          <StatCard
            title="Capital Afectado"
            value={`$${logic.analytics.capitalEnRiesgo.toLocaleString('es-AR', { notation: 'compact' })}`}
            icon={<AttachMoney />}
            color="info"
            loading={logic.isLoading}
            subtitle="Monto total pendiente"
          />
        </Stack>

        {/* Chart */}
        <RiskDistributionChart data={logic.analytics.chartData} theme={logic.theme} />
      </Box>

      {/* ALERTA */}
      {logic.analytics.cantidadCritica > 0 && (
        <Alert severity="error" variant="outlined" icon={<Warning />} sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
          <Typography variant="subtitle2" fontWeight={700}>ATENCIÓN REQUERIDA</Typography>
          {logic.analytics.cantidadCritica} lotes han superado el umbral de seguridad y requieren revisión manual o reasignación.
        </Alert>
      )}

      {/* TOGGLE VISTA */}
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <ToggleButtonGroup
          value={logic.viewMode}
          exclusive
          onChange={(_, val) => val && logic.setViewMode(val)}
          size="small"
        >
          <ToggleButton value="table">Tabla</ToggleButton>
          <ToggleButton value="cards">Tarjetas</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* LISTA / CARDS */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {logic.viewMode === 'cards' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
            {logic.lotes.map(lote => (
              <RiskLoteCard
                key={lote.id}
                lote={lote}
                theme={logic.theme}
                diasRestantes={logic.calcularDiasRestantes(lote.fecha_fin)}
              />
            ))}
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={logic.lotes}
            getRowKey={row => row.id}
            isRowActive={() => true} // En este dashboard todos son relevantes
            showInactiveToggle={false} // Desactivamos filtro interno
            emptyMessage="No hay incidencias de pago registradas."
            pagination
            defaultRowsPerPage={5}
          />
        )}
      </QueryHandler>

      {/* FOOTER INFO */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: alpha(logic.theme.palette.info.main, 0.05), border: '1px dashed', borderColor: 'info.main' }}>
        <Stack direction="row" spacing={2}>
          <CheckCircle color="info" />
          <Box>
            <Typography variant="subtitle2">Protocolo de Reasignación</Typography>
            <Typography variant="caption" color="text.secondary">
              Al 3er fallo de pago, el sistema habilitará automáticamente la opción de "Reasignar" en el panel de inventario principal.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

export default AdminLotePagos;
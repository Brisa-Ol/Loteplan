// src/features/admin/pages/Cobranzas/AdminLotePagos.tsx

import {
  AttachMoney, Block, CancelScheduleSend,
  Dashboard as DashboardIcon,
  ErrorOutline,
  Image as ImageIcon,
  ListAlt as ListIcon,
  MailOutline,
  Person, Timeline,
  TrendingUp
} from '@mui/icons-material';
import {
  Avatar, Box, Card, CardContent, Chip,
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

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader'; // ✅ Componente Header estandarizado
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard';

import { PageContainer } from '@/shared/components/layout/PageContainer';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/lote.dto';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog';
import { useAdminLotePagos } from '../../hooks/lotes/useAdminLotePagos';

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

const RiskDistributionChart = React.memo<{ data: any[]; theme: any }>(({ data, theme }) => {
  const orangePalette = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  return (
    <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>Distribución de Riesgo</Typography>
            <Typography variant="caption" color="text.secondary">Nivel de mora actual</Typography>
          </Box>
          <Chip icon={<TrendingUp />} label="En vivo" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
        <Box flex={1} minHeight={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.palette.secondary.dark}
                strokeOpacity={0.8}
              />
              <XAxis dataKey="name" axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} />
              <YAxis axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
              <RechartsTooltip
                cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={orangePalette[index % orangePalette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

RiskDistributionChart.displayName = 'RiskDistributionChart';

const RiskLoteCard = React.memo<{ lote: LoteDto; theme: any; diasRestantes: number }>(({ lote, theme, diasRestantes }) => {
  const intentos = lote.intentos_fallidos_pago || 0;
  const isCritical = intentos >= 2;

  const g = lote.ganador;
  const displayName = g?.nombre_usuario ? `@${g.nombre_usuario}` : g ? `${g.nombre} ${g.apellido}` : `ID #${lote.id_ganador}`;

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: '6px solid',
        borderLeftColor: isCritical ? 'error.main' : 'warning.main',
        bgcolor: 'background.default',
        '&:hover': { transform: 'translateY(-4px)' }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Avatar
            src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
          >
            <ImageIcon sx={{ color: theme.palette.primary.main }} />
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>{lote.nombre_lote}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Person sx={{ fontSize: 14, color: theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
                {displayName}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={800} color={isCritical ? 'error.main' : 'warning.main'}>{intentos}/3 FALLOS</Typography>
              <Typography variant="caption" color="text.secondary">{Math.round((intentos / 3) * 100)}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={(intentos / 3) * 100} color={isCritical ? 'error' : 'warning'} sx={{ height: 6, borderRadius: 10 }} />
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={800} color="primary.main">
              ${Number(lote.precio_base).toLocaleString('es-AR')}
            </Typography>
            <Chip
              label={`${diasRestantes} días`}
              size="small"
              sx={{ bgcolor: diasRestantes <= 10 ? 'error.light' : 'success.light', color: diasRestantes <= 10 ? 'error.main' : 'success.main', fontWeight: 800 }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

RiskLoteCard.displayName = 'RiskLoteCard';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AdminLotePagos: React.FC = () => {
  const logic = useAdminLotePagos();
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const columnsCobros = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote', label: 'Referencia', minWidth: 200, render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined} variant="rounded" sx={{ width: 36, height: 36, border: `1px solid ${theme.palette.divider}` }}>
            <ImageIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{l.nombre_lote}</Typography>
            <Typography variant="caption" color="text.disabled">ID: {l.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'ganador', label: 'Deudor adjudicado', minWidth: 260, render: (l) => {
        const g = l.ganador;
        const alias = g?.nombre_usuario ? `@${g.nombre_usuario}` : g ? `${g.nombre} ${g.apellido}` : `ID #${l.id_ganador}`;

        return (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={800} color="text.primary">
              {alias}
            </Typography>
            <Stack spacing={0.2}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                <Person sx={{ fontSize: 12 }} /> {g ? `${g.nombre} ${g.apellido}` : 'Adjudicado'}
              </Typography>
              {g?.email && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MailOutline sx={{ fontSize: 12, mr: 0.5 }} /> {g.email}
                </Typography>
              )}
            </Stack>
          </Stack>
        );
      }
    },
    {
      id: 'plazo', label: 'Vencimiento', render: (l) => {
        if (!l.fecha_fin) return '-';
        const fechaLimite = new Date(new Date(l.fecha_fin).getTime() + (90 * 24 * 60 * 60 * 1000));
        const hoy = new Date();
        const dias = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Box>
            <Typography variant="body2" fontWeight={700}>{fechaLimite.toLocaleDateString('es-AR')}</Typography>
            <Typography variant="caption" color={dias < 10 ? 'error.main' : 'success.main'} sx={{ fontWeight: 800 }}>
              {dias > 0 ? `${dias} días` : 'VENCIDO'}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'estado', label: 'Situación', render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        if (intentos >= 3) return <StatusBadge status="failed" customLabel="SANCIONABLE" />;
        if (intentos > 0) return <StatusBadge status="warning" customLabel={`${intentos}/3 FALLOS`} />;

        return (
          <Chip label="Al día" size="small" sx={{ bgcolor: 'success.light', color: 'success.main', fontWeight: 800, borderRadius: 1 }} />
        );
      }
    },
    {
      id: 'monto', label: 'Monto Final', align: 'right', render: (l) => (
        <Box textAlign="right">
          <Typography variant="body2" fontWeight={900} sx={{ fontFamily: 'monospace', color: 'primary.dark' }}>
            ${Number(l.monto_ganador_lote || l.precio_base).toLocaleString('es-AR')}
          </Typography>
        </Box>
      )
    },
    {
      id: 'acciones', label: '', align: 'right', render: (l) => (
        <Tooltip title={l.intentos_fallidos_pago >= 3 ? "Liberar Lote" : "Añadir Fallo"}>
          <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }} onClick={() => logic.handleForceFinish?.(l)}>
            {l.intentos_fallidos_pago >= 3 ? <Block fontSize="small" /> : <CancelScheduleSend fontSize="small" />}
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
      {/* 1. HEADER ESTANDARIZADO */}
      <AdminPageHeader
        title="Pagos y seguimiento de subastas"
        subtitle="Seguimiento de adjudicaciones, riesgo de cartera y plazos de pago."
      />

      {/* 2. KPIS Y RIESGO */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 5 }}>
        <StatCard title="Lotes en Mora" value={logic.analytics.totalPendientes} icon={<Timeline />} color="warning" loading={logic.isLoading} />
        <StatCard title="Riesgo Crítico" value={logic.analytics.cantidadCritica} icon={<ErrorOutline />} color="error" loading={logic.isLoading} />
        <StatCard title="Capital en Riesgo" value={`$${logic.analytics.capitalEnRiesgo.toLocaleString('es-AR', { notation: 'compact' })}`} icon={<AttachMoney />} color="info" loading={logic.isLoading} />
      </Box>

      {/* 3. TABS Y CONTROLES */}
      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Paper elevation={0} sx={{ p: 0.5, bgcolor: 'secondary.main', borderRadius: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Dashboard" icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Cobros" icon={<ListIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Paper>
        {tabIndex === 0 && (
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small">
            <ToggleButton value="table" sx={{ fontWeight: 700 }}>TABLA</ToggleButton>
            <ToggleButton value="cards" sx={{ fontWeight: 700 }}>CARDS</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      {/* 4. CONTENIDO CONDICIONAL */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {tabIndex === 0 ? (
          <Box>
            <Box sx={{ height: 320, mb: 5 }}>
              <RiskDistributionChart data={logic.analytics.chartData} theme={theme} />
            </Box>
            {viewMode === 'cards' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
                {logic.lotes.map(lote => (
                  <RiskLoteCard key={lote.id} lote={lote} theme={theme} diasRestantes={logic.calcularDiasRestantes(lote.fecha_fin)} />
                ))}
              </Box>
            ) : (
              <DataTable columns={columnsCobros} data={logic.lotes} getRowKey={row => row.id} showInactiveToggle={false} pagination />
            )}
          </Box>
        ) : (
          <DataTable columns={columnsCobros} data={logic.lotesPendientesTotal} getRowKey={row => row.id} showInactiveToggle={false} pagination />
        )}
      </QueryHandler>

      {/* 5. MODALES */}
      <ConfirmDialog controller={logic.modales.confirm} onConfirm={logic.handleConfirmAction} isLoading={logic.isMutating} />
    </PageContainer>
  );
};

export default AdminLotePagos;
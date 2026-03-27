// src/features/admin/pages/Cobranzas/AdminLotePagos.tsx

import {
  AttachMoney, Block, CancelScheduleSend, CheckCircle,
  Dashboard as DashboardIcon,
  ErrorOutline,
  History as HistoryIcon,
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

import imagenService from '@/core/api/services/imagen.service';
import { env } from '@/core/config/env';
import type { LoteDto } from '@/core/types/lote.dto';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useAdminLotePagos } from '../../hooks/lotes/useAdminLotePagos';

// ============================================================================
// HELPERS DE SINCRONIZACIÓN
// ============================================================================
// Un lote se considera pagado si su puja más alta tiene el estado 'ganadora_pagada'
const checkIsPaid = (lote: LoteDto) => lote.pujaMasAlta?.estado_puja === 'ganadora_pagada';

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
      id: 'lote',
      label: 'Referencia',
      minWidth: 200,
      render: (l) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 36, height: 36, border: `1px solid ${theme.palette.divider}` }}
          >
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
      id: 'ganador',
      label: 'Deudor adjudicado',
      minWidth: 260,
      render: (l) => {
        const g = l.ganador;
        const alias = g?.nombre_usuario ? `@${g.nombre_usuario}` : g ? `${g.nombre} ${g.apellido}` : `ID #${l.id_ganador}`;

        return (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={800} color="text.primary">{alias}</Typography>
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
      id: 'plazo',
      label: 'Vencimiento',
      render: (l) => {
        // 🆕 SINCRONIZACIÓN: Si ya pagó, mostramos etiqueta de éxito
        if (checkIsPaid(l)) return <Typography variant="caption" fontWeight={900} color="success.main">PAGO RECIBIDO</Typography>;

        if (!l.fecha_fin) return '-';
        const fechaLimite = new Date(new Date(l.fecha_fin).getTime() + (90 * 24 * 60 * 60 * 1000));
        const hoy = new Date();
        const dias = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Box>
            <Typography variant="body2" fontWeight={700}>{fechaLimite.toLocaleDateString(env.defaultLocale)}</Typography>
            <Typography variant="caption" color={dias < 10 ? 'error.main' : 'success.main'} sx={{ fontWeight: 800 }}>
              {dias > 0 ? `${dias} días` : 'VENCIDO'}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'estado',
      label: 'Situación',
      render: (l) => {
        // 🆕 SINCRONIZACIÓN: Reflejamos el pago del cliente
        if (checkIsPaid(l)) return <StatusBadge status="completed" customLabel="PAGADO" />;

        const intentos = l.intentos_fallidos_pago || 0;
        if (intentos >= 3) return <StatusBadge status="failed" customLabel="SANCIONABLE" />;
        if (intentos > 0) return <StatusBadge status="warning" customLabel={`${intentos}/3 FALLOS`} />;
        return (
          <Chip
            label="Pendiente"
            size="small"
            sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 800, borderRadius: 1 }}
          />
        );
      }
    },
    {
      id: 'monto',
      label: 'Monto Final',
      align: 'right',
      render: (l) => (
        <Box textAlign="right">
          <Typography variant="body2" fontWeight={900} sx={{ fontFamily: 'monospace', color: checkIsPaid(l) ? 'success.main' : 'primary.dark' }}>
            ${Number(l.monto_ganador_lote || l.precio_base).toLocaleString(env.defaultLocale)}
          </Typography>
        </Box>
      )
    },
    {
      id: 'acciones',
      label: '',
      align: 'right',
      render: (l) => {
        const isPaid = checkIsPaid(l);
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {/* 🆕 Si ya pagó, mostramos icono de Check o Historial, sino las sanciones */}
            {isPaid ? (
              <Tooltip title="Ver detalles de pago">
                <IconButton size="small" sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={l.intentos_fallidos_pago >= 3 ? 'Liberar Lote' : 'Añadir Fallo'}>
                <IconButton
                  size="small"
                  sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}
                  onClick={() => logic.handleForceFinish?.(l)}
                >
                  {l.intentos_fallidos_pago >= 3 ? <Block fontSize="small" /> : <CancelScheduleSend fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
      <AdminPageHeader
        title="Pagos y seguimiento de subastas"
        subtitle="Seguimiento de adjudicaciones, riesgo de cartera y plazos de pago."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 5 }}>
        <StatCard title="Lotes en Mora" value={logic.analytics.totalPendientes} icon={<Timeline />} color="warning" loading={logic.isLoading} />
        <StatCard title="Riesgo Crítico" value={logic.analytics.cantidadCritica} icon={<ErrorOutline />} color="error" loading={logic.isLoading} />
        <StatCard
          title="Capital en Riesgo"
          value={`$${logic.analytics.capitalEnRiesgo.toLocaleString(env.defaultLocale, { notation: 'compact' })}`}
          icon={<AttachMoney />}
          color="info"
          loading={logic.isLoading}
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Paper elevation={0} sx={{ p: 0.5, bgcolor: 'secondary.main', borderRadius: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Dashboard" icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Cobros y Seguimiento" icon={<ListIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Paper>
        {tabIndex === 0 && (
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small">
            <ToggleButton value="table" sx={{ fontWeight: 700 }}>TABLA</ToggleButton>
            <ToggleButton value="cards" sx={{ fontWeight: 700 }}>CARDS</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        {tabIndex === 0 ? (
          <Box>
            <Box sx={{ height: 320, mb: 5 }}>
              <RiskDistributionChart data={logic.analytics.chartData} theme={theme} />
            </Box>
            {viewMode === 'cards' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
                {logic.lotes.map(lote => (
                  <RiskLoteCard
                    key={lote.id}
                    lote={lote}
                    theme={theme}
                    diasRestantes={logic.calcularDiasRestantes(lote.fecha_fin)}
                  />
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

      <ConfirmDialog controller={logic.modales.confirm} onConfirm={logic.handleConfirmAction} isLoading={logic.isMutating} />
    </PageContainer>
  );
};

// ============================================================================
// CARDS SINCRONIZADAS
// ============================================================================

const RiskLoteCard = React.memo<{ lote: LoteDto; theme: any; diasRestantes: number }>(({ lote, theme, diasRestantes }) => {
  const intentos = lote.intentos_fallidos_pago || 0;
  const isPaid = checkIsPaid(lote);
  const isCritical = intentos >= 2;

  const g = lote.ganador;
  const displayName = g?.nombre_usuario ? `@${g.nombre_usuario}` : g ? `${g.nombre} ${g.apellido}` : `ID #${lote.id_ganador}`;

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: '6px solid',
        borderLeftColor: isPaid ? 'success.main' : (isCritical ? 'error.main' : 'warning.main'),
        bgcolor: 'background.default',
        transition: '0.3s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Avatar
            src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 48, height: 48, bgcolor: isPaid ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.primary.main, 0.08) }}
          >
            {isPaid ? <CheckCircle sx={{ color: theme.palette.success.main }} /> : <ImageIcon sx={{ color: theme.palette.primary.main }} />}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>{lote.nombre_lote}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Person sx={{ fontSize: 14, color: isPaid ? 'success.main' : theme.palette.primary.main }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
                {displayName}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

        <Stack spacing={2}>
          {isPaid ? (
            <Box sx={{ py: 1 }}>
              <Chip
                icon={<CheckCircle />}
                label="COBRO CONFIRMADO"
                color="success"
                sx={{ fontWeight: 900, width: '100%', borderRadius: 2 }}
              />
            </Box>
          ) : (
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" fontWeight={800} color={isCritical ? 'error.main' : 'warning.main'}>
                  {intentos}/3 FALLOS
                </Typography>
                <Typography variant="caption" color="text.secondary">{Math.round((intentos / 3) * 100)}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(intentos / 3) * 100}
                color={isCritical ? 'error' : 'warning'}
                sx={{ height: 6, borderRadius: 10 }}
              />
            </Box>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={900} color={isPaid ? "success.main" : "primary.main"}>
              ${Number(lote.monto_ganador_lote || lote.precio_base).toLocaleString(env.defaultLocale)}
            </Typography>
            {!isPaid && (
              <Chip
                label={`${diasRestantes} días`}
                size="small"
                sx={{
                  bgcolor: diasRestantes <= 10 ? 'error.light' : 'success.light',
                  color: diasRestantes <= 10 ? 'error.main' : 'success.main',
                  fontWeight: 800,
                }}
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

const RiskDistributionChart = React.memo<{ data: any[]; theme: any }>(({ data, theme }) => {
  const orangePalette = [theme.palette.primary.light, theme.palette.primary.main, theme.palette.primary.dark];
  return (
    <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" color="text.primary" fontWeight={700}>Distribución de Riesgo</Typography>
            <Typography variant="caption" color="text.secondary">Nivel de mora actual</Typography>
          </Box>
          <Chip icon={<TrendingUp />} label="Actualizado" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
        <Box flex={1} minHeight={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.secondary.dark} strokeOpacity={0.8} />
              <XAxis dataKey="name" axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary, fontWeight: 600 }} />
              <YAxis axisLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
              <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                {data.map((entry, index) => (
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

export default AdminLotePagos;
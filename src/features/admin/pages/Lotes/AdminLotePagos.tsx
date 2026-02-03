import {
  AttachMoney, CheckCircle, ErrorOutline, Info,
  Image as ImageIcon, Person, Timeline, Warning, Refresh,
  FileDownload, TrendingUp
} from '@mui/icons-material';
import {
  Alert, alpha, Avatar, Box, Button, Chip, IconButton,
  LinearProgress, Paper, Stack, Tooltip, Typography, useTheme,
  ToggleButtonGroup, ToggleButton, Card, CardContent, Divider
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';

import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';

import type { LoteDto } from '@/core/types/dto/lote.dto';
import LoteService from '@/core/api/services/lote.service';
import imagenService from '@/core/api/services/imagen.service';
import { useSortedData } from '../../hooks/useSortedData';

// ============================================================================
// HELPER: Cálculo de días restantes
// ============================================================================
const calcularDiasRestantes = (lote: LoteDto): number => {
  if (!lote.fecha_fin) return 90;
  const fechaFin = new Date(lote.fecha_fin);
  const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
  const ahora = new Date();
  const diff = fechaLimite.getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ============================================================================
// COMPONENTE: GRÁFICO DE DISTRIBUCIÓN DE RIESGOS
// ============================================================================
const RiskDistributionChart: React.FC<{
  data: Array<{ name: string; value: number; color: string }>;
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LinearProgress sx={{ width: '80%' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5">
              Distribución de Riesgo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Clasificación por nivel de mora
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp />}
            label="Actualizado"
            size="small"
            color="info"
          />
        </Stack>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            />
            <YAxis
              axisLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            />
            <RechartsTooltip
              contentStyle={{
                borderRadius: 8,
                border: 'none',
                boxShadow: theme.shadows[4],
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE: CARD DE LOTE EN RIESGO (Vista alternativa)
// ============================================================================
const RiskLoteCard: React.FC<{
  lote: LoteDto;
}> = ({ lote }) => {
  const theme = useTheme();
  const intentos = lote.intentos_fallidos_pago || 0;
  const dias = calcularDiasRestantes(lote);
  const isCritical = intentos >= 2;

  return (
    <Card
      elevation={0}
      sx={{
        border: '2px solid',
        borderColor: isCritical ? 'error.main' : 'warning.main',
        borderRadius: 3,
        bgcolor: alpha(isCritical ? theme.palette.error.main : theme.palette.warning.main, 0.04),
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[6],
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
          <Avatar
            src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          >
            <ImageIcon sx={{ color: theme.palette.primary.main }} />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h5" noWrap>
              {lote.nombre_lote}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Person sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                Usuario #{lote.id_ganador}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color={isCritical ? 'error.main' : 'warning.main'}>
                {intentos} DE 3 INTENTOS FALLIDOS
              </Typography>
              <Typography variant="caption">
                {((intentos / 3) * 100).toFixed(0)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(intentos / 3) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.grey[300], 0.3),
                '& .MuiLinearProgress-bar': {
                  bgcolor: isCritical ? theme.palette.error.main : theme.palette.warning.main,
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Capital en Riesgo
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                ${Number(lote.precio_base).toLocaleString('es-AR')}
              </Typography>
            </Box>

            <Chip
              label={`${dias} DÍAS`}
              size="small"
              color={dias <= 10 ? 'error' : dias <= 30 ? 'warning' : 'success'}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminLotePagos: React.FC = () => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: lotesRaw = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 15000,
  });

  const { sortedData: lotes, highlightedId } = useSortedData(lotesRaw);

  const analytics = useMemo(() => {
    const finalizados = lotes.filter((l) => l.estado_subasta === 'finalizada' && l.id_ganador);
    const pendientesPago = finalizados.filter((l) => (l.intentos_fallidos_pago || 0) > 0);
    const riesgoCritico = pendientesPago.filter((l) => (l.intentos_fallidos_pago || 0) >= 2);
    const capitalEnRiesgo = riesgoCritico.reduce((acc, l) => acc + Number(l.precio_base), 0);

    const detallesOrdenados = [...pendientesPago].sort(
      (a, b) => (b.intentos_fallidos_pago || 0) - (a.intentos_fallidos_pago || 0)
    );

    const chartData = [
      { name: 'Bajo (1 int.)', value: pendientesPago.filter(l => l.intentos_fallidos_pago === 1).length, color: theme.palette.warning.light },
      { name: 'Alto (2 int.)', value: pendientesPago.filter(l => l.intentos_fallidos_pago === 2).length, color: theme.palette.error.main },
      { name: 'Crítico (3 int.)', value: pendientesPago.filter(l => l.intentos_fallidos_pago >= 3).length, color: theme.palette.error.dark },
    ];

    return {
      totalFinalizados: finalizados.length,
      pendientesPago: pendientesPago.length,
      riesgoCritico: riesgoCritico.length,
      capitalEnRiesgo,
      detalles: detallesOrdenados,
      chartData,
    };
  }, [lotes, theme]);

  const columns: DataTableColumn<LoteDto>[] = useMemo(
    () => [
      {
        id: 'lote',
        label: 'Lote / ID',
        minWidth: 220,
        render: (lote) => (
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
              variant="rounded"
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
              }}
            >
              <ImageIcon sx={{ color: theme.palette.primary.main }} />
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" noWrap>
                {lote.nombre_lote}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {lote.id}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'ganador',
        label: 'Ganador',
        render: (lote) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                color: theme.palette.primary.main,
              }}
            >
              <Person sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="body2">
              Usuario #{lote.id_ganador}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'monto',
        label: 'Capital',
        render: (lote) => (
          <Typography variant="body2" color="primary.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(lote.precio_base).toLocaleString('es-AR')}
          </Typography>
        ),
      },
      {
        id: 'intentos',
        label: 'Salud del Pago',
        minWidth: 160,
        render: (lote) => {
          const intentos = lote.intentos_fallidos_pago || 0;
          const isCritical = intentos >= 2;
          return (
            <Stack spacing={0.8} width="100%" sx={{ pr: 2 }}>
              <Typography variant="caption" color={isCritical ? 'error.main' : 'warning.main'}>
                {intentos} DE 3 INTENTOS FALLIDOS
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(intentos / 3) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.grey[300], 0.3),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isCritical ? theme.palette.error.main : theme.palette.warning.main,
                  },
                }}
              />
            </Stack>
          );
        },
      },
      {
        id: 'dias',
        label: 'Vencimiento',
        render: (lote) => {
          const dias = calcularDiasRestantes(lote);
          return (
            <Chip
              label={`${dias} DÍAS RESTANTES`}
              size="small"
              color={dias <= 10 ? 'error' : dias <= 30 ? 'warning' : 'success'}
              sx={{ fontSize: '0.6rem' }}
            />
          );
        },
      },
      {
        id: 'acciones',
        label: 'Estado',
        align: 'right',
        render: (lote) => (
          <Tooltip
            title={
              lote.intentos_fallidos_pago >= 2
                ? 'Riesgo de liberación inmediata'
                : 'En seguimiento'
            }
          >
            <IconButton
              size="small"
              sx={{ color: (lote.intentos_fallidos_pago || 0) >= 2 ? 'error.main' : 'info.main' }}
            >
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [theme]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* CABECERA */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        spacing={2}
      >
        <Box>
          <Typography variant="h1">
            Gestión de Cobranza
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitoreo de capital en mora y procesos de reasignación
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Actualizar datos">
            <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.action.selected, 0.5) }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<FileDownload />} size="small">
            Exportar
          </Button>
        </Stack>
      </Stack>

      {/* KPIs */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 4,
        }}
      >
        <StatCard
          title="Total Finalizados"
          value={analytics.totalFinalizados}
          icon={<CheckCircle />}
          color="info"
          subtitle="Subastas cerradas"
          loading={isLoading}
        />
        <StatCard
          title="Pagos en Proceso"
          value={analytics.pendientesPago}
          icon={<Timeline />}
          color="warning"
          subtitle="Con intentos fallidos"
          loading={isLoading}
        />
        <StatCard
          title="Riesgo Crítico"
          value={analytics.riesgoCritico}
          icon={<ErrorOutline />}
          color="error"
          subtitle="Al borde de liberación"
          loading={isLoading}
        />
        <StatCard
          title="Capital en Riesgo"
          value={`$${analytics.capitalEnRiesgo.toLocaleString('es-AR')}`}
          icon={<AttachMoney />}
          color="error"
          subtitle="Falta de pago"
          loading={isLoading}
        />
      </Box>

      {/* ALERTA CRÍTICA */}
      {analytics.riesgoCritico > 0 && (
        <Alert
          severity="error"
          variant="outlined"
          icon={<Warning />}
          sx={{
            mb: 3,
            borderRadius: 2,
            borderLeft: '5px solid',
            borderLeftColor: 'error.main',
          }}
        >
          <Typography variant="subtitle2">
            ATENCIÓN CRÍTICA
          </Typography>
          <Typography variant="body2">
            {analytics.riesgoCritico} lote{analytics.riesgoCritico !== 1 ? 's están' : ' está'} en riesgo de liberación por falta de pago del ganador.
          </Typography>
        </Alert>
      )}

      {/* SELECTOR DE VISTA + GRÁFICO */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 3 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              Lotes con Incidencias de Pago
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                '& .MuiToggleButton-root': {
                  px: 2,
                  textTransform: 'none',
                  borderRadius: 1.5,
                },
              }}
            >
              <ToggleButton value="table">Tabla</ToggleButton>
              <ToggleButton value="cards">Cards</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <RiskDistributionChart data={analytics.chartData} isLoading={isLoading} />
      </Box>

      {/* CONTENIDO SEGÚN VISTA */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        {viewMode === 'cards' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {analytics.detalles.map((lote) => (
              <RiskLoteCard key={lote.id} lote={lote} />
            ))}
          </Box>
        ) : (
          <DataTable
            columns={columns}
            data={analytics.detalles}
            getRowKey={(row) => row.id}
            isRowActive={(lote) => (lote.intentos_fallidos_pago || 0) < 2}
            showInactiveToggle={true}
            inactiveLabel="Riesgo Crítico"
            highlightedRowId={highlightedId}
            emptyMessage="No hay lotes con incidencias de pago registradas."
            pagination={true}
            defaultRowsPerPage={10}
          />
        )}
      </QueryHandler>

      {/* PROTOCOLO INFO */}
      <Paper
        sx={{
          p: 4,
          mt: 4,
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          borderRadius: 2,
          border: '1px solid',
          borderColor: theme.palette.secondary.main,
        }}
        elevation={0}
      >
        <Typography
          variant="overline"
          color="primary.main"
          sx={{ mb: 2, display: 'block' }}
        >
          🔄 Protocolo Automático de Reasignación
        </Typography>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            • <b>Intento de Pago:</b> El ganador dispone de 90 días naturales para la entrega del
            capital.
            <br />
            • <b>Fallo en Cobro:</b> Tras cada intento fallido, se notifica automáticamente al
            usuario y al administrador.
            <br />
            • <b>Reasignación:</b> Al alcanzar el <b>3er intento fallido</b>, el sistema revoca la
            adjudicación y asigna el lote al siguiente postor de la lista.
            <br />• <b>Disponibilidad:</b> Si no existen más postores válidos, el lote regresa a
            estado de "Suscripción Abierta".
          </Typography>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

export default AdminLotePagos;
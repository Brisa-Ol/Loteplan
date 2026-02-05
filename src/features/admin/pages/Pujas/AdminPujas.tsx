import {
  Block, CancelScheduleSend, EmojiEvents, ErrorOutline, Gavel,
  Image as ImageIcon, MonetizationOn, Person, ReceiptLong,
  StopCircle, Timer, TrendingUp,
  ViewList,
  ViewModule,
  Warning
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardActions, CardContent,
  Divider,
  IconButton,
  Paper, Stack, Tab, Tabs, Tooltip,
  Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import { useAdminPujas } from '../../hooks/useAdminPujas';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import DetallePujaModal from './components/DetallePujaModal';

// ============================================================================
// SUB-COMPONENTES MEMOIZADOS (Evitan re-renders masivos en polling)
// ============================================================================

const Top3List = React.memo<{ pujas: PujaDto[]; getUserName: (id: number) => string }>(({ pujas, getUserName }) => {
  const theme = useTheme();
  const top3 = useMemo(() => pujas.slice(0, 3), [pujas]);

  return (
    <Box sx={{ mt: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 2, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>PODIO DE OFERTAS</Typography>
        <TrendingUp fontSize="inherit" color="action" />
      </Stack>
      <Stack spacing={0.5}>
        {top3.map((puja, index) => {
          const isLeader = index === 0;
          return (
            <Stack key={puja.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.8, borderRadius: 1, bgcolor: isLeader ? alpha(theme.palette.success.main, 0.1) : 'transparent' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {isLeader ? <EmojiEvents sx={{ fontSize: 16, color: 'warning.main' }} /> : <Typography variant="caption" fontWeight={700} width={16} align="center" color="text.disabled">{index + 1}</Typography>}
                <Typography variant="caption" fontWeight={isLeader ? 700 : 500} noWrap maxWidth={100}>{getUserName(puja.id_usuario)}</Typography>
              </Stack>
              <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>${Number(puja.monto_puja).toLocaleString()}</Typography>
            </Stack>
          );
        })}
        {top3.length === 0 && <Typography variant="caption" color="text.secondary" align="center" py={1}>Sin ofertas registradas</Typography>}
      </Stack>
    </Box>
  );
});
Top3List.displayName = 'Top3List';

const LiveAuctionCard = React.memo<{ lote: LoteDto, pujas: PujaDto[], getUserName: (id: number) => string, onFinish: (l: LoteDto) => void }>(({ lote, pujas, getUserName, onFinish }) => {
  const theme = useTheme();
  const maxPuja = pujas.length > 0 ? Number(pujas[0].monto_puja) : Number(lote.precio_base);

  return (
    <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.5, flex: 1 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Avatar src={imagenService.resolveImageUrl(lote.imagenes?.[0]?.url || '')} variant="rounded"><Gavel color="primary" /></Avatar>
          <Box minWidth={0}>
            <Typography fontWeight={800} variant="subtitle1" noWrap>{lote.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
          </Box>
        </Stack>
        <Box textAlign="center" py={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>OFERTA ACTUAL</Typography>
          <Typography variant="h4" fontWeight={800} color="primary.main">${maxPuja.toLocaleString()}</Typography>
        </Box>
        <Top3List pujas={pujas} getUserName={getUserName} />
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 1.5 }}>
        <Button fullWidth variant="contained" color="error" size="small" startIcon={<StopCircle />} onClick={() => onFinish(lote)} sx={{ fontWeight: 700 }}>Finalizar Subasta</Button>
      </CardActions>
    </Card>
  )
});
LiveAuctionCard.displayName = 'LiveAuctionCard';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminPujas: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminPujas();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // --- COLUMNAS (Memoizadas) ---
  const columnsCobros: DataTableColumn<LoteDto>[] = useMemo(() => [
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
      id: 'ganador', label: 'Ganador', minWidth: 180, render: (l) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}><Person fontSize="inherit" /></Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {l.id_ganador ? logic.getUserName(l.id_ganador) : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">Cliente Verificado</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'monto', label: 'Monto a Cobrar', render: (l) => {
        // En vista Gestión, usamos datos del Lote, no buscamos en array de pujas
        const monto = l.monto_ganador_lote || l.precio_base;
        return <Typography fontWeight={700} fontFamily="monospace">${Number(monto).toLocaleString()}</Typography>
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Anular Adjudicación (Impago)">
            <span>
              <IconButton
                size="small"
                sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}
                onClick={() => logic.handleCancelarAdjudicacion(l)}
                disabled={logic.cancelarGanadoraMutation.isPending || !l.id_puja_mas_alta} // Deshabilitar si no tenemos ID de puja
              >
                <CancelScheduleSend fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )
    }
  ], [logic, theme]);

  const columnsImpagos: DataTableColumn<LoteDto>[] = useMemo(() => [
    {
      id: 'lote', label: 'Lote', minWidth: 200, render: (l) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ErrorOutline color="error" fontSize="small" />
          <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
        </Stack>
      )
    },
    {
      id: 'intentos', label: 'Severidad', render: (l) => {
        const intentos = l.intentos_fallidos_pago || 0;
        return <StatusBadge status={intentos >= 3 ? 'failed' : 'warning'} customLabel={`${intentos}/3 FALLOS`} />;
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', render: (l) => (
        <Tooltip title="Bloquear / Forzar Finalización">
          <Button variant="contained" color="error" size="small" startIcon={<Block />} onClick={() => logic.forceFinishMutation.mutate({ idLote: l.id, idGanador: l.id_ganador })}>
            Sancionar
          </Button>
        </Tooltip>
      )
    }
  ], [logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader title="Sala de Control de Subastas" subtitle="Gestión en tiempo real de subastas, adjudicaciones y control de pagos." />

      {/* METRICS */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard title="En Vivo" value={logic.analytics.activos.length} icon={<Gavel />} color="success" loading={logic.loading} subtitle="Subastas activas" />
        <StatCard title="Por Cobrar" value={logic.analytics.pendientesPago.length} icon={<ReceiptLong />} color="info" loading={logic.loading} subtitle="Adjudicaciones pendientes" />
        <StatCard title="Volumen en Juego" value={`$${logic.analytics.dineroEnJuego.toLocaleString()}`} icon={<MonetizationOn />} color="warning" loading={logic.loading} subtitle="Capital potencial total" />
        <StatCard title="Impagos / Riesgo" value={logic.analytics.lotesEnRiesgo.length} icon={<ErrorOutline />} color="error" loading={logic.loading} subtitle="Atención requerida" />
      </MetricsGrid>

      {/* TABS & FILTERS */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-end" mb={3} spacing={2}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 0.5, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
          <Tabs value={logic.tabValue} onChange={(_, v) => logic.setTabValue(v)} indicatorColor="primary" textColor="primary">
            <Tab icon={<Timer />} label="En Vivo" iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
            <Tab icon={<ReceiptLong />} label="Gestión de Cobros" iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
            <Tab icon={<Warning />} label="Impagos" iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
          </Tabs>
        </Paper>
        <Stack direction="row" spacing={2} width={{ xs: '100%', md: 'auto' }}>
          {logic.tabValue === 0 && (
            <ViewModeToggle value={viewMode} onChange={(m) => setViewMode(m)} options={[{ value: 'grid', label: 'Grid', icon: <ViewModule fontSize="small" /> }, { value: 'table', label: 'Lista', icon: <ViewList fontSize="small" /> }]} />
          )}
          <FilterBar sx={{ width: { xs: '100%', md: 400 } }}>
            <FilterSearch placeholder="Buscar lote..." value={logic.filterLoteNombre} onChange={(e) => logic.setFilterLoteNombre(e.target.value)} sx={{ flexGrow: 1 }} />
          </FilterBar>
        </Stack>
      </Stack>

      {/* CONTENT */}
      <QueryHandler isLoading={logic.loading} error={logic.error as Error}>

        {/* TAB 0: EN VIVO */}
        {logic.tabValue === 0 && (
          <>
            {logic.analytics.activos.length === 0 ? (
              <AlertBanner severity="info" title="Sin Actividad" message="No hay subastas en curso en este momento." />
            ) : viewMode === 'grid' ? (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={3}>
                {logic.analytics.activos.map(lote => (
                  <LiveAuctionCard
                    key={lote.id}
                    lote={lote}
                    pujas={logic.pujasPorLote[lote.id] || []}
                    getUserName={logic.getUserName}
                    onFinish={logic.handleFinalizarSubasta}
                  />
                ))}
              </Box>
            ) : (
              <DataTable
                data={logic.analytics.activos}
                columns={[
                  { id: 'id', label: 'Lote', render: (l) => l.nombre_lote },
                  { id: 'precio', label: 'Oferta Actual', render: (l) => `$${Number(logic.pujasPorLote[l.id]?.[0]?.monto_puja || l.precio_base).toLocaleString()}` },
                  { id: 'pujas', label: 'Cant. Pujas', align: 'center', render: (l) => logic.pujasPorLote[l.id]?.length || 0 },
                  { id: 'acciones', label: '', align: 'right', render: (l) => <Button size="small" variant="contained" color="error" onClick={() => logic.handleFinalizarSubasta(l)}>Finalizar</Button> }
                ]}
                getRowKey={r => r.id}
                showInactiveToggle={false} // Siempre mostrar todo lo filtrado
                pagination
                defaultRowsPerPage={10}
              />
            )}
          </>
        )}

        {/* TAB 1: GESTIÓN DE COBROS */}
        {logic.tabValue === 1 && (
          <DataTable
            columns={columnsCobros}
            data={logic.analytics.pendientesPago}
            getRowKey={(row) => row.id}
            highlightedRowId={logic.highlightedId}
            showInactiveToggle={false}
            emptyMessage="No hay cobros pendientes de adjudicación."
            pagination={true}
            defaultRowsPerPage={10}
          />
        )}

        {/* TAB 2: IMPAGOS */}
        {logic.tabValue === 2 && (
          <DataTable
            columns={columnsImpagos}
            data={logic.analytics.lotesEnRiesgo}
            getRowKey={(row) => row.id}
            highlightedRowId={logic.highlightedId}
            showInactiveToggle={false}
            emptyMessage="Excelente, no hay lotes en situación de impago."
            pagination={true}
            defaultRowsPerPage={10}
          />
        )}
      </QueryHandler>

      <DetallePujaModal
        open={logic.modales.detallePuja.isOpen}
        onClose={() => { logic.modales.detallePuja.close(); logic.setPujaSeleccionada(null); }}
        puja={logic.pujaSeleccionada}
        userName={logic.pujaSeleccionada ? logic.getUserName(logic.pujaSeleccionada.id_usuario) : undefined}
        isHighest={logic.pujaSeleccionada && logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.[0]?.id === logic.pujaSeleccionada.id}
        rankingPosition={logic.pujaSeleccionada ? (logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.findIndex(p => p.id === logic.pujaSeleccionada?.id) + 1) : undefined}
      />

      <ConfirmDialog controller={logic.modales.confirmDialog} onConfirm={logic.handleConfirmAction} isLoading={logic.endAuctionMutation.isPending || logic.cancelarGanadoraMutation.isPending} />
    </PageContainer>
  );
};

export default AdminPujas;
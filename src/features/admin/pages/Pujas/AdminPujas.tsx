// src/features/admin/pages/Pujas/AdminPujas.tsx

import {
  EmojiEvents, Gavel, Image as ImageIcon,
  StopCircle, Timer, TrendingUp, ViewList, ViewModule
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Card, CardActions, CardContent,
  Divider, Paper, Stack, Typography, useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { PujaDto } from '@/core/types/dto/puja.dto';


import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import { useAdminPujas } from '../../hooks/lotes/useAdminPujas';
import DetallePujaModal from './components/DetallePujaModal';

// ============================================================================
// SUB-COMPONENTES (Podio y Card en Vivo)
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

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader title="Sala de Subastas (En Vivo)" subtitle="Monitoreo en tiempo real y adjudicación de lotes." />

      {/* METRICS (Solo relevantes para la subasta en vivo) */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 3 }}>
        <StatCard title="Subastas Activas" value={logic.analytics.activos.length} icon={<Gavel />} color="success" loading={logic.loading} subtitle="Lotes recibiendo ofertas" />
        <StatCard title="Volumen en Juego" value={`$${logic.analytics.dineroEnJuego.toLocaleString()}`} icon={<TrendingUp />} color="warning" loading={logic.loading} subtitle="Suma de pujas actuales" />
        <StatCard title="Total Ofertas Hoy" value={Object.values(logic.pujasPorLote).flat().length} icon={<Timer />} color="info" loading={logic.loading} subtitle="Interacción de usuarios" />
      </MetricsGrid>

      {/* CONTROLES Y FILTROS */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2}>
        <FilterBar sx={{ flex: 1, maxWidth: 500 }}>
          <FilterSearch placeholder="Buscar lote activo..." value={logic.filterLoteNombre} onChange={(e) => logic.setFilterLoteNombre(e.target.value)} sx={{ flexGrow: 1 }} />
        </FilterBar>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <ViewModeToggle value={viewMode} onChange={(m) => setViewMode(m)} options={[{ value: 'grid', label: 'Grid', icon: <ViewModule fontSize="small" /> }, { value: 'table', label: 'Lista', icon: <ViewList fontSize="small" /> }]} />
        </Paper>
      </Stack>

      {/* CONTENIDO: SOLO SUBASTAS ACTIVAS */}
      <QueryHandler isLoading={logic.loading} error={logic.error as Error}>
        {logic.analytics.activos.length === 0 ? (
          <AlertBanner severity="info" title="Sala Vacía" message="No hay subastas programadas o en curso en este momento." />
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
              {
                id: 'lote', label: 'Lote', minWidth: 200, render: (l) => (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={imagenService.resolveImageUrl(l.imagenes?.[0]?.url || '')} variant="rounded"><ImageIcon /></Avatar>
                    <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
                  </Stack>
                )
              },
              { id: 'precio', label: 'Oferta Actual', render: (l) => <Typography fontWeight={700} color="primary">${Number(logic.pujasPorLote[l.id]?.[0]?.monto_puja || l.precio_base).toLocaleString()}</Typography> },
              { id: 'pujas', label: 'Pujas', align: 'center', render: (l) => logic.pujasPorLote[l.id]?.length || 0 },
              { id: 'acciones', label: '', align: 'right', render: (l) => <Button size="small" variant="contained" color="error" onClick={() => logic.handleFinalizarSubasta(l)}>Finalizar</Button> }
            ]}
            getRowKey={r => r.id}
            showInactiveToggle={false}
            pagination
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

      <ConfirmDialog controller={logic.modales.confirmDialog} onConfirm={logic.handleConfirmAction} isLoading={logic.isMutating} />
    </PageContainer>
  );
};

export default AdminPujas;
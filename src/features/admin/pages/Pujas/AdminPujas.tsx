// src/features/admin/pages/Pujas/AdminPujas.tsx

import {
  EmojiEvents,
  Gavel,
  Image as ImageIcon,
  OpenInNew,
  StopCircle,
  Timer,
  TrendingUp,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import imagenService from '@/core/api/services/imagen.service';
import { env } from '@/core/config/env';
import type { LoteDto } from '@/core/types/lote.dto';
import type { PujaDto } from '@/core/types/puja.dto';
import {
  AdminPageHeader,
  AlertBanner,
  ConfirmDialog,
  DataTable,
  FilterBar,
  FilterSearch,
  MetricsGrid,
  PageContainer,
  QueryHandler,
  StatCard,
  ViewModeToggle,
  type ViewMode,
} from '@/shared';
import { useAdminPujas } from '../../hooks/lotes/useAdminPujas';
import DetallePujaModal from './modal/DetallePujaModal';

// ─── Top3List ─────────────────────────────────────────────────────────────────

interface Top3Props {
  pujas: PujaDto[];
  getUserName: (id: number) => string;
  onPujaClick: (puja: PujaDto) => void;
}

const Top3List = React.memo<Top3Props>(({ pujas, getUserName, onPujaClick }) => {
  const theme = useTheme();
  const top3 = useMemo(() => pujas.slice(0, 3), [pujas]);

  return (
    <Box
      sx={{
        mt: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        borderRadius: 2,
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>
          PODIO DE OFERTAS
        </Typography>
        <TrendingUp fontSize="inherit" color="action" />
      </Stack>

      <Stack spacing={0.5}>
        {top3.length === 0 && (
          <Typography variant="caption" color="text.secondary" align="center" py={1}>
            Sin ofertas registradas
          </Typography>
        )}

        {top3.map((puja, index) => {
          const isLeader = index === 0;
          return (
            <Tooltip key={puja.id} title="Ver detalle de esta oferta" placement="left">
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => onPujaClick(puja)}
                sx={{
                  p: 0.8,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isLeader
                    ? alpha(theme.palette.success.main, 0.1)
                    : 'transparent',
                  '&:hover': {
                    bgcolor: isLeader
                      ? alpha(theme.palette.success.main, 0.18)
                      : alpha(theme.palette.action.hover, 0.8),
                  },
                  transition: 'background-color 0.15s',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {isLeader ? (
                    <EmojiEvents sx={{ fontSize: 16, color: 'warning.main' }} />
                  ) : (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      width={16}
                      align="center"
                      color="text.disabled"
                    >
                      {index + 1}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    fontWeight={isLeader ? 700 : 500}
                    noWrap
                    maxWidth={100}
                  >
                    {getUserName(puja.id_usuario)}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ fontFamily: 'monospace' }}
                  >
                    ${Number(puja.monto_puja).toLocaleString(env.defaultLocale)}
                  </Typography>
                  <OpenInNew sx={{ fontSize: 10, color: 'text.disabled' }} />
                </Stack>
              </Stack>
            </Tooltip>
          );
        })}
      </Stack>

      {pujas.length > 3 && (
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          textAlign="center"
          mt={1}
        >
          +{pujas.length - 3} más
        </Typography>
      )}
    </Box>
  );
});
Top3List.displayName = 'Top3List';

// ─── LiveAuctionCard ──────────────────────────────────────────────────────────

interface LiveCardProps {
  lote: LoteDto;
  pujas: PujaDto[];
  getUserName: (id: number) => string;
  onFinish: (l: LoteDto) => void;
  onPujaClick: (puja: PujaDto) => void;
}

const LiveAuctionCard = React.memo<LiveCardProps>(({
  lote, pujas, getUserName, onFinish, onPujaClick,
}) => {
  const theme = useTheme();
  const topPuja = pujas[0];
  const maxMonto = topPuja ? Number(topPuja.monto_puja) : Number(lote.precio_base);
  const hayOfertas = pujas.length > 0;

  return (
    <Card
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1 }}>
        {/* Cabecera del lote */}
        <Stack direction="row" spacing={2} mb={2}>
          <Avatar
            src={imagenService.resolveImageUrl(lote.imagenes?.[0]?.url || '')}
            variant="rounded"
          >
            <Gavel color="primary" />
          </Avatar>
          <Box minWidth={0}>
            <Typography fontWeight={800} variant="subtitle1" noWrap>
              {lote.nombre_lote}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {lote.id}
            </Typography>
          </Box>
          <Box ml="auto">
            <Chip
              label={hayOfertas ? `${pujas.length} oferta${pujas.length !== 1 ? 's' : ''}` : 'Sin ofertas'}
              size="small"
              color={hayOfertas ? 'primary' : 'default'}
              sx={{ fontWeight: 700, fontSize: '0.65rem' }}
            />
          </Box>
        </Stack>

        {/* Oferta actual — clickeable para ver el detalle del líder */}
        <Box
          textAlign="center"
          py={2}
          sx={{
            borderRadius: 2,
            bgcolor: hayOfertas
              ? alpha(theme.palette.success.main, 0.05)
              : alpha(theme.palette.action.hover, 0.4),
            border: '1px solid',
            borderColor: hayOfertas
              ? alpha(theme.palette.success.main, 0.2)
              : theme.palette.divider,
            cursor: hayOfertas ? 'pointer' : 'default',
            '&:hover': hayOfertas
              ? { bgcolor: alpha(theme.palette.success.main, 0.1) }
              : {},
            transition: 'background-color 0.15s',
          }}
          onClick={() => topPuja && onPujaClick(topPuja)}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {hayOfertas ? 'OFERTA LÍDER' : 'PRECIO BASE'}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            color={hayOfertas ? 'success.main' : 'text.secondary'}
          >
            ${maxMonto.toLocaleString(env.defaultLocale)}
          </Typography>
          {hayOfertas && (
            <Typography variant="caption" color="text.disabled">
              por {getUserName(topPuja!.id_usuario)}
            </Typography>
          )}
        </Box>

        {/* Podio */}
        <Top3List pujas={pujas} getUserName={getUserName} onPujaClick={onPujaClick} />
      </CardContent>

      <Divider />

      <CardActions sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          size="small"
          startIcon={<StopCircle />}
          onClick={() => onFinish(lote)}
          sx={{ fontWeight: 700 }}
        >
          Finalizar Subasta
        </Button>
      </CardActions>
    </Card>
  );
});
LiveAuctionCard.displayName = 'LiveAuctionCard';

// ─── AdminPujas ───────────────────────────────────────────────────────────────

const AdminPujas: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminPujas();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Sala de Subastas"
        subtitle="Monitoreo en tiempo real y adjudicación de lotes activos."
      />

      {/* Métricas */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 3 }}>
        <StatCard
          title="Subastas Activas"
          value={logic.analytics.activos.length}
          icon={<Gavel />}
          color="success"
          loading={logic.loading}
          subtitle="Lotes recibiendo ofertas"
        />
        <StatCard
          title="Volumen en Juego"
          value={`$${logic.analytics.dineroEnJuego.toLocaleString(env.defaultLocale)}`}
          icon={<TrendingUp />}
          color="warning"
          loading={logic.loading}
          subtitle="Suma de pujas actuales"
        />
        <StatCard
          title="Total Ofertas Hoy"
          value={Object.values(logic.pujasPorLote).flat().length}
          icon={<Timer />}
          color="info"
          loading={logic.loading}
          subtitle="Interacción de usuarios"
        />
      </MetricsGrid>

      {/* Controles */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        spacing={2}
      >
        <FilterBar sx={{ flex: 1, maxWidth: 500 }}>
          <FilterSearch
            placeholder="Buscar lote activo..."
            value={logic.filterLoteNombre}
            onChange={e => logic.setFilterLoteNombre(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
        </FilterBar>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <ViewModeToggle
            value={viewMode}
            onChange={m => setViewMode(m)}
            options={[
              { value: 'grid', label: 'Grid', icon: <ViewModule fontSize="small" /> },
              { value: 'table', label: 'Lista', icon: <ViewList fontSize="small" /> },
            ]}
          />
        </Paper>
      </Stack>

      {/* Contenido */}
      <QueryHandler isLoading={logic.loading} error={logic.error as Error}>
        {logic.analytics.activos.length === 0 ? (
          <AlertBanner
            severity="info"
            title="Sala Vacía"
            message="No hay subastas programadas o en curso en este momento."
          />
        ) : viewMode === 'grid' ? (
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={3}
          >
            {logic.analytics.activos.map(lote => (
              <LiveAuctionCard
                key={lote.id}
                lote={lote}
                pujas={logic.pujasPorLote[lote.id] || []}
                getUserName={logic.getUserName}
                onFinish={logic.handleFinalizarSubasta}
                onPujaClick={logic.handleOpenDetallePuja}
              />
            ))}
          </Box>
        ) : (
          <DataTable
            data={logic.analytics.activos}
            columns={[
              {
                id: 'lote',
                label: 'Lote',
                minWidth: 200,
                render: l => (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={imagenService.resolveImageUrl(l.imagenes?.[0]?.url || '')}
                      variant="rounded"
                    >
                      <ImageIcon />
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} variant="body2">{l.nombre_lote}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
                    </Box>
                  </Stack>
                ),
              },
              {
                id: 'precio',
                label: 'Oferta Líder',
                render: l => {
                  const topPuja = logic.pujasPorLote[l.id]?.[0];
                  return (
                    <Box>
                      <Typography fontWeight={700} color={topPuja ? 'success.main' : 'text.secondary'}>
                        ${Number(topPuja?.monto_puja || l.precio_base).toLocaleString(env.defaultLocale)}
                      </Typography>
                      {topPuja && (
                        <Typography variant="caption" color="text.disabled">
                          {logic.getUserName(topPuja.id_usuario)}
                        </Typography>
                      )}
                    </Box>
                  );
                },
              },
              {
                id: 'pujas',
                label: 'Nº Ofertas',
                align: 'center',
                render: l => (
                  <Chip
                    label={logic.pujasPorLote[l.id]?.length || 0}
                    size="small"
                    color={logic.pujasPorLote[l.id]?.length > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                ),
              },
              {
                id: 'acciones',
                label: 'Acciones',
                align: 'right',
                render: l => {
                  const topPuja = logic.pujasPorLote[l.id]?.[0];
                  return (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {topPuja && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => logic.handleOpenDetallePuja(topPuja)}
                          sx={{ fontWeight: 700 }}
                        >
                          Ver líder
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => logic.handleFinalizarSubasta(l)}
                        startIcon={<StopCircle fontSize="small" />}
                        sx={{ fontWeight: 700 }}
                      >
                        Finalizar
                      </Button>
                    </Stack>
                  );
                },
              },
            ]}
            getRowKey={r => r.id}
            showInactiveToggle={false}
            pagination
            defaultRowsPerPage={env.defaultPageSize}
          />
        )}
      </QueryHandler>

      {/* Modal de detalle de puja */}
      <DetallePujaModal
        open={logic.modales.detallePuja.isOpen}
        onClose={logic.handleCloseDetallePuja}
        puja={logic.pujaSeleccionada}
        userName={
          logic.pujaSeleccionada
            ? logic.getUserName(logic.pujaSeleccionada.id_usuario)
            : undefined
        }
        // El nombre del lote viene directamente de la relación incluida en la puja
        loteName={logic.pujaSeleccionada?.lote?.nombre_lote}
        isHighest={
          !!logic.pujaSeleccionada &&
          logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.[0]?.id ===
          logic.pujaSeleccionada.id
        }
        rankingPosition={
          logic.pujaSeleccionada
            ? (logic.pujasPorLote[logic.pujaSeleccionada.id_lote]?.findIndex(
              p => p.id === logic.pujaSeleccionada?.id
            ) ?? -1) + 1 || undefined
            : undefined
        }
      />

      <ConfirmDialog
        controller={logic.modales.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isMutating}
      />
    </PageContainer>
  );
};

export default AdminPujas;
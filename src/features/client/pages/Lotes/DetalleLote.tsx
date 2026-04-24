// src/features/client/pages/Lotes/DetalleLote.tsx

import {
  AddCircleOutline, // <-- Agregado
  BookmarkBorder, // <-- Agregado
  EmojiEvents,
  Gavel,
  ReplayCircleFilled, // <-- Agregado
  Timer,
  TokenOutlined
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Fade,
  keyframes,
  LinearProgress,
  List, // <-- Agregado
  ListItem, // <-- Agregado
  ListItemIcon, // <-- Agregado
  ListItemText, // <-- Agregado
  Paper,
  Portal,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Core & Shared
import ImagenService from '@/core/api/services/imagen.service';
import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import { useAuth } from '@/core/context/AuthContext';
import {
  ConfirmDialog,
  PageHeader,
  useConfirmDialog,
  useModal,
  useSnackbar,
} from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';

// Hooks Locales
import { MapUrlIframe } from '@/features/admin/pages/Proyectos/modals/MapUrlIframe/MapUrlIframe';
import { useAuctionStatus } from '../../hooks';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useImageLoader } from '../../hooks/useImageLoader';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import { FavoritoButton } from './components/BotonFavorito';
import { PujarModal } from './modals/PujarModal';

// ─── Animaciones ─────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70%  { box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFullDate = (dateString?: string | null): string => {
  if (!dateString) return '--/--/--';
  return new Intl.DateTimeFormat(env.defaultLocale || 'es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// ─── CountdownTimer ───────────────────────────────────────────────────────────

const CountdownTimer = ({ endDate }: { endDate: string | null }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeLeft('Sin límite');
      return;
    }

    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('CERRADA');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [endDate]);

  return (
    <Typography variant="h6" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {timeLeft}
    </Typography>
  );
};

// ─── DetalleLote ──────────────────────────────────────────────────────────────

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const fmt = useCurrencyFormatter();

  const pujarModal = useModal();
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const { isLoading: isLoadingImage, hasError, handleLoad, handleError } = useImageLoader();

  const { data: lote, isLoading: isLoadingLote } = useQuery({
    queryKey: ['lote', id],
    queryFn: async () => (await LoteService.getByIdActive(Number(id))).data as any,
    refetchInterval: 7000,
  });

  const { data: misPujas = [] } = useQuery({
    queryKey: ['mis-pujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
    refetchInterval: 7000,
    enabled: !!user?.id,
  });

  const isFetching = useIsFetching({ queryKey: ['lote', id] });
  const { estaSuscripto, tokensDisponibles } = useVerificarSuscripcion(lote?.id_proyecto);

  // ─── Mi puja activa en este lote ──────────────────────────────────────────

  const miPujaEnEsteLote = useMemo(() => {
    if (!misPujas.length || !lote) return null;
    return (
      misPujas.find(
        (p: any) =>
          Number(p.id_lote) === Number(lote.id) && p.estado_puja !== 'cancelada'
      ) ?? null
    );
  }, [misPujas, lote]);

  // ─── Estado de precios ────────────────────────────────────────────────────

  const preciosInfo = useMemo(() => {
    if (!lote) {
      return { precioBase: 0, hayOfertas: false, soyLider: false, montoLider: 0, montoLiderConocido: false, miMonto: 0 };
    }

    const base = Number(lote.precio_base || 0);
    const hayOfertas = !!lote.id_puja_mas_alta;
    const miMonto = miPujaEnEsteLote ? Number(miPujaEnEsteLote.monto_puja) : 0;

    const soyLider =
      !!miPujaEnEsteLote &&
      !!lote.id_puja_mas_alta &&
      Number(miPujaEnEsteLote.id) === Number(lote.id_puja_mas_alta);

    const montoLiderExterno = Number(lote.pujaMasAlta?.monto_puja || 0);
    const montoLider = soyLider ? miMonto : montoLiderExterno;
    const montoLiderConocido = !hayOfertas || montoLider > 0;

    return { precioBase: base, hayOfertas, soyLider, montoLider, montoLiderConocido, miMonto };
  }, [lote, miPujaEnEsteLote]);

  // ─── Estado del usuario en la subasta ────────────────────────────────────

  const winInfo = useMemo(() => {
    const defaults = {
      esLiderActual: false,
      esGanadorDefinitivo: false,
      montoFinal: preciosInfo.montoLider,
      pujaId: null as number | null,
      miPujaId: null as number | null,
      status: 'desconocido',
    };

    if (!lote || !user?.id) return defaults;

    const subastaFinalizada = lote.estado_subasta === 'finalizada';
    const statusPuja = miPujaEnEsteLote?.estado_puja;

    const esGanadorDefinitivo =
      subastaFinalizada &&
      (statusPuja === 'ganadora_pendiente' || statusPuja === 'ganadora_pagada');

    return {
      esLiderActual: preciosInfo.soyLider && !subastaFinalizada,
      esGanadorDefinitivo,
      montoFinal: preciosInfo.montoLider,
      pujaId: esGanadorDefinitivo ? (miPujaEnEsteLote?.id ?? null) : null,
      miPujaId: miPujaEnEsteLote?.id ?? null,
      status: statusPuja ?? 'desconocido',
    };
  }, [lote, user?.id, preciosInfo, miPujaEnEsteLote]);

  // ─── Flags derivados ──────────────────────────────────────────────────────

  const statusConfig = useAuctionStatus(lote?.estado_subasta);
  const isActiva = lote?.estado_subasta === 'activa';
  const subastaFinalizada = lote?.estado_subasta === 'finalizada';
  const tiempoAgotado = lote?.fecha_fin ? new Date(lote.fecha_fin).getTime() <= Date.now() : false;

  // Flag unificado para saber si la tarjeta debe verse bloqueada
  const isCerrada = lote?.estado_subasta === 'finalizada' || lote?.estado_subasta === 'pendiente';

  const yaParticipa = !!winInfo.miPujaId;
  const soyGanador = winInfo.esLiderActual || winInfo.esGanadorDefinitivo;
  const fuiSuperado = yaParticipa && !winInfo.esLiderActual && isActiva;
  const yaPago = winInfo.status === 'ganadora_pagada';
  const debesPagar = winInfo.esGanadorDefinitivo && subastaFinalizada && !yaPago;

  const puedePujar = isActiva && estaSuscripto && (tokensDisponibles > 0 || yaParticipa);
  const puedeCancelar = isActiva && yaParticipa;
  const sinTokensParaPujar =
    isActiva && !isCerrada && estaSuscripto && tokensDisponibles === 0 && !yaParticipa;

  // ─── Invalidación ─────────────────────────────────────────────────────────

  const invalidarTodo = () => {
    queryClient.invalidateQueries({ queryKey: ['lote', id] });
    queryClient.invalidateQueries({ queryKey: ['mis-pujas'] });
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const mutationPago = useMutation({
    mutationFn: async (pujaId: number) => {
      setSelectedPujaId(pujaId);
      return (await PujaService.initiatePayment(pujaId)).data;
    },
    onSuccess: (data: any) => {
      if (data.is2FARequired) twoFaModal.open();
      else if (data.url_checkout) window.location.href = data.url_checkout;
      else showError('No se pudo procesar el link de pago.');
    },
    onError: (err: any) => showError(err.message || 'Error al iniciar pago'),
  });

  const confirmar2FA = useMutation({
    mutationFn: (code: string) =>
      PujaService.confirmPayment2FA({ pujaId: selectedPujaId!, codigo_2fa: code }),
    onSuccess: (res: any) => {
      if (res.data?.url_checkout) window.location.href = res.data.url_checkout;
    },
    onError: () => setTwoFAError('Código incorrecto.'),
  });

  const mutationCancelar = useMutation({
    mutationFn: (pujaId: number) => PujaService.cancelMyPuja(pujaId),
    onSuccess: () => {
      showSuccess('Puja retirada. Token devuelto.');
      invalidarTodo();
      confirmDialog.close();
    },
    onError: (err: any) => showError(err.message || 'Error al cancelar'),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePagar = () => {
    if (winInfo.pujaId) mutationPago.mutate(winInfo.pujaId);
  };

  const handleSolicitarCancelacion = async () => {
    confirmDialog.confirm('cancel_puja', { monto: winInfo.montoFinal });
  };

  const handleConfirmarCancelacion = async () => {
    if (winInfo.miPujaId) {
      await mutationCancelar.mutate(winInfo.miPujaId);
      setTimeout(() => {
        window.location.reload(); // Recarga para actualizar estado tras cancelación
      }, 1750);
    }
  };

  // ─── Early returns ────────────────────────────────────────────────────────

  if (isLoadingLote) {
    return (
      <Box p={4}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (!lote) return <Alert severity="error">Lote no encontrado</Alert>;

  const rawUrl = lote?.imagenes?.[0]?.url;
  const imagenUrl = rawUrl ? ImagenService.resolveImageUrl(rawUrl) : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>

      {isFetching > 0 && (
        <Portal>
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress sx={{ height: 2 }} />
          </Box>
        </Portal>
      )}

      <PageHeader
        title="Detalle del lote"
        subtitle={`Nombre del lote: ${lote.nombre_lote}`}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={winInfo.esGanadorDefinitivo ? '¡GANASTE EL LOTE!' : winInfo.esLiderActual ? '¡VAS GANANDO!' : statusConfig.label}

              color={soyGanador ? 'success' : undefined}
              sx={{
                fontWeight: 900,
                color: soyGanador ? 'white' : statusConfig.hexColor,
                backgroundColor: soyGanador ? undefined : statusConfig.bgColor,
                ...(isActiva && !soyGanador && { animation: `${pulse} 2s infinite` }),
                ...(soyGanador && { boxShadow: 4 }),
              }}
            />
            <FavoritoButton loteId={lote.id} size="large" />
          </Stack>
        }
      />

      {debesPagar && (
        <Fade in timeout={500}>
          <Paper sx={{ mb: 4, p: 3, bgcolor: 'success.main', color: 'white', borderRadius: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">

              {/* Contenedor izquierdo: Trofeo + Texto */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#FFFFFF', color: '#efbf04', width: 48, height: 48 }}>
                  <EmojiEvents />
                </Avatar>
                <Typography variant="h5" fontWeight={900}>
                  ¡GANASTE! Total: {fmt(winInfo.montoFinal)}
                </Typography>
              </Stack>

              {/* Contenedor derecho: Botón */}
              <Button
                variant="contained"
                color="inherit"
                onClick={handlePagar}
                sx={{ color: 'success.main', fontWeight: 900 }}
              >
                PAGAR AHORA
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.8fr 1.2fr' },
          gap: 4,
          alignItems: 'flex-start',
        }}
      >
        {/* ─── COLUMNA IZQUIERDA — IMAGEN E INFO TOKENS ─── */}
        <Stack spacing={4}>
          <Paper
            variant="outlined"
            sx={{
              height: { xs: 400, lg: 600 },
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
            }}
          >
            {!imagenUrl ? (
              <Stack alignItems="center" color="text.disabled">
                <BookmarkBorder sx={{ fontSize: 60 }} />
                <Typography>SIN IMAGEN</Typography>
              </Stack>
            ) : (
              <>
                {isLoadingImage && (
                  <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                )}
                <Box
                  component="img"
                  src={hasError ? '/assets/placeholder.jpg' : imagenUrl}
                  onLoad={handleLoad}
                  onError={handleError}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: isLoadingImage ? 0 : 1
                  }}
                />
              </>
            )}
          </Paper>

          {/* 👇 NUEVO: SECCIÓN DE INFORMACIÓN DE TOKENS DEBAJO DE LA IMAGEN */}
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} gutterBottom color="primary.main">
                ¿Cómo funcionan las pujas y tokens?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Para mantener un proceso justo y ordenado, utilizamos un sistema de tokens para participar en las subastas.
              </Typography>

              <List sx={{ gap: 2, display: 'flex', flexDirection: 'column', p: 0 }}>
                {/* Item 1: Uso del Token */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <TokenOutlined color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight={800}>1. Tu primera oferta</Typography>}
                    secondary="Necesitás 1 token disponible para realizar tu primera oferta en cualquier lote. Al confirmar, el token quedará reservado en esa puja."
                  />
                </ListItem>

                {/* Item 2: Defender la oferta */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Gavel color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight={800}>2. Mejorar tu oferta es gratis</Typography>}
                    secondary="Si alguien supera tu monto, podés volver a ofertar en ese mismo lote para recuperar el liderazgo sin necesidad de gastar tokens adicionales."
                  />
                </ListItem>

                {/* Item 3: Devolución */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <ReplayCircleFilled color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight={800}>3. Devolución garantizada</Typography>}
                    secondary="Si retirás tu puja o la subasta finaliza y no resultás ganador, tu token se devuelve automáticamente para que puedas usarlo en otro lote del proyecto."
                  />
                </ListItem>

                {/* Item 4: Múltiples suscripciones */}
                <ListItem
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <AddCircleOutline color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight={800}>4. Ofertar en múltiples lotes</Typography>}
                    secondary={
                      <React.Fragment>
                        Si deseás participar por más de un lote a la vez, podés volver a suscribirte al proyecto para obtener un nuevo token.
                        <Typography component="span" variant="body2" fontWeight={700} display="block" sx={{ mt: 0.5 }}>
                          Importante: Esto generará una nueva suscripción en paralelo, por lo que tendrás dos suscripciones activas al mismo tiempo.
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>

              </List>
            </CardContent>
          </Card>
        </Stack>

        {/* ─── COLUMNA DERECHA — TARJETAS NORMALES ─── */}
        <Box>
          <Stack spacing={3}>

            {/* 1. TARJETA DE SUBASTA */}
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              {/* Countdown - Diseño idéntico a la imagen cuando está cerrada */}
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: isCerrada ? '#f3ebe6' : alpha(theme.palette.primary.main, 0.05)
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={1}
                  sx={{ color: isCerrada ? '#c95b31' : 'primary.main' }}
                >
                  <Timer fontSize="small" />
                  {lote.fecha_fin
                    ? <CountdownTimer endDate={lote.fecha_fin} />
                    : <Typography variant="h6" fontWeight={900}>Sin fecha límite</Typography>
                  }
                </Stack>
              </Box>

              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                {/* ── Precio base ── */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                    PRECIO BASE
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.secondary">
                    {fmt(preciosInfo.precioBase)}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                {/* CASO 1 — sin ofertas */}
                {!preciosInfo.hayOfertas && (
                  <>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                      SIN OFERTAS AÚN
                    </Typography>
                    <Typography variant="h3" fontWeight={900} color="text.disabled" sx={{ mb: 3 }}>
                      —
                    </Typography>
                  </>
                )}

                {/* CASO 2 — soy el líder */}
                {preciosInfo.hayOfertas && preciosInfo.soyLider && (
                  <>
                    <Typography variant="overline" color="success.main" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                      {isCerrada ? '¡GANASTE EL LOTE!' : 'OFERTA LÍDER — SOS VOS'}
                    </Typography>
                    <Typography variant="h3" fontWeight={900} color="success.main" sx={{ mb: 3 }}>
                      {fmt(preciosInfo.montoLider)}
                    </Typography>
                  </>
                )}

                {/* CASO 3 — fui superado */}
                {preciosInfo.hayOfertas && fuiSuperado && (
                  <>
                    <Typography variant="overline" color={isCerrada ? "text.secondary" : "error.main"} sx={{ fontWeight: 800, letterSpacing: 1 }}>
                      {isCerrada ? 'SUBASTA FINALIZADA' : '¡TE SUPERARON!'}
                    </Typography>
                    <Typography variant="h3" fontWeight={900} color={isCerrada ? "text.disabled" : "error.main"} sx={{ mb: 1 }}>
                      {fmt(preciosInfo.miMonto)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                      {isCerrada ? 'El lote fue adjudicado a otra oferta.' : 'Tu oferta actual — hay una más alta'}
                    </Typography>
                  </>
                )}

                {/* CASO 4 — hay ofertas, no participa */}
                {preciosInfo.hayOfertas && !preciosInfo.soyLider && !fuiSuperado && (
                  <>
                    <Typography variant="overline" color={isCerrada ? "text.secondary" : "warning.main"} sx={{ fontWeight: 800, letterSpacing: 1 }}>
                      {isCerrada ? 'SUBASTA FINALIZADA' : 'SUBASTA EN CURSO'}
                    </Typography>
                    <Typography variant="h3" fontWeight={900} color={isCerrada ? "text.disabled" : "warning.main"} sx={{ mb: 3 }}>
                      {isCerrada ? 'Lote adjudicado' : 'Hay ofertas'}
                    </Typography>
                  </>
                )}

                {/* Aviso adicional cuando fui superado (oculto si ya cerró) */}
                {fuiSuperado && !isCerrada && (
                  <Fade in timeout={300}>
                    <Alert severity="warning" sx={{ borderRadius: 2, textAlign: 'left', mb: 2 }}>
                      <Typography variant="caption" fontWeight={800} display="block">
                        Alguien superó tu oferta
                      </Typography>
                      <Typography variant="caption">
                        Podés mejorar tu oferta sin consumir tokens adicionales.
                      </Typography>
                    </Alert>
                  </Fade>
                )}

                {/* Acciones */}
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={pujarModal.open}
                    disabled={isCerrada || !puedePujar}
                    startIcon={<Gavel />}
                    sx={{ py: 2, fontWeight: 900, borderRadius: 3 }}
                  >
                    {yaParticipa ? 'MEJORAR MI OFERTA' : 'OFERTAR AHORA'}
                  </Button>

                  {sinTokensParaPujar && !isCerrada && (
                    <Fade in timeout={300}>
                      <Alert
                        severity="warning"
                        icon={<TokenOutlined fontSize="small" />}
                        sx={{ borderRadius: 2, textAlign: 'left' }}
                      >
                        <Typography variant="caption" fontWeight={800} display="block">
                          Sin tokens disponibles
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ya utilizaste tu token en este proyecto y no tenés una puja activa aquí.
                        </Typography>
                      </Alert>
                    </Fade>
                  )}

                  {puedeCancelar && !isCerrada && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={handleSolicitarCancelacion}
                      sx={{ fontWeight: 700 }}
                    >
                      Retirar mi puja
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* 2. TARJETA DE INFORMACIÓN DE FECHAS */}
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                  Información de la subasta
                </Typography>

                <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                      INICIO
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatFullDate(lote.fecha_inicio)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                      CIERRE
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatFullDate(lote.fecha_fin)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

          </Stack>
          {/* SECCIÓN DE UBICACIÓN */}
          {lote?.map_url && (
            <Card variant="outlined" sx={{ mt: 3, borderRadius: 4 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                <Typography variant="subtitle1" fontWeight={800}>
                  Ubicación del lote
                </Typography>

              </CardContent>
              <MapUrlIframe map_url={lote.map_url} type_proyect={false} />
            </Card>
          )}
        </Box>

        {/* Modales */}
        <TwoFactorAuthModal
          open={twoFaModal.isOpen}
          onClose={twoFaModal.close}
          onSubmit={(c) => confirmar2FA.mutate(c)}
          isLoading={confirmar2FA.isPending}
          error={twoFAError}
        />
        <PujarModal
          {...pujarModal.modalProps}
          lote={lote}
          montoLiderConocido={preciosInfo.montoLiderConocido}
          montoLider={preciosInfo.montoLider}
          miMontoActual={preciosInfo.miMonto > 0 ? preciosInfo.miMonto : undefined}
          yaParticipa={yaParticipa}
          soyGanador={winInfo.esLiderActual}
          onSuccess={invalidarTodo}
        />
        <ConfirmDialog
          controller={confirmDialog}
          onConfirm={handleConfirmarCancelacion}
          isLoading={mutationCancelar.isPending}
        />
      </Box>
    </Box>
  );
};

export default DetalleLote;
// src/features/client/pages/Lotes/DetalleLote.tsx

import {
  BookmarkBorder,
  Gavel,
  Timer
} from '@mui/icons-material';
import {
  Alert, alpha,
  Box, Button, Card, CardContent,
  Fade,
  LinearProgress,
  Paper, Portal, Skeleton, Stack, Typography, useTheme
} from '@mui/material';
import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  useSnackbar
} from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';

// Hooks Locales
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useImageLoader } from '../../hooks/useImageLoader';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import { FavoritoButton } from './components/BotonFavorito';
import { PujarModal } from './modals/PujarModal';
import { MapUrlIframe } from '@/features/admin/pages/Proyectos/modals/MapUrlIframe/MapUrlIframe';

// ─────────────────────────────────────────────
// HELPERS & SUBCOMPONENTES
// ─────────────────────────────────────────────

const formatFullDate = (dateString?: string | null) => {
  if (!dateString) return '--/--/--';
  return new Intl.DateTimeFormat(env.defaultLocale || 'es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('CERRADA');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [endDate]);

  return (
    <Typography variant="h6" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {timeLeft}
    </Typography>
  );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showInfo, showError } = useSnackbar();
  const fmt = useCurrencyFormatter();

  const pujarModal = useModal();
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const {
    isLoading: isLoadingImage,
    hasError,
    handleLoad,
    handleError
  } = useImageLoader();

  // 1. OBTENCIÓN DE DATOS
  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: async () => (await LoteService.getByIdActive(Number(id))).data as any,
    refetchInterval: 3000,
  });

  const isFetching = useIsFetching({ queryKey: ['lote', id] });
  const { estaSuscripto, tokensDisponibles } = useVerificarSuscripcion(lote?.id_proyecto);

  // 2. LÓGICA DE NEGOCIO (Win Info)
  const winInfo = useMemo(() => {
    if (!lote || !user?.id) {
      return { isWinner: false, montoFinal: 0, pujaId: null, status: 'desconocido', miPujaId: null };
    }
    const isWinner = Number(lote.id_ganador) === Number(user.id);
    const pujaId = lote.id_puja_mas_alta ?? null;
    let montoFinal = Number(lote.precio_base);
    let status = 'desconocido';
    let miPujaId = null;

    if (Array.isArray(lote.pujas) && lote.pujas.length > 0) {
      const pGanadora = lote.pujas.find((p: any) => p.id === pujaId);
      if (pGanadora) {
        montoFinal = Number(pGanadora.monto_puja);
        status = pGanadora.estado_puja;
      }
      const miPuja = lote.pujas.find((p: any) => Number(p.id_usuario) === Number(user.id) && p.estado_puja === 'activa');
      if (miPuja) miPujaId = miPuja.id;
    } else if (lote.ultima_puja) {
      montoFinal = Number(lote.ultima_puja.monto);
    }

    return { isWinner, pujaId, miPujaId, montoFinal, status };
  }, [lote, user?.id]);

  const subastaFinalizada = lote?.estado_subasta === 'finalizada';
  const yaPago = winInfo.status === 'ganadora_pagada';
  const debesPagar = winInfo.isWinner && subastaFinalizada && !yaPago;
  const puedePujar = !subastaFinalizada && estaSuscripto && (tokensDisponibles > 0 || winInfo.isWinner);
  const puedeCancelar = !subastaFinalizada && !!winInfo.miPujaId && !winInfo.isWinner;

  // 3. MUTACIONES (Las que faltaban)
  const mutationPago = useMutation({
    mutationFn: async (pujaId: number) => {
      setSelectedPujaId(pujaId);
      const response = await PujaService.initiatePayment(pujaId);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.is2FARequired) twoFaModal.open();
      else if (data.url_checkout) window.location.href = data.url_checkout;
      else showError('No se pudo procesar el link de pago.');
    },
    onError: (err: any) => showError(err.message || 'Error al iniciar pago'),
  });

  const confirmar2FA = useMutation({
    mutationFn: (code: string) => PujaService.confirmPayment2FA({ pujaId: selectedPujaId!, codigo_2fa: code }),
    onSuccess: (res: any) => { if (res.data?.url_checkout) window.location.href = res.data.url_checkout; },
    onError: () => setTwoFAError('Código incorrecto.'),
  });

  const mutationCancelar = useMutation({
    mutationFn: (pujaId: number) => PujaService.cancelMyPuja(pujaId),
    onSuccess: () => {
      showSuccess('Puja retirada. Token devuelto.');
      queryClient.invalidateQueries({ queryKey: ['lote', id] });
      confirmDialog.close();
    },
    onError: (err: any) => showError(err.message || 'Error al cancelar'),
  });

  // 4. HANDLERS
  const handlePagar = () => { if (winInfo.pujaId) mutationPago.mutate(winInfo.pujaId); };
  const handleSolicitarCancelacion = () => { confirmDialog.confirm('cancel_puja', { monto: winInfo.montoFinal }); };
  const handleConfirmarCancelacion = () => { if (winInfo.miPujaId) mutationCancelar.mutate(winInfo.miPujaId); };

  // 5. RENDERIZADO PREVENTIVO
  if (isLoading) return <Box p={4}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} /></Box>;
  if (!lote) return <Alert severity="error">Lote no encontrado</Alert>;

  const rawUrl = lote?.imagenes?.[0]?.url;
  const imagenUrl = rawUrl ? ImagenService.resolveImageUrl(rawUrl) : null;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>
      {isFetching > 0 && (
        <Portal><Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}><LinearProgress sx={{ height: 2 }} /></Box></Portal>
      )}

      <PageHeader
        title={lote.nombre_lote}
        subtitle={`ID #${lote.id} • ${lote.proyecto?.nombre_proyecto}`}
        action={<FavoritoButton loteId={lote.id} size="large" />}
      />

      {debesPagar && (
        <Fade in timeout={500}>
          <Paper sx={{ mb: 4, p: 3, bgcolor: 'success.main', color: 'white', borderRadius: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight={900}>¡GANASTE! Total: {fmt(winInfo.montoFinal)}</Typography>
              <Button variant="contained" color="inherit" onClick={handlePagar} sx={{ color: 'success.main', fontWeight: 900 }}>PAGAR AHORA</Button>
            </Stack>
          </Paper>
        </Fade>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.8fr 1.2fr' }, gap: 4 }}>
        <Box>
          <Paper variant="outlined" sx={{ height: 450, borderRadius: 4, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
            {!imagenUrl ? (
              <Stack alignItems="center" color="text.disabled"><BookmarkBorder sx={{ fontSize: 60 }} /><Typography>SIN IMAGEN</Typography></Stack>
            ) : (
              <>
                {isLoadingImage && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, zIndex: 1 }} />}
                <Box
                  component="img"
                  src={hasError ? '/assets/placeholder.jpg' : imagenUrl}
                  onLoad={handleLoad}
                  onError={handleError}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', opacity: isLoadingImage ? 0 : 1 }}
                />
              </>
            )}
          </Paper>
          <Card variant="outlined" sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">INICIO: {formatFullDate(lote.fecha_inicio)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">CIERRE: {formatFullDate(lote.fecha_fin)}</Typography>
            </CardContent>
          </Card>
            <MapUrlIframe map_url={lote.map_url} ></MapUrlIframe>
        </Box>

        <Box>
          <Card variant="outlined" sx={{ borderRadius: 4, position: 'sticky', top: 100 }}>
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Stack direction="row" justifyContent="center" spacing={1} color="primary.main">
                <Timer fontSize="small" />
                <CountdownTimer endDate={lote.fecha_fin} />
              </Stack>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="overline">Oferta Actual</Typography>
              <Typography variant="h3" fontWeight={900} color="success.main" gutterBottom>{fmt(winInfo.montoFinal)}</Typography>

              <Stack spacing={2} mt={4}>
                <Button variant="contained" fullWidth size="large" onClick={pujarModal.open} disabled={!puedePujar} startIcon={<Gavel />} sx={{ py: 2, fontWeight: 900 }}>
                  {winInfo.isWinner ? 'MEJORAR MI OFERTA' : 'OFERTAR AHORA'}
                </Button>
                {puedeCancelar && (
                  <Button variant="text" color="error" onClick={handleSolicitarCancelacion}>Retirar mi puja</Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <TwoFactorAuthModal open={twoFaModal.isOpen} onClose={twoFaModal.close} onSubmit={(c) => confirmar2FA.mutate(c)} isLoading={confirmar2FA.isPending} error={twoFAError} />
      <PujarModal {...pujarModal.modalProps} lote={lote} yaParticipa={!!winInfo.miPujaId} soyGanador={winInfo.isWinner} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lote', id] })} />
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmarCancelacion} isLoading={mutationCancelar.isPending} />
    </Box>
  );
};

export default DetalleLote;
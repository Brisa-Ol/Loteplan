// src/features/client/pages/Lotes/DetalleLote.tsx

import {
  AccountBalanceWallet,
  ArrowBack, CalendarMonth,
  Cancel,
  EmojiEvents, Gavel,
  InfoOutlined, Payment, ReceiptLong, Timer,
  BookmarkBorder, // 👈 Ícono para el estado sin imagen
} from '@mui/icons-material';
import {
  Alert, alpha, Avatar, Box, Button, Card, CardContent, Chip,
  CircularProgress, Divider, Fade, IconButton, LinearProgress,
  Paper, Portal, Skeleton, Stack, Typography, useTheme,
} from '@mui/material';
import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImagenService from '@/core/api/services/imagen.service';
import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import { useAuth } from '@/core/context/AuthContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import { FavoritoButton } from './components/BotonFavorito';
import { PujarModal } from './modals/PujarModal';
import { ConfirmDialog, PageHeader, useConfirmDialog, useModal, useSnackbar } from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import { useImageLoader } from '../../hooks';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const formatFullDate = (dateString?: string | null) => {
  if (!dateString) return '--/--/--';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
};

// ─────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────

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
  const { showSuccess, showError } = useSnackbar();
  const fmt = useCurrencyFormatter();

  const pujarModal = useModal();
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();

  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // Hook para controlar la carga de la imagen
  const { isLoading: isLoadingStatus, hasError, handleLoad, handleError } = useImageLoader();

  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: async () => (await LoteService.getByIdActive(Number(id))).data as any,
    refetchInterval: 3000,
  });

  const isFetching = useIsFetching({ queryKey: ['lote', id] });
  const { estaSuscripto, tokensDisponibles } = useVerificarSuscripcion(lote?.id_proyecto);

  // ─────────────────────────────────────────────
  // LÓGICA DE IMAGEN PREVENTIVA
  // ─────────────────────────────────────────────
  const rawUrl = lote?.imagenes?.[0]?.url;
  const hasNoImageRecord = !rawUrl || rawUrl.trim() === '';

  const imagenUrl = useMemo(() => {
    if (hasNoImageRecord) return null;
    return ImagenService.resolveImageUrl(rawUrl);
  }, [rawUrl, hasNoImageRecord]);

  const subastaFinalizada = lote?.estado_subasta === 'finalizada';

  const winInfo = useMemo(() => {
    if (!lote || !user?.id) {
      return { isWinner: false, montoFinal: 0, pujaId: null, status: 'desconocido', diferencia: 0, miPujaId: null };
    }

    const isWinner = Number(lote.id_ganador) === Number(user.id);
    const pujaId: number | null = lote.id_puja_mas_alta ?? null;

    let montoFinal = Number(lote.precio_base);
    let status = 'desconocido';
    let miPujaId: number | null = null;

    if (Array.isArray(lote.pujas) && lote.pujas.length > 0) {
      const pujaGanadora = lote.pujas.find((p: any) => p.id === pujaId);
      if (pujaGanadora) {
        montoFinal = Number(pujaGanadora.monto_puja);
        status = pujaGanadora.estado_puja ?? 'desconocido';
      }
      const miPuja = lote.pujas.find(
        (p: any) => Number(p.id_usuario) === Number(user.id) && p.estado_puja === 'activa',
      );
      if (miPuja) miPujaId = miPuja.id;
    } else if (lote.ultima_puja) {
      montoFinal = Number(lote.ultima_puja.monto);
    }

    return { isWinner, pujaId, miPujaId, montoFinal, diferencia: montoFinal - Number(lote.precio_base), status };
  }, [lote, user?.id]);

  const yaPago = winInfo.status === 'ganadora_pagada';
  const debesPagar = winInfo.isWinner && subastaFinalizada && !yaPago;
  const puedePujar = !subastaFinalizada && estaSuscripto && (tokensDisponibles > 0 || winInfo.isWinner);
  const puedeCancelar = !subastaFinalizada && !!winInfo.miPujaId && !winInfo.isWinner;

  // ... (Mutaciones mutationPago, confirmar2FA, mutationCancelar se mantienen igual)
  const mutationPago = useMutation({
    mutationFn: async (pujaId: number) => {
      setSelectedPujaId(pujaId);
      const response = await PujaService.initiatePayment(pujaId);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.is2FARequired) { twoFaModal.open(); } 
      else if (data.url_checkout) { window.location.href = data.url_checkout; } 
      else { showError('No se recibió una URL de pago válida.'); }
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || err.message || 'Error al iniciar el proceso de pago');
    },
  });

  const confirmar2FA = useMutation({
    mutationFn: (code: string) => PujaService.confirmPayment2FA({ pujaId: selectedPujaId!, codigo_2fa: code }),
    onSuccess: (res: any) => { if (res.data?.url_checkout) window.location.href = res.data.url_checkout; },
    onError: () => setTwoFAError('Código inválido. Intentá nuevamente.'),
  });

  const mutationCancelar = useMutation({
    mutationFn: (pujaId: number) => PujaService.cancelMyPuja(pujaId),
    onSuccess: () => {
      showSuccess('Tu puja fue retirada exitosamente. Tu token ha sido devuelto.');
      queryClient.invalidateQueries({ queryKey: ['lote', id] });
      confirmDialog.close();
    },
    onError: (err: any) => { showError(err.response?.data?.message || err.message || 'Error al retirar la puja'); },
  });

  const handlePagar = () => { if (!winInfo.pujaId) { showError('No se encontró la puja a pagar.'); return; } mutationPago.mutate(winInfo.pujaId); };
  const handleSolicitarCancelacion = () => { confirmDialog.confirm('cancel_puja', { monto_puja: winInfo.montoFinal, lote: { nombre_lote: lote?.nombre_lote } }); };
  const handleConfirmarCancelacion = () => { if (!winInfo.miPujaId) return; mutationCancelar.mutate(winInfo.miPujaId); };

  if (isLoading) { return <Box p={4}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} /></Box>; }
  if (!lote) { return <Alert severity="error">Lote no disponible</Alert>; }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>
      {isFetching > 0 && (
        <Portal><Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}><LinearProgress color="primary" sx={{ height: 3 }} /></Box></Portal>
      )}

      {/* ── Cabecera ── */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', left: 0, top: 10, zIndex: 10 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} color="inherit" sx={{ fontWeight: 700 }}>Volver</Button>
        </Box>
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ border: '1px solid', borderColor: 'divider' }}><ArrowBack /></IconButton>
        </Box>
        <PageHeader
          title={lote.nombre_lote}
          subtitle={`Subasta de activo inmobiliario • ID #${lote.id}`}
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={subastaFinalizada ? 'CONCLUIDA' : 'EN VIVO'} color={subastaFinalizada ? 'default' : 'error'} sx={{ fontWeight: 800, fontSize: '0.9rem', py: 2.5 }} />
              <FavoritoButton loteId={lote.id} size="large" />
            </Stack>
          }
        />
      </Box>

      {/* ── Banner ganador ── */}
      {debesPagar && (
        <Fade in timeout={700}>
          <Paper elevation={6} sx={{ mb: 4, p: { xs: 3, md: 4 }, borderRadius: 4, background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`, color: 'white', border: '2px solid white' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80 }}><EmojiEvents sx={{ fontSize: 48 }} /></Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={900}>¡SUBASTA GANADA!</Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Has asegurado el {lote.nombre_lote}.</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>Total a liquidar: {fmt(winInfo.montoFinal)}</Typography>
                </Box>
              </Stack>
              <Button variant="contained" color="inherit" size="large" onClick={handlePagar} disabled={mutationPago.isPending} startIcon={mutationPago.isPending ? <CircularProgress size={24} color="inherit" /> : <Payment />} sx={{ color: 'success.main', fontWeight: 900, px: 6, py: 2, fontSize: '1.1rem' }}>
                {mutationPago.isPending ? 'PROCESANDO...' : 'CONFIRMAR Y PAGAR'}
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}

      {/* ── Grid principal ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.8fr 1.2fr' }, gap: 4 }}>
        {/* Columna izquierda: imagen */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4, bgcolor: 'grey.100',
              height: { xs: 350, md: 550 }, overflow: 'hidden',
              border: '1px solid', borderColor: 'divider',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {hasNoImageRecord ? (
              <Stack alignItems="center" spacing={2} sx={{ color: 'text.disabled' }}>
                <BookmarkBorder sx={{ fontSize: 80, opacity: 0.3 }} />
                <Typography variant="h6" fontWeight={700}>IMAGEN NO DISPONIBLE</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>Este activo no posee registros fotográficos actuales.</Typography>
              </Stack>
            ) : (
              <>
                {isLoadingStatus && <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />}
                <Box
                  component="img"
                  src={hasError ? '/assets/placeholder-lote.jpg' : imagenUrl!}
                  alt={lote.nombre_lote}
                  onLoad={handleLoad}
                  onError={handleError}
                  sx={{ 
                    width: '100%', height: '100%', objectFit: 'contain',
                    opacity: isLoadingStatus ? 0 : 1, transition: 'opacity 0.4s ease-in-out'
                  }}
                />
              </>
            )}
          </Paper>

          <Card variant="outlined" sx={{ mt: 3, borderRadius: 3, border: 'none', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} display="flex" alignItems="center" gap={1} mb={2}><CalendarMonth color="primary" /> Historial de Subasta</Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">Inicio: {formatFullDate(lote.fecha_inicio)}</Typography>
                <Typography variant="body2" color="text.secondary">Cierre: {formatFullDate(lote.fecha_fin)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Columna derecha: panel de acción */}
        <Box>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100, overflow: 'hidden' }}>
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: alpha(subastaFinalizada ? theme.palette.success.main : theme.palette.error.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
              {!subastaFinalizada ? (
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} color="error.main"><Timer /><CountdownTimer endDate={lote.fecha_fin} /></Stack>
              ) : (
                <Typography variant="h6" fontWeight={900} color={winInfo.isWinner ? 'success.main' : 'text.secondary'}>{winInfo.isWinner ? '¡ERES EL GANADOR!' : 'SUBASTA FINALIZADA'}</Typography>
              )}
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2} sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 4 }}>
                <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Precio de Apertura:</Typography><Typography variant="body2" fontWeight={700}>{fmt(lote.precio_base)}</Typography></Box>
                {winInfo.diferencia > 0 && (
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="primary.main">Oferta Adicional:</Typography><Typography variant="body2" fontWeight={700} color="primary.main">+{fmt(winInfo.diferencia)}</Typography></Box>
                )}
                <Divider />
                <Box display="flex" justifyContent="space-between"><Typography variant="subtitle1" fontWeight={900}>TOTAL A PAGAR:</Typography><Typography variant="h5" fontWeight={900} color="success.main">{fmt(winInfo.montoFinal)}</Typography></Box>
              </Stack>

              <Stack spacing={2}>
                {!subastaFinalizada ? (
                  <>
                    <Button variant="contained" fullWidth size="large" onClick={pujarModal.open} disabled={!puedePujar} startIcon={<Gavel />} sx={{ py: 2, fontWeight: 900 }}>{winInfo.isWinner ? 'MEJORAR MI OFERTA' : 'PUJAR AHORA'}</Button>
                    {puedeCancelar && (
                      <Button variant="outlined" color="error" fullWidth size="large" onClick={handleSolicitarCancelacion} disabled={mutationCancelar.isPending} startIcon={mutationCancelar.isPending ? <CircularProgress size={18} color="inherit" /> : <Cancel />} sx={{ py: 1.5, fontWeight: 700 }}>{mutationCancelar.isPending ? 'RETIRANDO...' : 'RETIRAR MI PUJA'}</Button>
                    )}
                  </>
                ) : debesPagar ? (
                  <Button variant="contained" color="success" fullWidth size="large" onClick={handlePagar} disabled={mutationPago.isPending} startIcon={mutationPago.isPending ? <CircularProgress size={20} color="inherit" /> : <ReceiptLong />} sx={{ py: 2.5, fontWeight: 900 }}>{mutationPago.isPending ? 'ABRIENDO PAGO...' : 'PAGAR Y ADJUDICAR'}</Button>
                ) : yaPago ? (
                  <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>LOTE ADJUDICADO Y PAGADO</Alert>
                ) : (
                  <Alert severity="info" icon={<InfoOutlined />} sx={{ borderRadius: 2 }}>La subasta ha concluido.</Alert>
                )}
              </Stack>

              {Number(lote.excedente_visualizacion) > 0 && (
                <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'info.light', bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}><AccountBalanceWallet fontSize="small" color="info" /><Typography variant="caption" fontWeight={900} color="info.main">SALDO A FAVOR GENERADO</Typography></Stack>
                  <Typography variant="h6" fontWeight={800}>{fmt(lote.excedente_visualizacion)}</Typography>
                  <Typography variant="caption" color="text.secondary">El excedente de tu oferta queda acreditado en tu cuenta.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Modales */}
      <TwoFactorAuthModal open={twoFaModal.isOpen} onClose={twoFaModal.close} onSubmit={(code) => confirmar2FA.mutate(code)} isLoading={confirmar2FA.isPending} error={twoFAError} />
      <PujarModal {...pujarModal.modalProps} lote={lote} yaParticipa={!!winInfo.miPujaId} soyGanador={winInfo.isWinner} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lote', id] })} />
      <ConfirmDialog controller={confirmDialog} onConfirm={handleConfirmarCancelacion} isLoading={mutationCancelar.isPending} />
    </Box>
  );
};

export default DetalleLote;
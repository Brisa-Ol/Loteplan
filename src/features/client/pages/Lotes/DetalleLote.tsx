// src/features/client/pages/Lotes/DetalleLote.tsx

import {
  AccessTime, ArrowBack, CheckCircle, EmojiEvents, Flag, 
  Gavel, History, InfoOutlined, LocationOn, Payment, 
  Timer, TrendingUp, Update, VerifiedUser
} from '@mui/icons-material';
import {
  Alert, alpha, Avatar, Box, Button, Card, CardContent, Chip,
  CircularProgress, Divider, Fade, IconButton, LinearProgress,
  Paper, Portal, Skeleton, Stack, Typography, useTheme
} from '@mui/material';
import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Servicios y Hooks
import ImagenService from '@/core/api/services/imagen.service';
import LoteService from '@/core/api/services/lote.service';
import PujaService from '@/core/api/services/puja.service';
import { useAuth } from '@/core/context/AuthContext';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';

// Componentes
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { FavoritoButton } from '@/shared/components/ui/buttons/BotonFavorito';
import { PujarModal } from './modals/PujarModal';

// --- SUB-COMPONENTES ---

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(endDate).getTime() - new Date().getTime();
      if (diff <= 0) { setTimeLeft("SUBASTA CERRADA"); clearInterval(timer); }
      else {
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  return <Typography variant="h6" fontWeight={900} sx={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</Typography>;
};

const DetalleLote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter();

  const pujarModal = useModal();
  const twoFaModal = useModal();
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const isFetching = useIsFetching({ queryKey: ['lote', id] });
  const { data: loteData, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: async () => (await LoteService.getByIdActive(Number(id))).data,
    refetchInterval: 3000,
  });

  const lote = loteData as any;
 const { estaSuscripto, tokensDisponibles } = useVerificarSuscripcion(lote?.id_proyecto);

  // 🚀 LÓGICA DE GANADOR Y PAGOS
  const miEstadoPuja = useMemo(() => {
    if (!lote?.pujas || !user?.id) return null;
    const misPujas = lote.pujas.filter((p: any) => String(p.id_usuario) === String(user.id));
    if (misPujas.length === 0) return null;
    
    const miUltimaPuja = [...misPujas].sort((a, b) => Number(b.monto_puja) - Number(a.monto_puja))[0];
    const esGanadorActual = String(lote.id_ganador) === String(user.id);
    
    return { 
      monto: Number(miUltimaPuja.monto_puja), 
      esPrimero: esGanadorActual,
      estado: miUltimaPuja.estado_puja,
      id: miUltimaPuja.id,
      vencimiento: miUltimaPuja.fecha_vencimiento_pago
    };
  }, [lote, user]);

  const subastaFinalizada = lote?.estado_subasta === 'finalizada';

  // 💳 PROCESO DE PAGO
  const mutationPago = useMutation({
    mutationFn: (pujaId: number) => {
      setSelectedPujaId(pujaId);
      return PujaService.initiatePayment(pujaId);
    },
    onSuccess: (res: any) => {
      if (res.data?.is2FARequired) twoFaModal.open();
      else if (res.data?.url_checkout) window.location.href = res.data.url_checkout;
    },
    onError: (err: any) => showError(err.message || 'No se pudo iniciar el pago')
  });

  const confirmar2FA = useMutation({
    mutationFn: (code: string) => PujaService.confirmPayment2FA({ pujaId: selectedPujaId!, codigo_2fa: code }),
    onSuccess: (res: any) => { if (res.data?.url_checkout) window.location.href = res.data.url_checkout; },
    onError: (err: any) => setTwoFAError(err.message || "Código incorrecto")
  });

  const formatAuctionDate = (dateString?: string) => {
    if (!dateString) return '--/--';
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
  };

  if (isLoading) return <Box p={4}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} /></Box>;
  if (!lote) return <Alert severity="error">Lote no disponible</Alert>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 }, pb: 12 }}>
      {isFetching > 0 && <Portal><Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}><LinearProgress color="primary" sx={{ height: 4 }} /></Box></Portal>}

      {/* 🏆 CARTEL DE GANADOR (Prominente) */}
      {miEstadoPuja?.esPrimero && subastaFinalizada && miEstadoPuja.estado !== 'ganadora_pagada' && (
        <Fade in timeout={800}>
          <Paper elevation={6} sx={{ 
            mb: 4, p: 4, borderRadius: 4, 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, 
            color: 'white', position: 'relative', overflow: 'hidden'
          }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80, border: '4px solid rgba(255,255,255,0.3)' }}>
                  <EmojiEvents sx={{ fontSize: 48 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={900}>¡FELICITACIONES!</Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>Has ganado la subasta por este lote.</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', px: 1, borderRadius: 1, display: 'inline-block' }}>
                    Monto final: {formatCurrency(miEstadoPuja.monto)}
                  </Typography>
                </Box>
              </Stack>
              <Button 
                variant="contained" color="inherit" size="large"
                sx={{ color: 'success.main', fontWeight: 900, px: 6, py: 2, fontSize: '1.1rem', borderRadius: 2, boxShadow: 3 }}
                onClick={() => mutationPago.mutate(miEstadoPuja.id)}
                disabled={mutationPago.isPending}
                startIcon={mutationPago.isPending ? <CircularProgress size={24} color="inherit" /> : <Payment />}
              >
                PROCEDER AL PAGO
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}

      {/* CABECERA */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate(-1)} sx={{ border: '1px solid', borderColor: 'divider' }}><ArrowBack /></IconButton>
        <Box flex={1}>
          <Typography variant="h4" fontWeight={900}>{lote.nombre_lote}</Typography>
          <Chip label={subastaFinalizada ? "SUBASTA CERRADA" : "EN VIVO"} color={subastaFinalizada ? "default" : "error"} size="small" sx={{ fontWeight: 800 }} />
        </Box>
        <FavoritoButton loteId={lote.id} size="large" />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.8fr 1.2fr' }, gap: 4 }}>
        <Box>
          <Paper elevation={0} sx={{ position: 'relative', borderRadius: 4, bgcolor: 'secondary.main', height: { xs: 350, md: 550 }, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box component="img" src={ImagenService.resolveImageUrl(lote.imagenes?.[0]?.url)} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Paper>
        </Box>

        <Box>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 100, overflow: 'hidden' }}>
            
            <Box sx={{ p: 3, bgcolor: alpha(subastaFinalizada ? theme.palette.action.disabled : theme.palette.error.main, 0.05), borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
               {!subastaFinalizada ? (
                 <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ color: 'error.main' }}>
                   <Timer /><CountdownTimer endDate={lote.fecha_fin} />
                 </Stack>
               ) : (
                 <Typography variant="h6" fontWeight={900} color="text.secondary">SUBASTA FINALIZADA</Typography>
               )}
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} mb={4}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
                  <Typography variant="body1" fontWeight={800}>{formatCurrency(lote.precio_base)}</Typography>
                </Box>

                {miEstadoPuja && (
                  <Paper variant="outlined" sx={{ 
                    p: 2, borderRadius: 2, 
                    bgcolor: miEstadoPuja.esPrimero ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.warning.main, 0.05),
                    borderColor: miEstadoPuja.esPrimero ? 'success.main' : 'warning.main',
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" fontWeight={900} color={miEstadoPuja.esPrimero ? "success.dark" : "warning.dark"}>MI OFERTA</Typography>
                        <Typography variant="h5" fontWeight={900}>{formatCurrency(miEstadoPuja.monto)}</Typography>
                      </Box>
                      <Chip label={miEstadoPuja.esPrimero ? "LÍDER" : "SUPERADA"} color={miEstadoPuja.esPrimero ? "success" : "warning"} size="small" sx={{ fontWeight: 900 }} />
                    </Stack>
                  </Paper>
                )}

                <Box sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px dashed', borderColor: 'primary.main' }}>
                  <Typography variant="overline" color="primary.main" fontWeight={900}>{subastaFinalizada ? 'PRECIO FINAL ADJUDICADO' : 'OFERTA GANADORA ACTUAL'}</Typography>
                  <Typography variant="h3" fontWeight={900} color="primary.main">{formatCurrency(lote.ultima_puja?.monto || lote.precio_base)}</Typography>
                </Box>
              </Stack>

             <Stack spacing={2}>
                {!subastaFinalizada ? (
                  <>
                    {/* 🚀 USO DE LAS VARIABLES PARA EVITAR EL ERROR Y VALIDAR */}
                    {!estaSuscripto && (
                        <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
                            Requiere suscripción activa para participar.
                        </Alert>
                    )}

                    {estaSuscripto && tokensDisponibles === 0 && !miEstadoPuja && (
                        <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>
                            No tienes tokens disponibles para este proyecto.
                        </Alert>
                    )}

                    <Button 
                      variant="contained" fullWidth size="large" onClick={() => pujarModal.open()}
                      sx={{ py: 2, fontWeight: 900, bgcolor: miEstadoPuja?.esPrimero ? 'success.main' : 'primary.main' }}
                      startIcon={<Gavel />}
                      // ✅ Aquí se usan para deshabilitar el botón si es necesario
                      disabled={!estaSuscripto || (tokensDisponibles === 0 && !miEstadoPuja)}
                    >
                      {miEstadoPuja?.esPrimero ? 'MEJORAR MI LIDERAZGO' : 'PUJAR AHORA'}
                    </Button>
                  </>
                ) : (
                  miEstadoPuja?.esPrimero && miEstadoPuja.estado === 'ganadora_pendiente' ? (
                    <Button 
                      variant="contained" color="success" fullWidth size="large"
                      onClick={() => mutationPago.mutate(miEstadoPuja.id)}
                      sx={{ py: 2.5, fontWeight: 900, boxShadow: 4 }} startIcon={<Payment />}
                    >
                      PAGAR Y ADJUDICAR MI LOTE
                    </Button>
                  ) : (
                    miEstadoPuja?.estado === 'ganadora_pagada' ? (
                      <Alert severity="success" variant="filled" sx={{ borderRadius: 2, fontWeight: 700 }}>LOTE ADJUDICADO Y PAGADO</Alert>
                    ) : (
                      <Alert severity="info" icon={<InfoOutlined />}>La subasta ha concluido.</Alert>
                    )
                  )
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FA.mutate(code)} 
        isLoading={confirmar2FA.isPending} 
        error={twoFAError} 
      />
      
      <PujarModal 
        {...pujarModal.modalProps} lote={lote} yaParticipa={!!miEstadoPuja} soyGanador={miEstadoPuja?.esPrimero} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lote', id] })} 
      />
    </Box>
  );
};

export default DetalleLote;
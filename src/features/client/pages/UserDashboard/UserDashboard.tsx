import {
  AccountBalanceWallet,
  ArrowForward,
  Assessment,
  CheckCircle,
  ChevronRight,
  Close,
  EmojiEvents,
  Gavel,
  MonetizationOn,
  ReceiptLong,
  Schedule,
  Security,
  TrendingUp,
  VerifiedUser,
  Warning
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card, CardContent,
  Chip,
  Container,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler';
import { useDashboardStats } from '../../hooks/useDashboardStats';

// Servicios
import { getAllAdhesionsByUser } from '@/core/api/services/adhesion.service';
import InversionService from '@/core/api/services/inversion.service';
import kycService from '@/core/api/services/kyc.service';
import PagoService from '@/core/api/services/pago.service';
import PujaService from '@/core/api/services/puja.service';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';
import styles from './UserDashboard.module.css';

// 🛠 Utility: Calcular días restantes para vencimientos
const calculateDaysRemaining = (dateString?: string): number => {
  if (!dateString) return 90;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, days);
};

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [showKycAprobado, setShowKycAprobado] = React.useState(() => {
    return sessionStorage.getItem('kyc_aprobado_visto') !== 'true';
  });

  // ========== 1. DATA FETCHING ==========
  const { data: resumenes, isLoading: loadingResumenes } = useQuery({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });
  const { data: suscripciones, isLoading: loadingSuscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });
  const { data: inversiones, isLoading: loadingInversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data
  });
  const { data: pagos, isLoading: loadingPagos } = useQuery({
    queryKey: ['misPagosPendientes'],
    queryFn: async () => (await PagoService.getMyPayments())
  });
  const { data: adhesiones, isLoading: loadingAdhesiones } = useQuery({
    queryKey: ['misAdhesionesDashboard'],
    queryFn: async () => (await getAllAdhesionsByUser()).data.data
  });
  const { data: misPujas } = useQuery({
    queryKey: ['misPujasCheck'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });
  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus
  });

  const estadoKyc = kycStatus?.estado_verificacion;
  const isLoading = loadingResumenes || loadingSuscripciones || loadingInversiones || loadingPagos || loadingAdhesiones;

  // ========== 2. LÓGICA DE NEGOCIO ========== 
  const stats = useDashboardStats({ resumenes, suscripciones, inversiones, pagos });

  // Lógica de Pagos Normales
  const proximoPagoReal = pagos?.filter(p =>
    p.estado_pago === 'pendiente' && new Date(p.fecha_vencimiento) >= new Date()
  ).sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];

  // Lógica de Adhesiones
  const proximaAdhesionReal = useMemo(() => {
    if (!adhesiones) return null;
    const pendientes = adhesiones.flatMap(a =>
      (a.pagos || []).filter(p => p.estado === 'pendiente' && new Date(p.fecha_vencimiento) >= new Date())
    );
    if (pendientes.length === 0) return null;
    return pendientes.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];
  }, [adhesiones]);

  // Consolidación de Mora (Suma mensualidades + adhesiones vencidas)
  const adhesionesVencidas = useMemo(() => {
    if (!adhesiones) return [];
    return adhesiones.flatMap(a => (a.pagos || []).filter(p => p.estado === 'vencido'));
  }, [adhesiones]);

  const cantidadTotalMora = stats.cantidadPagosVencidos + adhesionesVencidas.length;
  const totalDeudaVencida =
    stats.pagosVencidos.reduce((acc, p) => acc + Number(p.monto), 0) +
    adhesionesVencidas.reduce((acc, p) => acc + Number(p.monto), 0);

  const isNewUser = !isLoading && resumenes?.length === 0 && suscripciones?.length === 0;

  // Lógica de Pujas Ganadas
  const pujasGanadoras = misPujas?.filter(p => p.estado_puja === 'ganadora_pendiente') || [];
  const cantidadGanadas = pujasGanadoras.length;
  const pujasConDiasRestantes = pujasGanadoras.map(puja => ({
    ...puja,
    diasRestantes: calculateDaysRemaining(puja.fecha_vencimiento_pago)
  })).sort((a, b) => a.diasRestantes - b.diasRestantes);

  // ========== 3. SUB-COMPONENTES ==========
  const NewUserWelcome = () => (
    <Box>
      <Paper elevation={0} sx={{
        p: { xs: 4, md: 6 }, borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
        border: `2px solid ${theme.palette.primary.main}`, mb: 6, textAlign: { xs: 'center', md: 'left' }
      }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={4}>
          <Box flex={1}>
            <Chip label="Comienza hoy" color="primary" size="small" sx={{ mb: 2, fontWeight: 700 }} />
            <Typography variant="h3" fontWeight={800} gutterBottom>¡Es hora de hacer crecer tu capital! 🚀</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>Aún no tienes inversiones activas. Explora nuestros proyectos y elige tu camino.</Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/proyectos/rol-seleccion')} endIcon={<ArrowForward />}>Explorar Proyectos</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>

      {/* ========== HEADER GLOBAL ========== */}
      <Box sx={{
        bgcolor: 'background.paper', pt: { xs: 4, md: 5 }, pb: { xs: 4, md: 8 }, px: { xs: 2, md: 4 },
        backgroundImage: `radial-gradient(at top right, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`
      }}>
        <Container maxWidth={false} sx={{ maxWidth: '1400px' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h1" fontWeight={800} color="text.primary">Hola, {user?.nombre} 👋</Typography>
              <Typography variant="h6" color="text.secondary">
                {isNewUser ? "Bienvenido a Nectárea." : "Este es el resumen de tu actividad financiera."}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: '1400px', mt: -6 }}>
        <QueryHandler isLoading={isLoading} error={null}>
          <Box mb={4}>
            {/* ========== ALERTA KYC RECHAZADO ========== */}
            {estadoKyc === 'RECHAZADA' && (
              <Fade in={true}>
                <Box
                  sx={{
                    mb: isNewUser ? 4 : 0,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'error.main',
                    bgcolor: '#fdecea',
                    boxShadow: `0 0 24px ${alpha(theme.palette.error.main, 0.15)}`,
                    p: { xs: 2, sm: 3 },
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#FFFFFF', color: 'error.main', width: 48, height: 48 }}>
                        <Warning />
                      </Avatar>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'error.main', fontWeight: 800, letterSpacing: 1.2, lineHeight: 1, display: 'block', mb: 0.5 }}>
                          ATENCIÓN REQUERIDA
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#000000' }}>
                          Tu verificación KYC fue rechazada
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555555', mt: 0.5 }}>
                          Motivo: {kycStatus?.motivo_rechazo || 'La documentación enviada no es válida o es ilegible.'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => navigate('/client/verificacion')}
                      sx={{ fontWeight: 800, px: 3, borderRadius: 2, textTransform: 'none' }}
                    >
                      Corregir Documentación
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            )}

            {/* ========== ALERTA KYC APROBADO ========== */}
            {estadoKyc === 'APROBADA' && showKycAprobado && (
              <Fade in={true}>
                <Box
                  sx={{
                    mb: isNewUser ? 4 : 0,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'success.main',
                    bgcolor: '#a9e9a4',
                    boxShadow: `0 0 24px ${alpha(theme.palette.success.main, 0.15)}`,
                    p: { xs: 2, sm: 3 },
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#FFFFFF', color: 'success.main', width: 48, height: 48 }}>
                        <VerifiedUser />
                      </Avatar>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 800, letterSpacing: 1.2, lineHeight: 1, display: 'block', mb: 0.5 }}>
                          IDENTIDAD VERIFICADA
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#000000' }}>
                          ¡Tu cuenta fue verificada exitosamente!
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#555555', mt: 0.5 }}>
                          Ya podés invertir y participar en subastas sin restricciones.
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      onClick={() => {
                        sessionStorage.setItem('kyc_aprobado_visto', 'true');
                        setShowKycAprobado(false);
                      }}
                      sx={{ color: 'success.dark', alignSelf: { xs: 'flex-end', sm: 'center' } }}
                    >
                      <Close />
                    </IconButton>
                  </Stack>
                </Box>
              </Fade>
            )}
          </Box>

          {/* AHORA SÍ, LA CONDICIÓN DE USUARIO NUEVO O EXPERIMENTADO */}
          {isNewUser ? <NewUserWelcome /> : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 4, alignItems: 'start' }}>
              <Box>

                {/* ========== ALERTA DE SUBASTA GANADA ========== */}
                {cantidadGanadas > 0 && (
                  <Fade in={true}>
                    <Box
                      sx={{
                        mb: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'success.main',
                        bgcolor: '#a9e9a4',
                        boxShadow: `0 0 24px ${alpha(theme.palette.success.main, 0.20)}`,
                        p: { xs: 2, sm: 3 },
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#FFFFFF', color: '#efbf04 ', width: 48, height: 48 }}>
                            <EmojiEvents />
                          </Avatar>
                          <Box>
                            <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 800, letterSpacing: 1.2, lineHeight: 1, display: 'block', mb: 0.5 }}>
                              SUBASTA FINALIZADA
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: '#000000' }}>
                              <Box component="span" sx={{ color: '#F57C00' }}>¡Felicitaciones!</Box> Ganaste {cantidadGanadas} subasta{cantidadGanadas !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/client/finanzas/pujas')}
                          sx={{
                            color: '#fff', borderColor: '#E07A4D', bgcolor: '#E07A4D',
                            fontWeight: 800, px: 3, borderRadius: 2, textTransform: 'none',
                            '&:hover': { bgcolor: '#A34D26', borderColor: 'success.main' }
                          }}
                        >
                          Gestionar pago
                        </Button>
                      </Stack>
                      <Stack spacing={0} sx={{ bgcolor: '#ECECEC', borderRadius: 2, overflow: 'hidden' }}>
                        {pujasConDiasRestantes.map((puja, index) => {
                          const isExpired = puja.diasRestantes <= 0;
                          const isUrgent = puja.diasRestantes > 0 && puja.diasRestantes <= 14;
                          const colorMain = isExpired ? theme.palette.error.main : (isUrgent ? '#E65100' : theme.palette.success.main);
                          const chipBg = alpha(colorMain, 0.1);

                          return (
                            <Stack
                              key={puja.id || index}
                              direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}
                              sx={{
                                px: { xs: 2, sm: 3 }, py: 1.5,
                                borderBottom: index < pujasConDiasRestantes.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colorMain }} />
                                <Typography variant="body1" sx={{ color: '#000000', fontWeight: 800 }}>
                                  {puja.lote?.nombre_lote || `lote ${puja.id}`}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555555', fontWeight: 500, ml: 1 }}>
                                  Monto a Pagar: <Box component="span" sx={{ color: '#111111', fontWeight: 800 }}>${Number(puja.monto_puja || 0).toLocaleString('es-AR')}</Box>
                                </Typography>
                              </Stack>
                              <Chip
                                label={isExpired ? "Plazo vencido" : `${puja.diasRestantes} días restantes`}
                                size="small"
                                icon={<Schedule style={{ fontSize: 16 }} />}
                                sx={{
                                  fontWeight: 800, bgcolor: chipBg, color: colorMain, border: `1px solid ${colorMain}`,
                                  '& .MuiChip-icon': { color: colorMain },
                                }}
                              />
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Fade>
                )}

                {/* ========== GRID DE ESTADO FINANCIERO (3 COLUMNAS) ========== */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 5 }}>

                  {/* --- TARJETA 1: Estado de Cuenta (MORA) --- */}
                  <Card elevation={0} sx={{
                    height: '100%', borderRadius: 3, border: '1px solid',
                    borderColor: cantidadTotalMora > 0 ? 'error.main' : 'success.main',
                    bgcolor: cantidadTotalMora > 0 ? 'error.light' : 'success.light',
                  }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Avatar sx={{ bgcolor: cantidadTotalMora > 0 ? 'error.main' : 'success.main', color: 'white' }}>
                            {cantidadTotalMora > 0 ? <Warning /> : <CheckCircle />}
                          </Avatar>
                          <Chip
                            label={cantidadTotalMora > 0 ? "EN MORA" : "AL DÍA"}
                            color={cantidadTotalMora > 0 ? "error" : "success"}
                            size="small"
                            sx={{ fontWeight: 800 }}
                          />
                        </Stack>
                        <Box>
                          <Typography variant="overline" color="text.secondary" fontWeight={700}>Total Vencido</Typography>
                          <Typography variant="h3" fontWeight={800} color={cantidadTotalMora > 0 ? "error.main" : "success.main"}>
                            ${totalDeudaVencida.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color={cantidadTotalMora > 0 ? "error" : "success"}
                          fullWidth
                          onClick={() => navigate('/client/finanzas/pagos', {
                            state: { activeTab: cantidadTotalMora > 0 ? 1 : 2 }
                          })}
                          sx={{ fontWeight: 700, borderRadius: 2 }}
                        >
                          {cantidadTotalMora > 0 ? "Regularizar Deuda" : "Historial de Pagos"}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* --- TARJETA 2: Próximo Pago Proyecto --- */}
                  <Card elevation={0} sx={{
                    height: '100%', borderRadius: 3, border: '1px solid',
                    borderColor: 'primary.main', bgcolor: 'background.default'
                  }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Schedule /></Avatar>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Próximo Pago</Typography>
                        </Stack>
                        {proximoPagoReal ? (
                          <Box>
                            <Typography variant="h3" fontWeight={800}>${Number(proximoPagoReal.monto).toLocaleString('es-AR')}</Typography>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                              <Chip label={`VENCE EL ${new Date(proximoPagoReal.fecha_vencimiento).toLocaleDateString('es-AR')}`} color="primary" variant="outlined" sx={{ fontWeight: 800, borderRadius: 2 }} />
                              <Button size="small" color="primary" onClick={() => navigate('/client/finanzas/pagos')} sx={{ fontWeight: 800 }}>Pagar</Button>
                            </Stack>
                          </Box>
                        ) : (
                          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight={700} color="text.disabled">Sin pagos próximos</Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* --- TARJETA 3: Próxima Adhesión --- */}
                  <Card elevation={0} sx={{
                    height: '100%', borderRadius: 3, border: '1px solid',
                    borderColor: 'info.main', bgcolor: 'background.default'
                  }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}><ReceiptLong /></Avatar>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Cuota de Adhesión</Typography>
                        </Stack>
                        {proximaAdhesionReal ? (
                          <Box>
                            <Typography variant="h3" fontWeight={800}>${Number(proximaAdhesionReal.monto).toLocaleString('es-AR')}</Typography>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                              <Chip label={`VENCE EL ${new Date(proximaAdhesionReal.fecha_vencimiento).toLocaleDateString('es-AR')}`} color="info" variant="outlined" sx={{ fontWeight: 800, borderRadius: 2 }} />
                              <Button size="small" color="info" onClick={() => navigate('/client/finanzas/pagos')} sx={{ fontWeight: 800 }}>Pagar</Button>
                            </Stack>
                          </Box>
                        ) : (
                          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight={700} color="text.disabled">Sin cuotas próximas</Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                </Box>

                {/* ========== MINI STATS ========== */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 6, p: 3, borderRadius: 2, bgcolor: '#ECECEC', border: `1px ${theme.palette.divider}` }}>
                  {[
                    { label: 'Proyectos', val: stats.totalProyectos, icon: <TrendingUp color="primary" /> },
                    { label: 'Cuotas Pagas', val: stats.totalCuotasPagadas, icon: <CheckCircle color="success" /> },
                    { label: 'Patrimonio', val: `$${stats.granTotalInvertido.toLocaleString('es-AR')}`, icon: <MonetizationOn sx={{ color: theme.palette.primary.main }} />, full: true }
                  ].map((s, i) => (
                    <Stack key={i} alignItems="center" sx={{ gridColumn: { xs: s.full ? 'span 2' : 'auto', sm: 'auto' } }}>
                      <Typography variant="h5" fontWeight={800}>{s.val}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {s.icon}
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{s.label}</Typography>
                      </Stack>
                    </Stack>
                  ))}
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" fontWeight={800}>Mis Inversiones Activas</Typography>
                  <Button endIcon={<ChevronRight />} onClick={() => navigate('/client/finanzas/suscripciones')} sx={{ fontWeight: 700 }}>Ver Todas</Button>
                </Stack>

                {/* ========== LISTA DE INVERSIONES ========== */}
                <Stack spacing={3}>
                  {resumenes
                    ?.filter((resumen) => {
                      if (resumen.id_suscripcion) {
                        const subActiva = suscripciones?.find(s => s.id === resumen.id_suscripcion);
                        return subActiva ? subActiva.activo === true : false;
                      }
                      if (resumen.hasOwnProperty('activo')) {
                        return resumen.activo === true;
                      }
                      return true;
                    })
                    .map((resumen) => {
                      const tieneMora = pagos?.some(p => p.id_suscripcion === resumen.id_suscripcion && p.estado_pago === 'pendiente' && new Date(p.fecha_vencimiento) < new Date());
                      const subActiva = suscripciones?.find(s => s.id === resumen.id_suscripcion);
                      return (
                        <Card key={resumen.id} elevation={0} sx={{
                          borderRadius: 3, border: `1px solid ${theme.palette.divider}`, transition: 'all 0.2s',
                          '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main', boxShadow: theme.shadows[4] }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                              <Box>
                                <Box className={styles.resumenHeader}>
                                  <Typography variant="h6" fontWeight={800}>{resumen.nombre_proyecto}</Typography>
                                  {subActiva && Number(subActiva.saldo_a_favor) > 0 && (
                                    <Typography className={styles.saldoAFavor} variant="h5">Saldo a favor: ${subActiva.saldo_a_favor}</Typography>
                                  )}
                                </Box>
                                <Chip label={`${resumen.cuotas_pagadas}/${resumen.meses_proyecto || 0} cuotas`} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 700 }} />
                                {tieneMora && <Chip label="Mora" color="error" size="small" sx={{ ml: 1, fontWeight: 800 }} />}
                              </Box>
                              <IconButton onClick={() => navigate('/client/finanzas/resumenes')} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Assessment /></IconButton>
                            </Stack>
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" fontWeight={700} color="text.secondary">Avance del Plan</Typography>
                                <Typography variant="body2" fontWeight={800} color="primary.main">{Number(resumen.porcentaje_pagado || 0).toFixed(0)}%</Typography>
                              </Stack>
                              <LinearProgress variant="determinate" value={Number(resumen.porcentaje_pagado || 0)} sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                </Stack>
              </Box>

              {/* ========== SIDEBAR DERECHO ========== */}
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3, border: '1px solid', borderColor: 'primary.main',
                    borderRadius: 4, bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="h5" mb={3}>Gestión Rápida</Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="contained" color="primary" fullWidth size="large" startIcon={<AccountBalanceWallet />}
                      onClick={() => navigate('/client/finanzas/pagos')}
                      sx={{ borderRadius: 50, fontWeight: 800, textTransform: 'none', py: 1 }}
                    >
                      Pagar Cuotas
                    </Button>
                    <Button
                      variant="outlined" color="primary" fullWidth size="large" startIcon={<Gavel />}
                      onClick={() => navigate('/client/finanzas/pujas')}
                      sx={{ borderRadius: 50, fontWeight: 800, textTransform: 'none', py: 1, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      Mis Subastas
                    </Button>
                    <Button
                      variant="outlined" color="primary" fullWidth size="large" startIcon={<ReceiptLong />}
                      onClick={() => navigate('/client/finanzas/transacciones')}
                      sx={{ borderRadius: 50, fontWeight: 800, textTransform: 'none', py: 1, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      Transacciones
                    </Button>
                  </Stack>
                </Paper>

                <Card elevation={0} sx={{ bgcolor: '#FFFFFF', border: '1px solid', borderColor: '#CC6333', borderRadius: 4, p: 3, textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
                      <Avatar sx={{ bgcolor: user?.is_2fa_enabled ? 'primary.main' : 'warning.main', width: 30, height: 30 }}>
                        <Security />
                      </Avatar>
                      <Typography variant="h5">Seguridad de Cuenta</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">Estado:</Typography>
                      <Chip label={user?.is_2fa_enabled ? 'ACTIVO' : 'INACTIVO'} color={user?.is_2fa_enabled ? 'success' : 'warning'} size="small" variant="filled" sx={{ fontWeight: 800 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {user?.is_2fa_enabled ? 'Tu cuenta está protegida con 2FA.' : 'Recomendamos activar esta protección.'}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/client/seguridad')}
                      sx={{
                        color: '#fff', borderColor: '#E07A4D', bgcolor: '#E07A4D', fontWeight: 800, px: 3, borderRadius: 50, textTransform: 'none',
                        '&:hover': { bgcolor: '#A34D26', borderColor: 'success.main' }
                      }}
                    >
                      {user?.is_2fa_enabled ? 'Administrar 2FA' : 'Configurar 2FA'}
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Box>
          )}
        </QueryHandler>
      </Container>
    </Box>
  );
};

export default UserDashboard;
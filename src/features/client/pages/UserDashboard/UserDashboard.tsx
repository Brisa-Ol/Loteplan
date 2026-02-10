import {
  AccountBalanceWallet,
  AccountCircle,
  ArrowForward,
  Assessment,
  CheckCircle,
  ChevronRight,
  EmojiEvents,
  Gavel,
  MonetizationOn,
  ReceiptLong,
  Schedule,
  Security,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import {
  Alert,
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
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { useDashboardStats } from '../../hooks/useDashboardStats';

// Servicios
import InversionService from '@/core/api/services/inversion.service';
import PagoService from '@/core/api/services/pago.service';
import PujaService from '@/core/api/services/puja.service';
import ResumenCuentaService from '@/core/api/services/resumenCuenta.service';
import SuscripcionService from '@/core/api/services/suscripcion.service';

// 🛠 Utility: Calcular días restantes para vencimientos
const calculateDaysRemaining = (dateString?: string): number => {
  if (!dateString) return 90;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // ========== 1. DATA FETCHING ==========
  const { data: resumenes } = useQuery({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });
  const { data: suscripciones } = useQuery({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });
  const { data: inversiones } = useQuery({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data
  });
  const { data: pagos } = useQuery({
    queryKey: ['misPagosPendientes'],
    queryFn: async () => (await PagoService.getMyPayments()).data
  });
  const { data: misPujas } = useQuery({
    queryKey: ['misPujasCheck'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });

  const isLoading = !resumenes || !suscripciones || !inversiones || !pagos;

  // ========== 2. LÓGICA DE NEGOCIO ========== 
  const stats = useDashboardStats({ resumenes, suscripciones, inversiones, pagos });

  // Lógica de Pagos (Corregido 'estado_pago')
  const proximoPagoReal = pagos?.filter(p =>
    p.estado_pago === 'pendiente' && new Date(p.fecha_vencimiento) >= new Date()
  ).sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];

  const totalDeudaVencida = stats.pagosVencidos.reduce((acc, p) => acc + Number(p.monto), 0);
  const isNewUser = !isLoading && resumenes?.length === 0 && suscripciones?.length === 0;

  // Lógica de Pujas Ganadas
  const pujasGanadoras = misPujas?.filter(p => p.estado_puja === 'ganadora_pendiente') || [];
  const cantidadGanadas = pujasGanadoras.length;
  const pujasConDiasRestantes = pujasGanadoras.map(puja => ({
    ...puja,
    diasRestantes: calculateDaysRemaining(puja.fecha_vencimiento_pago)
  })).sort((a, b) => a.diasRestantes - b.diasRestantes);

  const pujaMasUrgente = pujasConDiasRestantes[0];
  const hayPujasUrgentes = pujaMasUrgente && pujaMasUrgente.diasRestantes <= 7;

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
        bgcolor: 'background.paper', pt: { xs: 4, md: 8 }, pb: { xs: 6, md: 10 }, px: 4,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundImage: `radial-gradient(at top right, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`
      }}>
        <Container maxWidth={false} sx={{ maxWidth: '1400px' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h3" fontWeight={800} color="text.primary">Hola, {user?.nombre} 👋</Typography>
              <Typography variant="h6" color="text.secondary">
                {isNewUser ? "Bienvenido a Nectárea." : "Este es el resumen de tu actividad financiera."}
              </Typography>
            </Stack>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `2px solid ${theme.palette.divider}` }}>
              <AccountCircle fontSize="large" />
            </Avatar>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: '1400px', mt: -6 }}>
        <QueryHandler isLoading={isLoading} error={null}>
          {isNewUser ? <NewUserWelcome /> : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 4, alignItems: 'start' }}>

              <Box>
                {/* ========== ALERTA DE SUBASTA GANADA ========== */}
                {cantidadGanadas > 0 && (
                  <Fade in={true}>
                    <Alert
                      severity={hayPujasUrgentes ? "warning" : "success"}
                      variant="filled"
                      icon={<EmojiEvents fontSize="large" />}
                      action={
                        <Button variant="contained" color="inherit" size="small" onClick={() => navigate('/client/finanzas/pujas')} sx={{ fontWeight: 800, color: 'text.primary', bgcolor: 'white' }}>
                          Gestionar Pago
                        </Button>
                      }
                      sx={{ borderRadius: 2, mb: 4, py: 2, boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.25)}` }}
                    >
                      <Typography variant="subtitle1" fontWeight={800}>
                        {hayPujasUrgentes ? `¡Acción Requerida! Tienes ${cantidadGanadas} subasta(s) pendiente(s)` : `¡Felicitaciones! Has ganado ${cantidadGanadas} subasta(s)`}
                      </Typography>
                      {pujaMasUrgente && (
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Lote: {pujaMasUrgente.lote?.nombre_lote} • Quedan <strong>{pujaMasUrgente.diasRestantes} días</strong> para pagar.
                        </Typography>
                      )}
                    </Alert>
                  </Fade>
                )}

                {/* ========== GRID DE ESTADO FINANCIERO (Mejorado) ========== */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 5 }}>
                  <Card elevation={0} sx={{
                    borderRadius: 3, border: '2px solid',
                    borderColor: stats.cantidadPagosVencidos > 0 ? 'error.main' : 'divider',
                    bgcolor: stats.cantidadPagosVencidos > 0 ? alpha(theme.palette.error.main, 0.02) : 'background.paper'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Avatar sx={{ bgcolor: alpha(stats.cantidadPagosVencidos > 0 ? theme.palette.error.main : theme.palette.success.main, 0.15), color: stats.cantidadPagosVencidos > 0 ? 'error.main' : 'success.main' }}>
                            {stats.cantidadPagosVencidos > 0 ? <Warning /> : <CheckCircle />}
                          </Avatar>
                          <Chip label={stats.cantidadPagosVencidos > 0 ? "EN MORA" : "AL DÍA"} color={stats.cantidadPagosVencidos > 0 ? "error" : "success"} size="small" sx={{ fontWeight: 800 }} />
                        </Stack>
                        <Box>
                          <Typography variant="overline" color="text.secondary" fontWeight={700}>Total Vencido</Typography>
                          <Typography variant="h3" fontWeight={800} color={stats.cantidadPagosVencidos > 0 ? "error.main" : "text.primary"}>
                            ${totalDeudaVencida.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color={stats.cantidadPagosVencidos > 0 ? "error" : "primary"}
                          fullWidth
                          onClick={() => navigate('/client/finanzas/pagos', {
                            state: { activeTab: stats.cantidadPagosVencidos > 0 ? 1 : 2 }
                          })}
                          sx={{ fontWeight: 700, borderRadius: 2 }}
                        >
                          {stats.cantidadPagosVencidos > 0 ? "Regularizar Deuda" : "Historial de Pagos"}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Schedule /></Avatar>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>Próximo Pago</Typography>
                        </Stack>
                        {proximoPagoReal ? (
                          <Box>
                            <Typography variant="h3" fontWeight={800}>${Number(proximoPagoReal.monto).toLocaleString('es-AR')}</Typography>
                            <Chip label={`VENCE EL ${new Date(proximoPagoReal.fecha_vencimiento).toLocaleDateString('es-AR')}`} color="primary" variant="outlined" sx={{ mt: 1, fontWeight: 800 }} />
                          </Box>
                        ) : (
                          <Typography variant="h5" fontWeight={700} color="text.disabled">Sin pagos próximos</Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {/* ========== MINI STATS ========== */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 6, p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `2px dashed ${theme.palette.divider}` }}>
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
                  {resumenes?.map((resumen) => {
                    const tieneMora = pagos?.some(p => p.id_suscripcion === resumen.id_suscripcion && p.estado_pago === 'pendiente' && new Date(p.fecha_vencimiento) < new Date());

                    return (
                      <Card key={resumen.id} elevation={0} sx={{
                        borderRadius: 3, border: `1px solid ${theme.palette.divider}`, transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main', boxShadow: theme.shadows[4] }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box>
                              <Typography variant="h6" fontWeight={800}>{resumen.nombre_proyecto}</Typography>
                              <Chip label={`${resumen.cuotas_pagadas}/${resumenes[0].meses_proyecto} cuotas`} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 700 }} />
                              {tieneMora && <Chip label="Mora" color="error" size="small" sx={{ ml: 1, fontWeight: 800 }} />}
                            </Box>
                            <IconButton onClick={() => navigate('/client/finanzas/resumenes')} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Assessment /></IconButton>
                          </Stack>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" fontWeight={700} color="text.secondary">Avance del Plan</Typography>
                              <Typography variant="body2" fontWeight={800} color="primary.main">{resumen.porcentaje_pagado.toFixed(0)}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={resumen.porcentaje_pagado} sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>

              {/* ========== SIDEBAR DERECHO (Restaurado) ========== */}
              <Stack spacing={3}>
                {stats.saldoTotalAFavor > 0 && (
                  <Card elevation={0} sx={{
                    borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'primary.contrastText', boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: alpha('#fff', 0.2), color: '#fff' }}><AccountBalanceWallet /></Avatar><Typography variant="overline" fontWeight={800}>Saldo a Favor</Typography></Stack>
                        <Box><Typography variant="h3" fontWeight={800}>${stats.saldoTotalAFavor.toLocaleString('es-AR')}</Typography><Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>Disponible para tus próximas cuotas.</Typography></Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* GESTIÓN RÁPIDA (RESTAURADA) */}
                <Paper elevation={0} sx={{ p: 3, border: `2px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={800} mb={3}>Gestión Rápida</Typography>
                  <Stack spacing={1.5}>
                    <Button variant="contained" fullWidth size="large" startIcon={<AccountBalanceWallet />} onClick={() => navigate('/client/finanzas/pagos')} sx={{ borderRadius: 1, fontWeight: 700 }}>Pagar Cuotas</Button>
                    <Button variant="outlined" fullWidth size="large" startIcon={<Gavel />} onClick={() => navigate('/client/finanzas/pujas')} sx={{ borderRadius: 1, fontWeight: 700, borderWidth: 2 }}>Mis Subastas</Button>
                    <Button variant="outlined" fullWidth size="large" startIcon={<ReceiptLong />} onClick={() => navigate('/client/finanzas/transacciones')} sx={{ borderRadius: 1, fontWeight: 700, borderWidth: 2 }}>Transacciones</Button>
                  </Stack>
                </Paper>

                {/* SEGURIDAD Y 2FA (RESTAURADO) */}
                <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), border: `2px dashed ${theme.palette.primary.main}`, borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <Stack spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}><Security /></Avatar>
                    <Typography variant="subtitle2" fontWeight={800}>Seguridad de Cuenta</Typography>
                    <Typography variant="caption" color="text.secondary">Tu cuenta está protegida con 2FA</Typography>
                    <Button size="small" variant="text" onClick={() => navigate('/client/MiCuenta/SecuritySettings')} sx={{ fontWeight: 800 }}>Configurar 2FA</Button>
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
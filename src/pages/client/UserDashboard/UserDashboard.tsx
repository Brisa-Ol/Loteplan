import React from 'react';
import { 
  Box, Typography, Paper, Button, Alert, Stack, LinearProgress, 
  Card, CardContent, Divider, Chip, useTheme, IconButton, Avatar
} from '@mui/material';
import { 
  AccountBalanceWallet, Warning, TrendingUp, Description, Gavel, ChevronRight, CheckCircle, Schedule, ReceiptLong, Assessment, EmojiEvents,
  AccountCircle, HelpOutline, Security,
  MonetizationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Servicios
import MensajeService from '../../../services/mensaje.service';
import PagoService from '../../../services/pago.service';
import SuscripcionService from '../../../services/suscripcion.service';
import ResumenCuentaService from '../../../services/resumenCuenta.service';
import InversionService from '../../../services/inversion.service';
import PujaService from '../../../services/puja.service';

// Context & Hooks
import { useAuth } from '../../../context/AuthContext';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { useDashboardStats } from '../../../hooks/useDashboardStats'; 
import { alpha } from '@mui/material/styles';

// DTOs
import type { PagoDto } from '../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';
import type { ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';
import type { InversionDto } from '../../../types/dto/inversion.dto';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // ========== 1. DATA FETCHING ==========
  const { data: resumenes } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'], queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  const { data: suscripciones } = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'], queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });

  const { data: inversiones } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'], queryFn: async () => (await InversionService.getMisInversiones()).data
  });

  const { data: pagos } = useQuery<PagoDto[]>({
    queryKey: ['misPagosPendientes'], queryFn: async () => (await PagoService.getMyPayments()).data
  });

  const { data: mensajesData, isLoading: loadingMensajes } = useQuery<any>({
    queryKey: ['mensajesNoLeidos'], queryFn: async () => (await MensajeService.getUnreadCount()).data
  });

  const { data: misPujas } = useQuery({
    queryKey: ['misPujasCheck'], 
    queryFn: async () => (await PujaService.getMyPujas()).data,
    staleTime: 60000 
  });

  const isLoading = !resumenes || !suscripciones || !inversiones || !pagos || loadingMensajes;

  // ========== 2. LÓGICA CENTRALIZADA ========== 
  const stats = useDashboardStats({ resumenes, suscripciones, inversiones, pagos });
  const mensajesSinLeer = mensajesData?.conteo || 0;
  const cantidadGanadas = misPujas?.filter(p => p.estado_puja === 'ganadora_pendiente').length || 0;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      
      {/* HEADER DINÁMICO */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        pt: { xs: 4, md: 8 }, 
        pb: { xs: 6, md: 10 }, 
        px: { xs: 2, sm: 4 },
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundImage: `radial-gradient(at top right, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`
      }}>
        <Box maxWidth="1400px" mx="auto" display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'text.primary', mb: 1, letterSpacing: -1 }}>
              Hola, {user?.nombre} 👋
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ opacity: 0.8 }}>
              Bienvenido a tu panel de control financiero.
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              width: 64, height: 64, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              border: `2px solid ${theme.palette.divider}`,
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <AccountCircle fontSize="large" />
          </Avatar>
        </Box>
      </Box>

      <Box maxWidth="1400px" mx="auto" px={{ xs: 2, sm: 4 }} mt={-6}>
        
        {/* ALERTAS CRÍTICAS */}
        {(stats.cantidadPagosVencidos > 0 || mensajesSinLeer > 0 || cantidadGanadas > 0) && (
          <Stack spacing={2} mb={5}>
            {cantidadGanadas > 0 && (
               <Alert 
                severity="success" 
                variant="filled"
                icon={<EmojiEvents fontSize="large" />}
                action={
                  <Button variant="contained" color="warning" size="small" onClick={() => navigate('/client/subastas')} sx={{ fontWeight: 800 }}>
                    Pagar Ahora
                  </Button>
                }
                sx={{ borderRadius: 3, py: 2, px: 3, boxShadow: theme.shadows[4] }}
              >
                <Typography variant="subtitle1" fontWeight={700}>¡Felicitaciones! Ganaste {cantidadGanadas} subasta{cantidadGanadas > 1 ? 's' : ''}</Typography>
                <Typography variant="body2">Asegura tu adjudicación completando el pago hoy.</Typography>
              </Alert>
            )}

            {stats.cantidadPagosVencidos > 0 && (
              <Alert 
                severity="error" 
                variant="outlined"
                icon={<Warning fontSize="large" />}
                action={
                  <Button variant="contained" color="error" onClick={() => navigate('/pagos')} sx={{ fontWeight: 500 }}>
                    Regularizar
                  </Button>
                }
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.08), border: `1.8px solid ${theme.palette.error.main}`, py: 2 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>Tienes {stats.cantidadPagosVencidos} cuotas vencidas</Typography>
                <Typography variant="body2" color="text.secondary">Evita cargos adicionales regularizando tu cuenta.</Typography>
              </Alert>
            )}
          </Stack>
        )}

        <QueryHandler isLoading={isLoading} error={null} loadingMessage="Generando tu resumen financiero...">
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 4, alignItems: 'start' }}>
            
            {/* ===== COLUMNA IZQUIERDA (MAIN) ===== */}
            <Box>
              
              {/* KPIs HERO */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 5 }}>
                <Card elevation={0} sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, 
                  color: '#fff', borderRadius: 4, boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}` 
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: alpha('#fff', 0.2), color: '#fff' }}><AccountBalanceWallet /></Avatar>
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.9 }}>Saldo a Favor</Typography>
                      </Box>
                      <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: '2.2rem', md: '3rem' } }}>
                        ${stats.saldoTotalAFavor.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Crédito disponible para futuras cuotas.</Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: alpha('#CC6333', 0.9), color: '#fff' }}><Schedule /></Avatar>
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, color: '#333333' }}>Próximo Pago</Typography>
                      </Box>
                      {stats.proximoVencimiento ? (
                        <>
                          <Typography variant="h3" fontWeight={800} color="text.primary">
                            ${Number(stats.proximoVencimiento.monto).toLocaleString()}
                          </Typography>
                          <Chip 
                            label={`Vence: ${new Date(stats.proximoVencimiento.fecha_vencimiento).toLocaleDateString()}`}
                            variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5, width: 'fit-content' }}
                          />
                        </>
                      ) : (
                        <Box display="flex" alignItems="center" gap={2} py={1}>
                          <CheckCircle color="success" sx={{ fontSize: 40 }} />
                          <Typography variant="h5" fontWeight={700} color="success.main">Al día</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* MINI STATS */}
              <Box sx={{ 
                display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, 
                gap: 2, mb: 6, p: 2, borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.04), border: `1px dashed ${theme.palette.divider}` 
              }}>
                {[
                  { label: 'Proyectos', val: stats.totalProyectos, icon: <TrendingUp color="primary"/> },
                  { label: 'Cuotas Pagas', val: stats.totalCuotasPagadas, icon: <CheckCircle color="success"/> },
                  { label: 'Patrimonio', val: `$${stats.granTotalInvertido.toLocaleString()}`, icon: <MonetizationOn color="warning"/>, full: true }
                ].map((s, i) => (
                  <Box key={i} sx={{ textAlign: 'center', p: 2, gridColumn: { xs: s.full ? 'span 2' : 'auto', sm: 'auto' } }}>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{s.val}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* LISTADO DE PROYECTOS */}
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={800} color="text.primary">Mis Inversiones Activas</Typography>
                <Button variant="text" endIcon={<ChevronRight />} onClick={() => navigate('/client/suscripciones')} sx={{ fontWeight: 700 }}>
                  Ver historial
                </Button>
              </Box>

              <Stack spacing={3}>
                {resumenes?.map((resumen) => {
                  const saldoProyecto = Number(suscripciones?.find(s => s.id === resumen.id_suscripcion)?.saldo_a_favor || 0);
                  return (
                    <Card key={resumen.id} elevation={0} sx={{ 
                      borderRadius: 4, border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[6], borderColor: theme.palette.primary.main }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
                          <Box>
                            <Typography variant="h6" fontWeight={800} gutterBottom>{resumen.nombre_proyecto}</Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip label={`${resumen.meses_proyecto} cuotas`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                              {saldoProyecto > 0 && <Chip label={`+$${saldoProyecto} a favor`} color="success" size="small" sx={{ fontWeight: 800 }} />}
                            </Stack>
                          </Box>
                          <IconButton onClick={() => navigate('/MisResumenes')} color="primary"><Assessment /></IconButton>
                        </Box>

                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={1.5} alignItems="flex-end">
                            <Typography variant="body2" fontWeight={700} color="text.secondary">Avance del plan</Typography>
                            <Typography variant="h5" fontWeight={900} color="primary.main">{resumen.porcentaje_pagado.toFixed(0)}%</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={resumen.porcentaje_pagado} 
                            sx={{ height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 6 } }} 
                          />
                          <Typography variant="caption" color="text.secondary" display="block" mt={1.5} fontWeight={600}>
                            {resumen.cuotas_pagadas} de {resumen.meses_proyecto} cuotas acreditadas
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>

            {/* ===== COLUMNA DERECHA (SIDEBAR) ===== */}
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Paper elevation={0} sx={{ p: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={800} mb={3}>Acceso Rápido</Typography>
                <Stack spacing={1.5}>
                  {[
                    { l: 'Pagar Cuotas', i: <AccountBalanceWallet />, r: '/pagos', v: 'contained', c: 'primary' },
                    { l: 'Transacciones', i: <ReceiptLong />, r: '/client/transacciones' },
                    { l: 'Subastas', i: <Gavel />, r: '/client/subastas' },
                    { l: 'Contratos', i: <Description />, r: '/client/contratos' }
                  ].map((btn, idx) => (
                    <Button 
                      key={idx} variant={btn.v as any || 'outlined'} fullWidth size="large" 
                      startIcon={btn.i} onClick={() => navigate(btn.r)}
                      sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                      {btn.l}
                    </Button>
                  ))}
                </Stack>
                
                <Divider sx={{ my: 4 }} />
                
                <Card elevation={0} sx={{ 
                  bgcolor: user?.is_2fa_enabled ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${user?.is_2fa_enabled ? theme.palette.success.main : theme.palette.warning.main}`,
                  borderRadius: 3, p: 2, textAlign: 'center'
                }}>
                  <Avatar sx={{ 
                    mx: 'auto', mb: 1, 
                    bgcolor: user?.is_2fa_enabled ? 'success.main' : 'warning.main' 
                  }}>
                    {user?.is_2fa_enabled ? <CheckCircle /> : <Security />}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={800} color={user?.is_2fa_enabled ? 'success.dark' : 'warning.dark'}>
                    {user?.is_2fa_enabled ? 'Cuenta Protegida' : 'Seguridad Recomendada'}
                  </Typography>
                  <Button 
                    size="small" variant="text" fullWidth sx={{ mt: 1, fontWeight: 800 }}
                    onClick={() => navigate('/client/seguridad')}
                  >
                    {user?.is_2fa_enabled ? 'Ver ajustes' : 'Activar 2FA'}
                  </Button>
                </Card>

                <Box mt={3} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 2, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>¿Necesitas soporte?</Typography>
                  <Button startIcon={<HelpOutline />} fullWidth size="small" onClick={() => navigate('/client/mensajes')}>Centro de Ayuda</Button>
                </Box>
              </Paper>
            </Box>

          </Box>
        </QueryHandler>
      </Box>
    </Box>
  );
};

export default UserDashboard;
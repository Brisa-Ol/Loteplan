import React from 'react';
import { 
  Box, Typography, Paper, Button, Alert, Stack, LinearProgress, 
  Card, CardContent, Divider, Chip, useTheme, IconButton, Avatar
} from '@mui/material';
import { 
  AccountBalanceWallet, Warning, TrendingUp, Description, Gavel,
  ChevronRight, CheckCircle, Schedule, ReceiptLong, Assessment, EmojiEvents,
  AccountCircle, HelpOutline, Security, MonetizationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { alpha } from '@mui/material/styles';

// Context & Hooks
import { useAuth } from '../../../context/AuthContext';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { useDashboardStats } from '../../../hooks/useDashboardStats'; 

// DTOs
import type { PagoDto } from '../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';
import type { ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';
import type { InversionDto } from '../../../types/dto/inversion.dto';
import type { PujaDto } from '../../../types/dto/puja.dto'; // Import PujaDto

// Services
import InversionService from '../../../services/inversion.service';
import ResumenCuentaService from '../../../services/resumenCuenta.service';
import MensajeService from '../../../services/mensaje.service';
import SuscripcionService from '../../../services/suscripcion.service';
import PagoService from '../../../services/pago.service';
import PujaService from '../../../services/puja.service';

// --- Helper Local para Días Restantes ---
const calculateDaysRemaining = (dateString?: string): number => {
  if (!dateString) return 90; // Default fallback
  const today = new Date();
  const dueDate = new Date(dateString);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // ========== 1. DATA FETCHING ==========
  const { data: resumenes } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'], 
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  const { data: suscripciones } = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'], 
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });

  const { data: inversiones } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'], 
    queryFn: async () => (await InversionService.getMisInversiones()).data
  });

  const { data: pagos } = useQuery<PagoDto[]>({
    queryKey: ['misPagosPendientes'], 
    queryFn: async () => (await PagoService.getMyPayments()).data
  });

  const { data: mensajesData, isLoading: loadingMensajes } = useQuery<any>({
    queryKey: ['mensajesNoLeidos'], 
    queryFn: async () => (await MensajeService.getUnreadCount()).data
  });

  // ✅ Corregido: Tipado explícito para misPujas
  const { data: misPujas } = useQuery<PujaDto[]>({
    queryKey: ['misPujasCheck'], 
    queryFn: async () => (await PujaService.getMyPujas()).data,
    staleTime: 60000 
  });

  const isLoading = !resumenes || !suscripciones || !inversiones || !pagos || loadingMensajes;

  // ========== 2. LÓGICA CENTRALIZADA ========== 
  const stats = useDashboardStats({ resumenes, suscripciones, inversiones, pagos });
  const mensajesSinLeer = mensajesData?.conteo || 0;
  
  // ✅ Lógica de Pujas Ganadoras
  const pujasGanadoras = misPujas?.filter(p => p.estado_puja === 'ganadora_pendiente') || [];
  const cantidadGanadas = pujasGanadoras.length;
  
  // Calcular días restantes y ordenar
  const pujasConDiasRestantes = pujasGanadoras.map(puja => {
    // Usamos el helper local o el valor por defecto si no hay fecha
    const diasRestantes = calculateDaysRemaining(puja.fecha_vencimiento_pago);
    return { ...puja, diasRestantes };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  
  const pujaMasUrgente = pujasConDiasRestantes[0]; 
  const hayPujasUrgentes = pujaMasUrgente && pujaMasUrgente.diasRestantes <= 7;

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
            
            {/* ✅ ALERTA DE PUJAS GANADORAS */}
            {cantidadGanadas > 0 && (
               <Alert 
                severity={hayPujasUrgentes ? "warning" : "success"} 
                variant="filled"
                icon={<EmojiEvents fontSize="large" />}
                action={
                  <Button 
                    variant="contained" 
                    color={hayPujasUrgentes ? "error" : "warning"} 
                    size="small" 
                    // ✅ Redirección correcta a la página de Mis Pujas
                    onClick={() => navigate('/pujas')} 
                    sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'text.primary', '&:hover': { bgcolor: 'background.default' } }}
                  >
                    Ver Detalles
                  </Button>
                }
                sx={{ 
                  borderRadius: 3, 
                  py: 2, px: 3, 
                  boxShadow: theme.shadows[4],
                  // Ajuste visual para mejor contraste
                  bgcolor: hayPujasUrgentes ? theme.palette.warning.main : theme.palette.success.main,
                  color: '#fff'
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {hayPujasUrgentes 
                      ? `⚠️ Acción Requerida: Tienes ${cantidadGanadas} subasta${cantidadGanadas > 1 ? 's' : ''} ganada${cantidadGanadas > 1 ? 's' : ''} pendiente${cantidadGanadas > 1 ? 's' : ''} de pago`
                      : `¡Felicitaciones! Has ganado ${cantidadGanadas} subasta${cantidadGanadas > 1 ? 's' : ''}`
                    }
                  </Typography>
                  
                  {pujaMasUrgente && (
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                        {/* Se asume que el backend incluye el objeto 'lote' en la respuesta de getMyPujas */}
                        Lote: {pujaMasUrgente.lote?.nombre_lote || `ID #${pujaMasUrgente.id_lote}`}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <Chip 
                          label={
                            pujaMasUrgente.diasRestantes <= 0 
                              ? "¡Vence HOY!" 
                              : `${pujaMasUrgente.diasRestantes} días para pagar`
                          }
                          size="small"
                          sx={{ 
                            fontWeight: 700,
                            bgcolor: 'rgba(255,255,255,0.25)',
                            color: '#fff',
                            border: 'none'
                          }}
                        />
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Alert>
            )}

            {/* ALERTA DE PAGOS VENCIDOS */}
            {stats.cantidadPagosVencidos > 0 && (
              <Alert 
                severity="error" 
                variant="outlined"
                icon={<Warning fontSize="large" />}
                action={
                  <Button variant="contained" color="error" onClick={() => navigate('/pagos')} sx={{ fontWeight: 700 }}>
                    Pagar Ahora
                  </Button>
                }
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${theme.palette.error.main}`, py: 2 }}
              >
                <Typography variant="subtitle1" fontWeight={800}>Tienes {stats.cantidadPagosVencidos} cuotas vencidas</Typography>
                <Typography variant="body2" color="text.secondary">Evita cargos adicionales regularizando tu cuenta hoy mismo.</Typography>
              </Alert>
            )}
          </Stack>
        )}

        <QueryHandler isLoading={isLoading} error={null} loadingMessage="Cargando tu resumen...">
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 4, alignItems: 'start' }}>
            
            {/* ===== COLUMNA IZQUIERDA (MAIN) ===== */}
            <Box>
              
              {/* KPIs HERO */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 5 }}>
                {/* ... (Resto de las tarjetas de KPI se mantienen igual) ... */}
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
                        <Avatar sx={{ bgcolor: alpha('#CC6333', 0.1), color: 'primary.main' }}><Schedule /></Avatar>
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, color: 'text.secondary' }}>Próximo Pago</Typography>
                      </Box>
                      {stats.proximoVencimiento ? (
                        <>
                          <Typography variant="h3" fontWeight={800} color="text.primary">
                            ${Number(stats.proximoVencimiento.monto).toLocaleString()}
                          </Typography>
                          <Chip 
                            label={`Vence: ${new Date(stats.proximoVencimiento.fecha_vencimiento).toLocaleDateString()}`}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: 1.5, width: 'fit-content' }}
                          />
                        </>
                      ) : (
                        <Box display="flex" alignItems="center" gap={2} py={1}>
                          <CheckCircle color="success" sx={{ fontSize: 40 }} />
                          <Box>
                            <Typography variant="h6" fontWeight={700} color="success.main">¡Todo al día!</Typography>
                            <Typography variant="body2" color="text.secondary">No tienes pagos pendientes.</Typography>
                          </Box>
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
                    <Stack direction="row" justifyContent="center" alignItems="center" gap={0.5} mt={0.5}>
                        {s.icon}
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{s.label}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>

              {/* LISTADO DE PROYECTOS */}
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={800} color="text.primary">Mis Inversiones Activas</Typography>
                <Button variant="text" endIcon={<ChevronRight />} onClick={() => navigate('/suscripciones')} sx={{ fontWeight: 700 }}>
                  Ver historial
                </Button>
              </Box>

              <Stack spacing={3}>
                {resumenes?.map((resumen) => {
                  const saldoProyecto = Number(suscripciones?.find(s => s.id === resumen.id_suscripcion)?.saldo_a_favor || 0);
                  return (
                    <Card key={resumen.id} elevation={0} sx={{ 
                      borderRadius: 4, border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: theme.palette.primary.main }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
                          <Box>
                            <Typography variant="h6" fontWeight={800} gutterBottom>{resumen.nombre_proyecto}</Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip label={`${resumen.meses_proyecto} cuotas`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                              {saldoProyecto > 0 && <Chip label={`+$${saldoProyecto.toLocaleString()} a favor`} color="success" size="small" sx={{ fontWeight: 800 }} />}
                            </Stack>
                          </Box>
                          <IconButton onClick={() => navigate('/mis-resumenes')} color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                            <Assessment />
                          </IconButton>
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
                {resumenes?.length === 0 && (
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>No tienes inversiones activas en este momento.</Alert>
                )}
              </Stack>
            </Box>

            {/* ===== COLUMNA DERECHA (SIDEBAR) ===== */}
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Paper elevation={0} sx={{ p: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={800} mb={3}>Acceso Rápido</Typography>
                <Stack spacing={1.5}>
                  {[
                    { l: 'Pagar Cuotas', i: <AccountBalanceWallet />, r: '/pagos', v: 'contained', c: 'primary' },
                    { l: 'Mis Subastas', i: <Gavel />, r: '/pujas' }, // ✅ Link Correcto
                    { l: 'Transacciones', i: <ReceiptLong />, r: '/transacciones' },
                    { l: 'Contratos', i: <Description />, r: '/contratos' }
                  ].map((btn, idx) => (
                    <Button 
                      key={idx} 
                      variant={btn.v as any || 'outlined'} 
                      fullWidth 
                      size="large" 
                      startIcon={btn.i} 
                      onClick={() => navigate(btn.r)}
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
                    onClick={() => navigate('/seguridad')}
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
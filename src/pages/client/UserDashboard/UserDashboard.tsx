import React, { useMemo } from 'react';
import { 
  Box, Typography, Paper, Button, Alert, Stack, LinearProgress, 
  Card, CardContent, Divider, Chip, useTheme, IconButton, Tooltip
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Warning, 
  TrendingUp, 
  Description, 
  Gavel,
  NotificationsActive,
  ChevronRight,
  CheckCircle,
  Schedule,
  ReceiptLong, // Icono para Transacciones
  Assessment   // Icono para Resumen/Análisis
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// --- Servicios ---
import MensajeService from '../../../Services/mensaje.service';
import PagoService from '../../../Services/pago.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import ResumenCuentaService from '../../../Services/resumenCuenta.service';
import InversionService from '../../../Services/inversion.service'; // ✅ MEJORA: Importar Inversiones

// --- Contexto ---
import { useAuth } from '../../../context/AuthContext';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// --- DTOs ---
import type { PagoDto } from '../../../types/dto/pago.dto';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';
import type { ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';
import type { InversionDto } from '../../../types/dto/inversion.dto';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // ========== QUERIES DE DATOS ==========
  const { data: resumenes, isLoading: loadingResumenes } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  const { data: suscripciones, isLoading: loadingSuscripciones } = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });

  // ✅ MEJORA: Traer inversiones directas para calcular el patrimonio total real
  const { data: inversiones, isLoading: loadingInversiones } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data
  });

  const { data: pagos, isLoading: loadingPagos } = useQuery<PagoDto[]>({
    queryKey: ['misPagosPendientes'],
    queryFn: async () => (await PagoService.getMyPayments()).data
  });

  const { data: mensajesData } = useQuery<any>({
    queryKey: ['mensajesNoLeidos'],
    queryFn: async () => (await MensajeService.getUnreadCount()).data
  });

  const isLoading = loadingResumenes || loadingPagos || loadingSuscripciones || loadingInversiones;

  // ========== CÁLCULOS ==========
  const pagosVencidos = pagos?.filter(p => p.estado_pago === 'vencido') || [];
  
  const proximoVencimiento = useMemo(() => {
    return pagos
    ?.filter(p => p.estado_pago === 'pendiente')
    .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];
  }, [pagos]);

  const mensajesSinLeer = mensajesData?.conteo || 0;
  
  const saldoTotalAFavor = suscripciones?.reduce((acc, curr) => acc + Number(curr.saldo_a_favor || 0), 0) || 0;

  // ✅ MEJORA: Calcular Total Invertido Real (Suscripciones + Inversiones Directas)
  const totalInvertidoSuscripciones = suscripciones?.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0) || 0;
  const totalInvertidoDirecto = inversiones?.filter(i => i.estado === 'pagado').reduce((acc, i) => acc + Number(i.monto), 0) || 0;
  const granTotalInvertido = totalInvertidoSuscripciones + totalInvertidoDirecto;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      
      {/* ========== HEADER ========== */}
      <Box sx={{ bgcolor: 'background.paper', pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box maxWidth="1400px" mx="auto">
          <Typography variant="h3" sx={{ color: 'text.primary', mb: 1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Hola, {user?.nombre} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            Aquí está el resumen de tu actividad financiera
          </Typography>
        </Box>
      </Box>

      <Box maxWidth="1400px" mx="auto" px={{ xs: 2, sm: 3, md: 4 }} mt={-2}>
        
        {/* ========== ALERTAS CRÍTICAS ========== */}
        {(pagosVencidos.length > 0 || mensajesSinLeer > 0) && (
          <Stack spacing={2} mb={4}>
            {pagosVencidos.length > 0 && (
              <Alert 
                severity="error" 
                icon={<Warning sx={{ fontSize: 28 }} />}
                action={
                  <Button size="medium" onClick={() => navigate('/client/pagos')} sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}>
                    Regularizar
                  </Button>
                }
                sx={{ border: '2px solid', borderColor: 'error.main', py: 2, px: 3 }}
              >
                <Typography variant="body1" fontWeight={600}>Tienes {pagosVencidos.length} pago(s) vencido(s)</Typography>
                <Typography variant="body2" color="text.secondary">Regulariza tu situación para evitar recargos</Typography>
              </Alert>
            )}

            {mensajesSinLeer > 0 && (
              <Alert 
                severity="info" 
                icon={<NotificationsActive sx={{ fontSize: 24 }} />}
                action={
                  <Button size="small" onClick={() => navigate('/client/mensajes')} sx={{ color: 'info.main' }}>
                    Leer
                  </Button>
                }
                sx={{ bgcolor: 'secondary.light', border: '1px solid', borderColor: 'secondary.dark' }}
              >
                <Typography variant="body2">Tienes <strong>{mensajesSinLeer} mensajes nuevos</strong> en tu buzón</Typography>
              </Alert>
            )}
          </Stack>
        )}

        <QueryHandler isLoading={isLoading} error={null} loadingMessage="Cargando tu resumen...">
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2.5fr 1fr' }, gap: 4, alignItems: 'start' }}>
            
            {/* ===== COLUMNA IZQUIERDA (MAIN) ===== */}
            <Box>
              
              {/* HERO KPIs */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
                
                {/* KPI 1: Saldo a Favor */}
                <Card elevation={0} sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, color: 'primary.contrastText', overflow: 'hidden', position: 'relative' }}>
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWallet sx={{ fontSize: 24, opacity: 0.9 }} />
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, opacity: 0.95, color: 'inherit' }}>
                          Saldo a Favor
                        </Typography>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '2.5rem' }, lineHeight: 1 }}>
                        ${saldoTotalAFavor.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                        Disponible para cubrir futuras cuotas
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* KPI 2: Próximo Vencimiento */}
                <Card elevation={0} sx={{ border: '2px solid', borderColor: 'secondary.main', bgcolor: 'background.default' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule sx={{ fontSize: 24, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, color: 'text.secondary' }}>
                          Próximo Vencimiento
                        </Typography>
                      </Box>
                      
                      {proximoVencimiento ? (
                        <>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.75rem', sm: '2rem' } }}>
                            ${Number(proximoVencimiento.monto).toLocaleString()}
                          </Typography>
                          <Chip 
                            label={`Vence: ${new Date(proximoVencimiento.fecha_vencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
                            size="small"
                            sx={{ bgcolor: 'secondary.light', fontWeight: 600, fontSize: '0.8rem', width: 'fit-content' }}
                          />
                        </>
                      ) : (
                        <>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={700} color="success.main">Al día</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">No tienes pagos pendientes</Typography>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* ESTADÍSTICAS RÁPIDAS */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 5 }}>
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'secondary.main', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
                    {(resumenes?.length || 0) + (inversiones?.length || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Proyectos</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'secondary.main', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    {resumenes?.reduce((acc, r) => acc + (r.cuotas_pagadas || 0), 0) || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Cuotas Pagadas</Typography>
                </Paper>
                {/* ✅ MEJORA: Muestra el gran total (Suscripciones + Inversiones) */}
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'secondary.main', textAlign: 'center', gridColumn: { xs: 'span 2', sm: 'auto' } }}>
                  <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    ${granTotalInvertido.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Patrimonio Total</Typography>
                </Paper>
              </Box>

              {/* SECCIÓN PROYECTOS ACTIVOS */}
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={700} color="text.primary">Mis Suscripciones Activas</Typography>
                <Button variant="text" endIcon={<ChevronRight />} onClick={() => navigate('/client/suscripciones')} sx={{ color: 'primary.main' }}>
                  Ver todas
                </Button>
              </Box>

              {resumenes && resumenes.length > 0 ? (
                <Stack spacing={3}>
                  {resumenes.map((resumen) => {
                    const suscripcionAsociada = suscripciones?.find(s => s.id === resumen.id_suscripcion);
                    const idProyectoReal = suscripcionAsociada?.id_proyecto;
                    const saldoProyecto = Number(suscripcionAsociada?.saldo_a_favor || 0);
                    
                    return (
                      <Paper 
                        key={resumen.id} 
                        elevation={0} 
                        sx={{ 
                          p: 3, border: '2px solid', borderColor: 'secondary.main',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': { borderColor: 'primary.main', boxShadow: theme.shadows[4], transform: 'translateY(-4px)' }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
                          <Box flex={1}>
                            <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                              {resumen.nombre_proyecto}
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                              <Chip label={`${resumen.meses_proyecto} cuotas`} size="small" sx={{ bgcolor: 'secondary.light', fontWeight: 600, fontSize: '0.8rem' }} />
                              {saldoProyecto > 0 && (
                                <Chip label={`+$${saldoProyecto.toLocaleString()} a favor`} size="small" sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 700, fontSize: '0.8rem' }} />
                              )}
                            </Stack>
                          </Box>
                          
                          {/* ✅ MEJORA: Botón directo a "Mis Resúmenes" para ver detalle financiero */}
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Ver detalle de costos y composición de cuota">
                                <IconButton size="small" color="primary" onClick={() => navigate('/MisResumenes')}>
                                    <Assessment />
                                </IconButton>
                            </Tooltip>
                            <Button variant="outlined" size="small" endIcon={<ChevronRight />} onClick={() => idProyectoReal ? navigate(`/proyectos/${idProyectoReal}`) : navigate('/client/suscripciones')} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                                Ver proyecto
                            </Button>
                          </Stack>
                        </Box>

                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={1.5}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">Progreso del plan</Typography>
                            <Typography variant="body2" fontWeight={800} sx={{ color: 'primary.main', fontSize: '1rem' }}>
                              {resumen.porcentaje_pagado.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={resumen.porcentaje_pagado} sx={{ height: 12, borderRadius: 6, bgcolor: 'secondary.main', '& .MuiLinearProgress-bar': { borderRadius: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)` } }} />
                          <Typography variant="caption" color="text.secondary" display="block" mt={1} fontWeight={500}>
                            {resumen.cuotas_pagadas} de {resumen.meses_proyecto} cuotas pagadas
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: 'secondary.light', border: '2px dashed', borderColor: 'secondary.dark' }}>
                  <TrendingUp sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>Tu portafolio está vacío</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Explora nuestros proyectos y comienza a construir tu futuro</Typography>
                  <Button variant="contained" size="large" onClick={() => navigate('/client/Proyectos/RoleSelection')} sx={{ px: 4 }}>
                    Explorar Proyectos
                  </Button>
                </Paper>
              )}
            </Box>

            {/* ===== COLUMNA DERECHA (SIDEBAR) ===== */}
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
              <Paper elevation={0} sx={{ p: 4, border: '2px solid', borderColor: 'secondary.main', bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom fontWeight={700} mb={3} color="text.primary">Acciones Rápidas</Typography>
                
                <Stack spacing={2}>
                  <Button 
                    variant="contained" size="large" fullWidth 
                    startIcon={<AccountBalanceWallet />} 
                    onClick={() => navigate('/pagos')} // ✅ Ruta correcta
                    sx={{ justifyContent: 'flex-start', fontSize: '1rem', boxShadow: theme.shadows[4] }}
                  >
                    Pagar Cuotas
                  </Button>
                  
                  {/* ✅ MEJORA: Botón nuevo para Historial */}
                  <Button 
                    variant="outlined" size="large" fullWidth 
                    startIcon={<ReceiptLong />} 
                    onClick={() => navigate('/client/transacciones')} // ✅ Ruta correcta
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Historial y Recibos
                  </Button>

                  <Button 
                    variant="outlined" size="large" fullWidth 
                    startIcon={<Gavel />} 
                    onClick={() => navigate('/client/subastas')} // ✅ Ruta correcta
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Mis Subastas
                  </Button>
                  
                  <Button 
                    variant="outlined" size="large" fullWidth 
                    startIcon={<Description />} 
                    onClick={() => navigate('/client/contratos')} // ✅ Ruta correcta
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Mis Contratos
                  </Button>
                </Stack>
                
                <Divider sx={{ my: 4 }} />
                
                {/* 2FA Widget (Igual que antes) */}
                <Box sx={{ bgcolor: user?.is_2fa_enabled ? 'success.light' : 'warning.light', p: 3, borderRadius: 3, textAlign: 'center', border: '2px solid', borderColor: user?.is_2fa_enabled ? 'success.main' : 'warning.main', mb: 3 }}>
                  {user?.is_2fa_enabled ? (
                    <>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="subtitle2" gutterBottom fontWeight={700} color="success.dark">Cuenta Protegida</Typography>
                      <Button variant="outlined" size="small" onClick={() => navigate('/client/seguridad')} sx={{ borderColor: 'success.main', color: 'success.dark' }}>Gestionar</Button>
                    </>
                  ) : (
                    <>
                      <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="subtitle2" gutterBottom fontWeight={700} color="warning.dark">Protege tu cuenta</Typography>
                      <Button variant="contained" size="small" onClick={() => navigate('/client/seguridad')} color="warning">Activar Ahora</Button>
                    </>
                  )}
                </Box>

                {/* Soporte */}
                <Box sx={{ bgcolor: 'secondary.light', p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.primary">¿Necesitas ayuda?</Typography>
                  <Button variant="outlined" size="medium" fullWidth onClick={() => navigate('/client/mensajes')}>Contactar Soporte</Button>
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
import React from 'react';
import { 
  Box, Typography, Paper, Button, Alert, Stack, LinearProgress, 
  Card, CardContent, Divider, Chip
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
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// --- Servicios ---
import MensajeService from '../../../Services/mensaje.service';

import PagoService from '../../../Services/pago.service';
import SuscripcionService from '../../../Services/suscripcion.service';

// --- Contexto ---
import { useAuth } from '../../../context/AuthContext';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// --- DTOs ---
import type { PagoDto } from '../../../types/dto/pago.dto';

import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';
import ResumenCuentaService from '../../../Services/resumenCuenta.service';
import type { ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ========== QUERIES DE DATOS ==========
  const { data: resumenes, isLoading: loadingResumenes } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  const { data: suscripciones, isLoading: loadingSuscripciones } = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMySubscriptions()).data
  });

  const { data: pagos, isLoading: loadingPagos } = useQuery<PagoDto[]>({
    queryKey: ['misPagosPendientes'],
    queryFn: async () => (await PagoService.getMyPayments()).data
  });

  const { data: mensajesData } = useQuery<any>({
    queryKey: ['mensajesNoLeidos'],
    queryFn: async () => (await MensajeService.getUnreadCount()).data
  });

  const isLoading = loadingResumenes || loadingPagos || loadingSuscripciones;

  // ========== CÁLCULOS ==========
  const pagosVencidos = pagos?.filter(p => p.estado_pago === 'vencido') || [];
  const proximoVencimiento = pagos?.find(p => p.estado_pago === 'pendiente');
  const mensajesSinLeer = mensajesData?.conteo || 0;
  const saldoTotalAFavor = suscripciones?.reduce((acc, curr) => acc + Number(curr.saldo_a_favor || 0), 0) || 0;

  const getSaldoPorResumen = (idSuscripcion: number) => {
    const sub = suscripciones?.find(s => s.id === idSuscripcion);
    return Number(sub?.saldo_a_favor || 0);
  };

  return (
    <Box sx={{ 
      bgcolor: '#FFFFFF',
      minHeight: '100vh',
      pb: 8
    }}>
      {/* ========== HEADER ========== */}
      <Box sx={{ 
        bgcolor: '#ECECEC',
        pt: { xs: 4, md: 6 },
        pb: { xs: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Box maxWidth="1400px" mx="auto">
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              color: '#000000',
              mb: 1,
              fontSize: { xs: '1.75rem', md: '2.5rem' }
            }}
          >
            Hola, {user?.nombre} 👋
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#333333',
              fontSize: { xs: '0.95rem', md: '1.05rem' }
            }}
          >
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
                  <Button 
                    size="medium" 
                    onClick={() => navigate('/mis-pagos')}
                    sx={{ 
                      color: '#CC6333',
                      fontWeight: 700,
                      '&:hover': { bgcolor: 'rgba(204, 99, 51, 0.08)' }
                    }}
                  >
                    Regularizar
                  </Button>
                }
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(204, 99, 51, 0.15)',
                  border: '2px solid #CC6333',
                  py: 2,
                  px: 3
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  Tienes {pagosVencidos.length} pago(s) vencido(s)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Regulariza tu situación para evitar recargos
                </Typography>
              </Alert>
            )}

            {mensajesSinLeer > 0 && (
              <Alert 
                severity="info"
                icon={<NotificationsActive sx={{ fontSize: 24 }} />}
                action={
                  <Button 
                    size="small"
                    onClick={() => navigate('/mensajes')}
                    sx={{ color: '#CC6333', fontWeight: 600 }}
                  >
                    Leer
                  </Button>
                }
                sx={{ 
                  borderRadius: 3,
                  bgcolor: '#F6F6F6',
                  border: '1px solid #D4D4D4'
                }}
              >
                <Typography variant="body2">
                  Tienes <strong>{mensajesSinLeer} mensajes nuevos</strong> en tu buzón
                </Typography>
              </Alert>
            )}
          </Stack>
        )}

        <QueryHandler isLoading={isLoading} error={null} loadingMessage="Cargando tu resumen...">
          
          {/* ========== GRID PRINCIPAL ========== */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2.5fr 1fr' },
            gap: 4,
            alignItems: 'start'
          }}>
            
            {/* ===== COLUMNA IZQUIERDA ===== */}
            <Box>
              
              {/* HERO KPIs */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
                mb: 4
              }}>
                
                {/* KPI 1: Saldo a Favor */}
                <Card 
                  elevation={0}
                  sx={{ 
                    background: 'linear-gradient(135deg, #CC6333 0%, #E07A4D 100%)',
                    color: '#FFFFFF',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '180px',
                      height: '180px',
                      background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                      borderRadius: '50%',
                      transform: 'translate(40%, -40%)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWallet sx={{ fontSize: 24, opacity: 0.9 }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            textTransform: 'uppercase',
                            letterSpacing: 1.5,
                            fontWeight: 700,
                            opacity: 0.95
                          }}
                        >
                          Saldo a Favor
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: { xs: '2rem', sm: '2.5rem' },
                          lineHeight: 1
                        }}
                      >
                        ${saldoTotalAFavor.toLocaleString()}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ opacity: 0.9, fontSize: '0.9rem' }}
                      >
                        Disponible en todas tus inversiones
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* KPI 2: Próximo Vencimiento */}
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 4,
                    border: '2px solid #ECECEC',
                    bgcolor: '#FFFFFF'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule sx={{ fontSize: 24, color: '#CC6333' }} />
                        <Typography 
                          variant="caption"
                          sx={{ 
                            textTransform: 'uppercase',
                            letterSpacing: 1.2,
                            fontWeight: 700,
                            color: '#333333'
                          }}
                        >
                          Próximo Vencimiento
                        </Typography>
                      </Box>
                      
                      {proximoVencimiento ? (
                        <>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 700,
                              color: '#000000',
                              fontSize: { xs: '1.75rem', sm: '2rem' }
                            }}
                          >
                            ${Number(proximoVencimiento.monto).toLocaleString()}
                          </Typography>
                          <Chip 
                            label={`Vence: ${new Date(proximoVencimiento.fecha_vencimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
                            size="small"
                            sx={{ 
                              bgcolor: '#F6F6F6',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              width: 'fit-content'
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <CheckCircle sx={{ color: '#4CAF50', fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={700} color="#4CAF50">
                              Al día
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            No tienes pagos pendientes
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* ESTADÍSTICAS RÁPIDAS */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
                mb: 5
              }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #ECECEC',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="#CC6333" gutterBottom>
                    {resumenes?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Proyectos Activos
                  </Typography>
                </Paper>

                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #ECECEC',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="#000000" gutterBottom>
                    {resumenes?.reduce((acc, r) => acc + (r.cuotas_pagadas || 0), 0) || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Cuotas Pagadas
                  </Typography>
                </Paper>

                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #ECECEC',
                    textAlign: 'center',
                    gridColumn: { xs: 'span 2', sm: 'auto' }
                  }}
                >
                  <Typography variant="h4" fontWeight={700} color="#000000" gutterBottom>
                    ${suscripciones?.reduce((acc, s) => acc + Number(s.monto_total_pagado || 0), 0).toLocaleString() || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Inversión Total
                  </Typography>
                </Paper>
              </Box>

              {/* SECCIÓN PROYECTOS */}
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={700} color="#000000">
                  Mis Proyectos
                </Typography>
                <Button 
                  variant="text"
                  endIcon={<ChevronRight />}
                  onClick={() => navigate('/mis-suscripciones')}
                  sx={{ 
                    color: '#CC6333',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(204, 99, 51, 0.05)' }
                  }}
                >
                  Ver todos
                </Button>
              </Box>

              {resumenes && resumenes.length > 0 ? (
                <Stack spacing={3}>
                  {resumenes.map((resumen) => {
                    const saldoProyecto = getSaldoPorResumen(resumen.id_suscripcion);
                    
                    return (
                      <Paper 
                        key={resumen.id}
                        elevation={0}
                        sx={{ 
                          p: 3,
                          borderRadius: 4,
                          border: '2px solid #ECECEC',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            borderColor: '#CC6333',
                            boxShadow: '0 8px 24px rgba(204, 99, 51, 0.12)',
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <Box 
                          display="flex" 
                          justifyContent="space-between" 
                          alignItems="flex-start"
                          mb={3}
                          flexWrap="wrap"
                          gap={2}
                        >
                          <Box flex={1}>
                            <Typography variant="h6" fontWeight={700} color="#000000" gutterBottom>
                              {resumen.nombre_proyecto}
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                              <Chip 
                                label={`${resumen.meses_proyecto} cuotas`}
                                size="small"
                                sx={{ 
                                  bgcolor: '#F6F6F6',
                                  fontWeight: 600,
                                  fontSize: '0.8rem'
                                }}
                              />
                              {saldoProyecto > 0 && (
                                <Chip 
                                  label={`+$${saldoProyecto.toLocaleString()} a favor`}
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#E8F5E9',
                                    color: '#2E7D32',
                                    fontWeight: 700,
                                    fontSize: '0.8rem'
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>

                          <Button 
                            variant="outlined"
                            size="small"
                            endIcon={<ChevronRight />}
                            onClick={() => navigate('/mis-suscripciones')}
                            sx={{ 
                              borderRadius: 2,
                              borderWidth: 2,
                              fontWeight: 600,
                              minWidth: { xs: '100%', sm: 'auto' }
                            }}
                          >
                            Ver detalle
                          </Button>
                        </Box>

                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={1.5}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                              Progreso del plan
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={800}
                              sx={{ 
                                color: '#CC6333',
                                fontSize: '1rem'
                              }}
                            >
                              {resumen.porcentaje_pagado.toFixed(0)}%
                            </Typography>
                          </Box>
                          
                          <LinearProgress 
                            variant="determinate" 
                            value={resumen.porcentaje_pagado} 
                            sx={{ 
                              height: 12,
                              borderRadius: 6,
                              bgcolor: '#ECECEC',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                background: 'linear-gradient(90deg, #CC6333 0%, #E07A4D 100%)',
                                boxShadow: '0 2px 8px rgba(204, 99, 51, 0.3)'
                              }
                            }} 
                          />

                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            display="block"
                            mt={1}
                            fontWeight={500}
                          >
                            Progreso: {resumen.porcentaje_pagado.toFixed(1)}% completado
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 6,
                    textAlign: 'center',
                    bgcolor: '#F6F6F6',
                    borderRadius: 4,
                    border: '2px dashed #D4D4D4'
                  }}
                >
                  <TrendingUp sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                    Tu portafolio está vacío
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Explora nuestros proyectos y comienza a construir tu futuro
                  </Typography>
                  <Button 
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/proyectos/ahorrista')}
                    sx={{ 
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 700
                    }}
                  >
                    Explorar Proyectos
                  </Button>
                </Paper>
              )}
            </Box>

            {/* ===== COLUMNA DERECHA (SIDEBAR) ===== */}
            <Box sx={{ 
              position: { lg: 'sticky' },
              top: { lg: 24 }
            }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4,
                  borderRadius: 4,
                  border: '2px solid #ECECEC',
                  bgcolor: '#FFFFFF'
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight={700} mb={3} color="#000000">
                  Acciones Rápidas
                </Typography>
                
                <Stack spacing={2}>
                  <Button 
                    variant="contained"
                    startIcon={<AccountBalanceWallet />}
                    size="large"
                    fullWidth
                    onClick={() => navigate('/mis-pagos')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(204, 99, 51, 0.25)'
                    }}
                  >
                    Pagar Cuotas
                  </Button>
                  
                  <Button 
                    variant="outlined"
                    startIcon={<Gavel />}
                    size="large"
                    fullWidth
                    onClick={() => navigate('/mis-pujas')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                      py: 1.5,
                      fontWeight: 600,
                      borderWidth: 2
                    }}
                  >
                    Mis Subastas
                  </Button>
                  
                  <Button 
                    variant="outlined"
                    startIcon={<Description />}
                    size="large"
                    fullWidth
                    onClick={() => navigate('/mis-documentos')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                      py: 1.5,
                      fontWeight: 600,
                      borderWidth: 2
                    }}
                  >
                    Mis Contratos
                  </Button>
                </Stack>

                <Divider sx={{ my: 4 }} />

                <Box 
                  sx={{ 
                    bgcolor: '#F6F6F6',
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom fontWeight={700} color="#000000">
                    ¿Necesitas ayuda?
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" mb={2.5} lineHeight={1.6}>
                    Nuestro equipo está disponible para resolver tus dudas
                  </Typography>
                  <Button 
                    variant="outlined"
                    size="medium"
                    fullWidth
                    onClick={() => navigate('/mensajes')}
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 600,
                      borderWidth: 2
                    }}
                  >
                    Contactar Soporte
                  </Button>
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
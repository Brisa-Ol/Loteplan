// src/pages/User/Subastas/MisPujas.tsx

import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, Chip, Alert, Divider,
  Card, CardContent, CardMedia, CardActions,
  alpha, useTheme, CircularProgress
} from '@mui/material';
import {
  Gavel, AccessTime, CheckCircle, Cancel, Visibility,
  MonetizationOn, CalendarMonth, EmojiEvents, DeleteOutline
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { PujaDto } from '../../../types/dto/puja.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// Hooks
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import PujaService from '../../../services/puja.service';
import ImagenService from '../../../services/imagen.service';

// ✅ Hook Global
import { useSnackbar } from '../../../context/SnackbarContext';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // ✅ Usamos el contexto global para éxito
  const { showSuccess } = useSnackbar();

  // 1. Estados y Hooks para 2FA y Selección
  const twoFaModal = useModal();
  const confirmDialog = useConfirmDialog();
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // 2. Obtener mis pujas
  const { data: pujas, isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });

  // 3. Mutación para Pagar
  const payMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      // Seteamos highlighted para feedback visual inmediato
      setHighlightedId(pujaId);
      return await PujaService.iniciarPagoGanadora(pujaId);
    },
    onSuccess: (response) => {
      const data = response.data;
      
      // Caso A: Requiere 2FA (Status 202 o flag is2FARequired)
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      } 
      
      // Caso B: Redirección directa a Mercado Pago
      if (data.url_checkout) {
        window.location.href = data.url_checkout;
      }
    },
    onError: () => {
      // Limpiamos selección si falla, el error sale por Snackbar Global
      setHighlightedId(null);
      setSelectedPujaId(null); 
    }
  });

  // 4. Mutación para Confirmar con 2FA
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPujaId) throw new Error("ID de puja perdido.");
      return await PujaService.confirmarPago2FA({
        pujaId: selectedPujaId,
        codigo_2fa: codigo
      });
    },
    onSuccess: (response) => {
      if (response.data.url_checkout) {
        window.location.href = response.data.url_checkout;
      }
      twoFaModal.close();
    },
    onError: (err: any) => {
        // Mantenemos el error local del modal para feedback específico en el input
        setTwoFAError(err.response?.data?.error || "Código inválido.");
    }
  });

  // 5. Mutación para Cancelar Puja
  const cancelPujaMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      return await PujaService.cancelMyPuja(pujaId);
    },
    onSuccess: (_, pujaId) => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['misPujas'] });
      queryClient.invalidateQueries({ queryKey: ['lote'] });
      queryClient.invalidateQueries({ queryKey: ['lotesProyecto'] });
      
      // Feedback visual
      setHighlightedId(pujaId);
      setTimeout(() => setHighlightedId(null), 2500);
      
      // ✅ Mostrar mensaje de éxito global
      showSuccess('Puja cancelada exitosamente');
      
      confirmDialog.close();
    },
    onError: () => {
      // Solo cerramos el diálogo, el error sale por Snackbar Global
      confirmDialog.close();
    }
  });

  // Handler para cancelar puja
  const handleCancelarPuja = (puja: PujaDto) => {
    confirmDialog.confirm('cancel_puja', puja);
  };

  // Handler para confirmar cancelación
  const handleConfirmCancel = () => {
    if (confirmDialog.data) {
      cancelPujaMutation.mutate(confirmDialog.data.id);
    }
  };

  // Helper de Configuración Visual de Estados
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'activa': return { label: 'En Curso', color: 'info' as const, icon: <AccessTime fontSize="small" /> };
      case 'ganadora_pendiente': return { label: 'Ganaste - Pagar Ahora', color: 'warning' as const, icon: <EmojiEvents fontSize="small" /> };
      case 'ganadora_pagada': return { label: 'Adjudicado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'perdedora': return { label: 'Superada', color: 'error' as const, icon: <Cancel fontSize="small" /> };
      default: return { label: status, color: 'default' as const, icon: null };
    }
  };

  // Helper de Formato de Moneda (ARS)
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  return (
    <PageContainer maxWidth="lg">
      
      <PageHeader 
        title="Mis Subastas" 
        subtitle='Seguimiento de tus ofertas y lotes ganados.'
      />
      
      <QueryHandler isLoading={isLoading} error={error as Error} loadingMessage="Cargando subastas...">
        {pujas && pujas.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 3 }}>
            {pujas.map((puja) => {
              const status = getStatusConfig(puja.estado_puja);
              const lote = puja.lote;
              const idProyecto = lote?.id_proyecto;
              const imgUrl = lote?.imagenes?.[0]?.url
                ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
                : undefined;

              const isWinnerPending = puja.estado_puja === 'ganadora_pendiente';
              const puedeCancelar = puja.estado_puja === 'activa'; 
              const isHighlighted = highlightedId === puja.id;

              return (
                <Card
                  key={puja.id}
                  elevation={0}
                  sx={{
                    display: 'flex', flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isHighlighted 
                      ? 'success.main' 
                      : isWinnerPending 
                        ? 'warning.main' 
                        : 'divider',
                    borderWidth: isHighlighted ? 2 : 1,
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.05) : 'background.paper',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] }
                  }}
                >
                  {/* Badge Flotante */}
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    icon={status.icon as any}
                    sx={{ 
                      position: 'absolute', top: 12, right: 12, 
                      fontWeight: 700, boxShadow: 2, zIndex: 2
                    }}
                  />

                  {/* Imagen Header */}
                  <Box sx={{ position: 'relative', height: 180, bgcolor: 'grey.100' }}>
                    {imgUrl ? (
                      <CardMedia
                        component="img"
                        height="180"
                        image={imgUrl}
                        alt="Imagen Lote"
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          <Gavel sx={{ fontSize: 50, opacity: 0.5 }} />
                      </Box>
                    )}
                    {/* Overlay gradiente */}
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)' }} />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom noWrap title={lote?.nombre_lote}>
                      {lote?.nombre_lote || `Lote #${puja.id_lote}`}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Proyecto ID: {idProyecto || 'N/A'}
                    </Typography>

                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                    <Stack spacing={1.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                           <MonetizationOn fontSize="small" />
                           <Typography variant="caption" fontWeight={600}>TU OFERTA</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {formatCurrency(Number(puja.monto_puja))}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                           <CalendarMonth fontSize="small" />
                           <Typography variant="caption" fontWeight={600}>FECHA</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(puja.fecha_puja).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>

                    {isWinnerPending && puja.fecha_vencimiento_pago && (() => {
                      const diasRestantes = PujaService.calcularDiasRestantes(puja.fecha_vencimiento_pago);
                      const esUrgente = diasRestantes <= 7;
                      const venceHoy = diasRestantes === 0;
                      const venceManana = diasRestantes === 1;
                      
                      return (
                        <Alert 
                          severity={venceHoy ? "error" : esUrgente ? "warning" : "info"} 
                          sx={{ 
                            mt: 2, 
                            borderRadius: 2,
                            bgcolor: venceHoy 
                              ? alpha(theme.palette.error.main, 0.1)
                              : esUrgente
                                ? alpha(theme.palette.warning.main, 0.1)
                                : alpha(theme.palette.info.main, 0.1)
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            <Box>
                              <Typography variant="caption" fontWeight={700} display="block">
                                {venceHoy 
                                  ? "⚠️ VENCE HOY - Paga inmediatamente"
                                  : venceManana
                                    ? "⚠️ Vence MAÑANA"
                                    : esUrgente
                                      ? `⚠️ ${diasRestantes} días restantes`
                                      : `${diasRestantes} días restantes`
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Vence el: {new Date(puja.fecha_vencimiento_pago).toLocaleDateString('es-AR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                            </Box>
                            <Chip 
                              label={
                                venceHoy 
                                  ? "URGENTE"
                                  : esUrgente
                                    ? `${diasRestantes}d`
                                    : `${diasRestantes} días`
                              }
                              color={venceHoy ? "error" : esUrgente ? "warning" : "default"}
                              size="small"
                              sx={{ 
                                fontWeight: 800,
                                fontSize: venceHoy ? '0.75rem' : '0.7rem'
                              }}
                            />
                          </Stack>
                        </Alert>
                      );
                    })()}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
                    <Stack direction="column" spacing={1} width="100%">
                      <Stack direction="row" spacing={1} width="100%">
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<Visibility />}
                          onClick={() => idProyecto && navigate(`/proyectos/${idProyecto}`)}
                          disabled={!idProyecto}
                        >
                          Ver Proyecto
                        </Button>

                        {isWinnerPending && (
                          <Button
                            variant="contained"
                            color="warning"
                            fullWidth
                            startIcon={payMutation.isPending && selectedPujaId === puja.id ? <CircularProgress size={20} color="inherit" /> : <MonetizationOn />}
                            onClick={() => {
                              setSelectedPujaId(puja.id);
                              payMutation.mutate(puja.id);
                            }}
                            disabled={payMutation.isPending}
                            sx={{ fontWeight: 700 }}
                          >
                            {payMutation.isPending && selectedPujaId === puja.id ? 'Procesando...' : 'Pagar'}
                          </Button>
                        )}
                      </Stack>

                      {/* Botón Cancelar Puja - Solo para pujas activas */}
                      {puedeCancelar && (
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          size="small"
                          startIcon={cancelPujaMutation.isPending && confirmDialog.data?.id === puja.id ? <CircularProgress size={16} color="inherit" /> : <DeleteOutline />}
                          onClick={() => handleCancelarPuja(puja)}
                          disabled={cancelPujaMutation.isPending || payMutation.isPending}
                          sx={{ 
                            mt: 0.5,
                            borderStyle: 'dashed',
                            '&:hover': {
                              borderStyle: 'solid',
                              bgcolor: alpha(theme.palette.error.main, 0.05)
                            }
                          }}
                        >
                          {cancelPujaMutation.isPending && confirmDialog.data?.id === puja.id 
                            ? 'Cancelando...' 
                            : 'Cancelar Puja'}
                        </Button>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Card 
            elevation={0} 
            sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'background.default', 
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 4
            }}
          >
            <Box 
              sx={{ 
                  width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%',
                  bgcolor: alpha(theme.palette.text.secondary, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
               <Gavel sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.secondary" gutterBottom>
              No has participado en subastas
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Explora los proyectos de inversión directa y encuentra tu lote ideal.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/proyectos/RolSeleccion')}
            >
              Ver Oportunidades
            </Button>
          </Card>
        )}
      </QueryHandler>

      {/* Modal 2FA */}
      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedPujaId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Pago"
        description="Ingresa el código para asegurar tu lote ganado."
      />

      {/* Dialog de Confirmación para Cancelar Puja */}
      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmCancel}
      />

      {/* ✅ <Snackbar> manual eliminado */}

    </PageContainer>
  );
};

export default MisPujas;
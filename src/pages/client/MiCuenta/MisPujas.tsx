import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, Chip, Alert, Divider,
  Card, CardContent, CardMedia, CardActions,
  alpha, useTheme, CircularProgress
} from '@mui/material';
import {
  Gavel, Payment, AccessTime, CheckCircle, Cancel, Visibility,
  MonetizationOn, CalendarMonth, EmojiEvents
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Servicios y Tipos
import PujaService from '../../../services/puja.service';
import type { PujaDto } from '../../../types/dto/puja.dto';
import ImagenService from '../../../services/imagen.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// Hooks
import { useModal } from '../../../hooks/useModal';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // 1. Estados y Hooks para 2FA y Selección
  const twoFaModal = useModal();
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // 2. Obtener mis pujas
  const { data: pujas, isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });

  // 3. Mutación para Pagar
  const payMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      return await PujaService.iniciarPagoGanadora(pujaId);
    },
    onSuccess: (response, pujaId) => {
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
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Error al iniciar el pago');
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
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido.")
  });

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

              return (
                <Card
                  key={puja.id}
                  elevation={0}
                  sx={{
                    display: 'flex', flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isWinnerPending ? 'warning.main' : 'divider',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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

                    {isWinnerPending && puja.fecha_vencimiento_pago && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight={600}>
                           Vence el: {new Date(puja.fecha_vencimiento_pago).toLocaleDateString()}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
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
                          startIcon={payMutation.isPending && selectedPujaId === puja.id ? <CircularProgress size={20} color="inherit" /> : <Payment />}
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

    </PageContainer>
  );
};

export default MisPujas;
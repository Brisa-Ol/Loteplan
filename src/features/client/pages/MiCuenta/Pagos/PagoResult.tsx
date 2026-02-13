// src/pages/Client/Pagos/PagoResult.tsx

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Typography, Button, CircularProgress, 
  Stack, Card, Avatar, Divider, useTheme, alpha 
} from '@mui/material';
import { 
  CheckCircle, Error, HourglassEmpty, Refresh, 
  Home, ReceiptLong, ArrowForward 
} from '@mui/icons-material';

import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { env } from '@/core/config/env';
import MercadoPagoService from '@/core/api/services/pagoMercado.service';

const PagoResult: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const transaccionId = searchParams.get('transaccion');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['paymentStatus', transaccionId],
    queryFn: async () => {
      if (!transaccionId) return null;
      return (await MercadoPagoService.getPaymentStatus(Number(transaccionId), true)).data;
    },
    enabled: !!transaccionId,
    retry: 2,
    refetchInterval: (query) => {
        const estado = query.state.data?.transaccion?.estado;
        if (estado === 'pendiente' || estado === 'en_proceso') return 4000;
        return false; 
    }
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  const getStatusContent = () => {
    const estadoTx = data?.transaccion?.estado;
    const estadoPasarela = data?.pagoPasarela?.estado;

    // 1. ÉXITO
    if (estadoTx === 'pagado') {
      return {
        icon: <CheckCircle sx={{ fontSize: 64 }} />,
        title: '¡Pago Confirmado!',
        desc: `La operación #${transaccionId} se ha procesado correctamente.`,
        color: 'success' as const, 
        isPending: false
      };
    }

    // 2. FALLO
    if (['fallido', 'reembolsado', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(estadoTx || '')) {
      const detalle = estadoPasarela === 'rechazado' 
        ? 'El método de pago fue rechazado por la entidad financiera.' 
        : 'Hubo un problema al procesar tu solicitud.';

      return {
        icon: <Error sx={{ fontSize: 64 }} />,
        title: 'Pago No Completado',
        desc: detalle,
        color: 'error' as const,
        isPending: false
      };
    }

    // 3. PENDIENTE (Default)
    return {
      icon: <HourglassEmpty sx={{ fontSize: 64 }} />,
      title: 'Procesando Pago...',
      desc: 'Aguardando confirmación de la pasarela de pagos. Esto puede tomar unos instantes.',
      color: 'warning' as const,
      isPending: true
    };
  };

  if (!transaccionId) return <Box p={8} textAlign="center"><Typography>No se encontró información de la transacción.</Typography></Box>;
  
  if (isLoading) return (
    <Box height="80vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={3}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>Verificando transacción...</Typography>
    </Box>
  );

  if (isError) return <Box p={8} textAlign="center"><Typography color="error">Error de conexión al verificar el pago.</Typography></Box>;

  const content = getStatusContent();
  const themeColor = theme.palette[content.color];

  return (
    <PageContainer maxWidth="sm">
      <Card 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 6 }, 
          textAlign: 'center', 
          borderRadius: 4, 
          mt: 4,
          border: `1px solid ${alpha(themeColor.main, 0.2)}`,
          background: `linear-gradient(180deg, ${alpha(themeColor.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
          boxShadow: theme.shadows[4]
        }}
      >
        {/* ICONO */}
        <Box mb={3} display="flex" justifyContent="center">
            <Avatar 
                sx={{ 
                    width: 110, 
                    height: 110, 
                    bgcolor: alpha(themeColor.main, 0.1), 
                    color: themeColor.main,
                    mb: 1,
                    animation: content.isPending ? 'pulse 2s infinite ease-in-out' : 'none',
                    boxShadow: `0 0 0 10px ${alpha(themeColor.main, 0.05)}`,
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${alpha(themeColor.main, 0.4)}` },
                        '70%': { transform: 'scale(1.05)', boxShadow: `0 0 0 20px ${alpha(themeColor.main, 0)}` },
                        '100%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${alpha(themeColor.main, 0)}` },
                    }
                }}
            >
                {content.icon}
            </Avatar>
        </Box>
        
        <Typography variant="h4" fontWeight={800} color={themeColor.main} gutterBottom>
          {content.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '400px', mx: 'auto', mb: 4, lineHeight: 1.6 }}>
          {content.desc}
        </Typography>

        {/* Botón de actualizar si está pendiente */}
        {content.isPending && (
            <Button 
                startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                onClick={() => refetch()}
                variant="outlined"
                color="warning"
                sx={{ mb: 4, borderRadius: 2 }}
            >
                Actualizar Estado
            </Button>
        )}

        {/* TICKET DE DETALLES */}
        {data?.pagoPasarela && (
          <Box 
            sx={{ 
                bgcolor: 'background.paper', 
                p: 3, 
                borderRadius: 2, 
                mb: 4, 
                textAlign: 'left',
                border: `1px dashed ${theme.palette.divider}`,
                position: 'relative'
            }}
          >
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                    <ReceiptLong fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Total Procesado</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                    {formatCurrency(Number(data.pagoPasarela.monto))}
                </Typography>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">ID Transacción</Typography>
                <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="text.primary">
                    {transaccionId}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Referencia MercadoPago</Typography>
                <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="text.primary">
                    {data.pagoPasarela.transaccionIdPasarela || '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ACCIONES */}
       {/* ACCIONES */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button 
            variant="outlined" 
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ 
                borderRadius: 2,
                color: 'text.secondary',
                borderColor: theme.palette.divider,
                flex: 1
            }}
          >
            Inicio
          </Button>

          <Button 
            variant="contained" 
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => {
              // 💡 LÓGICA DINÁMICA DE REDIRECCIÓN basada en tu DTO
              const tipoTx = data?.transaccion?.tipo;
              
              // Evaluamos según los tipos de transacción que maneja tu sistema
              if (tipoTx === 'Puja' || tipoTx === 'pago_puja') {
                navigate('/client/finanzas/pujas');
              } else if (tipoTx === 'pago_suscripcion_inicial' || tipoTx === 'inversion') {
                navigate('/client/finanzas/resumenes');
              } else {
                // Si es 'mensual' o 'pago' regular
                navigate('/client/finanzas/pagos'); 
              }
            }}
            disableElevation
            sx={{ 
                borderRadius: 2,
                bgcolor: themeColor.main,
                '&:hover': { bgcolor: themeColor.dark },
                flex: 1,
                fontWeight: 700
            }}
          >
            Ver Movimientos
          </Button>
        </Stack>
      </Card>
      
    </PageContainer>
  );
};

export default PagoResult;
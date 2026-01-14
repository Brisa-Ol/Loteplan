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
  Home, History, ReceiptLong 
} from '@mui/icons-material';
import MercadoPagoService from '../../../../services/pagoMercado.service';
import { PageContainer } from '../../../../../shared/components/layout/containers/PageContainer/PageContainer';

// ✅ Importamos configuración centralizada
import { env } from '../../../../config/env';

const PagoResult: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const transaccionId = searchParams.get('transaccion');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['paymentStatus', transaccionId],
    queryFn: async () => {
      if (!transaccionId) return null;
      // sync=true fuerza al backend a consultar a MP si es necesario
      return (await MercadoPagoService.getPaymentStatus(Number(transaccionId), true)).data;
    },
    enabled: !!transaccionId,
    retry: 2,
    // 🔄 POLLING INTELIGENTE:
    // Seguir consultando cada 4s mientras el estado sea intermedio
    refetchInterval: (query) => {
        const estado = query.state.data?.transaccion?.estado;
        if (estado === 'pendiente' || estado === 'en_proceso') return 4000;
        return false; 
    }
  });

  // Helper de Formato
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
        icon: <CheckCircle sx={{ fontSize: 60 }} />,
        title: '¡Pago Exitoso!',
        desc: `La transacción #${transaccionId} fue aprobada correctamente.`,
        color: 'success' as const, 
        isPending: false
      };
    }

    // 2. FALLO
    if (['fallido', 'reembolsado', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(estadoTx || '')) {
      const detalle = estadoPasarela === 'rechazado' 
        ? 'El método de pago fue rechazado por la entidad financiera.' 
        : 'Hubo un problema con el procesamiento.';

      return {
        icon: <Error sx={{ fontSize: 60 }} />,
        title: 'El pago no se completó',
        desc: detalle,
        color: 'error' as const,
        isPending: false
      };
    }

    // 3. PENDIENTE (Default)
    return {
      icon: <HourglassEmpty sx={{ fontSize: 60 }} />,
      title: 'Procesando Pago...',
      desc: 'Estamos esperando la confirmación final de Mercado Pago. Esto puede tardar unos segundos.',
      color: 'warning' as const,
      isPending: true
    };
  };

  if (!transaccionId) return <Box p={4} textAlign="center"><Typography>Falta ID de transacción</Typography></Box>;
  
  if (isLoading) return (
    <Box height="60vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2}>
        <CircularProgress size={60} thickness={4} />
        <Typography color="text.secondary" fontWeight={500}>Verificando estado del pago...</Typography>
    </Box>
  );

  if (isError) return <Box p={4} textAlign="center"><Typography color="error">Error al consultar el estado del pago.</Typography></Box>;

  const content = getStatusContent();
  const themeColor = theme.palette[content.color];

  return (
    <PageContainer maxWidth="sm">
      <Card 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          textAlign: 'center', 
          borderRadius: 4, 
          mt: 4,
          border: `1px solid ${alpha(themeColor.main, 0.3)}`,
          bgcolor: alpha(themeColor.main, 0.02),
          boxShadow: theme.shadows[3]
        }}
      >
        {/* ICONO CON ANIMACIÓN */}
        <Box mb={3} display="flex" justifyContent="center">
            <Avatar 
                sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: alpha(themeColor.main, 0.1), 
                    color: themeColor.main,
                    mb: 1,
                    // Animación de pulso si está pendiente
                    animation: content.isPending ? 'pulse 2s infinite ease-in-out' : 'none',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${alpha(themeColor.main, 0.4)}` },
                        '70%': { transform: 'scale(1.05)', boxShadow: `0 0 0 15px ${alpha(themeColor.main, 0)}` },
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
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '400px', mx: 'auto', mb: 3 }}>
          {content.desc}
        </Typography>

        {/* Botón de actualización manual si está pendiente */}
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

        {/* DETALLES DE LA TRANSACCIÓN (Estilo Ticket) */}
        {data?.pagoPasarela && (
          <Box 
            sx={{ 
                bgcolor: 'background.paper', 
                p: 3, 
                borderRadius: 3, 
                mb: 4, 
                textAlign: 'left',
                border: `1px dashed ${theme.palette.divider}`,
                position: 'relative',
                overflow: 'hidden'
            }}
          >
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                    <ReceiptLong fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Monto Total</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                    {formatCurrency(Number(data.pagoPasarela.monto))}
                </Typography>
              </Box>

              <Divider />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Referencia MP:</Typography>
                <Typography variant="caption" fontWeight={600} fontFamily="monospace">
                    {data.pagoPasarela.transaccionIdPasarela || 'N/A'}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Estado Pasarela:</Typography>
                <Box 
                    sx={{ 
                        textTransform: 'uppercase', 
                        fontWeight: 'bold', 
                        fontSize: '0.7rem',
                        bgcolor: alpha(themeColor.main, 0.1),
                        color: themeColor.main,
                        px: 1, py: 0.5, borderRadius: 1
                    }}
                >
                    {data.pagoPasarela.estado}
                </Box>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ACCIONES */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button 
            variant="outlined" 
            size="large"
            startIcon={<History />}
            onClick={() => navigate('/client/MiCuenta/MisTransacciones')}
            sx={{ 
                borderRadius: 2,
                color: 'text.secondary',
                borderColor: theme.palette.divider
            }}
          >
            Ver Historial
          </Button>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            disableElevation
            sx={{ 
                borderRadius: 2,
                bgcolor: themeColor.main,
                '&:hover': { bgcolor: themeColor.dark }
            }}
          >
            Ir al Inicio
          </Button>
        </Stack>
      </Card>
      
    </PageContainer>
  );
};

export default PagoResult;
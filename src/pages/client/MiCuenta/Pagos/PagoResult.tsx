import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { CheckCircle, Error, HourglassEmpty, Refresh } from '@mui/icons-material';
import MercadoPagoService from '../../../../Services/pagoMercado.service';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';

const PagoResult: React.FC = () => {
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

  const getStatusContent = () => {
    const estadoTx = data?.transaccion?.estado;
    const estadoPasarela = data?.pagoPasarela?.estado;

    // 1. ÉXITO
    if (estadoTx === 'pagado') {
      return {
        icon: <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />,
        title: '¡Pago Exitoso!',
        desc: `La transacción #${transaccionId} fue aprobada correctamente.`,
        color: 'success.main',
        canRetry: false
      };
    }

    // 2. FALLO
    if (['fallido', 'reembolsado', 'rechazado_por_capacidad', 'rechazado_proyecto_cerrado', 'expirado'].includes(estadoTx || '')) {
      const detalle = estadoPasarela === 'rechazado' 
        ? 'El método de pago fue rechazado por la entidad financiera.' 
        : 'Hubo un problema con el procesamiento.';

      return {
        icon: <Error sx={{ fontSize: 80, color: 'error.main' }} />,
        title: 'El pago no se completó',
        desc: detalle,
        color: 'error.main',
        canRetry: true
      };
    }

    // 3. PENDIENTE (Default)
    return {
      icon: <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main' }} />,
      title: 'Procesando Pago...',
      desc: 'Estamos esperando la confirmación final de Mercado Pago. Esto puede tardar unos segundos.',
      color: 'warning.main',
      canRetry: false,
      isPending: true
    };
  };

  if (!transaccionId) return <Box p={4}><Typography>Falta ID de transacción</Typography></Box>;
  if (isLoading) return <Box height="50vh" display="flex" justifyContent="center" alignItems="center"><CircularProgress /></Box>;
  if (isError) return <Box p={4}><Typography color="error">Error al consultar el estado del pago.</Typography></Box>;

  const content = getStatusContent();

  return (
    <PageContainer maxWidth="sm">
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4, mt: 4 }}>
        <Box mb={3}>
            {/* Animación de pulso si está pendiente */}
            <Box sx={{ animation: content.isPending ? 'pulse 2s infinite' : 'none' }}>
                {content.icon}
            </Box>
        </Box>
        
        <Typography variant="h4" fontWeight={800} color={content.color} gutterBottom>
          {content.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {content.desc}
        </Typography>

        {/* Botón de actualización manual si está pendiente */}
        {content.isPending && (
            <Button 
                startIcon={isFetching ? <CircularProgress size={16} /> : <Refresh />}
                onClick={() => refetch()}
                sx={{ mb: 3 }}
            >
                Actualizar Estado
            </Button>
        )}

        {data?.pagoPasarela && (
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 4, textAlign: 'left' }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Monto:</Typography>
                <Typography variant="body2" fontWeight={700}>${Number(data.pagoPasarela.monto).toLocaleString()}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Referencia MP:</Typography>
                {/* ✅ CORRECCIÓN AQUÍ: Usamos transaccionIdPasarela */}
                <Typography variant="body2">{data.pagoPasarela.transaccionIdPasarela || 'N/A'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Estado Pasarela:</Typography>
                <Typography variant="body2" sx={{textTransform: 'capitalize', fontWeight: 'bold'}}>
                    {data.pagoPasarela.estado}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="outlined" onClick={() => navigate('/client/MiCuenta/MisTransacciones')}>
            Ver Historial
          </Button>
          <Button variant="contained" onClick={() => navigate('/')}>
            Ir al Inicio
          </Button>
        </Stack>
      </Paper>
      
      {/* Estilo keyframes para la animación simple */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </PageContainer>
  );
};

export default PagoResult;
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { CheckCircle, Error, HourglassEmpty } from '@mui/icons-material';
import MercadoPagoService from '../../../../Services/pagoMercado.service';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';


const PagoResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const transaccionId = searchParams.get('transaccion');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paymentStatus', transaccionId],
    queryFn: async () => {
      if (!transaccionId) return null;
      return (await MercadoPagoService.getPaymentStatus(Number(transaccionId), true)).data;
    },
    enabled: !!transaccionId,
    retry: 2
  });

  const getStatusContent = () => {
    // Estado General (Transacción)
    const estadoTx = data?.transaccion?.estado;
    // Estado Detallado (Pasarela) - Opcional, puede ser null
    const estadoPasarela = data?.pagoPasarela?.estado;

    // 1. ÉXITO (Transacción 'pagado')
    if (estadoTx === 'pagado') {
      return {
        icon: <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />,
        title: '¡Pago Exitoso!',
        desc: `La transacción #${transaccionId} fue aprobada correctamente.`,
        color: 'success.main'
      };
    }

    // 2. FALLO (Transacción 'fallido', 'reembolsado', etc.)
    if (
      estadoTx === 'fallido' || 
      estadoTx === 'reembolsado' ||
      estadoTx === 'rechazado_por_capacidad' ||
      estadoTx === 'rechazado_proyecto_cerrado' ||
      estadoTx === 'expirado'
    ) {
      // Mensaje personalizado si sabemos que la pasarela lo rechazó
      const detalle = estadoPasarela === 'rechazado' 
        ? 'El método de pago fue rechazado por la entidad financiera.' 
        : 'Hubo un problema con el procesamiento. Por favor intenta nuevamente.';

      return {
        icon: <Error sx={{ fontSize: 80, color: 'error.main' }} />,
        title: 'El pago no se completó',
        desc: detalle,
        color: 'error.main'
      };
    }

    // 3. PENDIENTE (Transacción 'pendiente', 'en_proceso')
    return {
      icon: <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main' }} />,
      title: 'Pago en Proceso',
      desc: 'Estamos esperando la confirmación final de Mercado Pago.',
      color: 'warning.main'
    };
  };

  if (!transaccionId) return <Box p={4}><Typography>Falta ID de transacción</Typography></Box>;
  if (isLoading) return <Box height="50vh" display="flex" justifyContent="center" alignItems="center"><CircularProgress /></Box>;
  if (isError) return <Box p={4}><Typography color="error">Error al consultar el estado del pago.</Typography></Box>;

  const content = getStatusContent();

  return (
    <PageContainer maxWidth="sm">
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4, mt: 4 }}>
        <Box mb={3}>{content.icon}</Box>
        
        <Typography variant="h4" fontWeight={800} color={content.color} gutterBottom>
          {content.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {content.desc}
        </Typography>

        {data?.pagoPasarela && (
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 4, textAlign: 'left' }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Monto:</Typography>
                <Typography variant="body2" fontWeight={700}>${Number(data.pagoPasarela.monto).toLocaleString()}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Referencia MP:</Typography>
                <Typography variant="body2">{data.pagoPasarela.transaccionIdPasarela}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Estado Pasarela:</Typography>
                <Typography variant="body2" sx={{textTransform: 'capitalize', fontWeight: 'bold'}}>
                    {/* Mostramos el estado real de la pasarela: aprobado, rechazado, etc. */}
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
    </PageContainer>
  );
};

export default PagoResult;
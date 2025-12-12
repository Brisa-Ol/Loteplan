import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Stack, Chip, Button, 
  Alert, Tooltip, CircularProgress 
} from '@mui/material';
import { 
  TrendingUp, EventRepeat, Gavel, CheckCircle, 
  ErrorOutline, HourglassEmpty, Refresh, ReceiptLong 
} from '@mui/icons-material';
import type { TransaccionDto } from '../../../../types/dto/transaccion.dto';
import TransaccionService from '../../../../Services/transaccion.service';
import MercadoPagoService from '../../../../Services/pagoMercado.service';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';



const MisTransacciones: React.FC = () => {
  const { data: transacciones, isLoading, error } = useQuery<TransaccionDto[]>({
    queryKey: ['misTransacciones'],
    queryFn: async () => (await TransaccionService.getMyTransactions()).data
  });

  // Mutación para REINTENTAR el pago (Checkout Generico)
  const retryMutation = useMutation({
    mutationFn: async (idTransaccion: number) => {
      // Llamamos al endpoint: /payment/checkout/generico
      return await MercadoPagoService.createCheckoutGenerico({ id_transaccion: idTransaccion });
    },
    onSuccess: (res) => {
      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    },
    onError: (err: any) => alert(err.response?.data?.error || "Error al regenerar checkout.")
  });

  const getTypeConfig = (t: TransaccionDto) => {
    switch (t.tipo_transaccion) {
      case 'directo': return { icon: <TrendingUp />, color: 'info.main', bg: 'info.light', label: 'Inversión' };
      case 'mensual': return { icon: <EventRepeat />, color: 'secondary.main', bg: 'secondary.light', label: 'Cuota' };
      case 'pago_suscripcion_inicial': return { icon: <EventRepeat />, color: 'primary.main', bg: 'primary.light', label: 'Suscripción Inicial' };
      case 'Puja': return { icon: <Gavel />, color: 'warning.main', bg: 'warning.light', label: 'Subasta' };
      default: return { icon: <ReceiptLong />, color: 'grey.600', bg: 'grey.200', label: 'Operación' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pagado': return { color: 'success', label: 'Pagado', icon: <CheckCircle fontSize="small"/> };
      case 'pendiente': case 'en_proceso': return { color: 'warning', label: 'Pendiente', icon: <HourglassEmpty fontSize="small"/> };
      case 'fallido': case 'rechazado_por_capacidad': case 'rechazado_proyecto_cerrado': return { color: 'error', label: 'Fallido', icon: <ErrorOutline fontSize="small"/> };
      case 'reembolsado': return { color: 'info', label: 'Reembolsado', icon: <Refresh fontSize="small"/> };
      case 'expirado': return { color: 'default', label: 'Expirado', icon: <ErrorOutline fontSize="small"/> };
      default: return { color: 'default', label: status };
    }
  };

  const getDescription = (t: TransaccionDto) => {
    const proyecto = t.proyectoTransaccion?.nombre_proyecto || 'Proyecto no disponible';
    if (t.tipo_transaccion === 'mensual' && t.pagoMensual) return `${proyecto} - Cuota #${t.pagoMensual.mes}`;
    if (t.tipo_transaccion === 'pago_suscripcion_inicial') return `${proyecto} - Suscripción Inicial`;
    if (t.tipo_transaccion === 'directo') return `${proyecto} - Inversión Directa`;
    if (t.tipo_transaccion === 'Puja') return `${proyecto} - Pago de Subasta`;
    return `Transacción - ${proyecto}`;
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Historial de Transacciones" subtitle="Registro detallado de tus movimientos." />

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        {transacciones && transacciones.length > 0 ? (
          <Stack spacing={2}>
            {transacciones.map((item) => {
              const typeConf = getTypeConfig(item);
              const statusConf = getStatusConfig(item.estado_transaccion);
              const dateString = item.fecha_transaccion ?? item.createdAt ?? new Date().toISOString();
              const date = new Date(dateString);
              
              // Permitir reintento si está pendiente, fallido o expirado
              const canRetry = ['pendiente', 'fallido', 'expirado', 'en_proceso'].includes(item.estado_transaccion);

              return (
                <Paper key={item.id} elevation={0} variant="outlined" sx={{ p: 2.5, borderLeft: `4px solid`, borderLeftColor: `${statusConf.color}.main` }}>
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: typeConf.bg, color: typeConf.color }}>
                      {typeConf.icon}
                    </Box>
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{getDescription(item)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ID: {item.id}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip label={statusConf.label} size="small" color={statusConf.color as any} variant="outlined" icon={statusConf.icon} />
                            {item.pagoPasarela && (
                              <Tooltip title={`ID Pasarela: ${item.pagoPasarela.id_transaccion_pasarela}`}>
                                <Chip label="Mercado Pago" size="small" variant="filled" sx={{ bgcolor: '#009ee3', color: 'white' }} />
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight={700} color="text.primary">
                            ${Number(item.monto).toLocaleString()}
                          </Typography>
                          
                          {canRetry && (
                            <Button 
                              variant="contained" 
                              size="small" 
                              sx={{ mt: 1 }}
                              disabled={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(item.id)}
                              startIcon={retryMutation.isPending ? <CircularProgress size={16} color="inherit"/> : <Refresh />}
                            >
                              {item.estado_transaccion === 'pendiente' ? 'Continuar' : 'Reintentar'}
                            </Button>
                          )}
                        </Box>
                      </Box>
                      {item.error_detalle && (
                        <Alert severity="error" sx={{ mt: 2, py: 0, fontSize: '0.85rem' }}>
                          {item.error_detalle}
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Alert severity="info">No tienes movimientos registrados.</Alert>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisTransacciones;
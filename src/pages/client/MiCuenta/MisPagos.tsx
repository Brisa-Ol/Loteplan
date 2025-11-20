// src/pages/MiCuenta/MisPagos.tsx

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import PagoService from '../../../Services/pago.service'; // 👈 Usamos el servicio centralizado
import { PageContainer } from '../../../components/common';
import { Typography, Paper, Stack, Button, CircularProgress, Box, Alert, Chip } from '@mui/material';
import type { PagoDto } from '../../../types/dto/pago.dto';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// Si tienes un modal genérico de 2FA, impórtalo aquí. Si no, simularemos un prompt.
// import { Auth2FAModal } from ...

const MisPagos: React.FC = () => {
  // 1. OBTENER DATOS
  const { data: pagos, isLoading, error } = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: async () => {
      const res = await PagoService.getMyPayments();
      return res.data; // Extraemos la data de la respuesta Axios
    }
  });

  // 2. LÓGICA DE PAGO (Mutación)
  const checkoutMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      const response = await PagoService.iniciarPagoMensual(pagoId);
      return response.data;
    },
    onSuccess: (data) => {
      // CASO A: Requiere 2FA (Status 202)
      if (data.is2FARequired) {
        // ⚠️ Aquí deberías abrir tu modal de 2FA.
        // Por ahora, mostramos un alert, pero lo ideal es conectar con tu AuthContext o Modal local.
        alert(`Se requiere 2FA para el pago ${data.pagoId}. Implementar modal aquí.`);
        return;
      }
      
      // CASO B: Redirección directa
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error: any) => {
      console.error("Error pago:", error);
    }
  });

  const handlePagarClick = (pagoId: number) => {
    checkoutMutation.mutate(pagoId);
  };

  // Helper para colores de estado
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'warning';
      case 'vencido': return 'error';
      case 'cubierto_por_puja': return 'info';
      default: return 'default';
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Historial de Pagos
      </Typography>
      
      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando pagos..."
      >
        {pagos && pagos.length > 0 ? (
          <Stack spacing={2}>
            
            {checkoutMutation.isError && (
              <Alert severity="error">
                Error al iniciar pago: {(checkoutMutation.error as any).message}
              </Alert>
            )}

            {pagos.map(pago => (
              <Paper key={pago.id} elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                  
                  {/* Info Izquierda */}
                  <Box>
                    <Typography variant="h6" color="primary">
                      Cuota Mes #{pago.mes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Proyecto ID: {pago.id_proyecto}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Monto: <strong>${Number(pago.monto).toLocaleString()}</strong>
                    </Typography>
                    <Typography variant="caption" display="block" mt={0.5}>
                      Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {/* Estado y Acción Derecha */}
                  <Stack alignItems="flex-end" spacing={2}>
                    <Chip 
                      label={pago.estado_pago.toUpperCase().replace('_', ' ')} 
                      color={getStatusColor(pago.estado_pago) as any}
                      size="small"
                    />

                    {(pago.estado_pago === 'pendiente' || pago.estado_pago === 'vencido') && (
                      <Button 
                        variant="contained" 
                        onClick={() => handlePagarClick(pago.id)}
                        disabled={checkoutMutation.isPending}
                        size="small"
                      >
                        {checkoutMutation.isPending ? 'Procesando...' : 'Pagar Ahora'}
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">No tienes pagos registrados por el momento.</Alert>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisPagos;
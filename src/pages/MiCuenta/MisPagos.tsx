// src/pages/MiCuenta/MisPagos.tsx
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMisPagos } from '../../Services/pago.service';
import { iniciarCheckout } from '../../Services/transaccion.service';
import { PageContainer} from '../../components/common';
import { Typography, Paper, Stack, Button, CircularProgress, Box, Alert } from '@mui/material'; // Importar Alert y Box
import type { PagoDTO } from '../../types/dto/pago.dto';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';

const MisPagos: React.FC = () => {
  const queryClient = useQueryClient(); 

  // 1. OBTENER DATOS: Llama a getMisPagos() para obtener la lista de cuotas
  const { data: pagos, isLoading, error } = useQuery<PagoDTO[], Error>({
    queryKey: ['misPagos'],
    queryFn: getMisPagos
  });

  // 2. DEFINIR LA ACCIÓN (MUTACIÓN): Qué hacer al hacer clic en "Pagar"
  const checkoutMutation = useMutation({
    mutationFn: (pagoId: number) => iniciarCheckout({
      modelo: 'pago', // Le dice al backend que es un Pago/Cuota existente
      modeloId: pagoId
    }),
    onSuccess: (data) => {
      // 3. ÉXITO: El backend devolvió la URL de Mercado Pago
      console.log('Preferencia creada, redirigiendo a Mercado Pago...');
      window.location.href = data.redirectUrl; // Redirige al usuario a la pasarela
    },
    onError: (error) => {
      console.error("Error al iniciar el pago:", error);
      // El error se mostrará en el Alert de abajo
    }
  });

  // 4. HANDLER: La función que llama el botón
  const handlePagarClick = (pagoId: number) => {
    checkoutMutation.mutate(pagoId); // Ejecuta la mutación
  };

  return (
    <PageContainer maxWidth="md">
      <Typography variant="h2" gutterBottom>Mi Historial de Pagos</Typography>
      
      {/* 5. MANEJO DE ESTADO: Muestra spinner o error */}
      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando historial de pagos..."
        fullHeight={true} // Centra el spinner
      >
        {/* 6. CONTENIDO (Solo se muestra si la carga es exitosa) */}
        {pagos && pagos.length > 0 ? (
          <Stack spacing={2}>
            
            {/* Mostrar error de la MUTACIÓN (si falla el clic en Pagar) */}
            {checkoutMutation.isError && (
              <Alert severity="error">
                {(checkoutMutation.error as Error).message || "No se pudo iniciar el pago."}
              </Alert>
            )}

            {pagos.map(pago => (
              <Paper key={pago.id} sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5">Proyecto (ID: {pago.id_proyecto}) - Mes: {pago.mes}</Typography>
                  <Typography>Monto: <strong>${pago.monto.toLocaleString()}</strong></Typography>
                  <Typography>Estado: <strong>{pago.estado_pago}</strong></Typography>
                  <Typography>Vencimiento: {new Date(pago.fecha_vencimiento).toLocaleDateString()}</Typography>
                </Box>
                
                {/* 7. BOTÓN CONDICIONAL: */}
                {(pago.estado_pago === 'pendiente' || pago.estado_pago === 'vencido') && (
                  <Button 
                    variant="contained" 
                    onClick={() => handlePagarClick(pago.id)}
                    disabled={checkoutMutation.isPending} // Deshabilitar si está cargando
                    sx={{ position: 'relative' }}
                  >
                    {/* Muestra spinner si ESTA mutación está cargando */}
                    {checkoutMutation.isPending ? (
                      <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} />
                    ) : (
                      'Pagar Ahora'
                    )}
                  </Button>
                )}

                {pago.estado_pago === 'pagado' && (
                  <Button variant="outlined" disabled>Pagado</Button>
                )}
                {pago.estado_pago === 'cubierto_por_puja' && (
                  <Button variant="outlined" disabled color="success">Cubierto</Button>
                )}
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography>No tenés pagos registrados.</Typography>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisPagos;
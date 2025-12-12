import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Stack, Button, Chip, Alert 
} from '@mui/material';
import { 
  EventRepeat, ErrorOutline, Lock, AccountBalanceWallet, CheckCircle 
} from '@mui/icons-material';

// Servicios y Tipos

import { Auth2FAModal } from './Auth2FAModal';
import PagoService from '../../../../Services/pago.service';
import SuscripcionService from '../../../../Services/suscripcion.service';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import type { PagoDto } from '../../../../types/dto/pago.dto';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';

const MisPagos: React.FC = () => {
  // Estados para 2FA
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // 1. Cargar Datos
  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: async () => (await PagoService.getMyPayments()).data
  });

  const suscripcionesQuery = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data
  });

  const isLoading = pagosQuery.isLoading || suscripcionesQuery.isLoading;
  const error = pagosQuery.error || suscripcionesQuery.error;

  // Helper para nombre de proyecto
  const getNombreProyecto = (idProyecto: number) => {
    const sub = suscripcionesQuery.data?.find(s => s.id_proyecto === idProyecto);
    return sub?.proyectoAsociado?.nombre_proyecto || `Proyecto #${idProyecto}`;
  };

  // 2. Filtro: Solo mostrar pendientes o vencidos (Las pagadas van al historial de transacciones)
  const cuotasPorPagar = useMemo(() => {
    return pagosQuery.data?.filter(p => 
      p.estado_pago === 'pendiente' || p.estado_pago === 'vencido'
    ).sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()) || [];
  }, [pagosQuery.data]);

  // 3. Iniciar Pago (Usando MercadoPagoService para la redirección o PagoService para iniciar flujo)
  const iniciarPagoMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      // Usamos iniciarCheckoutModelo del MercadoPagoService o el del PagoService
      // Según tu back, PagoService.iniciarPagoMensual llama a /pagar-mes/:id que retorna 202 (2FA) o 200 (URL)
      return await PagoService.iniciarPagoMensual(pagoId);
    },
    onSuccess: (response) => {
      const data = response.data;
      
      // Caso 2FA
      if (response.status === 202 || data.is2FARequired) {
        setSelectedPagoId(data.pagoId || null);
        setIs2FAOpen(true); 
        setTwoFAError(null);
        return;
      }

      // Caso Directo
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: any) => alert(err.response?.data?.error || "Error al iniciar el pago.")
  });

  // 4. Confirmar 2FA
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPagoId) throw new Error("ID perdido.");
      return await PagoService.confirmarPago2FA({
        pagoId: selectedPagoId,
        codigo_2fa: codigo
      });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
    },
    onError: (err: any) => setTwoFAError("Código inválido.")
  });

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Mis Cuotas" subtitle="Gestiona tus pagos mensuales pendientes." />

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Stack spacing={2}>
          {cuotasPorPagar.length > 0 ? cuotasPorPagar.map(pago => {
            const isVencido = pago.estado_pago === 'vencido';
            const isCubierto = pago.estado_pago === 'cubierto_por_puja';
            const nombreProyecto = getNombreProyecto(pago.id_proyecto ?? 0);

            return (
              <Paper 
                key={pago.id} 
                elevation={0} 
                variant="outlined"
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  borderLeft: isVencido ? '6px solid' : '1px solid',
                  borderLeftColor: isVencido ? 'error.main' : 'divider',
                  bgcolor: isVencido ? '#fff5f5' : 'background.paper'
                }}
              >
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Typography variant="h6" fontWeight={700} color={isVencido ? 'error.main' : 'text.primary'}>
                        Cuota Mes #{pago.mes}
                      </Typography>
                      {isVencido && <Chip label="VENCIDO" color="error" size="small" icon={<ErrorOutline />} />}
                    </Stack>
                    
                    <Typography variant="body1" fontWeight={600}>{nombreProyecto}</Typography>
                    
                    <Box mt={2}>
                      <Typography variant="h4" fontWeight={800} color="text.primary">
                        ${Number(pago.monto).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color={isVencido ? 'error.main' : 'text.secondary'} fontWeight={isVencido ? 700 : 400}>
                        Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="flex-end">
                    {isCubierto ? (
                      <Alert severity="info" icon={<AccountBalanceWallet />}>Cubierto con Saldo a Favor</Alert>
                    ) : (
                      <Button
                        variant="contained"
                        size="large"
                        color={isVencido ? 'error' : 'primary'}
                        disabled={iniciarPagoMutation.isPending}
                        onClick={() => { setSelectedPagoId(pago.id); iniciarPagoMutation.mutate(pago.id); }}
                        startIcon={<Lock />}
                        sx={{ py: 1.5, px: 4 }}
                      >
                        {iniciarPagoMutation.isPending ? 'Procesando...' : 'Pagar Ahora'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          }) : (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'success.light', color: 'success.dark' }}>
              <CheckCircle sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" fontWeight="bold">¡Estás al día!</Typography>
              <Typography>No tienes pagos pendientes.</Typography>
            </Paper>
          )}
        </Stack>
      </QueryHandler>

      <Auth2FAModal 
        open={is2FAOpen} 
        onClose={() => setIs2FAOpen(false)} 
        onConfirm={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError} 
      />
    </PageContainer>
  );
};

export default MisPagos;
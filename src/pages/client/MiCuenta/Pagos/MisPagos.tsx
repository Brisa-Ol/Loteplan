import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Paper, Stack, Button, Chip, Alert 
} from '@mui/material';
import { 
  ErrorOutline, Lock, AccountBalanceWallet, CheckCircle
} from '@mui/icons-material';

// Servicios y Tipos
import PagoService from '../../../../Services/pago.service';
import SuscripcionService from '../../../../Services/suscripcion.service';
import MercadoPagoService from '../../../../Services/pagoMercado.service'; // ✅ Importamos el servicio de MP
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';
import type { PagoDto } from '../../../../types/dto/pago.dto';

// Componentes Comunes
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '../../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// Hooks
import { useModal } from '../../../../hooks/useModal';

const MisPagos: React.FC = () => {
  // 1. Hook de Modal y Estados
  const twoFaModal = useModal();
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // 2. Cargar Datos
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

  // 3. Filtro: Solo mostrar pendientes o vencidos
  const cuotasPorPagar = useMemo(() => {
    return pagosQuery.data?.filter(p => 
      p.estado_pago === 'pendiente' || p.estado_pago === 'vencido'
    ).sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()) || [];
  }, [pagosQuery.data]);

  // 4. Mutación: Iniciar Pago (CORREGIDO)
  const iniciarPagoMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      // 🚀 CAMBIO CLAVE: Usamos MercadoPagoService igual que en MisInversiones
      // 'pago' es el modelo que identifica a las cuotas mensuales en tu backend
      return await MercadoPagoService.iniciarCheckoutModelo('pago', pagoId);
    },
    onSuccess: (response, pagoId) => {
      const data = response.data;
      
      // CASO A: Requiere 2FA (Status 202)
      if (response.status === 202 || data.is2FARequired) {
        setSelectedPagoId(pagoId);
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }

      // CASO B: Redirección Directa (Status 200)
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: any) => alert(err.response?.data?.error || "Error al iniciar el pago.")
  });

  // 5. Mutación: Confirmar con 2FA (Paso 2)
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPagoId) throw new Error("ID de pago perdido.");
      return await PagoService.confirmarPago2FA({
        pagoId: selectedPagoId,
        codigo_2fa: codigo
      });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido o expirado.")
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
                  bgcolor: isVencido ? '#fff5f5' : 'background.paper',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
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
                    
                    <Typography variant="body1" fontWeight={600} color="text.secondary" gutterBottom>
                        {nombreProyecto}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        ${Number(pago.monto).toLocaleString('es-AR')} <Typography variant="caption">ARS</Typography>
                      </Typography>
                      <Typography variant="caption" color={isVencido ? 'error.main' : 'text.secondary'} fontWeight={isVencido ? 700 : 400}>
                        Vencimiento: {new Date(pago.fecha_vencimiento).toLocaleDateString()}
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
                        onClick={() => iniciarPagoMutation.mutate(pago.id)}
                        startIcon={<Lock />}
                        sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 'bold' }}
                      >
                        {iniciarPagoMutation.isPending && selectedPagoId === pago.id ? 'Procesando...' : 'Pagar Ahora'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          }) : (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'success.light', color: 'success.dark', borderRadius: 4 }}>
              <CheckCircle sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>¡Estás al día!</Typography>
              <Typography variant="subtitle1">No tienes pagos pendientes por el momento.</Typography>
            </Paper>
          )}
        </Stack>
      </QueryHandler>

      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedPagoId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Pago Seguro"
        description="Ingresa el código de tu aplicación autenticadora para procesar el pago."
      />
    </PageContainer>
  );
};

export default MisPagos;
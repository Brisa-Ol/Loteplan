import React, { useState } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Alert, Button, Divider
} from '@mui/material';
import {
  TrendingUp, CheckCircle, Schedule, ErrorOutline, Visibility, Lock
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Servicios y Tipos
import InversionService from '../../../Services/inversion.service';
import type { InversionDto } from '../../../types/dto/inversion.dto';
import MercadoPagoService from '../../../Services/pagoMercado.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal'; // ✅ Componente correcto

// Hooks
import { useModal } from '../../../hooks/useModal'; // ✅ Hook useModal

const MisInversiones: React.FC = () => {
  const navigate = useNavigate();

  // 1. Hook de Modal y Estados
  const twoFaModal = useModal();
  const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // 2. Query: Obtener mis inversiones
  const { data: inversiones, isLoading, error } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data
  });

  // 3. Mutation: Pagar inversión existente
  const payMutation = useMutation({
    mutationFn: async (inversionId: number) => {
      // 🚀 USAMOS EL SERVICIO DE PAGO
      return await MercadoPagoService.iniciarCheckoutModelo('inversion', inversionId);
    },
    onSuccess: (response, inversionId) => {
      const data = response.data;
      
      // Caso A: Requiere 2FA (Status 202 o flag)
      if (response.status === 202 || data.is2FARequired) {
        setSelectedInversionId(inversionId); // Guardar ID
        setTwoFAError(null);
        twoFaModal.open(); // ✅ Abrir con el hook
        return;
      }

      // Caso B: Redirección directa
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Error al iniciar el proceso de pago');
    }
  });

  // 4. Mutation: Confirmar 2FA
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedInversionId) throw new Error("ID de inversión perdido.");
      // Tu backend usa este endpoint para confirmar inversión con 2FA
      return await InversionService.confirmar2FA({
        inversionId: selectedInversionId,
        codigo_2fa: codigo
      });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
      twoFaModal.close(); // ✅ Cerrar con el hook
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido.")
  });

  // Handlers
  const handlePagarClick = (id: number) => {
    payMutation.mutate(id);
  };

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case 'pagado': return { label: 'Pagado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'pendiente': return { label: 'Pendiente de Pago', color: 'warning' as const, icon: <Schedule fontSize="small" /> };
      case 'fallido': return { label: 'Fallido', color: 'error' as const, icon: <ErrorOutline fontSize="small" /> };
      case 'reembolsado': return { label: 'Reembolsado', color: 'info' as const, icon: <CheckCircle fontSize="small" /> };
      default: return { label: estado, color: 'default' as const, icon: null };
    }
  };

  // Stats rápidas
  const stats = {
    total: inversiones?.length || 0,
    pagadas: inversiones?.filter(i => i.estado === 'pagado').length || 0,
    pendientes: inversiones?.filter(i => i.estado === 'pendiente').length || 0,
    montoTotal: inversiones?.reduce((acc, inv) => acc + Number(inv.monto), 0) || 0
  };

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Inversiones Directas" 
        subtitle='Historial completo de tus inversiones en proyectos'
      />
    
      {/* --- KPIs --- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTALES</Typography>
          <Typography variant="h4" fontWeight={700} color="primary.main">{stats.total}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: 'success.main', borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>PAGADAS</Typography>
          <Typography variant="h4" fontWeight={700} color="success.main">{stats.pagadas}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: 'warning.main', borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>PENDIENTES</Typography>
          <Typography variant="h4" fontWeight={700} color="warning.main">{stats.pendientes}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: '2px solid', borderColor: 'primary.main', borderRadius: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>CAPITAL TOTAL</Typography>
          <Typography variant="h4" fontWeight={700} color="primary.main">${stats.montoTotal.toLocaleString()}</Typography>
        </Paper>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error} loadingMessage="Cargando inversiones...">
        {inversiones && inversiones.length > 0 ? (
          <Stack spacing={2}>
            {inversiones.map((inversion) => {
              const statusConfig = getStatusConfig(inversion.estado);
              const nombreProyecto = inversion.proyecto?.nombre_proyecto || `Proyecto #${inversion.id_proyecto}`;

              return (
                <Paper
                  key={inversion.id}
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    borderLeft: inversion.estado === 'pendiente' ? '6px solid' : '1px solid',
                    borderLeftColor: inversion.estado === 'pendiente' ? 'warning.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 3 }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
                    
                    {/* Info Principal */}
                    <Box flex={1} minWidth={250}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Chip label={statusConfig.label} color={statusConfig.color} icon={statusConfig.icon as any} sx={{ fontWeight: 600 }} />
                        <Typography variant="caption" color="text.secondary">ID: {inversion.id}</Typography>
                      </Stack>

                      <Typography variant="h6" fontWeight={700} gutterBottom>{nombreProyecto}</Typography>

                      <Stack spacing={1} mt={2}>
                        <Box display="flex" justifyContent="space-between" maxWidth={300}>
                          <Typography variant="body2" color="text.secondary">Monto:</Typography>
                          <Typography variant="body2" fontWeight={700}>${Number(inversion.monto).toLocaleString()}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" maxWidth={300}>
                          <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {new Date(inversion.fecha_inversion).toLocaleDateString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Acciones */}
                    <Stack spacing={2} alignItems="flex-end" minWidth={200}>
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/proyectos/${inversion.id_proyecto}`)}
                        fullWidth
                      >
                        Ver Proyecto
                      </Button>

                      {inversion.estado === 'pendiente' && (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={payMutation.isPending ? null : <Lock />}
                          onClick={() => handlePagarClick(inversion.id)}
                          disabled={payMutation.isPending}
                          fullWidth
                          sx={{ fontWeight: 700 }}
                        >
                          {payMutation.isPending ? 'Procesando...' : 'Pagar Ahora'}
                        </Button>
                      )}
                    </Stack>
                  </Box>

                  {inversion.estado === 'pendiente' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Alert severity="warning" icon={<Schedule />}>
                        Esta inversión está reservada pero pendiente de pago. El cupo podría liberarse si no se completa la transacción.
                      </Alert>
                    </>
                  )}
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed', borderColor: 'divider' }}>
            <TrendingUp sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes inversiones directas aún
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Comienza a construir tu portafolio explorando proyectos de inversión directa.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/client/Proyectos/RoleSelection')}>
              Explorar Oportunidades
            </Button>
          </Paper>
        )}
      </QueryHandler>

      {/* ✅ Modal de 2FA Conectado */}
      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedInversionId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Inversión"
        description="Ingresa el código de 6 dígitos para autorizar esta inversión."
      />

    </PageContainer>
  );
};

export default MisInversiones;
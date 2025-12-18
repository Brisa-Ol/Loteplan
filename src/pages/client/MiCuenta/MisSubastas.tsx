import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Chip, Alert, Divider,
  IconButton, Tooltip
} from '@mui/material';
import {
  Gavel, Payment, AccessTime, CheckCircle, Cancel, Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Servicios y Tipos
import PujaService from '../../../Services/puja.service';
import type { PujaDto } from '../../../types/dto/puja.dto';
import ImagenService from '../../../Services/imagen.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal'; // ✅ Componente 2FA

// Hooks
import { useModal } from '../../../hooks/useModal'; // ✅ Hook useModal

const MisSubastas: React.FC = () => {
  const navigate = useNavigate();
  
  // 1. Estados y Hooks para 2FA
  const twoFaModal = useModal();
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // 2. Obtener mis pujas
  const { data: pujas, isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });

  // 3. Mutación para Pagar (Paso 1: Checkout)
  const payMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      // Inicia el pago. El backend dirá si requiere 2FA o da la URL directa.
      return await PujaService.iniciarPagoGanadora(pujaId);
    },
    onSuccess: (response, pujaId) => {
      const data = response.data;
      
      // CASO A: Requiere 2FA (Status 202)
      if (response.status === 202 || data.is2FARequired) {
        setSelectedPujaId(pujaId);
        setTwoFAError(null);
        twoFaModal.open(); // ✅ Abrimos modal con hook
        return;
      } 
      
      // CASO B: Redirección directa (Status 200)
      if (data.url_checkout) {
        window.location.href = data.url_checkout;
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Error al iniciar el pago');
    }
  });

  // 4. Mutación para Confirmar con 2FA (Paso 2)
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPujaId) throw new Error("ID de puja perdido.");
      return await PujaService.confirmarPago2FA({
        pujaId: selectedPujaId,
        codigo_2fa: codigo
      });
    },
    onSuccess: (response) => {
      if (response.data.url_checkout) {
        window.location.href = response.data.url_checkout;
      }
      twoFaModal.close(); // ✅ Cerramos modal
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido.")
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'activa': return { label: 'En Curso', color: 'info' as const, icon: <AccessTime fontSize="small" /> };
      case 'ganadora_pendiente': return { label: 'Ganaste - Pagar Ahora', color: 'warning' as const, icon: <Payment fontSize="small" /> };
      case 'ganadora_pagada': return { label: 'Adjudicado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'perdedora': return { label: 'Superada', color: 'error' as const, icon: <Cancel fontSize="small" /> };
      default: return { label: status, color: 'default' as const, icon: null };
    }
  };

  return (
    <PageContainer maxWidth="md">
      
      <PageHeader title="Mis Subastas" subtitle='Seguimiento de tus ofertas y lotes ganados.'/>
      
      <QueryHandler isLoading={isLoading} error={error as Error} loadingMessage="Cargando subastas...">
        {pujas && pujas.length > 0 ? (
          <Stack spacing={2}>
            {pujas.map((puja) => {
              const statusConfig = getStatusConfig(puja.estado_puja);
              const lote = puja.lote;
              const idProyecto = lote?.id_proyecto;
              const imgUrl = lote?.imagenes?.[0]?.url
                ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
                : '/images/placeholder-lote.jpg';

              return (
                <Paper
                  key={puja.id}
                  sx={{
                    p: 0,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: puja.estado_puja === 'ganadora_pendiente' ? 'warning.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 3 }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>

                    {/* Imagen Lote */}
                    <Box
                      sx={{
                        width: { xs: '100%', sm: 200 },
                        height: { xs: 150, sm: 'auto' },
                        backgroundImage: `url(${imgUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0
                      }}
                    />

                    {/* Contenido */}
                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {lote?.nombre_lote || `Lote #${puja.id_lote}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Proyecto ID: {idProyecto || 'N/A'}
                          </Typography>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          icon={statusConfig.icon as any}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Divider />

                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary">TU OFERTA</Typography>
                          <Typography variant="h5" fontWeight={700} color="primary.main">
                            USD {Number(puja.monto_puja).toLocaleString()}
                          </Typography>
                        </Box>

                        <Box textAlign={{ xs: 'left', sm: 'right' }}>
                          <Typography variant="caption" display="block" color="text.secondary">FECHA</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(puja.fecha_puja).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Botones de Acción */}
                      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt="auto">
                        <Tooltip title="Ver Proyecto">
                          <IconButton
                            onClick={() => idProyecto && navigate(`/proyectos/${idProyecto}`)}
                            disabled={!idProyecto}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        {puja.estado_puja === 'ganadora_pendiente' && (
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<Gavel />}
                            onClick={() => payMutation.mutate(puja.id)}
                            disabled={payMutation.isPending}
                            sx={{ boxShadow: 'none' }}
                          >
                            {payMutation.isPending ? 'Procesando...' : 'Pagar Lote'}
                          </Button>
                        )}
                      </Box>

                      {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                          Tienes hasta el {new Date(puja.fecha_vencimiento_pago).toLocaleDateString()} para completar el pago.
                        </Alert>
                      )}

                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Gavel sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No has participado en subastas</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Explora los proyectos de inversión directa y encontrá tu lote ideal.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/client/Proyectos/RoleSelection')}>
              Ver Oportunidades
            </Button>
          </Paper>
        )}
      </QueryHandler>

      {/* ✅ Modal 2FA Conectado */}
      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedPujaId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Pago de Subasta"
        description="Ingresa el código de 6 dígitos para asegurar tu lote ganado."
      />

    </PageContainer>
  );
};

export default MisSubastas;
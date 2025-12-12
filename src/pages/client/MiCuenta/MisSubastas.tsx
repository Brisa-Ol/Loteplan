// src/pages/MiCuenta/MisPujas.tsx

import React from 'react';
import {
  Box, Typography, Paper, Button, Stack, Chip, Alert, Divider,
  IconButton, Tooltip
} from '@mui/material';
import {
  Gavel,
  Payment,
  AccessTime,
  CheckCircle,
  Cancel,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import PujaService from '../../../Services/puja.service';
import type { PujaDto } from '../../../types/dto/puja.dto';
import ImagenService from '../../../Services/imagen.service';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';


const MisSubastas: React.FC = () => {
  const navigate = useNavigate();

  // 1. Obtener mis pujas
  const { data: pujas, isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data
  });

  // 2. Mutación para Pagar (Checkout)
  const payMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      const res = await PujaService.iniciarPagoGanadora(pujaId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.is2FARequired) {
        alert(`Se requiere 2FA para la puja ${data.pujaId}.`);
      } else if (data.url_checkout) {
        window.location.href = data.url_checkout;
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Error al iniciar el pago');
    }
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'activa':
        return { label: 'En Curso', color: 'info', icon: <AccessTime fontSize="small" /> };
      case 'ganadora_pendiente':
        return { label: 'Ganaste - Pagar Ahora', color: 'warning', icon: <Payment fontSize="small" /> };
      case 'ganadora_pagada':
        return { label: 'Adjudicado', color: 'success', icon: <CheckCircle fontSize="small" /> };
      case 'perdedora':
        return { label: 'Superada', color: 'error', icon: <Cancel fontSize="small" /> };
      default:
        return { label: status, color: 'default', icon: null };
    }
  };

  return (
    <PageContainer maxWidth="md">
      
<PageHeader title="Mis Subastas" subtitle='  Seguimiento de tus ofertas y lotes ganados.'/>
      <QueryHandler isLoading={isLoading} error={error as Error} loadingMessage="Cargando subastas...">
        {pujas && pujas.length > 0 ? (
          <Stack spacing={2}>
            {pujas.map((puja) => {
              const statusConfig = getStatusConfig(puja.estado_puja);
              // ✅ Accedemos al lote desde la relación
              const lote = puja.lote;

              // ✅ Accedemos al proyecto a través del lote
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

                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {lote?.nombre_lote || `Lote #${puja.id_lote}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {/* ✅ CORRECCIÓN AQUÍ: Usamos idProyecto extraído del lote */}
                            Proyecto ID: {idProyecto || 'N/A'}
                          </Typography>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color as any}
                          icon={statusConfig.icon as any}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Divider />

                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            TU OFERTA
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="primary.main">
                            USD {Number(puja.monto_puja).toLocaleString()}
                          </Typography>
                        </Box>

                        <Box textAlign={{ xs: 'left', sm: 'right' }}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            FECHA
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(puja.fecha_puja).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt="auto">
                        <Tooltip title="Ver Proyecto">
                          {/* ✅ CORRECCIÓN AQUÍ: Navegación segura */}
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
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No has participado en subastas
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Explora los proyectos de inversión directa y encontrá tu lote ideal.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/proyectos/inversionista')}
            >
              Ver Oportunidades
            </Button>
          </Paper>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisSubastas;
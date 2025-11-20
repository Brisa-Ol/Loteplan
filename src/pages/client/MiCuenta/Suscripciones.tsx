// src/pages/MiCuenta/MisSuscripciones.tsx

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuscripcionService from '../../../Services/suscripcion.service'; // 👈 Importación correcta
import { PageContainer } from '../../../components/common';
import { Typography, Paper, Stack, Button, CircularProgress, Alert, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import type { SuscripcionDto } from '../../../types/dto/suscripcion.dto';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. LEER SUSCRIPCIONES
  const { data: suscripciones, isLoading, error } = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => {
      const res = await SuscripcionService.getMySubscriptions();
      return res.data;
    }
  });

  // 2. CANCELAR SUSCRIPCIÓN
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      // Usamos el método específico de cancelación propia
      await SuscripcionService.cancelMySubscription(id); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
      alert('Suscripción cancelada exitosamente.');
    },
    onError: (err: any) => {
      // El backend puede devolver 403 si hay puja ganada
      const msg = err.response?.data?.error || "No se pudo cancelar.";
      alert(`Error: ${msg}`);
    }
  });

  return (
    <PageContainer maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">Mis Suscripciones</Typography>

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando..."
      >
        {suscripciones && suscripciones.length > 0 ? (
          <Stack spacing={2}>
            {suscripciones.map(susc => (
              <Paper key={susc.id} sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  
                  <Box>
                    <Typography variant="h6" color="primary">
                      {susc.proyectoAsociado?.nombre_proyecto || `Proyecto #${susc.id_proyecto}`}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} mt={1}>
                      <Chip label={`Tokens: ${susc.tokens_disponibles}`} size="small" color="secondary" variant="outlined" />
                      <Chip label={`Meses: ${susc.meses_a_pagar}`} size="small" variant="outlined" />
                    </Stack>
                    
                    {Number(susc.saldo_a_favor) > 0 && (
                      <Typography variant="body2" color="success.main" mt={1}>
                        Saldo a favor: <strong>${Number(susc.saldo_a_favor).toLocaleString()}</strong>
                      </Typography>
                    )}
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate(`/proyectos/${susc.id_proyecto}`)}
                    >
                      Ver Proyecto
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (window.confirm("¿Cancelar suscripción? Perderás tu progreso.")) {
                          cancelMutation.mutate(susc.id);
                        }
                      }}
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar'}
                    </Button>
                  </Stack>

                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">No tienes suscripciones activas.</Alert>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisSuscripciones;
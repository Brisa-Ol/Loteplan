// src/pages/MiCuenta/MisSuscripciones.tsx (ACTUALIZADO CON BOTÓN DE CANCELAR)
// ═══════════════════════════════════════════════════════════
import React from 'react';
// --- 1. Importar useMutation y useQueryClient ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// 👈 Importar las dos funciones del servicio
import { getMisSuscripcionesActivas, cancelarSuscripcion } from '../../Services/suscripcion.service'; 
import { PageContainer } from '../../components/common';
import { Typography, Paper, Stack, Button, CircularProgress, Alert, Box } from '@mui/material'; // 👈 Añadir Button, Alert, Box
import type { SuscripcionProyectoDTO } from '../../types/dto/suscripcionProyecto.dto';
import { useNavigate } from 'react-router-dom';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';

const MisSuscripciones: React.FC = () => {
  const navigate = useNavigate();
  // Obtener el queryClient para invalidar la caché
  const queryClient = useQueryClient(); 

  // Query para LEER suscripciones (sin cambios)
  const { data: suscripciones, isLoading, error } = useQuery<SuscripcionProyectoDTO[], Error>({
    queryKey: ['misSuscripciones'],
    queryFn: getMisSuscripcionesActivas
  });

  // --- 2. Definir la Mutación para CANCELAR ---
  const cancelMutation = useMutation({
    mutationFn: (suscripcionId: number) => cancelarSuscripcion(suscripcionId),
    onSuccess: () => {
      console.log("Suscripción cancelada exitosamente");
      // 3. ACTUALIZAR LA LISTA:
      // Esto le dice a React Query que los datos de 'misSuscripciones' están "viejos"
      // y que debe volver a pedirlos automáticamente.
      queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
      // Opcional: mostrar un toast/alert de éxito
    },
    onError: (err: Error) => {
      console.error("Error al cancelar suscripción:", err);
      // El error se mostrará en el Alert de abajo
    }
  });

  return (
    <PageContainer maxWidth="md">
      <Typography variant="h2" gutterBottom>Mis Suscripciones</Typography>

      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error | null} 
        loadingMessage="Cargando suscripciones..."
        fullHeight={true}
      >
        {/* Mostrar error de la MUTACIÓN si falla */}
        {cancelMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cancelar: {(cancelMutation.error as Error).message}
          </Alert>
        )}

        {suscripciones && suscripciones.length > 0 ? (
          <Stack spacing={2}>
            {suscripciones.map(susc => (
              <Paper 
                key={susc.id} 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap', // Para responsividad
                  gap: 2 // Espacio entre items y botones
                }}
              >
                <Box>
                  <Typography variant="h5">Suscripción al Proyecto ID: {susc.id_proyecto}</Typography>
                  <Typography>Tokens de Puja Disponibles: <strong>{susc.tokens_disponibles}</strong></Typography>
                  <Typography>Meses restantes a pagar: {susc.meses_a_pagar}</Typography>
                  <Typography>Saldo a favor: <strong>${susc.saldo_a_favor.toLocaleString()}</strong></Typography>
                </Box>
                
                {/* --- 4. Grupo de Botones de Acción --- */}
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate(`/proyectos/${susc.id_proyecto}`)}
                  >
                    Ver Proyecto
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      // Pedir confirmación antes de una acción destructiva
                      if (window.confirm("¿Estás seguro de que querés cancelar esta suscripción? Esta acción no se puede deshacer.")) {
                        cancelMutation.mutate(susc.id);
                      }
                    }}
                    // Deshabilitar mientras se cancela
                    disabled={cancelMutation.isPending} 
                    sx={{ position: 'relative' }}
                  >
                    {cancelMutation.isPending ? (
                      <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} />
                    ) : (
                      'Cancelar'
                    )}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography>No tenés suscripciones activas.</Typography>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisSuscripciones;
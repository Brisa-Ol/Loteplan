// src/pages/MiCuenta/MisSuscripciones.tsx (Corregido)
// ═══════════════════════════════════════════════════════════
import React from 'react';
// --- 1. Importar hooks de React, router y MUI ---
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler'; // (Asumo esta ruta)

// --- 2. Importar el servicio y el DTO correctos ---

import type { ISuscripcionProyecto } from '../../../types/dto/suscripcionProyecto.dto';
import { suscripcionProyectoService } from '../../../Services/suscripcionproyecto.service';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';


const Suscripciones: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 

  // Query para LEER suscripciones
  // ❗ CORRECCIÓN 3: Usar el tipo 'ISuscripcionProyecto' y la función del servicio
  const { data: suscripciones, isLoading, error } = useQuery<ISuscripcionProyecto[], Error>({
    queryKey: ['misSuscripciones'],
    queryFn: suscripcionProyectoService.getMisSuscripciones 
  });

  // --- 2. Definir la Mutación para CANCELAR ---
  const cancelMutation = useMutation({
    // ❗ CORRECCIÓN 3: Usar la función correcta del servicio
    mutationFn: (suscripcionId: number) => suscripcionProyectoService.cancelarMiSuscripcion(suscripcionId),
    onSuccess: () => {
      console.log("Suscripción cancelada exitosamente");
      queryClient.invalidateQueries({ queryKey: ['misSuscripciones'] });
      // Opcional: invalidar también las canceladas si tienes otra vista para eso
      // queryClient.invalidateQueries({ queryKey: ['misCanceladas'] });
    },
    onError: (err: Error) => {
      console.error("Error al cancelar suscripción:", err);
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
            {/* El error del backend (ej. "No se puede cancelar por puja pagada") vendrá aquí */}
            Error al cancelar: {(cancelMutation.error as any)?.response?.data?.error || (cancelMutation.error as Error).message}
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
                  flexWrap: 'wrap', 
                  gap: 2 
                }}
              >
                <Box>
                  <Typography variant="h5">Suscripción al Proyecto ID: {susc.id_proyecto}</Typography>
                  <Typography>Tokens de Puja Disponibles: <strong>{susc.tokens_disponibles}</strong></Typography>
                  <Typography>Meses restantes a pagar: {susc.meses_a_pagar}</Typography>
                  {/* ❗ CORRECCIÓN 4: Convertir string a número para formatear */}
                  <Typography>Saldo a favor: <strong>${Number(susc.saldo_a_favor).toLocaleString()}</strong></Typography>
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
                      if (window.confirm("¿Estás seguro de que querés cancelar esta suscripción? Esta acción no se puede deshacer.")) {
                        cancelMutation.mutate(susc.id);
                      }
                    }}
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

export default Suscripciones;
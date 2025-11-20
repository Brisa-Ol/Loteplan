// ============================================================================
// COMPONENTE E: ProyectoSuscripciones.tsx
// Auditoría de suscripciones del proyecto
// ============================================================================
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';



// ✅ CORRECCIÓN 2: Importar ambos tipos de DTO
import type { 
  SuscripcionProyectoDTO, 
  SuscripcionCanceladaDTO 
} from '../../../../types/dto/suscripcionCancelada.dto'; // Ajusta ruta si moviste los DTOs
import { suscripcionService } from '../../../../Services/suscripcionproyecto.service';



interface ProyectoSuscripcionesProps {
  proyectoId: number;
}

// Tipo Unión para manejar la tabla genérica
type SubscriptionItem = SuscripcionProyectoDTO | SuscripcionCanceladaDTO;

export const ProyectoSuscripciones: React.FC<ProyectoSuscripcionesProps> = ({
  proyectoId
}) => {
  const [view, setView] = useState<'all' | 'active' | 'cancelled'>('all');

  // --- QUERIES (Nombres de métodos actualizados según tu Service) ---

  // 1. Todas las suscripciones (Tabla Principal)
  const { data: allSuscripciones = [], isLoading: loadingAll, error: errorAll } = useQuery<SuscripcionProyectoDTO[], Error>({
    queryKey: ['suscripciones', 'all', proyectoId],
    queryFn: () => suscripcionService.adminGetAllByProyecto(proyectoId),
    enabled: view === 'all',
  });

  // 2. Solo Activas
  const { data: activeSuscripciones = [], isLoading: loadingActive, error: errorActive } = useQuery<SuscripcionProyectoDTO[], Error>({
    queryKey: ['suscripciones', 'active', proyectoId],
    queryFn: () => suscripcionService.adminGetActivasByProyecto(proyectoId),
    enabled: view === 'active',
  });

  // 3. Canceladas (Tabla Histórica)
  const { data: cancelledSuscripciones = [], isLoading: loadingCancelled, error: errorCancelled } = useQuery<SuscripcionCanceladaDTO[], Error>({
    queryKey: ['suscripciones', 'cancelled', proyectoId],
    queryFn: () => suscripcionService.adminGetCanceladasByProyecto(proyectoId),
    enabled: view === 'cancelled',
  });

  // Determinar qué data mostrar
  const dataToShow: SubscriptionItem[] = 
    view === 'all' ? allSuscripciones :
    view === 'active' ? activeSuscripciones :
    cancelledSuscripciones;

  const isLoading = loadingAll || loadingActive || loadingCancelled;
  const error = errorAll || errorActive || errorCancelled;

  // Helper para saber si es un DTO de Cancelación
  const isCancelledDTO = (item: SubscriptionItem): item is SuscripcionCanceladaDTO => {
    return (item as SuscripcionCanceladaDTO).fecha_cancelacion !== undefined;
  };

  return (
    <Box sx={{ px: 3 }}>
      {/* Header y Filtros */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Auditoría de Suscripciones
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={view === 'all' ? 'contained' : 'outlined'}
            onClick={() => setView('all')}
            size="small"
          >
            Todas
          </Button>
          <Button
            variant={view === 'active' ? 'contained' : 'outlined'}
            onClick={() => setView('active')}
            size="small"
            color="success"
          >
            Activas
          </Button>
          <Button
            variant={view === 'cancelled' ? 'contained' : 'outlined'}
            onClick={() => setView('cancelled')}
            size="small"
            color="error"
          >
            Canceladas
          </Button>
        </Stack>
      </Stack>

      <QueryHandler isLoading={isLoading} error={error}>
        {dataToShow.length === 0 ? (
          <Alert severity="info">
            No hay suscripciones {view === 'all' ? '' : view === 'active' ? 'activas' : 'canceladas'} para este proyecto.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    {view === 'cancelled' ? 'Fecha Cancelación' : 'Fecha Alta'}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    {view === 'cancelled' ? 'Monto Reembolsado' : 'Saldo a Favor'}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Meses Pagados
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Estado
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataToShow.map((item) => {
                  // Normalización de datos para la vista
                  const isCancelled = isCancelledDTO(item);
                  const isActive = !isCancelled && (item as SuscripcionProyectoDTO).activo;
                  
                  const dateToDisplay = isCancelled 
                    ? new Date((item as SuscripcionCanceladaDTO).fecha_cancelacion)
                    : new Date(item.createdAt || Date.now());

                  const montoToDisplay = isCancelled
                    ? (item as SuscripcionCanceladaDTO).monto_pagado_total
                    : (item as SuscripcionProyectoDTO).saldo_a_favor;

                  const mesesToDisplay = isCancelled
                    ? (item as SuscripcionCanceladaDTO).meses_pagados
                    : 0; // En DTO proyecto activo esto se calcula diferente, ajustar si tienes el campo

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.id_usuario}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dateToDisplay.toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        ${Number(montoToDisplay).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {mesesToDisplay}
                      </TableCell>
                      <TableCell align="center">
                        {isCancelled ? (
                           <Chip label="Cancelada" size="small" color="error" variant="outlined" />
                        ) : (
                           <Chip 
                             label={isActive ? 'Activa' : 'Inactiva'} 
                             size="small" 
                             color={isActive ? 'success' : 'default'} 
                           />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>
    </Box>
  );
};
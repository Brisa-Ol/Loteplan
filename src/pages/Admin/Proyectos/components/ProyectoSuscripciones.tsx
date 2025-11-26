import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { SuscripcionCanceladaDto, SuscripcionDto } from '../../../../types/dto/suscripcion.dto';
import SuscripcionService from '../../../../Services/suscripcion.service';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';



interface ProyectoSuscripcionesProps {
  proyectoId: number;
}

// Tipo unión
type SubscriptionItem = SuscripcionDto | SuscripcionCanceladaDto;

// ✅ HELPER NATIVO PARA FECHAS (Reemplaza a 'format')
const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ProyectoSuscripciones: React.FC<ProyectoSuscripcionesProps> = ({
  proyectoId
}) => {
  const [view, setView] = useState<'all' | 'active' | 'cancelled'>('all');

  // --- QUERIES ---

  const { data: allSuscripciones = [], isLoading: loadingAll, error: errorAll } = useQuery<SuscripcionDto[]>({
    queryKey: ['suscripciones', 'all', proyectoId],
    queryFn: async () => (await SuscripcionService.findAllByProject(proyectoId)).data,
    enabled: view === 'all',
  });

  const { data: activeSuscripciones = [], isLoading: loadingActive, error: errorActive } = useQuery<SuscripcionDto[]>({
    queryKey: ['suscripciones', 'active', proyectoId],
    queryFn: async () => (await SuscripcionService.findByProjectActive(proyectoId)).data,
    enabled: view === 'active',
  });

  const { data: cancelledSuscripciones = [], isLoading: loadingCancelled, error: errorCancelled } = useQuery<SuscripcionCanceladaDto[]>({
    queryKey: ['suscripciones', 'cancelled', proyectoId],
    queryFn: async () => (await SuscripcionService.findCanceledByProject(proyectoId)).data,
    enabled: view === 'cancelled',
  });

  const isLoading = loadingAll || loadingActive || loadingCancelled;
  const error = errorAll || errorActive || errorCancelled;

  const dataToShow: SubscriptionItem[] = 
    view === 'all' ? allSuscripciones :
    view === 'active' ? activeSuscripciones :
    cancelledSuscripciones;

  // Type Guard
  const isCancelled = (item: SubscriptionItem): item is SuscripcionCanceladaDto => {
    return (item as SuscripcionCanceladaDto).fecha_cancelacion !== undefined;
  };

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">Auditoría de Suscripciones</Typography>
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

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        {dataToShow.length === 0 ? (
          <Alert severity="info">No hay datos para mostrar en esta vista.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    {view === 'cancelled' ? 'Meses Pagados' : 'Meses Deuda'}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    {view === 'cancelled' ? 'Monto Pagado' : 'Saldo a Favor'}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataToShow.map((item) => {
                  if (isCancelled(item)) {
                    // --- FILA CANCELADA ---
                    return (
                      <TableRow key={`canc-${item.id}`}>
                        <TableCell>{item.id_suscripcion_original}</TableCell>
                        <TableCell>{item.id_usuario}</TableCell>
                        {/* ✅ USO DE formatDate */}
                        <TableCell>{formatDate(item.fecha_cancelacion)}</TableCell>
                        <TableCell align="right">{item.meses_pagados}</TableCell>
                        <TableCell align="right">${Number(item.monto_pagado_total).toLocaleString()}</TableCell>
                        <TableCell align="center">
                           <Chip label="Cancelada" size="small" color="error" />
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    // --- FILA ACTIVA ---
                    return (
                      <TableRow key={`subs-${item.id}`}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.id_usuario}</TableCell>
                        {/* ✅ USO DE formatDate */}
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell align="right">{item.meses_a_pagar}</TableCell>
                        <TableCell align="right">${Number(item.saldo_a_favor).toLocaleString()}</TableCell>
                        <TableCell align="center">
                           <Chip 
                             label={item.activo ? 'Activa' : 'Inactiva'} 
                             size="small" 
                             color={item.activo ? 'success' : 'default'} 
                           />
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>
    </Box>
  );
};

export default ProyectoSuscripciones;
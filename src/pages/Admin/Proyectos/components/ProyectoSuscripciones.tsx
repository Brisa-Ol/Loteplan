// ============================================================================
// COMPONENTE E: ProyectoSuscripciones.tsx (CÓDIGO COMPLETO Y CORREGIDO)
// ============================================================================
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// Importar servicios y DTOs (Asumiendo que SuscripcionCanceladaDto está disponible)
import { suscripcionProyectoService } from '../../../../Services/suscripcionproyecto.service';
import { suscripcionService } from '../../../../Services/suscripcion.service'; // Servicio de Canceladas

import { format } from 'date-fns';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import type { 
    SuscripcionProyectoDto, 
    SuscripcionCanceladaDto // ❗ CORRECCIÓN: Se agrega el tipo DTO para canceladas
} from '../../../../types/dto/suscripcionProyecto.dto';

interface ProyectoSuscripcionesProps {
  proyectoId: number;
}

const ProyectoSuscripciones: React.FC<ProyectoSuscripcionesProps> = ({
  proyectoId
}) => {
  const [view, setView] = useState<'all' | 'active' | 'cancelled'>('all');

  // Query: Todas las suscripciones (Activas e Inactivas)
  const { data: allSuscripciones = [], isLoading: loadingAll } = useQuery<SuscripcionProyectoDto[], Error>({
    queryKey: ['suscripciones', 'all', proyectoId],
    // ❗ CORRECCIÓN 1: Nombre del método para obtener todas las suscripciones de un proyecto
    queryFn: () => suscripcionProyectoService.getAllSuscripcionesByProyecto(proyectoId),
    enabled: view === 'all',
  });

  // Query: Suscripciones activas
  const { data: activeSuscripciones = [], isLoading: loadingActive } = useQuery<SuscripcionProyectoDto[], Error>({
    queryKey: ['suscripciones', 'active', proyectoId],
    // ❗ CORRECCIÓN 2: Nombre del método para obtener suscripciones activas de un proyecto
    queryFn: () => suscripcionProyectoService.getSuscripcionesActivasByProyecto(proyectoId),
    enabled: view === 'active',
  });

  // Query: Suscripciones canceladas
  const { data: cancelledSuscripciones = [], isLoading: loadingCancelled } = useQuery<SuscripcionCanceladaDto[], Error>({ 
    queryKey: ['suscripciones', 'cancelled', proyectoId],
    // ❗ CORRECCIÓN CRÍTICA: Se usa el nombre del método correcto del servicio 'suscripcionService'
    queryFn: () => suscripcionService.getSuscripcionesCanceladasByProyecto(proyectoId),
    enabled: view === 'cancelled',
  });

  const isLoading = loadingAll || loadingActive || loadingCancelled;

  const renderTableContent = () => {
    if (view === 'all' || view === 'active') {
      const data = view === 'all' ? allSuscripciones : activeSuscripciones;
      if (data.length === 0) return <Alert severity="info">No hay suscripciones en esta vista.</Alert>;

      return (
        <TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.id}</TableCell>
              <TableCell>Usuario ID: {s.id_usuario}</TableCell>
              <TableCell>{format(new Date(s.createdAt!), 'dd/MM/yyyy')}</TableCell>
              {/* ❗ CORRECCIÓN 3: El campo es 'meses_a_pagar' */}
              <TableCell align="right">{s.meses_a_pagar}</TableCell> 
              <TableCell align="right">${Number(s.saldo_a_favor).toLocaleString()}</TableCell>
              <TableCell align="right">{s.tokens_disponibles}</TableCell>
              <TableCell align="center">
                <Chip label={s.activo ? 'Activa' : 'Inactiva'} size="small" color={s.activo ? 'success' : 'default'} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (view === 'cancelled') {
      // Usando SuscripcionCanceladaDto (asumido)
      if (cancelledSuscripciones.length === 0) return <Alert severity="info">No hay suscripciones canceladas.</Alert>;

      return (
        <TableBody>
          {cancelledSuscripciones.map((s) => (
            <TableRow key={s.id_suscripcion_original}>
              <TableCell>{s.id_suscripcion_original}</TableCell>
              <TableCell>Usuario ID: {s.id_usuario}</TableCell>
              <TableCell>{format(new Date(s.fecha_cancelacion), 'dd/MM/yyyy')}</TableCell>
              <TableCell align="right">{s.meses_pagados}</TableCell>
              <TableCell align="right">${Number(s.monto_pagado_total).toLocaleString()}</TableCell>
              <TableCell colSpan={2} align="center">
                <Chip label="Cancelada" size="small" color="error" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }
    return null;
  };

  return (
    <Box sx={{ px: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Suscripciones del Proyecto</Typography>
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

      <QueryHandler isLoading={isLoading} error={null}>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            {/* Cabecera de tabla dinámica */}
            {view === 'cancelled' ? (
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>ID Suscripción</TableCell>
                  <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
                  <TableCell sx={{ color: 'white' }}>Fecha Cancelación</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Meses Pagados</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Monto Pagado</TableCell>
                  <TableCell sx={{ color: 'white' }} align="center" colSpan={2}>Estado</TableCell>
                </TableRow>
              </TableHead>
            ) : (
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
                  <TableCell sx={{ color: 'white' }}>Fecha Suscripción</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Meses a Pagar</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Saldo a Favor</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Tokens</TableCell>
                  <TableCell sx={{ color: 'white' }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
            )}
            {renderTableContent()}
          </Table>
        </TableContainer>
      </QueryHandler>
    </Box>
  );
};

export default ProyectoSuscripciones;
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Alert, Tooltip, IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Map as MapIcon, 
  Event as EventIcon 
} from '@mui/icons-material';

// Importamos los tipos correctos
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import type { LoteDto, EstadoSubasta } from '../../../../types/dto/lote.dto'; 

interface ProyectoLotesManagerProps {
  // Asumimos que ProyectoDto tiene una propiedad 'lotes' que es un array de LoteDto
  // Si TS se queja aquí, asegúrate de actualizar tambien ProyectoDto
  proyecto: ProyectoDto; 
  onAssignLotes: () => void;
}

// Helper para colores de estado
const getStatusColor = (estado: EstadoSubasta) => {
  switch (estado) {
    case 'activa': return 'success';     // Verde
    case 'pendiente': return 'warning';  // Naranja
    case 'finalizada': return 'default'; // Gris
    default: return 'default';
  }
};

// Helper para formato de fecha corto
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

export const ProyectoLotesManager: React.FC<ProyectoLotesManagerProps> = ({
  proyecto,
  onAssignLotes
}) => {
  // Casteamos lotes para asegurar a TS que usamos la nueva estructura
  const lotes = (proyecto.lotes || []) as unknown as LoteDto[];

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gestión de Lotes / Subastas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lotes registrados: {lotes.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAssignLotes}
        >
          Crear Lote
        </Button>
      </Stack>

      {/* Tabla de Lotes */}
      {lotes.length === 0 ? (
        <Alert severity="info">
          Este proyecto no tiene lotes asignados aún. Haz clic en "Crear Lote" para comenzar.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre / Lote</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Precio Base</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Fechas (Inicio - Fin)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Ubicación</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado Subasta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes.map((lote) => (
                <TableRow key={lote.id} hover>
                  <TableCell>{lote.id}</TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {lote.nombre_lote}
                    </Typography>
                    {lote.activo === false && (
                       <Typography variant="caption" color="error">Inactivo</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${Number(lote.precio_base).toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="success.main">I:</Typography>
                            <Typography variant="caption">{formatDate(lote.fecha_inicio)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="error.main">F:</Typography>
                            <Typography variant="caption">{formatDate(lote.fecha_fin)}</Typography>
                        </Box>
                    </Stack>
                  </TableCell>

                  <TableCell align="center">
                    {lote.latitud && lote.longitud ? (
                      <Tooltip title={`Lat: ${lote.latitud}, Lng: ${lote.longitud}`}>
                         <IconButton 
                            size="small" 
                            color="primary" 
                            href={`https://www.google.com/maps/search/?api=1&query=${lote.latitud},${lote.longitud}`}
                            target="_blank"
                         >
                            <MapIcon fontSize="small" />
                         </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={lote.estado_subasta?.toUpperCase()}
                      size="small"
                      color={getStatusColor(lote.estado_subasta)}
                      sx={{ fontWeight: 'bold', minWidth: 85 }}
                    />
                    {lote.id_ganador && (
                        <Typography variant="caption" display="block" color="success.main" sx={{mt: 0.5}}>
                            ¡Ganador Asignado!
                        </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info adicional */}
      <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
            <EventIcon color="info" fontSize="small" sx={{ mt: 0.3 }} />
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                <strong>Estados de Subasta:</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                • <strong>Pendiente:</strong> Aún no ha alcanzado la fecha de inicio.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                • <strong>Activa:</strong> La subasta está en curso y recibe pujas.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                • <strong>Finalizada:</strong> La fecha de fin ha pasado o se ha cerrado manualmente.
                </Typography>
            </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProyectoLotesManager;
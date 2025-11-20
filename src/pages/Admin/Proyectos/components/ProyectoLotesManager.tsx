// ============================================================================
// COMPONENTE C: ProyectoLotesManager.tsx
// Gestión de lotes asignados al proyecto
// ============================================================================
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';

interface ProyectoLotesManagerProps {
  proyecto: ProyectoDTO;
  onAssignLotes: () => void;
}

export const ProyectoLotesManager: React.FC<ProyectoLotesManagerProps> = ({
  proyecto,
  onAssignLotes
}) => {
  const lotes = proyecto.lotes || [];

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gestión de Lotes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lotes asignados a este proyecto: {lotes.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAssignLotes}
        >
          Asignar Lotes Adicionales
        </Button>
      </Stack>

      {/* Tabla de Lotes */}
      {lotes.length === 0 ? (
        <Alert severity="info">
          Este proyecto no tiene lotes asignados aún. Haz clic en "Asignar Lotes Adicionales" para comenzar.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número de Lote</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Manzana</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Metros²</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                  Precio Base
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes.map((lote) => (
                <TableRow key={lote.id} hover>
                  <TableCell>{lote.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      Lote {lote.numero_lote}
                    </Typography>
                  </TableCell>
                  <TableCell>{lote.manzana || 'N/A'}</TableCell>
                  <TableCell>{lote.metros_cuadrados} m²</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${lote.precio_base?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={lote.estado || 'Disponible'}
                      size="small"
                      color={
                        lote.estado === 'disponible' ? 'success' :
                        lote.estado === 'vendido' ? 'default' :
                        lote.estado === 'reservado' ? 'warning' : 'info'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info adicional */}
      <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          <strong>Nota:</strong> Los lotes asignados a este proyecto podrán ser subastados entre los 
          suscriptores activos una vez que el proyecto alcance su objetivo de suscripciones.
        </Typography>
        {proyecto.tipo_inversion === 'directo' && (
          <Typography variant="caption" color="info.main" display="block">
            <strong>Proyecto de Inversión Directa:</strong> Todos los lotes asignados forman parte 
            del paquete de inversión total.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ProyectoLotesManager;
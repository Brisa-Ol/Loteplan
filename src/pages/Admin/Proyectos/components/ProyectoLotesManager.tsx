// src/components/Admin/Proyectos/Components/ProyectoLotesManager.tsx (Corregido)
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';

interface ProyectoLotesManagerProps {
  proyecto: ProyectoDTO;
  onAssignLotes: () => void;
}

const ProyectoLotesManager: React.FC<ProyectoLotesManagerProps> = ({
  proyecto,
  onAssignLotes
}) => {
  const lotes = proyecto.lotes || [];

  return (
    <Box sx={{ px: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Lotes del Proyecto ({lotes.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAssignLotes}
        >
          Asignar Más Lotes
        </Button>
      </Stack>

      {lotes.length === 0 ? (
        <Alert severity="info">
          No hay lotes asignados a este proyecto. Usa el botón de arriba para asignar lotes.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio Base</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ubicación (Lat/Lon)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes.map((lote) => (
                <TableRow key={lote.id}>
                  <TableCell>{lote.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {lote.nombre_lote}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {/* ❗ CORRECCIÓN 1 y 3: Usar la moneda del proyecto y convertir a número */}
                    ${Number(lote.precio_base).toLocaleString()} {proyecto.moneda || ''}
                  </TableCell>
                  <TableCell>
                    {/* ❗ CORRECCIÓN 2: Usar latitud y longitud */}
                    {lote.latitud && lote.longitud ? (
                      <Typography variant="caption">
                        {lote.latitud}, {lote.longitud}
                      </Typography>
                    ) : (
                      'No especificada'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lote.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={lote.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {proyecto.tipo_inversion === 'directo' && lotes.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Proyecto de Inversión Directa:</strong> Los lotes se venderán como un paquete completo.
        </Alert>
      )}
    </Box>
  );
};

export default ProyectoLotesManager;
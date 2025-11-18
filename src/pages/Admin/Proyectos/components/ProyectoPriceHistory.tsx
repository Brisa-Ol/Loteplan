// ============================================================================
// COMPONENTE D: ProyectoPriceHistory.tsx
// Historial de cuotas mensuales (solo para proyectos mensuales)
// ============================================================================
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { cuotaMensualService } from '../../../../Services/cuotaMensual.service';
import type { CuotaMensualDTO } from '../../../../types/dto/cuotaMensual.dto';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';


interface ProyectoPriceHistoryProps {
  proyectoId: number;
}

const ProyectoPriceHistory: React.FC<ProyectoPriceHistoryProps> = ({
  proyectoId
}) => {
  const { data: cuotas = [], isLoading, error } = useQuery<CuotaMensualDTO[], Error>({
    queryKey: ['cuotasByProyecto', proyectoId],
    queryFn: () => cuotaMensualService.getCuotasByProyecto(proyectoId.toString()),
  });

  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Historial de Precios (Cuotas Mensuales)
      </Typography>

      <QueryHandler isLoading={isLoading} error={error}>
        {cuotas.length === 0 ? (
          <Alert severity="info">
            No hay configuraciones de cuotas para este proyecto. Crea una desde el botón de "Configurar Cuota Mensual".
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cemento</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Unidades
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Precio/Unidad
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Cuota Final
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Estado
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuotas.map((cuota, index) => (
                  <TableRow key={cuota.id}>
                    <TableCell>
                      {new Date(cuota.createdAt!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{cuota.nombre_cemento_cemento || 'N/A'}</TableCell>
                    <TableCell align="right">{cuota.valor_cemento_unidades}</TableCell>
                    <TableCell align="right">${cuota.valor_cemento.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ${cuota.valor_mensual_final.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={index === 0 ? "ACTUAL" : "HISTÓRICO"}
                        size="small"
                        color={index === 0 ? "success" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>
    </Box>
  );
};

export default ProyectoPriceHistory;
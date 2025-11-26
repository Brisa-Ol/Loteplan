import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Alert, Box, Chip, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Typography, IconButton, Tooltip 
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';


import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import CuotaMensualService from '../../../../Services/cuotaMensual.service';
import type { CuotaMensualDto } from '../../../../types/dto/cuotaMensual.dto';

interface ProyectoPriceHistoryProps {
  proyectoId: number;
}

const ProyectoPriceHistory: React.FC<ProyectoPriceHistoryProps> = ({
  proyectoId
}) => {
  const queryClient = useQueryClient();
  const queryKey = ['cuotasByProyecto', proyectoId];

  // 1. Cargar Historial
  const { data: cuotas = [], isLoading, error } = useQuery<CuotaMensualDto[], Error>({
    queryKey: queryKey,
    queryFn: async () => (await CuotaMensualService.getCuotasByProyecto(proyectoId)).data,
  });

  // 2. Mutación para Eliminar (Soft Delete) - CUMPLE REQUISITO 6.3
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await CuotaMensualService.softDelete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      // También refrescamos el proyecto porque el precio actual podría cambiar
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      alert('Cuota eliminada del historial.');
    },
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
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
            <Table size="small">
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuotas.map((cuota, index) => (
                  <TableRow key={cuota.id}>
                    <TableCell>
                      {cuota.createdAt ? new Date(cuota.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{cuota.nombre_cemento_cemento || 'N/A'}</TableCell>
                    <TableCell align="right">{cuota.valor_cemento_unidades}</TableCell>
                    <TableCell align="right">${Number(cuota.valor_cemento).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ${Number(cuota.valor_mensual_final).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={index === 0 ? "ACTUAL" : "HISTÓRICO"}
                        size="small"
                        color={index === 0 ? "success" : "default"}
                        variant={index === 0 ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                       {/* Solo permitimos borrar si no es la única (opcional) o siempre */}
                       <Tooltip title="Eliminar registro">
                         <IconButton 
                           size="small" 
                           color="error"
                           onClick={() => {
                              if(confirm('¿Eliminar este registro de cuota?')) deleteMutation.mutate(cuota.id);
                           }}
                         >
                            <DeleteIcon fontSize="small" />
                         </IconButton>
                       </Tooltip>
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
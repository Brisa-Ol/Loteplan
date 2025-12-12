import React from 'react';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Alert, CircularProgress 
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { CuotaMensualDto } from '../../../../types/dto/cuotaMensual.dto';
import CuotaMensualService from '../../../../Services/cuotaMensual.service';


interface Props {
  proyectoId: number;
}

const ProyectoPriceHistory: React.FC<Props> = ({ proyectoId }) => {
  
  const { data: historial = [], isLoading, error } = useQuery<CuotaMensualDto[]>({
    queryKey: ['cuotasByProyecto', proyectoId],
    queryFn: async () => {
      try {
        const res = await CuotaMensualService.getByProjectId(proyectoId);
        return res.data;
      } catch (err: any) {
        // ✅ SOLUCIÓN CLAVE:
        // Si el backend dice "404 Not Found", asumimos que es porque no hay historial todavía.
        // Retornamos un array vacío en lugar de lanzar error.
        if (err.response && err.response.status === 404) {
          return [];
        }
        throw err; // Si es otro error (500, 403), dejamos que falle.
      }
    },
    retry: false, // Importante: no reintentar 3 veces si ya sabemos que es 404
  });

  if (isLoading) return <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 2 }} />;

  // Si hay error real (que no sea 404)
  if (error) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      No se pudo cargar el historial.
    </Alert>
  );

  if (historial.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
        No hay historial de precios registrado para este proyecto.
        Configura la primera cuota arriba para comenzar.
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 300, borderRadius: 2 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell><strong>Fecha</strong></TableCell>
            <TableCell><strong>Valor Unidad</strong></TableCell>
            <TableCell><strong>Cuota Final</strong></TableCell>
            <TableCell align="right"><strong>% Admin</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historial.map((cuota) => (
            <TableRow key={cuota.id} hover>
              <TableCell>
                {new Date(cuota.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                ${Number(cuota.valor_cemento).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ${Number(cuota.valor_mensual_final).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                {cuota.porcentaje_administrativo}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProyectoPriceHistory;
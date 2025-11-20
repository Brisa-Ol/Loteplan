import React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button 
} from '@mui/material';
import { PlayCircleFilled, StopCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import LoteService from '../../../Services/lote.service';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';



const AdminLotes: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Traer todos los lotes (Endpoint Admin)
  const { data: lotes, isLoading, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data // Asegúrate de tener este método en el servicio
  });

  // 2. Iniciar Subasta Manual
  const startAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      alert('Subasta iniciada y usuarios notificados.');
    }
  });

  // 3. Finalizar Subasta Manual
  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      alert(data.data.mensaje);
    }
  });

  return (
    <PageContainer maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">Gestión de Lotes</Typography>
        <Typography color="text.secondary">Controla el estado de las subastas manualmente.</Typography>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Proyecto ID</TableCell>
                <TableCell>Precio Base</TableCell>
                <TableCell>Estado Subasta</TableCell>
                <TableCell align="right">Controles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes?.map((lote) => (
                <TableRow key={lote.id}>
                  <TableCell>#{lote.id}</TableCell>
                  <TableCell fontWeight="bold">{lote.nombre_lote}</TableCell>
                  <TableCell>{lote.id_proyecto || 'Sin Asignar'}</TableCell>
                  <TableCell>${Number(lote.precio_base).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={lote.estado_subasta.toUpperCase()} 
                      color={lote.estado_subasta === 'activa' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {lote.estado_subasta === 'pendiente' && (
                      <Button 
                        startIcon={<PlayCircleFilled />} 
                        color="success" 
                        size="small"
                        onClick={() => startAuctionMutation.mutate(lote.id)}
                      >
                        Iniciar
                      </Button>
                    )}
                    {lote.estado_subasta === 'activa' && (
                      <Button 
                        startIcon={<StopCircle />} 
                        color="error" 
                        size="small"
                        onClick={() => {
                            if(confirm('¿Finalizar subasta y asignar ganador?')) endAuctionMutation.mutate(lote.id);
                        }}
                      >
                        Finalizar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminLotes;
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, CircularProgress, Chip, IconButton 
} from '@mui/material';
import { Close, Inventory } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import LoteService from '../../../../Services/lote.service';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const ProjectLotesModal: React.FC<Props> = ({ open, onClose, proyecto }) => {
  
  const { data: lotes = [], isLoading, error } = useQuery({
    queryKey: ['lotesByProject', proyecto?.id],
    queryFn: async () => {
      if (!proyecto) return [];
      const res = await LoteService.getByProject(proyecto.id); 
      return res.data;
    },
    enabled: open && !!proyecto,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
           <Typography variant="h6" fontWeight={700}>
             Lotes del Proyecto: {proyecto?.nombre_proyecto}
           </Typography>
           <Typography variant="caption" color="text.secondary">
             Inventario asignado
           </Typography>
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {isLoading ? (
           <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
        ) : error ? (
           <Typography color="error">Error al cargar lotes.</Typography>
        ) : lotes.length === 0 ? (
           <Box textAlign="center" py={4}>
             <Inventory sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
             <Typography color="text.secondary">Este proyecto no tiene lotes asignados aún.</Typography>
           </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre Lote</TableCell>
                  <TableCell>Precio Base</TableCell>
                  <TableCell>Estado Subasta</TableCell>
                  <TableCell>Ganador</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lotes.map((lote) => (
                  <TableRow key={lote.id} hover>
                    <TableCell>{lote.id}</TableCell>
                    
                    {/* ✅ CORRECCIÓN AQUÍ: Usamos sx={{ fontWeight: 600 }} */}
                    <TableCell sx={{ fontWeight: 600 }}>{lote.nombre_lote}</TableCell>
                    
                    <TableCell>${Number(lote.precio_base).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={lote.estado_subasta} 
                        size="small" 
                        color={lote.estado_subasta === 'activa' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {lote.id_ganador ? <Typography variant="caption" color="success.main">Adjudicado</Typography> : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectLotesModal;
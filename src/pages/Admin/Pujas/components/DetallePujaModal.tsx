// src/pages/Admin/Pujas/modals/DetallePujaModal.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider, Grid
} from '@mui/material';
import { 
  Close as CloseIcon,
  Gavel,
  Person,
  CalendarToday,
  AttachMoney,
  Warning
} from '@mui/icons-material';
import type { PujaDto } from '../../../../types/dto/puja.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  puja: PujaDto | null;
  // Pasamos datos extra si el include del back no trae todo
  loteName?: string;
  userName?: string;
}

const DetallePujaModal: React.FC<Props> = ({ open, onClose, puja, loteName, userName }) => {
  if (!puja) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ganadora_pagada': return 'success';
      case 'ganadora_pendiente': return 'warning';
      case 'activa': return 'info';
      case 'ganadora_incumplimiento': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Gavel color="primary" />
          <Typography variant="h6" fontWeight="bold">Puja #{puja.id}</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          
          {/* Encabezado: Monto y Estado */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Monto Ofertado</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  ${Number(puja.monto_puja).toLocaleString('es-AR')}
                </Typography>
              </Box>
              <Chip 
                label={puja.estado_puja.toUpperCase().replace('_', ' ')} 
                color={getStatusColor(puja.estado_puja)} 
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>
          </Paper>

          {/* Contexto: Usuario y Lote */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Stack direction="row" spacing={1} mb={1}>
                <Person color="action" />
                <Typography fontWeight="bold">Postor</Typography>
              </Stack>
              <Typography variant="body1">{userName || `Usuario ID: ${puja.id_usuario}`}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {puja.id_usuario}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Stack direction="row" spacing={1} mb={1}>
                <Gavel color="action" />
                <Typography fontWeight="bold">Lote Objetivo</Typography>
              </Stack>
              <Typography variant="body1">{loteName || puja.lote?.nombre_lote || `Lote ID: ${puja.id_lote}`}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {puja.id_lote}</Typography>
            </Paper>
          </Box>

          {/* Fechas Importantes */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} mb={2}>
              <CalendarToday color="action" />
              <Typography fontWeight="bold">Cronología</Typography>
            </Stack>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Realizada</Typography>
                <Typography variant="body2">{new Date(puja.fecha_puja).toLocaleDateString('es-AR')}</Typography>
              </Box>
              
              {/* Solo mostramos vencimiento si es ganadora pendiente */}
              {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Vencimiento de Pago</Typography>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    {new Date(puja.fecha_vencimiento_pago).toLocaleDateString('es-AR')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Alerta de Impago (Si aplica) */}
          {puja.estado_puja === 'ganadora_incumplimiento' && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.50', borderColor: 'error.main' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Warning color="error" />
                <Box>
                  <Typography variant="subtitle2" color="error.main" fontWeight="bold">
                    Impago Registrado
                  </Typography>
                  <Typography variant="caption" color="error.dark">
                    Esta puja fue anulada por incumplimiento de pago. El token del usuario fue devuelto según políticas.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetallePujaModal;
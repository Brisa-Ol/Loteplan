// src/pages/Admin/Pujas/modals/DetallePujaModal.tsx

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider, 
  useTheme, alpha
} from '@mui/material';
import { 
  Close as CloseIcon,
  Gavel,
  Person,
  CalendarToday,
  Business as LoteIcon,
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
  const theme = useTheme();

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

  const statusColor = getStatusColor(puja.estado_puja);
  const themeColor = (theme.palette as any)[statusColor !== 'default' ? statusColor : 'primary'];

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            p: 1, borderRadius: '50%', display: 'flex' 
          }}>
            <Gavel color="primary" fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Puja #{puja.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Detalle de la oferta
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), p: 4 }}>
        <Stack spacing={3}>
          
          {/* Encabezado: Monto y Estado */}
          <Paper 
            elevation={0}
            sx={{ 
                p: 2.5, borderRadius: 2, 
                border: '1px solid', 
                borderColor: alpha(themeColor.main, 0.3),
                bgcolor: alpha(themeColor.main, 0.04) 
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    MONTO OFERTADO
                </Typography>
                <Typography variant="h4" fontWeight={800} color={themeColor.main} sx={{ my: 0.5 }}>
                  ${Number(puja.monto_puja).toLocaleString('es-AR')}
                </Typography>
              </Box>
              <Chip 
                label={puja.estado_puja.toUpperCase().replace('_', ' ')} 
                color={statusColor as any} 
                variant="filled"
                sx={{ fontWeight: 'bold', px: 2, height: 32 }}
              />
            </Stack>
          </Paper>

          {/* Contexto: Usuario y Lote */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            
            {/* Postor */}
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
              <Stack direction="row" spacing={1} mb={2} alignItems="center">
                <Person color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>POSTOR</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nombre / ID</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {userName || `Usuario ID: ${puja.id_usuario}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ID Usuario</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        #{puja.id_usuario}
                    </Typography>
                  </Box>
              </Stack>
            </Paper>

            {/* Lote */}
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
              <Stack direction="row" spacing={1} mb={2} alignItems="center">
                <LoteIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>LOTE OBJETIVO</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nombre del Lote</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {loteName || puja.lote?.nombre_lote || `Lote ID: ${puja.id_lote}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ID Lote</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        #{puja.id_lote}
                    </Typography>
                  </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* Fechas Importantes */}
          <Paper 
            elevation={0}
            sx={{ 
                p: 2.5, borderRadius: 2, 
                border: '1px solid', borderColor: 'divider' 
            }}
          >
            <Stack direction="row" spacing={1} mb={2} alignItems="center">
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">CRONOLOGÍA</Typography>
            </Stack>
            
            <Stack 
                direction="row" 
                spacing={4}
                divider={<Divider orientation="vertical" flexItem />}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Realizada</Typography>
                <Typography variant="body1" fontWeight={600}>
                    {new Date(puja.fecha_puja).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              
              {/* Solo mostramos vencimiento si es ganadora pendiente */}
              {puja.estado_puja === 'ganadora_pendiente' && puja.fecha_vencimiento_pago && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Vencimiento de Pago</Typography>
                  <Typography variant="body1" color="error.main" fontWeight={700}>
                    {new Date(puja.fecha_vencimiento_pago).toLocaleDateString('es-AR')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Alerta de Impago (Si aplica) */}
          {puja.estado_puja === 'ganadora_incumplimiento' && (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2, borderRadius: 2, 
                    bgcolor: alpha(theme.palette.error.main, 0.05), 
                    border: '1px solid',
                    borderColor: alpha(theme.palette.error.main, 0.3)
                }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Warning color="error" />
                <Box>
                  <Typography variant="subtitle2" color="error.main" fontWeight={800}>
                    IMPAGO REGISTRADO
                  </Typography>
                  <Typography variant="caption" color="error.dark" fontWeight={500}>
                    Esta puja fue anulada por incumplimiento de pago. El token del usuario fue devuelto según políticas.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button 
            onClick={onClose} 
            variant="contained" 
            color="inherit" 
            sx={{ borderRadius: 2, px: 4, bgcolor: theme.palette.grey[800], color: 'white', '&:hover': { bgcolor: theme.palette.grey[900] } }}
        >
            Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetallePujaModal;
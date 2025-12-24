// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Chip, Stack, Paper, IconButton, Divider,
  useTheme, alpha
} from '@mui/material';
import { 
  Close as CloseIcon,
  Person,
  AccountBalance,
  MonetizationOn,
  Token,
  CalendarToday
} from '@mui/icons-material';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {
  const theme = useTheme();

  if (!suscripcion) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10] }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        pb: 2, pt: 3, px: 3
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            p: 1, borderRadius: '50%', display: 'flex' 
          }}>
            <AccountBalance color="primary" fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
              Detalle de Suscripción
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: #{suscripcion.id}
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
          
          {/* 1. Información General */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, borderRadius: 2, 
              border: '1px solid', borderColor: 'divider' 
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                    INFORMACIÓN GENERAL
                </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Estado Actual:</Typography>
                <Chip 
                  label={suscripcion.activo ? 'ACTIVA' : 'CANCELADA'} 
                  size="small" 
                  color={suscripcion.activo ? 'success' : 'default'}
                  variant={suscripcion.activo ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                />
              </Stack>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Fecha de Alta:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {suscripcion.createdAt 
                    ? new Date(suscripcion.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      }) 
                    : '-'}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* 2. Usuario y Proyecto (Grid 2 columnas) */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            
            {/* Usuario */}
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Person color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={800}>USUARIO</Typography>
                </Stack>
                <Stack spacing={1}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {suscripcion.usuario?.nombre} {suscripcion.usuario?.apellido}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>
                            {suscripcion.usuario?.email}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Proyecto */}
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <AccountBalance color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={800}>PROYECTO</Typography>
                </Stack>
                <Stack spacing={1}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {suscripcion.proyectoAsociado?.nombre_proyecto}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Estado del Proyecto</Typography>
                        <Box mt={0.5}>
                             <Chip 
                                label={suscripcion.proyectoAsociado?.estado_proyecto || 'N/A'} 
                                size="small" 
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        </Box>
                    </Box>
                </Stack>
            </Paper>
          </Stack>

          {/* 3. Finanzas */}
          <Paper 
            elevation={0}
            sx={{ 
                p: 2.5, borderRadius: 2, 
                border: '1px solid', 
                borderColor: alpha(theme.palette.info.main, 0.3),
                bgcolor: alpha(theme.palette.info.main, 0.04) 
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <MonetizationOn color="info" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800} color="info.main">
                RESUMEN FINANCIERO
              </Typography>
            </Stack>
            
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Monto Total Pagado:</Typography>
                    <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
                        ${Number(suscripcion.monto_total_pagado).toLocaleString('es-AR')}
                    </Typography>
                </Stack>
                
                <Divider />
                
                <Stack direction="row" spacing={4}>
                    <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">Cuotas Pendientes</Typography>
                        <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                             <Typography variant="body1" fontWeight={700}>
                                {suscripcion.meses_a_pagar}
                             </Typography>
                             <Chip 
                                label={suscripcion.meses_a_pagar > 0 ? 'Con Deuda' : 'Al Día'} 
                                size="small" 
                                color={suscripcion.meses_a_pagar > 0 ? 'warning' : 'success'}
                                sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                        </Stack>
                    </Box>
                    
                    <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">Saldo a Favor</Typography>
                        <Typography variant="body1" fontWeight={700} color="success.main">
                            ${Number(suscripcion.saldo_a_favor).toLocaleString('es-AR')}
                        </Typography>
                    </Box>
                    
                    <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">Tokens Disponibles</Typography>
                        <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                             <Token color="warning" sx={{ fontSize: 16 }} />
                             <Typography variant="body1" fontWeight={700}>
                                {suscripcion.tokens_disponibles}
                             </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Stack>
          </Paper>

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

export default DetalleSuscripcionModal;
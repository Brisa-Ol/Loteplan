// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Chip, Stack, Paper, Alert,
  IconButton, Divider
} from '@mui/material';
import { 
  Close as CloseIcon,
  Person,
  AccountBalance,
  MonetizationOn,
  Token
} from '@mui/icons-material';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {

  if (!suscripcion) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2 
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AccountBalance color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Detalle de Suscripción #{suscripcion.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          {/* 1. Información General (Campos de SuscripcionDto + BaseDTO) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
              Información General
            </Typography>
            <Stack spacing={1} mt={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Estado:</Typography>
                <Chip 
                  label={suscripcion.activo ? 'Activa' : 'Cancelada'} 
                  size="small" 
                  color={suscripcion.activo ? 'success' : 'default'}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {/* Se asume createdAt por BaseDTO, si no existe en tu BaseDTO, quitar esta línea */}
                  {suscripcion.createdAt 
                    ? new Date(suscripcion.createdAt).toLocaleDateString('es-AR') 
                    : '-'}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* 2. Usuario (suscripcion.usuario) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="action" />
              <Typography variant="subtitle2" fontWeight="bold">Usuario</Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {suscripcion.usuario?.nombre} {suscripcion.usuario?.apellido}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {suscripcion.usuario?.email}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* 3. Proyecto (suscripcion.proyectoAsociado) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AccountBalance color="action" />
              <Typography variant="subtitle2" fontWeight="bold">Proyecto</Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {suscripcion.proyectoAsociado?.nombre_proyecto}
                </Typography>
              </Stack>
              {/* Solo mostramos estado si está en tu ProyectoDto */}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Estado:</Typography>
                <Chip 
                  label={suscripcion.proyectoAsociado?.estado_proyecto || 'N/A'} 
                  size="small" 
                />
              </Stack>
            </Stack>
          </Paper>

          {/* 4. Financiero (Campos propios de SuscripcionDto) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(2, 136, 209, 0.08)' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <MonetizationOn color="primary" />
              <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                Finanzas
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Monto Total Pagado:</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${Number(suscripcion.monto_total_pagado).toLocaleString('es-AR')}
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Cuotas Restantes:</Typography>
                <Chip 
                  label={suscripcion.meses_a_pagar} 
                  size="small" 
                  color={suscripcion.meses_a_pagar > 0 ? 'warning' : 'success'}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Saldo a Favor:</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  ${Number(suscripcion.saldo_a_favor).toLocaleString('es-AR')}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          {/* 5. Tokens (Campo tokens_disponibles) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Token color="warning" />
              <Typography variant="subtitle2" fontWeight="bold">Tokens</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Disponibles:
              </Typography>
              <Chip 
                label={suscripcion.tokens_disponibles} 
                size="medium" 
                color={suscripcion.tokens_disponibles > 0 ? 'warning' : 'default'}
              />
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleSuscripcionModal;
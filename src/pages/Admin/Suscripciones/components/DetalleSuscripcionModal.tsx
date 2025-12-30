// src/pages/Admin/Suscripciones/modals/DetalleSuscripcionModal.tsx

import React from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha
} from '@mui/material';
import { 
  Person,
  AccountBalance,
  MonetizationOn,
  Token,
  CalendarToday,
  Info as InfoIcon
} from '@mui/icons-material';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  suscripcion: SuscripcionDto | null;
}

const DetalleSuscripcionModal: React.FC<Props> = ({ open, onClose, suscripcion }) => {
  const theme = useTheme();

  if (!suscripcion) return null;

  // Determinar color según estado
  const statusColor = suscripcion.activo ? 'success' : 'default';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Detalle de Suscripción"
      subtitle={`ID Referencia: #${suscripcion.id}`}
      icon={<AccountBalance />}
      headerColor="primary"
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip 
          label={suscripcion.activo ? 'ACTIVA' : 'CANCELADA'} 
          color={statusColor}
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>
        
        {/* 1. Usuario y Proyecto (Grid 2 columnas) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          
          {/* Usuario */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>USUARIO</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                <Typography variant="body1" fontWeight={600}>
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
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AccountBalance color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PROYECTO</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                <Typography variant="body1" fontWeight={600}>
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
                    sx={{ height: 24, fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* 2. Resumen Financiero */}
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
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                MONTO TOTAL PAGADO
              </Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
                ${Number(suscripcion.monto_total_pagado).toLocaleString('es-AR')}
              </Typography>
            </Stack>
            
            <Divider />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
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
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
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
                  <Token color="warning" sx={{ fontSize: 18 }} />
                  <Typography variant="body1" fontWeight={700}>
                    {suscripcion.tokens_disponibles}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* 3. Fechas / Metadata */}
        <Box sx={{ px: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <CalendarToday fontSize="small" sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight={600}>
                    Fecha de Alta: {suscripcion.createdAt 
                        ? new Date(suscripcion.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) 
                        : '-'}
                </Typography>
            </Stack>
        </Box>

      </Stack>
    </BaseModal>
  );
};

export default DetalleSuscripcionModal;
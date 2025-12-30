// src/pages/Admin/Pujas/modals/DetallePujaModal.tsx

import React from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha
} from '@mui/material';
import { 
  Gavel,
  Person,
  CalendarToday,
  Business as LoteIcon,
  Warning
} from '@mui/icons-material';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { PujaDto } from '../../../../types/dto/puja.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  puja: PujaDto | null;
  loteName?: string;
  userName?: string;
}

const DetallePujaModal: React.FC<Props> = ({ open, onClose, puja, loteName, userName }) => {
  const theme = useTheme();

  if (!puja) return null;

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'primary' => {
    switch (status) {
      case 'ganadora_pagada': return 'success';
      case 'ganadora_pendiente': return 'warning';
      case 'activa': return 'info';
      case 'ganadora_incumplimiento': return 'error';
      default: return 'primary';
    }
  };

  const statusColor = getStatusColor(puja.estado_puja);
  // Color del tema para usar en fondos/bordes personalizados
  const themeColorMain = theme.palette[statusColor].main;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Puja #${puja.id}`}
      subtitle="Detalle de la oferta realizada"
      icon={<Gavel />}
      headerColor={statusColor}
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip 
          label={puja.estado_puja.toUpperCase().replace('_', ' ')} 
          color={statusColor} 
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>
        
        {/* SECCIÓN 1: MONTO OFERTADO */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, borderRadius: 2, 
            border: '1px solid', 
            borderColor: alpha(themeColorMain, 0.3),
            bgcolor: alpha(themeColorMain, 0.04),
            textAlign: 'center'
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
            MONTO OFERTADO
          </Typography>
          <Typography variant="h3" fontWeight={800} color={themeColorMain}>
            ${Number(puja.monto_puja).toLocaleString('es-AR')}
          </Typography>
        </Paper>

        {/* SECCIÓN 2: CONTEXTO (Usuario y Lote) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          
          {/* Postor */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
                <Typography variant="caption" color="text.secondary">ID Sistema</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  #{puja.id_usuario}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Lote */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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

        {/* SECCIÓN 3: FECHAS */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} mb={2} alignItems="center">
            <CalendarToday color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">CRONOLOGÍA</Typography>
          </Stack>
          
          <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha Realizada</Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(puja.fecha_puja).toLocaleDateString('es-AR')}
              </Typography>
            </Box>
            
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

        {/* ALERTA DE IMPAGO (Si aplica) */}
        {puja.estado_puja === 'ganadora_incumplimiento' && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, borderRadius: 2, 
              bgcolor: alpha(theme.palette.error.main, 0.05), 
              border: '1px dashed',
              borderColor: 'error.main'
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
    </BaseModal>
  );
};

export default DetallePujaModal;
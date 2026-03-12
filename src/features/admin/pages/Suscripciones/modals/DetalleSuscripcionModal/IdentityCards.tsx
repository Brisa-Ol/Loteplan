// src/features/admin/pages/Suscripciones/modals/sections/IdentityCards.tsx

import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { AccountBalance, AlternateEmail, Person } from '@mui/icons-material';
import { alpha, Chip, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  suscripcion: SuscripcionDto;
  fullName: string;
}

const IdentityCards: React.FC<Props> = ({ suscripcion, fullName }) => {
  const theme = useTheme();
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Person color="primary" sx={{ fontSize: 18 }} />
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Inversor</Typography>
        </Stack>
        <Typography variant="body1" fontWeight={800}>{fullName}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
          <AlternateEmail sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="primary.main" fontWeight={700}>@{suscripcion.usuario?.nombre_usuario}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <AccountBalance color="secondary" sx={{ fontSize: 18 }} />
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Proyecto Asociado</Typography>
        </Stack>
        <Typography variant="body1" fontWeight={800}>{suscripcion.proyectoAsociado?.nombre_proyecto}</Typography>
        <Chip
          label={suscripcion.proyectoAsociado?.estado_proyecto?.toUpperCase()} size="small"
          color={suscripcion.proyectoAsociado?.estado_proyecto === 'En proceso' ? 'success' : 'warning'}
          sx={{ mt: 1, height: 18, fontSize: '0.6rem', fontWeight: 900 }}
        />
      </Paper>
    </Stack>
  );
};

export default IdentityCards;
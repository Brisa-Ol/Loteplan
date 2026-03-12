// src/features/admin/pages/Suscripciones/modals/sections/FinancialSummary.tsx

import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import { Token as TokenIcon } from '@mui/icons-material';
import { alpha, Box, Chip, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

const AmountBlock = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <Box textAlign="center">
    <Typography variant="caption" color="text.secondary" fontWeight={800} display="block">{label}</Typography>
    <Typography variant="h4" fontWeight={900} color={color || 'text.primary'} sx={{ fontFamily: 'monospace' }}>{value}</Typography>
  </Box>
);

interface Props {
  suscripcion: SuscripcionDto;
}

const FinancialSummary: React.FC<Props> = ({ suscripcion }) => {
  const theme = useTheme();
  const hasSaldo = Number(suscripcion.saldo_a_favor) > 0;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
        <AmountBlock
          label="TOTAL CAPITALIZADO"
          value={`$${Number(suscripcion.monto_total_pagado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          color="info.main"
        />
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
        <AmountBlock
          label="SALDO A FAVOR"
          value={`$${Number(suscripcion.saldo_a_favor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          color={hasSaldo ? 'success.main' : 'text.disabled'}
        />
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
        <Stack spacing={1} alignItems="center">
          <Chip
            icon={<TokenIcon color="warning" sx={{ fontSize: '16px !important' }} />}
            label={`${suscripcion.tokens_disponibles} TOKENS`}
            color="warning" sx={{ fontWeight: 900, fontSize: '0.75rem' }}
          />
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            {suscripcion.meses_a_pagar} CUOTAS RESTANTES
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default FinancialSummary;
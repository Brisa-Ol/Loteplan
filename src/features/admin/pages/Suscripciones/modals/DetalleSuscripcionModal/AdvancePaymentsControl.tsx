// src/features/admin/pages/Suscripciones/modals/sections/AdvancePaymentsControl.tsx

import { AddCircleOutline } from '@mui/icons-material';
import { alpha, Box, Button, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import React from 'react';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  showForm: boolean;
  onShowForm: () => void;
  onHideForm: () => void;
  cantidadMeses: number;
  setCantidadMeses: (v: number) => void;
  generateMutation: UseMutationResult<any, any, void>;
}

export const AdvancePaymentsControl: React.FC<Props> = ({
  showForm, onShowForm, onHideForm, cantidadMeses, setCantidadMeses, generateMutation,
}) => {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ p: 2.5, border: '1px dashed', borderColor: 'primary.main', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
      <Typography variant="caption" fontWeight={900} color="primary.main" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
        Panel de Control Administrativo
      </Typography>
      {!showForm ? (
        <Button variant="contained" startIcon={<AddCircleOutline />} onClick={onShowForm} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
          Adelantar Próximas Cuotas
        </Button>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            type="number" label="Cantidad de meses" size="small" value={cantidadMeses}
            onChange={(e) => setCantidadMeses(Number(e.target.value))}
            sx={{ width: { xs: '100%', sm: 180 } }}
          />
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button variant="contained" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>Generar</Button>
            <Button color="inherit" onClick={onHideForm}>Cancelar</Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
};

// ── AuditFooter ───────────────────────────────────────────────────────────────

import { CalendarToday, Update as UpdateIcon } from '@mui/icons-material';

interface AuditFooterProps {
  createdAt?: string;
  updatedAt?: string;
}

export const AuditFooter: React.FC<AuditFooterProps> = ({ createdAt, updatedAt }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ px: 1 }}
    divider={<Box sx={{ display: { xs: 'none', sm: 'block' }, borderLeft: '1px solid', borderColor: 'divider', opacity: 0.5 }} />}
  >
    {[
      { icon: <CalendarToday sx={{ fontSize: 16, color: 'text.disabled' }} />, label: 'REGISTRO DE ALTA', value: createdAt ? new Date(createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A' },
      { icon: <UpdateIcon sx={{ fontSize: 16, color: 'text.disabled' }} />, label: 'ÚLTIMA MODIFICACIÓN', value: updatedAt ? `${new Date(updatedAt).toLocaleDateString('es-AR')} ${new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Sin modificaciones' },
    ].map(({ icon, label, value }) => (
      <Stack key={label} direction="row" spacing={1} alignItems="center">
        {icon}
        <Box>
          <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'block', lineHeight: 1 }}>{label}</Typography>
          <Typography variant="caption" fontWeight={600} color="text.secondary">{value}</Typography>
        </Box>
      </Stack>
    ))}
  </Stack>
);
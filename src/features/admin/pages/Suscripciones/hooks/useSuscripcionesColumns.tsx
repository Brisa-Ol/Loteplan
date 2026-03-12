// src/features/admin/pages/Suscripciones/hooks/useSuscripcionesColumns.tsx

import type { SuscripcionDto } from '@/core/types/suscripcion.dto';
import type { DataTableColumn } from '@/shared';
import { Token } from '@mui/icons-material';
import { Avatar, Box, Chip, IconButton, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Cancel, Visibility } from '@mui/icons-material';
import { useMemo } from 'react';
import type { useAdminSuscripciones } from '../../../hooks/finanzas/useAdminSuscripciones';

const useSuscripcionesColumns = (logic: ReturnType<typeof useAdminSuscripciones>) => {
  const theme = useTheme();

  return useMemo<DataTableColumn<SuscripcionDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 60,
      render: (s) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{s.id}</Typography>,
    },
    {
      id: 'usuario', label: 'Titular', minWidth: 200,
      render: (s) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{
            width: 36, height: 36,
            bgcolor: s.activo ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
            color: s.activo ? 'primary.main' : 'text.disabled',
            fontSize: 14, fontWeight: 'bold',
          }}>
            {s.usuario?.nombre?.charAt(0) || '#'}
          </Avatar>
          <Box minWidth={0} flex={1}>
            <Typography variant="body2" fontWeight={700} noWrap>{s.usuario?.nombre} {s.usuario?.apellido}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{s.usuario?.email || 'Sin email'}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'proyecto', label: 'Proyecto & Estado', minWidth: 220,
      render: (s) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>{s.proyectoAsociado?.nombre_proyecto || 'S/D'}</Typography>
          <Stack direction="row" spacing={1} mt={0.5}>
            <Chip
              label={s.proyectoAsociado?.estado_proyecto?.toUpperCase()} size="small" variant="outlined"
              color={s.proyectoAsociado?.estado_proyecto === 'En proceso' ? 'success' : 'default'}
              sx={{ fontSize: '0.6rem', height: 18, fontWeight: 800 }}
            />
            <Typography variant="caption" color="text.disabled">
              {s.proyectoAsociado?.suscripciones_actuales}/{s.proyectoAsociado?.obj_suscripciones} cupos
            </Typography>
          </Stack>
        </Box>
      ),
    },
    {
      id: 'progreso', label: 'Plan y Tokens', minWidth: 160, align: 'center',
      render: (s) => (
        <Stack alignItems="center" spacing={0.5}>
          <Stack direction="row" spacing={1}>
            <Chip size="small" icon={<Token sx={{ fontSize: '14px !important' }} />}
              label={`${s.tokens_disponibles} Tkn`} color={s.tokens_disponibles > 0 ? 'warning' : 'default'}
              variant="filled" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }}
            />
            <Chip label={`${s.meses_a_pagar} cuotas`} size="small" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
          </Stack>
          <Typography variant="caption" color="text.secondary">Plazo total: {s.proyectoAsociado?.plazo_inversion} meses</Typography>
        </Stack>
      ),
    },
    {
      id: 'finanzas', label: 'Saldos', minWidth: 160,
      render: (s) => (
        <Box>
          <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
            Pagado: ${Number(s.monto_total_pagado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Typography>
          {Number(s.saldo_a_favor) > 0 && (
            <Typography variant="caption" color="success.main" fontWeight={800} display="block">
              A favor: +${Number(s.saldo_a_favor).toLocaleString('es-AR')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'auditoria', label: 'Registro', minWidth: 150,
      render: (s) => (
        <Box>
          <Typography variant="caption" display="block" fontWeight={600} color="text.primary">
            Alta: {new Date(s.createdAt).toLocaleDateString('es-AR')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hora: {new Date(s.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'acciones', label: '', align: 'right',
      render: (s) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton onClick={() => logic.handleVerDetalle(s)} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Visibility fontSize="small" />
          </IconButton>
          {s.activo && (
            <IconButton onClick={() => logic.handleCancelarClick(s)} size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
              <Cancel fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ], [theme, logic]);
};

export default useSuscripcionesColumns;
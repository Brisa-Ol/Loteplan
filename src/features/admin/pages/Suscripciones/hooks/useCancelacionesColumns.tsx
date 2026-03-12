// src/features/admin/pages/Suscripciones/hooks/useCancelacionesColumns.tsx

import type { SuscripcionCanceladaDto } from '@/core/types/suscripcion.dto';
import type { DataTableColumn } from '@/shared';
import { DateRange as DateIcon } from '@mui/icons-material';
import { alpha, Avatar, Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';

const useCancelacionesColumns = (): DataTableColumn<SuscripcionCanceladaDto>[] => {
  const theme = useTheme();

  return useMemo(() => [
    {
      id: 'id', label: 'ID / Fecha Baja', minWidth: 160,
      render: (item) => (
        <Box>
          <Typography variant="body2" fontWeight={800}>#{item.id}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <DateIcon sx={{ fontSize: 14, color: 'error.main' }} />
            <Typography variant="caption" color="error.main" fontWeight={800}>
              {new Date(item.fecha_cancelacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </Typography>
          </Stack>
        </Box>
      ),
    },
    {
      id: 'usuario', label: 'Ex-Titular', minWidth: 200,
      render: (item) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
            {item.usuarioCancelador?.nombre?.charAt(0)}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={700} noWrap>{item.usuarioCancelador?.nombre} {item.usuarioCancelador?.apellido}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">@{item.usuarioCancelador?.nombre_usuario}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'proyecto', label: 'Permanencia', minWidth: 180,
      render: (item) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">{item.proyectoCancelado?.nombre_proyecto}</Typography>
          <Chip
            label={`${item.meses_pagados} meses pagados`} size="small"
            sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 800 }}
          />
        </Box>
      ),
    },
    {
      id: 'monto', label: 'Liquidación Final',
      render: (item) => (
        <Typography variant="body2" fontWeight={800} color="error.main" sx={{ fontFamily: 'monospace' }}>
          ${Number(item.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
  ], [theme]);
};

export default useCancelacionesColumns;
// src/features/admin/pages/Inversiones/hooks/useInversionesColumns.tsx

import { env } from '@/core/config/env';
import type { InversionDto } from '@/core/types/inversion.dto';
import type { useAdminInversiones } from '@/features/admin/hooks/finanzas/useAdminInversiones';
import type { DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { StatusBadge, type StatusType } from '@/shared/components/domain/cards/StatCard';
import { CalendarMonth as DateIcon, Search } from '@mui/icons-material';
import { alpha, Avatar, Box, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const STATUS_MAP: Record<InversionDto['estado'], StatusType> = {
  pagado:      'success',
  pendiente:   'pending',
  fallido:     'failed',
  reembolsado: 'info',
};
const safeFormatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const safeString = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
    return format(new Date(safeString), 'dd/MM/yyyy', { locale: es });
};

const safeFormatTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    if (dateStr.length === 10) return ''; 
    return format(new Date(dateStr), 'HH:mm', { locale: es });
};
const useInversionesColumns = (
  logic: ReturnType<typeof useAdminInversiones>
): DataTableColumn<InversionDto>[] => {
  const theme = useTheme();

  return useMemo(() => [
    {
      id: 'inversor', label: 'Inversor', minWidth: 250,
      render: (inv) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            {inv.inversor?.nombre_usuario?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={700} noWrap>@{inv.inversor?.nombre_usuario}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {inv.inversor?.nombre} {inv.inversor?.apellido}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'proyecto', label: 'Proyecto Destino', minWidth: 250,
      render: (inv) => (
        <Box>
          <Typography variant="body2" fontWeight={600} noWrap>{inv.proyectoInvertido?.nombre_proyecto}</Typography>
          <Typography variant="caption" color="text.disabled">ID Proyecto: {inv.id_proyecto}</Typography>
        </Box>
      ),
    },
    {
      id: 'monto', label: 'Monto Invertido', align: 'right', minWidth: 150,
      render: (inv) => (
        <Box textAlign="right">
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: inv.estado === 'pagado' ? 'success.main' : 'text.primary' }}>
            ${Number(inv.monto).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.disabled">ARS</Typography>
        </Box>
      ),
    },
    {
      id: 'estado', label: 'Estado', align: 'center', minWidth: 140,
      render: (inv) => (
        <StatusBadge status={STATUS_MAP[inv.estado]} customLabel={inv.estado.toUpperCase()} />
      ),
    },
{
      id: 'fecha', label: 'Fecha Operación', minWidth: 180,
      render: (inv) => {
        const dateRaw = inv.fecha_inversion || inv.createdAt;
        const timeString = safeFormatTime(dateRaw);
        
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <DateIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Box>
              <Typography variant="caption" fontWeight={700} display="block">
                {safeFormatDate(dateRaw)}
              </Typography>
              {timeString && (
                  <Typography variant="caption" color="text.disabled">
                    {timeString} hs
                  </Typography>
              )}
            </Box>
          </Stack>
        );
      },
    },
    {
      id: 'acciones', label: '', align: 'right', minWidth: 80,
      render: (inv) => (
        <Tooltip title="Detalle Transaccional">
          <IconButton size="small" onClick={() => logic.handleViewDetails(inv)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Search fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [theme, logic]);
};

export default useInversionesColumns;
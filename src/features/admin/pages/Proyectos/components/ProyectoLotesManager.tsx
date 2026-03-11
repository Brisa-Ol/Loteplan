// src/pages/Admin/Proyectos/components/ProyectoLotesManager.tsx

import {
  PlayCircleOutline as ActiveIcon,
  Add as AddIcon,
  StopCircleOutlined as FinishedIcon,
  Landscape as LoteIcon,
  Map as MapIcon,
  AccessTime as PendingIcon,
  Gavel as SubastaIcon,
  CheckCircle as WinnerIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha, Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React from 'react';

import { env } from '@/core/config/env';
import type { EstadoSubasta, LoteDto } from '../../../../../core/types/dto/lote.dto';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';


interface ProyectoLotesManagerProps {
  proyecto: ProyectoDto;
  onAssignLotes: () => void;
}

// Formateador de fechas construido una vez con locale y timezone del env
const dateTimeFormatter = new Intl.DateTimeFormat(env.defaultLocale, {
  timeZone: env.timezone,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

// Formateador de moneda para precio base
const currencyFormatter = new Intl.NumberFormat(env.defaultLocale, {
  style: 'currency',
  currency: env.defaultCurrency,
  maximumFractionDigits: 0,
});

const getStatusConfig = (estado: EstadoSubasta) => {
  switch (estado) {
    case 'activa':
      return { color: 'success' as const, icon: <ActiveIcon fontSize="small" /> };
    case 'pendiente':
      return { color: 'warning' as const, icon: <PendingIcon fontSize="small" /> };
    case 'finalizada':
      return { color: 'error' as const, icon: <FinishedIcon fontSize="small" /> };
    default:
      return { color: 'default' as const, icon: undefined };
  }
};

// ✅ Usa env.defaultLocale y env.timezone en lugar de 'es-AR' hardcodeado
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return dateTimeFormatter.format(new Date(dateStr));
};

export const ProyectoLotesManager: React.FC<ProyectoLotesManagerProps> = ({
  proyecto,
  onAssignLotes
}) => {
  const theme = useTheme();
  const lotes = (proyecto.lotes || []) as unknown as LoteDto[];

  const headerSx = {
    color: 'text.secondary',
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.background.paper, 0.4),
    py: 1.5
  };

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
            <LoteIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Gestión de Lotes
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total registrados: <strong>{lotes.length}</strong>
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAssignLotes}
          sx={{ borderRadius: 2, fontWeight: 700, boxShadow: theme.shadows[2] }}
        >
          Gestionar Lotes
        </Button>
      </Stack>

      {/* Tabla de Lotes */}
      {lotes.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, borderStyle: 'dashed' }}>
          Este proyecto aún no tiene lotes. Comienza creando el primero.
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxHeight: 500 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={headerSx}>ID</TableCell>
                <TableCell sx={headerSx}>Lote</TableCell>
                <TableCell sx={headerSx}>Precio Base</TableCell>
                <TableCell sx={headerSx} align="center">Vigencia Subasta</TableCell>
                <TableCell sx={headerSx} align="center">Ubicación</TableCell>
                <TableCell sx={headerSx} align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes.map((lote) => {
                const config = getStatusConfig(lote.estado_subasta);
                const colorMain = config.color === 'default'
                  ? theme.palette.text.secondary
                  : theme.palette[config.color].main;

                return (
                  <TableRow key={lote.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>#{lote.id}</TableCell>

                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LoteIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={600} color={lote.activo === false ? 'text.disabled' : 'text.primary'}>
                            {lote.nombre_lote}
                          </Typography>
                          {lote.activo === false && (
                            <Chip label="Inactivo" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* ✅ currencyFormatter usa env.defaultLocale y env.defaultCurrency */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                        {currencyFormatter.format(Number(lote.precio_base))}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.65rem' }}>INICIO</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{formatDate(lote.fecha_inicio)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.65rem' }}>CIERRE</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{formatDate(lote.fecha_fin)}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      {lote.latitud && lote.longitud ? (
                        <Tooltip title="Ver en Google Maps">
                          <IconButton
                            size="small"
                            color="primary"
                            href={`https://www.google.com/maps/search/?api=1&query=${lote.latitud},${lote.longitud}`}
                            target="_blank"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                          >
                            <MapIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">-</Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        icon={config.icon}
                        label={lote.estado_subasta?.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          minWidth: 100,
                          bgcolor: alpha(colorMain, 0.1),
                          color: colorMain,
                          border: '1px solid',
                          borderColor: alpha(colorMain, 0.2)
                        }}
                      />
                      {lote.id_ganador && (
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mt={0.5}>
                          <WinnerIcon sx={{ fontSize: 12, color: 'warning.main' }} />
                          <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ fontSize: '0.65rem' }}>
                            ADJUDICADO
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info adicional */}
      <Alert
        severity="info"
        icon={<SubastaIcon />}
        sx={{ mt: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2) }}
      >
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Estados de Subasta:
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box><Typography variant="caption" display="block">🟠 <strong>Pendiente:</strong> Aún no inicia (Fecha futura).</Typography></Box>
          <Box><Typography variant="caption" display="block">🟢 <strong>Activa:</strong> En curso (Recibe pujas).</Typography></Box>
          <Box><Typography variant="caption" display="block">🔴 <strong>Finalizada:</strong> Cierre cumplido o forzado.</Typography></Box>
        </Stack>
      </Alert>
    </Box>
  );
};

export default ProyectoLotesManager;
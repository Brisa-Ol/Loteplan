import {
  CalendarToday as DateIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  CircularProgress,
  Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import CuotaMensualService from '../../../../../core/api/services/cuotaMensual.service';
import type { CuotaMensualDto } from '../../../../../core/types/dto/cuotaMensual.dto';
import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración global

interface Props {
  proyectoId: number;
}

const ProyectoPriceHistory: React.FC<Props> = ({ proyectoId }) => {
  const theme = useTheme();

  const { data: historial = [], isLoading, error } = useQuery<CuotaMensualDto[]>({
    queryKey: ['cuotasByProyecto', proyectoId],
    queryFn: async () => {
      try {
        const res = await CuotaMensualService.getByProjectId(proyectoId);
        return res.data.cuotas || [];
      } catch (err: any) {
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    retry: false,
    staleTime: env.queryStaleTime || 30000, // 👈 2. Aplicamos la caché global
  });

  // Estilos de Cabecera (Consistente con ProyectoSuscripciones)
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

  if (isLoading) return (
    <Box display="flex" justifyContent="center" p={3}>
      <CircularProgress size={24} thickness={4} />
    </Box>
  );

  if (error) return (
    <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: 2 }}>
      Error al cargar historial: {(error as any).message || 'Error desconocido'}
    </Alert>
  );

  if (historial.length === 0) {
    return (
      <Alert
        severity="info"
        variant="outlined"
        sx={{
          mt: 2,
          borderRadius: 2,
          borderStyle: 'dashed',
          bgcolor: alpha(theme.palette.info.main, 0.05)
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          No hay historial disponible
        </Typography>
        <Typography variant="body2">
          El historial de precios se generará automáticamente cuando se configure la primera cuota.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box mt={3}>
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5} display="flex" alignItems="center" gap={1}>
        <HistoryIcon fontSize="small" /> HISTORIAL DE ACTUALIZACIONES
      </Typography>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          maxHeight: 300,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <DateIcon fontSize="inherit" /> Fecha
                </Box>
              </TableCell>
              <TableCell sx={headerSx}>Valor Unidad</TableCell>
              <TableCell sx={headerSx}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <MoneyIcon fontSize="inherit" /> Cuota Final
                </Box>
              </TableCell>
              <TableCell align="right" sx={headerSx}>
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                  <PercentIcon fontSize="inherit" /> Admin
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.map((cuota) => (
              <TableRow
                key={cuota.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ color: 'text.secondary' }}>
                  {/* 👈 3. Aplicamos Locale Global a la fecha */}
                  {new Date(cuota.createdAt).toLocaleDateString(env.defaultLocale)}
                </TableCell>

                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {/* 👈 4. Aplicamos Locale Global a la moneda */}
                  ${Number(cuota.valor_cemento).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
                </TableCell>

                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: 'monospace' }}>
                  {/* 👈 5. Aplicamos Locale Global a la moneda */}
                  ${Number(cuota.valor_mensual_final).toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
                </TableCell>

                <TableCell align="right">
                  <Box
                    component="span"
                    sx={{
                      px: 1, py: 0.2,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  >
                    {cuota.porcentaje_administrativo}%
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProyectoPriceHistory;
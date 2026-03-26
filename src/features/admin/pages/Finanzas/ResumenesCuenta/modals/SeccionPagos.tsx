// modals/sections/HistorialPagosPanel.tsx

import type { PagoDto } from '@/core/types/pago.dto';
import { ExpandLess, ExpandMore, TaskAlt } from '@mui/icons-material';
import { alpha, Badge, Box, Chip, CircularProgress, Collapse, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  show: boolean;
  onToggle: () => void;
  isLoading: boolean;
  pagos: PagoDto[];
}

export const HistorialPagosPanel: React.FC<Props> = ({ show, onToggle, isLoading, pagos }) => {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.disabledBackground, 0.08), border: '1px solid', borderColor: alpha(theme.palette.divider, 0.3), overflow: 'hidden' }}>
      <Box onClick={onToggle} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.05) } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Badge badgeContent={pagos.length} color="success">
            <TaskAlt color="success" fontSize="small" />
          </Badge>
          <Typography variant="subtitle2" fontWeight={900}>HISTORIAL DE CUOTAS PAGADAS</Typography>
        </Stack>
        {show ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={show}>
        <Box sx={{ bgcolor: 'background.paper', p: 1, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} color="success" /></Box>
          ) : pagos.length === 0 ? (
            <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>No hay cuotas pagadas todavía.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.05) }}>
                  {['MES', 'MONTO', 'VENCIMIENTO', 'FECHA DE PAGO', 'ESTADO'].map((h, i) => (
                    <TableCell key={h} align={i === 4 ? 'right' : 'left'} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>#{pago.mes}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.primary" fontWeight={800}>
                        {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={pago.estado_pago?.toUpperCase().replace('_', ' ')} size="small" color="success"
                        variant={pago.estado_pago === 'forzado' ? 'outlined' : 'filled'}
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
// modals/sections/PendingPaymentsPanel.tsx

import type { PagoDto } from '@/core/types/pago.dto';
import { AttachMoney, Check as CheckIcon, Close as CloseIcon, Edit as EditIcon, ExpandLess, ExpandMore, FastForward, Schedule } from '@mui/icons-material';
import { alpha, Badge, Box, Chip, CircularProgress, Collapse, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import type { UseMutationResult } from '@tanstack/react-query';
import React from 'react';

interface Props {
  show: boolean;
  onToggle: () => void;
  isLoading: boolean;
  pagos: PagoDto[];
  editingPaymentId: number | null;
  newMonto: number;
  setNewMonto: (v: number) => void;
  setEditingPaymentId: (id: number | null) => void;
  updateMontoMutation: UseMutationResult<any, any, { pagoId: number; monto: number }>;
  onForcePayment: (pago: PagoDto) => void;
}

export const PendingPaymentsPanel: React.FC<Props> = ({
  show, onToggle, isLoading, pagos,
  editingPaymentId, newMonto, setNewMonto, setEditingPaymentId,
  updateMontoMutation, onForcePayment,
}) => {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.disabledBackground, 0.08), border: '1px solid', borderColor: alpha(theme.palette.divider, 0.3), overflow: 'hidden' }}>
      <Box onClick={onToggle} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.action.disabledBackground, 0.05) } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Badge badgeContent={pagos.length} color="warning">
            <Schedule color="primary" fontSize="small" />
          </Badge>
          <Typography variant="subtitle2" fontWeight={900}>CRONOGRAMA DE CUOTAS POR COBRAR</Typography>
        </Stack>
        {show ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={show}>
        <Box sx={{ bgcolor: 'background.paper', p: 1, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
          ) : pagos.length === 0 ? (
            <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>No hay cuotas pendientes.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.05) }}>
                  {['MES', 'MONTO', 'VENCIMIENTO', 'ESTADO', 'ACCIONES'].map((h, i) => (
                    <TableCell key={h} align={i === 4 ? 'right' : 'left'} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => {
                  const esAdelanto = new Date(pago.fecha_vencimiento) > new Date();
                  const isPagable = ['pendiente', 'vencido'].includes(pago.estado_pago);
                  const isEditing = editingPaymentId === pago.id;

                  return (
                    <TableRow key={pago.id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>#{pago.mes}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField type="number" size="small" autoFocus value={newMonto}
                            onChange={(e) => setNewMonto(Number(e.target.value))}
                            sx={{ width: 110, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                            ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={pago.estado_pago?.toUpperCase()} size="small"
                            color={pago.estado_pago === 'vencido' ? 'error' : 'warning'}
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                          />
                          {esAdelanto && (
                            <Chip icon={<FastForward style={{ fontSize: 10 }} />} label="ADELANTO" size="small"
                              color="info" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" color="success" onClick={() => updateMontoMutation.mutate({ pagoId: pago.id, monto: newMonto })}><CheckIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => setEditingPaymentId(null)}><CloseIcon fontSize="small" /></IconButton>
                          </Stack>
                        ) : isPagable ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Forzar Pago Manual">
                              <IconButton size="small" color="warning" onClick={() => onForcePayment(pago)} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
                                <AttachMoney fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar Monto">
                              <IconButton size="small" onClick={() => { setEditingPaymentId(pago.id); setNewMonto(Number(pago.monto)); }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
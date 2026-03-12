// src/features/admin/pages/Suscripciones/modals/sections/PendingPaymentsSection.tsx

import type { PagoDto } from '@/core/types/pago.dto';
import { Check as CheckIcon, Close as CloseIcon, Edit as EditIcon, ExpandLess, ExpandMore, Receipt } from '@mui/icons-material';
import {
  alpha, Box, Chip, CircularProgress, Collapse, Divider,
  IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography, useTheme,
} from '@mui/material';
import React from 'react';
import type { UseMutationResult } from '@tanstack/react-query';

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
}

const PendingPaymentsSection: React.FC<Props> = ({
  show, onToggle, isLoading, pagos,
  editingPaymentId, newMonto, setNewMonto, setEditingPaymentId, updateMontoMutation,
}) => {
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box onClick={onToggle} sx={{
        p: 2, display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Receipt color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={900}>CRONOGRAMA DE CUOTAS PENDIENTES</Typography>
        </Stack>
        {show ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={show}>
        <Divider />
        <Box sx={{ p: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
          ) : pagos.length === 0 ? (
            <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>
              No hay cuotas pendientes de cobro.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>MES</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>MONTO</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>ESTADO</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>#{pago.mes}</TableCell>
                    <TableCell>
                      {editingPaymentId === pago.id ? (
                        <TextField
                          type="number" size="small" autoFocus value={newMonto}
                          onChange={(e) => setNewMonto(Number(e.target.value))}
                          sx={{ width: 110, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.85rem' } }}
                        />
                      ) : (
                        <Typography variant="body2" fontWeight={600}>
                          ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={pago.estado_pago} size="small"
                        color={pago.estado_pago === 'vencido' ? 'error' : 'warning'}
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editingPaymentId === pago.id ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" color="success" onClick={() => updateMontoMutation.mutate({ pagoId: pago.id, monto: newMonto })}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setEditingPaymentId(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <IconButton size="small" onClick={() => { setEditingPaymentId(pago.id); setNewMonto(Number(pago.monto)); }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
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

export default PendingPaymentsSection;
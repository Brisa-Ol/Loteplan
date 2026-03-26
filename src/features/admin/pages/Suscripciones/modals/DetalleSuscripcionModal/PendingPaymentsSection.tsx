// src/features/admin/pages/Suscripciones/modals/sections/PendingPaymentsSection.tsx

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { AttachMoney, Check as CheckIcon, Close as CloseIcon, Edit as EditIcon, ExpandLess, ExpandMore, Receipt } from '@mui/icons-material';
import {
  alpha, Box, Chip, CircularProgress, Collapse, Divider,
  IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography, useTheme,
} from '@mui/material';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import React, { useState } from 'react';

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
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // 🆕 Estados para el modal de Forzar Pago
  const [forcePaymentModalOpen, setForcePaymentModalOpen] = useState(false);
  const [selectedPagoToForce, setSelectedPagoToForce] = useState<PagoDto | null>(null);
  const [forceMotivo, setForceMotivo] = useState('');

  // 🆕 Mutación para forzar pago
  const forcePaymentMutation = useMutation({
    mutationFn: (data: { idPago: number; motivo: string }) => 
      PagoService.updatePaymentStatus(data.idPago, { estado_pago: 'forzado', motivo: data.motivo }),
    onSuccess: () => {
      showSuccess('Cobro forzado registrado exitosamente.');
      handleCloseForcePaymentModal();
      // Invalidar queries relevantes para que la tabla se actualice
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['pagosPendientesSuscripcion'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || 'No se pudo forzar el pago');
    },
  });

  const handleOpenForcePaymentModal = (pago: PagoDto) => {
    setSelectedPagoToForce(pago);
    setForceMotivo('');
    setForcePaymentModalOpen(true);
  };

  const handleCloseForcePaymentModal = () => {
    setForcePaymentModalOpen(false);
    setSelectedPagoToForce(null);
    setForceMotivo('');
  };

  const handleSubmitForcePayment = () => {
    if (selectedPagoToForce && forceMotivo.trim()) {
      forcePaymentMutation.mutate({ idPago: selectedPagoToForce.id, motivo: forceMotivo });
    }
  };

  return (
    <>
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
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>ACCIONES</TableCell>
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
                        <Chip label={pago.estado_pago?.toUpperCase()} size="small"
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
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {/* 🆕 Botón de forzar pago */}
                            {['pendiente', 'vencido'].includes(pago.estado_pago) && (
                              <Tooltip title="Forzar Pago Manual">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleOpenForcePaymentModal(pago)}
                                  sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08) }}
                                >
                                  <AttachMoney fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* Botón de editar monto original */}
                            <IconButton size="small" onClick={() => { setEditingPaymentId(pago.id); setNewMonto(Number(pago.monto)); }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
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

      {/* 🆕 MODAL CUSTOM PARA FORZAR PAGO */}
      <BaseModal
        open={forcePaymentModalOpen}
        onClose={handleCloseForcePaymentModal}
        title="Forzar Pago Manual"
        icon={<AttachMoney />}
        headerColor="warning"
        maxWidth="sm"
        confirmText="Confirmar Cobro"
        onConfirm={handleSubmitForcePayment}
        isLoading={forcePaymentMutation.isPending}
        disableConfirm={!forceMotivo.trim()}
        confirmButtonColor="warning"
      >
        <Box>
          <Typography variant="body2" mb={3} color="text.secondary">
            Estás a punto de registrar un cobro administrativo para la cuota <b>#{selectedPagoToForce?.mes}</b> por <b>${Number(selectedPagoToForce?.monto).toLocaleString('es-AR')}</b>. 
            El estado de esta cuota pasará a <b>FORZADO</b>.
          </Typography>
          
          <TextField
            autoFocus
            label="Motivo o Referencia (Obligatorio)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={forceMotivo}
            onChange={(e) => setForceMotivo(e.target.value)}
            placeholder="Ej: Pago recibido en efectivo en oficina central"
            helperText="Indica el motivo por el cual estás forzando el pago en el sistema."
          />
        </Box>
      </BaseModal>
    </>
  );
};

export default PendingPaymentsSection;
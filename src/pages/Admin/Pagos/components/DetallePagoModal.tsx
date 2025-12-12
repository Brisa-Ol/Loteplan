// src/pages/Admin/Pagos/modals/DetallePagoModal.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider, CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Event,
  Person,
  AccountBalance,
  CheckCircle,
  Payment,
  DeleteForever
} from '@mui/icons-material';
import type { PagoDto } from '../../../../types/dto/pago.dto';
import PagoService from '../../../../Services/pago.service';


interface Props {
  open: boolean;
  onClose: () => void;
  pago: PagoDto | null;
  userName?: string;
  projectName?: string;
  onUpdate: () => void;
}

const DetallePagoModal: React.FC<Props> = ({ open, onClose, pago, userName, projectName, onUpdate }) => {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!pago) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'success';
      case 'cubierto_por_puja': return 'success';
      case 'pendiente': return 'warning';
      case 'vencido': return 'error';
      case 'cancelado': return 'default';
      default: return 'default';
    }
  };

  // Acción 1: Marcar como pagado (PUT /:id)
  const handleMarkAsPaid = async () => {
    if (!window.confirm('¿Confirmas marcar este pago como PAGADO manualmente?')) return;

    setLoadingAction(true);
    try {
      // ✅ Generar fecha local (evita problemas de timezone)
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      await PagoService.update(pago.id, {
        estado_pago: 'pagado',
        fecha_pago: localDate  // Formato: YYYY-MM-DD en timezone local
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Acción 2: Eliminar/Anular pago (DELETE /:id) - Funcionalidad soportada por tu Back
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de ELIMINAR este registro de pago? Esta acción no se puede deshacer fácilmente.')) return;

    setLoadingAction(true);
    try {
      await PagoService.softDelete(pago.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el pago.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Payment color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Detalle de Pago #{pago.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>

          {/* SECCIÓN 1: DATOS FINANCIEROS */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Monto de la Cuota</Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="primary.dark">
                  Cuota Mes #{pago.mes}
                </Typography>
              </Box>
              <Box>
                <Chip
                  label={pago.estado_pago.toUpperCase().replace('_', ' ')}
                  color={getStatusColor(pago.estado_pago)}
                  sx={{ fontWeight: 'bold', px: 2, height: 32 }}
                />
              </Box>
            </Stack>
          </Paper>

          {/* SECCIÓN 2: INFORMACIÓN CONTEXTUAL */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Person color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Usuario</Typography>
              </Stack>
              <Typography variant="body1" fontWeight={500}>
                {userName || `Usuario ID: ${pago.id_usuario}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID Sistema: {pago.id_usuario}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AccountBalance color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Origen</Typography>
              </Stack>
              <Typography variant="body1" fontWeight={500}>
                {projectName || `Proyecto ID: ${pago.id_proyecto}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Suscripción ID: #{pago.id_suscripcion}
              </Typography>
            </Paper>
          </Box>

          {/* SECCIÓN 3: FECHAS */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Event color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">Cronología</Typography>
            </Stack>
            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Vencimiento</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha de Pago</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : '-'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {/* Botón de Eliminar (Izquierda) */}
        <Button
          onClick={handleDelete}
          color="error"
          disabled={loadingAction}
          startIcon={<DeleteForever />}
        >
          Eliminar
        </Button>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="inherit" disabled={loadingAction}>
            Cerrar
          </Button>
          {/* Botón de Marcar Pagado (Derecha, solo si no está pagado) */}
          {['pendiente', 'vencido'].includes(pago.estado_pago) && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkAsPaid}
              disabled={loadingAction}
              startIcon={loadingAction ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            >
              Marcar como Pagado
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default DetallePagoModal;
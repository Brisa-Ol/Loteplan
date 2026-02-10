// src/pages/Admin/Pagos/modals/DetallePagoModal.tsx

import React, { useState } from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, Button, CircularProgress, useTheme, alpha
} from '@mui/material';
import {
  Person, AccountBalance, CheckCircle, Payment, DeleteForever, CalendarToday
} from '@mui/icons-material';
import type { PagoDto } from '../../../../../../core/types/dto/pago.dto';
import PagoService from '../../../../../../core/api/services/pago.service';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  pago: PagoDto | null;
  userName?: string;
  projectName?: string;
  onUpdate: () => void;
}

const DetallePagoModal: React.FC<Props> = ({ open, onClose, pago, userName, projectName, onUpdate }) => {
  const theme = useTheme();
  const [loadingAction, setLoadingAction] = useState(false);

  if (!pago) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
      case 'cubierto_por_puja': return 'success';
      case 'pendiente': return 'warning';
      case 'vencido': return 'error';
      default: return 'primary';
    }
  };

  const statusColor = getStatusColor(pago.estado_pago);
  const themeColor = (theme.palette as any)[statusColor];

  const handleMarkAsPaid = async () => {
    if (!window.confirm('¿Confirmas marcar este pago como PAGADO manualmente?')) return;
    setLoadingAction(true);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await PagoService.update(pago.id, { estado_pago: 'pagado', fecha_pago: localDate });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de ELIMINAR este registro? Esta acción no se puede deshacer.')) return;
    setLoadingAction(true);
    try {
      await PagoService.softDelete(pago.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Detalle de Pago #${pago.id}`}
      subtitle="Gestión manual de cuota"
      icon={<Payment />}
      headerColor="primary"
      maxWidth="md"
      isLoading={loadingAction}
      customActions={
        <>
          {/* Acción destructiva a la izquierda */}
          <Button
            onClick={handleDelete}
            variant="outlined"
            color="error"
            disabled={loadingAction}
            startIcon={<DeleteForever />}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 'auto' }}
          >
            Eliminar
          </Button>

          <Button onClick={onClose} color="inherit" disabled={loadingAction} sx={{ borderRadius: 2 }}>
            Cerrar
          </Button>

          {['pendiente', 'vencido'].includes(pago.estado_pago) && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkAsPaid}
              disabled={loadingAction}
              startIcon={loadingAction ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
              sx={{ borderRadius: 2, fontWeight: 700, color: 'white', px: 3 }}
            >
              Marcar como Pagado
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={3}>
        {/* SECCIÓN 1: DATOS FINANCIEROS */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5, borderRadius: 2, border: '1px solid',
            borderColor: alpha(themeColor.main, 0.3),
            bgcolor: alpha(themeColor.main, 0.04)
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>MONTO DE LA CUOTA</Typography>
              <Typography variant="h3" fontWeight={800} color={themeColor.main} sx={{ my: 0.5 }}>
                ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ bgcolor: alpha(themeColor.main, 0.1), px: 1, py: 0.5, borderRadius: 1 }}>
                Cuota Mes #{pago.mes}
              </Typography>
            </Box>
            <Chip
              label={pago.estado_pago.toUpperCase().replace('_', ' ')}
              color={statusColor as any}
              sx={{ fontWeight: 'bold', px: 2 }}
            />
          </Stack>
        </Paper>

        {/* SECCIÓN 2: INFORMACIÓN CONTEXTUAL */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>USUARIO</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Nombre / ID</Typography>
            <Typography variant="body1" fontWeight={600} noWrap>{userName || `ID: ${pago.id_usuario}`}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>ID Sistema: #{pago.id_usuario}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AccountBalance color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>ORIGEN</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Proyecto</Typography>
            <Typography variant="body1" fontWeight={600} noWrap>{projectName || `ID: ${pago.id_proyecto}`}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>Suscripción: #{pago.id_suscripcion}</Typography>
          </Paper>
        </Stack>

        {/* SECCIÓN 3: FECHAS */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <CalendarToday color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800}>CRONOLOGÍA</Typography>
          </Stack>
          <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="caption" color="text.secondary">Vencimiento</Typography>
              <Typography variant="body1" fontWeight={600} color="error.main">
                {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha de Pago</Typography>
              <Typography variant="body1" fontWeight={600} color="success.main">
                {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : 'Pendiente'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </BaseModal>
  );
};

export default DetallePagoModal;
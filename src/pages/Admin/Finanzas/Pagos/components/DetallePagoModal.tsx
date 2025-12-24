// src/pages/Admin/Pagos/modals/DetallePagoModal.tsx

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider, CircularProgress,
  useTheme, alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Event,
  Person,
  AccountBalance,
  CheckCircle,
  Payment,
  DeleteForever,
  CalendarToday
} from '@mui/icons-material';
import type { PagoDto } from '../../../../../types/dto/pago.dto';
import PagoService from '../../../../../Services/pago.service';

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
      case 'pagado': return 'success';
      case 'cubierto_por_puja': return 'success';
      case 'pendiente': return 'warning';
      case 'vencido': return 'error';
      case 'cancelado': return 'default';
      default: return 'default';
    }
  };

  const statusColor = getStatusColor(pago.estado_pago);
  const themeColor = (theme.palette as any)[statusColor !== 'default' ? statusColor : 'primary'];

  // Acción 1: Marcar como pagado (PUT /:id)
  const handleMarkAsPaid = async () => {
    if (!window.confirm('¿Confirmas marcar este pago como PAGADO manualmente?')) return;

    setLoadingAction(true);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      await PagoService.update(pago.id, {
        estado_pago: 'pagado',
        fecha_pago: localDate 
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

  // Acción 2: Eliminar/Anular pago (DELETE /:id)
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
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', p: 1, borderRadius: '50%', display: 'flex' }}>
                <Payment fontSize="small" />
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Detalle de Pago #{pago.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Gestión manual de cuota
                </Typography>
            </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), p: 4 }}>
        <Stack spacing={3}>

          {/* SECCIÓN 1: DATOS FINANCIEROS */}
          <Paper 
            elevation={0}
            sx={{ 
                p: 2.5, borderRadius: 2, 
                border: '1px solid', 
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
                variant="filled"
                sx={{ fontWeight: 'bold', px: 2, height: 32 }}
              />
            </Stack>
          </Paper>

          {/* SECCIÓN 2: INFORMACIÓN CONTEXTUAL */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Person color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>USUARIO</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nombre / ID</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {userName || `Usuario ID: ${pago.id_usuario}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ID Sistema</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        #{pago.id_usuario}
                    </Typography>
                  </Box>
              </Stack>
            </Paper>

            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, p: 2.5, borderRadius: 2, 
                    border: '1px solid', borderColor: 'divider' 
                }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AccountBalance color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>ORIGEN</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Proyecto Asociado</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {projectName || `Proyecto ID: ${pago.id_proyecto}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Suscripción ID</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        #{pago.id_suscripcion}
                    </Typography>
                  </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* SECCIÓN 3: FECHAS */}
          <Paper 
            elevation={0}
            sx={{ 
                p: 2.5, borderRadius: 2, 
                border: '1px solid', borderColor: 'divider' 
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">CRONOLOGÍA</Typography>
            </Stack>
            
            <Stack 
                direction="row" 
                spacing={4} 
                divider={<Divider orientation="vertical" flexItem />}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Vencimiento</Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  {new Date(pago.fecha_vencimiento).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha de Pago</Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : '-'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>
      
      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: 'space-between', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        {/* Botón de Eliminar (Izquierda) */}
        <Button
          onClick={handleDelete}
          variant="outlined"
          color="error"
          disabled={loadingAction}
          startIcon={<DeleteForever />}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Eliminar
        </Button>

        <Stack direction="row" spacing={2}>
          <Button onClick={onClose} color="inherit" disabled={loadingAction} sx={{ borderRadius: 2 }}>
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
              sx={{ borderRadius: 2, fontWeight: 700, color: 'white', px: 3 }}
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
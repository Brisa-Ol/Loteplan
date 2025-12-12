// src/pages/Admin/Cancelaciones/modals/DetalleCancelacionModal.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Chip, Stack, Paper, IconButton, Box, Divider
} from '@mui/material';
import { 
  Close as CloseIcon,
  MoneyOff,
  Person,
  Business,
  CalendarToday,
  AttachMoney
} from '@mui/icons-material';
import type { SuscripcionCanceladaDto } from '../../../../types/dto/suscripcion.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  cancelacion: SuscripcionCanceladaDto | null;
}

const DetalleCancelacionModal: React.FC<Props> = ({ open, onClose, cancelacion }) => {

  if (!cancelacion) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MoneyOff color="error" />
          <Typography variant="h6" fontWeight="bold">
            Cancelación #{cancelacion.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          {/* SECCIÓN 1: KPI PRINCIPAL (Monto a Liquidar) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'error.50', borderColor: 'error.200' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Monto Total Pagado (A Liquidar)</Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  ${Number(cancelacion.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="error.dark">
                  *Este monto debe ser gestionado según la política de devolución.
                </Typography>
              </Box>
              <Chip 
                label="CANCELADO" 
                color="error" 
                sx={{ fontWeight: 'bold', px: 2 }}
              />
            </Stack>
          </Paper>

          {/* CONTENEDOR FLEX: Usuario y Proyecto */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 2 
          }}>
            
            {/* SECCIÓN 2: Usuario */}
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Person color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Ex-Suscriptor</Typography>
              </Stack>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Usuario</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cancelacion.usuario ? `${cancelacion.usuario.nombre} ${cancelacion.usuario.apellido}` : `ID Usuario: ${cancelacion.id_usuario}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                     {cancelacion.usuario?.email || '-'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* SECCIÓN 3: Proyecto */}
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Business color="action" />
                <Typography variant="subtitle2" fontWeight="bold">Proyecto Origen</Typography>
              </Stack>
              <Stack spacing={1}>
                  <Box>
                  <Typography variant="caption" color="text.secondary">Proyecto</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cancelacion.proyecto?.nombre_proyecto || `ID Proyecto: ${cancelacion.id_proyecto}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Suscripción Original ID</Typography>
                  <Typography variant="body2" color="text.secondary">#{cancelacion.id_suscripcion_original}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* SECCIÓN 4: Detalles Técnicos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">Detalles de la Baja</Typography>
            </Stack>
            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha Cancelación</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(cancelacion.fecha_cancelacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Meses Abonados</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {cancelacion.meses_pagados} meses
                </Typography>
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleCancelacionModal;
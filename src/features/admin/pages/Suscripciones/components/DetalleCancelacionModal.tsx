// src/pages/Admin/Suscripciones/modals/DetalleCancelacionModal.tsx

import React from 'react';
import { Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha } from '@mui/material';
import { MoneyOff, Person, Business, CalendarToday } from '@mui/icons-material';
import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  cancelacion: SuscripcionCanceladaDto | null;
}

const DetalleCancelacionModal: React.FC<Props> = ({ open, onClose, cancelacion }) => {
  const theme = useTheme();
  if (!cancelacion) return null;

  return (
    <BaseModal open={open} onClose={onClose} title="Baja de Suscripción" icon={<MoneyOff />} headerColor="error" maxWidth="md" hideConfirmButton cancelText="Cerrar">
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.04), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>MONTO TOTAL A LIQUIDAR</Typography>
          <Typography variant="h3" fontWeight={900} color="error.main">
            ${Number(cancelacion.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Typography>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={800} mb={1} color="primary">DATOS EX-TITULAR</Typography>
            <Typography variant="body2" fontWeight={700}>{cancelacion.usuarioCancelador?.nombre} {cancelacion.usuarioCancelador?.apellido}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">{cancelacion.usuarioCancelador?.email}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={800} mb={1} color="primary">PROYECTO ORIGEN</Typography>
            <Typography variant="body2" fontWeight={700}>{cancelacion.proyectoCancelado?.nombre_proyecto}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">REF Original: #{cancelacion.id_suscripcion_original}</Typography>
          </Paper>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Fecha Cancelación</Typography>
                    <Typography variant="body2" fontWeight={700}>{new Date(cancelacion.fecha_cancelacion).toLocaleDateString('es-AR')}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Meses Pagados</Typography>
                    <Typography variant="body2" fontWeight={700}>{cancelacion.meses_pagados} meses</Typography>
                </Box>
            </Stack>
        </Paper>
      </Stack>
    </BaseModal>
  );
};

export default DetalleCancelacionModal;
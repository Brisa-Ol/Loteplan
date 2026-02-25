// src/pages/Admin/Suscripciones/modals/DetalleCancelacionModal.tsx

import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';
import { MoneyOff, ReceiptLong, EventBusy } from '@mui/icons-material';
import { alpha, Box, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  cancelacion: SuscripcionCanceladaDto | null;
}

const DetalleCancelacionModal: React.FC<Props> = ({ open, onClose, cancelacion }) => {
  const theme = useTheme();
  if (!cancelacion) return null;

  return (
    <BaseModal 
        open={open} onClose={onClose} 
        title="Baja de Suscripción" 
        icon={<MoneyOff />} 
        headerColor="error" maxWidth="md" hideConfirmButton cancelText="Cerrar"
    >
      <Stack spacing={3}>
        
        {/* BLOQUE 1: Datos Financieros de la Baja */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {/* Monto devuelto / liquidado */}
            <Paper elevation={0} sx={{ flex: 2, p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.04), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>MONTO TOTAL A LIQUIDAR (DEVOLUCIÓN)</Typography>
            <Typography variant="h3" fontWeight={900} color="error.main" sx={{ fontFamily: 'monospace' }}>
                ${Number(cancelacion.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
            </Paper>

            {/* Comparativa con Suscripcion Original */}
            {cancelacion.suscripcionOriginal && (
                <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Stack spacing={1} alignItems="center" textAlign="center" height="100%" justifyContent="center">
                        <ReceiptLong color="action" />
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">PAGADO ORIGINALMENTE</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                            ${Number(cancelacion.suscripcionOriginal.monto_total_pagado).toLocaleString('es-AR')}
                        </Typography>
                    </Stack>
                </Paper>
            )}
        </Stack>

        {/* BLOQUE 2: Actores (Titular y Proyecto) */}
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

        {/* BLOQUE 3: Cronología */}
        <Paper elevation={0} sx={{ p: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <EventBusy color="error" fontSize="small" />
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Fecha Efectiva de Baja</Typography>
                    <Typography variant="body2" fontWeight={800}>{new Date(cancelacion.fecha_cancelacion).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
                </Box>
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Tiempo de Permanencia</Typography>
              <Typography variant="body2" fontWeight={800}>{cancelacion.meses_pagados} meses de aportes</Typography>
            </Box>
          </Stack>
        </Paper>
        
      </Stack>
    </BaseModal>
  );
};

export default DetalleCancelacionModal;
// src/pages/Admin/Suscripciones/modals/DetalleCancelacionModal.tsx

import React from 'react';
import { 
    MoneyOff, 
    ReceiptLong, 
    EventBusy, 
    Person, 
    Business, 
    AlternateEmail,
    History as HistoryIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import { 
    alpha, 
    Box, 
    Divider, 
    Paper, 
    Stack, 
    Typography, 
    useTheme, 
    Chip,
    Avatar
} from '@mui/material';

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

  const fullName = `${cancelacion.usuarioCancelador?.nombre} ${cancelacion.usuarioCancelador?.apellido}`;

  return (
    <BaseModal 
        open={open} 
        onClose={onClose} 
        title="Expediente de Baja" 
        subtitle={`Ex-Titular: ${fullName}`}
        icon={<MoneyOff />} 
        headerColor="error" 
        maxWidth="md" 
        hideConfirmButton 
        cancelText="Cerrar"
        headerExtra={
            <Chip 
                label="CONTRATO RESCINDIDO" 
                color="error" 
                sx={{ fontWeight: 900, borderRadius: 1.5, px: 1 }} 
            />
        }
    >
      <Stack spacing={3}>
        
        {/* BLOQUE 1: RESUMEN FINANCIERO DE LIQUIDACIÓN */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper 
                variant="outlined" 
                sx={{ 
                    flex: 2, p: 3, borderRadius: 4, 
                    bgcolor: alpha(theme.palette.error.main, 0.03), 
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, 
                    display: 'flex', flexDirection: 'column', justifyContent: 'center' 
                }}
            >
                <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1}>
                    MONTO TOTAL LIQUIDADO
                </Typography>
                <Typography variant="h3" fontWeight={900} color="error.main" sx={{ fontFamily: 'monospace', my: 1 }}>
                    ${Number(cancelacion.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.disabled" fontWeight={700}>
                    CÁLCULO FINAL BASADO EN APORTES REALIZADOS
                </Typography>
            </Paper>

            {cancelacion.suscripcionOriginal && (
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        flex: 1, p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.grey[500], 0.05),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                    }}
                >
                    <ReceiptLong sx={{ color: 'text.disabled', fontSize: 28, mb: 1 }} />
                    <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                        ${Number(cancelacion.suscripcionOriginal.monto_total_pagado).toLocaleString('es-AR')}
                    </Typography>
                    <Typography variant="caption" fontWeight={800} color="text.secondary">
                        TOTAL PAGADO <br/> ANTES DE LA BAJA
                    </Typography>
                </Paper>
            )}
        </Stack>

        {/* BLOQUE 2: ACTORES ASOCIADOS (SIN IDs) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 32, height: 32 }}>
                <Person fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={900}>EX-TITULAR DEL PLAN</Typography>
            </Stack>
            
            <Typography variant="body1" fontWeight={800}>{fullName}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                <AlternateEmail sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="body2" color="error.main" fontWeight={700}>
                    @{cancelacion.usuarioCancelador?.nombre_usuario || 'sin_username'}
                </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {cancelacion.usuarioCancelador?.email}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 32, height: 32 }}>
                <Business fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={900}>PROYECTO DESVINCULADO</Typography>
            </Stack>

            <Typography variant="body1" fontWeight={800}>{cancelacion.proyectoCancelado?.nombre_proyecto}</Typography>
            <Stack direction="row" spacing={1} mt={1}>
                <Chip 
                    label="MENSUAL" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} 
                />
                <Chip 
                    label="PROYECTO CERRADO" 
                    size="small" 
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'grey.200' }} 
                />
            </Stack>
          </Paper>
        </Stack>

        {/* BLOQUE 3: TRAZABILIDAD DE LA BAJA */}
        <Paper 
            variant="outlined" 
            sx={{ 
                p: 2.5, borderRadius: 3, border: '1px dashed', borderColor: 'divider', 
                bgcolor: alpha(theme.palette.background.default, 0.5) 
            }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={4} 
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.5 }} />}
          >
            <Stack direction="row" spacing={2} alignItems="center">
                <EventBusy color="error" />
                <Box>
                    <Typography variant="caption" color="text.disabled" display="block" fontWeight={800}>FECHA DE RESCISIÓN</Typography>
                    <Typography variant="body2" fontWeight={800}>
                        {new Date(cancelacion.fecha_cancelacion).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
                <HistoryIcon color="action" />
                <Box>
                    <Typography variant="caption" color="text.disabled" display="block" fontWeight={800}>PERMANENCIA TOTAL</Typography>
                    <Typography variant="body2" fontWeight={800}>{cancelacion.meses_pagados} Meses Aportados</Typography>
                </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* PIE DE AUDITORÍA INTERNA */}
        <Stack direction="row" spacing={3} sx={{ px: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <UpdateIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled" fontWeight={700}>
                    REGISTRO CREADO: {new Date(cancelacion.createdAt).toLocaleDateString('es-AR')}
                </Typography>
            </Stack>
        </Stack>
        
      </Stack>
    </BaseModal>
  );
};

export default DetalleCancelacionModal;
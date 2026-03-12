// src/features/admin/pages/Usuarios/modals/KycDetailModal.tsx

import type { KycDTO } from '@/core/types/kyc.dto';
import { BaseModal } from '@/shared';
import {
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  HighlightOff as RejectIcon,
} from '@mui/icons-material';
import { Box, Button, Chip, Divider, Stack } from '@mui/material';
import React, { useMemo } from 'react';
import KycDataColumn from './KycDataColumn';
import KycImagesColumn from './KycImagesColumn';


interface KycDetailModalProps {
  open: boolean;
  onClose: () => void;
  kyc: KycDTO | null;
  onApprove: (kyc: KycDTO) => void;
  onReject: (kyc: KycDTO) => void;
}

const STATUS_CONFIG = {
  APROBADA: { color: 'success' as const, label: 'APROBADA' },
  RECHAZADA: { color: 'error' as const, label: 'RECHAZADA' },
  PENDIENTE: { color: 'warning' as const, label: 'PENDIENTE' },
} as const;

const KycDetailModal: React.FC<KycDetailModalProps> = ({ open, onClose, kyc, onApprove, onReject }) => {
  const statusConfig = useMemo(() => (
    kyc ? (STATUS_CONFIG[kyc.estado_verificacion as keyof typeof STATUS_CONFIG] ?? { color: 'primary' as const, label: kyc.estado_verificacion })
      : { color: 'primary' as const, label: 'S/D' }
  ), [kyc]);

  if (!kyc) return null;

  const isPending = kyc.estado_verificacion === 'PENDIENTE';

  return (
    <BaseModal
      open={open} onClose={onClose}
      title={`Verificación KYC #${kyc.id}`}
      subtitle="Revisión de identidad y legitimidad de documentos"
      icon={<BadgeIcon />} headerColor={statusConfig.color} maxWidth="md"
      headerExtra={
        <Chip label={statusConfig.label} color={statusConfig.color}
          sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.7rem' }}
        />
      }
      customActions={
        <>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, px: 3 }}>Cerrar Expediente</Button>
          {isPending && (
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" color="error" startIcon={<RejectIcon />}
                onClick={() => onReject(kyc)} sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}
              >Rechazar</Button>
              <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
                onClick={() => onApprove(kyc)} sx={{ borderRadius: 2, px: 4, fontWeight: 900, color: 'white' }}
              >Aprobar Identidad</Button>
            </Stack>
          )}
        </>
      }
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }} spacing={4}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.6 }} />}
      >
        <Box sx={{ flex: 1 }}>
          <KycDataColumn kyc={kyc} isPending={isPending} />
        </Box>
        <KycImagesColumn kyc={kyc} />
      </Stack>
    </BaseModal>
  );
};

export default KycDetailModal;
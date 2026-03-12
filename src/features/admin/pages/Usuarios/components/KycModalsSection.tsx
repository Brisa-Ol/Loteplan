// src/features/admin/pages/Usuarios/components/KycModalsSection.tsx

import { BaseModal, ConfirmDialog } from '@/shared';
import { HighlightOff as RejectedIcon } from '@mui/icons-material';
import { Alert, Stack, TextField } from '@mui/material';
import React from 'react';
import type { useAdminKYC } from '../../../hooks/usuario/useAdminKYC';
import KycDetailModal from '../modals/KycDetailModal/KycDetailModal';

interface KycModalsSectionProps {
  logic: ReturnType<typeof useAdminKYC>;
}

const KycModalsSection: React.FC<KycModalsSectionProps> = ({ logic }) => (
  <>
    <KycDetailModal
      open={logic.detailsModal.isOpen}
      onClose={logic.detailsModal.close}
      kyc={logic.selectedKyc}
      onApprove={logic.handleApproveClick}
      onReject={logic.handleOpenRejectInput}
    />

    <ConfirmDialog
      controller={logic.confirmDialog}
      onConfirm={logic.handleConfirmApprove}
      isLoading={logic.isApproving}
    />

    <BaseModal
      open={logic.rejectModal.isOpen}
      onClose={logic.rejectModal.close}
      title="Rechazar Verificación"
      subtitle={`Usuario: ${logic.selectedKyc?.nombre_completo}`}
      icon={<RejectedIcon />}
      headerColor="error"
      confirmText="Confirmar Rechazo"
      confirmButtonColor="error"
      onConfirm={logic.handleConfirmReject}
      isLoading={logic.isRejecting}
      disableConfirm={!logic.rejectReason.trim()}
    >
      <Stack spacing={3}>
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
          Indique el motivo por el cual la documentación no es válida. El usuario recibirá esta notificación por correo electrónico.
        </Alert>
        <TextField
          fullWidth multiline rows={4}
          label="Motivo del rechazo"
          placeholder="Ej: El DNI está vencido o la selfie es borrosa..."
          value={logic.rejectReason}
          onChange={(e) => logic.setRejectReason(e.target.value)}
          autoFocus
        />
      </Stack>
    </BaseModal>
  </>
);

export default KycModalsSection;
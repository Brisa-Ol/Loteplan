// KycModalsSection.tsx

import React, { useRef, useCallback } from 'react';
import { BaseModal, ConfirmDialog } from '@/shared';
import { HighlightOff as RejectedIcon } from '@mui/icons-material';
import { Alert, Stack, TextField } from '@mui/material';
import type { useAdminKYC } from '../../../hooks/usuario/useAdminKYC';
import KycDetailModal from '../modals/KycDetailModal/KycDetailModal';

interface KycModalsSectionProps {
  logic: ReturnType<typeof useAdminKYC>;
}

const KycModalsSection: React.FC<KycModalsSectionProps> = ({ logic }) => {
  // Ref al nodo del textarea — el DOM maneja el valor, React no
  const reasonRef = useRef<HTMLInputElement>(null);

  // Valida y confirma leyendo del DOM directamente
  const handleConfirm = useCallback(() => {
    const motivo = reasonRef.current?.value ?? '';
    if (!motivo.trim()) return;
    logic.handleConfirmReject(motivo);
  }, [logic]);

  // Limpia el campo cuando el modal cierra
  const handleClose = useCallback(() => {
    if (reasonRef.current) reasonRef.current.value = '';
    logic.rejectModal.close();
  }, [logic.rejectModal]);

  return (
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
        onClose={handleClose}
        title="Rechazar Verificación"
        subtitle={`Usuario: ${logic.selectedKyc?.nombre_completo}`}
        icon={<RejectedIcon />}
        headerColor="error"
        confirmText="Confirmar Rechazo"
        confirmButtonColor="error"
        onConfirm={handleConfirm}
        isLoading={logic.isRejecting}
        // disableConfirm ya no puede depender del estado local sin re-renders
        // Opciones: siempre habilitado, o validar con un pequeño estado separado (ver nota)
        disableConfirm={false}
      >
        <Stack spacing={3}>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
            Indique el motivo por el cual la documentación no es válida.
            El usuario recibirá esta notificación por correo electrónico.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo del rechazo"
            placeholder="Ej: El DNI está vencido o la selfie es borrosa..."
            inputRef={reasonRef}   // ← inputRef, no value/onChange
            autoFocus
            defaultValue=""
          />
        </Stack>
      </BaseModal>
    </>
  );
};

export default KycModalsSection;
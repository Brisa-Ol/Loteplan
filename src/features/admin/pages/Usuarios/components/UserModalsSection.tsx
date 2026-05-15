import { ConfirmDialog } from '@/shared';
import { Block, CheckCircle } from '@mui/icons-material';
import React from 'react';
import type { useAdminUsuarios } from '../../../hooks/usuario/useAdminUsuarios';
import CreateUserModal from '../modals/CreateUserModal/CreateUserModal';
import EditUserModal from '../modals/EditUserModal/EditUserModal';
import ModalDetalleUsuario from '../modals/ModalDetalleUsuario/ModalDetalleUsuario';
import { ModalMotivoAdmin } from '../../Suscripciones/modals/ModalMotivoAdmin/ModalMotivoAdmin';

interface UserModalsSectionProps {
  logic: ReturnType<typeof useAdminUsuarios>;
}

const UserModalsSection: React.FC<UserModalsSectionProps> = ({ logic }) => {
  const pendingUser = logic.pendingToggleUser;
  const isActivating = pendingUser ? !pendingUser.activo : false; // false=activo→inactivo, true=inactivo→activo

  return (
    <>
      <CreateUserModal
        open={logic.createModal.isOpen}
        onClose={logic.createModal.close}
        onSubmit={(data) => logic.createMutation.mutateAsync(data)}
        isLoading={logic.createMutation.isPending}
      />

      <ModalDetalleUsuario
        open={logic.detailModal.isOpen}
        datosSeleccionados={logic.editingUser}
        onClose={() => { logic.detailModal.close(); logic.setEditingUser(null); }}
      />

      {logic.editingUser && (
        <EditUserModal
          open={logic.editModal.isOpen}
          user={logic.editingUser}
          onClose={() => { logic.editModal.close(); logic.setEditingUser(null); }}
          onSubmit={(id, data) => logic.updateMutation.mutateAsync({ id, data })}
          isLoading={logic.updateMutation.isPending}
        />
      )}

      {/* 🆕 Modal de motivo para cambio de estado desde la tabla */}
      <ModalMotivoAdmin
        open={logic.motivoModalOpen}
        onClose={() => {
          logic.setMotivoModalOpen(false);
          logic.setPendingToggleUser(null);
          logic.setMotivoToggle('');
        }}
        onConfirm={logic.handleConfirmToggle}
        isLoading={logic.toggleStatusMutation.isPending}
        title={isActivating ? 'Reactivar Cuenta' : 'Desactivar Cuenta'}
        icon={isActivating ? <CheckCircle /> : <Block />}
        headerColor={isActivating ? 'success' : 'error'}
        confirmText={isActivating ? 'Sí, Reactivar' : 'Sí, Desactivar'}
        confirmButtonColor={isActivating ? 'success' : 'error'}
        description={
          pendingUser && (
            <>
              Estás a punto de{' '}
              <b>{isActivating ? 'reactivar' : 'desactivar'}</b> la cuenta de{' '}
              <b>{pendingUser.nombre} {pendingUser.apellido}</b>{' '}
              (@{pendingUser.nombre_usuario}).
              {!isActivating && (
                <> El usuario será desconectado inmediatamente.</>
              )}
            </>
          )
        }
        motivo_cambio={logic.motivoToggle}
        onMotivoChange={logic.setMotivoToggle}
        motivoLabel="Motivo del cambio de estado (Obligatorio)"
        motivoPlaceholder={
          isActivating
            ? 'Ej: Cuenta reactivada por solicitud del titular con documentación verificada.'
            : 'Ej: Cuenta suspendida por incumplimiento de términos — Ticket #1234.'
        }
        motivoHelperText="Este motivo quedará registrado en el historial de cambios."
      />

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={() => logic.confirmDialog.data && logic.toggleStatusMutation.mutate(logic.confirmDialog.data)}
        isLoading={logic.toggleStatusMutation.isPending}
      />
    </>
  );
};

export default UserModalsSection;
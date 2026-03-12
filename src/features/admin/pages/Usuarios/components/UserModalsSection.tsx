// src/features/admin/pages/Usuarios/components/UserModalsSection.tsx

import { ConfirmDialog } from '@/shared';
import React from 'react';
import type { useAdminUsuarios } from '../../../hooks/usuario/useAdminUsuarios';
import CreateUserModal from '../modals/CreateUserModal/CreateUserModal';
import EditUserModal from '../modals/EditUserModal/EditUserModal';
import ModalDetalleUsuario from '../modals/ModalDetalleUsuario/ModalDetalleUsuario';

interface UserModalsSectionProps {
  logic: ReturnType<typeof useAdminUsuarios>;
}

const UserModalsSection: React.FC<UserModalsSectionProps> = ({ logic }) => (
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

    <ConfirmDialog
      controller={logic.confirmDialog}
      onConfirm={() => logic.confirmDialog.data && logic.toggleStatusMutation.mutate(logic.confirmDialog.data)}
      isLoading={logic.toggleStatusMutation.isPending}
    />
  </>
);

export default UserModalsSection;
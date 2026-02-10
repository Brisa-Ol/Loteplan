import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useModal } from '../../../shared/hooks/useModal';
import useSnackbar from '../../../shared/hooks/useSnackbar';

import UsuarioService from '../../../core/api/services/usuario.service';
import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../core/types/dto/usuario.dto';
import { useSortedData } from './useSortedData';

// ============================================================================
// HOOK DE DEBOUNCE OPTIMIZADO
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export const useAdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- MODALES ---
  const createModal = useModal();
  const editModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- QUERY ---
  const { data: usuariosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 30000,
    gcTime: 300000,
  });

  const { sortedData: usuariosOrdenados, highlightedId, triggerHighlight } = useSortedData(usuariosRaw);

  // --- HELPERS PARA MUTACIONES ---
  const setupOptimistic = async () => {
    await queryClient.cancelQueries({ queryKey: ['adminUsuarios'] });
    return queryClient.getQueryData<UsuarioDto[]>(['adminUsuarios']);
  };

  const rollbackOptimistic = (context: any) => {
    if (context?.previousUsuarios) {
      queryClient.setQueryData(['adminUsuarios'], context.previousUsuarios);
    }
  };

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      createModal.close();
      showSuccess('Usuario creado exitosamente');
      if (res.data?.id) triggerHighlight(res.data.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al crear usuario')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    onMutate: setupOptimistic,
    onError: (err: any, _, ctx) => {
      rollbackOptimistic(ctx);
      showError(err.response?.data?.message || 'Error al actualizar usuario');
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      editModal.close();
      setEditingUser(null);
      showSuccess('Usuario actualizado correctamente');
      triggerHighlight(vars.id);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: UsuarioDto) =>
      user.activo
        ? UsuarioService.update(user.id, { activo: false })
        : UsuarioService.reactivateAccount(user.id),
    onMutate: setupOptimistic,
    onError: (err: any, _, ctx) => {
      rollbackOptimistic(ctx);
      confirmDialog.close();
      showError(err.response?.data?.message || 'Error al cambiar estado');
    },
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      confirmDialog.close();
      showSuccess(`Usuario ${user.activo ? 'bloqueado' : 'reactivado'} correctamente`);
      triggerHighlight(user.id);
    }
  });

  // --- FILTRADO Y KPIS ---
  const filteredUsers = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return usuariosOrdenados.filter(u => {
      const matchesSearch = !term ||
        [u.nombre_usuario, u.email, u.nombre, u.apellido]
          .some(field => field?.toLowerCase().includes(term));
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? u.activo : !u.activo);
      return matchesSearch && matchesStatus;
    });
  }, [usuariosOrdenados, debouncedSearchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: usuariosRaw.length,
    activos: usuariosRaw.filter(u => u.activo).length,
    confirmados: usuariosRaw.filter(u => u.confirmado_email).length,
    con2FA: usuariosRaw.filter(u => u.is_2fa_enabled).length
  }), [usuariosRaw]);

  // --- HANDLERS ---
  const handleEditUser = useCallback((user: UsuarioDto) => {
    setEditingUser(user);
    editModal.open();
  }, [editModal]);

  const handleToggleStatusClick = useCallback((user: UsuarioDto) => {
    if (user.id === currentUser?.id) {
      return showError('No puedes bloquear tu propia cuenta.');
    }
    if (user.activo && user.rol === 'admin') {
      return showError('No se puede bloquear a un administrador.');
    }
    confirmDialog.confirm('toggle_user_status', user);
  }, [confirmDialog, currentUser, showError]);

  // --- RETURN OPTIMIZADO ---
  return {
    // Data & State
    users: filteredUsers,
    stats,
    isLoading,
    error,
    highlightedUserId: highlightedId,
    currentUser, // ✅ AGREGADO

    // Filters
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,

    // Edit State
    editingUser,
    setEditingUser,

    // Modals
    createModal, // ✅ AGREGADO
    editModal, // ✅ AGREGADO
    confirmDialog, // ✅ AGREGADO

    // Mutations
    createMutation,
    updateMutation,
    toggleStatusMutation, // ✅ AGREGADO

    // Handlers
    handleEditUser,
    handleToggleStatusClick,
  };
};
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../core/context/AuthContext';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';

import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../core/types/dto/usuario.dto';
import UsuarioService from '../../../core/api/services/usuario.service';
import { useSortedData } from './useSortedData';

// ============================================================================
// HOOK DE DEBOUNCE (Inline para búsqueda)
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
// HOOK PRINCIPAL - ULTRA OPTIMIZADO
// ============================================================================
export const useAdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES (CORREGIDO: Hooks llamados en nivel superior) ---
  const createModal = useModal();
  const editModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    create: createModal,
    edit: editModal,
    confirmDialog: confirmDialog
  }), [createModal, editModal, confirmDialog]);

  // --- ESTADOS LOCALES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);

  // ✨ DEBOUNCE del search term
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERY CON CACHE OPTIMIZADO ---
  const { data: usuariosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: usuariosOrdenados, highlightedId, triggerHighlight } = useSortedData(usuariosRaw);

  // --- FILTRADO OPTIMIZADO ---
  const filteredUsers = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    
    return usuariosOrdenados.filter(user => {
      // ✨ Short-circuit en búsqueda
      const matchesSearch = !term || (
        user.nombre_usuario.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term)
      );
      
      // ✨ Filtro por estado
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? user.activo : !user.activo;

      return matchesSearch && matchesStatus;
    });
  }, [usuariosOrdenados, debouncedSearchTerm, filterStatus]);

  // --- KPIS OPTIMIZADOS ---
  const stats = useMemo(() => ({
    total: usuariosRaw.length,
    activos: usuariosRaw.filter(u => u.activo).length,
    confirmados: usuariosRaw.filter(u => u.confirmado_email).length,
    con2FA: usuariosRaw.filter(u => u.is_2fa_enabled).length
  }), [usuariosRaw]);

  // --- MUTACIONES CON OPTIMISTIC UPDATES ---
  
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      modales.create.close();
      showSuccess('Usuario creado exitosamente');
      if (res.data?.id) triggerHighlight(res.data.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al crear usuario')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    // ✨ Optimistic Update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsuarios'] });
      const previousUsuarios = queryClient.getQueryData(['adminUsuarios']);
      
      queryClient.setQueryData(['adminUsuarios'], (old: UsuarioDto[] = []) => 
        old.map(u => u.id === id ? { ...u, ...data } : u)
      );
      
      return { previousUsuarios };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousUsuarios) {
        queryClient.setQueryData(['adminUsuarios'], context.previousUsuarios);
      }
      showError(err.response?.data?.message || 'Error al actualizar usuario');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      modales.edit.close();
      setEditingUser(null);
      showSuccess('Usuario actualizado correctamente');
      triggerHighlight(variables.id);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioDto) => {
      return usuario.activo 
        ? await UsuarioService.update(usuario.id, { activo: false })
        : await UsuarioService.reactivateAccount(usuario.id);
    },
    // ✨ Optimistic Update
    onMutate: async (usuario) => {
      await queryClient.cancelQueries({ queryKey: ['adminUsuarios'] });
      const previousUsuarios = queryClient.getQueryData(['adminUsuarios']);
      
      queryClient.setQueryData(['adminUsuarios'], (old: UsuarioDto[] = []) => 
        old.map(u => u.id === usuario.id ? { ...u, activo: !usuario.activo } : u)
      );
      
      return { previousUsuarios };
    },
    onError: (err: any, usuario, context) => {
      if (context?.previousUsuarios) {
        queryClient.setQueryData(['adminUsuarios'], context.previousUsuarios);
      }
      modales.confirmDialog.close();
      showError(err.response?.data?.message || 'Error al cambiar estado');
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      modales.confirmDialog.close();
      showSuccess(`Usuario ${usuario.activo ? 'bloqueado' : 'reactivado'} correctamente`);
      triggerHighlight(usuario.id);
    }
  });

  // --- HANDLERS (Callbacks estables) ---
  
  const handleEditUser = useCallback((user: UsuarioDto) => {
    setEditingUser(user);
    modales.edit.open();
  }, [modales.edit]);

  const handleToggleStatusClick = useCallback((usuario: UsuarioDto) => {
    if (usuario.id === currentUser?.id) {
      return showError('No puedes bloquear tu propia cuenta.');
    }
    if (usuario.activo && usuario.rol === 'admin') {
      return showError('No se puede bloquear a un administrador.');
    }
    modales.confirmDialog.confirm('toggle_user_status', usuario);
  }, [modales.confirmDialog, currentUser, showError]);

  return {
    // Data
    users: filteredUsers,
    stats,
    isLoading,
    error,
    currentUser,
    highlightedUserId: highlightedId,

    // State
    searchTerm, 
    setSearchTerm,
    filterStatus, 
    setFilterStatus,
    editingUser, 
    setEditingUser,
    
    // Modales
    createModal: modales.create,
    editModal: modales.edit,
    confirmDialog: modales.confirmDialog,
    
    // Mutations
    createMutation,
    updateMutation,
    toggleStatusMutation,
    
    // Handlers
    handleEditUser,
    handleToggleStatusClick
  };
};
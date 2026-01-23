import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../core/context/AuthContext';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';

import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../core/types/dto/usuario.dto';
import UsuarioService from '../../../core/api/services/usuario.service';
import { useSortedData } from './useSortedData';

export const useAdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // --- MODALES ---
  const createModal = useModal();
  const editModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);

  // --- QUERY ---
  const { data: usuariosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 1000 * 60 * 5, 
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT AUTOMÁTICO
  // Reemplazamos toda la lógica manual de refs y efectos por esto:
  const { sortedData: usuariosOrdenados, highlightedId, triggerHighlight } = useSortedData(usuariosRaw);

  // --- FILTRADO (Sobre la data ya ordenada) ---
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return usuariosOrdenados.filter(user => {
      const matchesSearch = 
        user.nombre_usuario.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term);
      
      const matchesStatus = filterStatus === 'all' ? true :
        filterStatus === 'active' ? user.activo : !user.activo;

      return matchesSearch && matchesStatus;
    });
  }, [usuariosOrdenados, searchTerm, filterStatus]);

  // --- KPIS ---
  const stats = useMemo(() => ({
    total: usuariosRaw.length,
    activos: usuariosRaw.filter(u => u.activo).length,
    confirmados: usuariosRaw.filter(u => u.confirmado_email).length,
    con2FA: usuariosRaw.filter(u => u.is_2fa_enabled).length
  }), [usuariosRaw]);

  // --- MUTACIONES ---
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      createModal.close();
      showSuccess('Usuario creado exitosamente');
      // ✨ Highlight Automático
      if (res.data?.id) triggerHighlight(res.data.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al crear usuario')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      editModal.close();
      setEditingUser(null);
      showSuccess('Usuario actualizado correctamente');
      // ✨ Highlight Automático
      triggerHighlight(variables.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al actualizar usuario')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioDto) => {
      return usuario.activo 
        ? await UsuarioService.update(usuario.id, { activo: false })
        : await UsuarioService.reactivateAccount(usuario.id);
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      confirmDialog.close();
      showSuccess(`Usuario ${usuario.activo ? 'bloqueado' : 'reactivado'} correctamente`);
      // ✨ Highlight Automático
      triggerHighlight(usuario.id);
    },
    onError: (err: any) => {
      confirmDialog.close();
      showError(err.response?.data?.message || 'Error al cambiar estado');
    }
  });

  // --- HANDLERS ---
  const handleEditUser = useCallback((user: UsuarioDto) => {
    setEditingUser(user);
    editModal.open();
  }, [editModal]);

  const handleToggleStatusClick = useCallback((usuario: UsuarioDto) => {
    if (usuario.id === currentUser?.id) return showError('No puedes bloquear tu propia cuenta.');
    if (usuario.activo && usuario.rol === 'admin') return showError('No se puede bloquear a un administrador.');
    confirmDialog.confirm('toggle_user_status', usuario);
  }, [confirmDialog, currentUser, showError]);

  return {
    // Data
    users: filteredUsers, // Lista final para la tabla
    stats,
    isLoading,
    error,
    currentUser,
    highlightedUserId: highlightedId, // Exportamos el ID para el destello

    // State
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    editingUser, setEditingUser,
    
    // Controllers
    createModal,
    editModal,
    confirmDialog,
    
    // Mutations
    createMutation,
    updateMutation,
    toggleStatusMutation,
    
    // Handlers
    handleEditUser,
    handleToggleStatusClick
  };
};
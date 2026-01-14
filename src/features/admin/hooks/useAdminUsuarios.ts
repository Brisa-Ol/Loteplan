import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../core/context/AuthContext';
import useSnackbar from '../../../shared/hooks/useSnackbar';
import { useModal } from '../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../core/types/dto/usuario.dto';
import UsuarioService from '../../../core/api/services/usuario.service';


export const useAdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // Modales
  const createModal = useModal();
  const editModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<number | null>(null);

  // Referencia para ordenamiento visual estable
  const initialStatusRef = useRef<Record<number, boolean>>({});

  // --- QUERY ---
  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Efecto Sticky para ordenamiento
  useEffect(() => {
    if (usuarios.length > 0) {
      usuarios.forEach(u => {
        if (initialStatusRef.current[u.id] === undefined) {
          initialStatusRef.current[u.id] = u.activo;
        }
      });
    }
  }, [usuarios]);

  // --- ACTIONS ---
  const highlightRow = (id: number) => {
    setHighlightedUserId(id);
    setTimeout(() => setHighlightedUserId(null), 2500);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      createModal.close();
      showSuccess('Usuario creado exitosamente');
      if (res.data?.id) highlightRow(res.data.id);
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
      highlightRow(variables.id);
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
      highlightRow(usuario.id);
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

  // --- DATA COMPUTADA ---
  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    confirmados: usuarios.filter(u => u.confirmado_email).length,
    con2FA: usuarios.filter(u => u.is_2fa_enabled).length
  }), [usuarios]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = usuarios.filter(user => {
      const matchesSearch = 
        user.nombre_usuario.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term);
      
      const matchesStatus = filterStatus === 'all' ? true :
        filterStatus === 'active' ? user.activo : !user.activo;

      return matchesSearch && matchesStatus;
    });

    // Ordenamiento estable
    return filtered.sort((a, b) => {
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;
      if (statusA !== statusB) return statusA ? -1 : 1;
      return a.nombre_usuario.localeCompare(b.nombre_usuario);
    });
  }, [usuarios, searchTerm, filterStatus]);

  return {
    // Data & State
    users: filteredUsers,
    stats,
    isLoading,
    error,
    currentUser,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    highlightedUserId,
    editingUser, setEditingUser,
    
    // Controllers
    createModal,
    editModal,
    confirmDialog,
    
    // Actions / Mutations
    createMutation,
    updateMutation,
    toggleStatusMutation,
    
    // Handlers
    handleEditUser,
    handleToggleStatusClick
  };
};
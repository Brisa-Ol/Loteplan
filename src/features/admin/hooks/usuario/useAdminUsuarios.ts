import UsuarioService from '@/core/api/services/usuario.service';
import { env } from '@/core/config/env'; // 👈 1. Importamos env
import { useAuth } from '@/core/context';
import { useConfirmDialog, useModal, useSnackbar } from '@/shared/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSortedData } from '../useSortedData';

import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '@/core/types/usuario.dto';

export const useAdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);

  // CONTROLADORES DE MODALES
  const createModal = useModal();
  const editModal = useModal();
  const detailModal = useModal(); // ✅ NUEVO: Controlador para el detalle
  const confirmDialog = useConfirmDialog();

  // --- DATA FETCHING ---
  const { data: usuariosRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data,
    staleTime: env.queryStaleTime || 30000, // 👈 2. Aplicamos la variable global
  });

  const { sortedData: usuariosOrdenados, highlightedId, triggerHighlight } = useSortedData(usuariosRaw);

  // --- MUTACIONES (IGUALES) ---
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      createModal.close();
      showSuccess('Usuario creado exitosamente');
      if (res.data?.id) triggerHighlight(res.data.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al crear')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      editModal.close();
      setEditingUser(null);
      showSuccess('Usuario actualizado');
      triggerHighlight(variables.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al actualizar')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: UsuarioDto) =>
      user.activo ? UsuarioService.update(user.id, { activo: false }) : UsuarioService.reactivateAccount(user.id),
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      confirmDialog.close();
      showSuccess(`Cuenta ${user.activo ? 'desactivada' : 'activada'}`);
    }
  });

  // --- FILTRADO (IGUAL) ---
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return usuariosOrdenados.filter(u => {
      const matchesSearch = !term || [u.nombre, u.apellido, u.email, u.nombre_usuario, u.dni].some(f => f?.toLowerCase().includes(term));
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.activo : !u.activo);
      const userDate = (u.fecha_registro || u.createdAt || '').split('T')[0];
      let matchesRange = true;
      if (startDate && endDate) matchesRange = userDate >= startDate && userDate <= endDate;
      else if (startDate) matchesRange = userDate >= startDate;
      else if (endDate) matchesRange = userDate <= endDate;
      return matchesSearch && matchesStatus && matchesRange;
    });
  }, [usuariosOrdenados, searchTerm, filterStatus, startDate, endDate]);

  return {
    users: filteredUsers,
    stats: {
      total: usuariosRaw.length,
      activos: usuariosRaw.filter(u => u.activo).length,
      confirmados: usuariosRaw.filter(u => u.confirmado_email).length,
      con2FA: usuariosRaw.filter(u => u.is_2fa_enabled).length
    },
    isLoading, error, highlightedUserId: highlightedId,
    currentUser, searchTerm, setSearchTerm, filterStatus, setFilterStatus,
    startDate, setStartDate, endDate, setEndDate,
    editingUser, setEditingUser,
    createModal, editModal, detailModal, confirmDialog, // ✅ detailModal exportado
    createMutation, updateMutation, toggleStatusMutation,
    
    // HANDLERS
    handleEditUser: (user: UsuarioDto) => {
      setEditingUser(user);
      editModal.open();
    },
    handleViewUser: (user: UsuarioDto) => { // ✅ NUEVO: Handler para ver detalle
      setEditingUser(user);
      detailModal.open();
    },
    handleToggleStatusClick: (user: UsuarioDto) => {
      if (user.id === currentUser?.id) return showError('No puedes desactivar tu cuenta.');
      confirmDialog.confirm('toggle_user_status', user);
    },
    clearFilters: () => { setSearchTerm(''); setFilterStatus('all'); setStartDate(''); setEndDate(''); }
  };
};
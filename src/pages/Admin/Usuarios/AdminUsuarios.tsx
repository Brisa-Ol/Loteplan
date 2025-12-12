import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, Switch,
  Snackbar, Alert
} from '@mui/material';
import { 
  PersonAdd, Search, Group as GroupIcon, MarkEmailRead, 
  Security, Edit as EditIcon, VerifiedUser as VerifiedUserIcon,
  PhonelinkLock as TwoFaIcon, CheckCircle
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import UsuarioService from '../../../Services/usuario.service';
import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../types/dto/usuario.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';

// ✅ 1. Importar el Hook
import { useModal } from '../../../hooks/useModal';

const MiniStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const AdminUsuarios: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados de Interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // ✅ 2. Usar Hooks para Modales
  const createModal = useModal();
  const editModal = useModal();
  
  // Estado para Datos
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success'|'error' }>({
    open: false, message: '', severity: 'success'
  });

  const showMessage = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<any>;
      return axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message;
    }
    return 'Ocurrió un error inesperado';
  };

  // Queries & Mutations
  const { data: usuarios = [], isLoading, error } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios'],
    queryFn: async () => (await UsuarioService.findAll()).data
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); 
        createModal.close(); // ✅
        showMessage('Usuario creado exitosamente');
    },
    onError: (err) => showMessage(`Error al crear: ${getErrorMessage(err)}`, 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); 
        editModal.close(); // ✅
        setEditingUser(null); 
        showMessage('Usuario actualizado correctamente');
    },
    onError: (err) => showMessage(`Error al editar: ${getErrorMessage(err)}`, 'error')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioDto) => {
      if (usuario.activo) return await UsuarioService.softDelete(usuario.id);
      else return await UsuarioService.update(usuario.id, { activo: true });
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      const accion = usuario.activo ? 'desactivado' : 'reactivado';
      showMessage(`Usuario ${accion} correctamente`, 'success');
    },
    onError: (err) => showMessage(`Error al cambiar estado: ${getErrorMessage(err)}`, 'error')
  });

  // Handlers Actualizados
  const handleEditUser = (user: UsuarioDto) => {
    setEditingUser(user);
    editModal.open(); // ✅
  };

  const handleCloseEdit = () => {
    editModal.close(); // ✅
    setEditingUser(null);
  };

  const handleToggleStatus = (usuario: UsuarioDto) => {
     toggleStatusMutation.mutate(usuario);
  };

  // KPIs & Filtrado (Igual)
  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    confirmados: usuarios.filter(u => u.confirmado_email).length,
    con2FA: usuarios.filter(u => u.is_2fa_enabled).length
  }), [usuarios]);

  const filteredUsers = useMemo(() => {
    return usuarios.filter(user => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        user.nombre_usuario.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term);
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? user.activo :
        !user.activo;
      return matchesSearch && matchesStatus;
    });
  }, [usuarios, searchTerm, filterStatus]);

  // Columnas
  const columns: DataTableColumn<UsuarioDto>[] = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { 
      id: 'usuario', label: 'Usuario / Info', minWidth: 250,
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Box>
                <Typography variant="body2" fontWeight={600}>{user.nombre_usuario}</Typography>
                <Typography variant="caption" color="text.secondary">{user.nombre} {user.apellido}</Typography>
            </Box>
            {user.confirmado_email && <Tooltip title="Email Verificado"><VerifiedUserIcon color="success" sx={{ fontSize: 16 }} /></Tooltip>}
            {user.is_2fa_enabled && <Tooltip title="2FA Activo"><TwoFaIcon color="info" sx={{ fontSize: 16 }} /></Tooltip>}
        </Stack>
      )
    },
    { id: 'email', label: 'Email', minWidth: 200 },
    { 
      id: 'rol', label: 'Rol', 
      render: (user) => <Chip label={user.rol} size="small" color={user.rol === 'admin' ? 'primary' : 'default'} variant={user.rol === 'admin' ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} />
    },
    { 
      id: 'acceso', label: 'Acceso', 
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
                checked={user.activo}
                onChange={() => handleToggleStatus(user)}
                color="success" size="small"
                disabled={toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === user.id} 
            />
            <Typography variant="caption" color={user.activo ? 'success.main' : 'text.disabled'}>
                {user.activo ? 'Habilitado' : 'Bloqueado'}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (user) => (
        <Stack direction="row" justifyContent="flex-end">
            <Tooltip title="Editar Usuario">
                <IconButton color="primary" onClick={() => handleEditUser(user)} size="small">
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Gestión de Usuarios" subtitle="Administra el acceso y seguridad." />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <Box flex={1}><MiniStatCard title="Total Usuarios" value={stats.total} icon={<GroupIcon />} color="primary" /></Box>
        <Box flex={1}><MiniStatCard title="Activos" value={stats.activos} icon={<CheckCircle />} color="success" /></Box>
        <Box flex={1}><MiniStatCard title="Email Confirmado" value={stats.confirmados} icon={<MarkEmailRead />} color="info" /></Box>
        <Box flex={1}><MiniStatCard title="Con 2FA Activo" value={stats.con2FA} icon={<Security />} color="warning" /></Box>
      </Stack>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar..." size="small" sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        <TextField select label="Estado" size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<PersonAdd />} color="primary" onClick={createModal.open}>
          Nuevo Usuario
        </Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns} data={filteredUsers} getRowKey={(user) => user.id}
            emptyMessage="No se encontraron usuarios." pagination={true} defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ✅ MODALES CON HOOK */}
      <CreateUserModal 
        open={createModal.isOpen}
        onClose={createModal.close}
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
        isLoading={createMutation.isPending}
      />

      <EditUserModal 
        open={editModal.isOpen}
        onClose={handleCloseEdit}
        user={editingUser}
        onSubmit={async (id, data) => { await updateMutation.mutateAsync({ id, data }); }}
        isLoading={updateMutation.isPending}
      />

      <Snackbar 
        open={snackbar.open} autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} variant="filled">
            {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminUsuarios;
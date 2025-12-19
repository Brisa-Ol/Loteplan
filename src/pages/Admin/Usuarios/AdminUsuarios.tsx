import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, 
  Snackbar, Alert, Switch, CircularProgress, alpha
} from '@mui/material';
import { 
  PersonAdd, Search, Group as GroupIcon, MarkEmailRead, 
  Security, Edit as EditIcon, VerifiedUser as VerifiedUserIcon,
  PhonelinkLock as TwoFaIcon, CheckCircle, Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// --- Servicios y Tipos ---
import UsuarioService from '../../../Services/usuario.service';
import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../types/dto/usuario.dto';

// --- Componentes Comunes ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// --- Modales y Hooks ---
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';

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
  
  // Hooks de Modales
  const createModal = useModal();
  const editModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  // Estados de Interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);
  
  // Estado para el efecto Flash
  const [highlightedUserId, setHighlightedUserId] = useState<number | null>(null);

  // --- LOGICA STICKY (Congelar Orden) ---
  // Guardamos el estado "original" de cada usuario para que el orden no cambie al editar
  const initialStatusRef = useRef<Record<number, boolean>>({});

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

  // --- EFECTO PARA CAPTURAR ESTADO INICIAL ---
  // Cada vez que llegan usuarios nuevos (carga inicial o creación), guardamos su estado
  useEffect(() => {
    if (usuarios.length > 0) {
      usuarios.forEach(u => {
        // Solo guardamos si NO lo tenemos registrado ya. 
        // Esto preserva el estado "antiguo" de los que ya existían.
        if (initialStatusRef.current[u.id] === undefined) {
          initialStatusRef.current[u.id] = u.activo;
        }
      });
    }
  }, [usuarios]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); 
      createModal.close(); 
      showMessage('Usuario creado exitosamente');
    },
    onError: (err) => showMessage(`Error al crear: ${getErrorMessage(err)}`, 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); 
      editModal.close(); 
      setEditingUser(null); 
      showMessage('Usuario actualizado correctamente');
    },
    onError: (err) => showMessage(`Error al editar: ${getErrorMessage(err)}`, 'error')
  });

  // Mutación de Cambio de Estado
  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioDto) => {
      return await UsuarioService.update(usuario.id, { 
        activo: !usuario.activo 
      });
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] });
      confirmDialog.close();
      
      const accion = usuario.activo ? 'bloqueado' : 'reactivado';
      showMessage(`Usuario ${accion} correctamente`, 'success');

      // Efecto Flash
      setHighlightedUserId(usuario.id);
      setTimeout(() => {
        setHighlightedUserId(null);
      }, 2500);
    },
    onError: (err) => {
      confirmDialog.close();
      showMessage(`Error al cambiar estado: ${getErrorMessage(err)}`, 'error');
    }
  });

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleEditUser = (user: UsuarioDto) => {
    setEditingUser(user);
    editModal.open(); 
  };

  const handleCloseEdit = () => {
    editModal.close(); 
    setEditingUser(null);
  };

  const handleToggleStatusClick = (usuario: UsuarioDto) => {
    if (usuario.activo && usuario.rol === 'admin') {
      showMessage('No se puede bloquear a un administrador. Cambia su rol primero.', 'error');
      return;
    }
    confirmDialog.confirm('toggle_user_status', usuario);
  };

  const handleConfirmToggle = () => {
    if (confirmDialog.data) {
      toggleStatusMutation.mutate(confirmDialog.data);
    }
  };

  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    confirmados: usuarios.filter(u => u.confirmado_email).length,
    con2FA: usuarios.filter(u => u.is_2fa_enabled).length
  }), [usuarios]);

  const filteredUsers = useMemo(() => {
    const filtered = usuarios.filter(user => {
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

    // --- ORDENAMIENTO "STICKY" ---
    return filtered.sort((a, b) => {
      // Usamos el estado guardado en el Ref (el estado "original" de la sesión).
      // Si por alguna razón es nuevo y no tiene ref, usamos el actual.
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;

      // Prioridad: Estado (Activos primero)
      if (statusA !== statusB) {
        return statusA ? -1 : 1;
      }
      // Secundaria: Nombre
      return a.nombre_usuario.localeCompare(b.nombre_usuario);
    });
  }, [usuarios, searchTerm, filterStatus]);

  // Columnas
  const columns: DataTableColumn<UsuarioDto>[] = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { 
      id: 'usuario', 
      label: 'Usuario / Info', 
      minWidth: 250,
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user.nombre_usuario}
              {!user.activo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.nombre} {user.apellido}
            </Typography>
          </Box>
          {user.confirmado_email && (
            <Tooltip title="Email Verificado">
              <VerifiedUserIcon color="success" sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
          {user.is_2fa_enabled && (
            <Tooltip title="2FA Activo">
              <TwoFaIcon color="info" sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
        </Stack>
      )
    },
    { id: 'email', label: 'Email', minWidth: 200 },
    { 
      id: 'rol', 
      label: 'Rol', 
      render: (user) => (
        <Chip 
          label={user.rol} 
          size="small" 
          color={user.rol === 'admin' ? 'primary' : 'default'} 
          variant={user.rol === 'admin' ? 'filled' : 'outlined'} 
          sx={{ textTransform: 'capitalize' }} 
        />
      )
    },
    { 
      id: 'acceso', 
      label: 'Acceso',
      align: 'center',
      render: (user) => {
        const isAdminAndActive = user.rol === 'admin' && user.activo;
        const isProcessingThisUser = toggleStatusMutation.isPending && confirmDialog.data?.id === user.id;
        
        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThisUser ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Tooltip 
                title={isAdminAndActive ? 'No se puede bloquear a un administrador' : user.activo ? 'Click para bloquear' : 'Click para reactivar'}
              >
                <span>
                  <Switch
                    checked={user.activo}
                    onChange={() => handleToggleStatusClick(user)}
                    color={user.activo ? 'success' : 'error'}
                    size="small"
                    disabled={toggleStatusMutation.isPending || isAdminAndActive}
                  />
                </span>
              </Tooltip>
            )}
            
            {!isProcessingThisUser && (
              <Typography 
                variant="caption" 
                color={user.activo ? 'success.main' : 'error.main'}
                fontWeight={600}
                sx={{ minWidth: 60 }}
              >
                {user.activo ? 'Activo' : 'Inactivo'}
              </Typography>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'acciones', 
      label: 'Acciones', 
      align: 'right',
      render: (user) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Editar Usuario">
            <IconButton 
              color="primary" 
              onClick={() => handleEditUser(user)} 
              size="small"
              disabled={toggleStatusMutation.isPending}
            >
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

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <Box flex={1}>
          <MiniStatCard title="Total Usuarios" value={stats.total} icon={<GroupIcon />} color="primary" />
        </Box>
        <Box flex={1}>
          <MiniStatCard title="Activo" value={stats.activos} icon={<CheckCircle />} color="success" />
        </Box>
        <Box flex={1}>
          <MiniStatCard title="Email Confirmado" value={stats.confirmados} icon={<MarkEmailRead />} color="info" />
        </Box>
        <Box flex={1}>
          <MiniStatCard title="Con 2FA Activo" value={stats.con2FA} icon={<Security />} color="warning" />
        </Box>
      </Stack>

      {/* Filters & Add Button */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar usuario..." 
          size="small" 
          sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ) 
          }}
        />
        <TextField 
          select 
          label="Estado" 
          size="small" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </TextField>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          color="primary" 
          onClick={createModal.open}
        >
          Nuevo Usuario
        </Button>
      </Paper>

      {/* Tabla de Usuarios */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
          columns={columns} 
          data={filteredUsers} 
          getRowKey={(user) => user.id}
          // Estilo condicional: Flash Verde
          getRowSx={(user) => {
            const isHighlighted = highlightedUserId === user.id;
            return {
               opacity: user.activo ? 1 : 0.6,
               transition: 'background-color 0.8s ease, opacity 0.3s ease',
               bgcolor: isHighlighted 
                  ? (theme) => alpha(theme.palette.success.main, 0.2)
                  : (user.activo ? 'inherit' : 'action.hover')
            };
          }}
          emptyMessage="No se encontraron usuarios." 
          pagination={true} 
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* --- MODALES --- */}
      
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

      {/* Modal de Confirmación */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmToggle}
        isLoading={toggleStatusMutation.isPending}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminUsuarios;
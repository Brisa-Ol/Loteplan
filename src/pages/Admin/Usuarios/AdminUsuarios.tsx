// src/pages/Admin/Usuarios/AdminUsuarios.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, 
  Snackbar, Alert, Switch, CircularProgress, alpha, 
  Avatar, useTheme, Divider 
} from '@mui/material';
import { 
  PersonAdd, Search, Group as GroupIcon, MarkEmailRead, 
  Security, Edit as EditIcon, VerifiedUser as VerifiedUserIcon,
  PhonelinkLock as TwoFaIcon, CheckCircle, Block as BlockIcon
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

// --- COMPONENTE MINI STAT CARD (Estandarizado) ---
const MiniStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const theme = useTheme();
  // Obtener color del theme de forma segura
  const paletteColor = (theme.palette as any)[color] || theme.palette.primary;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        borderRadius: 3, 
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: paletteColor.main,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Avatar 
        variant="rounded" 
        sx={{ 
          bgcolor: alpha(paletteColor.main, 0.1), 
          color: paletteColor.main,
          width: 48, 
          height: 48 
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">{value}</Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

const AdminUsuarios: React.FC = () => {
  const theme = useTheme();
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
  useEffect(() => {
    if (usuarios.length > 0) {
      usuarios.forEach(u => {
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
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;

      if (statusA !== statusB) {
        return statusA ? -1 : 1;
      }
      return a.nombre_usuario.localeCompare(b.nombre_usuario);
    });
  }, [usuarios, searchTerm, filterStatus]);

  // Columnas (Memoizadas)
  const columns = useMemo<DataTableColumn<UsuarioDto>[]>(() => [
    { id: 'id', label: 'ID', minWidth: 50 },
    { 
      id: 'usuario', 
      label: 'Usuario', 
      minWidth: 250,
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={2}>
           {/* Avatar con Inicial */}
           <Avatar sx={{ 
             width: 40, 
             height: 40, 
             bgcolor: user.activo ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.disabledBackground,
             color: user.activo ? 'primary.main' : 'text.disabled',
             fontSize: '1rem',
             fontWeight: 'bold'
           }}>
             {user.nombre_usuario.charAt(0).toUpperCase()}
           </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600} color={user.activo ? 'text.primary' : 'text.disabled'}>
                {user.nombre_usuario}
              </Typography>
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
            <Typography variant="caption" color="text.secondary">
              {user.nombre} {user.apellido}
            </Typography>
          </Box>
        </Stack>
      )
    },
    { id: 'email', label: 'Email', minWidth: 200 },
    { 
      id: 'rol', 
      label: 'Rol', 
      render: (user) => {
        const isAdmin = user.rol === 'admin';
        return (
          <Chip 
            label={user.rol} 
            size="small" 
            sx={{ 
              textTransform: 'capitalize',
              fontWeight: 600,
              bgcolor: isAdmin ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.info.main, 0.1),
              color: isAdmin ? 'primary.main' : 'info.main',
              border: '1px solid',
              borderColor: isAdmin ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.info.main, 0.2)
            }} 
          />
        );
      }
    },
    { 
      id: 'acceso', 
      label: 'Estado y Acceso',
      align: 'center',
      render: (user) => {
        const isAdminAndActive = user.rol === 'admin' && user.activo;
        const isProcessingThisUser = toggleStatusMutation.isPending && confirmDialog.data?.id === user.id;
        
        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThisUser ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Tooltip 
                title={isAdminAndActive ? 'No se puede bloquear a un administrador' : user.activo ? 'Bloquear Acceso' : 'Reactivar Acceso'}
              >
                <Switch
                  checked={user.activo}
                  onChange={() => handleToggleStatusClick(user)}
                  size="small"
                  disabled={toggleStatusMutation.isPending || isAdminAndActive}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.success.main,
                      '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: theme.palette.success.main,
                    },
                  }}
                />
              </Tooltip>
            )}
            
            {!isProcessingThisUser && (
              <Chip 
                label={user.activo ? 'Activo' : 'Inactivo'}
                size="small"
                variant="outlined"
                icon={user.activo ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <BlockIcon sx={{ fontSize: '14px !important' }} />}
                color={user.activo ? 'success' : 'default'}
                sx={{ 
                  height: 24, 
                  border: 'none', 
                  bgcolor: user.activo ? alpha(theme.palette.success.main, 0.1) : theme.palette.action.hover,
                  '& .MuiChip-label': { px: 1, fontSize: '0.75rem', fontWeight: 600 }
                }}
              />
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
              onClick={() => handleEditUser(user)} 
              size="small"
              disabled={toggleStatusMutation.isPending}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, toggleStatusMutation.isPending, confirmDialog.data]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader 
        title="Gestión de Usuarios" 
        subtitle="Administra los permisos, roles y estado de seguridad de la plataforma." 
      />

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <MiniStatCard title="Total Usuarios" value={stats.total} icon={<GroupIcon />} color="primary" />
        <MiniStatCard title="Usuarios Activos" value={stats.activos} icon={<CheckCircle />} color="success" />
        <MiniStatCard title="Emails Verificados" value={stats.confirmados} icon={<MarkEmailRead />} color="info" />
        <MiniStatCard title="Seguridad 2FA" value={stats.con2FA} icon={<Security />} color="warning" />
      </Box>

      {/* Filters & Add Button */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', 
          borderRadius: 2, border: '1px solid', borderColor: 'divider', 
          bgcolor: alpha(theme.palette.background.paper, 0.6)
        }} 
      >
        <TextField 
          placeholder="Buscar por nombre, email o usuario..." 
          size="small" 
          sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
            startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
            sx: { borderRadius: 2 }
          }}
        />
        <TextField 
          select label="Estado" size="small" 
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} 
          sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </TextField>
        
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />
        
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={createModal.open}
          sx={{ 
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            boxShadow: theme.shadows[2]
          }}
        >
          Nuevo Usuario
        </Button>
      </Paper>

      {/* Tabla de Usuarios */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {/* Eliminado el Paper envolvente redundante */}
          <DataTable
            columns={columns} 
            data={filteredUsers} 
            getRowKey={(user) => user.id}
            getRowSx={(user) => {
              const isHighlighted = highlightedUserId === user.id;
              return {
                opacity: user.activo ? 1 : 0.6,
                transition: 'background-color 0.8s ease, opacity 0.3s ease',
                bgcolor: isHighlighted 
                  ? alpha(theme.palette.success.main, 0.15)
                  : (user.activo ? 'inherit' : alpha(theme.palette.action.hover, 0.5)),
                '&:hover': {
                  bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.action.hover, 0.8)
                }
              };
            }}
            emptyMessage="No se encontraron usuarios registrados." 
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
        autoHideDuration={4000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          variant="filled"
          sx={{ width: '100%', boxShadow: theme.shadows[4] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminUsuarios;
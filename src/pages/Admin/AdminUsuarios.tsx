// src/pages/Admin/AdminUsuarios.tsx
// (CORREGIDO: Solo lógica de gestión de usuarios)

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Avatar,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockOpen as LockOpenIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import usuarioService from '../../Services/usuario.service';
import type { CreateUsuarioDTO, UpdateUserByAdminDTO } from '../../types/dto/usuario.dto';
import type { User } from '../../types/dto/auth.types';
import { PageContainer } from '../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';
import CreateUserModal from '../../components/Admin/Users/CreateUserModal';
import EditUserModal from '../../components/Admin/Users/EditUserModal';

// Servicios y Tipos


// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const AdminUsuarios: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  });

  // ──────────────────────────────────────────────────────────
  // QUERIES Y MUTATIONS (Solo de Usuarios)
  // ──────────────────────────────────────────────────────────

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[], Error>({
    queryKey: ['adminAllUsers'],
    queryFn: usuarioService.getAllUsers,
  });

  const createMutation = useMutation({
    mutationFn: usuarioService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({
        open: true,
        message: 'Usuario creado correctamente',
        severity: 'success',
      });
      setCreateModalOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear usuario',
        severity: 'error',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserByAdminDTO }) =>
      usuarioService.updateUserById(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({
        open: true,
        message: 'Usuario actualizado correctamente',
        severity: 'success',
      });
      setEditModalOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar usuario',
        severity: 'error',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usuarioService.deleteUserById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({
        open: true,
        message: 'Usuario desactivado correctamente',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al desactivar usuario',
        severity: 'error',
      }),
  });

  const reset2FAMutation = useMutation({
    mutationFn: (id: number) => usuarioService.adminReset2FA(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      setSnackbar({
        open: true,
        message: data.message || '2FA reiniciado',
        severity: 'success',
      });
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al reiniciar 2FA',
        severity: 'error',
      }),
  });

  // ──────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as 'todos' | 'activos' | 'inactivos');
  };

  const filteredUsers = users
    .filter(
      (user) =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) => {
      if (statusFilter === 'activos') {
        return user.activo;
      }
      if (statusFilter === 'inactivos') {
        return !user.activo;
      }
      return true; // 'todos'
    });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleCreateSubmit = async (data: CreateUsuarioDTO) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (id: number, data: UpdateUserByAdminDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  // ──────────────────────────────────────────────────────────
  // DATOS PROCESADOS (Stats de usuarios)
  // ──────────────────────────────────────────────────────────
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.activo).length,
    confirmedEmails: users.filter((u) => u.confirmado_email).length,
    with2FA: users.filter((u) => u.is_2fa_enabled).length,
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra, crea y edita todos los usuarios del sistema."
      />

      {/* Tarjetas de Estadísticas (MOVIDAS AQUÍ) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Usuarios
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Activos
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <VerifiedUserIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.confirmedEmails}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email Confirmado
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <SecurityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.with2FA}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con 2FA
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabla de Usuarios */}
      <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
          justifyContent="space-between"
        >
          <TextField
            fullWidth
            placeholder="Buscar por nombre, email o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="status-filter-label">Filtrar por estado</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Filtrar por estado"
              onChange={handleStatusChange}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="activos">Activos</MenuItem>
              <MenuItem value="inactivos">Inactivos</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{ minWidth: 180 }}
            onClick={() => setCreateModalOpen(true)}
          >
            Nuevo Usuario
          </Button>
        </Stack>

        <QueryHandler isLoading={isLoading} error={error}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Email Verificado</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.nombre[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.nombre} {user.apellido}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            @{user.nombre_usuario}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.rol}
                        size="small"
                        color={user.rol === 'admin' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          user.activo ? <CheckCircleIcon /> : <CancelIcon />
                        }
                        label={user.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={user.activo ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{user.confirmado_email ? '✅' : '❌'}</TableCell>
                    <TableCell>{user.is_2fa_enabled ? '🔒' : '🔓'}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0}
                        justifyContent="center"
                      >
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {user.is_2fa_enabled && (
                          <Tooltip title="Resetear 2FA">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() =>
                                reset2FAMutation.mutate(user.id)
                              }
                              disabled={reset2FAMutation.isPending}
                            >
                              <LockOpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Desactivar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </QueryHandler>
      </Paper>

      {/* MODALES */}
      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />
      <EditUserModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isPending}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas desactivar al usuario
            <strong>
              {' '}
              {selectedUser?.nombre} {selectedUser?.apellido}
            </strong>
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminUsuarios;
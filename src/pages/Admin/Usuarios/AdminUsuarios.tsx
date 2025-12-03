import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment 
} from '@mui/material';
import { 
  Block as BlockIcon, 
  CheckCircle, 
  PersonAdd, 
  Search, 
  Group as GroupIcon, 
  MarkEmailRead, 
  Security, 
  Edit as EditIcon,
  VerifiedUser as VerifiedUserIcon,
  // 👇 1. Importamos el icono para el 2FA
  PhonelinkLock as TwoFaIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UsuarioService from '../../../Services/usuario.service';
import type { CreateUsuarioDto, UpdateUserAdminDto, UsuarioDto } from '../../../types/dto/usuario.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';

// Componente de Tarjeta KPI
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);

  // 1. Query: Obtener usuarios
  const { data: usuarios = [], isLoading, error } = useQuery<UsuarioDto[]>({
    queryKey: ['adminUsuarios'],
    queryFn: async () => {
        const res = await UsuarioService.findAll();
        return res.data; 
    }
  });

  // 2. KPIs
  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    confirmados: usuarios.filter(u => u.confirmado_email).length,
    con2FA: usuarios.filter(u => u.is_2fa_enabled).length
  }), [usuarios]);

  // 3. Filtrado
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

  // Mutaciones (Sin cambios)
  const createMutation = useMutation({
    mutationFn: async (data: CreateUsuarioDto) => UsuarioService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); setIsCreateModalOpen(false); alert('Usuario creado.'); },
    onError: (err: any) => alert(`Error: ${err.response?.data?.error || err.message}`)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: UpdateUserAdminDto }) => UsuarioService.updateAdmin(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }); setEditingUser(null); alert('Usuario actualizado.'); },
    onError: (err: any) => alert(`Error: ${err.response?.data?.error || err.message}`)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: UsuarioDto) => {
      if (usuario.activo) await UsuarioService.softDelete(usuario.id);
      else await UsuarioService.updateAdmin(usuario.id, { activo: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsuarios'] }),
    onError: (err: any) => alert(`Error: ${err.message}`)
  });

  return (
    <PageContainer maxWidth="xl">
      <Box textAlign="center" mb={5}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">Gestión de Usuarios</Typography>
        <Typography color="text.secondary">Administra el acceso y los roles de los usuarios del sistema.</Typography>
      </Box>

      {/* KPIs */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <Box flex={1}><MiniStatCard title="Total Usuarios" value={stats.total} icon={<GroupIcon />} color="primary" /></Box>
        <Box flex={1}><MiniStatCard title="Activos" value={stats.activos} icon={<CheckCircle />} color="success" /></Box>
        <Box flex={1}><MiniStatCard title="Email Confirmado" value={stats.confirmados} icon={<MarkEmailRead />} color="info" /></Box>
        <Box flex={1}><MiniStatCard title="Con 2FA" value={stats.con2FA} icon={<Security />} color="warning" /></Box>
      </Stack>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar..." size="small" sx={{ flexGrow: 1, minWidth: 250 }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        <TextField
          select label="Filtrar por estado" size="small" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<PersonAdd />} color="primary" onClick={() => setIsCreateModalOpen(true)}>
          Nuevo Usuario
        </Button>
      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  
                  {/* 👇 COLUMNA USUARIO CON INDICADORES */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box>
                            <Typography variant="body2" fontWeight={600}>{user.nombre_usuario}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.nombre} {user.apellido}</Typography>
                        </Box>
                        
                        {/* 1. Email Verificado (Escudo Verde) */}
                        <Tooltip title={user.confirmado_email ? "Email Verificado" : "Email No Verificado"}>
                             <VerifiedUserIcon 
                                sx={{ 
                                    color: user.confirmado_email ? 'success.main' : 'action.disabled',
                                    fontSize: 18,
                                    ml: 1
                                }} 
                             />
                        </Tooltip>

                        {/* 2. 2FA Activo (Celular con candado) */}
                        <Tooltip title={user.is_2fa_enabled ? "2FA Activo" : "2FA Inactivo"}>
                             <TwoFaIcon 
                                sx={{ 
                                    // Azul si está activo, Gris si no
                                    color: user.is_2fa_enabled ? 'info.main' : 'action.disabled',
                                    fontSize: 18 
                                }} 
                             />
                        </Tooltip>
                    </Stack>
                  </TableCell>

                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.rol} size="small" 
                      color={user.rol === 'admin' ? 'primary' : 'default'} 
                      variant={user.rol === 'admin' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.activo ? 'Activo' : 'Inactivo'} 
                      color={user.activo ? 'success' : 'default'} size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar Usuario">
                        <IconButton color="primary" onClick={() => setEditingUser(user)} sx={{ mr: 1 }}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={user.activo ? "Desactivar cuenta" : "Reactivar cuenta"}>
                      <IconButton onClick={() => toggleStatusMutation.mutate(user)}>
                        {user.activo ? <BlockIcon color="error" /> : <CheckCircle color="success" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                 <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No se encontraron usuarios.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      <CreateUserModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
        isLoading={createMutation.isPending}
      />

      <EditUserModal 
        open={!!editingUser} 
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSubmit={async (id, data) => { await updateMutation.mutateAsync({ id, data }); }}
        isLoading={updateMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminUsuarios;
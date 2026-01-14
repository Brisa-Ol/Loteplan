import React, { useMemo } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip, Stack, Button, 
  TextField, MenuItem, InputAdornment, Switch, CircularProgress, 
  alpha, Avatar, useTheme, Divider
} from '@mui/material';
import {
  PersonAdd, Search, Group as GroupIcon, MarkEmailRead,
  Security, Edit as EditIcon, VerifiedUser as VerifiedUserIcon,
  PhonelinkLock as TwoFaIcon, CheckCircle, Block as BlockIcon
} from '@mui/icons-material';

// Components
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { FilterBar } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// Modals
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';

// Logic & Types
import { useAdminUsuarios } from '../../hooks/useAdminUsuarios';
import type { UsuarioDto } from '../../../../core/types/dto/usuario.dto';

const AdminUsuarios: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminUsuarios();

  const columns = useMemo<DataTableColumn<UsuarioDto>[]>(() => [
    { id: 'id', label: 'ID', minWidth: 50 },
    {
      id: 'usuario', label: 'Usuario', minWidth: 250,
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* El Avatar usa colores dinámicos, eso se queda aquí */}
          <Avatar sx={{
            width: 40, height: 40, fontWeight: 'bold',
            bgcolor: user.activo ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.disabledBackground,
            color: user.activo ? 'primary.main' : 'text.disabled',
          }}>
            {user.nombre_usuario.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600} color={user.activo ? 'text.primary' : 'text.disabled'}>
                {user.nombre_usuario}
              </Typography>
              {/* 🧹 LIMPIEZA: Quitados height manual y fontSize innecesario si el Theme Chip small está bien configurado */}
              {user.id === logic.currentUser?.id && (
                <Chip label="TÚ" size="small" color="primary" sx={{ height: 20 }} />
              )}
              {user.confirmado_email && <Tooltip title="Email Verificado"><VerifiedUserIcon color="success" sx={{ fontSize: 16 }} /></Tooltip>}
              {user.is_2fa_enabled && <Tooltip title="2FA Activo"><TwoFaIcon color="info" sx={{ fontSize: 16 }} /></Tooltip>}
            </Stack>
            <Typography variant="caption" color="text.secondary">{user.nombre} {user.apellido}</Typography>
          </Box>
        </Stack>
      )
    },
    { id: 'email', label: 'Email', minWidth: 200 },
    {
      id: 'rol', label: 'Rol',
      render: (user) => {
        const isAdmin = user.rol === 'admin';
        // 🧹 LIMPIEZA: Quitados fontWeight y borders manuales. MuiChip en theme ya tiene borderRadius 8 y weight 600.
        return (
          <Chip
            label={user.rol} size="small"
            sx={{
              textTransform: 'capitalize',
              bgcolor: isAdmin ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.info.main, 0.1),
              color: isAdmin ? 'primary.main' : 'info.main',
              // Solo dejamos el borde porque es específico para este estado (diferente al default)
              border: '1px solid', 
              borderColor: isAdmin ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.info.main, 0.2)
            }}
          />
        );
      }
    },
    {
      id: 'acceso', label: 'Estado y Acceso', align: 'center',
      render: (user) => {
        const isSelf = user.id === logic.currentUser?.id;
        const isAdminAndActive = user.rol === 'admin' && user.activo;
        const isProcessing = logic.toggleStatusMutation.isPending && logic.confirmDialog.data?.id === user.id;
        const isDisabled = logic.toggleStatusMutation.isPending || isAdminAndActive || isSelf;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessing ? <CircularProgress size={20} color="inherit" /> : (
              <Switch
                checked={user.activo}
                onChange={() => logic.handleToggleStatusClick(user)}
                size="small"
                disabled={isDisabled}
                color={user.activo ? "success" : "default"}
              />
            )}
            {!isProcessing && (
              // 🧹 LIMPIEZA: Chip confía en el theme
              <Chip
                label={user.activo ? 'Activo' : 'Inactivo'} size="small" variant="outlined"
                icon={user.activo ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <BlockIcon sx={{ fontSize: '14px !important' }} />}
                color={user.activo ? 'success' : 'default'}
                sx={{ opacity: isSelf ? 0.5 : 1 }}
              />
            )}
          </Stack>
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (user) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Editar Usuario">
            <IconButton
              onClick={() => logic.handleEditUser(user)} size="small"
              disabled={logic.toggleStatusMutation.isPending}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra los permisos, roles y estado de seguridad de la plataforma."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard title="Total Usuarios" value={logic.stats.total} icon={<GroupIcon />} color="primary" loading={logic.isLoading} subtitle="Registrados" />
        <StatCard title="Usuarios Activos" value={logic.stats.activos} icon={<CheckCircle />} color="success" loading={logic.isLoading} subtitle="Acceso habilitado" />
        <StatCard title="Emails Verificados" value={logic.stats.confirmados} icon={<MarkEmailRead />} color="info" loading={logic.isLoading} subtitle={`${logic.stats.total > 0 ? ((logic.stats.confirmados / logic.stats.total) * 100).toFixed(0) : 0}% del total`} />
        <StatCard title="Seguridad 2FA" value={logic.stats.con2FA} icon={<Security />} color="warning" loading={logic.isLoading} subtitle="Cuentas protegidas" />
      </Box>

      <FilterBar>
        {/* 🧹 LIMPIEZA: Quitados borderRadius manuales en inputs. Theme MuiOutlinedInput ya tiene radius 8 */}
        <TextField
          placeholder="Buscar por nombre, email o usuario..."
          size="small" sx={{ flexGrow: 1, minWidth: 200 }}
          value={logic.searchTerm} onChange={(e) => logic.setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }}
        />
        <TextField
          select label="Estado" size="small"
          value={logic.filterStatus} onChange={(e) => logic.setFilterStatus(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </TextField>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />
        
        {/* 🧹 LIMPIEZA: El botón ya no necesita estilos manuales. El theme le da el color naranja, radio 8, bold y sin mayúsculas */}
        <Button
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={logic.createModal.open}
          sx={{ whiteSpace: 'nowrap' }} // Solo dejamos layout
        >
          Nuevo Usuario
        </Button>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.users}
          getRowKey={(user) => user.id}
          isRowActive={(user) => user.activo}
          highlightedRowId={logic.highlightedUserId}
          emptyMessage="No se encontraron usuarios registrados."
          pagination
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales... (sin cambios) */}
      <CreateUserModal
        open={logic.createModal.isOpen}
        onClose={logic.createModal.close}
        onSubmit={(data) => logic.createMutation.mutateAsync(data)}
        isLoading={logic.createMutation.isPending}
      />
      <EditUserModal
        open={logic.editModal.isOpen}
        onClose={() => { logic.editModal.close(); logic.setEditingUser(null); }}
        user={logic.editingUser}
        onSubmit={(id, data) => logic.updateMutation.mutateAsync({ id, data })}
        isLoading={logic.updateMutation.isPending}
      />
      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={() => logic.confirmDialog.data && logic.toggleStatusMutation.mutate(logic.confirmDialog.data)}
        isLoading={logic.toggleStatusMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminUsuarios;
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

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { FilterBar } from '../../../../shared/components/forms/filters/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';

import { useAdminUsuarios } from '../../hooks/useAdminUsuarios';
import type { UsuarioDto } from '../../../../core/types/dto/usuario.dto';

const AdminUsuarios: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminUsuarios();

  const columns = useMemo<DataTableColumn<UsuarioDto>[]>(() => [
    { 
      id: 'id', 
      label: 'ID', 
      minWidth: 50,
      render: (user) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{user.id}</Typography>
    },
    {
      id: 'usuario', 
      label: 'Usuario', 
      minWidth: 250,
      render: (user) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{
            width: 40, height: 40, fontWeight: 'bold',
            bgcolor: user.activo ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
            color: user.activo ? 'primary.main' : 'text.disabled',
          }}>
            {user.nombre_usuario.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={700}>
                {user.nombre_usuario}
              </Typography>
              {user.id === logic.currentUser?.id && (
                <Chip label="TÚ" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }} />
              )}
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
    { 
      id: 'email', 
      label: 'Email', 
      minWidth: 200,
      render: (user) => <Typography variant="body2">{user.email}</Typography>
    }, 
    {
      id: 'rol', 
      label: 'Rol',
      render: (user) => {
        const isAdmin = user.rol === 'admin';
        return (
          <Chip
            label={user.rol.toUpperCase()} 
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              bgcolor: isAdmin ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.info.main, 0.1),
              color: isAdmin ? 'primary.main' : 'info.main',
              border: '1px solid', 
              borderColor: isAdmin ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.info.main, 0.2),
            }}
          />
        );
      }
    },
    {
      id: 'acceso', 
      label: 'Estado', 
      align: 'center',
      render: (user) => {
        const isSelf = user.id === logic.currentUser?.id;
        const isAdminAndActive = user.rol === 'admin' && user.activo;
        const isProcessing = logic.toggleStatusMutation.isPending && logic.confirmDialog.data?.id === user.id;
        const isDisabled = logic.toggleStatusMutation.isPending || isAdminAndActive || isSelf;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Switch
                checked={user.activo}
                onChange={() => logic.handleToggleStatusClick(user)}
                size="small"
                disabled={isDisabled}
                color="success"
              />
            )}
            {!isProcessing && (
              <Chip
                label={user.activo ? 'ACTIVO' : 'BLOQUEADO'} 
                size="small" 
                variant={user.activo ? "filled" : "outlined"}
                icon={user.activo ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : <BlockIcon sx={{ fontSize: '12px !important' }} />}
                color={user.activo ? 'success' : 'default'}
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '0.6rem',
                  // Mantenemos opacidad reducida solo si es uno mismo (bloqueo de acción)
                  opacity: isSelf ? 0.5 : 1 
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
              onClick={() => logic.handleEditUser(user)} 
              size="small"
              disabled={logic.toggleStatusMutation.isPending}
              sx={{ 
                color: 'text.secondary', 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.15) } 
              }}
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
        subtitle="Control de accesos, roles y seguridad perimetral de la plataforma."
      />

      {/* Métricas de Usuarios */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <StatCard title="Total Usuarios" value={logic.stats.total} icon={<GroupIcon />} color="primary" loading={logic.isLoading} subtitle="Base de datos" />
        <StatCard title="Activos" value={logic.stats.activos} icon={<CheckCircle />} color="success" loading={logic.isLoading} subtitle="Con acceso" />
        <StatCard title="Verificados" value={logic.stats.confirmados} icon={<MarkEmailRead />} color="info" loading={logic.isLoading} subtitle="Email validado" />
        <StatCard title="Seguridad 2FA" value={logic.stats.con2FA} icon={<Security />} color="warning" loading={logic.isLoading} subtitle="Capa extra" />
      </Box>

      {/* Filtros de Tabla */}
      <FilterBar>
        <TextField
          placeholder="Buscar por nombre, email o usuario..."
          size="small" sx={{ flexGrow: 1, minWidth: 200 }}
          value={logic.searchTerm} 
          onChange={(e) => logic.setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }}
        />
        
        <TextField
          select label="Filtrar por Rol" size="small"
          value={logic.filterStatus} 
          onChange={(e) => logic.setFilterStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos los roles</MenuItem>
          <MenuItem value="active">Solo Activos</MenuItem>
          <MenuItem value="inactive">Solo Inactivos</MenuItem>
        </TextField>

        <Button
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={logic.createModal.open}
          sx={{ whiteSpace: 'nowrap', fontWeight: 700 }} 
        >
          Nuevo Usuario
        </Button>
      </FilterBar>

      {/* Tabla de Gestión */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.users}
          getRowKey={(user) => user.id}
          
          // ✅ Integración con nuevas funciones de DataTable
          isRowActive={(user) => user.activo}
          showInactiveToggle={true}
          inactiveLabel="Inactivos"
          
          highlightedRowId={logic.highlightedUserId}
          emptyMessage="No se encontraron usuarios."
          pagination
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales */}
      <CreateUserModal
        open={logic.createModal.isOpen}
        onClose={logic.createModal.close}
        onSubmit={(data) => logic.createMutation.mutateAsync(data)}
        isLoading={logic.createMutation.isPending}
      />
      
      {logic.editingUser && (
        <EditUserModal
          open={logic.editModal.isOpen}
          onClose={() => { logic.editModal.close(); logic.setEditingUser(null); }}
          user={logic.editingUser}
          onSubmit={(id, data) => logic.updateMutation.mutateAsync({ id, data })}
          isLoading={logic.updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={() => logic.confirmDialog.data && logic.toggleStatusMutation.mutate(logic.confirmDialog.data)}
        isLoading={logic.toggleStatusMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminUsuarios;
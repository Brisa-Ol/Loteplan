import {
  AdminPanelSettings,
  Block as BlockIcon,
  CheckCircle,
  Edit as EditIcon,
  Group as GroupIcon,
  MarkEmailRead,
  Person,
  PersonAdd,
  Security,
  PhonelinkLock as TwoFaIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { memo, useMemo } from 'react';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';

import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import { useAdminUsuarios } from '../../hooks/useAdminUsuarios';

// ============================================================================
// BADGES DE SEGURIDAD (MEMOIZADO)
// ============================================================================
const SecurityBadges = memo<{
  emailConfirmed: boolean;
  twoFaEnabled: boolean;
  isCurrentUser: boolean;
}>(({ emailConfirmed, twoFaEnabled, isCurrentUser }) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    {isCurrentUser && (
      <Chip
        label="TÚ"
        size="small"
        color="primary"
        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900 }}
      />
    )}
    {emailConfirmed && (
      <Tooltip title="Email Verificado">
        <VerifiedUserIcon color="success" sx={{ fontSize: 16 }} />
      </Tooltip>
    )}
    {twoFaEnabled && (
      <Tooltip title="2FA Activo">
        <TwoFaIcon color="info" sx={{ fontSize: 16 }} />
      </Tooltip>
    )}
  </Stack>
));

SecurityBadges.displayName = 'SecurityBadges';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminUsuarios: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminUsuarios();

  // ✨ Stats con admins
  const statsWithAdmins = useMemo(
    () => ({
      ...logic.stats,
      admins: logic.users.filter((u) => u.rol === 'admin').length,
    }),
    [logic.stats, logic.users]
  );

  // ✨ COLUMNAS OPTIMIZADAS
  const columns = useMemo<DataTableColumn<UsuarioDto>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 50,
        render: (user) => (
          <Typography variant="caption" color="text.secondary">
            #{user.id}
          </Typography>
        ),
      },
      {
        id: 'usuario',
        label: 'Usuario',
        minWidth: 230,
        render: (user) => {
          const isCurrentUser = user.id === logic.currentUser?.id;
          return (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: user.activo
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.grey[500], 0.1),
                  color: user.activo ? 'primary.main' : 'text.disabled',
                }}
              >
                {user.nombre_usuario.charAt(0).toUpperCase()}
              </Avatar>
              <Box minWidth={0} flex={1}>
                <Stack direction="row" alignItems="center" spacing={0.5} mb={0.2}>
                  <Typography variant="body2" noWrap>
                    {user.nombre_usuario}
                  </Typography>
                  <SecurityBadges
                    emailConfirmed={user.confirmado_email}
                    twoFaEnabled={user.is_2fa_enabled}
                    isCurrentUser={isCurrentUser}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.nombre} {user.apellido}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: 'email',
        label: 'Email',
        minWidth: 180,
        hideOnMobile: true,
        render: (user) => (
          <Typography variant="body2" noWrap>
            {user.email}
          </Typography>
        ),
      },
      {
        id: 'rol',
        label: 'Rol',
        render: (user) => {
          const isAdmin = user.rol === 'admin';
          return (
            <Chip
              icon={
                isAdmin ? (
                  <AdminPanelSettings sx={{ fontSize: '14px !important' }} />
                ) : (
                  <Person sx={{ fontSize: '14px !important' }} />
                )
              }
              label={user.rol.toUpperCase()}
              size="small"
              sx={{
                fontSize: '0.65rem',
                bgcolor: isAdmin
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.info.main, 0.1),
                color: isAdmin ? 'error.main' : 'info.main',
                border: '1px solid',
                borderColor: isAdmin
                  ? alpha(theme.palette.error.main, 0.2)
                  : alpha(theme.palette.info.main, 0.2),
              }}
            />
          );
        },
      },
      {
        id: 'acceso',
        label: 'Estado',
        align: 'center',
        render: (user) => {
          const isSelf = user.id === logic.currentUser?.id;
          const isAdminAndActive = user.rol === 'admin' && user.activo;
          const isProcessing =
            logic.toggleStatusMutation.isPending &&
            logic.confirmDialog.data?.id === user.id;
          const isDisabled = logic.toggleStatusMutation.isPending || isAdminAndActive || isSelf;

          return (
            <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
              {isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Switch
                  checked={user.activo}
                  onChange={(e) => {
                    e.stopPropagation();
                    logic.handleToggleStatusClick(user);
                  }}
                  size="small"
                  disabled={isDisabled}
                  color="success"
                />
              )}
              {!isProcessing && (
                <Chip
                  label={user.activo ? 'ACTIVO' : 'BLOQUEADO'}
                  size="small"
                  variant={user.activo ? 'filled' : 'outlined'}
                  icon={
                    user.activo ? (
                      <CheckCircle sx={{ fontSize: '12px !important' }} />
                    ) : (
                      <BlockIcon sx={{ fontSize: '12px !important' }} />
                    )
                  }
                  color={user.activo ? 'success' : 'default'}
                  sx={{ fontSize: '0.6rem', opacity: isSelf ? 0.5 : 1 }}
                />
              )}
            </Stack>
          );
        },
      },
      {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        render: (user) => (
          <Tooltip title="Editar Usuario">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                logic.handleEditUser(user);
              }}
              size="small"
              disabled={logic.toggleStatusMutation.isPending}
              sx={{
                color: 'text.secondary',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [theme, logic]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* CABECERA ESTANDARIZADA */}
      <AdminPageHeader
        title="Gestión de Usuarios"
        subtitle="Control de accesos, roles y seguridad perimetral"
        action={
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={logic.createModal.open}
            sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            Nuevo Usuario
          </Button>
        }
      />

      {/* MÉTRICAS */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 5 }}>
        <StatCard
          title="Total Usuarios"
          value={statsWithAdmins.total}
          icon={<GroupIcon />}
          color="primary"
          loading={logic.isLoading}
          subtitle="Base de datos"
        />
        <StatCard
          title="Activos"
          value={statsWithAdmins.activos}
          icon={<CheckCircle />}
          color="success"
          loading={logic.isLoading}
          subtitle="Con acceso"
        />
        <StatCard
          title="Verificados"
          value={statsWithAdmins.confirmados}
          icon={<MarkEmailRead />}
          color="info"
          loading={logic.isLoading}
          subtitle="Email validado"
        />
        <StatCard
          title="Seguridad 2FA"
          value={statsWithAdmins.con2FA}
          icon={<Security />}
          color="warning"
          loading={logic.isLoading}
          subtitle="Capa extra"
        />
        <StatCard
          title="Administradores"
          value={statsWithAdmins.admins}
          icon={<AdminPanelSettings />}
          color="error"
          loading={logic.isLoading}
          subtitle="Rol elevado"
        />
      </MetricsGrid>

      {/* FILTROS */}
      <FilterBar sx={{ mb: 3 }}>
        <FilterSearch
          placeholder="Buscar por nombre, email o usuario..."
          value={logic.searchTerm}
          onSearch={logic.setSearchTerm}
          sx={{ flexGrow: 1 }}
        />

        <FilterSelect
          label="Filtrar por Estado"
          value={logic.filterStatus}
          onChange={(e) => logic.setFilterStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos los estados</MenuItem>
          <MenuItem value="active">Solo Activos</MenuItem>
          <MenuItem value="inactive">Solo Inactivos</MenuItem>
        </FilterSelect>
      </FilterBar>

      {/* TABLA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.users}
          getRowKey={(user) => user.id}
          isRowActive={(user) => user.activo}
          showInactiveToggle={false}
          highlightedRowId={logic.highlightedUserId}
          emptyMessage="No se encontraron usuarios."
          pagination
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* MODALES */}
      <CreateUserModal
        open={logic.createModal.isOpen}
        onClose={logic.createModal.close}
        onSubmit={(data) => logic.createMutation.mutateAsync(data)}
        isLoading={logic.createMutation.isPending}
      />

      {logic.editingUser && (
        <EditUserModal
          open={logic.editModal.isOpen}
          onClose={() => {
            logic.editModal.close();
            logic.setEditingUser(null);
          }}
          user={logic.editingUser}
          onSubmit={async (id, data) => {
            await logic.updateMutation.mutateAsync({ id, data });
          }}
          isLoading={logic.updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={() =>
          logic.confirmDialog.data &&
          logic.toggleStatusMutation.mutate(logic.confirmDialog.data)
        }
        isLoading={logic.toggleStatusMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminUsuarios;
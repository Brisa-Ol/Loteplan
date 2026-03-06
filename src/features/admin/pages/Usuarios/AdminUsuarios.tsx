// src/features/admin/pages/Usuarios/AdminUsuarios.tsx

import type { UsuarioDto } from '@/core/types/dto/usuario.dto';
import {
  AdminPageHeader, ConfirmDialog, DataTable, FilterBar, FilterSearch,
  FilterSelect, MetricsGrid, PageContainer,
  QueryHandler, StatCard, type DataTableColumn
} from '@/shared';
import {
  CheckCircle,
  Edit as EditIcon,
  Group as GroupIcon, MarkEmailRead,
  PersonAdd, RestartAlt, Security, Visibility
} from '@mui/icons-material';
import {
  alpha, Avatar, Box, Button, Chip, IconButton,
  MenuItem, Stack,
  Switch,
  TextField, Tooltip, Typography
} from '@mui/material';
import React, { useMemo } from 'react';
import { useAdminUsuarios } from '../../hooks/usuario/useAdminUsuarios';
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';
import ModalDetalleUsuario from './modals/ModalDetalleUsuario';

const useUserColumns = (logic: ReturnType<typeof useAdminUsuarios>) => {
  return useMemo<DataTableColumn<UsuarioDto>[]>(() => [
    {
      id: 'identidad',
      label: 'Usuario / Identidad',
      minWidth: 240,
      cardPrimary: true, // Destacado en vista móvil
      sortable: true,
      render: (u) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 38, height: 38, fontWeight: 800,
            bgcolor: u.activo ? alpha('#CC6333', 0.1) : alpha('#666', 0.1),
            color: u.activo ? '#CC6333' : '#999',
          }}>
            {u.nombre_usuario.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} noWrap>{u.nombre} {u.apellido}</Typography>
            <Typography variant="caption" color="primary.main" display="block" sx={{ fontWeight: 600 }}>@{u.nombre_usuario}</Typography>
            <Typography variant="caption" color="text.secondary">DNI: {u.dni}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'email', // Usamos el ID real para que el sort funcione
      label: 'Contacto',
      minWidth: 200,
      cardSecondary: true,
      sortable: true,
      render: (u) => (
        <Box>
          <Typography variant="body2" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {u.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tel: {u.numero_telefono}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'fecha_registro',
      label: 'Registro',
      minWidth: 120,
      sortable: true,
      hideOnMobile: true, // Limpia la tabla en tablets
      render: (u) => (
        <Typography variant="body2">
          {new Date(u.fecha_registro || u.createdAt || '').toLocaleDateString('es-AR')}
        </Typography>
      ),
    },
    {
      id: 'activo',
      label: 'Estado',
      align: 'center',
      minWidth: 120,
      render: (u) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Switch
            checked={u.activo}
            onChange={() => logic.handleToggleStatusClick(u)}
            size="small"
            disabled={u.rol === 'admin' || u.id === logic.currentUser?.id}
            color="success"
          />
          <Chip
            label={u.activo ? 'ACTIVO' : 'INACTIVO'}
            size="small"
            variant={u.activo ? 'filled' : 'outlined'}
            color={u.activo ? 'success' : 'default'}
            sx={{ fontSize: '0.6rem', fontWeight: 800, width: 75 }}
          />
        </Stack>
      ),
    },
    {
      id: 'acciones',
      label: 'Acciones', // Dejar vacío ayuda a que la columna no se estire por el texto del header
      align: 'right',
      minWidth: 80, // Un ancho fijo pequeño para los dos botones
      render: (u) => (
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          sx={{ width: 'fit-content', ml: 'auto' }} // Fuerza a que el contenedor no se estire
        >
          <Tooltip title="Ver Detalle">
            <IconButton onClick={(e) => { e.stopPropagation(); logic.handleViewUser(u); }} size="small" color="info">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton onClick={(e) => { e.stopPropagation(); logic.handleEditUser(u); }} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [logic]);
};

const AdminUsuarios: React.FC = () => {
  const logic = useAdminUsuarios();
  const columns = useUserColumns(logic);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Gestión de Usuarios"
        subtitle="Control de accesos y perfiles de inversores."
        action={
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={logic.createModal.open}
            sx={{ fontWeight: 800, px: 3, py: 1.2, borderRadius: 2 }}
          >
            Nuevo Usuario
          </Button>
        }
      />

      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }} sx={{ mb: 4 }}>
        <StatCard title="Total" value={logic.stats.total} icon={<GroupIcon />} color="primary" />
        <StatCard title="Activos" value={logic.stats.activos} icon={<CheckCircle />} color="success" />
        <StatCard title="KYC" value={logic.stats.confirmados} icon={<MarkEmailRead />} color="info" />
        <StatCard title="2FA" value={logic.stats.con2FA} icon={<Security />} color="warning" />
      </MetricsGrid>

      <FilterBar sx={{ mb: 3 }}>
        <Stack spacing={2} width="100%">
          <FilterSearch
            placeholder="Buscar por DNI, nombre..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1fr 0.5fr' }, gap: 2 }}>
            <FilterSelect
              label="Estado"
              value={logic.filterStatus}
              onChange={(e) => logic.setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
            </FilterSelect>
            <TextField type="date" label="Desde" value={logic.startDate} onChange={(e) => logic.setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <TextField type="date" label="Hasta" value={logic.endDate} onChange={(e) => logic.setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <Button startIcon={<RestartAlt />} onClick={logic.clearFilters}>Limpiar</Button>
          </Box>
        </Stack>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.users}
          getRowKey={(u) => u.id}
          pagination
          loading={logic.isLoading} // Conecta con el skeleton interno
          isRowActive={(u) => u.activo} // Opacidad automática para inactivos
          onRowClick={(u) => logic.handleViewUser(u)} // Click en fila para ver detalle
          emptyMessage="No se encontraron usuarios con los filtros aplicados"
        />
      </QueryHandler>

      {/* --- MODALES --- */}
      <CreateUserModal
        open={logic.createModal.isOpen}
        onClose={logic.createModal.close}
        onSubmit={(data) => logic.createMutation.mutateAsync(data)}
        isLoading={logic.createMutation.isPending}
      />

      <ModalDetalleUsuario
        open={logic.detailModal.isOpen}
        datosSeleccionados={logic.editingUser}
        onClose={() => {
          logic.detailModal.close();
          logic.setEditingUser(null);
        }}
      />

      {logic.editingUser && (
        <EditUserModal
          open={logic.editModal.isOpen}
          user={logic.editingUser}
          onClose={() => {
            logic.editModal.close();
            logic.setEditingUser(null);
          }}
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
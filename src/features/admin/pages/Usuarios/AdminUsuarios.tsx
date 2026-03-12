// src/features/admin/pages/Usuarios/AdminUsuarios.tsx

import { env } from '@/core/config/env';
import {
  AdminPageHeader, DataTable, MetricsGrid,
  PageContainer, QueryHandler, StatCard,
} from '@/shared';
import {
  CheckCircle, Group as GroupIcon,
  MarkEmailRead, PersonAdd, Security,
} from '@mui/icons-material';
import { Button } from '@mui/material';
import React from 'react';
import { useAdminUsuarios } from '../../hooks/usuario/useAdminUsuarios';
import UserFiltersBar from './components/UserFiltersBar';
import UserModalsSection from './components/UserModalsSection';
import useUserColumns from './hooks/useUserColumns';

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
        <StatCard title="Total de usuarios" value={logic.stats.total} icon={<GroupIcon />} color="primary" />
        <StatCard title="Usuarios activos" value={logic.stats.activos} icon={<CheckCircle />} color="success" />
        <StatCard title="Usuarios Validados" value={logic.stats.confirmados} icon={<MarkEmailRead />} color="info" />
        <StatCard title="Usuario con 2fa activo" value={logic.stats.con2FA} icon={<Security />} color="warning" />
      </MetricsGrid>

      <UserFiltersBar
        searchTerm={logic.searchTerm} setSearchTerm={logic.setSearchTerm}
        filterStatus={logic.filterStatus} setFilterStatus={logic.setFilterStatus}
        startDate={logic.startDate} setStartDate={logic.setStartDate}
        endDate={logic.endDate} setEndDate={logic.setEndDate}
        clearFilters={logic.clearFilters}
      />

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.users}
          getRowKey={(u) => u.id}
          pagination
          defaultRowsPerPage={env.defaultPageSize}
          loading={logic.isLoading}
          isRowActive={(u) => u.activo}
          onRowClick={(u) => logic.handleViewUser(u)}
          emptyMessage="No se encontraron usuarios con los filtros aplicados"
        />
      </QueryHandler>

      <UserModalsSection logic={logic} />
    </PageContainer>
  );
};

export default AdminUsuarios;
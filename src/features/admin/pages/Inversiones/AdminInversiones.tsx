// src/features/admin/pages/Inversiones/AdminInversiones.tsx

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import { DataTable } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { env } from '@/core/config/env';
import React from 'react';
import { useAdminInversiones } from '../../hooks/finanzas/useAdminInversiones';
import InversionesFiltersBar from './components/InversionesFiltersBar';
import InversionesMetrics from './components/InversionesMetrics';
import useInversionesColumns from './hooks/useInversionesColumns';
import useInversionesDateFilter from './hooks/useInversionesDateFilter';
import DetalleInversionModal from './modals/DetalleInversionModal';

const AdminInversiones: React.FC = () => {
  const logic = useAdminInversiones();
  const { startDate, setStartDate, endDate, setEndDate, filteredData, clearDates } = useInversionesDateFilter(logic.filteredInversiones);
  const columns = useInversionesColumns(logic);

  const handleClearFilters = () => {
    clearDates();
    logic.setSearchTerm('');
    logic.setFilterStatus('all');
    logic.setFilterProject('all');
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader title="Gestión de Inversiones" subtitle="Registro histórico de ingresos y capital directo." />

      <InversionesMetrics data={filteredData} isLoading={logic.isLoading} hasDateFilter={!!(startDate || endDate)} />

      <InversionesFiltersBar
        logic={logic}
        startDate={startDate} endDate={endDate}
        onStartDateChange={setStartDate} onEndDateChange={setEndDate}
        onClear={handleClearFilters}
      />

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns} data={filteredData}
          getRowKey={(row) => row.id} isRowActive={(row) => row.activo}
          pagination defaultRowsPerPage={env.defaultPageSize}
        />
      </QueryHandler>

      {logic.selectedInversion && (
        <DetalleInversionModal
          open={logic.modales.detail.isOpen}
          onClose={logic.handleCloseModal}
          inversion={logic.selectedInversion}
        />
      )}
    </PageContainer>
  );
};

export default AdminInversiones;
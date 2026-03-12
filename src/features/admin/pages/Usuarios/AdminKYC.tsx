// src/features/admin/pages/Usuarios/AdminKYC.tsx

import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/kyc.dto';
import { AdminPageHeader, DataTable, MetricsGrid, PageContainer, QueryHandler, StatCard } from '@/shared';
import {
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  HighlightOff as RejectedIcon,
  Schedule,
} from '@mui/icons-material';
import { LinearProgress, Stack, Typography } from '@mui/material';
import React, { memo, useMemo } from 'react';
import { useAdminKYC } from '../../hooks/usuario/useAdminKYC';
import KycModalsSection from './components/KycModalsSection';
import KycTabsBar from './components/KycTabsBar';
import useKycColumns from './hooks/useKycColumns';

// ============================================================================
// COMPONENTE: MÉTRICAS
// ============================================================================
const KYCMetrics = memo<{
  pending: number; approved: number; rejected: number; total: number; isLoading?: boolean;
}>(({ pending, approved, rejected, total, isLoading }) => (
  <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
    <StatCard title="Pendientes" value={pending.toString()} subtitle="Esperando revisión" icon={<Schedule />} color="warning" loading={isLoading} />
    <StatCard title="Aprobadas" value={approved.toString()} subtitle="Usuarios verificados" icon={<CheckCircleIcon />} color="success" loading={isLoading} />
    <StatCard title="Rechazadas" value={rejected.toString()} subtitle="Solicitudes fallidas" icon={<RejectedIcon />} color="error" loading={isLoading} />
    <StatCard title="Historial" value={total.toString()} subtitle="Total procesadas" icon={<HistoryIcon />} color="info" loading={isLoading} />
  </MetricsGrid>
));

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminKYC: React.FC = () => {
  const logic = useAdminKYC();
  const columns = useKycColumns(logic);

  const metrics = useMemo(() => ({
    pending: logic.currentTab === 'pendiente' ? logic.kycList.length : 0,
    approved: logic.currentTab === 'aprobada' ? logic.kycList.length : 0,
    rejected: logic.currentTab === 'rechazada' ? logic.kycList.length : 0,
    total: logic.currentTab === 'todas' ? logic.kycList.length : 0,
  }), [logic.kycList, logic.currentTab]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Validación de Identidad (KYC)"
        subtitle="Cumplimiento normativo y seguridad de cuentas"
        action={
          (logic.isApproving || logic.isRejecting) && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" fontWeight={700}>Procesando resolución...</Typography>
              <LinearProgress sx={{ width: 100, borderRadius: 1 }} />
            </Stack>
          )
        }
      />

      <KYCMetrics {...metrics} isLoading={logic.isLoading} />

      <KycTabsBar currentTab={logic.currentTab} onChange={logic.setCurrentTab} />

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.kycList}
          getRowKey={(row: KycDTO) => row.id}
          pagination
          defaultRowsPerPage={env.defaultPageSize}
          loading={logic.isLoading}
          onRowClick={(row: KycDTO) => logic.handleOpenDetails(row)}
          emptyMessage="No se encontraron solicitudes de verificación para este estado."
          cardTitleColumn="usuario"
        />
      </QueryHandler>

      <KycModalsSection logic={logic} />
    </PageContainer>
  );
};

export default AdminKYC;
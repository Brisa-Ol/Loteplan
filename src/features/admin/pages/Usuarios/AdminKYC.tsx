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
import { Box, CircularProgress, Stack, Typography, alpha, useTheme } from '@mui/material';
import React, { memo } from 'react';
import { useAdminKYC } from '../../hooks/usuario/useAdminKYC';
import KycModalsSection from './components/KycModalsSection';
import KycTabsBar from './components/KycTabsBar';
import useKycColumns from './hooks/useKycColumns';

// ============================================================================
// COMPONENTE: MÉTRICAS
// ============================================================================
const KYCMetrics = memo<{
  pending: number | string; 
  approved: number | string; 
  rejected: number | string; 
  total: number | string; 
  isLoading?: boolean;
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
  const theme = useTheme();
  const logic = useAdminKYC();
  const columns = useKycColumns(logic);

  // ❌ ELIMINAMOS el useMemo de métricas local que fallaba al cambiar de tab.

  return (
    <PageContainer maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={4}>
        
        <AdminPageHeader
          title="Validación de Identidad (KYC)"
          subtitle="Cumplimiento normativo y seguridad de cuentas"
          action={
            (logic.isApproving || logic.isRejecting) && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  px: 2, 
                  py: 1, 
                  bgcolor: alpha(theme.palette.warning.main, 0.1), 
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  borderRadius: 50 
                }}
              >
                <CircularProgress size={16} color="warning" thickness={5} />
                <Typography variant="overline" color="warning.dark" lineHeight={1} sx={{ mt: 0.2 }}>
                  Procesando...
                </Typography>
              </Box>
            )
          }
        />

        {/* ✅ Ahora las métricas vienen directamente del backend a través de globalMetrics */}
        <KYCMetrics {...logic.globalMetrics} isLoading={logic.isLoading} />

        <Box>
          <KycTabsBar currentTab={logic.currentTab} onChange={logic.setCurrentTab} />
          
          <Box sx={{ mt: 2 }}>
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
          </Box>
        </Box>

        <KycModalsSection logic={logic} />

      </Stack>
    </PageContainer>
  );
};

export default AdminKYC;
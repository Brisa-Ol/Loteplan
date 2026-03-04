// src/features/admin/pages/Usuarios/AdminKYC.tsx

import {
  CheckCircleOutline as ApprovedIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  PendingActions as PendingIcon,
  HighlightOff as RejectedIcon,
  Schedule,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
  TextField
} from '@mui/material';
import React, { memo, useMemo } from 'react';

import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { BaseModal } from '@/shared/components/domain/modals';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { useAdminKYC } from '../../hooks/usuario/useAdminKYC';
import KycDetailModal from './modals/KycDetailModal';

// ============================================================================
// COMPONENTE: MÉTRICAS
// ============================================================================
const KYCMetrics = memo<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  isLoading?: boolean;
}>(({ pending, approved, rejected, total, isLoading }) => {
  return (
    <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
      <StatCard
        title="Pendientes"
        value={pending.toString()}
        subtitle="Esperando revisión"
        icon={<Schedule />}
        color="warning"
        loading={isLoading}
      />
      <StatCard
        title="Aprobadas"
        value={approved.toString()}
        subtitle="Usuarios verificados"
        icon={<CheckCircleIcon />}
        color="success"
        loading={isLoading}
      />
      <StatCard
        title="Rechazadas"
        value={rejected.toString()}
        subtitle="Solicitudes fallidas"
        icon={<RejectedIcon />}
        color="error"
        loading={isLoading}
      />
      <StatCard
        title="Historial"
        value={total.toString()}
        subtitle="Total procesadas"
        icon={<HistoryIcon />}
        color="info"
        loading={isLoading}
      />
    </MetricsGrid>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminKYC();

  const metrics = useMemo(() => ({
    pending: logic.currentTab === 'pendiente' ? logic.kycList.length : 0, 
    approved: logic.currentTab === 'aprobada' ? logic.kycList.length : 0,
    rejected: logic.currentTab === 'rechazada' ? logic.kycList.length : 0,
    total: logic.currentTab === 'todas' ? logic.kycList.length : 0,
  }), [logic.kycList, logic.currentTab]);

  const columns = useMemo<DataTableColumn<KycDTO>[]>(() => [
    {
      id: 'usuario',
      label: 'Solicitante',
      minWidth: 220,
      sortable: true,
      cardPrimary: true, // Se destaca en vista móvil
      render: (kyc) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            fontWeight: 800, width: 36, height: 36, borderRadius: '10px'
          }}>
            {kyc.nombre_completo?.[0] || 'U'}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={800} noWrap>{kyc.nombre_completo}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {kyc.usuario?.email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'numero_documento',
      label: 'ID / Documento',
      sortable: true,
      cardSecondary: true, // Subtítulo en vista móvil
      render: (kyc) => (
        <Box>
          <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ display: 'block' }}>
            {kyc.tipo_documento}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            {kyc.numero_documento}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'estado_verificacion',
      label: 'Estado',
      align: 'center',
      sortable: true,
      render: (kyc) => (
        <Chip
          label={kyc.estado_verificacion}
          size="small"
          color={
            kyc.estado_verificacion === 'APROBADA' ? 'success' :
              kyc.estado_verificacion === 'RECHAZADA' ? 'error' : 'warning'
          }
          sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 1.5, minWidth: 100 }}
        />
      ),
    },
    {
      id: 'acciones',
      label: '', // Label vacío para comprimir el espacio
      align: 'right',
      render: (kyc) => (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Tooltip title="Abrir Expediente">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Evita el click de la fila si existiera
                logic.handleOpenDetails(kyc);
              }}
              sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.08), 
                color: 'info.main', 
                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) } 
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [theme, logic]);

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

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 0.5 }}>
        <Tabs
          value={logic.currentTab}
          onChange={(_, v) => logic.setCurrentTab(v)}
          variant="scrollable"
          sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', borderRadius: 2, minHeight: 44 } }}
        >
          <Tab icon={<PendingIcon fontSize="small" />} iconPosition="start" label="Pendientes" value="pendiente" />
          <Tab icon={<ApprovedIcon fontSize="small" />} iconPosition="start" label="Aprobadas" value="aprobada" />
          <Tab icon={<RejectedIcon fontSize="small" />} iconPosition="start" label="Rechazadas" value="rechazada" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Historial Completo" value="todas" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.kycList}
          getRowKey={(row) => row.id}
          pagination
          loading={logic.isLoading} // Activa el Skeleton automático del DataTable
          onRowClick={(row) => logic.handleOpenDetails(row)} // Fila clickeable
          emptyMessage="No se encontraron solicitudes de verificación para este estado."
          cardTitleColumn="usuario" // Define el título en vista móvil
        />
      </QueryHandler>

      {/* --- MODALES --- */}
      <KycDetailModal
        open={logic.detailsModal.isOpen}
        onClose={logic.detailsModal.close}
        kyc={logic.selectedKyc}
        onApprove={logic.handleApproveClick}
        onReject={logic.handleOpenRejectInput}
      />

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={logic.handleConfirmApprove}
        isLoading={logic.isApproving}
      />

      <BaseModal
        open={logic.rejectModal.isOpen}
        onClose={logic.rejectModal.close}
        title="Rechazar Verificación"
        subtitle={`Usuario: ${logic.selectedKyc?.nombre_completo}`}
        icon={<RejectedIcon />}
        headerColor="error"
        confirmText="Confirmar Rechazo"
        confirmButtonColor="error"
        onConfirm={logic.handleConfirmReject}
        isLoading={logic.isRejecting}
        disableConfirm={!logic.rejectReason.trim()}
      >
        <Stack spacing={3}>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
            Indique el motivo por el cual la documentación no es válida. El usuario recibirá esta notificación por correo electrónico.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo del rechazo"
            placeholder="Ej: El DNI está vencido o la selfie es borrosa..."
            value={logic.rejectReason}
            onChange={(e) => logic.setRejectReason(e.target.value)}
            autoFocus
          />
        </Stack>
      </BaseModal>
    </PageContainer>
  );
};

export default AdminKYC;
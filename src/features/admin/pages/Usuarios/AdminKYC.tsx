import {
  CheckCircleOutline as ApprovedIcon,
  Badge as BadgeIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  PendingActions as PendingIcon,
  HighlightOff as RejectedIcon,
  Schedule,
  Visibility as VisibilityIcon,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { memo, useMemo } from 'react';

// --- COMPONENTES ESTANDARIZADOS ---
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';

// --- MODALES ---
import KycDetailModal from './modals/KycDetailModal';

// --- TYPES & HOOKS ---
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { useAdminKYC } from '../../hooks/useAdminKYC';

// ============================================================================
// COMPONENTE: MÉTRICAS (Memoizado)
// ============================================================================
const KYCMetrics = memo<{
  metrics: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  isLoading?: boolean;
}>(({ metrics, isLoading }) => {
  const approvalRate = metrics.total > 0 
    ? ((metrics.approved / metrics.total) * 100).toFixed(1) 
    : '0';
  const rejectionRate = metrics.total > 0 
    ? ((metrics.rejected / metrics.total) * 100).toFixed(1) 
    : '0';

  return (
    <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
      <StatCard
        title="Pendientes"
        value={metrics.pending.toString()}
        subtitle="Requieren atención"
        icon={<Schedule />}
        color="warning"
        loading={isLoading}
      />
      <StatCard
        title="Aprobadas"
        value={metrics.approved.toString()}
        subtitle={`${approvalRate}% del total`}
        icon={<CheckCircleIcon />}
        color="success"
        loading={isLoading}
      />
      <StatCard
        title="Rechazadas"
        value={metrics.rejected.toString()}
        subtitle={`${rejectionRate}% del total`}
        icon={<RejectedIcon />}
        color="error"
        loading={isLoading}
      />
      <StatCard
        title="Total Procesadas"
        value={metrics.total.toString()}
        subtitle="Historial completo"
        icon={<HistoryIcon />}
        color="info"
        loading={isLoading}
      />
    </MetricsGrid>
  );
});

KYCMetrics.displayName = 'KYCMetrics';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminKYC();

  // ✨ CÁLCULO DE MÉTRICAS (Solo cuenta sobre data cruda, no filtrada)
  const metrics = useMemo(() => {
    // Necesitamos contar sobre TODA la data, no solo el tab actual
    // Como solo cargamos el tab activo, necesitamos una estrategia diferente
    
    // Opción 1: Usar la data del tab actual y hacer conteo parcial
    // Opción 2: Hacer queries separadas solo para conteo
    // Para simplificar, usamos la data disponible del tab actual
    
    const all = logic.kycList || [];
    
    return {
      pending: logic.currentTab === 'pendiente' ? all.length : 0,
      approved: logic.currentTab === 'aprobada' ? all.length : 0,
      rejected: logic.currentTab === 'rechazada' ? all.length : 0,
      total: logic.currentTab === 'todas' ? all.length : 0,
    };
  }, [logic.kycList, logic.currentTab]);

  // ✨ COLUMNAS OPTIMIZADAS
  const columns = useMemo<DataTableColumn<KycDTO>[]>(
    () => [
      {
        id: 'usuario',
        label: 'Solicitante',
        minWidth: 220,
        render: (kyc) => (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 800,
                width: 36,
                height: 36,
                borderRadius: '10px',
              }}
            >
              {kyc.nombre_completo?.[0] || 'U'}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {kyc.nombre_completo}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {kyc.usuario?.email || `ID: ${kyc.id_usuario}`}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'documento',
        label: 'Documentación',
        minWidth: 180,
        hideOnMobile: true,
        render: (kyc) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {kyc.tipo_documento}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: alpha(theme.palette.action.selected, 0.5),
                  px: 0.8,
                  py: 0.2,
                  borderRadius: 1,
                  display: 'inline-block',
                }}
              >
                {kyc.numero_documento}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'fecha',
        label: 'Fecha Solicitud',
        hideOnMobile: true,
        render: (kyc) => {
          const fecha = kyc.createdAt || kyc.fecha_creacion;
          return (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {fecha
                ? new Date(fecha).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </Typography>
          );
        },
      },
      {
        id: 'estado_verificacion',
        label: 'Estado',
        align: 'center',
        render: (kyc) => {
          const configs: Record<string, { color: any; icon: any }> = {
            APROBADA: { color: 'success', icon: <ApprovedIcon fontSize="small" /> },
            RECHAZADA: { color: 'error', icon: <RejectedIcon fontSize="small" /> },
            PENDIENTE: { color: 'warning', icon: <PendingIcon fontSize="small" /> },
          };
          const config = configs[kyc.estado_verificacion] || configs.PENDIENTE;

          return (
            <Chip
              label={kyc.estado_verificacion}
              size="small"
              icon={config.icon}
              color={config.color}
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                minWidth: 110,
                borderRadius: '8px',
              }}
              variant={kyc.estado_verificacion === 'PENDIENTE' ? 'filled' : 'outlined'}
            />
          );
        },
      },
      {
        id: 'acciones',
        label: 'Acciones',
        align: 'right',
        render: (kyc) => (
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Tooltip title="Ver Detalles">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  logic.handleOpenDetails(kyc);
                }}
                sx={{
                  color: 'info.main',
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  borderRadius: '8px',
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {kyc.estado_verificacion === 'PENDIENTE' && (
              <>
                <Tooltip title="Aprobar">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      logic.handleApproveClick(kyc);
                    }}
                    disabled={logic.isApproving}
                    sx={{
                      color: 'success.main',
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      borderRadius: '8px',
                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.15) },
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rechazar">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      logic.handleOpenRejectInput(kyc);
                    }}
                    sx={{
                      color: 'error.main',
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      borderRadius: '8px',
                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        ),
      },
    ],
    [logic, theme]
  );

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Gestión KYC"
        subtitle="Verificación de identidad y cumplimiento legal"
        action={
          logic.isApproving || logic.isRejecting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
              <Typography variant="caption">Procesando solicitud...</Typography>
              <LinearProgress sx={{ width: 150, borderRadius: 1 }} />
            </Box>
          ) : undefined
        }
      />

      {/* Alert de pendientes */}
      {metrics.pending > 0 && logic.currentTab !== 'pendiente' && (
        <AlertBanner
          severity="warning"
          title="Verificaciones Pendientes"
          message={`Hay ${metrics.pending} solicitud${
            metrics.pending !== 1 ? 'es' : ''
          } de identidad esperando revisión manual.`}
          action={{
            label: 'Revisar Ahora',
            onClick: () => logic.setCurrentTab('pendiente'),
          }}
          icon={<Warning />}
        />
      )}

      {/* Métricas */}
      <KYCMetrics metrics={metrics} isLoading={logic.isLoading} />

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          p: 0.5,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}
      >
        <Tabs
          value={logic.currentTab}
          onChange={(_, v) => logic.setCurrentTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              minHeight: 48,
              borderRadius: '8px',
              mx: 0.5,
              textTransform: 'none',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            },
          }}
        >
          <Tab
            icon={<PendingIcon fontSize="small" />}
            iconPosition="start"
            label="Pendientes"
            value="pendiente"
          />
          <Tab
            icon={<ApprovedIcon fontSize="small" />}
            iconPosition="start"
            label="Aprobadas"
            value="aprobada"
          />
          <Tab
            icon={<RejectedIcon fontSize="small" />}
            iconPosition="start"
            label="Rechazadas"
            value="rechazada"
          />
          <Tab
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label="Historial"
            value="todas"
          />
        </Tabs>
      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.kycList}
          getRowKey={(row) => row.id}
          isRowActive={(row) =>
            logic.currentTab === 'todas' ? row.estado_verificacion === 'PENDIENTE' : true
          }
          showInactiveToggle={logic.currentTab === 'todas'}
          inactiveLabel="Ver Procesadas"
          highlightedRowId={logic.highlightedId}
          emptyMessage={`No hay solicitudes ${
            logic.currentTab === 'todas' ? '' : logic.currentTab.toLowerCase()
          } para mostrar.`}
          pagination
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales */}
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

      <Dialog
        open={logic.rejectModal.isOpen}
        onClose={logic.rejectModal.close}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', boxShadow: theme.shadows[10] } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            El usuario será notificado del motivo y deberá volver a subir sus documentos.
          </Alert>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Motivo del rechazo"
            placeholder="Ej: La imagen del DNI es borrosa o está cortada..."
            value={logic.rejectReason}
            onChange={(e) => logic.setRejectReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={logic.rejectModal.close} color="inherit" sx={{ fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={logic.handleConfirmReject}
            disabled={!logic.rejectReason.trim() || logic.isRejecting}
            sx={{ fontWeight: 600, px: 3 }}
          >
            {logic.isRejecting ? 'Procesando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AdminKYC;
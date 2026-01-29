import React, { useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, IconButton, Tabs, Tab, Tooltip, useTheme, Alert, alpha, Button
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PendingActions as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
  HighlightOff as RejectedIcon,
  AssignmentInd as KpiIcon,
  Badge as BadgeIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import KycDetailModal from './modals/KycDetailModal';
import { useAdminKYC } from '../../hooks/useAdminKYC';
import type { KycDTO } from '../../../../core/types/dto/kyc.dto';

const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminKYC();

  // DEFINICIÓN DE COLUMNAS
  const columns = useMemo<DataTableColumn<KycDTO>[]>(() => [
    {
      id: 'usuario', label: 'Solicitante', minWidth: 260,
      render: (kyc) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: 'primary.main', 
            fontWeight: 800, 
            width: 40, height: 40 
          }}>
            {kyc.nombre_completo?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {kyc.nombre_completo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {kyc.usuario?.email || `ID Usuario: ${kyc.id_usuario}`}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'documento', label: 'Documentación', minWidth: 200,
      render: (kyc) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BadgeIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          <Box>
            <Typography variant="body2" fontWeight={700}>{kyc.tipo_documento}</Typography>
            <Typography variant="caption" sx={{ 
                fontFamily: 'monospace', 
                bgcolor: alpha(theme.palette.action.selected, 0.5), 
                px: 0.8, py: 0.2, borderRadius: 1 
            }}>
              {kyc.numero_documento}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'fecha', label: 'Fecha Solicitud',
      render: (kyc) => (
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {kyc.fecha_creacion 
            ? new Date(kyc.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : '-'}
        </Typography>
      )
    },
    {
      id: 'estado_verificacion', label: 'Estado', align: 'center',
      render: (kyc) => {
        const configs: Record<string, { color: any, icon: any }> = {
          APROBADA: { color: 'success', icon: <ApprovedIcon fontSize="small" /> },
          RECHAZADA: { color: 'error', icon: <RejectedIcon fontSize="small" /> },
          PENDIENTE: { color: 'warning', icon: <PendingIcon fontSize="small" /> }
        };
        const config = configs[kyc.estado_verificacion] || configs.PENDIENTE;

        return (
          <Chip
            label={kyc.estado_verificacion}
            size="small"
            icon={config.icon}
            color={config.color}
            sx={{ fontWeight: 800, fontSize: '0.65rem', minWidth: 110 }}
            variant={kyc.estado_verificacion === 'PENDIENTE' ? 'filled' : 'outlined'}
          />
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (kyc) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Ver Detalles">
            <IconButton
              size="small"
              onClick={() => logic.handleOpenDetails(kyc)}
              sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05) }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {kyc.estado_verificacion === 'PENDIENTE' && (
            <>
              <Tooltip title="Aprobar">
                <IconButton
                  size="small"
                  onClick={() => logic.handleApproveClick(kyc)}
                  disabled={logic.isApproving}
                  sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05) }}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rechazar">
                <IconButton
                  size="small"
                  onClick={() => logic.handleOpenRejectInput(kyc)}
                  sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader 
        title="Gestión KYC" 
        subtitle="Verificación de identidad y validación de cumplimiento legal para usuarios registrados." 
      />

      {/* Selector de Vistas (Tabs) */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 2, 
          p: 0.5,
          bgcolor: alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <Tabs
          value={logic.currentTab}
          onChange={(_, v) => logic.setCurrentTab(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ '& .MuiTab-root': { fontWeight: 700, minHeight: 48, borderRadius: 1.5, mx: 0.5 } }}
        >
          <Tab icon={<PendingIcon fontSize="small" />} iconPosition="start" label="Pendientes" value="pendiente" />
          <Tab icon={<ApprovedIcon fontSize="small" />} iconPosition="start" label="Aprobadas" value="aprobada" />
          <Tab icon={<RejectedIcon fontSize="small" />} iconPosition="start" label="Rechazadas" value="rechazada" />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Historial" value="todas" />
        </Tabs>
      </Paper>

      {/* Tabla Principal */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
          columns={columns}
          data={logic.kycList}
          getRowKey={(row) => row.id}
          
          isRowActive={(row) => row.estado_verificacion === 'PENDIENTE'}
          showInactiveToggle={logic.currentTab === 'todas'}
          inactiveLabel="Procesadas"
          
          highlightedRowId={logic.highlightedId}
          emptyMessage={`No hay solicitudes ${logic.currentTab} para mostrar.`}
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

      <Dialog open={logic.rejectModal.isOpen} onClose={logic.rejectModal.close} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Rechazar Solicitud de Identidad</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>El usuario podrá ver este motivo y reintentar el envío de documentos.</Alert>
          <TextField
            autoFocus fullWidth multiline rows={3}
            label="Motivo del rechazo"
            placeholder="Ej: El documento no es legible o la selfie no coincide..."
            value={logic.rejectReason}
            onChange={(e) => logic.setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={logic.rejectModal.close} color="inherit">Cancelar</Button>
          <Button variant="contained" color="error" onClick={logic.handleConfirmReject} disabled={!logic.rejectReason.trim() || logic.isRejecting}>
            {logic.isRejecting ? 'Procesando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AdminKYC;
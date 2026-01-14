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
  Badge as BadgeIcon
} from '@mui/icons-material';


import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';

import KycDetailModal from './modals/KycDetailModal';


import { useAdminKYC } from '../../hooks/useAdminKYC';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import type { KycDTO } from '../../../../core/types/dto/kyc.dto';

const AdminKYC: React.FC = () => {
  const theme = useTheme();
  
  // ✅ Usamos el Hook para obtener toda la lógica y estado
  const logic = useAdminKYC();

  // DEFINICIÓN DE COLUMNAS
  const columns = useMemo<DataTableColumn<KycDTO>[]>(() => [
    {
      id: 'usuario', label: 'Solicitante', minWidth: 280,
      render: (kyc) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', width: 40, height: 40 }}>
            {kyc.nombre_completo?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {kyc.nombre_completo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {kyc.usuario?.email || `ID: ${kyc.id_usuario}`}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'documento', label: 'Documentación',
      render: (kyc) => (
        <Stack direction="row" alignItems="center" spacing={1}>
           <BadgeIcon fontSize="small" color="action" />
           <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">{kyc.tipo_documento}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 1 }}>
                {kyc.numero_documento}
            </Typography>
           </Box>
        </Stack>
      )
    },
    {
      id: 'fecha', label: 'Fecha Solicitud',
      render: (kyc) => (
        <Typography variant="body2" color="text.secondary">
          {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </Typography>
      )
    },
    {
      id: 'estado_verificacion', label: 'Estado',
      render: (kyc) => {
        let color: 'success' | 'error' | 'warning' = 'warning';
        let icon = <PendingIcon fontSize="small" />;
        
        if (kyc.estado_verificacion === 'APROBADA') { color = 'success'; icon = <ApprovedIcon fontSize="small" />; }
        if (kyc.estado_verificacion === 'RECHAZADA') { color = 'error'; icon = <RejectedIcon fontSize="small" />; }

        return (
          <Chip 
            label={kyc.estado_verificacion} 
            size="small" 
            icon={icon}
            color={color}
            sx={{ fontWeight: 700, minWidth: 100, justifyContent: 'flex-start' }}
            variant="outlined"
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
                sx={{ color: 'info.main', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
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
                    sx={{ color: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                >
                    <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rechazar">
                <IconButton 
                    size="small" 
                    onClick={() => logic.handleOpenRejectInput(kyc)}
                    sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
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
      <PageHeader title="Gestión KYC" subtitle="Validación de identidad y documentación de usuarios" />
      
      {/* Tabs */}
      <Paper 
        elevation={0} 
        sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6), p: 0.5 }} 
      >
        <Tabs 
            value={logic.currentTab} 
            onChange={(_, v) => logic.setCurrentTab(v)} 
            variant="standard" 
            indicatorColor="primary" 
            textColor="primary"
        >
          <Tab icon={<PendingIcon />} iconPosition="start" label="Pendientes" value="pendiente" />
          <Tab icon={<ApprovedIcon />} iconPosition="start" label="Aprobadas" value="aprobada" />
          <Tab icon={<RejectedIcon />} iconPosition="start" label="Rechazadas" value="rechazada" />
          <Tab icon={<KpiIcon />} iconPosition="start" label="Historial" value="todas" />
        </Tabs>
      </Paper>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
        <DataTable
            columns={columns}
            data={(logic.currentData as KycDTO[]) || []} 
            getRowKey={(row) => row.id} 
            emptyMessage={`No hay solicitudes en estado: ${logic.currentTab}.`}
            highlightedRowId={logic.lastActionId}
            pagination 
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* --- MODALES --- */}
      
      {/* 1. Detalle KYC */}
      <KycDetailModal 
        open={logic.detailsModal.isOpen} 
        onClose={logic.detailsModal.close} 
        kyc={logic.selectedKyc}
        onApprove={logic.handleApproveClick} 
        onReject={logic.handleOpenRejectInput}
      />

      {/* 2. Confirmación Aprobación */}
      <ConfirmDialog 
        controller={logic.confirmDialog}
        onConfirm={logic.handleConfirmApprove}
        isLoading={logic.isApproving}
      />

      {/* 3. Rechazo Manual */}
      <Dialog 
        open={logic.rejectModal.isOpen} 
        onClose={logic.rejectModal.close} 
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
            El usuario deberá volver a subir la documentación.
          </Alert>
          <TextField 
            autoFocus fullWidth multiline rows={3} 
            label="Motivo del rechazo" 
            placeholder="Ej: Documento ilegible..."
            variant="outlined"
            value={logic.rejectReason} 
            onChange={(e) => logic.setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={logic.rejectModal.close} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" color="error" 
            onClick={logic.handleConfirmReject} 
            disabled={!logic.rejectReason.trim() || logic.isRejecting}
          >
            {logic.isRejecting ? 'Procesando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

    </PageContainer>
  );
};

export default AdminKYC;
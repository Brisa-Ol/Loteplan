// src/pages/Admin/KYC/AdminKYC.tsx

import React, { useState, useMemo, useEffect } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { KycDTO } from '../../../types/dto/kyc.dto';
import type { ApiError } from '../../../services/httpService'; // Asegúrate de importar el tipo de error
import kycService from '../../../services/kyc.service';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useSnackbar } from '../../../hooks/useSnackbar';
import GlobalSnackbar from '../../../components/common/GlobalSnackbarProps/GlobalSnackbarProps';
import KycDetailModal from './modals/KycDetailModal';

type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  
  // Hooks
  const { snackbar, showSuccess, showError, handleClose: closeSnackbar } = useSnackbar();
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog<KycDTO>();

  // Estados Locales
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);
  const [lastActionId, setLastActionId] = useState<number | string | null>(null);

  // Helper de Errores
  const getErrorMessage = (error: unknown) => {
    const apiError = error as ApiError;
    return apiError.message || 'Ocurrió un error inesperado';
  };

  // 📡 QUERIES
  const { data: pendingKYCs = [], isLoading: loadingPending, error: errorPending } = useQuery({
    queryKey: ['kycPending'], queryFn: kycService.getPendingVerifications, enabled: currentTab === 'pendiente',
  });
  const { data: approvedKYCs = [], isLoading: loadingApproved, error: errorApproved } = useQuery({
    queryKey: ['kycApproved'], queryFn: kycService.getApprovedVerifications, enabled: currentTab === 'aprobada',
  });
  const { data: rejectedKYCs = [], isLoading: loadingRejected, error: errorRejected } = useQuery({
    queryKey: ['kycRejected'], queryFn: kycService.getRejectedVerifications, enabled: currentTab === 'rechazada',
  });
  const { data: allKYCs = [], isLoading: loadingAll, error: errorAll } = useQuery({
    queryKey: ['kycAll'], queryFn: kycService.getAllProcessedVerifications, enabled: currentTab === 'todas',
  });

  const currentData = useMemo(() => {
    switch (currentTab) {
      case 'pendiente': return pendingKYCs;
      case 'aprobada': return approvedKYCs;
      case 'rechazada': return rejectedKYCs;
      case 'todas': return allKYCs;
      default: return [];
    }
  }, [currentTab, pendingKYCs, approvedKYCs, rejectedKYCs, allKYCs]);

  const isLoading = loadingPending || loadingApproved || loadingRejected || loadingAll;
  const error = errorPending || errorApproved || errorRejected || errorAll;

  useEffect(() => { setLastActionId(null); }, [currentTab]);

  // ⚡ MUTATIONS
  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: () => {
      if (confirmDialog.data?.id) setLastActionId(confirmDialog.data.id);
      
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('Verificación aprobada correctamente'); 
      confirmDialog.close();
      detailsModal.close();
    },
    onError: (err) => {
        confirmDialog.close();
        showError(getErrorMessage(err)); 
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: () => {
      if (kycToReject?.id) setLastActionId(kycToReject.id);

      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('Solicitud rechazada correctamente'); 
      rejectModal.close();
      detailsModal.close();
      setRejectReason('');
    },
    onError: (err) => showError(getErrorMessage(err)), 
  });

  // HANDLERS
  const handleOpenDetails = (kyc: KycDTO) => { setSelectedKyc(kyc); detailsModal.open(); };
  
  const handleApproveClick = (kyc: KycDTO) => {
    confirmDialog.confirm('approve_kyc', kyc);
  };

  const handleConfirmAction = () => {
      if (confirmDialog.action === 'approve_kyc' && confirmDialog.data) {
          approveMutation.mutate(confirmDialog.data.id_usuario);
      }
  };

  const handleOpenRejectInput = (kyc: KycDTO) => { setKycToReject(kyc); setRejectReason(''); rejectModal.open(); };
  
  const handleConfirmReject = () => {
    if (!rejectReason.trim() || !kycToReject) return;
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo: rejectReason });
  };

  // COLUMNS DEFINITION
  const columns: DataTableColumn<KycDTO>[] = useMemo(() => [
    {
      id: 'usuario', label: 'Solicitante', minWidth: 280,
      render: (kyc) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              color: 'primary.main',
              fontWeight: 'bold',
              width: 40, height: 40
            }}
          >
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
                onClick={() => handleOpenDetails(kyc)}
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
                    onClick={() => handleApproveClick(kyc)}
                    disabled={approveMutation.isPending}
                    sx={{ color: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}
                >
                    <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rechazar">
                <IconButton 
                    size="small" 
                    onClick={() => handleOpenRejectInput(kyc)}
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
  ], [currentTab, theme, approveMutation.isPending]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión KYC" subtitle="Validación de identidad y documentación de usuarios" />
      
      <Paper 
        elevation={0} 
        sx={{ 
            mb: 3, 
            borderRadius: 2, 
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            p: 0.5
        }} 
      >
        <Tabs 
            value={currentTab} 
            onChange={(_, v) => setCurrentTab(v)} 
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

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable
            columns={columns}
            data={currentData}
            getRowKey={(row) => row.id} 
            emptyMessage={`No hay solicitudes en estado: ${currentTab}.`}
            highlightedRowId={lastActionId}
            pagination 
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales */}
      <KycDetailModal 
        open={detailsModal.isOpen} onClose={detailsModal.close} kyc={selectedKyc}
        onApprove={handleApproveClick} onReject={handleOpenRejectInput}
      />

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={approveMutation.isPending}
      />

      <Dialog 
        open={rejectModal.isOpen} 
        onClose={rejectModal.close} 
        maxWidth="sm" 
        fullWidth
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
            value={rejectReason} 
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={rejectModal.close} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" color="error" 
            onClick={handleConfirmReject} 
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Procesando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      <GlobalSnackbar {...snackbar} onClose={closeSnackbar} />
    </PageContainer>
  );
};

export default AdminKYC;
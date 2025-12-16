import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Stack, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, IconButton, Tabs, Tab, Tooltip, useTheme, Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon, 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, 
  PendingActions as PendingIcon,
  CheckCircleOutline as ApprovedIcon, 
  HighlightOff as RejectedIcon,
  AssignmentInd as KpiIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


import type { KycDTO } from '../../../types/dto/kyc.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useModal } from '../../../hooks/useModal';
import KycDetailModal from './modals/KycDetailModal';
import kycService from '../../../Services/kyc.service';

type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  
  // Modales
  const detailsModal = useModal();
  const rejectModal = useModal();

  // Estados Locales
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 📡 QUERIES INTELIGENTES (Solo carga lo que ves)
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

  // ⚡ MUTATIONS
  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      setSnackbar({ open: true, message: '✅ Verificación aprobada', severity: 'success' });
      detailsModal.close();
    },
    onError: (err: any) => setSnackbar({ open: true, message: err.response?.data?.mensaje || 'Error al aprobar', severity: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      setSnackbar({ open: true, message: '✅ Solicitud rechazada correctamente', severity: 'success' });
      rejectModal.close();
      detailsModal.close();
      setRejectReason('');
    },
    onError: (err: any) => setSnackbar({ open: true, message: err.response?.data?.mensaje || 'Error al rechazar', severity: 'error' }),
  });

  // HANDLERS
  const handleOpenDetails = (kyc: KycDTO) => { setSelectedKyc(kyc); detailsModal.open(); };
  
  const handleApprove = (kyc: KycDTO) => {
    if (window.confirm(`¿Aprobar a ${kyc.nombre_completo}?`)) approveMutation.mutate(kyc.id_usuario);
  };

  const handleOpenRejectInput = (kyc: KycDTO) => { setKycToReject(kyc); setRejectReason(''); rejectModal.open(); };
  
  const handleConfirmReject = () => {
    if (!rejectReason.trim() || !kycToReject) return;
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo: rejectReason });
  };

  // COLUMNS DEFINITION
  const columns: DataTableColumn<KycDTO>[] = useMemo(() => [
    {
      id: 'usuario', label: 'Usuario', minWidth: 250,
      render: (kyc) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{kyc.nombre_completo?.[0]}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{kyc.nombre_completo}</Typography>
            <Typography variant="caption">{kyc.usuario?.email || `ID: ${kyc.id_usuario}`}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'documento', label: 'Documento',
      render: (kyc) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{kyc.tipo_documento}</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{kyc.numero_documento}</Typography>
        </Box>
      )
    },
    {
      id: 'fecha', label: 'Fecha',
      render: (kyc) => (
        <Typography variant="body2">
          {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString('es-AR') : '-'}
        </Typography>
      )
    },
    {
      id: 'estado_verificacion', label: 'Estado',
      render: (kyc) => (
        <Chip 
          label={kyc.estado_verificacion} 
          size="small" 
          color={kyc.estado_verificacion === 'APROBADA' ? 'success' : kyc.estado_verificacion === 'RECHAZADA' ? 'error' : 'warning'}
          variant={kyc.estado_verificacion === 'PENDIENTE' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 'bold' }}
        />
      )
    },
    {
      id: 'acciones', label: '', align: 'right',
      render: (kyc) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Ver Detalles"><IconButton color="primary" onClick={() => handleOpenDetails(kyc)}><VisibilityIcon /></IconButton></Tooltip>
          {kyc.estado_verificacion === 'PENDIENTE' && (
            <>
              <Tooltip title="Aprobar"><IconButton color="success" onClick={() => handleApprove(kyc)}><CheckCircleIcon /></IconButton></Tooltip>
              <Tooltip title="Rechazar"><IconButton color="error" onClick={() => handleOpenRejectInput(kyc)}><CancelIcon /></IconButton></Tooltip>
            </>
          )}
        </Stack>
      )
    }
  ], [currentTab]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Gestión KYC" subtitle="Validación de identidad de usuarios" />
      
      <Paper sx={{ mb: 3, borderRadius: 2, }} elevation={0} variant="outlined">
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} variant="standard" indicatorColor="primary" textColor="primary">
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
            getRowKey={(row) => row.id} // ✅ Importante: row.id viene del BaseDTO
            emptyMessage={`No hay solicitudes ${currentTab}s.`}
            pagination defaultRowsPerPage={10}
        />
      </QueryHandler>

      <KycDetailModal 
        open={detailsModal.isOpen} onClose={detailsModal.close} kyc={selectedKyc}
        onApprove={handleApprove} onReject={handleOpenRejectInput}
      />

      <Dialog open={rejectModal.isOpen} onClose={rejectModal.close} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>El usuario deberá subir sus documentos nuevamente.</Alert>
          <TextField 
            autoFocus fullWidth multiline rows={3} label="Motivo del rechazo" variant="outlined"
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={rejectModal.close}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReject} disabled={!rejectReason.trim()}>Confirmar Rechazo</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({...s, open: false}))}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminKYC;
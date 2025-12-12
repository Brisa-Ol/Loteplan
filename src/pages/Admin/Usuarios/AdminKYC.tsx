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

import KycDetailModal from './modals/KycDetailModal';
import kycService from '../../../Services/kyc.service';

// ✅ 1. Importar el Hook
import { useModal } from '../../../hooks/useModal';

type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

const AdminKYC: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  
  // ✅ 2. Usar Hooks para los Modales
  const detailsModal = useModal();
  const rejectModal = useModal();

  // Estados de Datos (Separados de la visibilidad)
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // --- Queries (Igual que antes) ---
  const { data: pendingKYCs = [], isLoading: loadingPending, error: errorPending } = useQuery<KycDTO[]>({
    queryKey: ['kycPending'], queryFn: kycService.getPendingVerifications, enabled: currentTab === 'pendiente',
  });
  const { data: approvedKYCs = [], isLoading: loadingApproved, error: errorApproved } = useQuery<KycDTO[]>({
    queryKey: ['kycApproved'], queryFn: kycService.getApprovedVerifications, enabled: currentTab === 'aprobada',
  });
  const { data: rejectedKYCs = [], isLoading: loadingRejected, error: errorRejected } = useQuery<KycDTO[]>({
    queryKey: ['kycRejected'], queryFn: kycService.getRejectedVerifications, enabled: currentTab === 'rechazada',
  });
  const { data: allKYCs = [], isLoading: loadingAll, error: errorAll } = useQuery<KycDTO[]>({
    queryKey: ['kycAll'], queryFn: kycService.getAllProcessedVerifications, enabled: currentTab === 'todas',
  });

  const getCurrentData = () => {
    switch (currentTab) {
      case 'pendiente': return pendingKYCs;
      case 'aprobada': return approvedKYCs;
      case 'rechazada': return rejectedKYCs;
      case 'todas': return allKYCs;
      default: return [];
    }
  };
  const currentData = getCurrentData();
  const isLoading = currentTab === 'pendiente' ? loadingPending : currentTab === 'aprobada' ? loadingApproved : currentTab === 'rechazada' ? loadingRejected : loadingAll;
  const error = currentTab === 'pendiente' ? errorPending : currentTab === 'aprobada' ? errorApproved : currentTab === 'rechazada' ? errorRejected : errorAll;

  // --- Mutaciones ---
  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      setSnackbar({ open: true, message: '✅ Verificación aprobada correctamente', severity: 'success' });
      detailsModal.close(); // ✅ Cerrar con hook
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

      setSnackbar({ open: true, message: '✅ Verificación rechazada', severity: 'success' });
      rejectModal.close(); // ✅ Cerrar con hook
      detailsModal.close(); // ✅ Cerrar con hook
      setRejectReason('');
    },
    onError: (err: any) => setSnackbar({ open: true, message: err.response?.data?.mensaje || 'Error al rechazar', severity: 'error' }),
  });

  // --- Handlers Actualizados ---
  const handleOpenDetails = (kyc: KycDTO) => {
    setSelectedKyc(kyc);
    detailsModal.open(); // ✅
  };

  const handleApprove = (kyc: KycDTO) => {
    if (window.confirm(`¿Estás seguro de APROBAR la identidad de ${kyc.nombre_completo}?`)) {
      approveMutation.mutate(kyc.id_usuario);
    }
  };

  const handleOpenRejectInput = (kyc: KycDTO) => {
    setKycToReject(kyc);
    rejectModal.open(); // ✅
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim() || !kycToReject) return;
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo: rejectReason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'warning';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  // --- Columnas DataTable (Igual que antes) ---
  const columns: DataTableColumn<KycDTO>[] = useMemo(() => {
    const cols: DataTableColumn<KycDTO>[] = [
      {
        id: 'usuario',
        label: 'Usuario Solicitante',
        minWidth: 250,
        render: (kyc) => (
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
              {kyc.nombre_completo?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{kyc.nombre_completo}</Typography>
              <Typography variant="caption" color="text.secondary">{kyc.usuario?.email || `ID: ${kyc.id_usuario}`}</Typography>
            </Box>
          </Stack>
        )
      },
      {
        id: 'documento',
        label: 'Documento',
        render: (kyc) => (
          <Box>
            <Typography variant="body2" fontWeight={500}>{kyc.tipo_documento}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {kyc.numero_documento}
            </Typography>
          </Box>
        )
      },
      {
        id: 'fecha',
        label: 'Fecha Solicitud',
        render: (kyc) => (
          <Box>
            <Typography variant="body2">
                {new Date(kyc.createdAt || '').toLocaleDateString('es-AR')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {new Date(kyc.createdAt || '').toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit'})}
            </Typography>
          </Box>
        )
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (kyc) => (
          <Chip 
            label={kyc.estado_verificacion} 
            size="small" 
            color={getStatusColor(kyc.estado_verificacion) as any} 
            variant={kyc.estado_verificacion === 'PENDIENTE' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        )
      }
    ];

    if (currentTab === 'rechazada' || currentTab === 'todas') {
      cols.push({
        id: 'motivo',
        label: 'Motivo Rechazo',
        render: (kyc) => kyc.motivo_rechazo ? (
          <Tooltip title={kyc.motivo_rechazo}>
              <Typography variant="caption" color="error" sx={{ fontStyle: 'italic', display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {kyc.motivo_rechazo}
              </Typography>
          </Tooltip>
        ) : <Typography variant="caption" color="text.disabled">-</Typography>
      });
    }

    cols.push({
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (kyc) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Ver Detalles">
            <IconButton color="primary" onClick={() => handleOpenDetails(kyc)} size="small">
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          {kyc.estado_verificacion === 'PENDIENTE' && (
            <>
              <Tooltip title="Aprobar">
                  <IconButton color="success" onClick={() => handleApprove(kyc)} size="small">
                      <CheckCircleIcon />
                  </IconButton>
              </Tooltip>
              <Tooltip title="Rechazar">
                  <IconButton color="error" onClick={() => handleOpenRejectInput(kyc)} size="small">
                      <CancelIcon />
                  </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      )
    });
    return cols;
  }, [currentTab, theme]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Verificación de Identidad (KYC)" subtitle="Gestiona las solicitudes de verificación de documentos." />

      <Paper sx={{ mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
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
            getRowKey={(row) => row.id}
            emptyMessage={`No hay solicitudes en ${currentTab}.`}
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ✅ MODALES CON HOOK */}
      <KycDetailModal 
        open={detailsModal.isOpen} 
        onClose={detailsModal.close}
        kyc={selectedKyc}
        onApprove={handleApprove}
        onReject={handleOpenRejectInput}
      />

      <Dialog 
        open={rejectModal.isOpen} 
        onClose={rejectModal.close} 
        maxWidth="sm" fullWidth 
        PaperProps={{ sx: { borderRadius: 2 }}}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Rechazar Verificación</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Al rechazar, el usuario será notificado para subir documentos nuevamente.
          </Alert>
          <TextField 
            autoFocus fullWidth multiline rows={3} 
            label="Motivo del Rechazo" variant="outlined"
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} 
            helperText="Este mensaje será visible para el usuario."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={rejectModal.close} color="inherit">Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReject} disabled={!rejectReason.trim()}>
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} autoHideDuration={4000} 
        onClose={() => setSnackbar(s => ({...s, open: false}))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({...s, open: false}))}>
            {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminKYC;
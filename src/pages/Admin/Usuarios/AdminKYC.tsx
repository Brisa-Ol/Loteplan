import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import kycService from '../../../Services/kyc.service';
import type { KycDTO } from '../../../types/dto/kyc.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

const AdminKYC: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Query
  const { data: pendingKYCs = [], isLoading, error } = useQuery<KycDTO[]>({
    queryKey: ['pendingKYC'],
    queryFn: kycService.getPendingVerifications,
  });

  // Mutaciones
  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingKYC'] });
      setSnackbar({
        open: true,
        message: data.message || '✅ Verificación aprobada',
        severity: 'success',
      });
      setOpenDetails(false);
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '❌ Error al aprobar',
        severity: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingKYC'] });
      setSnackbar({
        open: true,
        message: data.message || '✅ Verificación rechazada',
        severity: 'success',
      });
      setOpenReject(false);
      setOpenDetails(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || '❌ Error al rechazar',
        severity: 'error',
      });
    },
  });

  const handleOpenDetails = (kyc: KycDTO) => {
    setSelectedKyc(kyc);
    setOpenDetails(true);
  };

  const handleApprove = (kyc: KycDTO) => {
    if (window.confirm(`¿Aprobar verificación de ${kyc.nombre_completo}?`)) {
      approveMutation.mutate(kyc.id_usuario);
    }
  };

  const handleOpenReject = (kyc: KycDTO) => {
    setKycToReject(kyc);
    setOpenReject(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Debes especificar un motivo de rechazo');
      return;
    }
    if (kycToReject) {
      rejectMutation.mutate({
        idUsuario: kycToReject.id_usuario,
        motivo: rejectReason,
      });
    }
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Gestión de KYC"
        subtitle="Aprueba o rechaza las solicitudes de verificación de identidad"
      />

      <QueryHandler isLoading={isLoading} error={error as Error}>
        {pendingKYCs.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <PendingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay solicitudes pendientes
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingKYCs.map((kyc) => (
                  <TableRow key={kyc.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {kyc.nombre_completo.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {kyc.nombre_completo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {kyc.usuario?.email || 'Email no disponible'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{kyc.tipo_documento}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {kyc.numero_documento}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(kyc.createdAt || '').toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Chip label="PENDIENTE" color="warning" size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleOpenDetails(kyc)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApprove(kyc)}
                          disabled={approveMutation.isPending}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleOpenReject(kyc)}
                          disabled={rejectMutation.isPending}
                        >
                          Rechazar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>

      {/* Modal de Detalles */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Detalle de Verificación
          </Typography>
          <IconButton onClick={() => setOpenDetails(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedKyc && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Solicitante</Typography>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  {selectedKyc.nombre_completo}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" mt={2}>Documento</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedKyc.tipo_documento}: {selectedKyc.numero_documento}
                </Typography>

                {selectedKyc.fecha_nacimiento && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" mt={2}>
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedKyc.fecha_nacimiento).toLocaleDateString()}
                    </Typography>
                  </>
                )}
              </Box>

              <Box sx={{ flex: 2 }}>
                <Typography variant="h6" gutterBottom>Evidencia</Typography>
                
                <Box mb={3}>
                  <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                    Frente del Documento
                  </Typography>
                  <Box
                    component="img"
                    src={selectedKyc.url_foto_documento_frente}
                    alt="DNI Frente"
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      maxHeight: 300,
                      objectFit: 'contain',
                      bgcolor: '#f5f5f5',
                    }}
                  />
                </Box>

                {selectedKyc.url_foto_documento_dorso && (
                  <Box mb={3}>
                    <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                      Dorso del Documento
                    </Typography>
                    <Box
                      component="img"
                      src={selectedKyc.url_foto_documento_dorso}
                      alt="DNI Dorso"
                      sx={{
                        width: '100%',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        maxHeight: 300,
                        objectFit: 'contain',
                        bgcolor: '#f5f5f5',
                      }}
                    />
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                    Selfie con Documento
                  </Typography>
                  <Box
                    component="img"
                    src={selectedKyc.url_foto_selfie_con_documento}
                    alt="Selfie"
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      maxHeight: 400,
                      objectFit: 'contain',
                      bgcolor: '#f5f5f5',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDetails(false)}>Cerrar</Button>
          {selectedKyc && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleOpenReject(selectedKyc)}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleApprove(selectedKyc)}
              >
                Aprobar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Rechazo */}
      <Dialog open={openReject} onClose={() => setOpenReject(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Verificación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            El usuario deberá volver a enviar su documentación
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo del Rechazo"
            placeholder="Ej: Documento ilegible, selfie no coincide..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReject(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminKYC;
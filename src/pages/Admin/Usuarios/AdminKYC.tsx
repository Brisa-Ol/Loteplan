// src/pages/Admin/AdminKYC.tsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from '@mui/material';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import ApproveIcon from '@mui/icons-material/CheckCircle';
import RejectIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { KycDTO, KYCStatus, RejectKycDTO } from '../../../types/dto/kyc.dto';
import { kycService } from '../../../Services/kyc.service';
import KYCDetailsModal from './components/KYCDetailsModal';
import { Alert, Snackbar } from '@mui/material';


// ══════════════════════════════════════════════════════════
// MAPA DE ESTADOS (usa los mismos nombres que en KYCStatus)
// ══════════════════════════════════════════════════════════
const estadoMap: Record<KYCStatus, { label: string; color: 'warning' | 'success' | 'error'; icon: React.ElementType }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning', icon: HourglassIcon },
  APROBADA: { label: 'Aprobada', color: 'success', icon: ApproveIcon },
  RECHAZADA: { label: 'Rechazada', color: 'error', icon: RejectIcon },
};

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
const AdminKYC: React.FC = () => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: kycList, isLoading } = useQuery<KycDTO[]>({
    queryKey: ['kyc-pendientes'],
    queryFn: kycService.getPendingVerifications,
  });

  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);

  // Mutations para aprobar y rechazar
  const approveMutation = useMutation({
    mutationFn: (id: number) => kycService.approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-pendientes'] });
      setSnackbar({ open: true, message: 'Verificación aprobada exitosamente', severity: 'success' });
      setSelectedKyc(null);
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: error.message || 'Error al aprobar la verificación', severity: 'error' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RejectKycDTO }) => kycService.rejectVerification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-pendientes'] });
      setSnackbar({ open: true, message: 'Verificación rechazada exitosamente', severity: 'success' });
      setSelectedKyc(null);
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: error.message || 'Error al rechazar la verificación', severity: 'error' });
    },
  });

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync(id);
  };

  const handleReject = async (id: number, data: RejectKycDTO) => {
    await rejectMutation.mutateAsync({ id, data });
  };

  // ══════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SIN DATOS
  // ══════════════════════════════════════════════════════════
  if (!kycList?.length) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        No hay verificaciones pendientes.
      </Typography>
    );
  }

  // ══════════════════════════════════════════════════════════
  // LISTADO DE KYC
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Verificaciones de Identidad (KYC)
      </Typography>

      <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
        {kycList.map((kyc) => {
          const estadoInfo = estadoMap[kyc.estado_verificacion];
          const EstadoIcon = estadoInfo.icon;

          return (
            <Card
              key={kyc.id}
              sx={{
                borderLeft: '5px solid',
                borderColor: `${estadoInfo.color}.main`,
                p: 1,
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {/* Info del Usuario */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {kyc.nombre_completo || 'Sin nombre registrado'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {kyc.usuario?.email || 'Sin email'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Usuario: {kyc.usuario?.nombre_usuario || '—'}
                    </Typography>

                    {kyc.fecha_verificacion && (
                      <Typography variant="body2" color="text.secondary">
                        Verificado el:{' '}
                        {new Date(kyc.fecha_verificacion).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Estado y acciones */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      icon={<EstadoIcon />}
                      label={estadoInfo.label}
                      color={estadoInfo.color}
                      variant="outlined"
                    />

                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => setSelectedKyc(kyc)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Modal de detalles */}
      {selectedKyc && (
        <KYCDetailsModal
          open={!!selectedKyc}
          kyc={selectedKyc}
          onClose={() => setSelectedKyc(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminKYC;

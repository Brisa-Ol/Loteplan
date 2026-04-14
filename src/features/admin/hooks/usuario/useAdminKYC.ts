import kycService from '@/core/api/services/kyc.service';
import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/kyc.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useSortedData } from '../useSortedData';

export type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

const QUERY_CONFIG = {
  staleTime: env.queryStaleTime || 30000,
  gcTime: 5 * 60 * 1000,
};

export const useAdminKYC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);
  // ❌ ELIMINADO: rejectReason y setRejectReason (Lo manejará el modal localmente)

  // --- MODALES ---
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- QUERIES ---
  const queries = {
    pendiente: useQuery({ queryKey: ['kycPending'], queryFn: kycService.getPendingVerifications, enabled: currentTab === 'pendiente', ...QUERY_CONFIG }),
    aprobada: useQuery({ queryKey: ['kycApproved'], queryFn: kycService.getApprovedVerifications, enabled: currentTab === 'aprobada', ...QUERY_CONFIG }),
    rechazada: useQuery({ queryKey: ['kycRejected'], queryFn: kycService.getRejectedVerifications, enabled: currentTab === 'rechazada', ...QUERY_CONFIG }),
    todas: useQuery({ queryKey: ['kycAll'], queryFn: kycService.getAllProcessedVerifications, enabled: currentTab === 'todas', ...QUERY_CONFIG }),
  };

  const isLoading = Object.values(queries).some(q => q.isLoading);
  const error = Object.values(queries).find(q => q.error)?.error;

  // ✨ SELECCIÓN DE DATA (OPTIMIZADA)
  // Extraemos solo la data activa para no pasar el objeto entero 'queries' a la dependencia
  const activeData = queries[currentTab]?.data;
  const rawData = useMemo(() => activeData ?? [], [activeData]); // ✅ Ahora sí funciona el memo
  const { sortedData: kycList, highlightedId, triggerHighlight } = useSortedData(rawData);

  // --- UTILS ---
  const handleMutationError = (err: any) => showError(err.response?.data?.mensaje || 'Ocurrió un error inesperado');

  // --- MUTACIONES ---
  const approveMutation = useMutation({
    // ... (sin cambios aquí, estaba perfecto)
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onMutate: async (idUsuario) => {
      await queryClient.cancelQueries({ queryKey: ['kycPending'] });
      const previous = queryClient.getQueryData(['kycPending']);
      queryClient.setQueryData(['kycPending'], (old: KycDTO[] = []) => old.filter(k => k.id_usuario !== idUsuario));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(['kycPending'], context.previous);
      handleMutationError(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      showSuccess('✅ Verificación aprobada correctamente');
      if (confirmDialog.data?.id) triggerHighlight(confirmDialog.data.id);
      confirmDialog.close();
      detailsModal.close();
    }
  });

  const rejectMutation = useMutation({
    // ... (sin cambios aquí)
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onMutate: async ({ idUsuario }) => {
      await queryClient.cancelQueries({ queryKey: ['kycPending'] });
      const previous = queryClient.getQueryData(['kycPending']);
      queryClient.setQueryData(['kycPending'], (old: KycDTO[] = []) => old.filter(k => k.id_usuario !== idUsuario));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(['kycPending'], context.previous);
      handleMutationError(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      showSuccess('✅ Solicitud rechazada correctamente');
      if (kycToReject?.id) triggerHighlight(kycToReject.id);
      rejectModal.close();
      detailsModal.close();
      setKycToReject(null);
    }
  });

  // --- HANDLERS ---
  const handleOpenDetails = useCallback((kyc: KycDTO) => {
    setSelectedKyc(kyc);
    detailsModal.open();
  }, [detailsModal]);

  const handleConfirmApprove = useCallback(() => {
    if (confirmDialog.action === 'approve_kyc' && confirmDialog.data) {
      approveMutation.mutate(confirmDialog.data.id_usuario);
    }
  }, [confirmDialog, approveMutation]);

  const handleOpenRejectInput = useCallback((kyc: KycDTO) => {
    setKycToReject(kyc);
    rejectModal.open();
  }, [rejectModal]);

  // ✅ AHORA RECIBE EL MOTIVO POR PARÁMETRO
  const handleConfirmReject = useCallback((motivo: string) => {
    if (!motivo.trim() || !kycToReject) return;
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo });
  }, [kycToReject, rejectMutation]);

  return {
    currentTab, setCurrentTab,
    kycList, highlightedId,
    isLoading, error,
    selectedKyc,
    detailsModal, rejectModal, confirmDialog,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    handleOpenDetails,
    handleApproveClick: (kyc: KycDTO) => confirmDialog.confirm('approve_kyc', kyc),
    handleConfirmApprove,
    handleOpenRejectInput,
    handleConfirmReject // Pasamos la función que ahora requiere el parámetro
  };
};
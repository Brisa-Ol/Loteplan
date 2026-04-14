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

  // --- MODALES ---
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- QUERIES ---
  // ✅ ELIMINADO el 'enabled'. Ahora React Query hace las 4 peticiones en background
  // apenas el admin entra a la pantalla. Esto permite tener las métricas listas siempre.
  const queries = {
    pendiente: useQuery({ queryKey: ['kycPending'], queryFn: kycService.getPendingVerifications, ...QUERY_CONFIG }),
    aprobada: useQuery({ queryKey: ['kycApproved'], queryFn: kycService.getApprovedVerifications, ...QUERY_CONFIG }),
    rechazada: useQuery({ queryKey: ['kycRejected'], queryFn: kycService.getRejectedVerifications, ...QUERY_CONFIG }),
    todas: useQuery({ queryKey: ['kycAll'], queryFn: kycService.getAllProcessedVerifications, ...QUERY_CONFIG }),
  };

  const isLoading = Object.values(queries).some(q => q.isLoading);
  const error = Object.values(queries).find(q => q.error)?.error;

  // ✨ MÉTRICAS GLOBALES (NUEVO)
  // Al tener todas las queries activas, podemos saber el total de cada una sin importar
  // en qué pestaña estemos parados.
  const globalMetrics = useMemo(() => ({
    pending: queries.pendiente.data ? queries.pendiente.data.length : '-',
    approved: queries.aprobada.data ? queries.aprobada.data.length : '-',
    rejected: queries.rechazada.data ? queries.rechazada.data.length : '-',
    total: queries.todas.data ? queries.todas.data.length : '-',
  }), [
    queries.pendiente.data, 
    queries.aprobada.data, 
    queries.rechazada.data, 
    queries.todas.data
  ]);

  // ✨ SELECCIÓN DE DATA PARA LA TABLA
  const activeData = queries[currentTab]?.data;
  const rawData = useMemo(() => activeData ?? [], [activeData]);
  const { sortedData: kycList, highlightedId, triggerHighlight } = useSortedData(rawData);

  // --- UTILS ---
  const handleMutationError = (err: any) => showError(err.response?.data?.mensaje || 'Ocurrió un error inesperado');

  // --- MUTACIONES ---
  const approveMutation = useMutation({
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

  const handleConfirmReject = useCallback((motivo: string) => {
    if (!motivo.trim() || !kycToReject) return;
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo });
  }, [kycToReject, rejectMutation]);

  return {
    currentTab, setCurrentTab,
    kycList, highlightedId,
    isLoading, error,
    selectedKyc,
    globalMetrics, // ✅ Exportamos las métricas para que la pantalla las dibuje
    detailsModal, rejectModal, confirmDialog,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    handleOpenDetails,
    handleApproveClick: (kyc: KycDTO) => confirmDialog.confirm('approve_kyc', kyc),
    handleConfirmApprove,
    handleOpenRejectInput,
    handleConfirmReject
  };
};
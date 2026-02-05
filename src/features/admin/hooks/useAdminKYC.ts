import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import kycService from '@/core/api/services/kyc.service';
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useSortedData } from './useSortedData';

export type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

// ============================================================================
// HOOK PRINCIPAL - ULTRA OPTIMIZADO
// ============================================================================
export const useAdminKYC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);

  // --- MODALES (CORREGIDO: Hooks llamados en nivel superior) ---
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog();

  const modales = useMemo(() => ({
    details: detailsModal,
    reject: rejectModal,
    confirmDialog: confirmDialog
  }), [detailsModal, rejectModal, confirmDialog]);

  // --- QUERIES CON CACHE OPTIMIZADO ---
  // Solo cargamos la data del tab activo
  const { data: pendingKYCs = [], isLoading: l1, error: e1 } = useQuery<KycDTO[]>({
    queryKey: ['kycPending'],
    queryFn: kycService.getPendingVerifications,
    enabled: currentTab === 'pendiente',
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: approvedKYCs = [], isLoading: l2, error: e2 } = useQuery<KycDTO[]>({
    queryKey: ['kycApproved'],
    queryFn: kycService.getApprovedVerifications,
    enabled: currentTab === 'aprobada',
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: rejectedKYCs = [], isLoading: l3, error: e3 } = useQuery<KycDTO[]>({
    queryKey: ['kycRejected'],
    queryFn: kycService.getRejectedVerifications,
    enabled: currentTab === 'rechazada',
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: allKYCs = [], isLoading: l4, error: e4 } = useQuery<KycDTO[]>({
    queryKey: ['kycAll'],
    queryFn: kycService.getAllProcessedVerifications,
    enabled: currentTab === 'todas',
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const isLoading = l1 || l2 || l3 || l4;
  const error = e1 || e2 || e3 || e4;

  // ✨ SELECCIÓN DE DATA SEGÚN TAB ACTIVO
  const rawData = useMemo(() => {
    switch (currentTab) {
      case 'pendiente': return pendingKYCs;
      case 'aprobada': return approvedKYCs;
      case 'rechazada': return rejectedKYCs;
      case 'todas': return allKYCs;
      default: return [];
    }
  }, [currentTab, pendingKYCs, approvedKYCs, rejectedKYCs, allKYCs]);

  // ✨ ORDENAMIENTO + HIGHLIGHT
  const { sortedData: kycList, highlightedId, triggerHighlight } = useSortedData(rawData);

  // --- MUTACIONES CON OPTIMISTIC UPDATES ---

  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    // ✨ Optimistic Update - eliminar de pendientes inmediatamente
    onMutate: async (idUsuario) => {
      await queryClient.cancelQueries({ queryKey: ['kycPending'] });
      const previousPending = queryClient.getQueryData(['kycPending']);

      queryClient.setQueryData(['kycPending'], (old: KycDTO[] = []) =>
        old.filter(k => k.id_usuario !== idUsuario)
      );

      return { previousPending };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['kycPending'], context.previousPending);
      }
      modales.confirmDialog.close();
      showError(err.response?.data?.mensaje || 'Error al aprobar');
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });

      showSuccess('✅ Verificación aprobada correctamente');

      if (modales.confirmDialog.data?.id) {
        triggerHighlight(modales.confirmDialog.data.id);
      }

      modales.confirmDialog.close();
      modales.details.close();
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    // ✨ Optimistic Update - eliminar de pendientes inmediatamente
    onMutate: async ({ idUsuario }) => {
      await queryClient.cancelQueries({ queryKey: ['kycPending'] });
      const previousPending = queryClient.getQueryData(['kycPending']);

      queryClient.setQueryData(['kycPending'], (old: KycDTO[] = []) =>
        old.filter(k => k.id_usuario !== idUsuario)
      );

      return { previousPending };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['kycPending'], context.previousPending);
      }
      showError(err.response?.data?.mensaje || 'Error al rechazar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });

      showSuccess('✅ Solicitud rechazada correctamente');

      if (kycToReject?.id) {
        triggerHighlight(kycToReject.id);
      }

      modales.reject.close();
      modales.details.close();
      setRejectReason('');
      setKycToReject(null);
    }
  });

  // --- HANDLERS ---

  const handleOpenDetails = (kyc: KycDTO) => {
    setSelectedKyc(kyc);
    modales.details.open();
  };

  const handleApproveClick = (kyc: KycDTO) => {
    modales.confirmDialog.confirm('approve_kyc', kyc);
  };

  const handleConfirmApprove = () => {
    if (modales.confirmDialog.action === 'approve_kyc' && modales.confirmDialog.data) {
      approveMutation.mutate(modales.confirmDialog.data.id_usuario);
    }
  };

  const handleOpenRejectInput = (kyc: KycDTO) => {
    setKycToReject(kyc);
    setRejectReason('');
    modales.reject.open();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim() || !kycToReject) return;
    rejectMutation.mutate({
      idUsuario: kycToReject.id_usuario,
      motivo: rejectReason
    });
  };

  return {
    // State
    currentTab,
    setCurrentTab,

    // Data procesada
    kycList,
    highlightedId,

    // Loading & Error
    isLoading,
    error,

    selectedKyc,
    rejectReason,
    setRejectReason,

    // Modales
    detailsModal: modales.details,
    rejectModal: modales.reject,
    confirmDialog: modales.confirmDialog,

    // Status
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,

    // Actions
    handleOpenDetails,
    handleApproveClick,
    handleConfirmApprove,
    handleOpenRejectInput,
    handleConfirmReject
  };
};
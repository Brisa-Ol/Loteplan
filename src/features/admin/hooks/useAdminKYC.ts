import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import kycService from '@/core/api/services/kyc.service';
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useModal } from '@/shared/hooks/useModal';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useSortedData } from './useSortedData';

export type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

export const useAdminKYC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- ESTADOS ---
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);

  // Estado para rechazo manual
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);

  // --- MODALES ---
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- QUERIES ---
  // ✅ FIX: kycService ahora retorna KycDTO[] directamente desde cada método.
  // No se necesita post-procesamiento ni extracción manual de .solicitudes.
  const { data: pendingKYCs = [], isLoading: l1, error: e1 } = useQuery<KycDTO[]>({
    queryKey: ['kycPending'],
    queryFn: kycService.getPendingVerifications,
    enabled: currentTab === 'pendiente',
  });

  const { data: approvedKYCs = [], isLoading: l2, error: e2 } = useQuery<KycDTO[]>({
    queryKey: ['kycApproved'],
    queryFn: kycService.getApprovedVerifications,
    enabled: currentTab === 'aprobada',
  });

  const { data: rejectedKYCs = [], isLoading: l3, error: e3 } = useQuery<KycDTO[]>({
    queryKey: ['kycRejected'],
    queryFn: kycService.getRejectedVerifications,
    enabled: currentTab === 'rechazada',
  });

  const { data: allKYCs = [], isLoading: l4, error: e4 } = useQuery<KycDTO[]>({
    queryKey: ['kycAll'],
    queryFn: kycService.getAllProcessedVerifications,
    enabled: currentTab === 'todas',
  });

  // Unificamos estados de carga y error
  const isLoading = l1 || l2 || l3 || l4;
  const error = e1 || e2 || e3 || e4;

  // 1. SELECCIÓN DE DATA SEGÚN TAB (Data Cruda)
  const rawData = useMemo(() => {
    switch (currentTab) {
      case 'pendiente': return pendingKYCs;
      case 'aprobada': return approvedKYCs;
      case 'rechazada': return rejectedKYCs;
      case 'todas': return allKYCs;
      default: return [];
    }
  }, [currentTab, pendingKYCs, approvedKYCs, rejectedKYCs, allKYCs]);

  // ✨ 2. APLICAR HOOK DE UX (Ordenamiento + Highlight)
  const { sortedData: kycList, highlightedId, triggerHighlight } = useSortedData(rawData);

  // --- MUTACIONES ---
  const approveMutation = useMutation({
    // ✅ El backend espera POST /kyc/approve/:idUsuario → se pasa id_usuario del objeto KYC
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });

      showSuccess('✅ Verificación aprobada correctamente');

      // Highlight: usar kyc.id (ID del registro KYC) para la fila en la tabla
      if (confirmDialog.data?.id) triggerHighlight(confirmDialog.data.id);

      confirmDialog.close();
      detailsModal.close();
    },
    onError: (err: any) => {
      confirmDialog.close();
      showError(err.response?.data?.mensaje || 'Error al aprobar');
    }
  });

  const rejectMutation = useMutation({
    // ✅ El backend espera POST /kyc/reject/:idUsuario con body { motivo_rechazo }
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });

      showSuccess('✅ Solicitud rechazada correctamente');

      // Highlight: usar kyc.id del objeto que se rechazó
      if (kycToReject?.id) triggerHighlight(kycToReject.id);

      rejectModal.close();
      detailsModal.close();
      setRejectReason('');
    },
    onError: (err: any) => showError(err.response?.data?.mensaje || 'Error al rechazar')
  });

  // --- HANDLERS ---
  const handleOpenDetails = (kyc: KycDTO) => {
    setSelectedKyc(kyc);
    detailsModal.open();
  };

  const handleApproveClick = (kyc: KycDTO) => {
    // Guardamos el KYC completo en confirmDialog.data para acceder a id_usuario en onConfirm
    confirmDialog.confirm('approve_kyc', kyc);
  };

  const handleConfirmApprove = () => {
    if (confirmDialog.action === 'approve_kyc' && confirmDialog.data) {
      // ✅ Se pasa id_usuario (no kyc.id) porque el backend matchea por usuario
      approveMutation.mutate(confirmDialog.data.id_usuario);
    }
  };

  const handleOpenRejectInput = (kyc: KycDTO) => {
    setKycToReject(kyc);
    setRejectReason('');
    rejectModal.open();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim() || !kycToReject) return;
    // ✅ Se pasa id_usuario y el motivo dentro del objeto que matchea RejectKycDTO
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo: rejectReason });
  };

  return {
    // State
    currentTab,
    setCurrentTab,

    // ✨ Data procesada
    kycList,
    highlightedId,

    // Estado unificado
    isLoading,
    error,

    selectedKyc,
    rejectReason,
    setRejectReason,

    // Modales & Dialogs
    detailsModal,
    rejectModal,
    confirmDialog,

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
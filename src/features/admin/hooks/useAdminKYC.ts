import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useSnackbar from '../../../shared/hooks/useSnackbar';

import { useModal } from '../../../shared/hooks/useModal';

import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import kycService from '@/core/api/services/kyc.service';


export type TabValue = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

export const useAdminKYC = () => {
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // --- ESTADOS ---
  const [currentTab, setCurrentTab] = useState<TabValue>('pendiente');
  const [lastActionId, setLastActionId] = useState<number | string | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycDTO | null>(null);
  
  // Estado para rechazo manual
  const [rejectReason, setRejectReason] = useState('');
  const [kycToReject, setKycToReject] = useState<KycDTO | null>(null);

  // --- MODALES ---
  const detailsModal = useModal();
  const rejectModal = useModal();
  const confirmDialog = useConfirmDialog();

  // --- QUERIES ---
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

  // Datos Computados
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

  // Limpiar resaltado al cambiar tab
  useEffect(() => { setLastActionId(null); }, [currentTab]);

  // --- MUTACIONES ---
  const approveMutation = useMutation({
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: () => {
      if (confirmDialog.data?.id) setLastActionId(confirmDialog.data.id);
      
      // Invalidar todas las listas posibles
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('✅ Verificación aprobada correctamente');
      confirmDialog.close();
      detailsModal.close();
    },
    onError: () => confirmDialog.close(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: () => {
      if (kycToReject?.id) setLastActionId(kycToReject.id);

      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('✅ Solicitud rechazada correctamente');
      rejectModal.close();
      detailsModal.close();
      setRejectReason('');
    },
  });

  // --- HANDLERS ---
  const handleOpenDetails = (kyc: KycDTO) => { 
    setSelectedKyc(kyc); 
    detailsModal.open(); 
  };

  const handleApproveClick = (kyc: KycDTO) => {
    confirmDialog.confirm('approve_kyc', kyc);
  };

  const handleConfirmApprove = () => {
    if (confirmDialog.action === 'approve_kyc' && confirmDialog.data) {
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
    rejectMutation.mutate({ idUsuario: kycToReject.id_usuario, motivo: rejectReason });
  };

  return {
    // State
    currentTab,
    setCurrentTab,
    currentData,
    isLoading,
    error,
    lastActionId,
    selectedKyc,
    rejectReason,
    setRejectReason,
    
    // Modales & Dialogs
    detailsModal,
    rejectModal,
    confirmDialog,
    
    // Mutaciones Status
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
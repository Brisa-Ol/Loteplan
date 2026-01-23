import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { KycDTO } from '@/core/types/dto/kyc.dto';
import kycService from '@/core/api/services/kyc.service';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
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
  // Capturamos los errores de cada query individualmente
  const { data: pendingKYCs = [], isLoading: l1, error: e1 } = useQuery({
    queryKey: ['kycPending'], queryFn: kycService.getPendingVerifications, enabled: currentTab === 'pendiente',
  });
  const { data: approvedKYCs = [], isLoading: l2, error: e2 } = useQuery({
    queryKey: ['kycApproved'], queryFn: kycService.getApprovedVerifications, enabled: currentTab === 'aprobada',
  });
  const { data: rejectedKYCs = [], isLoading: l3, error: e3 } = useQuery({
    queryKey: ['kycRejected'], queryFn: kycService.getRejectedVerifications, enabled: currentTab === 'rechazada',
  });
  const { data: allKYCs = [], isLoading: l4, error: e4 } = useQuery({
    queryKey: ['kycAll'], queryFn: kycService.getAllProcessedVerifications, enabled: currentTab === 'todas',
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
    mutationFn: (idUsuario: number) => kycService.approveVerification(idUsuario),
    onSuccess: (_, idUsuario) => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycApproved'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('✅ Verificación aprobada correctamente');
      confirmDialog.close();
      detailsModal.close();

      if (confirmDialog.data?.id) triggerHighlight(confirmDialog.data.id);
    },
    onError: (err: any) => {
        confirmDialog.close();
        showError(err.response?.data?.message || 'Error al aprobar');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ idUsuario, motivo }: { idUsuario: number; motivo: string }) =>
      kycService.rejectVerification(idUsuario, { motivo_rechazo: motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycPending'] });
      queryClient.invalidateQueries({ queryKey: ['kycRejected'] });
      queryClient.invalidateQueries({ queryKey: ['kycAll'] });
      
      showSuccess('✅ Solicitud rechazada correctamente');
      rejectModal.close();
      detailsModal.close();
      setRejectReason('');

      if (kycToReject?.id) triggerHighlight(kycToReject.id);
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al rechazar')
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
    
    // ✨ Data procesada
    kycList, 
    highlightedId,

    // Estado unificado
    isLoading,
    error, // ✅ AHORA SÍ SE EXPORTA

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
// modals/hooks/useDetalleResumenModal.ts

import PagoService from '@/core/api/services/pago.service';
import type { PagoDto } from '@/core/types/pago.dto';
import type { ResumenCuentaDto } from '@/core/types/resumenCuenta.dto';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useDetalleResumenModal = (resumen: ResumenCuentaDto | null, open: boolean) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [cantidadMeses, setCantidadMeses] = useState(1);
  
  const [forcePaymentModalOpen, setForcePaymentModalOpen] = useState(false);
  const [selectedPagoToForce, setSelectedPagoToForce] = useState<PagoDto | null>(null);
  const [forceMotivo, setForceMotivo] = useState('');
  
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [newMonto, setNewMonto] = useState(0);

  // ✅ NUEVOS ESTADOS PARA EL MODAL DE EDITAR MONTO
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMotivo, setEditMotivo] = useState('');

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['resumenesCuenta'] });
    refetchPagos();
    refetchHistorial();
  };

  const { data: pagosPendientes = [], isLoading: loadingPagos, refetch: refetchPagos } = useQuery<PagoDto[]>({
    queryKey: ['pagosPendientesResumen', resumen?.id_suscripcion],
    queryFn: async () => {
      const res = await PagoService.getPendingBySubscription(resumen!.id_suscripcion);
      return (res.data as any)?.data ?? res.data ?? [];
    },
    enabled: open && !!resumen && (showPendingPayments || showAdvanceForm),
  });

  const { data: historialPagos = [], isLoading: loadingHistorial, refetch: refetchHistorial } = useQuery<PagoDto[]>({
    queryKey: ['historialPagosResumen', resumen?.id_suscripcion],
    queryFn: async () => {
      const res = await PagoService.getHistorialSuscripcion(resumen!.id_suscripcion);
      const all = (res.data as any)?.data ?? res.data ?? [];
      return all.filter((p: PagoDto) => ['pagado', 'cubierto_por_puja', 'forzado'].includes(p.estado_pago));
    },
    enabled: open && !!resumen && showHistory,
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: () => PagoService.generateAdvancePayments({ id_suscripcion: resumen!.id_suscripcion, cantidad_meses: cantidadMeses }),
    onSuccess: () => { showSuccess('Cuotas adelantadas generadas con éxito.'); setShowAdvanceForm(false); setShowPendingPayments(true); invalidateAndRefetch(); },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al generar pagos'),
  });

  const forcePaymentMutation = useMutation({
    mutationFn: (data: { idPago: number; motivo: string }) =>
      PagoService.updatePaymentStatus(data.idPago, { estado_pago: 'forzado', motivo: data.motivo }),
    onSuccess: () => { showSuccess('Cobro forzado registrado.'); handleCloseForceModal(); invalidateAndRefetch(); },
    onError: (err: any) => showError(err.response?.data?.error || 'No se pudo forzar el pago'),
  });

  // ✅ MUTACIÓN ACTUALIZADA CON EL DTO CORRECTO (motivo_cambio)
  const updateMontoMutation = useMutation({
    mutationFn: ({ pagoId, monto, motivo_cambio }: { pagoId: number; monto: number; motivo_cambio: string }) =>
      PagoService.updatePaymentAmount(pagoId, { monto, motivo_cambio: motivo_cambio }),
    onSuccess: () => { 
      showSuccess('Monto actualizado.'); 
      setEditingPaymentId(null); 
      setEditModalOpen(false); // Cerramos el modal
      setEditMotivo(''); // Limpiamos el motivo
      invalidateAndRefetch(); 
    },
    onError: (err: any) => showError(err.response?.data?.error || 'Error al actualizar el monto'),
  });

  const handleOpenForceModal = (pago: PagoDto) => { setSelectedPagoToForce(pago); setForceMotivo(''); setForcePaymentModalOpen(true); };
  const handleCloseForceModal = () => { setForcePaymentModalOpen(false); setSelectedPagoToForce(null); setForceMotivo(''); };
  const handleSubmitForce = () => { if (selectedPagoToForce && forceMotivo.trim()) forcePaymentMutation.mutate({ idPago: selectedPagoToForce.id, motivo: forceMotivo }); };

  // ✅ NUEVA FUNCIÓN PARA ENVIAR LA EDICIÓN DEL MONTO
  const handleSubmitEditMonto = () => {
    if (editingPaymentId && editMotivo.trim()) {
      updateMontoMutation.mutate({
        pagoId: editingPaymentId,
        monto: newMonto,
        motivo_cambio: editMotivo
      });
    }
  };

  const handleClose = (onClose: () => void) => {
    setShowAdvanceForm(false); setShowPendingPayments(false);
    setShowHistory(false); setEditingPaymentId(null);
    onClose();
  };

  const cuotasRestantes = resumen ? resumen.meses_proyecto - resumen.cuotas_pagadas : 0;
  const isCompleted = (resumen?.porcentaje_pagado ?? 0) >= 100;
  const hasOverdue = (resumen?.cuotas_vencidas ?? 0) > 0;
  const maxAdelantar = Math.max(0, cuotasRestantes - 1);
  const puedeAdelantar = !isCompleted && maxAdelantar > 0;

  return {
    // Estado UI
    showPendingPayments, setShowPendingPayments,
    showHistory, setShowHistory,
    showAdvanceForm, setShowAdvanceForm,
    cantidadMeses, setCantidadMeses,
    editingPaymentId, setEditingPaymentId,
    newMonto, setNewMonto,
    // Modales
    forcePaymentModalOpen, selectedPagoToForce, forceMotivo, setForceMotivo,
    handleOpenForceModal, handleCloseForceModal, handleSubmitForce,
    editModalOpen, setEditModalOpen, editMotivo, setEditMotivo, handleSubmitEditMonto, // 👈 Exportados
    // Data
    pagosPendientes, loadingPagos,
    historialPagos, loadingHistorial,
    // Mutations
    generatePaymentsMutation, forcePaymentMutation, updateMontoMutation,
    // Derived
    isCompleted, hasOverdue, cuotasRestantes, maxAdelantar, puedeAdelantar,
    // Handlers
    handleClose,
  };
};
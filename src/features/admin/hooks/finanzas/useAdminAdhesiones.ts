// src/features/admin/hooks/finanzas/useAdminAdhesiones.ts

import {
  iniciarCancelacionAdhesion,
  forzarPagoCuota,
  getAdhesionMetrics,
  getAllAdhesiones,
  getOverdueAdhesionPayments,
} from '@/core/api/services/adhesion.service';
import type { 
  AdhesionDto, 
  AdhesionMetricsDto, 
  PagoAdhesionDto,
  EstadoAdhesion,
  PlanPagoAdhesion
} from '@/core/types/adhesion.dto';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

// Tipos ampliados para incluir la opción "todas" / "todos"
export type AdhesionEstadoFilter = EstadoAdhesion | 'todas';
export type AdhesionPlanFilter = PlanPagoAdhesion | 'todos';

export const useAdminAdhesiones = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const confirmDialog = useConfirmDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<AdhesionEstadoFilter>('todas');
  const [filterPlan, setFilterPlan] = useState<AdhesionPlanFilter>('todos'); // ✅ Nuevo estado de filtro
  const [selectedAdhesion, setSelectedAdhesion] = useState<AdhesionDto | null>(null);
  const [motivoAccion, setMotivoAccion] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: adhesiones = [], isLoading: loadingAdhesiones, error } = useQuery<AdhesionDto[]>({
    queryKey: ['adminAdhesiones'],
    queryFn: async () => {
      const res = await getAllAdhesiones();
      return res.data.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery<AdhesionMetricsDto>({
    queryKey: ['adminAdhesionMetrics'],
    queryFn: async () => {
      const res = await getAdhesionMetrics();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const { data: overdue = [], isLoading: loadingOverdue } = useQuery<PagoAdhesionDto[]>({
    queryKey: ['adminAdhesionOverdue'],
    queryFn: async () => {
      const res = await getOverdueAdhesionPayments();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // ── Filtrado ─────────────────────────────────────────────────────────────

  const filteredAdhesiones = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return adhesiones.filter((adh) => {
      const matchesEstado = filterEstado === 'todas' || adh.estado === filterEstado;
      const matchesPlan = filterPlan === 'todos' || adh.plan_pago === filterPlan; // ✅ Lógica de plan de pago
      const matchesSearch =
        !term ||
        adh.usuario?.nombre?.toLowerCase().includes(term) ||
        adh.usuario?.apellido?.toLowerCase().includes(term) ||
        adh.usuario?.email?.toLowerCase().includes(term) ||
        adh.proyecto?.nombre_proyecto?.toLowerCase().includes(term) ||
        adh.id.toString().includes(term);
        
      return matchesEstado && matchesPlan && matchesSearch; // ✅ Debe cumplir todo
    });
  }, [adhesiones, filterEstado, filterPlan, searchTerm]);

  // ── Mutaciones ────────────────────────────────────────────────────────────

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adminAdhesiones'] });
    queryClient.invalidateQueries({ queryKey: ['adminAdhesionMetrics'] });
    queryClient.invalidateQueries({ queryKey: ['adminAdhesionOverdue'] });
  }, [queryClient]);

  const forzarPagoMutation = useMutation({
    mutationFn: (data: { adhesionId: number; numeroCuota: number; motivo?: string }) =>
      forzarPagoCuota(data),
    onSuccess: (_, vars) => {
      invalidateAll();
      showSuccess(`Cuota ${vars.numeroCuota} de la adhesión #${vars.adhesionId} marcada como pagada.`);
      confirmDialog.close();
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al forzar el pago.');
      confirmDialog.close();
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (data: { id: number; motivo?: string }) =>
      iniciarCancelacionAdhesion(data.id, data.motivo),
    onSuccess: () => {
      invalidateAll();
      showSuccess('Adhesión cancelada correctamente.');
      confirmDialog.close();
      setSelectedAdhesion(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Error al cancelar la adhesión.');
      confirmDialog.close();
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleForzarPago = useCallback(
    (adhesion: AdhesionDto, numeroCuota: number) => {
      setMotivoAccion('');
      confirmDialog.confirm('admin_force_adhesion_payment', {
        adhesionId: adhesion.id,
        numeroCuota,
        nombreProyecto: adhesion.proyecto?.nombre_proyecto,
        nombreUsuario: `${adhesion.usuario?.nombre} ${adhesion.usuario?.apellido}`,
      });
    },
    [confirmDialog]
  );

  const handleCancelar = useCallback(
    (adhesion: AdhesionDto) => {
      setMotivoAccion('');
      confirmDialog.confirm('admin_cancel_adhesion', adhesion);
    },
    [confirmDialog]
  );

  const handleConfirmAction = useCallback(() => {
    if (confirmDialog.action === 'admin_force_adhesion_payment' && confirmDialog.data) {
      forzarPagoMutation.mutate({
        adhesionId: confirmDialog.data.adhesionId,
        numeroCuota: confirmDialog.data.numeroCuota,
        motivo: motivoAccion.trim() || 'Forzado por administrador',
      });
    } else if (confirmDialog.action === 'admin_cancel_adhesion' && confirmDialog.data) {
      cancelarMutation.mutate({
        id: confirmDialog.data.id,
        motivo: motivoAccion.trim() || 'Cancelación administrativa',
      });
    }
  }, [confirmDialog, forzarPagoMutation, cancelarMutation, motivoAccion]);

  return {
    // Data
    filteredAdhesiones,
    metrics,
    overdue,
    selectedAdhesion,
    setSelectedAdhesion,

    // Filters
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterPlan,       // ✅ Exportado
    setFilterPlan,    // ✅ Exportado

    // Loading
    isLoading: loadingAdhesiones,
    loadingMetrics,
    loadingOverdue,
    isMutating: forzarPagoMutation.isPending || cancelarMutation.isPending,
    error,

    // Dialog
    confirmDialog,
    handleConfirmAction,

    // Actions
    handleForzarPago,
    handleCancelar,

    // Estado Motivo
    motivoAccion,
    setMotivoAccion,
  };
};
import { useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import LoteService from '@/core/api/services/lote.service';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import { useModal } from '@/shared/hooks/useModal';

import { useSnackbar } from '@/shared/hooks/useSnackbar'; 
import { useSortedData } from '../useSortedData';


// Helper de fechas
const calcularDiasRestantes = (fechaFin: string | null): number => {
  if (!fechaFin) return 90;
  const fechaLimite = new Date(new Date(fechaFin).getTime() + 90 * 24 * 60 * 60 * 1000); 
  const diff = fechaLimite.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Interfaz para la configuración dinámica del diálogo
interface ConfirmConfig {
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'primary' | 'error' | 'warning' | 'info';
}

export const useAdminLotePagos = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // 👇 2. USAMOS TU HOOK AQUÍ
  const { showSuccess, showError } = useSnackbar(); 
  
  const confirmModal = useModal();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    title: 'Confirmar Acción',
    message: '¿Estás seguro?',
    confirmText: 'Confirmar',
    confirmColor: 'primary'
  });

  // 1. DATA FETCHING
  const { data: lotesRaw = [], isLoading, error } = useQuery({
    queryKey: ['adminLotesPagos'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // 2. FILTROS
  const lotesPendientesTotal = useMemo(() => {
    return lotesRaw.filter((l) => l.estado_subasta === 'finalizada' && l.id_ganador);
  }, [lotesRaw]);

  const lotesRiesgo = useMemo(() => {
    return lotesPendientesTotal.filter(l => (l.intentos_fallidos_pago || 0) > 0);
  }, [lotesPendientesTotal]);

  const { sortedData: lotes, highlightedId } = useSortedData(lotesRiesgo);

  // 3. ANALYTICS
  const analytics = useMemo(() => {
    const riesgoCriticoItems = lotesPendientesTotal.filter((l) => (l.intentos_fallidos_pago || 0) >= 2);
    const capitalEnRiesgo = lotesPendientesTotal.reduce((acc, l) => acc + Number(l.monto_ganador_lote || l.precio_base), 0);

    const chartData = [
      { name: 'Normal (0)', value: lotesPendientesTotal.filter(l => !l.intentos_fallidos_pago).length, color: theme.palette.success.light },
      { name: 'Bajo (1)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 1).length, color: theme.palette.warning.light },
      { name: 'Alto (2)', value: lotesPendientesTotal.filter(l => l.intentos_fallidos_pago === 2).length, color: theme.palette.error.main },
      { name: 'Crítico (3+)', value: lotesPendientesTotal.filter(l => (l.intentos_fallidos_pago || 0) >= 3).length, color: theme.palette.error.dark },
    ];

    return { totalPendientes: lotesPendientesTotal.length, cantidadCritica: riesgoCriticoItems.length, capitalEnRiesgo, chartData };
  }, [lotesPendientesTotal, theme]);

  // 4. ACCIONES (MUTATION)
  const sancionarMutation = useMutation({
    mutationFn: async (loteId: number) => await LoteService.cancelarAdjudicacion(loteId),
    onSuccess: (res) => {
      const msg = res.data?.message || 'Adjudicación procesada correctamente.';
      
      // 👇 3. REEMPLAZAMOS toast.success POR showSuccess
      showSuccess(msg); 
      
      queryClient.invalidateQueries({ queryKey: ['adminLotesPagos'] });
      confirmModal.close();
    },
    onError: (err: any) => {
      if (err.response?.status === 404) {
        // 👇 4. REEMPLAZAMOS toast.error POR showError
        showError('Error: Falta la ruta POST /lotes/:id/impago en el Backend.');
      } else {
        showError('Error al procesar la sanción.');
      }
    }
  });

  const handleForceFinish = (lote: LoteDto) => {
    setSelectedLote(lote);
    setConfirmConfig({
      title: 'Procesar Impago / Anular',
      message: `Vas a ejecutar el proceso de impago para "${lote.nombre_lote}". Se registrará un intento fallido (+1) y si llega a 3, el lote se reasignará o limpiará. ¿Continuar?`,
      confirmText: 'Procesar Impago',
      confirmColor: 'error'
    });
    confirmModal.open(); 
  };

  const handleConfirmAction = () => {
    if (selectedLote) {
      sancionarMutation.mutate(selectedLote.id);
    }
  };

  return {
    theme, viewMode, setViewMode,
    lotes, lotesPendientesTotal, analytics,
    isLoading, error, highlightedId,
    isMutating: sancionarMutation.isPending,
    handleForceFinish, handleConfirmAction, calcularDiasRestantes,
    confirmConfig,
    modales: { confirm: confirmModal }
  };
};
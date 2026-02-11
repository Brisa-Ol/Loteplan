// src/features/client/hooks/useHistorialContratos.ts

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks Compartidos
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useModal } from '@/shared/hooks/useModal';


// API y DTOs
import ContratoFirmadoService from '@/core/api/services/contrato-firmado.service';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import { useSortedData } from '@/features/admin/hooks/useSortedData';
import { downloadSecureFile } from '@/shared/utils';



export const useHistorialContratos = () => {
  const { showError } = useSnackbar();
  const verModal = useModal();

  // Estados Locales
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // --- QUERY ---
  const { data: contratosRaw = [], isLoading, error } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoFirmadoService.findMyContracts()).data,
    staleTime: 60000, // 1 minuto de cache
    refetchOnWindowFocus: false
  });

  // ✨ Ordenamiento y Highlight (Orden descendente por ID por defecto)
  const { sortedData: contratos, highlightedId, triggerHighlight } = useSortedData(contratosRaw);

  // --- STATS (Cálculos para las tarjetas) ---
  const stats = useMemo(() => {
    if (!contratos.length) return { total: 0, verified: 0, lastDate: '-' };

    // Ordenamos temporalmente solo para obtener la fecha más reciente
    const sortedByDate = [...contratos].sort((a, b) => new Date(b.fecha_firma).getTime() - new Date(a.fecha_firma).getTime());

    return {
      total: contratos.length,
      verified: contratos.length, // Si están en esta lista, ya están firmados y verificados
      lastDate: sortedByDate[0].fecha_firma
        ? format(new Date(sortedByDate[0].fecha_firma), 'dd MMM yyyy', { locale: es })
        : '-'
    };
  }, [contratos]);

  // --- HANDLERS ---

  const handleVerContrato = useCallback((contrato: ContratoFirmadoDto) => {
    setContratoSeleccionado(contrato);
    verModal.open();
  }, [verModal]);

  const handleCloseModal = useCallback(() => {
    verModal.close();
    setTimeout(() => setContratoSeleccionado(null), 300);
  }, [verModal]);

  // ✅ HANDLER DE DESCARGA SEGURO
  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);

      // 1. Obtenemos la ruta segura de la API desde el servicio.
      // Esto apunta a /api/contratos/descargar/:id, donde el backend valida KYC y 2FA.
      const apiPath = ContratoFirmadoService.getDownloadUrl(contrato.id);

      // 2. Usamos la utilidad que detecta que NO es /uploads y usa Axios + Token automáticamente.
      // El nombre del archivo es importante para que el navegador lo guarde correctamente.
      await downloadSecureFile(apiPath, contrato.nombre_archivo);

      // Feedback visual (ilumina la fila)
      triggerHighlight(contrato.id);

    } catch (err) {
      console.error("Error descarga", err);
      showError('No se pudo descargar. Verifique su verificación de identidad (KYC).');
    } finally {
      setDownloadingId(null);
    }
  }, [showError, triggerHighlight]);

  return {
    // Data
    contratos,
    stats,
    isLoading,
    error,

    // UI States
    highlightedId,
    downloadingId,
    contratoSeleccionado,

    // Modales
    verModal,

    // Actions
    handleVerContrato,
    handleCloseModal,
    handleDownload
  };
};
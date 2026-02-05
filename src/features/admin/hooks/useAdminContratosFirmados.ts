import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import ContratoService from '@/core/api/services/contrato.service';

import { useSortedData } from './useSortedData';
import { downloadSecureFile } from '@/shared/utils';

// ============================================================================
// DEBOUNCE HELPER
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export const useAdminContratosFirmados = () => {
  const { showError } = useSnackbar();
  
  // --- ESTADOS UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // ✨ Debounce
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERY OPTIMIZADA ---
  const { data: contratosRaw = [], isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['adminContratosFirmados'],
    queryFn: async () => {
      const res = await ContratoService.findAllSigned();
      return res.data;
    },
    staleTime: 30000,      // 30 segundos fresh
    gcTime: 5 * 60 * 1000, // 5 minutos cache
    refetchOnWindowFocus: false
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: contratosOrdenados, highlightedId, triggerHighlight } = useSortedData(contratosRaw);

  // --- FILTRADO (Optimizado + Memoizado) ---
  const filteredContratos = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    
    return contratosOrdenados.filter(c => {
      if (!term) return true;
      return (
        c.nombre_archivo.toLowerCase().includes(term) ||
        c.id_usuario_firmante.toString().includes(term) ||
        c.id_proyecto.toString().includes(term)
      );
    });
  }, [contratosOrdenados, debouncedSearchTerm]);

  // --- HANDLERS ---
  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    if (!contrato.url_archivo) {
        showError('El contrato no tiene una URL de archivo válida.');
        return;
    }

    try {
      setDownloadingId(contrato.id);
      
      // ✅ Usamos tu utilidad robusta en lugar del servicio
      // Nota: Asumimos que url_archivo es relativa tipo 'uploads/contratos/...'
      await downloadSecureFile(contrato.url_archivo, contrato.nombre_archivo);

      // ✨ Feedback Visual: Iluminamos la fila descargada
      triggerHighlight(contrato.id);

    } catch (error) {
      // El error ya se loguea en downloadSecureFile, aquí solo mostramos snackbar
      showError("Error al descargar el archivo. Verifica que exista en el servidor.");
    } finally {
      setDownloadingId(null);
    }
  }, [showError, triggerHighlight]);

  return {
    // State
    searchTerm, setSearchTerm,
    downloadingId,
    
    // ✨ UX
    highlightedId,

    // Data
    filteredContratos,
    isLoading,
    error,

    // Handlers
    handleDownload
  };
};
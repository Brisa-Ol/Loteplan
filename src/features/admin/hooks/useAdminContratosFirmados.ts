import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import ContratoService from '@/core/api/services/contrato.service';
import { useSortedData } from './useSortedData';


export const useAdminContratosFirmados = () => {
  const { showError } = useSnackbar();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // --- QUERY ---
  const { data: contratosRaw = [], isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['adminContratosFirmados'],
    queryFn: async () => {
      const res = await ContratoService.findAllSigned();
      return res.data;
    }
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  // Ordenamos por ID descendente (los más recientes primero)
  const { sortedData: contratosOrdenados, highlightedId, triggerHighlight } = useSortedData(contratosRaw);

  // --- FILTRADO (Sobre data ordenada) ---
  const filteredContratos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return contratosOrdenados.filter(c =>
      c.nombre_archivo.toLowerCase().includes(term) ||
      c.id_usuario_firmante.toString().includes(term) ||
      c.id_proyecto.toString().includes(term)
    );
  }, [contratosOrdenados, searchTerm]);

  // --- HANDLERS ---
  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);
      await ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);

      // ✨ Feedback Visual: Iluminamos la fila descargada
      triggerHighlight(contrato.id);

    } catch (error) {
      showError("Error al descargar el archivo. Verifica tu conexión.");
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
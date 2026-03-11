import ContratoService from '@/core/api/services/contrato.service';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import useSnackbar from '@/shared/hooks/useSnackbar';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '@/core/config/env';
import { downloadSecureFile } from '@/shared/utils';
import { useSortedData } from '../useSortedData';

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
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  // ✨ Debounce
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // --- QUERY OPTIMIZADA ---
  const { data: contratosRaw = [], isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['adminContratosFirmados'],
    queryFn: async () => {
      const res = await ContratoService.findAllSigned();
      return res.data;
    },
    // 👇 2. Usas la variable global con un fallback de seguridad
    staleTime: env.queryStaleTime || 30000,
    gcTime: 5 * 60 * 1000, // (Esto lo puedes dejar fijo si quieres, es el tiempo en RAM)
    refetchOnWindowFocus: false
  });

  // ✨ 1. ORDENAMIENTO + HIGHLIGHT
  const { sortedData: contratosOrdenados, highlightedId, triggerHighlight } = useSortedData(contratosRaw);

  // --- FILTRADO (Optimizado + Memoizado) ---
  const filteredContratos = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();

    return contratosOrdenados.filter(c => {
      // 1. Filtro por Búsqueda de Texto
      let matchesSearch = true;
      if (term) {
        const nombreCompleto = `${c.usuarioFirmante?.nombre || ''} ${c.usuarioFirmante?.apellido || ''}`.toLowerCase();
        const emailUsuario = c.usuarioFirmante?.email?.toLowerCase() || '';
        const nombreProyecto = c.proyectoAsociado?.nombre_proyecto?.toLowerCase() || '';
        const hash = c.hash_archivo_firmado?.toLowerCase() || '';

        matchesSearch = (
          nombreCompleto.includes(term) ||
          emailUsuario.includes(term) ||
          nombreProyecto.includes(term) ||
          hash.includes(term) ||
          c.nombre_archivo.toLowerCase().includes(term) ||
          c.id_usuario_firmante.toString().includes(term)
        );
      }

      // 2. ✨ Filtro por Tipo (Clasificación)
      let matchesTipo = true;
      if (filterTipo !== 'all') {
        if (filterTipo === 'inversion') matchesTipo = !!c.id_inversion_asociada;
        else if (filterTipo === 'suscripcion') matchesTipo = !!c.id_suscripcion_asociada;
        else if (filterTipo === 'general') matchesTipo = !c.id_inversion_asociada && !c.id_suscripcion_asociada;
      }

      // 3. ✨ Filtro por Estado de Firma
      let matchesEstado = true;
      if (filterEstado !== 'all') {
        matchesEstado = c.estado_firma === filterEstado;
      }

      // 4. ✨ Filtro por Rango de Fechas
      let matchesDate = true;
      if (startDate || endDate) {
        // Aseguramos que la fecha del contrato sea un objeto Date válido
        const contractDate = new Date(c.fecha_firma);

        if (startDate) {
          // Forzamos la zona horaria local añadiendo T00:00:00
          const start = new Date(`${startDate}T00:00:00`);
          if (contractDate < start) matchesDate = false;
        }

        if (endDate) {
          // Forzamos la zona horaria local al final del día
          const end = new Date(`${endDate}T23:59:59`);
          if (contractDate > end) matchesDate = false;
        }
      }

      // Retornamos la combinación de todos los filtros
      return matchesSearch && matchesTipo && matchesEstado && matchesDate;
    });
  }, [contratosOrdenados, debouncedSearchTerm, filterTipo, filterEstado, startDate, endDate]);

  // --- HANDLERS ---
  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    if (!contrato.url_archivo) {
      showError('El contrato no tiene una URL de archivo válida.');
      return;
    }

    try {
      setDownloadingId(contrato.id);

      // ✅ Usamos tu utilidad robusta en lugar del servicio
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
    startDate, setStartDate, // 👈 Exportamos
    endDate, setEndDate,
    filterTipo, setFilterTipo,       // 👈 Exportamos
    filterEstado, setFilterEstado,   // 👈 Exportamos

    // Handlers
    handleDownload
  };
};
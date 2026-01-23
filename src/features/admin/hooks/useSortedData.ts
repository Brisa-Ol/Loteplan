import { useMemo, useState, useCallback } from 'react';

// Interfaz mínima requerida: El objeto debe tener un ID
interface EntityWithId {
  id: number | string;
  [key: string]: any;
}

export const useSortedData = <T extends EntityWithId>(data: T[]) => {
  const [highlightedId, setHighlightedId] = useState<number | string | null>(null);

  /**
   * 1. ORDENAMIENTO INTELIGENTE
   * Ordena siempre por ID descendente (el ID más alto primero).
   * Asume que ID más alto = Más nuevo.
   */
  const sortedData = useMemo(() => {
    // Creamos una copia ([...data]) para no mutar el array original de React Query
    return [...data].sort((a, b) => {
        const idA = Number(a.id);
        const idB = Number(b.id);
        // Si por alguna razón el ID no es numérico, lo trata como string
        if (isNaN(idA) || isNaN(idB)) {
            return String(b.id).localeCompare(String(a.id));
        }
        return idB - idA; // Descendente: 100, 99, 98...
    });
  }, [data]);

  /**
   * 2. FEEDBACK VISUAL
   * Activa el estado de "iluminado" y hace scroll hacia la fila.
   */
  const triggerHighlight = useCallback((id: number | string) => {
    setHighlightedId(id);
    
    // UX: Scroll suave hacia la fila si está fuera de vista
    // Nota: DataTable debe renderizar las filas con id o key accesible, 
    // pero el highlight visual suele ser suficiente.
    const element = document.getElementById(`row-${id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Quitar el highlight automáticamente después de 2.5 segundos
    setTimeout(() => setHighlightedId(null), 2500);
  }, []);

  return {
    sortedData,      // Usa esto en tu tabla en lugar de 'data' cruda
    highlightedId,   // Pásalo a la prop 'highlightedRowId' del DataTable
    triggerHighlight // Úsalo en el onSuccess de tus mutaciones (create/edit)
  };
};
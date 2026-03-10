import { useCallback, useEffect, useRef, useState } from 'react';

interface UseImageLoaderReturn {
  isLoading: boolean;
  hasError: boolean;
  handleLoad: () => void;
  handleError: () => void;
  reset: () => void;
}

/**
 * Hook para gestionar el estado de carga de imágenes.
 * @param src - URL de la imagen para monitorear cambios.
 */
export const useImageLoader = (src?: string | null): UseImageLoaderReturn => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const lastSrc = useRef<string | null | undefined>(src);

  // Sincroniza el estado si la URL cambia externamente
  useEffect(() => {
    if (src !== lastSrc.current) {
      lastSrc.current = src;
      setStatus('loading');
    }
  }, [src]);

  const handleLoad = useCallback(() => {
    setStatus('success');
  }, []);

  const handleError = useCallback(() => {
    setStatus('error');
  }, []);

  const reset = useCallback(() => {
    setStatus('loading');
  }, []);

  return {
    isLoading: status === 'loading',
    hasError: status === 'error',
    handleLoad,
    handleError,
    reset,
  };
};
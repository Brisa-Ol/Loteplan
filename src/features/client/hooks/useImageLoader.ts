// src/shared/hooks/useImageLoader.ts

import { useState, useCallback } from 'react';

interface UseImageLoaderReturn {
  loaded: boolean;
  error: boolean;
  handleLoad: () => void;
  handleError: () => void;
  reset: () => void;
}

/**
 * Hook para manejar el estado de carga de imágenes
 * 
 * @example
 * const { loaded, error, handleLoad, handleError } = useImageLoader();
 * 
 * <img 
 *   src={url} 
 *   onLoad={handleLoad} 
 *   onError={handleError}
 *   style={{ opacity: loaded ? 1 : 0 }}
 * />
 */
export const useImageLoader = (): UseImageLoaderReturn => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  const reset = useCallback(() => {
    setLoaded(false);
    setError(false);
  }, []);

  return {
    loaded,
    error,
    handleLoad,
    handleError,
    reset,
  };
};
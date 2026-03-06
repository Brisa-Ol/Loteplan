import { useCallback, useState } from 'react';

interface UseImageLoaderReturn {
  isLoading: boolean; // 👈 Más descriptivo que !loaded
  hasError: boolean;
  handleLoad: () => void;
  handleError: () => void;
  reset: () => void;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

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
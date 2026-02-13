import { useEffect } from 'react';
import { useSnackbar } from '@/shared/hooks/useSnackbar'; // Tu hook existente
import { httpErrorEvent } from '@/core/api/httpService'; // El EventTarget que creamos arriba

export const GlobalErrorHandler = () => {
  const { showError } = useSnackbar();

  useEffect(() => {
    const handleHttpError = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        showError(customEvent.detail);
      }
    };

    // Nos suscribimos al evento
    httpErrorEvent.addEventListener('http-error', handleHttpError);

    // Limpieza al desmontar
    return () => {
      httpErrorEvent.removeEventListener('http-error', handleHttpError);
    };
  }, [showError]);

  return null; // Este componente no renderiza nada visualmente
};
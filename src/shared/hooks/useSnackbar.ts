import { SnackbarContext } from '@/core/context/SnackbarContext';
import { useContext } from 'react';

/**
 * Hook para usar las notificaciones dentro de componentes de React.
 * Ejemplo: const { showSuccess } = useSnackbar();
 */
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  
  if (!context) {
    throw new Error('useSnackbar debe ser usado dentro de un SnackbarProvider');
  }
  
  return context;
};

export default useSnackbar;
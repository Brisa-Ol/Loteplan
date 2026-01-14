import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import GlobalSnackbar from '../../shared/components/ui/feedback/GlobalSnackbarProps/GlobalSnackbarProps';


// Definimos la forma de nuestro contexto
interface SnackbarContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showInfo: (msg: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// El Provider envuelve tu aplicación
export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  const showInfo = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'info' });
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showInfo }}>
      {/* Renderizamos los hijos (toda tu app) */}
      {children}
      
      {/* ✅ AQUÍ vive el componente visual globalmente. 
          Nunca más tendrás que ponerlo en tus páginas. */}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleClose}
      />
    </SnackbarContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar debe ser usado dentro de un SnackbarProvider');
  }
  return context;
};
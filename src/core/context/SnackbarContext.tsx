import GlobalSnackbar from '@/shared/components/ui/feedback/GlobalSnackbarProps';
import { setGlobalSnackbar } from '@/shared/utils/snackbarUtils';
import React, { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';


// Tipos
type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showWarning: (msg: string) => void;
  showInfo: (msg: string) => void;
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<Severity>('info');

  /**
   * Función central para mostrar alertas.
   * Cierra la anterior si existe (efecto rebote) para que se note el cambio.
   */
  const triggerSnackbar = useCallback((msg: string, type: Severity) => {
    // Si ya hay uno abierto, lo cerramos momentáneamente para que el usuario note el nuevo
    if (open) {
      setOpen(false);
      setTimeout(() => {
        setMessage(msg);
        setSeverity(type);
        setOpen(true);
      }, 150); // Breve delay para la animación
    } else {
      setMessage(msg);
      setSeverity(type);
      setOpen(true);
    }
  }, [open]);

  // Wrappers para el contexto
  const showSuccess = useCallback((msg: string) => triggerSnackbar(msg, 'success'), [triggerSnackbar]);
  const showError = useCallback((msg: string) => triggerSnackbar(msg, 'error'), [triggerSnackbar]);
  const showWarning = useCallback((msg: string) => triggerSnackbar(msg, 'warning'), [triggerSnackbar]);
  const showInfo = useCallback((msg: string) => triggerSnackbar(msg, 'info'), [triggerSnackbar]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  /**
   * 🔌 CONEXIÓN MÁGICA:
   * Aquí conectamos React con el mundo exterior (Axios/Utils).
   * Al montar el Provider, le pasamos la función `triggerSnackbar` a `snackbarUtils`.
   */
  useEffect(() => {
    setGlobalSnackbar((msg, type) => {
      triggerSnackbar(msg, type);
    });
  }, [triggerSnackbar]);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      <GlobalSnackbar
        open={open}
        message={message}
        severity={severity}
        onClose={handleClose}
      />
    </SnackbarContext.Provider>
  );
};
// src/hooks/useModal.ts
import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [open, setOpen] = useState(initialState);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(prev => !prev), []);

  return {
    isOpen: open, // Mantener por si necesitas la lógica fuera
    open: handleOpen,
    close: handleClose,
    toggle,
    // Props listos para esparcir en <BaseModal {...modalProps} />
    modalProps: {
      open,
      onClose: handleClose
    }
  };
};
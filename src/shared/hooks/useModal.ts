// src/hooks/useModal.ts
import { useState } from 'react';

/**
 * Hook personalizado para manejar el estado de modales/diálogos
 * Elimina la necesidad de repetir useState y handlers en cada componente
 * 
 * @param initialState - Estado inicial del modal (default: false)
 * @returns Objeto con estado y funciones para controlar el modal
 * 
 * @example
 * const modal = useModal();
 * 
 * // Usar en el componente:
 * <Button onClick={modal.open}>Abrir</Button>
 * <Dialog {...modal.modalProps}>
 *   <Button onClick={modal.close}>Cerrar</Button>
 * </Dialog>
 */
export const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);

    return {
        isOpen,
        open,
        close,
        toggle,
        // Props listos para usar con Material-UI Dialog
        modalProps: {
            open: isOpen,
            onClose: close
        }
    };
};
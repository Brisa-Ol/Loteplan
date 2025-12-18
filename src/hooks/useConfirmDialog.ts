import { useState, useCallback } from 'react';

// 1. Definimos todas las acciones posibles en la app
export type ConfirmAction =
  | 'cancel_subscription'
  | 'remove_favorite'
  | 'delete_account'
  | 'logout'               // ✅ Usado en Navbar
  | 'ban_user'
| 'toggle_project_visibility'
  | 'start_project_process'
  | null;

interface ConfirmConfig {
  title: string;
  description: string;
  confirmText: string;
  severity: 'error' | 'warning' | 'info';
}

// 2. Configuración centralizada de textos y colores
const CONFIRM_CONFIGS: Record<NonNullable<ConfirmAction>, ConfirmConfig> = {
  cancel_subscription: {
    title: '¿Cancelar suscripción?',
    description: 'Perderás tu progreso de antigüedad, tokens acumulados y se detendrán los cobros futuros. Esta acción es irreversible.',
    confirmText: 'Sí, cancelar definitivamente',
    severity: 'error',
  },
  remove_favorite: {
    title: '¿Quitar de favoritos?',
    description: 'El lote se eliminará de tu lista de seguimiento.',
    confirmText: 'Sí, quitar',
    severity: 'warning',
  },
  delete_account: {
    title: '¿Eliminar cuenta?',
    description: 'Se eliminarán todos tus datos permanentemente. Esta acción NO se puede deshacer.',
    confirmText: 'Sí, eliminar mi cuenta',
    severity: 'error',
  },
  logout: {
    title: '¿Cerrar sesión?',
    description: 'Tendrás que ingresar tus credenciales nuevamente para acceder.',
    confirmText: 'Sí, salir',
    severity: 'info', // O 'primary' dependiendo de tu lógica visual, 'info' suele ser azul/neutro
  },
toggle_project_visibility: {
    title: '¿Cambiar visibilidad del proyecto?',
    description: '',
    confirmText: 'Confirmar',
    severity: 'warning',
},
  ban_user: {
    title: '¿Bloquear acceso al usuario?',
    description: 'El usuario no podrá iniciar sesión ni realizar operaciones hasta que sea desbloqueado manualmente.',
    confirmText: 'Bloquear Usuario',
    severity: 'error',
  },
  start_project_process: {
    title: '¿Iniciar proceso de cobro?',
    description: 'Esto activará el conteo de meses y generará las cuotas para todos los suscriptores. Esta acción notificará a los usuarios y no se puede pausar fácilmente.',
    confirmText: 'Sí, iniciar ahora',
    severity: 'warning',
},
};

// 3. El Hook
export const useConfirmDialog = () => {
  const [state, setState] = useState<{
    open: boolean;
    action: ConfirmAction;
    data: any; // Para pasar IDs u objetos (ej: idLote, usuario, etc.)
  }>({ 
    open: false, 
    action: null, 
    data: null 
  });

  const confirm = useCallback((action: NonNullable<ConfirmAction>, data?: any) => {
    setState({ open: true, action, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, action: null, data: null });
  }, []);

  // Obtenemos la configuración basada en la acción actual
  const config = state.action ? CONFIRM_CONFIGS[state.action] : null;

  return {
    ...state, // open, action, data
    config,   // Textos y severidad listos para usar
    confirm,  // Función para abrir
    close,    // Función para cerrar
  };
};
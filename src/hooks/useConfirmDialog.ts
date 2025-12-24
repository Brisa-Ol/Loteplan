import { useState, useCallback } from 'react';

// 1. Definimos todas las acciones posibles en la app
export type ConfirmAction =
  | 'cancel_subscription'
  | 'admin_cancel_subscription'
  | 'remove_favorite'
  | 'delete_account'
  | 'logout'
  | 'toggle_user_status'
  | 'toggle_project_visibility'
  | 'toggle_lote_visibility'
  | 'start_project_process'
  | 'start_auction'
  | 'end_auction'
  | 'delete_plantilla'
  | 'toggle_plantilla_status'
  | 'approve_kyc' // ✅ NUEVO: Acción para aprobar KYC
  | null;

interface ConfirmConfig {
  title: string;
  description: string;
  confirmText: string;
  severity: 'error' | 'warning' | 'info' | 'success'; // Agregué 'success' por si acaso, aunque MUI usa info/success similares en alerts
}

// 2. Configuración centralizada de textos y colores
const CONFIRM_CONFIGS: Record<NonNullable<ConfirmAction>, ConfirmConfig> = {
  cancel_subscription: {
    title: '¿Cancelar suscripción?',
    description: 'Perderás tu progreso de antigüedad, tokens acumulados y se detendrán los cobros futuros. Esta acción es irreversible.',
    confirmText: 'Sí, cancelar definitivamente',
    severity: 'error',
  },
  admin_cancel_subscription: {
    title: '¿Forzar cancelación?',
    description: '', 
    confirmText: 'Sí, cancelar suscripción',
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
    severity: 'info',
  },
  toggle_project_visibility: {
    title: '¿Cambiar visibilidad del proyecto?',
    description: '', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  toggle_user_status: {
    title: '¿Cambiar estado del usuario?',
    description: '', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  toggle_lote_visibility: {
    title: '¿Cambiar visibilidad del lote?',
    description: '', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  start_project_process: {
    title: '¿Iniciar proceso de cobro?',
    description: 'Esto activará el conteo de meses y generará las cuotas para todos los suscriptores. Esta acción notificará a los usuarios y no se puede pausar fácilmente.',
    confirmText: 'Sí, iniciar ahora',
    severity: 'warning',
  },
  start_auction: {
    title: '¿Iniciar subasta del lote?',
    description: '', 
    confirmText: 'Sí, iniciar subasta',
    severity: 'warning',
  },
  end_auction: {
    title: '¿Finalizar subasta del lote?',
    description: '', 
    confirmText: 'Sí, finalizar subasta',
    severity: 'error',
  },
  delete_plantilla: {
    title: '¿Eliminar plantilla?',
    description: '', 
    confirmText: 'Sí, eliminar',
    severity: 'error',
  },
  toggle_plantilla_status: {
    title: '¿Cambiar estado de la plantilla?',
    description: '', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  // ✅ Configuración base para KYC
  approve_kyc: {
    title: '¿Aprobar verificación?',
    description: 'El usuario será habilitado para operar.',
    confirmText: 'Sí, Aprobar',
    severity: 'info', 
  },
};

// 3. El Hook
export const useConfirmDialog = () => {
  const [state, setState] = useState<{
    open: boolean;
    action: ConfirmAction;
    data: any;
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
  const getConfig = (): ConfirmConfig | null => {
    if (!state.action) return null;

    const baseConfig = CONFIRM_CONFIGS[state.action];

    // --- CASOS DINÁMICOS ---

    // Caso especial: approve_kyc (NUEVO)
    if (state.action === 'approve_kyc' && state.data) {
        const userName = state.data.nombre_completo || 'el usuario';
        return {
            title: `¿Aprobar verificación KYC?`,
            description: `Estás a punto de validar la identidad de ${userName}. El usuario recibirá una notificación y quedará habilitado para operar en la plataforma.`,
            confirmText: 'Sí, Aprobar Verificación',
            severity: 'info', // O 'success' si tu ConfirmDialog lo soporta
        };
    }

    // Caso especial: toggle_project_visibility
    if (state.action === 'toggle_project_visibility' && state.data) {
      const isActive = state.data.activo;
      
      return {
        title: isActive ? '¿Ocultar proyecto?' : '¿Mostrar proyecto?',
        description: isActive 
          ? 'El proyecto dejará de ser visible para los usuarios en la plataforma. Podrás reactivarlo cuando lo desees.'
          : 'El proyecto será visible para todos los usuarios en la plataforma. Asegúrate de que esté listo para ser publicado.',
        confirmText: isActive ? 'Sí, ocultar' : 'Sí, mostrar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // Caso especial: toggle_user_status
    if (state.action === 'toggle_user_status' && state.data) {
      const isActive = state.data.activo;
      const userName = `${state.data.nombre} ${state.data.apellido}`;
      
      return {
        title: isActive ? '¿Desactivar usuario?' : 'Activar usuario?',
        description: isActive 
          ? `${userName} no podrá iniciar sesión ni realizar operaciones hasta que sea Activado manualmente.`
          : `${userName} recuperará el acceso completo a la plataforma y podrá iniciar sesión normalmente.`,
        confirmText: isActive ? 'Sí, Desactivar' : 'Sí, Activar',
        severity: isActive ? 'error' : 'info',
      };
    }

    // Caso especial: toggle_lote_visibility
    if (state.action === 'toggle_lote_visibility' && state.data) {
      const isActive = state.data.activo;
      
      return {
        title: isActive ? '¿Ocultar lote?' : '¿Mostrar lote?',
        description: isActive 
          ? 'El lote dejará de ser visible para los usuarios en la plataforma. Podrás reactivarlo cuando lo desees.'
          : 'El lote será visible para todos los usuarios en la plataforma. Asegúrate de que esté listo para ser publicado.',
        confirmText: isActive ? 'Sí, ocultar' : 'Sí, mostrar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // Caso especial: start_auction
    if (state.action === 'start_auction' && state.data) {
      const loteName = state.data.nombre_lote;
      
      return {
        title: '¿Iniciar subasta del lote?',
        description: `Se iniciará la subasta para "${loteName}". Los usuarios podrán comenzar a pujar inmediatamente. Esta acción no se puede deshacer.`,
        confirmText: 'Sí, iniciar subasta',
        severity: 'warning',
      };
    }

    // Caso especial: end_auction
    if (state.action === 'end_auction' && state.data) {
      const loteName = state.data.nombre_lote;
      
      return {
        title: '¿Finalizar subasta del lote?',
        description: `Se finalizará la subasta para "${loteName}". Se determinará un ganador y no se podrán realizar más pujas. Esta acción es irreversible.`,
        confirmText: 'Sí, finalizar subasta',
        severity: 'error',
      };
    }

    // Caso especial: delete_plantilla
    if (state.action === 'delete_plantilla' && state.data) {
      const fileName = state.data.nombre_archivo;
      
      return {
        title: '¿Eliminar plantilla?',
        description: `La plantilla "${fileName}" dejará de estar disponible y será movida a la papelera. Esta acción puede revertirse posteriormente.`,
        confirmText: 'Sí, eliminar',
        severity: 'error',
      };
    }

    // Caso especial: toggle_plantilla_status
    if (state.action === 'toggle_plantilla_status' && state.data) {
      const isActive = state.data.activo;
      const fileName = state.data.nombre_archivo;
      
      return {
        title: isActive ? '¿Desactivar plantilla?' : '¿Activar plantilla?',
        description: isActive 
          ? `La plantilla "${fileName}" dejará de estar disponible para generar nuevos contratos. Los contratos existentes no se verán afectados.`
          : `La plantilla "${fileName}" volverá a estar disponible para generar nuevos contratos.`,
        confirmText: isActive ? 'Sí, desactivar' : 'Sí, activar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // Caso especial: Admin cancela suscripción
    if (state.action === 'admin_cancel_subscription' && state.data) {
      const userName = `${state.data.usuario?.nombre} ${state.data.usuario?.apellido}`;
      const lote = state.data.nombre_lote || `ID ${state.data.id}`;
      
      return {
        title: `¿Cancelar suscripción #${state.data.id}?`,
        description: `Estás a punto de cancelar la suscripción de ${userName} para el lote ${lote}. Esta acción generará una deuda inmediata por el saldo restante y anulará el acceso.`,
        confirmText: 'Sí, cancelar y generar deuda',
        severity: 'error',
      };
    }

    return baseConfig;
  };

  return {
    ...state,
    config: getConfig(),
    confirm,
    close,
  };
};
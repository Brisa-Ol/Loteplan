// src/hooks/useConfirmDialog.ts
import { useState, useCallback } from 'react';

/**
 * Interfaz para permitir acceso seguro a propiedades comunes 
 * sin usar 'any' dentro de la lógica del hook.
 */
interface EntityWithDetails {
  id?: number | string;
  nombre?: string;
  apellido?: string;
  nombre_completo?: string;
  nombre_proyecto?: string;
  nombre_lote?: string;
  nombre_archivo?: string;
  activo?: boolean;
  usuario?: { nombre: string; apellido: string };
}

// 1. Definición de acciones posibles
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
  | 'approve_kyc'
  | 'force_confirm_transaction'
  | null;

interface ConfirmConfig {
  title: string;
  description: string;
  confirmText: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

// 2. Configuración base estática
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
  approve_kyc: {
    title: '¿Aprobar verificación?',
    description: 'El usuario será habilitado para operar.',
    confirmText: 'Sí, Aprobar',
    severity: 'info', 
  },
  force_confirm_transaction: {
    title: '¿Forzar confirmación?',
    description: 'Esta acción marcará la transacción como pagada manualmente.',
    confirmText: 'Sí, Forzar Pago',
    severity: 'error',
  },
};

// 3. El Hook con Genéricos
export const useConfirmDialog = <T = unknown>() => {
  const [state, setState] = useState<{
    open: boolean;
    action: ConfirmAction;
    data: T | null;
  }>({ 
    open: false, 
    action: null, 
    data: null 
  });

  const confirm = useCallback((action: NonNullable<ConfirmAction>, data: T | null = null) => {
    setState({ open: true, action, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, action: null, data: null });
  }, []);

  // Obtenemos la configuración dinámica basada en la acción y los datos
  const getConfig = (): ConfirmConfig | null => {
    if (!state.action) return null;

    const baseConfig = CONFIRM_CONFIGS[state.action];
    const d = state.data as EntityWithDetails; // Casting seguro interno

    // Manejo de textos dinámicos
    switch (state.action) {
      case 'force_confirm_transaction':
        return {
          ...baseConfig,
          title: `¿Forzar transacción #${d?.id}?`,
          description: `⚠️ ESTA ACCIÓN ES IRREVERSIBLE. Estás confirmando manualmente que el dinero llegó al banco/pasarela. Esto asignará activos al usuario inmediatamente.`,
          confirmText: 'Sí, Confirmar Manualmente',
        };

      case 'approve_kyc':
        return {
          ...baseConfig,
          title: `¿Aprobar verificación KYC?`,
          description: `Estás a punto de validar la identidad de ${d?.nombre_completo || 'el usuario'}. El usuario recibirá una notificación y quedará habilitado para operar.`,
          confirmText: 'Sí, Aprobar Verificación',
        };

      case 'toggle_project_visibility':
        return {
          ...baseConfig,
          title: d?.activo ? '¿Ocultar proyecto?' : '¿Mostrar proyecto?',
          description: d?.activo 
            ? 'El proyecto dejará de ser visible para los usuarios. Podrás reactivarlo cuando lo desees.'
            : 'El proyecto será visible para todos los usuarios. Asegúrate de que esté listo para ser publicado.',
          confirmText: d?.activo ? 'Sí, ocultar' : 'Sí, mostrar',
          severity: d?.activo ? 'warning' : 'info',
        };

      case 'toggle_user_status':
        return {
          ...baseConfig,
          title: d?.activo ? '¿Desactivar usuario?' : '¿Activar usuario?',
          description: d?.activo 
            ? `${d?.nombre} ${d?.apellido} no podrá iniciar sesión ni realizar operaciones hasta que sea activado manualmente.`
            : `${d?.nombre} ${d?.apellido} recuperará el acceso completo a la plataforma.`,
          confirmText: d?.activo ? 'Sí, Desactivar' : 'Sí, Activar',
          severity: d?.activo ? 'error' : 'info',
        };

      case 'toggle_lote_visibility':
        return {
          ...baseConfig,
          title: d?.activo ? '¿Ocultar lote?' : '¿Mostrar lote?',
          description: d?.activo 
            ? 'El lote dejará de ser visible en la plataforma.'
            : 'El lote será visible para todos los usuarios.',
          confirmText: d?.activo ? 'Sí, ocultar' : 'Sí, mostrar',
          severity: d?.activo ? 'warning' : 'info',
        };

      case 'start_auction':
        return {
          ...baseConfig,
          title: '¿Iniciar subasta del lote?',
          description: `Se iniciará la subasta para "${d?.nombre_lote}". Los usuarios podrán comenzar a pujar inmediatamente.`,
          confirmText: 'Sí, iniciar subasta',
        };

      case 'end_auction':
        return {
          ...baseConfig,
          title: '¿Finalizar subasta del lote?',
          description: `Se finalizará la subasta para "${d?.nombre_lote}". Se determinará un ganador y no se podrán realizar más pujas.`,
          confirmText: 'Sí, finalizar subasta',
        };

      case 'delete_plantilla':
        return {
          ...baseConfig,
          title: '¿Eliminar plantilla?',
          description: `La plantilla "${d?.nombre_archivo}" dejará de estar disponible y será movida a la papelera.`,
        };

      case 'toggle_plantilla_status':
        return {
          ...baseConfig,
          title: d?.activo ? '¿Desactivar plantilla?' : '¿Activar plantilla?',
          description: d?.activo 
            ? `La plantilla "${d?.nombre_archivo}" dejará de estar disponible para nuevos contratos.`
            : `La plantilla "${d?.nombre_archivo}" volverá a estar disponible para generar nuevos contratos.`,
          confirmText: d?.activo ? 'Sí, desactivar' : 'Sí, activar',
        };

      case 'admin_cancel_subscription':
        return {
          ...baseConfig,
          title: `¿Cancelar suscripción #${d?.id}?`,
          description: `Estás a punto de cancelar la suscripción de ${d?.usuario?.nombre} ${d?.usuario?.apellido}. Esta acción generará una deuda inmediata y anulará el acceso.`,
        };

      default:
        return baseConfig;
    }
  };

  return {
    open: state.open,
    action: state.action,
    data: state.data,
    config: getConfig(),
    confirm,
    close,
  };
};
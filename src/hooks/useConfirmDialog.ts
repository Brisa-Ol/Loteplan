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
  | 'approve_kyc'
  | 'force_confirm_transaction' // ✅ Acción para AdminTransacciones
  | 'cancel_puja'               // ✅ Acción para MisPujas
  | null;

interface ConfirmConfig {
  title: string;
  description: string;
  confirmText: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

// 2. Configuración centralizada (Fallbacks y textos estáticos)
const CONFIRM_CONFIGS: Record<NonNullable<ConfirmAction>, ConfirmConfig> = {
  cancel_subscription: {
    title: '¿Cancelar suscripción?',
    description: 'Perderás tu progreso de antigüedad, tokens acumulados y se detendrán los cobros futuros. Esta acción es irreversible.',
    confirmText: 'Sí, cancelar definitivamente',
    severity: 'error',
  },
  admin_cancel_subscription: {
    title: '¿Forzar cancelación?',
    description: 'Se cancelará la suscripción del usuario inmediatamente.', 
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
    title: '¿Cambiar visibilidad?',
    description: 'Esto afectará si los usuarios pueden ver el proyecto.', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  toggle_user_status: {
    title: '¿Cambiar estado del usuario?',
    description: 'Afectará el acceso del usuario a la plataforma.', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  toggle_lote_visibility: {
    title: '¿Cambiar visibilidad del lote?',
    description: 'Esto ocultará o mostrará el lote en el listado público.', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  start_project_process: {
    title: '¿Iniciar proceso de cobro?',
    description: 'Esto activará el conteo de meses y generará las cuotas para todos los suscriptores. Esta acción notificará a los usuarios.',
    confirmText: 'Sí, iniciar ahora',
    severity: 'warning',
  },
  start_auction: {
    title: '¿Iniciar subasta?',
    description: 'Los usuarios podrán comenzar a pujar inmediatamente.', 
    confirmText: 'Sí, iniciar',
    severity: 'warning',
  },
  end_auction: {
    title: '¿Finalizar subasta?',
    description: 'Se cerrará la subasta y se determinará un ganador. Esta acción es irreversible.', 
    confirmText: 'Sí, finalizar',
    severity: 'error',
  },
  delete_plantilla: {
    title: '¿Eliminar plantilla?',
    description: 'El archivo se moverá a la papelera.', 
    confirmText: 'Sí, eliminar',
    severity: 'error',
  },
  toggle_plantilla_status: {
    title: '¿Cambiar estado?',
    description: 'Afectará la disponibilidad de la plantilla para nuevos contratos.', 
    confirmText: 'Confirmar',
    severity: 'warning',
  },
  approve_kyc: {
    title: '¿Aprobar verificación?',
    description: 'El usuario será habilitado para operar.',
    confirmText: 'Sí, Aprobar',
    severity: 'info', 
  },
  // ✅ NUEVAS CONFIGURACIONES BASE AGREGADAS
  force_confirm_transaction: {
    title: '¿Forzar confirmación?',
    description: 'Esta acción marcará la transacción como pagada manualmente. Solo usar si el dinero fue verificado en banco.',
    confirmText: 'Sí, Forzar Pago',
    severity: 'error',
  },
  cancel_puja: {
    title: '¿Cancelar puja?',
    description: 'Tu oferta será retirada de la subasta.',
    confirmText: 'Sí, cancelar puja',
    severity: 'warning',
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

  // Obtenemos la configuración dinámica basada en la acción y los datos
  const getConfig = (): ConfirmConfig | null => {
    if (!state.action) return null;

    // Obtenemos la config base (ahora segura porque todas las keys existen)
    const baseConfig = CONFIRM_CONFIGS[state.action];

    // --- LÓGICA DINÁMICA (Overrides) ---

    // 1. Forzar transacción (Admin)
    if (state.action === 'force_confirm_transaction' && state.data) {
        return {
            ...baseConfig,
            title: `¿Forzar transacción #${state.data.id}?`,
            description: `⚠️ ESTA ACCIÓN ES IRREVERSIBLE. Estás confirmando manualmente que el dinero llegó. El usuario recibirá sus activos inmediatamente.`,
        };
    }

    // 2. Aprobar KYC (Admin)
    if (state.action === 'approve_kyc' && state.data) {
        const userName = state.data.nombre_completo || 'el usuario';
        return {
            ...baseConfig,
            description: `Estás a punto de validar la identidad de ${userName}. Quedará habilitado para operar.`,
        };
    }

    // 3. Visibilidad Proyecto (Admin)
    if (state.action === 'toggle_project_visibility' && state.data) {
      const isActive = state.data.activo;
      return {
        ...baseConfig,
        title: isActive ? '¿Ocultar proyecto?' : '¿Mostrar proyecto?',
        description: isActive 
          ? 'El proyecto dejará de ser visible para los usuarios.'
          : 'El proyecto será visible para todos los usuarios. Asegúrate de que esté listo.',
        confirmText: isActive ? 'Sí, ocultar' : 'Sí, mostrar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // 4. Estado Usuario (Admin)
    if (state.action === 'toggle_user_status' && state.data) {
      const isActive = state.data.activo;
      const userName = `${state.data.nombre} ${state.data.apellido}`;
      return {
        ...baseConfig,
        title: isActive ? '¿Desactivar usuario?' : '¿Activar usuario?',
        description: isActive 
          ? `${userName} no podrá iniciar sesión hasta que sea reactivado manualmente.`
          : `${userName} recuperará el acceso completo a la plataforma.`,
        confirmText: isActive ? 'Sí, Desactivar' : 'Sí, Activar',
        severity: isActive ? 'error' : 'info',
      };
    }

    // 5. Visibilidad Lote (Admin)
    if (state.action === 'toggle_lote_visibility' && state.data) {
      const isActive = state.data.activo;
      return {
        ...baseConfig,
        title: isActive ? '¿Ocultar lote?' : '¿Mostrar lote?',
        confirmText: isActive ? 'Sí, ocultar' : 'Sí, mostrar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // 6. Iniciar Subasta (Admin)
    if (state.action === 'start_auction' && state.data) {
      return {
        ...baseConfig,
        description: `Se iniciará la subasta para "${state.data.nombre_lote}". Los usuarios podrán pujar inmediatamente.`,
      };
    }

    // 7. Finalizar Subasta (Admin)
    if (state.action === 'end_auction' && state.data) {
      return {
        ...baseConfig,
        description: `Se finalizará la subasta para "${state.data.nombre_lote}". Se determinará un ganador y se bloquearán nuevas ofertas.`,
      };
    }

    // 8. Borrar Plantilla (Admin)
    if (state.action === 'delete_plantilla' && state.data) {
      return {
        ...baseConfig,
        description: `La plantilla "${state.data.nombre_archivo}" será movida a la papelera.`,
      };
    }

    // 9. Estado Plantilla (Admin)
    if (state.action === 'toggle_plantilla_status' && state.data) {
      const isActive = state.data.activo;
      return {
        ...baseConfig,
        title: isActive ? '¿Desactivar plantilla?' : '¿Activar plantilla?',
        confirmText: isActive ? 'Sí, desactivar' : 'Sí, activar',
        severity: isActive ? 'warning' : 'info',
      };
    }

    // 10. Cancelar Suscripción (Admin)
    if (state.action === 'admin_cancel_subscription' && state.data) {
      const userName = state.data.usuario ? `${state.data.usuario.nombre} ${state.data.usuario.apellido}` : 'el usuario';
      const lote = state.data.nombre_lote || `ID ${state.data.id}`;
      return {
        ...baseConfig,
        title: `¿Cancelar suscripción #${state.data.id}?`,
        description: `Estás a punto de cancelar la suscripción de ${userName} para el lote ${lote}. Se generará deuda por el saldo restante.`,
      };
    }

    // 11. Cancelar Puja (Cliente)
    if (state.action === 'cancel_puja' && state.data) {
        // Formatear moneda si es posible, sino usar valor crudo
        const monto = state.data.monto_puja 
            ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(state.data.monto_puja)
            : 'tu monto';
            
        const nombreLote = state.data.lote?.nombre_lote || 'este lote';

        return {
            ...baseConfig,
            description: `Estás a punto de cancelar tu oferta de ${monto} para ${nombreLote}. El token será devuelto a tu cuenta.`,
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
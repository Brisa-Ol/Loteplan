import { useState, useCallback, useMemo } from 'react';

// 1. Tipos de acciones
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
  | 'cancel_puja'
  | 'cancel_ganadora_anticipada'
  | 'delete_bulk_images'
  | 'delete_single_image'
  | 'close_with_unsaved_changes'
  | null;

export interface ConfirmConfig {
  title: string;
  description: string;
  confirmText: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  requireInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

// 2. Configuración Base Estática
const BASE_CONFIGS: Record<string, Partial<ConfirmConfig>> = {
  // Destructivas (Rojo/Error)
  delete_account: { title: '¿Eliminar cuenta?', confirmText: 'Sí, eliminar mi cuenta', severity: 'error' },
  admin_cancel_subscription: { title: '¿Forzar cancelación?', confirmText: 'Sí, cancelar suscripción', severity: 'error' },
  end_auction: { title: '¿Finalizar subasta?', confirmText: 'Sí, finalizar', severity: 'error' },
  delete_plantilla: { title: '¿Eliminar plantilla?', confirmText: 'Sí, eliminar', severity: 'error' },
  force_confirm_transaction: { title: '¿Forzar confirmación?', confirmText: 'Sí, Forzar Pago', severity: 'error' },
  cancel_ganadora_anticipada: { title: '¿Anular adjudicación?', confirmText: 'Sí, Anular', severity: 'error', requireInput: true },
  delete_bulk_images: { title: '¿Eliminar imágenes?', confirmText: 'Sí, eliminar', severity: 'error' },
  delete_single_image: { title: '¿Eliminar imagen?', confirmText: 'Sí, eliminar', severity: 'error' },
  cancel_subscription: { title: '¿Cancelar suscripción?', confirmText: 'Sí, cancelar definitivamente', severity: 'error' },

  // Advertencias / Decisiones (Naranja/Warning - Se verán como Primary)
  close_with_unsaved_changes: { title: '¿Cerrar sin guardar?', confirmText: 'Sí, cerrar', severity: 'warning' },
  logout: { title: '¿Cerrar sesión?', confirmText: 'Sí, salir', severity: 'info' }, // Info usa Primary por defecto
  remove_favorite: { title: '¿Quitar de favoritos?', confirmText: 'Sí, quitar', severity: 'warning' },
  cancel_puja: { title: '¿Cancelar puja?', confirmText: 'Sí, cancelar puja', severity: 'warning' },
  
  // Toggles (Warning)
  toggle_project_visibility: { severity: 'warning' },
  toggle_user_status: { severity: 'warning' },
  toggle_lote_visibility: { severity: 'warning' },
  toggle_plantilla_status: { severity: 'warning' },
  
  // Acciones Operativas (Info/Success)
  start_project_process: { title: '¿Iniciar proceso de cobro?', confirmText: 'Sí, iniciar ahora', severity: 'warning' },
  start_auction: { title: '¿Iniciar subasta?', confirmText: 'Sí, iniciar', severity: 'warning' },
  approve_kyc: { title: '¿Aprobar verificación?', confirmText: 'Sí, Aprobar', severity: 'info' },
};

// 3. El Hook Optimizado
export const useConfirmDialog = () => {
  const [state, setState] = useState<{
    open: boolean;
    action: ConfirmAction;
    data: any;
  }>({
    open: false,
    action: null,
    data: null,
  });

  const confirm = useCallback((action: NonNullable<ConfirmAction>, data?: any) => {
    setState({ open: true, action, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, action: null, data: null });
  }, []);

  // Lógica dinámica para resolver textos
  const config = useMemo((): ConfirmConfig | null => {
    if (!state.action) return null;

    const base = BASE_CONFIGS[state.action] || {};
    const data = state.data || {};
    
    // Valores por defecto seguros
    let title = base.title || '¿Estás seguro?';
    let description = base.description || 'Esta acción podría tener consecuencias.';
    let confirmText = base.confirmText || 'Confirmar';
    let severity = base.severity || 'info';

    // --- Lógica Dinámica Específica ---
    switch (state.action) {
      case 'logout':
        description = 'Tendrás que ingresar tus credenciales nuevamente para acceder.';
        break;
      case 'close_with_unsaved_changes':
        description = `Tienes ${data.count} imagen${data.count > 1 ? 'es' : ''} pendiente${data.count > 1 ? 's' : ''} de subir. Si cierras ahora, se perderán.`;
        break;
      case 'delete_single_image':
        description = `La imagen "${data.imagen?.descripcion || 'seleccionada'}" será eliminada permanentemente.`;
        break;
      case 'delete_bulk_images':
        description = `Se eliminarán ${data.count} imágenes permanentemente.`;
        break;
      case 'delete_account':
        description = 'Se eliminarán todos tus datos permanentemente. Esta acción NO se puede deshacer.';
        break;
      case 'cancel_subscription':
        description = 'Perderás tu progreso de antigüedad y tokens. Esta acción es irreversible.';
        break;
      case 'cancel_puja':
        const monto = data.monto_puja ? `$${data.monto_puja}` : 'tu monto';
        description = `Estás a punto de cancelar tu oferta de ${monto} para ${data.lote?.nombre_lote || 'este lote'}.`;
        break;
      
      // Toggles Genéricos (Visibilidad/Estado)
      case 'toggle_project_visibility':
      case 'toggle_lote_visibility':
      case 'toggle_user_status':
      case 'toggle_plantilla_status':
        const isActive = data.activo;
        const entity = state.action.split('_')[1]; // project, lote, user, plantilla
        const actionVerb = isActive ? 'Ocultar' : 'Mostrar';
        const actionVerbUser = isActive ? 'Desactivar' : 'Activar'; // Caso especial usuario/plantilla
        
        if (state.action === 'toggle_user_status' || state.action === 'toggle_plantilla_status') {
            title = `¿${actionVerbUser} ${entity}?`;
            confirmText = `Sí, ${actionVerbUser.toLowerCase()}`;
            description = isActive 
                ? `El ${entity} quedará inhabilitado para operar.`
                : `El ${entity} recuperará el acceso/disponibilidad.`;
            if(isActive) severity = 'error'; // Desactivar usuario es grave
        } else {
            title = `¿${actionVerb} ${entity}?`;
            confirmText = `Sí, ${actionVerb.toLowerCase()}`;
            description = isActive 
                ? `El ${entity} dejará de ser visible públicamente.`
                : `El ${entity} será visible para todos los usuarios.`;
        }
        break;

      case 'admin_cancel_subscription':
        const user = data.usuario ? `${data.usuario.nombre} ${data.usuario.apellido}` : 'el usuario';
        description = `Cancelarás la suscripción de ${user}. Se generará deuda por el saldo restante.`;
        break;

      case 'start_auction':
        description = `Se iniciará la subasta para "${data.nombre_lote}". Los usuarios podrán pujar inmediatamente.`;
        break;
      case 'end_auction':
        description = `Se cerrará la subasta para "${data.nombre_lote}". Se determinará un ganador automáticamente.`;
        break;
        
      case 'approve_kyc':
        description = `Estás a punto de validar la identidad de ${data.nombre_completo}. Quedará habilitado.`;
        break;
        
      case 'force_confirm_transaction':
        description = `⚠️ IRREVERSIBLE. Confirmas manualmente que el dinero llegó (Transacción #${data.id}).`;
        break;
    }

    return {
      title,
      description,
      confirmText,
      severity,
      requireInput: base.requireInput,
      inputLabel: base.inputLabel,
      inputPlaceholder: base.inputPlaceholder,
    };
  }, [state.action, state.data]);

  return {
    ...state,
    config,
    confirm,
    close,
  };
};
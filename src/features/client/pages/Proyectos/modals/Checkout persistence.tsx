// src/features/client/pages/Proyectos/modals/Checkout persistence.tsx

import { env } from '@/core/config/env';
import React from "react";

/**
 * Este sistema maneja la persistencia del estado del checkout
 * para recuperar el flujo cuando:
 * - El usuario recarga la página
 * - Pierde la conexión
 * - Cierra accidentalmente la ventana
 * - Regresa después de pagar en Mercado Pago
 */

// ✅ Helper centralizado: solo loguea si env.enableDebugLogs está activo
const log = {
  info: (...args: unknown[]) => { if (env.enableDebugLogs) console.log(...args); },
  warn: (...args: unknown[]) => { if (env.enableDebugLogs) console.warn(...args); },
  error: (...args: unknown[]) => { if (env.enableDebugLogs) console.error(...args); },
};

// ✅ CLAVES DE PERSISTENCIA
export const STORAGE_KEYS = {
  CHECKOUT_STATE: 'checkout_wizard_state',
  TRANSACTION_ID: 'checkout_tx_id',
  PROJECT_ID: 'checkout_proj_id',
  ACTIVE_STEP: 'checkout_active_step',
  PAYMENT_SUCCESS: 'checkout_payment_success',
  SIGNATURE_DATA: 'checkout_signature_data',
  LOCATION: 'checkout_location',
  TIPO: 'checkout_tipo',
} as const;

// ✅ INTERFACE PARA EL ESTADO PERSISTENTE
export interface CheckoutPersistedState {
  projectId: number;
  tipo: 'suscripcion' | 'inversion';
  activeStep: number;
  transactionId: number | null;
  paymentSuccess: boolean;
  signatureDataUrl: string | null;
  location: { lat: string; lng: string } | null;
  timestamp: number;
}

// ===================================================
// GESTOR DE ESTADO PERSISTENTE
// ===================================================
export class CheckoutStateManager {
  private static readonly STATE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Guarda el estado completo del checkout
   */
  static saveState(state: CheckoutPersistedState): void {
    try {
      const stateWithTimestamp = { ...state, timestamp: Date.now() };

      localStorage.setItem(STORAGE_KEYS.CHECKOUT_STATE, JSON.stringify(stateWithTimestamp));

      if (state.transactionId) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTION_ID, String(state.transactionId));
        localStorage.setItem(STORAGE_KEYS.PROJECT_ID, String(state.projectId));
      }

      localStorage.setItem(STORAGE_KEYS.ACTIVE_STEP, String(state.activeStep));
      localStorage.setItem(STORAGE_KEYS.PAYMENT_SUCCESS, String(state.paymentSuccess));
      localStorage.setItem(STORAGE_KEYS.TIPO, state.tipo);

      if (state.signatureDataUrl) {
        localStorage.setItem(STORAGE_KEYS.SIGNATURE_DATA, state.signatureDataUrl);
      }
      if (state.location) {
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(state.location));
      }

      log.info('✅ Estado del checkout guardado:', state);
    } catch (error) {
      log.error('❌ Error guardando estado del checkout:', error);
    }
  }

  /**
   * Carga el estado guardado para un proyecto específico
   */
  static loadState(projectId: number): CheckoutPersistedState | null {
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.CHECKOUT_STATE);
      if (!savedState) {
        return this.loadLegacyState(projectId);
      }

      const state: CheckoutPersistedState = JSON.parse(savedState);

      if (state.projectId !== projectId) {
        log.warn('⚠️ Estado guardado es de otro proyecto');
        this.clearState();
        return null;
      }

      const age = Date.now() - state.timestamp;
      if (age > this.STATE_EXPIRATION_MS) {
        log.warn('⚠️ Estado guardado expiró');
        this.clearState();
        return null;
      }

      log.info('✅ Estado recuperado:', state);
      return state;
    } catch (error) {
      log.error('❌ Error cargando estado del checkout:', error);
      return null;
    }
  }

  /**
   * Intenta recuperar el estado de las claves individuales (compatibilidad)
   */
  private static loadLegacyState(projectId: number): CheckoutPersistedState | null {
    try {
      const savedTxId = localStorage.getItem(STORAGE_KEYS.TRANSACTION_ID);
      const savedProjId = localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
      const savedStep = localStorage.getItem(STORAGE_KEYS.ACTIVE_STEP);
      const savedSuccess = localStorage.getItem(STORAGE_KEYS.PAYMENT_SUCCESS);
      const savedSig = localStorage.getItem(STORAGE_KEYS.SIGNATURE_DATA);
      const savedLoc = localStorage.getItem(STORAGE_KEYS.LOCATION);
      const savedTipo = localStorage.getItem(STORAGE_KEYS.TIPO);

      if (!savedTxId || savedProjId !== String(projectId)) return null;

      return {
        projectId,
        tipo: (savedTipo as 'suscripcion' | 'inversion') || 'inversion',
        activeStep: savedStep ? Number(savedStep) : 0,
        transactionId: Number(savedTxId),
        paymentSuccess: savedSuccess === 'true',
        signatureDataUrl: savedSig || null,
        location: savedLoc ? JSON.parse(savedLoc) : null,
        timestamp: Date.now()
      };
    } catch (error) {
      log.error('❌ Error cargando estado legacy:', error);
      return null;
    }
  }

  /**
   * Limpia todo el estado guardado
   */
  static clearState(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      log.info('🧹 Estado del checkout limpiado');
    } catch (error) {
      log.error('❌ Error limpiando estado del checkout:', error);
    }
  }

  static hasRecoverableState(projectId: number): boolean {
    const state = this.loadState(projectId);
    return state !== null && (state.paymentSuccess || state.activeStep >= 3);
  }

  static updateStep(projectId: number, step: number): void {
    const state = this.loadState(projectId);
    if (state) this.saveState({ ...state, activeStep: step });
  }

  static markPaymentSuccess(projectId: number, transactionId: number): void {
    const state = this.loadState(projectId);
    if (state) this.saveState({ ...state, transactionId, paymentSuccess: true, activeStep: 4 });
  }

  static saveSignature(projectId: number, signatureDataUrl: string): void {
    const state = this.loadState(projectId);
    if (state) this.saveState({ ...state, signatureDataUrl });
  }
}

// ===================================================
// HOOK DE RECUPERACIÓN DE ESTADO
// ===================================================
export const useCheckoutRecovery = (
  projectId: number,
  isOpen: boolean,
  onRecover: (state: CheckoutPersistedState) => void,
  onDiscard: () => void
) => {
  const [showRecoveryPrompt, setShowRecoveryPrompt] = React.useState(false);
  const [recoveredState, setRecoveredState] = React.useState<CheckoutPersistedState | null>(null);
  const hasAttemptedRecovery = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen || hasAttemptedRecovery.current) return;

    const savedState = CheckoutStateManager.loadState(projectId);
    if (savedState && (savedState.paymentSuccess || savedState.activeStep >= 3)) {
      setRecoveredState(savedState);
      setShowRecoveryPrompt(true);
      hasAttemptedRecovery.current = true;
    }
  }, [isOpen, projectId]);

  const handleRecover = React.useCallback(() => {
    if (recoveredState) {
      onRecover(recoveredState);
      setShowRecoveryPrompt(false);
    }
  }, [recoveredState, onRecover]);

  const handleDiscard = React.useCallback(() => {
    CheckoutStateManager.clearState();
    setShowRecoveryPrompt(false);
    setRecoveredState(null);
    onDiscard();
  }, [onDiscard]);

  const resetRecovery = React.useCallback(() => {
    hasAttemptedRecovery.current = false;
  }, []);

  return { showRecoveryPrompt, recoveredState, handleRecover, handleDiscard, resetRecovery };
};
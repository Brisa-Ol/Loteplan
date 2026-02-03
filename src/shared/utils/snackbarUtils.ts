// Definición de tipos para la función de alerta
type AlertType = 'success' | 'error' | 'warning' | 'info';
type SnackbarFn = (msg: string, type: AlertType) => void;

// Referencia mutable (Singleton pattern)
let globalShowAlert: SnackbarFn | null = null;

/**
 * INICIALIZADOR: Debe llamarse una sola vez en el componente raíz (App.tsx o Layout)
 * Conecta la función del contexto de UI con este utilitario global.
 */
export const setGlobalSnackbar = (fn: SnackbarFn) => {
  globalShowAlert = fn;
};

// --- Helpers exportados para usar en toda la app ---

export const notifyError = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'error');
  else console.error('🚨 [Snackbar Error]:', msg);
};

export const notifySuccess = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'success');
};

export const notifyWarning = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'warning');
};

export const notifyInfo = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'info');
};
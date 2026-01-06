// src/utils/snackbarUtils.ts

// Definimos la firma de la función
type SnackbarFn = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;

// Variable interna que guardará la referencia a la función del Contexto
let globalShowAlert: SnackbarFn | null = null;

// 1. React llamará a esto para "conectar" el snackbar
export const setGlobalSnackbar = (fn: SnackbarFn) => {
  globalShowAlert = fn;
};

// 2. Tu httpService llamará a esto para mostrar alertas
export const notifyError = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'error');
  else console.warn('⚠️ Snackbar no inicializado. Error:', msg);
};

export const notifySuccess = (msg: string) => {
  if (globalShowAlert) globalShowAlert(msg, 'success');
};

export const notifyWarning = (msg: string) => {
    if (globalShowAlert) globalShowAlert(msg, 'warning');
};
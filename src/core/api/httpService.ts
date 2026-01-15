import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env'; 
import { secureStorage } from '../../shared/utils/secureStorage';
import { notifyError, notifyWarning } from '../../shared/utils/snackbarUtils';

// Definición de tipos
export interface ApiError {
  status: number;
  message: string;
  type: 'SECURITY_ACTION' | 'ROLE_RESTRICTION' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'UNKNOWN' | 'VALIDATION_ERROR';
  action_required?: 'enable_2fa' | 'complete_kyc';
  kyc_status?: string;
  code?: string;
  originalError?: unknown;
}

const httpService = axios.create({
  baseURL: env.apiBaseUrl, 
  headers: { 'Content-Type': 'application/json' },
});

// 📤 Request Interceptor
httpService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = secureStorage.getToken(); 
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData && config.headers) delete config.headers['Content-Type'];
    return config;
  },
  (error) => Promise.reject(error)
);

// 📥 Response Interceptor
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    // Manejar soft-errors { success: false }
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      const message = data.error || 'Error en la operación';
      // No mostramos toast si es login, dejamos que el componente maneje el error
      if (!response.config.url?.includes('/auth/login')) {
         notifyError(message);
      }
      return Promise.reject({ status: response.status, message: message, type: 'VALIDATION_ERROR', originalError: data } as ApiError);
    }
    return response;
  },
  (error) => {
    // A) Error de Red
    if (!error.response) {
      notifyError('No se pudo conectar con el servidor.'); 
      return Promise.reject({ status: 0, message: 'Error de conexión', type: 'UNKNOWN', originalError: error } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;
    const url = error.config?.url || '';
    
    // Detectar si es una petición de Login
    const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/2fa/verify');
    const msg = data.error || data.message || 'Error desconocido';

    // B) 401: Credenciales o Sesión
    if (status === 401) {
      // Si es Login -> Devolver error al formulario (SIN REDIRECT, SIN TOAST)
      if (isLoginEndpoint) {
        return Promise.reject({ status: 401, message: msg, type: 'AUTH_ERROR', originalError: error } as ApiError);
      }
      // Si es Navegación -> Redirect al Login
      if (!window.location.pathname.includes('/login')) {
        secureStorage.clearToken();
        setTimeout(() => window.location.href = '/login', 1000);
      }
      return Promise.reject({ status: 401, message: msg, type: 'AUTH_ERROR', originalError: error } as ApiError);
    }

    // C) 403: Cuenta no activada (según tu backend)
    if (status === 403) {
      // Si es Login y dice "cuenta no activada", devolver al formulario
      if (isLoginEndpoint && msg.toLowerCase().includes('cuenta no activada')) {
        return Promise.reject({ status: 403, message: msg, type: 'AUTH_ERROR', originalError: error } as ApiError);
      }
      // Otros 403
      notifyError(msg);
      return Promise.reject({ status: 403, message: msg, type: 'ROLE_RESTRICTION', originalError: error } as ApiError);
    }

    // D) Otros errores
    notifyError(msg);
    return Promise.reject({ status: status, message: msg, type: 'VALIDATION_ERROR', originalError: error } as ApiError);
  }
);

export default httpService;
// src/services/httpService.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env'; 
import { secureStorage } from '../../shared/utils/secureStorage';
import { notifyError, notifyWarning } from '../../shared/utils/snackbarUtils';


// Definición robusta de errores
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
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================================
// 📤 REQUEST INTERCEPTOR (Inyección de Token Segura)
// =================================================================
httpService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✅ 1. Usamos tu clase segura.
    // Al llamar a getToken(), tu clase valida automáticamente si expiró o si el UserAgent cambió.
    const token = secureStorage.getToken(); 
    
    // A. Inyección de Token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // B. 🟢 DETECCIÓN INTELIGENTE DE ARCHIVOS (FormData)
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =================================================================
// 📥 RESPONSE INTERCEPTOR (Manejo Global de Errores y Alertas)
// =================================================================
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    // ---------------------------------------------------------------
    // 1. Manejo de "Soft Errors"
    // ---------------------------------------------------------------
    const data = response.data;
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        const message = data.error || 'Error en la operación';
        notifyError(message);

        return Promise.reject({
          status: response.status,
          message: message,
          type: 'VALIDATION_ERROR',
          code: data.code,
          originalError: data
        } as ApiError);
      }
    }
    
    return response;
  },
  (error) => {
    // ---------------------------------------------------------------
    // 2. Manejo de Errores
    // ---------------------------------------------------------------

    // A) Sin conexión
    if (!error.response) {
      const msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      notifyError(msg); 
      return Promise.reject({
        status: 0,
        message: msg,
        type: 'UNKNOWN',
        originalError: error
      } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;

    // B) Rate Limit
    if (status === 429) {
      const msg = data.error || 'Has excedido el límite de intentos.';
      notifyError(msg); 
      return Promise.reject({
        status: 429,
        message: msg,
        type: 'RATE_LIMIT',
        originalError: error
      } as ApiError);
    }

    // C) 🔒 401: Sesión Expirada
    if (status === 401) {
      const isLoginEndpoint = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/2fa/verify');
      const msg = data.error || 'Credenciales inválidas o sesión expirada.';
      
      notifyError(msg);

      if (!isLoginEndpoint && !window.location.pathname.includes('/login')) {
        // ✅ CAMBIO IMPORTANTE:
        // Tu clase usa 'clearToken', NO 'removeToken'.
       secureStorage.clearToken(); 
    
    setTimeout(() => {
         window.location.href = '/login'; 
    }, 1000);
  }
      
      return Promise.reject({
        status: 401,
        message: msg,
        type: 'AUTH_ERROR',
        originalError: error
      } as ApiError);
    }

    // D) 403: Forbidden
    if (status === 403) {
      if (data.action_required) {
        notifyWarning(data.error || 'Acción de seguridad requerida');
        return Promise.reject({
          status: 403,
          message: data.error,
          type: 'SECURITY_ACTION',
          action_required: data.action_required,
          kyc_status: data.kyc_status,
          originalError: error
        } as ApiError);
      }
      
      const msg = data.error || 'No tienes permisos.';
      notifyError(msg);
      return Promise.reject({
        status: 403,
        message: msg,
        type: 'ROLE_RESTRICTION',
        originalError: error
      } as ApiError);
    }

    // E) Genéricos
    const errorMessage = data?.success === false 
      ? data.error 
      : (data?.error || data?.message || 'Ocurrió un error inesperado.');
    
    notifyError(errorMessage);

    return Promise.reject({
      status: status,
      message: errorMessage,
      type: 'VALIDATION_ERROR',
      code: data?.code,
      originalError: error
    } as ApiError);
  }
);

export default httpService;
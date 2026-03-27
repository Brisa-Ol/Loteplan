// src/core/api/httpService.ts

import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { notifyError } from '../../shared/utils/snackbarUtils';
import { secureStorage } from '../auth/storage/secureStorage';
import { env } from '../config/env';

// ════════════════════════════════════════════════════════════
// DEFINICIÓN DE INTERFACES
// ════════════════════════════════════════════════════════════
export interface ApiError {
  status: number;
  message: string;
  type: 'SECURITY_ACTION' | 'ROLE_RESTRICTION' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'UNKNOWN' | 'VALIDATION_ERROR';
  action_required?: 'enable_2fa' | 'complete_kyc';
  kyc_status?: string;
  code?: string;
  originalError?: unknown;
}

let isRedirectingToLogin = false;

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE INSTANCIA
// ════════════════════════════════════════════════════════════
const httpService = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// 📤 INTERCEPTOR DE PETICIONES (REQUEST)
httpService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = secureStorage.getToken();

    // Inyección de Token de Seguridad
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Manejo automático de FormData (para subida de archivos/firmas)
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 📥 INTERCEPTOR DE RESPUESTAS (RESPONSE)
httpService.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;

    // Manejo de "Soft Errors": 200 OK pero el backend indica falla
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      const message = data.error || 'Error en la operación';

      // Evitamos duplicar alertas en el login (el componente maneja su error)
      if (!response.config.url?.includes('/auth/login')) {
        notifyError(message);
      }

      return Promise.reject({
        status: response.status,
        message: message,
        type: 'VALIDATION_ERROR',
        originalError: data
      } as ApiError);
    }

    return response;
  },
  (error) => {
    // 1. Error de Conexión / Servidor Caído
    if (!error.response) {
      notifyError('No se pudo conectar con el servidor.');
      return Promise.reject({
        status: 0,
        message: 'Error de conexión',
        type: 'UNKNOWN',
        originalError: !env.isProduction ? error : undefined // 👈 Solo logueamos en dev
      } as ApiError);
    }

    const status = error.response.status;
    const data = error.response.data;
    const url = error.config?.url || '';

    // Helpers de contexto
    const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/2fa/verify');
    const msg = data.error || data.message || 'Error inesperado';

    // 2. ERROR 401: Sesión Expirada o no autorizada
    if (status === 401) {
      if (isLoginEndpoint) {
        return Promise.reject({ status: 401, message: msg, type: 'AUTH_ERROR' } as ApiError);
      }

      // Evitar bucles de redirección
      if (!window.location.pathname.includes('/login') && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        secureStorage.clearToken();



        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = '/login';
        }, 1000);
      }

      return Promise.reject({ status: 401, message: msg, type: 'AUTH_ERROR' } as ApiError);
    }

    // 3. ERROR 403: Prohibido (Roles, KYC, Cuenta No Activada)
    if (status === 403) {
      // Caso específico de activación de cuenta
      if (isLoginEndpoint && msg.toLowerCase().includes('cuenta no activada')) {
        return Promise.reject({ status: 403, message: msg, type: 'AUTH_ERROR' } as ApiError);
      }

      notifyError(msg);
      return Promise.reject({ status: 403, message: msg, type: 'ROLE_RESTRICTION' } as ApiError);
    }

    // 4. ERROR 429: Demasiadas peticiones (Rate Limit)
    if (status === 429) {
      notifyError('Demasiadas peticiones. Intente nuevamente en unos minutos.');
      return Promise.reject({ status: 429, message: 'Límite de peticiones excedido', type: 'RATE_LIMIT' } as ApiError);
    }

    // 5. Otros errores (400, 500, etc.)
    notifyError(msg);
    return Promise.reject({
      status: status,
      message: msg,
      type: 'VALIDATION_ERROR',
      originalError: !env.isProduction ? error : undefined
    } as ApiError);
  }
);

export default httpService;